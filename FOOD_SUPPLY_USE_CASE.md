## Technical Brief: Food Supply Chain Provenance Using Blockchain

This document adapts the provided outline to our Food Supply Chain DApp. It shows how we store tamper‑proof product provenance, link optional off‑chain documents via IPFS, and verify integrity end‑to‑end.

### 1) Use Case Overview
- Goal: A decentralized, auditable trail for food items (creation → shipping → receiving) with optional certificates/labels/photos stored off‑chain.
- Sensitivity: Product media/COAs can be encrypted and stored off‑chain (IPFS). Only immutable references (CIDs) and state are on‑chain.

### 2) Technical Architecture

Workflow
- Upload Phase (metadata/certificates)
  1) User (farmer/producer) selects a document or image in the web UI (`frontend/`).
  2) Optionally encrypt locally (AES‑256). For public assets, skip encryption.
  3) Upload encrypted or plaintext file to IPFS (Web3.Storage) → get CID.
  4) Smart contract logs the CID against the `productId`, plus timestamp and caller address.
- Verification Phase
  1) Consumer scans QR or searches productId.
  2) UI reads the on‑chain record to obtain CID and state.
  3) File fetched from IPFS. If encrypted, holder decrypts locally with a key shared off‑chain.

How this maps to our codebase
- Contract: `contracts/SupplyChain.sol` already supports `setProductMetadataCid(productId, cid)` and `getProduct(productId)` which returns CID and state.
- Frontend: `frontend/app.js` implements Web3.Storage upload (`uploadToWeb3Storage`) and setting CID on-chain (`setMetadataCid`).
- QR flow: `generateQR()` deep‑links into tracker with `productId` query param.

### 3) Core Components

| Component | Technology |
| --- | --- |
| Blockchain | Ethereum (Local Hardhat, Sepolia/Polygon testnets) |
| Smart Contract | Solidity + Hardhat |
| Storage | IPFS via Web3.Storage (already wired) |
| Encryption (optional) | AES‑256 (Web Crypto API or crypto‑js) |
| Frontend | Static HTML + Tailwind + ethers v6 + MetaMask |
| Backend (optional) | Node.js/Express for analytics or rate‑limits |

### 4) Smart Contract Outline

Our project already implements the essential interface in `SupplyChain.sol`. An equivalent minimal outline for the metadata link is:

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

contract ProductMetadata {
    struct Record { string cid; address uploader; uint256 timestamp; }
    mapping(uint256 => Record) public records; // productId => Record

    event MetadataSet(uint256 indexed productId, string cid, address indexed uploader, uint256 timestamp);

    function setProductMetadataCid(uint256 productId, string calldata cid) external {
        records[productId] = Record({ cid: cid, uploader: msg.sender, timestamp: block.timestamp });
        emit MetadataSet(productId, cid, msg.sender, block.timestamp);
    }

    function getProductCid(uint256 productId) external view returns (string memory) {
        return records[productId].cid;
    }
}
```

In our DApp the metadata field is part of `SupplyChain` alongside role‑gated state transitions.

### 5) Security Measures
- On‑chain minimalism: Only product state and CID on chain; no sensitive content or PII.
- Optional end‑to‑end encryption: Encrypt files before upload; share keys off‑chain.
- Tamper‑proof: Any change to a document changes the CID, revealing manipulation.
- Access control: Contract roles (farmer/shipper/receiver) restrict who can mutate state; owner/admin manages role assignment (see `scripts/setup-roles.js`).

### 6) Deployment
- Local: `npm run node` → `npm run deploy:local` (writes `frontend/abi.json`) → `npm run serve:frontend`.
- Testnet: `npm run deploy:sepolia` with `.env` RPC + private key.
- IPFS: Use Web3.Storage token in UI to pin and obtain CID.
- Hosting: Serve `frontend/` via Netlify/Vercel or the built‑in Python server.

### 7) Performance & Scalability
- IPFS offloads heavy content; chain stores only pointers.
- Low‑gas state transitions; L2s (Polygon/Arbitrum/Base) reduce cost at scale.
- Add events + indexer (The Graph) to provide fast product history search.

### 8) Potential Extensions
- Tokenized authenticity: NFT/attestation representing batch authenticity.
- Expanded roles: Distributor/Retailer; granular ACL per product/batch.
- Compliance: Attach HACCP/organic certificates via CIDs; ZK proofs for selective disclosure.
- Supply analytics: Optional backend for KPIs (lead time, handoffs) using event streams.

---
This write‑up stays aligned with our Food Supply Chain DApp and can be used directly for presentations and reports.


