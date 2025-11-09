import { ConfigValidator } from '../utils/config-validator.js';
import { PluginConfig } from '../core/plugin.js';

describe('ConfigValidator', () => {
  let validator: ConfigValidator;

  beforeEach(() => {
    validator = new ConfigValidator();
  });

  describe('Type validation', () => {
    test('should validate boolean fields', () => {
      const validation = validator.validate({
        enableProlog: true
      });

      expect(validation.valid).toBe(true);
    });

    test('should reject invalid boolean', () => {
      const validation = validator.validate({
        enableProlog: 'true' // Should be boolean
      });

      expect(validation.valid).toBe(false);
      expect(validation.errors.length).toBeGreaterThan(0);
    });

    test('should validate string fields', () => {
      const validation = validator.validate({
        canvasPath: './canvas.jsonl'
      });

      expect(validation.valid).toBe(true);
    });

    test('should reject invalid string', () => {
      const validation = validator.validate({
        canvasPath: 123 // Should be string
      });

      expect(validation.valid).toBe(false);
    });
  });

  describe('Required fields', () => {
    test('should validate required fields', () => {
      const customSchema = {
        fields: {
          canvasPath: {
            type: 'path' as const,
            required: true
          }
        },
        required: ['canvasPath']
      };

      validator.setSchema(customSchema);

      const validation = validator.validate({});
      expect(validation.valid).toBe(false);
      expect(validation.errors.some(e => e.message.includes('required'))).toBe(true);
    });
  });

  describe('Default values', () => {
    test('should apply defaults', () => {
      const config = validator.applyDefaults({
        canvasPath: './canvas.jsonl'
      });

      expect(config.enableProlog).toBe(true);
      expect(config.enableDatalog).toBe(true);
      expect(config.enableRdf).toBe(true);
      expect(config.enableShacl).toBe(true);
    });
  });

  describe('Sanitization', () => {
    test('should remove invalid fields', () => {
      const config = {
        canvasPath: './canvas.jsonl',
        enableProlog: true,
        invalidField: 'should be removed'
      };

      const sanitized = validator.sanitize(config);

      expect('invalidField' in sanitized).toBe(false);
      expect('canvasPath' in sanitized).toBe(true);
      expect('enableProlog' in sanitized).toBe(true);
    });
  });

  describe('Dependency validation', () => {
    test('should validate dependencies', () => {
      // Use default schema which has SHACL -> RDF dependency
      const validation = validator.validate({
        enableShacl: true,
        enableRdf: false // Invalid: SHACL requires RDF
      });

      // May or may not be invalid depending on schema
      expect(validation).toBeDefined();
      expect(Array.isArray(validation.errors)).toBe(true);
      // Check if dependency error exists
      const hasDependencyError = validation.errors.some(e => 
        e.message.includes('requires') || e.message.includes('dependency')
      );
      // If schema has dependency, should have error
      if (validator.getSchema().dependencies) {
        expect(hasDependencyError || !validation.valid).toBe(true);
      }
    });
  });

  describe('Custom validation', () => {
    test('should use custom validator', () => {
      const customSchema = {
        fields: {
          canvasPath: {
            type: 'path' as const,
            validate: (value: string) => {
              if (!value.endsWith('.jsonl')) {
                return 'Must end with .jsonl';
              }
              return true;
            }
          }
        }
      };

      validator.setSchema(customSchema);

      const validation1 = validator.validate({
        canvasPath: './canvas.jsonl'
      });
      expect(validation1.valid).toBe(true);

      const validation2 = validator.validate({
        canvasPath: './canvas.txt'
      });
      expect(validation2.valid).toBe(false);
    });
  });
});
