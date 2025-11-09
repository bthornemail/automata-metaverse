/**
 * Ethereum Wallet Authentication Unit Tests
 */

import {
  generateWalletChallenge,
  verifyWalletSignature,
  authenticateWallet,
} from '../../../src/auth/ethers-wallet';

// Mock ethers
jest.mock('ethers', () => {
  const mockVerifyMessage = jest.fn((message: string, signature: string) => {
    // Mock verification - return address if signature matches
    if (signature === 'valid-signature') {
      return '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb';
    }
    throw new Error('Invalid signature');
  });

  return {
    utils: {
      hexlify: jest.fn((bytes: Uint8Array) => '0x' + Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('')),
      randomBytes: jest.fn(() => new Uint8Array(32).fill(1)),
      verifyMessage: mockVerifyMessage,
    },
  };
});

describe('Ethereum Wallet Authentication', () => {
  const testAddress = '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb';

  describe('generateWalletChallenge', () => {
    it('should generate a challenge for an address', () => {
      const challenge = generateWalletChallenge(testAddress);

      expect(challenge).toBeDefined();
      expect(challenge.message).toContain('Sign in to Universal Life Protocol');
      expect(challenge.message).toContain(testAddress);
      expect(challenge.nonce).toBeDefined();
      expect(challenge.expiresAt).toBeGreaterThan(Date.now());
    });

    it('should include expiration timestamp', () => {
      const challenge = generateWalletChallenge(testAddress);
      const expiresIn = challenge.expiresAt - Date.now();

      expect(expiresIn).toBeGreaterThan(0);
      expect(expiresIn).toBeLessThanOrEqual(5 * 60 * 1000); // 5 minutes
    });
  });

  describe('verifyWalletSignature', () => {
    it('should verify a valid signature', () => {
      const challenge = generateWalletChallenge(testAddress);
      const isValid = verifyWalletSignature(testAddress, 'valid-signature', challenge.message);

      expect(isValid).toBe(true);
    });

    it('should reject invalid signature', () => {
      const challenge = generateWalletChallenge(testAddress);
      const isValid = verifyWalletSignature(testAddress, 'invalid-signature', challenge.message);

      expect(isValid).toBe(false);
    });

    it('should reject expired challenge', () => {
      // Create expired challenge
      const challenge = generateWalletChallenge(testAddress);
      challenge.expiresAt = Date.now() - 1000; // Expired 1 second ago

      const isValid = verifyWalletSignature(testAddress, 'valid-signature', challenge.message);
      expect(isValid).toBe(false);
    });

    it('should reject wrong message', () => {
      const challenge = generateWalletChallenge(testAddress);
      const isValid = verifyWalletSignature(testAddress, 'valid-signature', 'wrong message');

      expect(isValid).toBe(false);
    });
  });

  describe('authenticateWallet', () => {
    it('should authenticate with valid request', () => {
      const challenge = generateWalletChallenge(testAddress);
      const request = {
        address: testAddress,
        signature: 'valid-signature',
        message: challenge.message,
      };

      const isValid = authenticateWallet(request);
      expect(isValid).toBe(true);
    });

    it('should reject invalid request', () => {
      const challenge = generateWalletChallenge(testAddress);
      const request = {
        address: testAddress,
        signature: 'invalid-signature',
        message: challenge.message,
      };

      const isValid = authenticateWallet(request);
      expect(isValid).toBe(false);
    });
  });
});
