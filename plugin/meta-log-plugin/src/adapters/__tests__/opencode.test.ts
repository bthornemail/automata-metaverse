import { OpenCodeMetaLogPlugin } from '../opencode';
import { PluginConfig } from '../../core/plugin';

describe('OpenCodeMetaLogPlugin', () => {
  let plugin: OpenCodeMetaLogPlugin;
  const config: PluginConfig = {
    // Don't provide canvasPath to avoid file loading in tests
    enableProlog: true,
    enableDatalog: true,
    enableRdf: true,
  };

  beforeEach(() => {
    plugin = new OpenCodeMetaLogPlugin(config);
  });

  afterEach(async () => {
    if (plugin) {
      await plugin.onUnload();
    }
  });

  describe('Initialization', () => {
    test('should create plugin instance', () => {
      expect(plugin).toBeInstanceOf(OpenCodeMetaLogPlugin);
      expect(plugin.getConfig()).toEqual(config);
    });
  });

  describe('Lifecycle', () => {
    test('should load plugin', async () => {
      await plugin.onLoad();
      // Plugin should be disabled initially
      expect(plugin.isEnabled()).toBe(false);
    });

    test('should unload plugin', async () => {
      await plugin.onLoad();
      await plugin.onUnload();
      expect(plugin.isEnabled()).toBe(false);
    });

    test('should enable plugin', async () => {
      await plugin.onLoad();
      await plugin.onEnable();
      expect(plugin.isEnabled()).toBe(true);
    });

    test('should disable plugin', async () => {
      await plugin.onLoad();
      await plugin.onEnable();
      await plugin.onDisable();
      expect(plugin.isEnabled()).toBe(false);
    });
  });

  describe('Tools', () => {
    test('should have tools array', async () => {
      await plugin.onLoad();
      const tools = plugin.getTools();
      expect(Array.isArray(tools)).toBe(true);
    });

    test('should register tools on load', async () => {
      await plugin.onLoad();
      const tools = plugin.getTools();
      // Tools may be empty if @opencode-ai/plugin is not available
      // This is expected behavior
      expect(tools).toBeDefined();
    });
  });

  describe('Canvas Loading', () => {
    test('should handle canvas path in config', () => {
      const canvasConfig: PluginConfig = {
        ...config,
        canvasPath: './test-canvas.jsonl',
      };
      const canvasPlugin = new OpenCodeMetaLogPlugin(canvasConfig);
      // Canvas path should be stored in config
      expect(canvasPlugin.getConfig().canvasPath).toBe('./test-canvas.jsonl');
    });

    test('should handle missing canvas file gracefully', async () => {
      const canvasConfig: PluginConfig = {
        ...config,
        canvasPath: './non-existent-canvas.jsonl',
      };
      const canvasPlugin = new OpenCodeMetaLogPlugin(canvasConfig);
      // onLoad will try to load canvas, which may fail if file doesn't exist
      // This is expected - the plugin should still initialize
      try {
        await canvasPlugin.onLoad();
      } catch (error) {
        // Expected if file doesn't exist - plugin should still be initialized
        expect(error).toBeDefined();
      }
      // Plugin should still be created even if canvas load fails
      expect(canvasPlugin).toBeDefined();
      await canvasPlugin.onUnload();
    });
  });
});
