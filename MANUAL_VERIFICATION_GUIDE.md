# Manual Verification Guide - Food Supply Chain DApp

This guide shows you exactly how to manually verify if the following components are implemented:

1. **IPFS/Web3.Storage/Oracle Integration**
2. **ZK or NFT Logic** 
3. **Testing (Unit + E2E) + Demo Prep**
4. **Documentation + Deployment**

---

## 1. IPFS/Filecoin/Oracle Integration Verification

### Step 1: Check IPFS Implementation in Smart Contract

```bash
# Navigate to your project directory
cd /Users/adityakurup/Documents/SEM7/Blockchain/Project/Blockchain-Technology-Project-main

# Check if metadataCid field exists in Product struct
grep -A 15 "struct Product" contracts/SupplyChain.sol
```

**Expected Output:**
```solidity
struct Product {
    uint256 id;
    string name;
    string originFarm;
    string metadataCid; // IPFS/Web3.Storage CID for off-chain metadata
    address farmer;
    address shipper;
    address receiver;
    address currentOwner;
    ProductState state;
    uint256 createdAt;
    uint256 shippedAt;
    uint256 receivedAt;
    bool exists;
}
```

### Step 2: Check IPFS Function in Smart Contract

```bash
# Look for setProductMetadataCid function
grep -A 10 "setProductMetadataCid" contracts/SupplyChain.sol
```

**Expected Output:**
```solidity
function setProductMetadataCid(uint256 productId, string calldata cid) external {
    Product storage p = idToProduct[productId];
    require(p.exists, 'Product does not exist');
    require(msg.sender == p.farmer || msg.sender == contractOwner, 'Not authorized: metadata');
    require(bytes(cid).length > 0, 'Empty CID');
    p.metadataCid = cid;
    emit ProductMetadataUpdated(productId, cid, msg.sender);
}
```

### Step 3: Check IPFS Event in Smart Contract

```bash
# Look for ProductMetadataUpdated event
grep -A 2 "event ProductMetadataUpdated" contracts/SupplyChain.sol
```

**Expected Output:**
```solidity
event ProductMetadataUpdated(uint256 indexed productId, string metadataCid, address indexed updater);
```

### Step 4: Check Frontend IPFS Implementation

```bash
# Look for Web3.Storage upload function
grep -A 15 "uploadToWeb3Storage" frontend/app.js
```

**Expected Output:**
```javascript
async function uploadToWeb3Storage() {
  try {
    const token = document.getElementById('w3sToken').value.trim();
    const fileInput = document.getElementById('mdFile');
    if (!token) return alert('Enter Web3.Storage token');
    if (!fileInput || !fileInput.files || fileInput.files.length === 0) return alert('Select a file');
    const file = fileInput.files[0];
    const form = new FormData();
    form.append('file', file);
    const res = await fetch('https://api.web3.storage/upload', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: file
    });
    if (!res.ok) throw new Error('Upload failed');
    const data = await res.json();
    const cid = data?.cid || data?.cid || data?.value?.cid;
    if (!cid) throw new Error('CID not returned');
    document.getElementById('mdCid').value = cid;
    toast('Uploaded. CID set in input.');
  } catch (e) { alert(parseError(e)); }
}
```

### Step 5: Check Frontend Metadata CID Setter

```bash
# Look for setMetadataCid function
grep -A 15 "setMetadataCid" frontend/app.js
```

**Expected Output:**
```javascript
async function setMetadataCid() {
  try {
    if (!contract) return alert('Connect wallet first');
    const idRaw = document.getElementById('mdId').value;
    const cid = document.getElementById('mdCid').value.trim();
    if (!idRaw) return alert('Enter product ID');
    if (!cid) return alert('Enter metadata CID');
    const id = BigInt(idRaw);
    const overrides = await feeOverrides();
    const tx = await contract.setProductMetadataCid(id, cid, overrides);
    await tx.wait();
    toast('Metadata CID set');
  } catch (e) { alert(parseError(e)); }
}
```

### Step 6: Check Frontend UI for IPFS Elements (updated layout)

```bash
# Look for metadata card in HTML
grep -A 10 "metadata" frontend/index.html
```

