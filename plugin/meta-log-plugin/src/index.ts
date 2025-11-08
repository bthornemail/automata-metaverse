/**
 * Meta-Log Plugin - Main Export
 * 
 * Common plugin infrastructure for OpenCode and Obsidian adapters
 */

// Core exports
export { BaseMetaLogPlugin, PluginConfig } from './core/plugin.js';
export { PluginHooks, PluginLifecycle } from './core/hooks.js';
export { LifecycleManager, LifecycleState } from './core/lifecycle.js';

// Adapter exports
export { OpenCodeMetaLogPlugin } from './adapters/opencode.js';
export { ObsidianMetaLogPlugin, ObsidianPlugin, ViewRegistration } from './adapters/obsidian.js';

// View exports
export { BaseMetaLogView } from './views/base-view.js';
export { MetaLogView } from './views/meta-log-view.js';
export { MarkdownView } from './views/markdown-view.js';
export { FunctionsView } from './views/functions-view.js';
export { BasesView } from './views/bases-view.js';
export { ObsidianMarkdownRenderer } from './views/markdown-renderer.js';
export { ObsidianFunctions } from './views/obsidian-functions.js';
export { 
  ObsidianBasesParser, 
  BaseFile, 
  BaseField, 
  BaseRow, 
  BaseEmbedOptions, 
  BaseFilter, 
  BaseSort 
} from './views/bases-parser.js';

// Utility exports
export { EventEmitter } from './utils/events.js';
export { ConfigManager } from './utils/config.js';
export { StateManager } from './utils/state.js';

// Type exports
export * from './types/index.js';
