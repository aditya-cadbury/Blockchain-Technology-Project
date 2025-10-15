const { expect } = require('chai');
const { ethers } = require('hardhat');

describe('SupplyChain', function () {
  async function deploy() {
    const [owner, farmer, shipper, receiver, stranger] = await ethers.getSigners();
    const SupplyChain = await ethers.getContractFactory('SupplyChain');
    const sc = await SupplyChain.deploy();
    await sc.waitForDeployment();

    // grant roles
    await sc.connect(owner).setFarmer(farmer.address, true);
    await sc.connect(owner).setShipper(shipper.address, true);
    await sc.connect(owner).setReceiver(receiver.address, true);

    return { sc, owner, farmer, shipper, receiver, stranger };
  }

  it('creates product by farmer and reads it back', async function () {
    const { sc, farmer } = await deploy();
    await expect(sc.connect(farmer).createProduct(1, 'Mango', 'Alphonso Farm'))
      .to.emit(sc, 'ProductCreated').withArgs(1, 'Mango', 'Alphonso Farm', farmer.address);

    const p = await sc.getProduct(1);
    expect(p[0]).to.equal(1n);
    expect(p[1]).to.equal('Mango');
    expect(p[2]).to.equal('Alphonso Farm');
    // p[3] metadataCid should be empty by default
    expect(p[3]).to.equal('');
  });

  it('rejects non-farmer creating product', async function () {
    const { sc, stranger } = await deploy();
    await expect(sc.connect(stranger).createProduct(2, 'Mango', 'Farm'))
      .to.be.revertedWith('Not authorized: farmer');
  });

  it('enforces unique product ids and non-empty fields', async function () {
    const { sc, farmer } = await deploy();
    await expect(sc.connect(farmer).createProduct(0, 'Mango', 'Farm')).to.be.revertedWith('Invalid productId');
    await expect(sc.connect(farmer).createProduct(3, '', 'Farm')).to.be.revertedWith('Empty name');
    await expect(sc.connect(farmer).createProduct(3, 'Mango', '')).to.be.revertedWith('Empty origin');

    await sc.connect(farmer).createProduct(4, 'Mango', 'Farm');
    await expect(sc.connect(farmer).createProduct(4, 'Mango', 'Farm')).to.be.revertedWith('Product already exists');
  });

  it('ships only from Created state by shipper', async function () {
    const { sc, farmer, shipper } = await deploy();
    await sc.connect(farmer).createProduct(5, 'Mango', 'Farm');

    await expect(sc.connect(shipper).shipProduct(5))
      .to.emit(sc, 'ProductShipped').withArgs(5, shipper.address);

    const p = await sc.getProduct(5);
    expect(p[8]).to.equal(1); // ProductState.Shipped

    await expect(sc.connect(shipper).shipProduct(5)).to.be.revertedWith('Not in Created state');
  });

  it('rejects non-shipper from shipping', async function () {
    const { sc, farmer } = await deploy();
    await sc.connect(farmer).createProduct(6, 'Mango', 'Farm');
    await expect(sc.connect(farmer).shipProduct(6)).to.be.revertedWith('Not authorized: shipper');
  });

  it('receives only from Shipped state by receiver', async function () {
    const { sc, farmer, shipper, receiver } = await deploy();
    await sc.connect(farmer).createProduct(7, 'Mango', 'Farm');
    await sc.connect(shipper).shipProduct(7);

    await expect(sc.connect(receiver).receiveProduct(7))
      .to.emit(sc, 'ProductReceived').withArgs(7, receiver.address);

    const p = await sc.getProduct(7);
    expect(p[8]).to.equal(2); // ProductState.Received

    await expect(sc.connect(receiver).receiveProduct(7)).to.be.revertedWith('Not in Shipped state');
  });

  it('reverts view for non-existent product', async function () {
    const { sc } = await deploy();
    await expect(sc.getProduct(999)).to.be.revertedWith('Product does not exist');
  });

  it('allows farmer or owner to set metadata CID and reads it', async function () {
    const { sc, owner, farmer, stranger } = await deploy();
    await sc.connect(farmer).createProduct(10, 'Mango', 'Farm');

    // unauthorized stranger
    await expect(sc.connect(stranger).setProductMetadataCid(10, 'bafy123'))
      .to.be.revertedWith('Not authorized: metadata');

    // farmer sets CID
    await expect(sc.connect(farmer).setProductMetadataCid(10, 'bafybeigdyr'))
      .to.emit(sc, 'ProductMetadataUpdated').withArgs(10, 'bafybeigdyr', farmer.address);

    let p = await sc.getProduct(10);
    expect(p[3]).to.equal('bafybeigdyr');

    // owner can also set CID
    await expect(sc.connect(owner).setProductMetadataCid(10, 'bafyowner'))
      .to.emit(sc, 'ProductMetadataUpdated').withArgs(10, 'bafyowner', owner.address);

    p = await sc.getProduct(10);
    expect(p[3]).to.equal('bafyowner');
  });
});
