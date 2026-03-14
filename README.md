# CredChain

**Own Your Work Identity** — A decentralized verifiable work credential platform for gig workers in India.

## What is CredChain?

CredChain lets gig workers (Swiggy, Zomato, Uber, etc.) receive, store, and selectively share verified work credentials — ratings, delivery counts, years of experience — backed by real Ethereum-compatible wallets on the Polygon blockchain.

- **Workers** own their identity with a BIP-39 wallet. Private keys never leave the device.
- **Enterprises** issue and verify credentials both off-chain (JWT) and on-chain (Polygon Amoy testnet).
- **Selective disclosure** lets workers choose exactly which fields to share via QR codes.

## Tech Stack

| Layer | Technology |
|-------|------------|
| Mobile | Expo SDK 54, React Native, Zustand, ethers.js v6 |
| Backend | Express.js, MongoDB |
| Blockchain | Solidity 0.8.19, Polygon Amoy Testnet |

## Getting Started

### Mobile App

```bash
cd mobile
npm install
npm start
```

### Backend Server

1. Create a `.env` file in `server/` with your MongoDB connection string:
   ```
   MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/credchain
   ```
2. Run the server:
   ```bash
   cd server
   npm install
   npm run dev
   ```

### Smart Contract

Already deployed on Polygon Amoy at `0x335aC42B0a21496753C54367bD3CF5f86886b401`. See `contracts/DEPLOY.md` to redeploy.

## Features

**Worker Side**
- Create or import a real BIP-39 crypto wallet (12/24-word recovery phrase)
- View credentials with summary stats (avg rating, total deliveries, platforms)
- Share credentials via QR code with selective field disclosure
- Receive credentials by scanning QR or pasting a JWT token
- Edit profile, upload government ID (Aadhaar, PAN, DL, Voter ID)
- Backup and restore wallet across devices

**Enterprise Side**
- Dashboard with issuance stats (gated behind enterprise verification)
- Issue credentials on-chain (Polygon) and off-chain (JWT)
- Verify credentials via QR scan or JWT decode with blockchain confirmation
- View all workers issued credentials to

**General**
- Bilingual support: English and Hindi
- Secure key storage via `expo-secure-store`
- Cross-device wallet import and profile sync via MongoDB

## Project Structure

```
mobile/       → Expo React Native app (file-based routing)
  src/app/onboarding/   → Welcome, role selection, wallet create/import
  src/app/(worker)/     → Credentials, receive, profile (blue theme)
  src/app/(enterprise)/ → Dashboard, issue, workers, verify, profile (green theme)
  src/store/            → Zustand state management
  src/utils/            → API client, crypto, blockchain, i18n
server/       → Express API (profiles & enterprise verification)
contracts/    → Solidity smart contract + deployment guide
```
