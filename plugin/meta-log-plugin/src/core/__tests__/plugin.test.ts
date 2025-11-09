import { BaseMetaLogPlugin, PluginConfig } from '../plugin';
import { MetaLogDb } from 'meta-log-db';

/**
 * Mock implementation for testing
 */
class TestPlugin extends BaseMetaLogPlugin {
  async onLoad(): Promise<void> {
    this.setEnabled(true);
  }

  async onUnload(): Promise<void> {
    this.setEnabled(false);
  }

  async onEnable(): Promise<void> {
    this.setEnabled(true);
  }

  async onDisable(): Promise<void> {
    this.setEnabled(false);
  }
}

describe('BaseMetaLogPlugin', () => {
  let plugin: TestPlugin;
  const config: PluginConfig = {
    canvasPath: './test-canvas.jsonl',
    enableProlog: true,
    enableDatalog: true,
    enableRdf: true,
  };

  beforeEach(() => {
    plugin = new TestPlugin(config);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Initialization', () => {
    test('should initialize with config', () => {
      expect(plugin.getConfig()).toEqual(config);
    });

    test('should have database instance', () => {
      const db = plugin.getDb();
      expect(db).toBeInstanceOf(MetaLogDb);
    });

    test('should be disabled by default', () => {
      expect(plugin.isEnabled()).toBe(false);
    });
  });

  describe('Lifecycle', () => {
    test('should load plugin', async () => {
      await plugin.onLoad();
      expect(plugin.isEnabled()).toBe(true);
    });

    test('should unload plugin', async () => {
      await plugin.onLoad();
      await plugin.onUnload();
      expect(plugin.isEnabled()).toBe(false);
    });

    test('should enable plugin', async () => {
      await plugin.onEnable();
      expect(plugin.isEnabled()).toBe(true);
    });

    test('should disable plugin', async () => {
      await plugin.onEnable();
      await plugin.onDisable();
      expect(plugin.isEnabled()).toBe(false);
    });
  });

  describe('Configuration', () => {
    test('should get config', () => {
      const retrievedConfig = plugin.getConfig();
      expect(retrievedConfig).toEqual(config);
    });

    test('should update config', async () => {
      const updates = { enableProlog: false };
      await plugin.updateConfig(updates);
      const updatedConfig = plugin.getConfig();
      expect(updatedConfig.enableProlog).toBe(false);
      expect(updatedConfig.enableDatalog).toBe(true); // Unchanged
    });
  });

  describe('Events', () => {
    test('should enable plugin', async () => {
      await plugin.onEnable();
      expect(plugin.isEnabled()).toBe(true);
    });

    test('should disable plugin', async () => {
      await plugin.onEnable();
      await plugin.onDisable();
      expect(plugin.isEnabled()).toBe(false);
    });

    // Note: BaseMetaLogPlugin doesn't emit 'enabled'/'disabled' events
    // Only adapter implementations do (e.g., OpenCodeMetaLogPlugin)
  });
});
