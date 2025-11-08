/**
 * Example usage of ObsidianMetaLogPlugin
 * 
 * This file demonstrates how to use the plugin in an Obsidian environment
 */

import { ObsidianMetaLogPlugin } from '../adapters/obsidian.js';

/**
 * Example Obsidian plugin extending ObsidianMetaLogPlugin
 */
export default class ExampleObsidianPlugin extends ObsidianMetaLogPlugin {
  async onLoad() {
    // Call parent onLoad
    await super.onLoad();

    // Load settings
    await this.loadSettings();

    // Add Obsidian-specific UI
    this.addRibbonIcon('meta-log', 'Meta-Log', () => {
      this.openMetaLogView();
    });

    // Register commands
    this.addCommand({
      id: 'meta-log-query',
      name: 'Execute Meta-Log Query',
      callback: () => {
        this.executeQuery();
      }
    });
  }

  async onUnload() {
    // Save settings before unloading
    await this.saveSettings();
    
    // Call parent onUnload
    await super.onUnload();
  }

  private addRibbonIcon(icon: string, tooltip: string, callback: () => void) {
    // Obsidian-specific: Add ribbon icon
    // This would typically use this.app.workspace methods
    console.log(`Adding ribbon icon: ${icon}`);
  }

  private addCommand(command: { id: string; name: string; callback: () => void }) {
    // Obsidian-specific: Add command
    // This would typically use this.app.commands.addCommand
    console.log(`Adding command: ${command.name}`);
  }

  private openMetaLogView() {
    // Open Meta-Log view in Obsidian
    console.log('Opening Meta-Log view');
  }

  private async executeQuery() {
    try {
      const results = await this.getDb().prologQuery('(node ?Id ?Type)');
      console.log('Query results:', results);
    } catch (error) {
      console.error('Query error:', error);
    }
  }
}
