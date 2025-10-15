const { ethers } = require('hardhat');

async function main() {
  // Get the deployed contract address from abi.json
  const { address } = require('../frontend/abi.json');
  console.log('Contract address:', address);
  
  // Get the contract instance
  const SupplyChain = await ethers.getContractFactory('SupplyChain');
  const contract = SupplyChain.attach(address);
  
  // Get the contract owner (Account #0 from Hardhat)
  const [owner] = await ethers.getSigners();
  console.log('Contract owner:', await owner.getAddress());
  
  // Get all test accounts
  const accounts = await ethers.getSigners();
  console.log('\nAvailable accounts:');
  for (let i = 0; i < accounts.length; i++) {
    const addr = await accounts[i].getAddress();
    console.log(`Account ${i}: ${addr}`);
  }
  
  console.log('\nSetting up roles for all accounts...');
  
  // Assign all roles (farmer, shipper, receiver) to all test accounts
  // This makes it easy to test the DApp with any account
  for (let i = 0; i < accounts.length; i++) {
    const accountAddress = await accounts[i].getAddress();
    
    try {
      // Set farmer role
      console.log(`Setting farmer role for Account ${i}...`);
      await contract.setFarmer(accountAddress, true);
      
      // Set shipper role
      console.log(`Setting shipper role for Account ${i}...`);
      await contract.setShipper(accountAddress, true);
      
      // Set receiver role
      console.log(`Setting receiver role for Account ${i}...`);
      await contract.setReceiver(accountAddress, true);
      
      console.log(`✅ Account ${i} (${accountAddress.slice(0,6)}...${accountAddress.slice(-4)}) now has all roles`);
    } catch (error) {
      console.log(`❌ Failed to set roles for Account ${i}:`, error.message);
    }
  }
  
  console.log('\n🎉 Role setup complete!');
  console.log('Now any connected wallet should be able to:');
  console.log('- Create products (farmer role)');
  console.log('- Ship products (shipper role)');
  console.log('- Receive products (receiver role)');
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
