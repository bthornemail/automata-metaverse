import { ObsidianMetaLogPlugin } from '../adapters/obsidian.js';

// Forward declarations
type ObsidianMarkdownRenderer = import('./markdown-renderer.js').ObsidianMarkdownRenderer;
type ObsidianFunctions = import('./obsidian-functions.js').ObsidianFunctions;
type ObsidianBasesParser = import('./bases-parser.js').ObsidianBasesParser;

/**
 * Base view class for Meta-Log Obsidian views
 * 
 * This class provides a wrapper around Obsidian's ItemView pattern.
 * In actual Obsidian plugins, views extend ItemView directly, but this
 * base class provides common functionality and helper methods.
 */
export abstract class BaseMetaLogView {
  protected plugin: ObsidianMetaLogPlugin;
  protected containerEl: HTMLElement;
  protected leaf: any; // WorkspaceLeaf

  constructor(plugin: ObsidianMetaLogPlugin, leaf: any) {
    this.plugin = plugin;
    this.leaf = leaf;
    // Get container element from leaf
    this.containerEl = leaf.containerEl || leaf.view?.containerEl || leaf.contentEl;
    if (!this.containerEl) {
      throw new Error('Container element not found in leaf');
    }
  }

  /**
   * Get the view type identifier
   * Must be implemented by subclasses
   */
  abstract getViewType(): string;

  /**
   * Get the display text for the view
   * Must be implemented by subclasses
   */
  abstract getDisplayText(): string;

  /**
   * Get the icon for the view
   * Must be implemented by subclasses
   */
  abstract getIcon(): string;

  /**
   * Called when the view is opened
   * Must be implemented by subclasses
   */
  abstract onOpen(): Promise<void>;

  /**
   * Called when the view is closed
   * Can be overridden by subclasses
   */
  async onClose(): Promise<void> {
    // Default: no cleanup needed
  }

  /**
   * Get the plugin instance
   */
  getPlugin(): ObsidianMetaLogPlugin {
    return this.plugin;
  }

  /**
   * Get the database instance
   */
  getDb() {
    return this.plugin.getDb();
  }

  /**
   * Emit an event through the plugin
   */
  emit(event: string, ...args: any[]): void {
    this.plugin.emit(event, ...args);
  }

  /**
   * Initialize container element
   * Obsidian views have containerEl.children[1] as the content area
   */
  protected initializeContainer(): HTMLElement {
    // Obsidian ItemView structure: containerEl.children[1] is the content area
    let contentArea: HTMLElement;
    if (this.containerEl.children.length > 1) {
      contentArea = this.containerEl.children[1] as HTMLElement;
    } else {
      contentArea = this.containerEl.createEl('div');
    }
    
    contentArea.empty();
    contentArea.addClass('meta-log-view-container');
    contentArea.style.display = 'flex';
    contentArea.style.flexDirection = 'column';
    contentArea.style.height = '100%';
    return contentArea;
  }

  /**
   * Create a container element with common styling
   */
  protected createContainer(): HTMLElement {
    const container = this.containerEl.createEl('div', {
      cls: 'meta-log-view-container'
    });
    container.style.display = 'flex';
    container.style.flexDirection = 'column';
    container.style.height = '100%';
    return container;
  }

  /**
   * Create a toolbar element
   */
  protected createToolbar(container: HTMLElement): HTMLElement {
    const toolbar = container.createEl('div', {
      cls: 'meta-log-view-toolbar'
    });
    toolbar.style.padding = '8px';
    toolbar.style.borderBottom = '1px solid var(--background-modifier-border)';
    return toolbar;
  }

  /**
   * Create a content area
   */
  protected createContent(container: HTMLElement): HTMLElement {
    const content = container.createEl('div', {
      cls: 'meta-log-view-content'
    });
    content.style.flex = '1';
    content.style.overflow = 'auto';
    content.style.padding = '16px';
    return content;
  }

  /**
   * Show a notice using Obsidian's notice system
   */
  protected showNotice(message: string, duration?: number): void {
    // Note: This requires Obsidian's Notice class
    // In actual implementation, would use: new Notice(message, duration)
    console.log(`[Meta-Log] ${message}`);
  }

  /**
   * Get markdown renderer for Obsidian syntax
   */
  protected getMarkdownRenderer(): import('./markdown-renderer.js').ObsidianMarkdownRenderer {
    const { ObsidianMarkdownRenderer } = require('./markdown-renderer.js');
    return new ObsidianMarkdownRenderer(this.plugin);
  }

  /**
   * Render markdown content with Obsidian syntax support
   */
  protected async renderMarkdown(
    content: string,
    container: HTMLElement,
    sourcePath?: string
  ): Promise<void> {
    const renderer = this.getMarkdownRenderer();
    await renderer.renderMarkdown(content, container, sourcePath);
  }

  /**
   * Get Obsidian functions interface
   */
  protected getFunctions(): ObsidianFunctions {
    // Dynamic import to avoid circular dependencies
    const { ObsidianFunctions } = require('./obsidian-functions.js');
    return new ObsidianFunctions(this.plugin);
  }

  /**
   * Execute Obsidian function
   */
  protected async executeFunction(functionName: string, ...args: any[]): Promise<any> {
    const functions = this.getFunctions();
    return await functions.execute(functionName, ...args);
  }

  /**
   * Get Obsidian bases parser
   */
  protected getBasesParser(): ObsidianBasesParser {
    // Dynamic import to avoid circular dependencies
    const { ObsidianBasesParser } = require('./bases-parser.js');
    return new ObsidianBasesParser(this.plugin);
  }

  /**
   * Create a button with common styling
   */
  protected createButton(
    container: HTMLElement,
    text: string,
    onClick: () => void,
    options?: { cls?: string; icon?: string }
  ): HTMLElement {
    const button = container.createEl('button', {
      text,
      cls: options?.cls || 'mod-cta'
    });
    button.onclick = onClick;
    return button;
  }
}