**Expected Output:**
```html
<!-- Metadata Card -->
<div class="glass card p-6">
  <h3 class="text-xl font-semibold mb-4 flex items-center gap-2">
    <i data-lucide="upload" class="w-5 h-5"></i>
    Metadata Management
  </h3>
  <div class="space-y-4">
    <div>
      <label class="block text-sm font-medium mb-2">Web3.Storage Token</label>
      <input type="text" id="w3sToken" placeholder="Paste your Web3.Storage API token" class="w-full px-3 py-2 border rounded-lg bg-white/10 border-white/20 focus:outline-none focus:ring-2 focus:ring-purple-500">
    </div>
    <div>
      <label class="block text-sm font-medium mb-2">Select File</label>
      <input type="file" id="mdFile" class="w-full px-3 py-2 border rounded-lg bg-white/10 border-white/20 focus:outline-none focus:ring-2 focus:ring-purple-500">
    </div>
    <button id="uploadBtn" class="w-full bg-purple-600 hover:bg-purple-700 text-white py-2 px-4 rounded-lg transition-colors">
      Upload to Web3.Storage
    </button>
    <div>
      <label class="block text-sm font-medium mb-2">Product ID</label>
      <input type="number" id="mdId" placeholder="Enter product ID" class="w-full px-3 py-2 border rounded-lg bg-white/10 border-white/20 focus:outline-none focus:ring-2 focus:ring-purple-500">
    </div>
    <div>
      <label class="block text-sm font-medium mb-2">Metadata CID</label>
      <input type="text" id="mdCid" placeholder="IPFS CID or paste from upload" class="w-full px-3 py-2 border rounded-lg bg-white/10 border-white/20 focus:outline-none focus:ring-2 focus:ring-purple-500">
    </div>
    <button id="setCidBtn" class="w-full bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded-lg transition-colors">
      Set Metadata CID
    </button>
  </div>
</div>
```

### Step 7: Test IPFS Functionality Live

```bash
# Start the application
npm run node          # Terminal 1
npm run deploy:local  # Terminal 2
npm run serve:frontend # Terminal 3
```

**Manual Test Steps:**
1. Open http://127.0.0.1:5180
2. Connect MetaMask wallet
3. Create a product first
4. Get a Web3.Storage token from https://web3.storage
5. Paste token in the metadata card
6. Select a file and click "Upload to Web3.Storage"
7. Verify CID is populated in the field
8. Enter the product ID and click "Set Metadata CID"
9. Track the product to verify metadata is stored

**Expected Results:**
- File uploads successfully to Web3.Storage
- CID is returned and displayed
- Transaction succeeds when setting metadata CID
- Product tracking shows the metadata CID

---

## 5. Dev Accounts & Roles Verification

### Step 1: View Prefunded Keys
```bash
cat HARDHAT_PREFUNDED_KEYS.md | head -10
```

### Step 2: Grant Roles (if needed)
```bash
npm run setup:roles
```

### Step 3: Switch Accounts in MetaMask
- Import any private key from `HARDHAT_PREFUNDED_KEYS.md` and switch accounts; the UI updates the Connect button label.

---

## 2. Testing (Unit + E2E) + Demo Prep Verification

### Step 1: Check Unit Tests

```bash
# Run unit tests
npx hardhat test
```

**Expected Output:**
```
  SupplyChain
    ✓ Should create a product (123ms)
    ✓ Should not create a product with duplicate ID (45ms)
    ✓ Should not create a product with empty name (34ms)
    ✓ Should ship a product (89ms)
    ✓ Should receive a product (67ms)
    ✓ Should not allow unauthorized access (23ms)
    ✓ Should handle metadata CID functionality (78ms)

  7 passing (456ms)
```

### Step 2: Check E2E Test Configuration

```bash
# Check if Playwright config exists
ls -la playwright.config.ts
cat playwright.config.ts
```

**Expected Output:**
```typescript
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests-e2e',
  timeout: 30 * 1000,
  expect: { timeout: 5000 },
  use: {
    baseURL: 'http://127.0.0.1:5180',
    trace: 'on-first-retry'
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
  ]
});
```

### Step 3: Check E2E Test Files

```bash
# Check E2E test directory and files
ls -la tests-e2e/
cat tests-e2e/basic.spec.ts
```

**Expected Output:**
```typescript
import { test, expect } from '@playwright/test';

test('loads homepage and shows key UI elements', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByText('Food Supply Chain DApp')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Connect Wallet' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Create' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Ship' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Receive' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Track' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Generate QR' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Set Metadata CID' })).toBeVisible();
});
```

### Step 4: Check Package.json Test Scripts

```bash
# Check for E2E test scripts
grep -A 5 "test:e2e" package.json
```

**Expected Output:**
```json
"test:e2e": "playwright test",
"test:e2e:headed": "playwright test --headed",
"test:e2e:ui": "playwright test --ui"
```

### Step 5: Install and Run E2E Tests

```bash
# Install Playwright if not already installed
npm install -D @playwright/test
npx playwright install

# Run E2E tests (requires frontend server)
npm run node          # Terminal 1
npm run deploy:local  # Terminal 2
npm run serve:frontend # Terminal 3
npm run test:e2e      # Terminal 4
```

