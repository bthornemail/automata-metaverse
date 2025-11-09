/**
 * Rate Limiting Middleware
 * 
 * Prevents DoS attacks and API abuse
 */

import { Request, Response, NextFunction } from 'express';

interface RateLimitConfig {
  windowMs: number;
  max: number;
  message?: string;
  skipSuccessfulRequests?: boolean;
}

interface RateLimitStore {
  [key: string]: {
    count: number;
    resetTime: number;
  };
}

// In-memory store (replace with Redis in production)
const store: RateLimitStore = {};

/**
 * Get client identifier
 */
function getClientId(req: Request): string {
  // Use IP address or user ID if authenticated
  const ip = req.ip || 
    (req.headers['x-forwarded-for']?.toString().split(',')[0] || '') || 
    (req.socket?.remoteAddress || '') || 
    'unknown';
  
  return ip;
}

/**
 * Rate limiting middleware
 */
export function rateLimit(config: RateLimitConfig) {
  const {
    windowMs = 15 * 60 * 1000, // 15 minutes
    max = 100,
    message = 'Too many requests, please try again later',
    skipSuccessfulRequests = false,
  } = config;

  return (req: Request, res: Response, next: NextFunction): void => {
    const clientId = getClientId(req);
    const now = Date.now();
    const key = `${clientId}:${Math.floor(now / windowMs)}`;

    // Get or create rate limit entry
    let entry = store[key];
    
    if (!entry || entry.resetTime < now) {
      entry = {
        count: 0,
        resetTime: now + windowMs,
      };
      store[key] = entry;
    }

    // Check limit
    if (entry.count >= max) {
      res.status(429).json({
        success: false,
        error: message,
        retryAfter: Math.ceil((entry.resetTime - now) / 1000),
      });
      return;
    }

    // Increment counter
    entry.count++;

    // Set rate limit headers
    res.setHeader('X-RateLimit-Limit', max.toString());
    res.setHeader('X-RateLimit-Remaining', Math.max(0, max - entry.count).toString());
    res.setHeader('X-RateLimit-Reset', new Date(entry.resetTime).toISOString());

    // Track response status if needed
    if (skipSuccessfulRequests) {
      const originalEnd = res.end.bind(res);
      res.on('finish', () => {
        if (res.statusCode < 400) {
          entry.count = Math.max(0, entry.count - 1);
        }
      });
    }

    next();
  };
}

/**
 * Cleanup expired entries
 */
function cleanupExpiredEntries(): void {
  const now = Date.now();
  
  for (const key in store) {
    if (store[key].resetTime < now) {
      delete store[key];
    }
  }
}

// Run cleanup every 5 minutes
setInterval(cleanupExpiredEntries, 5 * 60 * 1000);

/**
 * Pre-configured rate limiters
 */
export const rateLimiters = {
  // Strict rate limit for auth endpoints
  auth: rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 5, // 5 requests per 15 minutes
    message: 'Too many authentication attempts, please try again later',
  }),

  // General rate limit for public endpoints
  general: rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100, // 100 requests per 15 minutes
    message: 'Too many requests, please try again later',
  }),

  // Standard API rate limit
  api: rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100, // 100 requests per 15 minutes
    message: 'Too many requests, please try again later',
  }),

  // Strict rate limit for sensitive operations
  strict: rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 10, // 10 requests per hour
    message: 'Rate limit exceeded for this operation',
  }),
};
