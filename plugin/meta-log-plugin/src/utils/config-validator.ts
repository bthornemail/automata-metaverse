/**
 * Configuration Validator for Meta-Log Plugin
 * Provides schema validation, type checking, and required fields validation
 */

import { PluginConfig } from '../core/plugin.js';
import { ValidationError } from './errors.js';

/**
 * Configuration schema definition
 */
export interface ConfigSchema {
  fields: Record<string, FieldSchema>;
  required?: string[];
  dependencies?: Record<string, string[]>;
}

export interface FieldSchema {
  type: 'string' | 'number' | 'boolean' | 'object' | 'array' | 'path' | 'url';
  required?: boolean;
  default?: any;
  min?: number;
  max?: number;
  pattern?: RegExp;
  enum?: any[];
  validate?: (value: any) => boolean | string;
  message?: string;
}

/**
 * Default configuration schema
 */
const DEFAULT_SCHEMA: ConfigSchema = {
  fields: {
    canvasPath: {
      type: 'path',
      required: false,
      validate: (value: string) => {
        if (!value) return true; // Optional
        // Check if path is valid (basic check)
        if (typeof value !== 'string') {
          return 'Canvas path must be a string';
        }
        if (value.length === 0) {
          return 'Canvas path cannot be empty';
        }
        return true;
      },
      message: 'Canvas path must be a valid file path'
    },
    enableProlog: {
      type: 'boolean',
      required: false,
      default: true
    },
    enableDatalog: {
      type: 'boolean',
      required: false,
      default: true
    },
    enableRdf: {
      type: 'boolean',
      required: false,
      default: true
    },
    enableShacl: {
      type: 'boolean',
      required: false,
      default: true
    },
    configPath: {
      type: 'path',
      required: false,
      validate: (value: string) => {
        if (!value) return true; // Optional
        if (typeof value !== 'string') {
          return 'Config path must be a string';
        }
        return true;
      },
      message: 'Config path must be a valid file path'
    }
  },
  required: [],
  dependencies: {
    enableShacl: ['enableRdf'] // SHACL requires RDF
  }
};

/**
 * Configuration Validator
 */
export class ConfigValidator {
  private schema: ConfigSchema;

  constructor(schema?: ConfigSchema) {
    this.schema = schema || DEFAULT_SCHEMA;
  }

