# Food Supply Chain DApp – Demo Guide

This guide maps each project phase to concrete steps and evidence in this repository. Use this to demonstrate your work systematically.

## Phase 1: Finalize DApp Idea and Tools Stack ✅

### What to Show
- **Concept**: Food supply chain tracking with QR codes for consumer transparency
- **Stack**: Ethereum, Solidity, Hardhat, Ethers.js, Tailwind, MetaMask, IPFS (optional)

### Evidence Files
- `README.md` – Project overview and stack
- `package.json` – Dependencies and scripts
- `hardhat.config.js` – Solidity compiler and network configs

### Demo Steps
1. Open `README.md` and explain the concept
2. Show `package.json` dependencies:
   ```bash
   cat package.json | grep -A 10 "devDependencies"
   ```
3. Explain why this stack: Hardhat for testing, Ethers.js for modern Web3, Tailwind for rapid UI

---

## Phase 2: UI Mockups and Smart Contract Architecture ✅

### What to Show
- **UI Design**: Modern glassmorphism cards with 3D background
- **Contract Design**: Role-based state machine with events

### Evidence Files
- `frontend/index.html` – UI structure and layout
- `frontend/styles.css` – Glassmorphism and responsive design
- `contracts/SupplyChain.sol` – Contract architecture and state machine

### Demo Steps
1. **UI Architecture**:
   ```bash
   grep -A 5 "Create Product" frontend/index.html
   grep -A 5 "Ship Product" frontend/index.html
   grep -A 5 "Track Product" frontend/index.html
   ```

2. **Contract Architecture**:
   ```bash
   grep -A 10 "enum ProductState" contracts/SupplyChain.sol
   grep -A 5 "struct Product" contracts/SupplyChain.sol
   ```

3. **Visual Design**:
   - Open `http://127.0.0.1:5180` and show the 3D background, glassmorphism cards, and responsive layout

---

## Phase 3: Write & Test Core Smart Contracts ✅

### What to Show
- **Contract Implementation**: Secure state transitions with role checks
- **Test Coverage**: All functions and edge cases tested

### Evidence Files
- `contracts/SupplyChain.sol` – Complete contract implementation
- `test/SupplyChain.t.js` – Comprehensive test suite

### Demo Steps
1. **Show Contract Security**:
   ```bash
   grep -A 3 "modifier onlyFarmer" contracts/SupplyChain.sol
   grep -A 3 "modifier onlyShipper" contracts/SupplyChain.sol
   grep -A 3 "modifier onlyReceiver" contracts/SupplyChain.sol
   ```

2. **Show State Machine**:
   ```bash
   grep -A 5 "ProductState.Created" contracts/SupplyChain.sol
   grep -A 5 "ProductState.Shipped" contracts/SupplyChain.sol
   grep -A 5 "ProductState.Received" contracts/SupplyChain.sol
   ```

3. **Run Tests**:
   ```bash
   npx hardhat test
   ```
   - Show all 7 tests passing

---

## Phase 4: Frontend Integration with Ethers.js ✅

### What to Show
- **Wallet Connection**: MetaMask integration with network switching
- **Contract Interaction**: Transaction sending and data reading
- **Fee Floors**: Minimum EIP-1559 gas policy to prevent underpriced txs

### Evidence Files
- `frontend/app.js` – Ethers.js integration and `feeOverrides()`
- `frontend/abi.json` – Auto-generated contract binding

### Demo Steps
1. **Wallet Connection**:
   ```bash
   grep -A 10 "async function connect" frontend/app.js
   ```
2. **Minimum Gas Policy**:
   ```bash
   grep -n "MIN_FEE_GWEI" -n frontend/app.js
   grep -n "feeOverrides" -n frontend/app.js
   ```
3. **Live Demo**:
   - Open `http://127.0.0.1:5180`
   - Connect MetaMask (show automatic network switch)
   - Create → Ship → Receive → Track

---

## Phase 5: IPFS/Filecoin/Oracle Integration 🔄

### What to Show
- **IPFS Ready**: Architecture prepared for metadata storage
- **Oracle Pattern**: Events can trigger external data fetching

### Evidence Files
- `README.md` – IPFS mentioned as optional
- `contracts/SupplyChain.sol` – Events emitted for off-chain processing

### Demo Steps
1. Show IPFS mention:
   ```bash
   grep -i ipfs README.md
   ```
2. Show events:
   ```bash
   grep -A 2 "event ProductCreated" contracts/SupplyChain.sol
   grep -A 2 "event ProductShipped" contracts/SupplyChain.sol
   grep -A 2 "event ProductReceived" contracts/SupplyChain.sol
   ```

---

## Phase 6: ZK or NFT Logic (Not Applicable) ❌
- Decision: Transparency prioritized; ZK optional. NFT mint at `ProductReceived` is a possible extension.

---

## Phase 7: Testing (Unit + E2E) + Demo Prep ✅

### Evidence Files
- `test/SupplyChain.t.js`, scripts, and `package.json`

### Demo Steps
```bash
npx hardhat test
npx hardhat node
npm run deploy:local
npm run serve:frontend
```

---

## Phase 8: Documentation + Deployment ✅

### Evidence Files
- `README.md`, `ARCHITECTURE.md`, `EVALUATION.md`, `scripts/deploy-sepolia.js`

### Demo Steps
```bash
cat scripts/deploy-local.js
cat scripts/deploy-sepolia.js
```

---

## Complete Demo Script (15 minutes)
- Setup, Architecture, Security & Tests, Live Demo, Docs & Deployment

### Key Talking Points
- Fee floors: `maxFeePerGas ≥ 2 gwei`, `maxPriorityFeePerGas ≥ 1 gwei` (in `frontend/app.js`)
- Why: Stable demos across varying RPC suggestions.
