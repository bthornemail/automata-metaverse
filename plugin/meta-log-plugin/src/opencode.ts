/**
 * Meta-Log Plugin - OpenCode Entry Point
 * 
 * OpenCode-specific exports only (excludes Obsidian-specific code)
 */

// Core exports
export { BaseMetaLogPlugin, PluginConfig } from './core/plugin.js';
export { PluginHooks, PluginLifecycle } from './core/hooks.js';
export { LifecycleManager, LifecycleState } from './core/lifecycle.js';

// OpenCode adapter export
export { OpenCodeMetaLogPlugin } from './adapters/opencode.js';

// Utility exports
export { EventEmitter } from './utils/events.js';
export { ConfigManager } from './utils/config.js';
export { StateManager } from './utils/state.js';

// Type exports
export * from './types/index.js';
