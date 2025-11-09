/**
 * Authentication Middleware
 * 
 * Express middleware for authentication and authorization
 */

import { Request, Response, NextFunction } from 'express';
import { verifySession, SessionPayload } from './session';

export interface AuthenticatedRequest extends Request {
  user?: SessionPayload;
}

/**
 * Authentication middleware
 */
export function authenticate(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({
      success: false,
      error: 'Unauthorized: No token provided',
    });
    return;
  }

  const token = authHeader.substring(7);
  const session = verifySession(token);

  if (!session) {
    res.status(401).json({
      success: false,
      error: 'Unauthorized: Invalid or expired token',
    });
    return;
  }

  req.user = session;
  next();
}

/**
 * Optional authentication middleware
 * Sets req.user if token is valid, but doesn't fail if missing
 */
export function optionalAuthenticate(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void {
  const authHeader = req.headers.authorization;

  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7);
    const session = verifySession(token);
    
    if (session) {
      req.user = session;
    }
  }

  next();
}

/**
 * Require specific auth method
 */
export function requireAuthMethod(method: 'webauthn' | 'wallet' | 'qr') {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: 'Unauthorized',
      });
      return;
    }

    if (req.user.authMethod !== method) {
      res.status(403).json({
        success: false,
        error: `Forbidden: Requires ${method} authentication`,
      });
      return;
    }

    next();
  };
}
