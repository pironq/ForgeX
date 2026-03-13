# Smart Contract Deployment Guide

## Deploy CredChain Contract to Polygon Amoy Testnet

### Prerequisites
1. MetaMask browser extension installed
2. Test MATIC from faucet (see step 1)

---

### Step 1: Get Test MATIC

1. Go to https://faucet.polygon.technology/
2. Select **Amoy** network
3. Paste your MetaMask wallet address
4. Click "Submit" to receive free test MATIC

---

### Step 2: Add Polygon Amoy to MetaMask

Click "Add Network" in MetaMask and enter:

| Field | Value |
|-------|-------|
| Network Name | Polygon Amoy Testnet |
| RPC URL | https://rpc-amoy.polygon.technology/ |
| Chain ID | 80002 |
| Currency Symbol | MATIC |
| Block Explorer | https://amoy.polygonscan.com/ |

---

### Step 3: Deploy via Remix IDE

1. Go to https://remix.ethereum.org/

2. Create new file: `CredChain.sol`

3. Copy the entire contents of `contracts/CredChain.sol` into Remix

4. Go to **Solidity Compiler** tab (left sidebar):
   - Select compiler version `0.8.19`
   - Click **Compile CredChain.sol**

5. Go to **Deploy & Run** tab:
   - Environment: **Injected Provider - MetaMask**
   - Make sure MetaMask is on **Polygon Amoy** network
   - Contract: **CredChain**
   - Click **Deploy**
   - Confirm the transaction in MetaMask

6. After deployment, copy the **contract address** from Remix

---

### Step 4: Update the App

Edit `mobile/src/utils/blockchain.js`:

```javascript
// Replace this line:
export const CONTRACT_ADDRESS = "0x0000000000000000000000000000000000000000";

// With your deployed address:
export const CONTRACT_ADDRESS = "0xYOUR_CONTRACT_ADDRESS_HERE";
```

---

### Step 5: Add Yourself as Verified Issuer (Optional)

If you want other enterprise wallets to issue credentials:

1. In Remix, find your deployed contract under "Deployed Contracts"
2. Expand the contract
3. Find `addVerifiedIssuer` function
4. Enter the enterprise wallet address
5. Click "transact" and confirm in MetaMask

The contract owner (deployer) is automatically a verified issuer.

---

## Contract Functions

| Function | Who Can Call | What It Does |
|----------|--------------|--------------|
| `issueCredential` | Verified Issuers | Store credential hash on-chain |
| `verifyCredential` | Anyone | Check if credential exists and is valid |
| `revokeCredential` | Original Issuer | Mark credential as revoked |
| `addVerifiedIssuer` | Owner | Add new verified enterprise |
| `removeVerifiedIssuer` | Owner | Remove verified enterprise |
| `getWorkerCredentials` | Anyone | Get all credential hashes for a worker |

---

## Polygon Amoy Block Explorer

View transactions and contracts: https://amoy.polygonscan.com/

---

## Estimated Gas Costs

On Polygon Amoy (testnet), gas is free (test MATIC).

On Polygon Mainnet:
- Deploy contract: ~$0.05-0.10
- Issue credential: ~$0.001-0.005
- Verify credential: Free (read-only)
