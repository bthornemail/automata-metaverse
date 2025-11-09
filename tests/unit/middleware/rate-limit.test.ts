/**
 * Rate Limiting Middleware Unit Tests
 */

import { Request, Response, NextFunction } from 'express';
import { rateLimit, rateLimiters } from '../../../src/middleware/rate-limit';

describe('Rate Limiting', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: NextFunction;

  beforeEach(() => {
    mockRequest = {
      ip: '127.0.0.1',
      headers: {},
      socket: {
        remoteAddress: '127.0.0.1',
      } as any,
    };

    mockResponse = {
      setHeader: jest.fn(),
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };

    mockNext = jest.fn();
  });

  describe('rateLimit', () => {
    it('should allow requests within limit', () => {
      const middleware = rateLimit({ windowMs: 1000, max: 5 });

      middleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(mockResponse.setHeader).toHaveBeenCalledWith('X-RateLimit-Limit', '5');
    });

    it('should block requests exceeding limit', () => {
      const middleware = rateLimit({ windowMs: 1000, max: 2 });

      // Make 2 requests (within limit)
      middleware(mockRequest as Request, mockResponse as Response, mockNext);
      middleware(mockRequest as Request, mockResponse as Response, mockNext);

      // Third request should be blocked
      middleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(429);
      expect(mockResponse.json).toHaveBeenCalled();
    });

    it('should set rate limit headers', () => {
      const middleware = rateLimit({ windowMs: 1000, max: 10 });

      middleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.setHeader).toHaveBeenCalledWith('X-RateLimit-Limit', '10');
      expect(mockResponse.setHeader).toHaveBeenCalledWith('X-RateLimit-Remaining', expect.any(String));
      expect(mockResponse.setHeader).toHaveBeenCalledWith('X-RateLimit-Reset', expect.any(String));
    });
  });

  describe('rateLimiters', () => {
    it('should have auth rate limiter', () => {
      expect(rateLimiters.auth).toBeDefined();
      expect(typeof rateLimiters.auth).toBe('function');
    });

    it('should have api rate limiter', () => {
      expect(rateLimiters.api).toBeDefined();
      expect(typeof rateLimiters.api).toBe('function');
    });

    it('should have strict rate limiter', () => {
      expect(rateLimiters.strict).toBeDefined();
      expect(typeof rateLimiters.strict).toBe('function');
    });
  });
});
