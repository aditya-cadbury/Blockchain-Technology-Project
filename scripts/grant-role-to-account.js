const { ethers } = require('hardhat');

async function main() {
  // Replace this with your actual wallet address
  const TARGET_ADDRESS = "0x8C5e...C1D4"; // Replace with your full address
  
  console.log('To grant roles to your specific account, please:');
  console.log('1. Copy your full wallet address from MetaMask');
  console.log('2. Replace TARGET_ADDRESS in this script with your address');
  console.log('3. Run: npx hardhat run scripts/grant-role-to-account.js --network localhost');
  console.log('');
  console.log('Or simply import one of these test accounts into MetaMask:');
  console.log('Account 1: 0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d');
  console.log('Account 2: 0x5de4111daa5ba4e5b4c9f4d4f0b5f5f5f5f5f5f5f5f5f5f5f5f5f5f5f5f5f5f');
  console.log('Account 0 (Owner): 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80');
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

