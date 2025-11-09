/**
 * Authentication System
 * 
 * Supports multiple authentication methods:
 * - WebAuthn (FIDO2/Passkeys) - Passwordless authentication
 * - Ethereum Wallet (Ethers.js) - Crypto-native authentication
 * - QR Code Pairing - Mobile-friendly setup
 */

export interface AuthUser {
  id: string;
  email?: string;
  walletAddress?: string;
  webauthnCredentialId?: string;
  createdAt: number;
  lastLogin: number;
}

export interface AuthSession {
  userId: string;
  token: string;
  expiresAt: number;
  ipAddress: string;
  userAgent: string;
}

export interface WebAuthnChallenge {
  challenge: string;
  userId: string;
  expiresAt: number;
}

export interface QRCodePairing {
  code: string;
  userId: string;
  expiresAt: number;
  verified: boolean;
}

// Export auth methods
export * from './webauthn';
export * from './ethers-wallet';
export * from './qr-pairing';
export * from './session';
export * from './middleware';
