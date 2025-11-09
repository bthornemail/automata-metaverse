/**
 * Security Configuration
 * 
 * Centralized security settings for the application
 */

export const securityConfig = {
  // CORS Configuration
  cors: {
    // Allowed origins - update with your domain
    allowedOrigins: process.env.ALLOWED_ORIGINS?.split(',') || [
      'https://universallifeprotocol.com',
      'https://www.universallifeprotocol.com',
      'http://localhost:5173', // Vite dev server
      'http://localhost:3000', // Production build
      'http://localhost:5555', // PM2 backend
    ],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  },

  // Rate Limiting Configuration
  rateLimit: {
    // General API rate limit
    api: {
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 100, // 100 requests per window
    },
    // Authentication endpoints (stricter)
    auth: {
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 5, // 5 requests per window
    },
    // Strict rate limit for sensitive operations
    strict: {
      windowMs: 60 * 60 * 1000, // 1 hour
      max: 10, // 10 requests per hour
    },
  },

  // JWT Configuration
  jwt: {
    secret: process.env.JWT_SECRET || 'change-me-in-production',
    expiresIn: '24h',
    algorithm: 'HS256',
  },

  // Session Configuration
  session: {
    duration: 24 * 60 * 60 * 1000, // 24 hours
    cleanupInterval: 60 * 60 * 1000, // 1 hour
  },

  // WebAuthn Configuration
  webauthn: {
    rpName: 'Universal Life Protocol',
    rpId: process.env.WEBAUTHN_RP_ID || 'universallifeprotocol.com',
    origin: process.env.WEBAUTHN_ORIGIN || 'https://universallifeprotocol.com',
    challengeTimeout: 5 * 60 * 1000, // 5 minutes
  },

  // QR Code Configuration
  qr: {
    codeLength: 6,
    expiresIn: 10 * 60 * 1000, // 10 minutes
  },

  // Wallet Authentication Configuration
  wallet: {
    challengeTimeout: 5 * 60 * 1000, // 5 minutes
    supportedChains: [1, 137, 42161], // Ethereum, Polygon, Arbitrum
  },
};
