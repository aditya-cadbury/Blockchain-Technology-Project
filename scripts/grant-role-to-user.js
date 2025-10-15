const { ethers } = require('hardhat');

async function main() {
  // Your specific wallet address
  const USER_ADDRESS = "0x8C5ea9102A5Bc1C877D43aEF71Bc1C7Cec63C1D4";
  
  console.log('Granting roles to user account:', USER_ADDRESS);
  
  // Get the deployed contract address from abi.json
  const { address } = require('../frontend/abi.json');
  console.log('Contract address:', address);
  
  // Get the contract instance
  const SupplyChain = await ethers.getContractFactory('SupplyChain');
  const contract = SupplyChain.attach(address);
  
  // Get the contract owner (Account #0 from Hardhat)
  const [owner] = await ethers.getSigners();
  console.log('Contract owner:', await owner.getAddress());
  
  try {
    // Grant farmer role
    console.log('Granting farmer role...');
    await contract.setFarmer(USER_ADDRESS, true);
    
    // Grant shipper role
    console.log('Granting shipper role...');
    await contract.setShipper(USER_ADDRESS, true);
    
    // Grant receiver role
    console.log('Granting receiver role...');
    await contract.setReceiver(USER_ADDRESS, true);
    
    console.log('✅ Successfully granted all roles to:', USER_ADDRESS);
    
    // Verify the roles were assigned
    const isFarmer = await contract.isFarmer(USER_ADDRESS);
    const isShipper = await contract.isShipper(USER_ADDRESS);
    const isReceiver = await contract.isReceiver(USER_ADDRESS);
    
    console.log('\nVerification:');
    console.log('- Farmer role:', isFarmer);
    console.log('- Shipper role:', isShipper);
    console.log('- Receiver role:', isReceiver);
    
    console.log('\n🎉 Your account now has all roles!');
    console.log('You can now:');
    console.log('- Create products (farmer role)');
    console.log('- Ship products (shipper role)');
    console.log('- Receive products (receiver role)');
    
  } catch (error) {
    console.error('❌ Error granting roles:', error.message);
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