**Expected Output:**
```
Running 1 test using 1 worker

  ✓ tests-e2e/basic.spec.ts:3:3 › loads homepage and shows key UI elements (2.5s)

1 passed (3.0s)
```

### Step 6: Check Demo Preparation Scripts

```bash
# Check deployment scripts
ls -la scripts/
cat scripts/deploy-local.js | head -20
```

**Expected Output:**
```javascript
const hre = require("hardhat");

async function main() {
  const SupplyChain = await hre.ethers.getContractFactory("SupplyChain");
  const supplyChain = await SupplyChain.deploy();

  await supplyChain.waitForDeployment();

  const address = await supplyChain.getAddress();
  console.log("SupplyChain deployed to:", address);

  // Write ABI and address to frontend
  const fs = require('fs');
  const contractArtifact = require('../artifacts/contracts/SupplyChain.sol/SupplyChain.json');
  
  const abiData = {
    address: address,
    abi: contractArtifact.abi
  };

  fs.writeFileSync('./frontend/abi.json', JSON.stringify(abiData, null, 2));
  console.log("ABI written to frontend/abi.json");
}
```

---

## 3. E2E Testing Verification

### Step 1: Check E2E Test Configuration

```bash
# Check Playwright configuration exists
cat playwright.config.ts
```

**Expected Output:**
```typescript
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests-e2e',
  timeout: 30 * 1000,
  expect: { timeout: 5000 },
  use: {
    baseURL: 'http://127.0.0.1:5180',
    trace: 'on-first-retry'
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
  ]
});
```

### Step 2: Check E2E Test Files

```bash
# Check E2E test file exists
ls -la tests-e2e/basic.spec.ts
```

**Expected Output:**
```
-rw-r--r-- 1 user user XXX date tests-e2e/basic.spec.ts
```

### Step 3: Check E2E Test Content

```bash
# View E2E test content
cat tests-e2e/basic.spec.ts
```

**Expected Output:**
```typescript
import { test, expect } from '@playwright/test';

test('loads homepage and shows key UI elements', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByText('Food Supply Chain DApp')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Connect Wallet' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Create' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Ship' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Receive' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Track' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Generate QR' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Set Metadata CID' })).toBeVisible();
});
```

### Step 4: Check Package.json E2E Scripts

```bash
# Check E2E scripts in package.json
grep -A 5 "test:e2e" package.json
```

**Expected Output:**
```json
"test:e2e": "playwright test",
"test:e2e:headed": "playwright test --headed",
"test:e2e:ui": "playwright test --ui"
```

### Step 5: Install Playwright Dependencies

```bash
# Install Playwright if not already installed
npm install -D @playwright/test
npx playwright install
```

### Step 6: Run E2E Tests (Full Setup Required)

```bash
# Terminal 1: Start local blockchain
npx hardhat node

# Terminal 2: Deploy contracts
npm run deploy:local

# Terminal 3: Serve frontend
npm run serve:frontend

# Terminal 4: Run E2E tests
npm run test:e2e
```

**Expected Output:**
```
Running 1 test using 1 worker

  ✓ tests-e2e/basic.spec.ts:3:3 › loads homepage and shows key UI elements (2.5s)

1 passed (3.0s)
```

### Step 7: Run E2E Tests in Different Modes

```bash
# Run with browser visible
npm run test:e2e:headed

# Run with Playwright UI
npm run test:e2e:ui
```

---

## 4. Documentation + Deployment Verification

### Step 1: Check Documentation Files

```bash
# List all markdown documentation files
ls -la *.md
```

**Expected Output:**
```
-rw-r--r-- 1 user user 3270 Oct 16 14:46 README.md
-rw-r--r-- 1 user user 4716 Oct 16 14:46 ARCHITECTURE.md
-rw-r--r-- 1 user user 5073 Oct 16 14:46 DEMO_GUIDE.md
-rw-r--r-- 1 user user 5670 Oct 16 14:46 EVALUATION.md
-rw-r--r-- 1 user user 15000+ Oct 16 14:46 IMPLEMENTATION_DOCUMENTATION.md
-rw-r--r-- 1 user user 15000+ Oct 16 14:46 MANUAL_VERIFICATION_GUIDE.md
```

### Step 2: Check README.md Content

```bash
# Check README has IPFS and E2E sections
grep -A 5 "IPFS/Web3.Storage" README.md
grep -A 5 "E2E Tests" README.md
```

**Expected Output:**
```
## IPFS/Web3.Storage Metadata
- Contract now stores an optional `metadataCid` per product.
- Frontend lets you upload a file with a Web3.Storage token or paste an existing CID, then sets it on-chain.
- Relevant UI: Metadata card in `frontend/index.html`.
- Contract API: `setProductMetadataCid(productId, cid)` and `getProduct(productId)` now returns `metadataCid` as the 4th tuple element.

### E2E Tests (Playwright)
1. Install Playwright deps
npm i -D @playwright/test
npx playwright install
```

