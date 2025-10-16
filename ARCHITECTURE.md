# Food Supply Chain DApp – Architecture & Working

This document explains how the project is organized, how files connect, and how data flows from the UI to the blockchain and back. Use this alongside `README.md` and `EVALUATION.md`.

## High-Level Flow
1. User opens the frontend (`frontend/index.html`).
2. User clicks “Connect Wallet”. Frontend connects to MetaMask, switches/adds Localhost (Hardhat) if needed, then loads the contract ABI and address from `frontend/abi.json`.
3. User submits actions:
   - Create Product (Farmer)
   - Ship Product (Shipper)
   - Receive Product (Receiver)
4. Frontend sends transactions via Ethers.js to the deployed `SupplyChain` contract.
5. Contract updates on-chain state and emits events.
6. Frontend reads data with `getProduct(productId)` and renders the lifecycle.
7. Optional: Generate a QR linking back to the same page with the `productId` pre-filled.

## Repository Structure & Responsibilities
```
contracts/
  SupplyChain.sol          # Core smart contract
scripts/
  deploy-local.js          # Deploys to localhost; writes frontend/abi.json
  deploy-sepolia.js        # Deploys to Sepolia; writes frontend/abi.json
test/
  SupplyChain.t.js         # Unit tests covering flows & edge cases
frontend/
  index.html               # UI skeleton; script/style/CDN includes
  styles.css               # Tailwind utility polish and custom classes
  app.js                   # UI logic + wallet connect + Ethers.js calls
  abi.json                 # Written by deploy scripts: { address, abi }
hardhat.config.js          # Solidity compiler/optimizer + networks
package.json               # Scripts (test, node, deploy, serve)
README.md                  # Quickstart and usage
EVALUATION.md              # Rubric mapping with evidence
ARCHITECTURE.md            # This document
```

## Smart Contract (Solidity)
File: `contracts/SupplyChain.sol`
- `enum ProductState`: Created → Shipped → Received
- `struct Product`: metadata and timestamps
- `mapping(uint256 => Product) idToProduct`: O(1) lookups by productId
- Roles: `isFarmer`, `isShipper`, `isReceiver` set by `contractOwner`
- Functions:
  - `createProduct(id, name, origin)` – only Farmer, creates entry, emits `ProductCreated`
  - `shipProduct(id)` – only Shipper, transitions Created → Shipped, emits `ProductShipped`
  - `receiveProduct(id)` – only Receiver, transitions Shipped → Received, emits `ProductReceived`
  - `getProduct(id)` – view accessor (used by UI)

Security & correctness:
- All functions `require()` correct roles and states
- Non-zero `productId`, unique creation, non-empty fields
- Emits events for off-chain indexing

## Deployment Scripts → Frontend Contract Binding
Files: `scripts/deploy-local.js`, `scripts/deploy-sepolia.js`
- Deploys `SupplyChain` using Hardhat/Ethers.
- Reads artifact ABI and writes `frontend/abi.json`:
  ```json
  { "address": "<deployed-address>", "abi": [ ... ] }
  ```
- The frontend always loads the current address from this file, avoiding mismatched addresses when you redeploy.

## Frontend Architecture
Files: `frontend/index.html`, `frontend/styles.css`, `frontend/app.js`

### Minimum Gas Fee Policy (EIP-1559)
- In `frontend/app.js`, `feeOverrides()` enforces a floor for write transactions:
  - `maxFeePerGas ≥ 2 gwei`
  - `maxPriorityFeePerGas ≥ 1 gwei`
- These overrides are applied in `createProduct`, `shipProduct`, and `receiveProduct` so low suggested fees from a node do not cause underpriced or stuck txs during demos.
- Change the floor by editing `MIN_FEE_GWEI` and `MIN_PRIORITY_GWEI`.

### index.html
- Loads Tailwind, Three.js, QRCode, Lucide icons, and our `app.js`.
- Renders cards for lifecycle actions and the tracking panel.

### app.js – Core UI Logic
- Theme toggle, Ethers loader, provider detection
- Network switching to Localhost 8545
- Contract wiring from `frontend/abi.json`
- Write and read functions with fee overrides
- QR generation and provider events
- Account switching: listens to `accountsChanged` and updates the Connect button label; use MetaMask account switch or import keys from `HARDHAT_PREFUNDED_KEYS.md`

### Metadata Flow (IPFS/Web3.Storage)
- Contract field: `Product.metadataCid` with setter `setProductMetadataCid(productId, cid)`.
- Authorization: only farmer who created the product or `contractOwner` can set the CID.
- Frontend options:
  - Upload any file to Web3.Storage using API token → get CID → call setter.
  - Paste an existing CID → call setter directly.
- UI: `frontend/index.html` → Metadata card with upload and set buttons; logic in `frontend/app.js`.

### UI Layout Updates (2025-10)
- Main content uses a single-column stack for readability.
- Metadata card spans wider on large screens and aligns fields in a responsive grid.
- Long button labels wrap inside rounded buttons; cards clip overflow for clean layout.

### Dev Accounts & Scripts
- Prefunded local accounts: see `HARDHAT_PREFUNDED_KEYS.md` (20 deterministic keys derived from Hardhat mnemonic) and utility `scripts/derive-hardhat-accounts.js`.
- Role bootstrap: `npm run setup:roles` grants farmer/shipper/receiver to all local accounts after deploy.

### Serving & Ports
- Local UI runs on port 5180 via `npm run serve:frontend`.
- If a port conflict occurs, kill the process using `lsof -iTCP:5180 -sTCP:LISTEN -n -P | awk 'NR>1 {print $2}' | xargs -r kill -9` and re-run the server.

## Troubleshooting
- “Underpriced” or stuck tx → increase `MIN_FEE_GWEI` in `app.js` and reload.
- “ethers is not defined” → dynamic loader fetches UMD build; hard refresh.
- Wrong network → app auto-switches; approve the prompt in MetaMask.
