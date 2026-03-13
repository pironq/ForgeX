import "react-native-get-random-values";
import { ethers } from "ethers";
import * as SecureStore from "expo-secure-store";

// Polygon Amoy Testnet Configuration
export const CHAIN_CONFIG = {
  chainId: 80002,
  chainName: "Polygon Amoy Testnet",
  rpcUrl: "https://rpc-amoy.polygon.technology/",
  blockExplorer: "https://amoy.polygonscan.com",
  currency: { name: "POL", symbol: "POL", decimals: 18 },
};

// Contract address - Deployed on Polygon Amoy testnet
export const CONTRACT_ADDRESS = "0x335aC42B0a21496753C54367bD3CF5f86886b401";

// Contract ABI (only the functions we need)
export const CONTRACT_ABI = [
  "function issueCredential(bytes32 credentialHash, address worker, string calldata platform) external",
  "function verifyCredential(bytes32 credentialHash) external view returns (bool valid, address issuer, address worker, uint256 issuedAt, string memory platform)",
  "function revokeCredential(bytes32 credentialHash) external",
  "function getWorkerCredentials(address worker) external view returns (bytes32[] memory)",
  "function getWorkerCredentialCount(address worker) external view returns (uint256)",
  "function isVerifiedIssuer(address issuer) external view returns (bool)",
  "event CredentialIssued(bytes32 indexed hash, address indexed issuer, address indexed worker, string platform, uint256 timestamp)",
];

// Get provider (read-only)
export function getProvider() {
  return new ethers.JsonRpcProvider(CHAIN_CONFIG.rpcUrl);
}

// Get signer (for transactions) - uses stored private key
export async function getSigner() {
  const privateKey = await SecureStore.getItemAsync("wallet_private_key");
  if (!privateKey) {
    throw new Error("No wallet found. Please create or import a wallet first.");
  }
  const provider = getProvider();
  return new ethers.Wallet(privateKey, provider);
}

// Get contract instance (read-only)
export function getContract() {
  const provider = getProvider();
  return new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, provider);
}

// Get contract instance with signer (for transactions)
export async function getContractWithSigner() {
  const signer = await getSigner();
  return new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);
}

// Hash credential data for on-chain storage
export function hashCredential(credentialData) {
  const jsonString = JSON.stringify(credentialData);
  return ethers.keccak256(ethers.toUtf8Bytes(jsonString));
}

// Issue credential on-chain
export async function issueCredentialOnChain(credentialData, workerAddress, platform) {
  try {
    const contract = await getContractWithSigner();
    const hash = hashCredential(credentialData);

    const tx = await contract.issueCredential(hash, workerAddress, platform);
    const receipt = await tx.wait();

    return {
      success: true,
      hash: hash,
      txHash: receipt.hash,
      blockNumber: receipt.blockNumber,
    };
  } catch (error) {
    console.error("Error issuing credential on-chain:", error);
    return {
      success: false,
      error: error.message,
    };
  }
}

// Verify credential on-chain
export async function verifyCredentialOnChain(credentialData) {
  try {
    const contract = getContract();
    const hash = hashCredential(credentialData);

    const [valid, issuer, worker, issuedAt, platform] = await contract.verifyCredential(hash);

    return {
      valid,
      issuer,
      worker,
      issuedAt: issuedAt ? new Date(Number(issuedAt) * 1000) : null,
      platform,
      hash,
    };
  } catch (error) {
    console.error("Error verifying credential on-chain:", error);
    return {
      valid: false,
      error: error.message,
    };
  }
}

// Get worker's on-chain credentials
export async function getWorkerOnChainCredentials(workerAddress) {
  try {
    const contract = getContract();
    const hashes = await contract.getWorkerCredentials(workerAddress);
    return hashes;
  } catch (error) {
    console.error("Error getting worker credentials:", error);
    return [];
  }
}

// Check if address is a verified issuer
export async function checkIsVerifiedIssuer(address) {
  try {
    const contract = getContract();
    return await contract.isVerifiedIssuer(address);
  } catch (error) {
    console.error("Error checking issuer status:", error);
    return false;
  }
}

// Get wallet balance (for showing if user has gas)
export async function getWalletBalance(address) {
  try {
    const provider = getProvider();
    const balance = await provider.getBalance(address);
    return ethers.formatEther(balance);
  } catch (error) {
    console.error("Error getting balance:", error);
    return "0";
  }
}

// Get block explorer URL for a transaction
export function getExplorerUrl(txHash) {
  return `${CHAIN_CONFIG.blockExplorer}/tx/${txHash}`;
}

// Get block explorer URL for an address
export function getAddressExplorerUrl(address) {
  return `${CHAIN_CONFIG.blockExplorer}/address/${address}`;
}
