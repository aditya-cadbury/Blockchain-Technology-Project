# Food Supply Chain Tracking DApp

Decentralized tracking of produce (e.g., mangoes) across Harvest → Shipment → Receiving on Ethereum. Generates a QR for product IDs so consumers can verify provenance.

## Stack
- Solidity, Hardhat
- Ethers.js, MetaMask
- Tailwind CSS
- IPFS/Web3.Storage (metadata CIDs)

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

## IPFS/Web3.Storage Metadata
- Contract now stores an optional `metadataCid` per product.
- Frontend lets you upload a file with a Web3.Storage token or paste an existing CID, then sets it on-chain.
- Relevant UI: Metadata card in `frontend/index.html`.
- Contract API: `setProductMetadataCid(productId, cid)` and `getProduct(productId)` now returns `metadataCid` as the 4th tuple element.

Upload steps (Option A):
1. Get a Web3.Storage API token (`https://web3.storage`).
2. In the UI, paste token, choose file, click “Upload to Web3.Storage”.
3. CID is filled into the field; click “Set Metadata CID” to save on-chain.

Paste steps (Option B):
1. Paste a known CID into the field.
2. Click “Set Metadata CID”.

Notes:
- Only the original farmer or the contract owner can set the metadata CID.
- Example gateway URL: `https://ipfs.io/ipfs/<CID>`.

## UI Mockups
- See the new metadata card and tracking panel in `frontend/index.html`.
- Suggested: add screenshots in `docs/` and link below (placeholders shown):

Wireframes / Screenshots:
- Create/Ship/Receive cards: `docs/ui-flow-1.png`
- Tracking panel with QR: `docs/ui-flow-2.png`
- Metadata upload & CID set: `docs/ui-flow-3.png`

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

### E2E Tests (Playwright)
1. Install Playwright deps
```bash
npm i -D @playwright/test
npx playwright install
```
2. Run local node and serve UI (two terminals)
```bash
npx hardhat node
npm run serve:frontend
```
3. Execute tests
```bash
npm run test:e2e
```

## Security
- Strict state transitions, role checks, and events.
- Never use production keys; fund test wallets only.

## Optional Extensions (Oracle, NFT, ZK)
- Oracle (e.g., Chainlink): Integrate external data (weather, shipment updates) and store relevant proofs/events.
- NFT (ERC-721): Mint a token per product ID with `tokenURI` pointing to the IPFS `metadataCid`.
- ZK: Add a proof-of-role or proof-of-origin flow to authorize actions without disclosing address-role mapping.

## License
MIT
