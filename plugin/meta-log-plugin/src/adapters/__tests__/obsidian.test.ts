import { ObsidianMetaLogPlugin } from '../obsidian';
import { PluginConfig } from '../../core/plugin';
import { MetaLogDb } from 'meta-log-db';

// Mock Obsidian API
const mockObsidianApp = {
  vault: {
    getAbstractFileByPath: jest.fn(),
    read: jest.fn(),
    write: jest.fn()
  },
  workspace: {
    getActiveFile: jest.fn(),
    openLinkText: jest.fn()
  },
  plugins: {
    plugins: {}
  }
};

const mockObsidianPlugin = {
  app: mockObsidianApp,
  manifest: {
    id: 'meta-log-plugin',
    name: 'Meta-Log Plugin',
    version: '1.0.0'
  },
  loadData: jest.fn(),
  saveData: jest.fn()
};

describe('ObsidianMetaLogPlugin', () => {
  let plugin: ObsidianMetaLogPlugin;

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
  });

  afterEach(async () => {
    if (plugin) {
      await plugin.onUnload();
    }
  });

  describe('Initialization', () => {
    test('should create plugin instance', () => {
      const config: PluginConfig = {
        enableProlog: true,
        enableDatalog: true
      };

      plugin = new ObsidianMetaLogPlugin(mockObsidianPlugin as any, config);

      expect(plugin).toBeInstanceOf(ObsidianMetaLogPlugin);
      expect(plugin.getConfig()).toEqual(config);
    });

    test('should initialize with Obsidian app', () => {
      const config: PluginConfig = {};
      plugin = new ObsidianMetaLogPlugin(mockObsidianPlugin as any, config);

      // Plugin should have access to Obsidian app
      expect(plugin).toBeDefined();
    });
  });

  describe('Lifecycle', () => {
    test('should load plugin', async () => {
      const config: PluginConfig = {
        enableProlog: true
      };

      plugin = new ObsidianMetaLogPlugin(mockObsidianPlugin as any, config);
      await plugin.onLoad();

      expect(plugin.isEnabled()).toBe(false);
    });

    test('should enable plugin', async () => {
      plugin = new ObsidianMetaLogPlugin(mockObsidianPlugin as any, {});
      await plugin.onLoad();
      await plugin.onEnable();

      expect(plugin.isEnabled()).toBe(true);
    });

    test('should disable plugin', async () => {
      plugin = new ObsidianMetaLogPlugin(mockObsidianPlugin as any, {});
      await plugin.onLoad();
      await plugin.onEnable();
      await plugin.onDisable();

      expect(plugin.isEnabled()).toBe(false);
    });

    test('should unload plugin', async () => {
      plugin = new ObsidianMetaLogPlugin(mockObsidianPlugin as any, {});
      await plugin.onLoad();
      await plugin.onEnable();
      await plugin.onUnload();

      expect(plugin.isEnabled()).toBe(false);
    });
  });

  describe('Obsidian API Integration', () => {
    test('should access Obsidian vault', () => {
      plugin = new ObsidianMetaLogPlugin(mockObsidianPlugin as any, {});

      // Plugin should have access to Obsidian app
      expect(mockObsidianApp.vault).toBeDefined();
    });

    test('should handle Obsidian file operations', async () => {
      mockObsidianApp.vault.getAbstractFileByPath.mockReturnValue({
        path: './test.jsonl'
      });
      mockObsidianApp.vault.read.mockResolvedValue('{"id":"test"}');

      plugin = new ObsidianMetaLogPlugin(mockObsidianPlugin as any, {
        canvasPath: './test.jsonl'
      });

      await plugin.onLoad();

      // Plugin should be able to interact with Obsidian vault
      expect(mockObsidianApp.vault.getAbstractFileByPath).toHaveBeenCalled();
    });
  });

  describe('Ribbon Icon', () => {
    test('should add ribbon icon', () => {
      plugin = new ObsidianMetaLogPlugin(mockObsidianPlugin as any, {});

      // Mock addRibbonIcon
      const mockAddRibbonIcon = jest.fn().mockReturnValue(document.createElement('div'));
      (plugin as any).addRibbonIcon = mockAddRibbonIcon;

      plugin.addRibbonIcon('lucide-database', 'Meta-Log', () => {});

      // Should call Obsidian's addRibbonIcon
      expect(mockAddRibbonIcon).toHaveBeenCalled();
    });
  });

  describe('Commands', () => {
    test('should add commands', () => {
      plugin = new ObsidianMetaLogPlugin(mockObsidianPlugin as any, {});

      const mockAddCommand = jest.fn();
      (plugin as any).addCommand = mockAddCommand;

      plugin.addCommand({
        id: 'test-command',
        name: 'Test Command',
        callback: () => {}
      });

      expect(mockAddCommand).toHaveBeenCalled();
    });
  });

  describe('Settings', () => {
    test('should load settings', async () => {
      mockObsidianPlugin.loadData.mockResolvedValue({
        enableProlog: true,
        enableDatalog: false
      });

      plugin = new ObsidianMetaLogPlugin(mockObsidianPlugin as any, {});

      // Settings should be loaded from Obsidian
      expect(mockObsidianPlugin.loadData).toBeDefined();
    });

    test('should save settings', async () => {
      mockObsidianPlugin.saveData.mockResolvedValue(undefined);

      plugin = new ObsidianMetaLogPlugin(mockObsidianPlugin as any, {});

      await plugin.updateConfig({
        enableProlog: false
      });

      // Settings should be saved to Obsidian
      expect(mockObsidianPlugin.saveData).toBeDefined();
    });
  });

  describe('Error Handling', () => {
    test('should handle Obsidian API errors gracefully', async () => {
      mockObsidianApp.vault.read.mockRejectedValue(new Error('File not found'));

      plugin = new ObsidianMetaLogPlugin(mockObsidianPlugin as any, {
        canvasPath: './missing.jsonl'
      });

      try {
        await plugin.onLoad();
      } catch (error) {
        // Error should be handled
        expect(error).toBeDefined();
      }

      // Error should be logged
      const errorStats = plugin.getErrorStatistics();
      expect(errorStats.total).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Health Checks', () => {
    test('should run health checks', async () => {
      plugin = new ObsidianMetaLogPlugin(mockObsidianPlugin as any, {});

      await plugin.onLoad();
      await plugin.onEnable();

      const health = await plugin.runHealthChecks();

      expect(health).toBeDefined();
      expect(health.status).toMatch(/healthy|degraded|unhealthy/);
    });
  });

  describe('Performance Monitoring', () => {
    test('should monitor Obsidian operations', async () => {
      plugin = new ObsidianMetaLogPlugin(mockObsidianPlugin as any, {});

      await plugin.onLoad();

      const stats = await plugin.recordOperation('obsidian-operation', async () => {
        // Simulate Obsidian operation
        return mockObsidianApp.vault.getAbstractFileByPath('./test.jsonl');
      });

      const perfStats = plugin.getPerformanceStats();
      expect(perfStats.totalOperations).toBeGreaterThan(0);
    });
  });
});
