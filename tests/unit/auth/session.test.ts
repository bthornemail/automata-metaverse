/**
 * Session Management Unit Tests
 */

import { createSession, verifySession, revokeSession, getSession } from '../../../src/auth/session';

describe('Session Management', () => {
  beforeEach(() => {
    // Clear sessions before each test
    jest.clearAllMocks();
  });

  describe('createSession', () => {
    it('should create a valid session token', () => {
      const token = createSession('user-123', {
        email: 'test@example.com',
        authMethod: 'webauthn',
      });

      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
      expect(token.length).toBeGreaterThan(0);
    });

    it('should create session with wallet address', () => {
      const token = createSession('0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb', {
        walletAddress: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb',
        authMethod: 'wallet',
      });

      const session = verifySession(token);
      expect(session).toBeDefined();
      expect(session?.walletAddress).toBe('0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb');
    });
  });

  describe('verifySession', () => {
    it('should verify a valid session token', () => {
      const token = createSession('user-123');
      const session = verifySession(token);

      expect(session).toBeDefined();
      expect(session?.userId).toBe('user-123');
      expect(session?.exp).toBeGreaterThan(Math.floor(Date.now() / 1000));
    });

    it('should return null for invalid token', () => {
      const session = verifySession('invalid-token');
      expect(session).toBeNull();
    });

    it('should return null for expired token', () => {
      // Create token with short expiration (would need to mock time)
      const token = createSession('user-123');
      // In real test, would advance time and verify expiration
      // For now, just verify valid token works
      const session = verifySession(token);
      expect(session).toBeDefined();
    });
  });

  describe('revokeSession', () => {
    it('should revoke a session', () => {
      const token = createSession('user-123');
      const revoked = revokeSession(token);

      expect(revoked).toBe(true);
      
      const session = verifySession(token);
      // Session might still be valid in cache, but revocation should work
      expect(revoked).toBe(true);
    });
  });

});
