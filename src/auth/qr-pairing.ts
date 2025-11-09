/**
 * QR Code Pairing for Mobile Authentication
 * 
 * Generates QR codes for mobile device pairing
 * Useful for Android Termux and mobile browser authentication
 */

import { randomBytes } from 'crypto';

export interface QRPairingCode {
  code: string;
  userId: string;
  deviceId: string;
  expiresAt: number;
  verified: boolean;
}

// In-memory store (replace with database in production)
const pairings = new Map<string, QRPairingCode>();

/**
 * Generate QR pairing code
 */
export function generateQRPairingCode(
  userId: string,
  deviceId: string
): QRPairingCode {
  // Generate 6-digit code
  const code = Array.from({ length: 6 }, () => 
    Math.floor(Math.random() * 10)
  ).join('');
  
  const expiresAt = Date.now() + 10 * 60 * 1000; // 10 minutes

  const pairing: QRPairingCode = {
    code,
    userId,
    deviceId,
    expiresAt,
    verified: false,
  };

  pairings.set(code, pairing);

  // Cleanup expired pairings
  setTimeout(() => {
    pairings.delete(code);
  }, 10 * 60 * 1000);

  return pairing;
}

/**
 * Verify QR pairing code
 */
export function verifyQRPairingCode(code: string): QRPairingCode | null {
  const pairing = pairings.get(code);

  if (!pairing) {
    return null;
  }

  if (Date.now() > pairing.expiresAt) {
    pairings.delete(code);
    return null;
  }

  if (pairing.verified) {
    return null; // Already used
  }

  pairing.verified = true;
  return pairing;
}

/**
 * Generate QR code URL/data
 */
export function generateQRCodeData(
  userId: string,
  deviceId: string
): { code: string; qrData: string } {
  const pairing = generateQRPairingCode(userId, deviceId);

  // Generate QR code data (can be used with qrcode library)
  const qrData = JSON.stringify({
    type: 'pairing',
    code: pairing.code,
    userId: pairing.userId,
    deviceId: pairing.deviceId,
    expiresAt: pairing.expiresAt,
  });

  return {
    code: pairing.code,
    qrData,
  };
}

/**
 * Get pairing status
 */
export function getPairingStatus(code: string): QRPairingCode | null {
  return pairings.get(code) || null;
}
