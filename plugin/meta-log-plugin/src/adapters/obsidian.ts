import { BaseMetaLogPlugin, PluginConfig } from '../core/plugin.js';
import { BaseMetaLogView } from '../views/base-view.js';

/**
 * Obsidian plugin interface (minimal type definition)
 */
export interface ObsidianPlugin {
  app: any;
  manifest: any;
  onload?(): void | Promise<void>;
  onunload?(): void | Promise<void>;
  registerView?(viewType: string, viewCreator: (leaf: any) => any): void;
  addRibbonIcon(icon: string, tooltip: string, callback: () => void): HTMLElement;
  addCommand?(command: { id: string; name: string; callback: () => void }): void;
}

/**
 * View registration information
 */
export interface ViewRegistration {
  viewType: string;
  displayText: string;
  icon: string;
  viewCreator: (leaf: any, plugin: ObsidianMetaLogPlugin) => BaseMetaLogView;
}

/**
 * Obsidian adapter for Meta-Log plugin
 */
export class ObsidianMetaLogPlugin extends BaseMetaLogPlugin implements ObsidianPlugin {
  app: any;
  manifest: any;
  private settingsPath: string;
  private registeredViews: Map<string, ViewRegistration> = new Map();

  constructor(app: any, manifest: any, config: PluginConfig) {
    super(config);
    this.app = app;
    this.manifest = manifest;
    this.settingsPath = `${app.vault.configDir}/meta-log-settings.json`;
    
    // Update config manager to use Obsidian vault
    this.configManager.setConfigPath(this.settingsPath);
  }

  /**
   * Load plugin - load canvas and settings
   */
  async onLoad(): Promise<void> {
    this.setEnabled(false);
    
    // Load settings
    await this.loadSettings();
    
    // Load canvas if path provided
    const canvasPath = this.config.canvasPath || 
      `${this.app.vault.configDir}/automaton-kernel.jsonl`;
    
    try {
      await this.loadCanvas(canvasPath);
    } catch (error) {
      console.warn('Could not load canvas:', error);
    }
  }

  /**
   * Unload plugin - cleanup resources
   */
  async onUnload(): Promise<void> {
    await this.saveSettings();
    this.setEnabled(false);
  }

  /**
   * Enable plugin functionality
   */
  async onEnable(): Promise<void> {
    this.setEnabled(true);
    await this.saveSettings();
    this.emit('enabled');
  }

  /**
   * Disable plugin functionality
   */
  async onDisable(): Promise<void> {
    this.setEnabled(false);
    await this.saveSettings();
    this.emit('disabled');
  }

  /**
   * Load settings from Obsidian vault
   */
  async loadSettings(): Promise<void> {
    try {
      const data = await this.app.vault.adapter.read(this.settingsPath);
      const settings = JSON.parse(data);
      this.config = { ...this.config, ...settings };
    } catch (error) {
      // Settings file doesn't exist, use defaults
      console.log('No existing settings found, using defaults');
    }
  }

  /**
   * Save settings to Obsidian vault
   */
  async saveSettings(): Promise<void> {
    try {
      const settings = {
        canvasPath: this.config.canvasPath,
        enableProlog: this.config.enableProlog,
        enableDatalog: this.config.enableDatalog,
        enableRdf: this.config.enableRdf,
        enableShacl: this.config.enableShacl,
      };
      
      await this.app.vault.adapter.write(
        this.settingsPath,
        JSON.stringify(settings, null, 2)
      );
    } catch (error) {
      console.error('Error saving settings:', error);
    }
  }

  /**
   * Get Obsidian app instance
   */
  getApp(): any {
    return this.app;
  }

  /**
   * Get plugin manifest
   */
  getManifest(): any {
    return this.manifest;
  }

  /**
   * Register a view with Obsidian
   */
  registerView(viewType: string, viewCreator: (leaf: any) => any): void {
    if (this.app && typeof this.app.workspace !== 'undefined') {
      // Use Obsidian's registerView if available
      if (typeof (this as any).registerView === 'function') {
        (this as any).registerView(viewType, viewCreator);
      } else if (this.app.workspace && typeof this.app.workspace.registerLeafView === 'function') {
        this.app.workspace.registerLeafView(viewType, viewCreator);
      }
    }
  }

  /**
   * Register a Meta-Log view
   * 
   * This creates an Obsidian ItemView wrapper that uses BaseMetaLogView.
   * The wrapper implements the ItemView interface required by Obsidian.
   */
  registerMetaLogView(registration: ViewRegistration): void {
    this.registeredViews.set(registration.viewType, registration);

    // Register with Obsidian if plugin is loaded
    if (this.app && typeof this.app.workspace !== 'undefined') {
      this.registerView(registration.viewType, (leaf: any) => {
        // Create the Meta-Log view instance
        const metaLogView = registration.viewCreator(leaf, this);
        
        // Get container element from leaf (Obsidian structure)
        const containerEl = leaf.containerEl || leaf.view?.containerEl;
        if (!containerEl) {
          throw new Error('Container element not found in leaf');
        }
        
        // Return an object that implements ItemView interface
        // This matches Obsidian's ItemView requirements
        return {
          containerEl: containerEl,
          getViewType: () => registration.viewType,
          getDisplayText: () => registration.displayText,
          getIcon: () => registration.icon,
          onOpen: async () => {
            // Store reference to metaLogView in leaf for cleanup
            leaf.metaLogView = metaLogView;
            await metaLogView.onOpen();
          },
          onClose: async () => {
            if (leaf.metaLogView) {
              await leaf.metaLogView.onClose();
              delete leaf.metaLogView;
            }
          }
        };
      });
    }
  }

  /**
   * Activate a view by type
   */
  async activateView(viewType: string): Promise<void> {
    if (!this.app || !this.app.workspace) {
      throw new Error('Obsidian workspace not available');
    }

    const registration = this.registeredViews.get(viewType);
    if (!registration) {
      throw new Error(`View type ${viewType} not registered`);
    }

    // Check if view is already open
    const leaves = this.app.workspace.getLeavesOfType(viewType);
    if (leaves.length > 0) {
      // View already open, reveal it
      this.app.workspace.revealLeaf(leaves[0]);
      return;
    }

    // Create new leaf
    const leaf = this.app.workspace.getLeaf(false);
    await leaf.setViewState({
      type: viewType,
      active: true
    });
    this.app.workspace.revealLeaf(leaf);
  }

  /**
   * Get all registered views
   */
  getRegisteredViews(): ViewRegistration[] {
    return Array.from(this.registeredViews.values());
  }

  /**
   * Add ribbon icon (Obsidian-specific)
   */
  addRibbonIcon(icon: string, tooltip: string, callback: () => void): HTMLElement {
    if (this.app && typeof (this as any).addRibbonIcon === 'function') {
      return (this as any).addRibbonIcon(icon, tooltip, callback);
    }
    // Return a dummy element if not available (shouldn't happen in Obsidian)
    const dummy = document.createElement('div');
    dummy.style.display = 'none';
    return dummy;
  }

  /**
   * Add command (Obsidian-specific)
   */
  addCommand(command: { id: string; name: string; callback: () => void }): void {
    if (this.app && typeof (this as any).addCommand === 'function') {
      (this as any).addCommand(command);
    }
  }
}
