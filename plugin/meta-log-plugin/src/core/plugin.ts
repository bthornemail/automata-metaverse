import { MetaLogDb, MetaLogDbConfig } from 'meta-log-db';
import { EventEmitter } from '../utils/events.js';
import { ConfigManager } from '../utils/config.js';
import { StateManager } from '../utils/state.js';
import { 
  MetaLogError, 
  DatabaseError, 
  QueryError, 
  ConfigurationError, 
  CanvasError,
  ErrorRecovery,
  ErrorLogger
} from '../utils/errors.js';
import { ConfigValidator } from '../utils/config-validator.js';
import { ValidationError } from '../utils/errors.js';
import { HealthChecker, HealthCheckResult } from '../utils/health.js';
import { PerformanceMonitor, PerformanceStats } from '../utils/performance.js';

/**
 * Plugin configuration interface
 */
export interface PluginConfig {
  db?: MetaLogDb;
  canvasPath?: string;
  enableProlog?: boolean;
  enableDatalog?: boolean;
  enableRdf?: boolean;
  enableShacl?: boolean;
  configPath?: string;
}

/**
 * Base plugin class providing common functionality for all adapters
 */
export abstract class BaseMetaLogPlugin extends EventEmitter {
  protected db: MetaLogDb;
  protected config: PluginConfig;
  protected configManager: ConfigManager;
  protected state: StateManager;
  protected configValidator: ConfigValidator;
  protected healthChecker: HealthChecker;
  protected performanceMonitor: PerformanceMonitor;
  private enabled: boolean = false;

  constructor(config: PluginConfig) {
    super();
    
    // Initialize config validator
    this.configValidator = new ConfigValidator();
    
    // Validate configuration
    const validation = this.configValidator.validate(config);
    if (!validation.valid) {
      const configError = new ConfigurationError(
        `Configuration validation failed: ${validation.errors.map(e => e.message).join('; ')}`,
        undefined,
        { errors: validation.errors }
      );
      ErrorLogger.log(configError);
      throw configError;
    }

    // Apply defaults and sanitize
    const sanitizedConfig = this.configValidator.sanitize(
      this.configValidator.applyDefaults(config)
    );
    this.config = sanitizedConfig;
    
    try {
      // Initialize database
      if (config.db) {
        this.db = config.db;
      } else {
        const dbConfig: MetaLogDbConfig = {
          enableProlog: config.enableProlog ?? true,
          enableDatalog: config.enableDatalog ?? true,
          enableRdf: config.enableRdf ?? true,
          enableShacl: config.enableShacl ?? true,
        };
        this.db = new MetaLogDb(dbConfig);
      }

      // Initialize config manager
      this.configManager = new ConfigManager(config.configPath);
      
      // Initialize state manager
      this.state = new StateManager();

      // Initialize health checker
      this.healthChecker = new HealthChecker(this.db);

      // Initialize performance monitor
      this.performanceMonitor = new PerformanceMonitor();
    } catch (error) {
      const dbError = new DatabaseError(
        `Failed to initialize database: ${error instanceof Error ? error.message : String(error)}`,
        { config }
      );
      ErrorLogger.log(dbError);
      throw dbError;
    }
  }

  /**
   * Lifecycle hooks - MUST be implemented by adapters
   */
  abstract onLoad(): Promise<void>;
  abstract onUnload(): Promise<void>;
  abstract onEnable(): Promise<void>;
  abstract onDisable(): Promise<void>;

  /**
   * Plugin hooks - can be overridden by adapters
   */
  async beforeQuery(query: string): Promise<string> {
    this.emit('beforeQuery', query);
    return query;
  }

  async afterQuery(query: string, results: any): Promise<any> {
    this.emit('afterQuery', query, results);
    return results;
  }

  async onCanvasUpdate(canvasPath: string): Promise<void> {
    this.emit('canvasUpdate', canvasPath);
    await this.db.loadCanvas(canvasPath);
  }

  async onFactExtraction(facts: any[]): Promise<void> {
    this.emit('factExtraction', facts);
  }

  /**
   * Common utility methods
   */
  getDb(): MetaLogDb {
    return this.db;
  }

  getConfig(): PluginConfig {
    return { ...this.config };
  }

  async updateConfig(updates: Partial<PluginConfig>): Promise<void> {
    this.config = { ...this.config, ...updates };
    await this.configManager.save(this.config);
    this.emit('configUpdate', this.config);
  }

  /**
   * Check if plugin is enabled
   */
  isEnabled(): boolean {
    return this.enabled;
  }

  /**
   * Set enabled state (internal use)
   */
  protected setEnabled(enabled: boolean): void {
    this.enabled = enabled;
  }

  /**
   * Get state manager
   */
  getState(): StateManager {
    return this.state;
  }

  /**
   * Load canvas file
   */
  async loadCanvas(canvasPath?: string): Promise<void> {
    const path = canvasPath || this.config.canvasPath;
    if (!path) {
      const error = new CanvasError('No canvas path provided');
      ErrorLogger.log(error);
      throw error;
    }

    try {
      await this.db.loadCanvas(path);
      await this.onCanvasUpdate(path);
    } catch (error) {
      const canvasError = new CanvasError(
        `Failed to load canvas: ${error instanceof Error ? error.message : String(error)}`,
        path
      );
      ErrorLogger.log(canvasError);
      
      // Attempt recovery
      const recovered = await ErrorRecovery.recover(canvasError);
      if (!recovered) {
        throw canvasError;
      }
    }
  }

  /**
   * Get error statistics
   */
  getErrorStatistics(): Record<string, any> {
    return ErrorLogger.getStatistics();
  }

  /**
   * Clear error log
   */
  clearErrorLog(): void {
    ErrorLogger.clear();
  }

  /**
   * Run health checks
   */
  async runHealthChecks(): Promise<HealthCheckResult> {
    return await this.healthChecker.runAll();
  }

  /**
   * Get health status
   */
  async getHealthStatus(): Promise<'healthy' | 'degraded' | 'unhealthy'> {
    return await this.healthChecker.getStatus();
  }

  /**
   * Validate configuration
   */
  validateConfig(config: Partial<PluginConfig>): { valid: boolean; errors: ValidationError[] } {
    return this.configValidator.validate(config);
  }

  /**
   * Get config validator
   */
  getConfigValidator(): ConfigValidator {
    return this.configValidator;
  }

  /**
   * Get performance statistics
   */
  getPerformanceStats(): PerformanceStats {
    return this.performanceMonitor.getStats();
  }

  /**
   * Record query performance
   */
  async recordQuery<T>(name: string, queryFn: () => Promise<T>): Promise<T> {
    return await this.performanceMonitor.recordQuery(name, queryFn);
  }

  /**
   * Record operation performance
   */
  async recordOperation<T>(name: string, operationFn: () => Promise<T>): Promise<T> {
    return await this.performanceMonitor.recordOperation(name, operationFn);
  }

  /**
   * Get performance monitor
   */
  getPerformanceMonitor(): PerformanceMonitor {
    return this.performanceMonitor;
  }
}
