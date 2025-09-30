const { writeFileSync, mkdirSync } = require('fs');
const { join } = require('path');

async function main() {
  const network = await ethers.provider.getNetwork();
  console.log('Deploying to network:', network.name || network.chainId);

  const SupplyChain = await ethers.getContractFactory('SupplyChain');
  const sc = await SupplyChain.deploy();
  await sc.waitForDeployment();
  const address = await sc.getAddress();
  console.log('SupplyChain deployed to:', address);

  const artifact = await hre.artifacts.readArtifact('SupplyChain');
  const dir = join(__dirname, '../frontend');
  try { mkdirSync(dir, { recursive: true }); } catch {}
  writeFileSync(join(dir, 'abi.json'), JSON.stringify({ address, abi: artifact.abi }, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
