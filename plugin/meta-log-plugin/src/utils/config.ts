import * as fs from 'fs';
import * as path from 'path';

/**
 * Configuration manager for plugin settings
 */
export class ConfigManager {
  private configPath: string;

  constructor(configPath?: string) {
    this.configPath = configPath || path.join(process.cwd(), 'meta-log-config.json');
  }

  /**
   * Load configuration from file
   */
  async load(): Promise<any> {
    try {
      if (fs.existsSync(this.configPath)) {
        const data = fs.readFileSync(this.configPath, 'utf-8');
        return JSON.parse(data);
      }
      return {};
    } catch (error) {
      console.error(`Error loading config from ${this.configPath}:`, error);
      return {};
    }
  }

  /**
   * Save configuration to file
   */
  async save(config: any): Promise<void> {
    try {
      const dir = path.dirname(this.configPath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      fs.writeFileSync(
        this.configPath,
        JSON.stringify(config, null, 2),
        'utf-8'
      );
    } catch (error) {
      console.error(`Error saving config to ${this.configPath}:`, error);
      throw error;
    }
  }

  /**
   * Get configuration path
   */
  getConfigPath(): string {
    return this.configPath;
  }

  /**
   * Set configuration path
   */
  setConfigPath(configPath: string): void {
    this.configPath = configPath;
  }
}
