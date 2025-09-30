# Food Supply Chain Tracking DApp

Decentralized tracking of produce (e.g., mangoes) across Harvest → Shipment → Receiving on Ethereum. Generates a QR for product IDs so consumers can verify provenance.

## Stack
- Solidity, Hardhat
- Ethers.js, MetaMask
- Tailwind CSS
- IPFS (optional for metadata)

## Structure
```
contracts/
  SupplyChain.sol
scripts/
  deploy-local.js
  deploy-sepolia.js
test/
  SupplyChain.t.js
frontend/
  index.html
  app.js
  styles.css
  abi.json
hardhat.config.js
package.json
```

## Minimum Gas Fee Policy (EIP-1559)
- Frontend enforces a floor for EIP-1559 fees on write transactions.
- Defaults: `maxFeePerGas ≥ 2 gwei`, `maxPriorityFeePerGas ≥ 1 gwei`.
- Implementation: `frontend/app.js` (`feeOverrides()`), applied in `createProduct`, `shipProduct`, `receiveProduct`.
- To change:
  ```js
  // frontend/app.js
  const MIN_FEE_GWEI = 2n;
  const MIN_PRIORITY_GWEI = 1n;
  ```

## Quickstart
1. Install dependencies
```bash
npm install
```
2. Test
```bash
npx hardhat test
```
3. Deploy locally
```bash
npx hardhat node   # in one terminal (leave running)
npm run deploy:local  # in another terminal
```
4. Serve frontend on port 5180 (avoids conflicts)
```bash
npm run serve:frontend
```
5. Open http://127.0.0.1:5180 and connect MetaMask to Localhost 8545.

## Security
- Strict state transitions, role checks, and events.
- Never use production keys; fund test wallets only.

## License
MIT
