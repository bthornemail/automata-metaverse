/**
 * Ethereum Wallet Authentication (Ethers.js)
 * 
 * Crypto-native authentication using Ethereum wallet signatures
 * Works great for Web3 users and mobile wallets
 */

// Use dynamic import to handle optional ethers dependency
let ethers: any = null;
try {
  ethers = require('ethers');
} catch (e) {
  console.warn('ethers not available, wallet auth disabled');
}

export interface WalletAuthChallenge {
  message: string;
  nonce: string;
  expiresAt: number;
}

export interface WalletAuthRequest {
  address: string;
  signature: string;
  message: string;
}

// In-memory store (replace with database in production)
const challenges = new Map<string, WalletAuthChallenge>();

/**
 * Generate wallet authentication challenge
 */
export function generateWalletChallenge(address: string): WalletAuthChallenge {
  if (!ethers) {
    throw new Error('ethers library not available');
  }
  const nonce = ethers.utils.hexlify(ethers.utils.randomBytes(32));
  const expiresAt = Date.now() + 5 * 60 * 1000; // 5 minutes
  
  const message = `Sign in to Universal Life Protocol\n\nAddress: ${address}\nNonce: ${nonce}\nExpires: ${new Date(expiresAt).toISOString()}`;

  const challenge: WalletAuthChallenge = {
    message,
    nonce,
    expiresAt,
  };

  challenges.set(address.toLowerCase(), challenge);

  // Cleanup expired challenges
  setTimeout(() => {
    challenges.delete(address.toLowerCase());
  }, 5 * 60 * 1000);

  return challenge;
}

/**
 * Verify wallet signature
 */
export function verifyWalletSignature(
  address: string,
  signature: string,
  message: string
): boolean {
  const challenge = challenges.get(address.toLowerCase());

  if (!challenge) {
    return false;
  }

  if (Date.now() > challenge.expiresAt) {
    challenges.delete(address.toLowerCase());
    return false;
  }

  if (message !== challenge.message) {
    return false;
  }

  if (!ethers) {
    return false;
  }

  try {
    // Recover address from signature
    const recoveredAddress = ethers.utils.verifyMessage(message, signature);
    
    // Compare addresses (case-insensitive)
    if (recoveredAddress.toLowerCase() !== address.toLowerCase()) {
      return false;
    }

    // Cleanup challenge
    challenges.delete(address.toLowerCase());
    return true;
  } catch (error) {
    console.error('Wallet signature verification error:', error);
    return false;
  }
}

/**
 * Generate QR code data for wallet pairing
 */
export function generateWalletQRData(address: string): string {
  const challenge = generateWalletChallenge(address);
  
  // Return JSON string for QR code
  return JSON.stringify({
    type: 'wallet-auth',
    address: address.toLowerCase(),
    message: challenge.message,
    expiresAt: challenge.expiresAt,
  });
}

/**
 * Verify wallet authentication request
 */
export function authenticateWallet(request: WalletAuthRequest): boolean {
  return verifyWalletSignature(
    request.address,
    request.signature,
    request.message
  );
}
