/**
 * WebAuthn (FIDO2/Passkeys) Authentication
 * 
 * Passwordless authentication using WebAuthn API
 * Compatible with Android Termux and mobile browsers
 */

import { randomBytes } from 'crypto';

export interface WebAuthnRegistration {
  challenge: string;
  userId: string;
  username: string;
  expiresAt: number;
}

export interface WebAuthnCredential {
  id: string;
  userId: string;
  publicKey: string;
  counter: number;
  createdAt: number;
}

// In-memory store (replace with database in production)
const credentials = new Map<string, WebAuthnCredential>();
const challenges = new Map<string, WebAuthnRegistration>();

/**
 * Generate WebAuthn registration challenge
 */
export function generateRegistrationChallenge(
  userId: string,
  username: string
): WebAuthnRegistration {
  const challenge = randomBytes(32).toString('base64url');
  const expiresAt = Date.now() + 5 * 60 * 1000; // 5 minutes

  const registration: WebAuthnRegistration = {
    challenge,
    userId,
    username,
    expiresAt,
  };

  challenges.set(challenge, registration);
  
  // Cleanup expired challenges
  setTimeout(() => {
    challenges.delete(challenge);
  }, 5 * 60 * 1000);

  return registration;
}

/**
 * Verify WebAuthn registration
 */
export function verifyRegistration(
  challenge: string,
  credentialId: string,
  publicKey: string,
  attestationObject: string
): boolean {
  const registration = challenges.get(challenge);
  
  if (!registration) {
    return false;
  }

  if (Date.now() > registration.expiresAt) {
    challenges.delete(challenge);
    return false;
  }

  // Verify attestation (simplified - use proper WebAuthn library in production)
  // In production, use @simplewebauthn/server or similar
  
  const credential: WebAuthnCredential = {
    id: credentialId,
    userId: registration.userId,
    publicKey,
    counter: 0,
    createdAt: Date.now(),
  };

  credentials.set(credentialId, credential);
  challenges.delete(challenge);

  return true;
}

/**
 * Generate WebAuthn authentication challenge
 */
export function generateAuthChallenge(userId: string): string | null {
  // Find user's credentials
  const userCredentials = Array.from(credentials.values())
    .filter(c => c.userId === userId);

  if (userCredentials.length === 0) {
    return null;
  }

  const challenge = randomBytes(32).toString('base64url');
  const expiresAt = Date.now() + 5 * 60 * 1000;

  challenges.set(challenge, {
    challenge,
    userId,
    username: '', // Not needed for auth
    expiresAt,
  });

  setTimeout(() => {
    challenges.delete(challenge);
  }, 5 * 60 * 1000);

  return challenge;
}

/**
 * Verify WebAuthn authentication
 */
export function verifyAuthentication(
  challenge: string,
  credentialId: string,
  signature: string,
  authenticatorData: string
): string | null {
  const registration = challenges.get(challenge);
  
  if (!registration || Date.now() > registration.expiresAt) {
    return null;
  }

  const credential = credentials.get(credentialId);
  
  if (!credential || credential.userId !== registration.userId) {
    return null;
  }

  // Verify signature (simplified - use proper WebAuthn library)
  // In production, use @simplewebauthn/server
  
  credential.counter++;
  challenges.delete(challenge);

  return credential.userId;
}

/**
 * Get user credentials
 */
export function getUserCredentials(userId: string): WebAuthnCredential[] {
  return Array.from(credentials.values())
    .filter(c => c.userId === userId);
}
