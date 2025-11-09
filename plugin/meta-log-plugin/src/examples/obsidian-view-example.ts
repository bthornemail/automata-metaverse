/**
 * Example Obsidian plugin with Meta-Log view integration
 * 
 * This demonstrates how to use the BaseMetaLogView interface
 */

import { ObsidianMetaLogPlugin, ViewRegistration } from '../adapters/obsidian.js';
import { BaseMetaLogView } from '../views/base-view.js';
import { MetaLogView } from '../views/meta-log-view.js';
import { FunctionsView } from '../views/functions-view.js';
import { BasesView } from '../views/bases-view.js';

/**
 * Example custom view extending BaseMetaLogView
 */
class CustomMetaLogView extends BaseMetaLogView {
  getViewType(): string {
    return 'custom-meta-log-view';
  }

  getDisplayText(): string {
    return 'Custom Meta-Log View';
  }

  getIcon(): string {
    return 'database';
  }

  async onOpen(): Promise<void> {
    // Clear container
    this.containerEl.empty();
    
    const container = this.createContainer();
    const content = this.createContent(container);

    // Add custom content
    const title = content.createEl('h2', {
      text: 'Custom Meta-Log View'
    });

    const info = content.createEl('p', {
      text: 'This is a custom view extending BaseMetaLogView'
    });

    // Add query button
    const toolbar = this.createToolbar(container);
    this.createButton(toolbar, 'Query Database', () => {
      this.executeQuery();
    });
  }

  private async executeQuery(): Promise<void> {
    try {
      const facts = this.getDb().extractFacts();
      this.showNotice(`Found ${facts.length} facts`);
    } catch (error) {
      this.showNotice(`Error: ${error}`, 5000);
    }
  }
}

/**
 * Example Obsidian plugin using Meta-Log views
 */
export default class ExampleObsidianPlugin extends ObsidianMetaLogPlugin {
  async onLoad() {
    await super.onLoad();
    await this.loadSettings();

    // Register default Meta-Log view
    this.registerMetaLogView({
      viewType: 'meta-log-view',
      displayText: 'Meta-Log',
      icon: 'database',
      viewCreator: (leaf: any, plugin: ObsidianMetaLogPlugin) => {
        return new MetaLogView(plugin, leaf);
      }
    });

    // Register custom view
    this.registerMetaLogView({
      viewType: 'custom-meta-log-view',
      displayText: 'Custom Meta-Log',
      icon: 'database',
      viewCreator: (leaf: any, plugin: ObsidianMetaLogPlugin) => {
        return new CustomMetaLogView(plugin, leaf);
      }
    });

    // Add ribbon icon to open Meta-Log view
    this.addRibbonIcon('database', 'Open Meta-Log View', () => {
      this.activateView('meta-log-view');
    });

    // Add command to open view
    this.addCommand({
      id: 'open-meta-log-view',
      name: 'Open Meta-Log View',
      callback: () => {
        this.activateView('meta-log-view');
      }
    });
  }
}

/**
 * Example using Obsidian functions
 */
export class ExampleFunctionsPlugin extends ObsidianMetaLogPlugin {
  async onLoad() {
    await super.onLoad();
    await this.loadSettings();

    // Register functions view
    this.registerMetaLogView({
      viewType: 'meta-log-functions-view',
      displayText: 'Meta-Log Functions',
      icon: 'function',
      viewCreator: (leaf, plugin) => new FunctionsView(plugin, leaf)
    });

    // Add ribbon icon
    this.addRibbonIcon('function', 'Open Functions View', () => {
      this.activateView('meta-log-functions-view');
    });
  }
}

/**
 * Example using Obsidian bases
 */
export class ExampleBasesPlugin extends ObsidianMetaLogPlugin {
  async onLoad() {
    await super.onLoad();
    await this.loadSettings();

    // Register bases view
    this.registerMetaLogView({
      viewType: 'meta-log-bases-view',
      displayText: 'Meta-Log Bases',
      icon: 'table',
      viewCreator: (leaf, plugin) => new BasesView(plugin, leaf)
    });

    // Add ribbon icon
    this.addRibbonIcon('table', 'Open Bases View', () => {
      this.activateView('meta-log-bases-view');
    });
  }
}
