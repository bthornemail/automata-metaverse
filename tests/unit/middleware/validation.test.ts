/**
 * Input Validation Middleware Unit Tests
 */

import { Request, Response, NextFunction } from 'express';
import Joi from 'joi';
import { validate, schemas } from '../../../src/middleware/validation';

describe('Input Validation', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: NextFunction;

  beforeEach(() => {
    mockRequest = {
      body: {},
      query: {},
      params: {},
      headers: {},
    };

    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };

    mockNext = jest.fn();
  });

  describe('validate', () => {
    it('should pass valid request', () => {
      mockRequest.body = { email: 'test@example.com' };
      const middleware = validate({
        body: Joi.object({
          email: schemas.email,
        }),
      });

      middleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(mockResponse.status).not.toHaveBeenCalled();
    });

    it('should reject invalid email', () => {
      mockRequest.body = { email: 'invalid-email' };
      const middleware = validate({
        body: Joi.object({
          email: schemas.email,
        }),
      });

      middleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalled();
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should validate wallet address', () => {
      mockRequest.body = {
        address: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb',
      };
      const middleware = validate({
        body: Joi.object({
          address: schemas.walletAddress,
        }),
      });

      middleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
    });

    it('should reject invalid wallet address', () => {
      mockRequest.body = { address: 'invalid-address' };
      const middleware = validate({
        body: Joi.object({
          address: schemas.walletAddress,
        }),
      });

      middleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should validate multiple fields', () => {
      mockRequest.body = {
        email: 'test@example.com',
        message: 'Hello world',
      };
      const middleware = validate({
        body: Joi.object({
          email: schemas.email,
          message: schemas.message,
        }),
      });

      middleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
    });

    it('should validate query parameters', () => {
      mockRequest.query = { page: '1', limit: '20' };
      const middleware = validate({
        query: Joi.object({
          page: schemas.pagination.page,
          limit: schemas.pagination.limit,
        }),
      });

      middleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
    });
  });

  describe('schemas', () => {
    it('should have email schema', () => {
      expect(schemas.email).toBeDefined();
    });

    it('should have walletAddress schema', () => {
      expect(schemas.walletAddress).toBeDefined();
    });

    it('should have message schema', () => {
      expect(schemas.message).toBeDefined();
    });

    it('should have pagination schemas', () => {
      expect(schemas.pagination).toBeDefined();
      expect(schemas.pagination.page).toBeDefined();
      expect(schemas.pagination.limit).toBeDefined();
    });
  });
});
