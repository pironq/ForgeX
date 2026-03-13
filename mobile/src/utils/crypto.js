import "react-native-get-random-values";
import { ethers } from "ethers";

// Generate a real BIP-39 12-word mnemonic
export const generateMnemonic = () => {
  const wallet = ethers.Wallet.createRandom();
  return wallet.mnemonic.phrase;
};

// Derive wallet address and private key in one call (avoids double derivation)
export const deriveWallet = (mnemonic) => {
  const wallet = ethers.HDNodeWallet.fromPhrase(mnemonic);
  return { address: wallet.address, privateKey: wallet.privateKey };
};

// Derive a real Ethereum/Polygon wallet address from a mnemonic
export const deriveAddress = (mnemonic) => {
  const wallet = ethers.HDNodeWallet.fromPhrase(mnemonic);
  return wallet.address; // real 0x... address
};

// Validate a BIP-39 mnemonic phrase
export const isValidMnemonic = (phrase) => {
  try {
    return ethers.Mnemonic.isValidMnemonic(phrase);
  } catch {
    return false;
  }
};

// Truncate a 0x address for display: 0x1234...abcd
export const getWalletAddress = (address) => {
  if (!address) return "";
  if (address.length <= 16) return address;
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
};

// Get the private key from a mnemonic (for secure storage)
export const derivePrivateKey = (mnemonic) => {
  const wallet = ethers.HDNodeWallet.fromPhrase(mnemonic);
  return wallet.privateKey;
};

// --- Credential signing/verification (unchanged, not blockchain-based) ---

export const signCredential = async (issuerDid, subjectDid, claims) => {
  const header = { alg: "EdDSA", typ: "JWT" };
  const payload = {
    iss: issuerDid,
    sub: subjectDid,
    iat: Math.floor(Date.now() / 1000),
    vc: {
      "@context": ["https://www.w3.org/2018/credentials/v1"],
      type: ["VerifiableCredential"],
      credentialSubject: claims,
    },
  };

  const signature = btoa(JSON.stringify(payload)).slice(0, 64);
  return `${btoa(JSON.stringify(header))}.${btoa(JSON.stringify(payload))}.${signature}`;
};

export const verifyCredential = (token) => {
  try {
    const [header, payload, signature] = token.split(".");
    const decodedPayload = JSON.parse(atob(payload));
    return {
      valid: true,
      issuer: decodedPayload.iss,
      subject: decodedPayload.sub,
      claims: decodedPayload.vc.credentialSubject,
    };
  } catch (e) {
    return { valid: false, error: "Invalid credential format" };
  }
};