  /**
   * Validate configuration object
   */
  validate(config: Partial<PluginConfig>): { valid: boolean; errors: ValidationError[] } {
    const errors: ValidationError[] = [];

    // Validate required fields
    if (this.schema.required) {
      for (const field of this.schema.required) {
        if (!(field in config) || config[field as keyof PluginConfig] === undefined) {
          errors.push(new ValidationError(
            `Required field '${field}' is missing`,
            field
          ));
        }
      }
    }

    // Validate each field
    for (const [fieldName, value] of Object.entries(config)) {
      const fieldSchema = this.schema.fields[fieldName];
      
      if (!fieldSchema) {
        // Unknown field - warn but don't error
        console.warn(`Unknown configuration field: ${fieldName}`);
        continue;
      }

      const fieldError = this.validateField(fieldName, value, fieldSchema);
      if (fieldError) {
        errors.push(fieldError);
      }
    }

    // Validate dependencies
    if (this.schema.dependencies) {
      for (const [field, dependencies] of Object.entries(this.schema.dependencies)) {
        if (config[field as keyof PluginConfig]) {
          for (const dep of dependencies) {
            if (!config[dep as keyof PluginConfig]) {
              errors.push(new ValidationError(
                `Field '${field}' requires '${dep}' to be enabled`,
                field,
                config[field as keyof PluginConfig],
                { dependency: dep }
              ));
            }
          }
        }
      }
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * Validate a single field
   */
  private validateField(fieldName: string, value: any, schema: FieldSchema): ValidationError | null {
    // Check type
    const typeError = this.checkType(fieldName, value, schema.type);
    if (typeError) {
      return typeError;
    }

    // Check required
    if (schema.required && (value === undefined || value === null)) {
      return new ValidationError(
        `Field '${fieldName}' is required`,
        fieldName,
        value
      );
    }

    // Skip further validation if value is undefined/null and not required
    if (value === undefined || value === null) {
      return null;
    }

    // Check min/max for numbers
    if (schema.type === 'number' && typeof value === 'number') {
      if (schema.min !== undefined && value < schema.min) {
        return new ValidationError(
          `Field '${fieldName}' must be at least ${schema.min}`,
          fieldName,
          value
        );
      }
      if (schema.max !== undefined && value > schema.max) {
        return new ValidationError(
          `Field '${fieldName}' must be at most ${schema.max}`,
          fieldName,
          value
        );
      }
    }

    // Check min/max for strings/arrays
    if ((schema.type === 'string' || schema.type === 'array') && typeof value === 'string') {
      if (schema.min !== undefined && value.length < schema.min) {
        return new ValidationError(
          `Field '${fieldName}' must be at least ${schema.min} characters`,
          fieldName,
          value
        );
      }
      if (schema.max !== undefined && value.length > schema.max) {
        return new ValidationError(
          `Field '${fieldName}' must be at most ${schema.max} characters`,
          fieldName,
          value
        );
      }
    }

    // Check pattern
    if (schema.pattern && typeof value === 'string') {
      if (!schema.pattern.test(value)) {
        return new ValidationError(
          schema.message || `Field '${fieldName}' does not match required pattern`,
          fieldName,
          value
        );
      }
    }

    // Check enum
    if (schema.enum && !schema.enum.includes(value)) {
      return new ValidationError(
        `Field '${fieldName}' must be one of: ${schema.enum.join(', ')}`,
        fieldName,
        value
      );
    }

    // Check custom validator
    if (schema.validate) {
      const result = schema.validate(value);
      if (result !== true) {
        return new ValidationError(
          typeof result === 'string' ? result : schema.message || `Field '${fieldName}' validation failed`,
          fieldName,
          value
        );
      }
    }

    return null;
  }

  /**
   * Check type of value
   */
  private checkType(fieldName: string, value: any, expectedType: string): ValidationError | null {
    if (value === undefined || value === null) {
      return null; // Let required check handle this
    }

    let actualType: string;
    
    switch (expectedType) {
      case 'string':
        actualType = typeof value;
        break;
      case 'number':
        actualType = typeof value;
        break;
      case 'boolean':
        actualType = typeof value;
        break;
      case 'object':
        actualType = Array.isArray(value) ? 'array' : typeof value;
        break;
      case 'array':
        actualType = Array.isArray(value) ? 'array' : typeof value;
        break;
      case 'path':
        actualType = typeof value; // Paths are strings
        break;
      case 'url':
        actualType = typeof value; // URLs are strings
        break;
      default:
        return null;
    }

    if (actualType !== expectedType && !(expectedType === 'path' && actualType === 'string') && !(expectedType === 'url' && actualType === 'string')) {
      return new ValidationError(
        `Field '${fieldName}' must be of type ${expectedType}, got ${actualType}`,
        fieldName,
        value
      );
    }

    return null;
  }

  /**
   * Apply defaults to configuration
   */
  applyDefaults(config: Partial<PluginConfig>): PluginConfig {
    const result: PluginConfig = { ...config };

    for (const [fieldName, schema] of Object.entries(this.schema.fields)) {
      if (!(fieldName in result) && schema.default !== undefined) {
        (result as any)[fieldName] = schema.default;
      }
    }

    return result;
  }

  /**
   * Sanitize configuration (remove invalid fields)
   */
  sanitize(config: Partial<PluginConfig>): PluginConfig {
    const sanitized: PluginConfig = {} as PluginConfig;

    for (const [fieldName, value] of Object.entries(config)) {
      if (this.schema.fields[fieldName]) {
        (sanitized as any)[fieldName] = value;
      }
    }

    return sanitized;
  }

  /**
   * Get schema
   */
  getSchema(): ConfigSchema {
    return { ...this.schema };
  }

  /**
   * Set custom schema
   */
  setSchema(schema: ConfigSchema): void {
    this.schema = schema;
  }
}
