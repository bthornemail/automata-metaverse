/**
 * QR Code Pairing Unit Tests
 */

import {
  generateQRPairingCode,
  verifyQRPairingCode,
  generateQRCodeData,
  getPairingStatus,
} from '../../../src/auth/qr-pairing';

describe('QR Code Pairing', () => {
  const testUserId = 'user-123';
  const testDeviceId = 'device-456';

  describe('generateQRPairingCode', () => {
    it('should generate a 6-digit code', () => {
      const pairing = generateQRPairingCode(testUserId, testDeviceId);

      expect(pairing).toBeDefined();
      expect(pairing.code).toMatch(/^\d{6}$/);
      expect(pairing.userId).toBe(testUserId);
      expect(pairing.deviceId).toBe(testDeviceId);
      expect(pairing.verified).toBe(false);
    });

    it('should set expiration time', () => {
      const pairing = generateQRPairingCode(testUserId, testDeviceId);
      const expiresIn = pairing.expiresAt - Date.now();

      expect(expiresIn).toBeGreaterThan(0);
      expect(expiresIn).toBeLessThanOrEqual(10 * 60 * 1000); // 10 minutes
    });
  });

  describe('verifyQRPairingCode', () => {
    it('should verify a valid code', () => {
      const pairing = generateQRPairingCode(testUserId, testDeviceId);
      const verified = verifyQRPairingCode(pairing.code);

      expect(verified).toBeDefined();
      expect(verified?.userId).toBe(testUserId);
      expect(verified?.verified).toBe(true);
    });

    it('should return null for invalid code', () => {
      const verified = verifyQRPairingCode('000000');
      expect(verified).toBeNull();
    });

    it('should return null for expired code', () => {
      const pairing = generateQRPairingCode(testUserId, testDeviceId);
      pairing.expiresAt = Date.now() - 1000; // Expired

      const verified = verifyQRPairingCode(pairing.code);
      expect(verified).toBeNull();
    });

    it('should not verify same code twice', () => {
      const pairing = generateQRPairingCode(testUserId, testDeviceId);
      const firstVerify = verifyQRPairingCode(pairing.code);
      const secondVerify = verifyQRPairingCode(pairing.code);

      expect(firstVerify).toBeDefined();
      expect(secondVerify).toBeNull(); // Already used
    });
  });

  describe('generateQRCodeData', () => {
    it('should generate QR code data', () => {
      const { code, qrData } = generateQRCodeData(testUserId, testDeviceId);

      expect(code).toMatch(/^\d{6}$/);
      expect(qrData).toBeDefined();
      
      const parsed = JSON.parse(qrData);
      expect(parsed.type).toBe('pairing');
      expect(parsed.code).toBe(code);
      expect(parsed.userId).toBe(testUserId);
      expect(parsed.deviceId).toBe(testDeviceId);
    });
  });

  describe('getPairingStatus', () => {
    it('should get pairing status', () => {
      const pairing = generateQRPairingCode(testUserId, testDeviceId);
      const status = getPairingStatus(pairing.code);

      expect(status).toBeDefined();
      expect(status?.code).toBe(pairing.code);
      expect(status?.verified).toBe(false);
    });

    it('should return null for non-existent code', () => {
      const status = getPairingStatus('999999');
      expect(status).toBeNull();
    });
  });
});
