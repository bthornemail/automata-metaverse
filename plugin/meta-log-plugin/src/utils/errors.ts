/**
 * Enhanced Error Handling for Meta-Log Plugin
 * Provides structured error types and error recovery mechanisms
 */

/**
 * Base error class for all plugin errors
 */
export class MetaLogError extends Error {
  public readonly code: string;
  public readonly context?: Record<string, any>;
  public readonly recoverable: boolean;

  constructor(
    message: string,
    code: string,
    context?: Record<string, any>,
    recoverable: boolean = false
  ) {
    super(message);
    this.name = 'MetaLogError';
    this.code = code;
    this.context = context;
    this.recoverable = recoverable;
    Error.captureStackTrace(this, this.constructor);
  }

  /**
   * Convert error to JSON
   */
  toJSON(): Record<string, any> {
    return {
      name: this.name,
      message: this.message,
      code: this.code,
      context: this.context,
      recoverable: this.recoverable,
      stack: this.stack
    };
  }
}

/**
 * Database connection error
 */
export class DatabaseError extends MetaLogError {
  constructor(message: string, context?: Record<string, any>) {
    super(message, 'DATABASE_ERROR', context, true);
    this.name = 'DatabaseError';
  }
}

/**
 * Query execution error
 */
export class QueryError extends MetaLogError {
  constructor(message: string, query?: string, context?: Record<string, any>) {
    super(message, 'QUERY_ERROR', { query, ...context }, true);
    this.name = 'QueryError';
  }
}

/**
 * Configuration error
 */
export class ConfigurationError extends MetaLogError {
  constructor(message: string, field?: string, context?: Record<string, any>) {
    super(message, 'CONFIGURATION_ERROR', { field, ...context }, false);
    this.name = 'ConfigurationError';
  }
}

/**
 * Canvas loading error
 */
export class CanvasError extends MetaLogError {
  constructor(message: string, path?: string, context?: Record<string, any>) {
    super(message, 'CANVAS_ERROR', { path, ...context }, true);
    this.name = 'CanvasError';
  }
}

/**
 * Validation error
 */
export class ValidationError extends MetaLogError {
  constructor(message: string, field?: string, value?: any, context?: Record<string, any>) {
    super(message, 'VALIDATION_ERROR', { field, value, ...context }, false);
    this.name = 'ValidationError';
  }
}

/**
 * Plugin lifecycle error
 */
export class LifecycleError extends MetaLogError {
  constructor(message: string, stage?: string, context?: Record<string, any>) {
    super(message, 'LIFECYCLE_ERROR', { stage, ...context }, true);
    this.name = 'LifecycleError';
  }
}

/**
 * Error recovery handler
 */
export class ErrorRecovery {
  /**
   * Attempt to recover from an error
   */
  static async recover(error: MetaLogError): Promise<boolean> {
    if (!error.recoverable) {
      return false;
    }

    switch (error.code) {
      case 'DATABASE_ERROR':
        return await this.recoverDatabaseError(error as DatabaseError);
      case 'QUERY_ERROR':
        return await this.recoverQueryError(error as QueryError);
      case 'CANVAS_ERROR':
        return await this.recoverCanvasError(error as CanvasError);
      case 'LIFECYCLE_ERROR':
        return await this.recoverLifecycleError(error as LifecycleError);
      default:
        return false;
    }
  }

  /**
   * Recover from database error
   */
  private static async recoverDatabaseError(error: DatabaseError): Promise<boolean> {
    // Attempt to reconnect or reinitialize database
    // This is a placeholder - actual implementation would depend on the database
    console.warn('Attempting to recover from database error:', error.message);
    return false; // Return false if recovery not implemented
  }

  /**
   * Recover from query error
   */
  private static async recoverQueryError(error: QueryError): Promise<boolean> {
    // Query errors are usually not recoverable, but we can log them
    console.warn('Query error:', error.message, error.context);
    return false;
  }

  /**
   * Recover from canvas error
   */
  private static async recoverCanvasError(error: CanvasError): Promise<boolean> {
    // Attempt to reload canvas or use fallback
    console.warn('Attempting to recover from canvas error:', error.message);
    return false; // Return false if recovery not implemented
  }

  /**
   * Recover from lifecycle error
   */
  private static async recoverLifecycleError(error: LifecycleError): Promise<boolean> {
    // Attempt to retry lifecycle operation
    console.warn('Attempting to recover from lifecycle error:', error.message);
    return false; // Return false if recovery not implemented
  }
}

/**
 * Error logger
 */
export class ErrorLogger {
  private static errors: MetaLogError[] = [];
  private static maxErrors: number = 100;

  /**
   * Log an error
   */
  static log(error: Error | MetaLogError): void {
    const metaLogError = error instanceof MetaLogError 
      ? error 
      : new MetaLogError(error.message, 'UNKNOWN_ERROR', {}, false);

    this.errors.push(metaLogError);
    
    // Keep only recent errors
    if (this.errors.length > this.maxErrors) {
      this.errors.shift();
    }

    // Log to console
    console.error('Meta-Log Error:', metaLogError.toJSON());
  }

  /**
   * Get all logged errors
   */
  static getErrors(): MetaLogError[] {
    return [...this.errors];
  }

  /**
   * Clear error log
   */
  static clear(): void {
    this.errors = [];
  }

  /**
   * Get error statistics
   */
  static getStatistics(): Record<string, any> {
    const stats: Record<string, any> = {
      total: this.errors.length,
      byCode: {} as Record<string, number>,
      recoverable: 0,
      unrecoverable: 0
    };

    for (const error of this.errors) {
      stats.byCode[error.code] = (stats.byCode[error.code] || 0) + 1;
      if (error.recoverable) {
        stats.recoverable++;
      } else {
        stats.unrecoverable++;
      }
    }

    return stats;
  }
}
