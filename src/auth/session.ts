/**
 * Session Management
 * 
 * JWT-based session management for authenticated users
 */

import jwt from 'jsonwebtoken';
import { randomBytes } from 'crypto';

export interface SessionPayload {
  userId: string;
  email?: string;
  walletAddress?: string;
  authMethod: 'webauthn' | 'wallet' | 'qr';
  iat: number;
  exp: number;
}

const JWT_SECRET = process.env.JWT_SECRET || randomBytes(32).toString('hex');
const SESSION_DURATION = 24 * 60 * 60 * 1000; // 24 hours

// In-memory session store (replace with Redis in production)
const sessions = new Map<string, SessionPayload>();

/**
 * Create session token
 */
export function createSession(
  userId: string,
  options?: {
    email?: string;
    walletAddress?: string;
    authMethod?: 'webauthn' | 'wallet' | 'qr';
  }
): string {
  const payload: SessionPayload = {
    userId,
    email: options?.email,
    walletAddress: options?.walletAddress,
    authMethod: options?.authMethod || 'webauthn',
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor((Date.now() + SESSION_DURATION) / 1000),
  };

  const token = jwt.sign(payload, JWT_SECRET, {
    expiresIn: '24h',
  });

  sessions.set(token, payload);

  return token;
}

/**
 * Verify session token
 */
export function verifySession(token: string): SessionPayload | null {
  try {
    // Check in-memory cache first
    const cached = sessions.get(token);
    if (cached) {
      if (Date.now() / 1000 > cached.exp) {
        sessions.delete(token);
        return null;
      }
      return cached;
    }

    // Verify JWT
    const payload = jwt.verify(token, JWT_SECRET) as SessionPayload;
    
    if (Date.now() / 1000 > payload.exp) {
      return null;
    }

    // Cache verified session
    sessions.set(token, payload);
    return payload;
  } catch (error) {
    return null;
  }
}

/**
 * Revoke session
 */
export function revokeSession(token: string): boolean {
  return sessions.delete(token);
}

/**
 * Get session
 */
export function getSession(token: string): SessionPayload | null {
  return sessions.get(token) || null;
}

/**
 * Cleanup expired sessions
 */
export function cleanupExpiredSessions(): void {
  const now = Math.floor(Date.now() / 1000);
  
  for (const [token, payload] of sessions.entries()) {
    if (payload.exp < now) {
      sessions.delete(token);
    }
  }
}

// Run cleanup every hour
setInterval(cleanupExpiredSessions, 60 * 60 * 1000);
