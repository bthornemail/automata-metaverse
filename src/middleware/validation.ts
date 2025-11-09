/**
 * Input Validation Middleware
 * 
 * Validates request inputs using Joi schemas
 */

import { Request, Response, NextFunction } from 'express';
import Joi from 'joi';

export interface ValidationSchema {
  body?: Joi.ObjectSchema;
  query?: Joi.ObjectSchema;
  params?: Joi.ObjectSchema;
  headers?: Joi.ObjectSchema;
}

/**
 * Validation middleware
 */
export function validate(schema: ValidationSchema) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const errors: string[] = [];

    // Validate body
    if (schema.body) {
      const { error } = schema.body.validate(req.body);
      if (error) {
        errors.push(`Body: ${error.details.map(d => d.message).join(', ')}`);
      }
    }

    // Validate query
    if (schema.query) {
      const { error } = schema.query.validate(req.query);
      if (error) {
        errors.push(`Query: ${error.details.map(d => d.message).join(', ')}`);
      }
    }

    // Validate params
    if (schema.params) {
      const { error } = schema.params.validate(req.params);
      if (error) {
        errors.push(`Params: ${error.details.map(d => d.message).join(', ')}`);
      }
    }

    // Validate headers
    if (schema.headers) {
      const { error } = schema.headers.validate(req.headers);
      if (error) {
        errors.push(`Headers: ${error.details.map(d => d.message).join(', ')}`);
      }
    }

    if (errors.length > 0) {
      res.status(400).json({
        success: false,
        error: 'Validation error',
        details: errors,
      });
      return;
    }

    next();
  };
}

/**
 * Common validation schemas
 */
export const schemas = {
  // Email validation
  email: Joi.string().email().required(),
  
  // Wallet address validation
  walletAddress: Joi.string()
    .pattern(/^0x[a-fA-F0-9]{40}$/)
    .required()
    .messages({
      'string.pattern.base': 'Invalid Ethereum address format',
    }),

  // Message validation
  message: Joi.string().min(1).max(10000).required(),

  // Pagination
  pagination: {
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(20),
  },

  // UUID validation
  uuid: Joi.string().uuid().required(),

  // Base64 validation
  base64: Joi.string().base64().required(),
};
