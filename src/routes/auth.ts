/**
 * Authentication Routes
 * 
 * Handles WebAuthn, Wallet, and QR code authentication
 */

import { Router, Request, Response } from 'express';
import { authenticate, optionalAuthenticate, AuthenticatedRequest } from '../auth/middleware';
import { rateLimiters } from '../middleware/rate-limit';
import { validate, schemas } from '../middleware/validation';
import Joi from 'joi';
import {
  generateRegistrationChallenge,
  verifyRegistration,
  generateAuthChallenge,
  verifyAuthentication,
} from '../auth/webauthn';
import {
  generateWalletChallenge,
  verifyWalletSignature,
  authenticateWallet,
} from '../auth/ethers-wallet';
import {
  generateQRPairingCode,
  verifyQRPairingCode,
  generateQRCodeData,
} from '../auth/qr-pairing';
import { createSession, verifySession } from '../auth/session';

const router = Router();

/**
 * POST /api/auth/webauthn/register/start
 * Start WebAuthn registration
 */
router.post(
  '/webauthn/register/start',
  rateLimiters.auth,
  validate({
    body: Joi.object({
      userId: schemas.uuid,
      username: Joi.string().min(3).max(50).required(),
    }),
  }),
  (req: Request, res: Response) => {
    try {
      const { userId, username } = req.body;
      const challenge = generateRegistrationChallenge(userId, username);

      res.json({
        success: true,
        challenge: challenge.challenge,
        expiresAt: challenge.expiresAt,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Registration failed',
      });
    }
  }
);

/**
 * POST /api/auth/webauthn/register/complete
 * Complete WebAuthn registration
 */
router.post(
  '/webauthn/register/complete',
  rateLimiters.auth,
  validate({
    body: Joi.object({
      challenge: Joi.string().required(),
      credentialId: Joi.string().required(),
      publicKey: schemas.base64,
      attestationObject: schemas.base64,
    }),
  }),
  (req: Request, res: Response) => {
    try {
      const { challenge, credentialId, publicKey, attestationObject } = req.body;
      
      const verified = verifyRegistration(
        challenge,
        credentialId,
        publicKey,
        attestationObject
      );

      if (!verified) {
        res.status(400).json({
          success: false,
          error: 'Registration verification failed',
        });
        return;
      }

      res.json({
        success: true,
        message: 'Registration completed successfully',
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Registration failed',
      });
    }
  }
);

/**
 * POST /api/auth/webauthn/login/start
 * Start WebAuthn authentication
 */
router.post(
  '/webauthn/login/start',
  rateLimiters.auth,
  validate({
    body: Joi.object({
      userId: schemas.uuid,
    }),
  }),
  (req: Request, res: Response) => {
    try {
      const { userId } = req.body;
      const challenge = generateAuthChallenge(userId);

      if (!challenge) {
        res.status(404).json({
          success: false,
          error: 'No credentials found for user',
        });
        return;
      }

      res.json({
        success: true,
        challenge,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Authentication failed',
      });
    }
  }
);

/**
 * POST /api/auth/webauthn/login/complete
 * Complete WebAuthn authentication
 */
router.post(
  '/webauthn/login/complete',
  rateLimiters.auth,
  validate({
    body: Joi.object({
      challenge: Joi.string().required(),
      credentialId: Joi.string().required(),
      signature: schemas.base64,
      authenticatorData: schemas.base64,
    }),
  }),
  (req: Request, res: Response) => {
    try {
      const { challenge, credentialId, signature, authenticatorData } = req.body;
      
      const userId = verifyAuthentication(
        challenge,
        credentialId,
        signature,
        authenticatorData
      );

      if (!userId) {
        res.status(401).json({
          success: false,
          error: 'Authentication verification failed',
        });
        return;
      }

      const token = createSession(userId, {
        authMethod: 'webauthn',
      });

      res.json({
        success: true,
        token,
        userId,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Authentication failed',
      });
    }
  }
);

/**
 * POST /api/auth/wallet/challenge
 * Generate wallet authentication challenge
 */
router.post(
  '/wallet/challenge',
  rateLimiters.auth,
  validate({
    body: Joi.object({
      address: schemas.walletAddress,
    }),
  }),
  (req: Request, res: Response) => {
    try {
      const { address } = req.body;
      const challenge = generateWalletChallenge(address);

      res.json({
        success: true,
        message: challenge.message,
        nonce: challenge.nonce,
        expiresAt: challenge.expiresAt,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Challenge generation failed',
      });
    }
  }
);

/**
 * POST /api/auth/wallet/login
 * Authenticate with wallet signature
 */
router.post(
  '/wallet/login',
  rateLimiters.auth,
  validate({
    body: Joi.object({
      address: schemas.walletAddress,
      signature: Joi.string().required(),
      message: Joi.string().required(),
    }),
  }),
  (req: Request, res: Response) => {
    try {
      const { address, signature, message } = req.body;
      
      const verified = verifyWalletSignature(address, signature, message);

      if (!verified) {
        res.status(401).json({
          success: false,
          error: 'Signature verification failed',
        });
        return;
      }

      const token = createSession(address, {
        walletAddress: address,
        authMethod: 'wallet',
      });

      res.json({
        success: true,
        token,
        userId: address,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Authentication failed',
      });
    }
  }
);

/**
 * POST /api/auth/qr/generate
 * Generate QR code for pairing
 */
router.post(
  '/qr/generate',
  authenticate,
  rateLimiters.api,
  validate({
    body: Joi.object({
      deviceId: Joi.string().required(),
    }),
  }),
  (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = req.user!.userId;
      const { deviceId } = req.body;
      
      const { code, qrData } = generateQRCodeData(userId, deviceId);

      res.json({
        success: true,
        code,
        qrData,
        expiresAt: Date.now() + 10 * 60 * 1000,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'QR generation failed',
      });
    }
  }
);

/**
 * POST /api/auth/qr/verify
 * Verify QR pairing code
 */
router.post(
  '/qr/verify',
  rateLimiters.auth,
  validate({
    body: Joi.object({
      code: Joi.string().length(6).required(),
    }),
  }),
  (req: Request, res: Response) => {
    try {
      const { code } = req.body;
      const pairing = verifyQRPairingCode(code);

      if (!pairing) {
        res.status(400).json({
          success: false,
          error: 'Invalid or expired pairing code',
        });
        return;
      }

      const token = createSession(pairing.userId, {
        authMethod: 'qr',
      });

      res.json({
        success: true,
        token,
        userId: pairing.userId,
        deviceId: pairing.deviceId,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Pairing verification failed',
      });
    }
  }
);

/**
 * GET /api/auth/me
 * Get current user session
 */
router.get(
  '/me',
  authenticate,
  (req: AuthenticatedRequest, res: Response) => {
    res.json({
      success: true,
      user: req.user,
    });
  }
);

/**
 * POST /api/auth/logout
 * Logout and revoke session
 */
router.post(
  '/logout',
  authenticate,
  (req: AuthenticatedRequest, res: Response) => {
    const token = req.headers.authorization?.substring(7);
    
    if (token) {
      // Revoke session (implement in session.ts)
      res.json({
        success: true,
        message: 'Logged out successfully',
      });
    } else {
      res.json({
        success: true,
        message: 'Already logged out',
      });
    }
  }
);

export default router;