### Step 3: Check Deployment Scripts

```bash
# Check deployment scripts exist
ls -la scripts/deploy-*.js
```

**Expected Output:**
```
-rw-r--r-- 1 user user 1234 Oct 16 14:46 scripts/deploy-local.js
-rw-r--r-- 1 user user 1456 Oct 16 14:46 scripts/deploy-sepolia.js
```

### Step 4: Test Local Deployment

```bash
# Test local deployment
npm run deploy:local
```

**Expected Output:**
```
SupplyChain deployed to: 0x5FbDB2315678afecb367f032d93F642f64180aa3
ABI written to frontend/abi.json
```

### Step 5: Check Hardhat Configuration

```bash
# Check Hardhat config for networks
cat hardhat.config.js
```

**Expected Output:**
```javascript
require("@nomicfoundation/hardhat-toolbox");

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: {
    version: "0.8.24",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200
      }
    }
  },
  networks: {
    localhost: {
      url: "http://127.0.0.1:8545"
    },
    sepolia: {
      url: process.env.SEPOLIA_URL || "",
      accounts: process.env.PRIVATE_KEY !== undefined ? [process.env.PRIVATE_KEY] : [],
    }
  }
};
```

### Step 6: Check Package.json Scripts

```bash
# Check all available scripts
grep -A 10 "scripts" package.json
```

**Expected Output:**
```json
"scripts": {
  "build": "",
  "test": "hardhat test",
  "node": "hardhat node",
  "deploy:local": "hardhat run scripts/deploy-local.js --network localhost",
  "deploy:sepolia": "hardhat run scripts/deploy-sepolia.js --network sepolia",
  "setup:roles": "hardhat run scripts/setup-roles.js --network localhost",
  "serve:frontend": "sh -c 'cd frontend && python3 -m http.server 5180'",
  "test:e2e": "playwright test",
  "test:e2e:headed": "playwright test --headed",
  "test:e2e:ui": "playwright test --ui"
}
```

---

## Verification Checklist

Use this checklist to verify all components are properly implemented:

### ✅ IPFS Integration
- [ ] Smart contract has `metadataCid` field in Product struct
- [ ] Smart contract has `setProductMetadataCid` function
- [ ] Smart contract emits `ProductMetadataUpdated` event
- [ ] Frontend has `uploadToWeb3Storage` function
- [ ] Frontend has `setMetadataCid` function
- [ ] Frontend UI has metadata card with upload and set buttons
- [ ] Live test: File upload and CID setting works

### ✅ Testing
- [ ] Unit tests pass (7 tests)
- [ ] Playwright configuration exists
- [ ] E2E test file exists and runs
- [ ] Package.json has E2E test scripts
- [ ] Playwright dependencies installed
- [ ] E2E tests pass with frontend server running

### ✅ Documentation
- [ ] README.md updated with IPFS and E2E sections
- [ ] ARCHITECTURE.md has metadata flow documentation
- [ ] DEMO_GUIDE.md has IPFS and E2E demo steps
- [ ] EVALUATION.md has latest implementation evidence
- [ ] IMPLEMENTATION_DOCUMENTATION.md exists and comprehensive
- [ ] MANUAL_VERIFICATION_GUIDE.md exists (this file)

### ✅ Deployment
- [ ] Local deployment script works
- [ ] Sepolia deployment script exists
- [ ] Hardhat configuration has both networks
- [ ] Package.json has all required scripts
- [ ] ABI auto-generation functional
- [ ] Local deployment working
- [ ] Testnet deployment configured
- [ ] ABI auto-generation functional
- [ ] Professional documentation quality

---

## Quick Manual Test Commands

```bash
# Quick verification script
echo "=== IPFS Verification ==="
grep -c "metadataCid\|setProductMetadataCid" contracts/SupplyChain.sol
grep -c "uploadToWeb3Storage\|setMetadataCid" frontend/app.js

echo "=== Testing Verification ==="
npx hardhat test --reporter spec

echo "=== E2E Testing Verification ==="
# Check if Playwright is installed
npm list @playwright/test 2>/dev/null || echo "Playwright not installed - run: npm install -D @playwright/test && npx playwright install"

# Check E2E test files exist
ls -la tests-e2e/basic.spec.ts
ls -la playwright.config.ts

# Check package.json has E2E scripts
grep -A 5 "test:e2e" package.json

echo "=== Documentation Verification ==="
ls -1 *.md | wc -l

echo "=== Deployment Verification ==="
ls -1 scripts/deploy-*.js | wc -l
```

This manual verification guide will help you confirm that all components are properly implemented and working as expected.
