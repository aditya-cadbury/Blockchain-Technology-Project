const { ethers } = require('hardhat');

async function main() {
  // Get the deployed contract address from abi.json
  const { address } = require('../frontend/abi.json');
  console.log('Contract address:', address);
  
  // Get the contract instance
  const SupplyChain = await ethers.getContractFactory('SupplyChain');
  const contract = SupplyChain.attach(address);
  
  // Get the contract owner
  const [owner] = await ethers.getSigners();
  console.log('Contract owner:', await owner.getAddress());
  
  // Check if the owner has roles
  const ownerAddress = await owner.getAddress();
  const isOwnerFarmer = await contract.isFarmer(ownerAddress);
  const isOwnerShipper = await contract.isShipper(ownerAddress);
  const isOwnerReceiver = await contract.isReceiver(ownerAddress);
  
  console.log('\nContract Owner Roles:');
  console.log('- Farmer:', isOwnerFarmer);
  console.log('- Shipper:', isOwnerShipper);
  console.log('- Receiver:', isOwnerReceiver);
  
  // Check a few test accounts
  const accounts = await ethers.getSigners();
  console.log('\nChecking first 5 test accounts:');
  
  for (let i = 0; i < Math.min(5, accounts.length); i++) {
    const accountAddress = await accounts[i].getAddress();
    const isFarmer = await contract.isFarmer(accountAddress);
    const isShipper = await contract.isShipper(accountAddress);
    const isReceiver = await contract.isReceiver(accountAddress);
    
    console.log(`Account ${i} (${accountAddress.slice(0,6)}...${accountAddress.slice(-4)}):`);
    console.log(`  - Farmer: ${isFarmer}`);
    console.log(`  - Shipper: ${isShipper}`);
    console.log(`  - Receiver: ${isReceiver}`);
  }
  
  // Try to create a test product with the owner account
  console.log('\nTesting product creation with owner account...');
  try {
    const testProductId = 9999;
    const testName = "Test Mango";
    const testOrigin = "Test Farm";
    
    // Check if product already exists
    try {
      await contract.getProduct(testProductId);
      console.log('Product 9999 already exists, trying 9998...');
      const tx = await contract.createProduct(9998, testName, testOrigin);
      await tx.wait();
      console.log('✅ Successfully created test product 9998');
    } catch (error) {
      if (error.message.includes('Product does not exist')) {
        // Product doesn't exist, try to create it
        const tx = await contract.createProduct(testProductId, testName, testOrigin);
        await tx.wait();
        console.log('✅ Successfully created test product 9999');
      } else {
        throw error;
      }
    }
  } catch (error) {
    console.log('❌ Failed to create test product:', error.message);
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
