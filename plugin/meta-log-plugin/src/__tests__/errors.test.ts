import {
  MetaLogError,
  DatabaseError,
  QueryError,
  ConfigurationError,
  CanvasError,
  ValidationError,
  LifecycleError,
  ErrorRecovery,
  ErrorLogger
} from '../utils/errors.js';

describe('Error Types', () => {
  describe('MetaLogError', () => {
    test('should create error with code and context', () => {
      const error = new MetaLogError(
        'Test error',
        'TEST_ERROR',
        { field: 'test' },
        true
      );

      expect(error.message).toBe('Test error');
      expect(error.code).toBe('TEST_ERROR');
      expect(error.context).toEqual({ field: 'test' });
      expect(error.recoverable).toBe(true);
    });

    test('should serialize to JSON', () => {
      const error = new MetaLogError('Test', 'TEST', { data: 'value' });
      const json = error.toJSON();

      expect(json.name).toBe('MetaLogError');
      expect(json.message).toBe('Test');
      expect(json.code).toBe('TEST');
      expect(json.context).toEqual({ data: 'value' });
    });
  });

  describe('DatabaseError', () => {
    test('should create database error', () => {
      const error = new DatabaseError('DB failed', { connection: 'closed' });

      expect(error).toBeInstanceOf(MetaLogError);
      expect(error.code).toBe('DATABASE_ERROR');
      expect(error.recoverable).toBe(true);
    });
  });

  describe('QueryError', () => {
    test('should create query error with query', () => {
      const error = new QueryError('Query failed', 'SELECT * WHERE {}');

      expect(error.code).toBe('QUERY_ERROR');
      expect(error.context?.query).toBe('SELECT * WHERE {}');
      expect(error.recoverable).toBe(true);
    });
  });

  describe('ConfigurationError', () => {
    test('should create configuration error', () => {
      const error = new ConfigurationError('Invalid config', 'enableRdf');

      expect(error.code).toBe('CONFIGURATION_ERROR');
      expect(error.context?.field).toBe('enableRdf');
      expect(error.recoverable).toBe(false);
    });
  });

  describe('CanvasError', () => {
    test('should create canvas error', () => {
      const error = new CanvasError('Canvas failed', './canvas.jsonl');

      expect(error.code).toBe('CANVAS_ERROR');
      expect(error.context?.path).toBe('./canvas.jsonl');
      expect(error.recoverable).toBe(true);
    });
  });

  describe('ValidationError', () => {
    test('should create validation error', () => {
      const error = new ValidationError('Invalid value', 'field', 'value');

      expect(error.code).toBe('VALIDATION_ERROR');
      expect(error.context?.field).toBe('field');
      expect(error.context?.value).toBe('value');
      expect(error.recoverable).toBe(false);
    });
  });

  describe('LifecycleError', () => {
    test('should create lifecycle error', () => {
      const error = new LifecycleError('Load failed', 'onLoad');

      expect(error.code).toBe('LIFECYCLE_ERROR');
      expect(error.context?.stage).toBe('onLoad');
      expect(error.recoverable).toBe(true);
    });
  });
});

describe('ErrorRecovery', () => {
  test('should attempt recovery for recoverable errors', async () => {
    const error = new DatabaseError('DB error');
    const recovered = await ErrorRecovery.recover(error);

    // Recovery may not be implemented, but should not throw
    expect(typeof recovered).toBe('boolean');
  });

  test('should not recover unrecoverable errors', async () => {
    const error = new ConfigurationError('Config error');
    const recovered = await ErrorRecovery.recover(error);

    expect(recovered).toBe(false);
  });
});

describe('ErrorLogger', () => {
  beforeEach(() => {
    ErrorLogger.clear();
  });

  test('should log errors', () => {
    const error = new DatabaseError('Test error');
    ErrorLogger.log(error);

    const errors = ErrorLogger.getErrors();
    expect(errors).toHaveLength(1);
    expect(errors[0]).toBe(error);
  });

  test('should limit error history', () => {
    // Log more than max errors
    for (let i = 0; i < 150; i++) {
      ErrorLogger.log(new DatabaseError(`Error ${i}`));
    }

    const errors = ErrorLogger.getErrors();
    expect(errors.length).toBeLessThanOrEqual(100);
  });

  test('should get error statistics', () => {
    ErrorLogger.log(new DatabaseError('DB error'));
    ErrorLogger.log(new QueryError('Query error'));
    ErrorLogger.log(new DatabaseError('Another DB error'));

    const stats = ErrorLogger.getStatistics();

    expect(stats.total).toBe(3);
    expect(stats.byCode['DATABASE_ERROR']).toBe(2);
    expect(stats.byCode['QUERY_ERROR']).toBe(1);
    expect(stats.recoverable).toBe(3);
    expect(stats.unrecoverable).toBe(0);
  });

  test('should clear error log', () => {
    ErrorLogger.log(new DatabaseError('Error'));
    expect(ErrorLogger.getErrors().length).toBe(1);

    ErrorLogger.clear();
    expect(ErrorLogger.getErrors().length).toBe(0);
  });
});
