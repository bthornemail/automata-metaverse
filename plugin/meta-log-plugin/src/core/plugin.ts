import { MetaLogDb, MetaLogDbConfig } from 'meta-log-db';
import { EventEmitter } from '../utils/events.js';
import { ConfigManager } from '../utils/config.js';
import { StateManager } from '../utils/state.js';

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
  private enabled: boolean = false;

  constructor(config: PluginConfig) {
    super();
    this.config = config;
    
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
      throw new Error('No canvas path provided');
    }
    await this.db.loadCanvas(path);
    await this.onCanvasUpdate(path);
  }
}
