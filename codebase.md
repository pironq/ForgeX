# CredChain - Codebase Overview

## What is CredChain?
A decentralized **verifiable work credential** platform targeting **gig workers in India** (Swiggy, Zomato, Uber, etc.). Workers can receive, store, and selectively share verified work credentials. Enterprises can issue and verify credentials.

**Status:** Hackathon/prototype (v1.0.0 Alpha). Real wallet generation with ethers.js, backend with MongoDB.

---

## Project Structure

```
w:/Hack/
├── mobile/          ← Expo React Native app (main app)
├── server/          ← Express + MongoDB API (backend)
└── codebase.md      ← This file
```

---

## Mobile App (`/mobile`)

**Stack:** Expo SDK 54 | React Native 0.81.5 | React 19.1 | TypeScript
**Wallet:** ethers.js v6 (real BIP-39 mnemonic, real 0x addresses)
**Routing:** Expo Router v6 (file-based)
**State:** Zustand v5 + AsyncStorage (persisted)
**Styling:** StyleSheet.create() with Inter font
**Icons:** lucide-react-native
**i18n:** English + Hindi

### Source Tree

```
mobile/src/
├── app/
│   ├── _layout.jsx                 # Root layout (fonts, splash, polyfills)
│   ├── index.jsx                   # Root redirect (routes by init state + role)
│   ├── +not-found.tsx              # 404 screen
│   │
│   ├── onboarding/
│   │   ├── _layout.jsx             # Onboarding stack navigator
│   │   ├── welcome.jsx             # Landing screen with branding
│   │   ├── role-selection.jsx      # Worker vs Enterprise choice
│   │   ├── create-wallet.jsx       # Generate real BIP-39 mnemonic + address
│   │   ├── import-wallet.jsx       # Import existing recovery phrase
│   │   └── wallet-ready.jsx        # Success screen, shows full address
│   │
│   ├── (enterprise)/
│   │   ├── _layout.jsx             # 5-tab navigator (green theme)
│   │   ├── index.jsx               # Dashboard
│   │   ├── issue.jsx               # Issue credential form
│   │   ├── verify.jsx              # Verify credential via QR/JWT
│   │   ├── workers.jsx             # List all workers
│   │   └── profile.jsx             # Enterprise profile
│   │
│   └── (worker)/
│       ├── _layout.jsx             # 3-tab navigator (blue theme)
│       ├── index.jsx               # My Credentials
│       ├── receive.jsx             # Receive credential via QR/JWT
│       └── profile.jsx             # Worker profile (syncs to backend)
│
├── components/
│   └── KeyboardAvoidingAnimatedView.jsx
│
├── store/
│   └── useStore.js                 # Zustand store (syncs profile to backend)
│
└── utils/
    ├── api.js                      # Backend API client
    ├── crypto.js                   # Real ethers.js wallet functions
    └── i18n.js                     # Translations
```

---

## Server (`/server`)

**Stack:** Express.js + MongoDB

### Files

```
server/
├── index.js          # Express server with profile API
├── package.json      # Dependencies (express, mongodb, cors, dotenv)
├── .env              # Environment variables (MONGODB_URI)
└── .gitignore
```

### API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/` | Health check |
| GET | `/api/profile?address=0x...` | Get profile by wallet address |
| POST | `/api/profile` | Create or update profile |

### Setup

1. Create free MongoDB Atlas cluster at https://cloud.mongodb.com
2. Add connection string to `server/.env`:
   ```
   MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/credchain
   ```
3. Run:
   ```bash
   cd server
   npm install
   npm run dev
   ```

---

## Data Architecture

| Data | Storage | Notes |
|------|---------|-------|
| Mnemonic + Private Key | Device (SecureStore) | Never leaves device |
| Profile (name, phone, etc.) | Device + MongoDB | Syncs to backend |
| Credentials | Device only | Future: on-chain |

When user imports wallet on new device → app fetches profile from backend using wallet address.

---

## Crypto Layer (REAL)

| Function | What it does |
|----------|-------------|
| `generateMnemonic()` | Real BIP-39 12-word mnemonic via ethers.js |
| `deriveAddress()` | Real HD wallet derivation, returns `0x...` address |
| `derivePrivateKey()` | Extracts private key for SecureStore |
| `isValidMnemonic()` | Validates BIP-39 phrase |
| `signCredential()` | Mock JWT (not on-chain yet) |
| `verifyCredential()` | Mock JWT decode |

---

## Key Takeaways
1. **Real wallets** — BIP-39 mnemonic, works with MetaMask, Polygon-compatible
2. **Backend ready** — Express + MongoDB for profile persistence
3. **Cross-device** — Import wallet on new device, profile syncs from backend
4. **India-focused** — Swiggy/Zomato/Uber, Aadhaar/PAN, Hindi support
