---
id: meta-log-plugin-readme
title: "Meta-Log Plugin Package"
level: foundational
type: guide
tags: [meta-log-plugin, native-package, npm-link, plugin-infrastructure, opencode, obsidian, common-interface]
keywords: [meta-log-plugin, native-plugin, npm-link, plugin-infrastructure, opencode-integration, obsidian-integration, common-interface, lifecycle-management, plugin-hooks]
prerequisites: [meta-log-adapters-readme, meta-log-db-readme]
enables: [meta-log-plugin-setup, meta-log-plugin-api]
related: [meta-log-db-docs, opencode-readme, blackboard-architecture-guide]
readingTime: 30
difficulty: 4
blackboard:
  status: active
  assignedAgent: null
  lastUpdate: null
  dependencies: [meta-log-db, r5rs-canvas-engine]
  watchers: []
  r5rsEngine: "r5rs-canvas-engine.scm"
  selfBuilding:
    enabled: true
    source: "r5rs-canvas-engine.scm"
    pattern: "blackboard-architecture"
    regeneration:
      function: "r5rs:parse-jsonl-canvas"
      args: ["generate.metaverse.jsonl"]
      context:
        module: "MODULE 2: JSONL Parser & Canvas Loader"
        functions: ["r5rs:parse-jsonl-canvas", "r5rs:extract-facts"]
  pluginFeatures:
    lifecycle: [onLoad, onUnload, onEnable, onDisable]
    hooks: [beforeQuery, afterQuery, onCanvasUpdate, onFactExtraction]
    integration: [opencode-adapter, obsidian-adapter]
    utilities: [config-manager, event-emitter, state-manager]
---

# Meta-Log Plugin Package

A native npm package providing common plugin infrastructure that can be `npm link`ed into both OpenCode and Obsidian plugins. This package provides a unified interface for plugin lifecycle management, hooks, and integration utilities.

## Overview

The Meta-Log Plugin package (`meta-log-plugin`) provides:

- **Common Plugin Interface** - Unified API for OpenCode and Obsidian
- **Lifecycle Management** - Load, unload, enable, disable hooks
- **Integration Hooks** - Before/after query, canvas update, fact extraction
- **Shared Utilities** - Config management, event emission, state management
- **Type Definitions** - TypeScript types for both platforms

## Package Structure

```
plugin/meta-log-plugin/
├── package.json
├── tsconfig.json
├── README.md
├── src/
│   ├── index.ts                 # Main export
│   ├── core/
│   │   ├── plugin.ts            # Base plugin class
│   │   ├── lifecycle.ts         # Lifecycle management
│   │   └── hooks.ts             # Plugin hooks system
│   ├── adapters/
│   │   ├── opencode.ts          # OpenCode adapter
│   │   └── obsidian.ts          # Obsidian adapter
│   ├── utils/
│   │   ├── config.ts            # Configuration management
│   │   ├── events.ts            # Event emitter
│   │   └── state.ts             # State management
│   └── types/
│       ├── opencode.d.ts        # OpenCode types
│       └── obsidian.d.ts        # Obsidian types
└── types/
    └── index.d.ts               # TypeScript definitions
```

## Installation & Setup

### 1. Create Package

```bash
mkdir -p plugin/meta-log-plugin
cd plugin/meta-log-plugin
npm init -y
```

### 2. Configure package.json

```json
{
  "name": "meta-log-plugin",
  "version": "1.0.0",
  "description": "Native plugin package for Meta-Log (common interface for OpenCode and Obsidian)",
  "main": "dist/index.js",
  "types": "dist/index.d.ts",
  "scripts": {
    "build": "tsc",
    "watch": "tsc --watch",
    "test": "jest"
  },
  "keywords": [
    "meta-log",
    "plugin",
    "opencode",
    "obsidian",
    "common-interface"
  ],
  "dependencies": {
    "meta-log-db": "^1.0.0"
  },
  "peerDependencies": {
    "@opencode-ai/plugin": "^1.0.0"
  },
  "devDependencies": {
    "@types/node": "^20.0.0",
    "typescript": "^5.0.0"
  }
}
```

### 3. Create Base Plugin Class

```typescript
// src/core/plugin.ts
import { MetaLogDb } from 'meta-log-db';
import { EventEmitter } from './events.js';
import { ConfigManager } from '../utils/config.js';

export interface PluginConfig {
  db?: MetaLogDb;
  canvasPath?: string;
  enableProlog?: boolean;
  enableDatalog?: boolean;
}

export abstract class BaseMetaLogPlugin extends EventEmitter {
  protected db: MetaLogDb;
  protected config: PluginConfig;
  protected configManager: ConfigManager;

  constructor(config: PluginConfig) {
    super();
    this.config = config;
    this.db = config.db || new MetaLogDb();
    this.configManager = new ConfigManager();
  }

  // Lifecycle hooks (to be implemented by adapters)
  abstract onLoad(): Promise<void>;
  abstract onUnload(): Promise<void>;
  abstract onEnable(): Promise<void>;
  abstract onDisable(): Promise<void>;

  // Plugin hooks
  async beforeQuery(query: string): Promise<string> {
    this.emit('beforeQuery', query);
    return query;
  }

  async afterQuery(query: string, results: any): Promise<any> {
    this.emit('afterQuery', query, results);
    return results;
  }

  async onCanvasUpdate(canvasPath: string): Promise<void> {
    this.emit('canvasUpdate', canvasPath);
    await this.db.loadCanvas(canvasPath);
  }

  async onFactExtraction(facts: any[]): Promise<void> {
    this.emit('factExtraction', facts);
  }

  // Common utilities
  getDb(): MetaLogDb {
    return this.db;
  }

  getConfig(): PluginConfig {
    return this.config;
  }

  async updateConfig(updates: Partial<PluginConfig>): Promise<void> {
    this.config = { ...this.config, ...updates };
    await this.configManager.save(this.config);
    this.emit('configUpdate', this.config);
  }
}
```

## OpenCode Adapter

```typescript
// src/adapters/opencode.ts
import { BaseMetaLogPlugin, PluginConfig } from '../core/plugin.js';
import { tool } from '@opencode-ai/plugin';

export class OpenCodeMetaLogPlugin extends BaseMetaLogPlugin {
  private tools: any[] = [];

  async onLoad(): Promise<void> {
    // Register OpenCode tools
    this.tools.push(
      tool({
        description: "Query Meta-Log database with ProLog",
        args: {
          query: tool.schema.string().describe("ProLog query string")
        },
        async execute(args, context) {
          const query = await this.beforeQuery(args.query);
          const results = await this.db.prologQuery(query);
          return await this.afterQuery(query, results);
        }
      })
    );
  }

  async onUnload(): Promise<void> {
    this.tools = [];
  }

  async onEnable(): Promise<void> {
    // Enable plugin functionality
  }

  async onDisable(): Promise<void> {
    // Disable plugin functionality
  }
}
```

## Obsidian Adapter

```typescript
// src/adapters/obsidian.ts
import { BaseMetaLogPlugin, PluginConfig } from '../core/plugin.js';
import { Plugin } from 'obsidian';

export class ObsidianMetaLogPlugin extends BaseMetaLogPlugin implements Plugin {
  app: any; // Obsidian App instance
  manifest: any;

  constructor(app: any, manifest: any, config: PluginConfig) {
    super(config);
    this.app = app;
    this.manifest = manifest;
  }

  async onLoad(): Promise<void> {
    // Load Obsidian-specific functionality
    await this.db.loadCanvas(
      this.app.vault.configDir + '/automaton-kernel.jsonl'
    );
  }

  async onUnload(): Promise<void> {
    // Cleanup Obsidian-specific resources
  }

  async onEnable(): Promise<void> {
    // Enable Obsidian plugin
  }

  async onDisable(): Promise<void> {
    // Disable Obsidian plugin
  }

  // Obsidian-specific methods
  async loadSettings(): Promise<void> {
    const data = await this.app.vault.adapter.read(
      this.app.vault.configDir + '/meta-log-settings.json'
    );
    this.config = JSON.parse(data);
  }

  async saveSettings(): Promise<void> {
    await this.app.vault.adapter.write(
      this.app.vault.configDir + '/meta-log-settings.json',
      JSON.stringify(this.config, null, 2)
    );
  }
}
```

## Common Utilities

### Config Manager

```typescript
// src/utils/config.ts
export class ConfigManager {
  private configPath: string;

  constructor(configPath?: string) {
    this.configPath = configPath || './meta-log-config.json';
  }

  async load(): Promise<any> {
    // Load configuration
  }

  async save(config: any): Promise<void> {
    // Save configuration
  }
}
```

### Event Emitter

```typescript
// src/utils/events.ts
export class EventEmitter {
  private listeners: Map<string, Function[]> = new Map();

  on(event: string, handler: Function): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event)!.push(handler);
  }

  emit(event: string, ...args: any[]): void {
    const handlers = this.listeners.get(event) || [];
    handlers.forEach(handler => handler(...args));
  }
}
```

## Usage Examples

### OpenCode Plugin Integration

```typescript
// .opencode/plugin/index.ts
import { OpenCodeMetaLogPlugin } from 'meta-log-plugin';

const plugin = new OpenCodeMetaLogPlugin({
  canvasPath: './automaton-kernel.jsonl',
  enableProlog: true,
  enableDatalog: true
});

await plugin.onLoad();

// Use plugin
plugin.on('beforeQuery', (query) => {
  console.log('Executing query:', query);
});
```

### Obsidian Plugin Integration

```typescript
// .obsidian/plugins/universal-life-protocol-plugin/src/main.ts
import { ObsidianMetaLogPlugin } from 'meta-log-plugin';

export default class UniversalLifeProtocolPlugin extends ObsidianMetaLogPlugin {
  async onLoad() {
    await super.onLoad();
    await this.loadSettings();
    
    // Add Obsidian-specific UI
    this.addRibbonIcon('meta-log', 'Meta-Log', () => {
      // Open Meta-Log view
    });
  }
}
```

## npm link Setup

### 1. Create Links

```bash
# Link database first (plugin depends on it)
cd plugin/meta-log-db
npm link

# Link plugin
cd ../meta-log-plugin
npm link
npm link meta-log-db
```

### 2. Use in Plugins

```bash
# In OpenCode plugin
cd .opencode/plugin
npm link meta-log-db
npm link meta-log-plugin

# In Obsidian plugin
cd .obsidian/plugins/universal-life-protocol-plugin
npm link meta-log-db
npm link meta-log-plugin
```

## Type Definitions

```typescript
// types/index.d.ts
export interface PluginConfig {
  db?: MetaLogDb;
  canvasPath?: string;
  enableProlog?: boolean;
  enableDatalog?: boolean;
  enableRdf?: boolean;
  enableShacl?: boolean;
}

export interface PluginLifecycle {
  onLoad(): Promise<void>;
  onUnload(): Promise<void>;
  onEnable(): Promise<void>;
  onDisable(): Promise<void>;
}

export interface PluginHooks {
  beforeQuery(query: string): Promise<string>;
  afterQuery(query: string, results: any): Promise<any>;
  onCanvasUpdate(canvasPath: string): Promise<void>;
  onFactExtraction(facts: any[]): Promise<void>;
}
```

## Common Interface API

Both OpenCode and Obsidian plugins use the same interface:

```typescript
// Common interface methods
plugin.getDb()                    // Get MetaLogDb instance
plugin.getConfig()                 // Get plugin configuration
plugin.updateConfig(updates)       // Update configuration
plugin.on(event, handler)         // Subscribe to events
plugin.emit(event, ...args)        // Emit events

// Query methods
plugin.db.prologQuery(query)      // Execute ProLog query
plugin.db.datalogQuery(query)    // Execute DataLog query
plugin.db.sparqlQuery(query)      // Execute SPARQL query

// Canvas methods
plugin.db.loadCanvas(path)        // Load JSONL/CanvasL canvas
plugin.db.parseJsonlCanvas(path)  // Parse JSONL file
plugin.db.parseCanvasL(path)      // Parse CanvasL file
```

## Development Workflow

```bash
# 1. Make changes to plugin package
cd plugin/meta-log-plugin
# Edit source files
npm run build

# 2. Changes automatically available in linked plugins
# (no need to re-link or reinstall)

# 3. Test in OpenCode plugin
cd .opencode/plugin
# Test functionality

# 4. Test in Obsidian plugin
cd .obsidian/plugins/universal-life-protocol-plugin
# Test functionality
```

## Benefits

- ✅ **Single Codebase** - Write once, use in both platforms
- ✅ **Type Safety** - Shared TypeScript types
- ✅ **Consistent API** - Same interface everywhere
- ✅ **Easy Updates** - Update package, all plugins benefit
- ✅ **Testing** - Test plugin infrastructure independently
- ✅ **Documentation** - Centralized plugin documentation

## Integration Points

- **Meta-Log Database** - Uses `meta-log-db` package
- **OpenCode Plugin** - Provides OpenCode adapter
- **Obsidian Plugin** - Provides Obsidian adapter
- **Blackboard Architecture** - Integrates with epistemic nodes
- **R5RS Canvas Engine** - Uses R5RS function registry

---

**See Also**:
- [Meta-Log Database Documentation](../01-Meta-Log-Db/)
- [Meta-Log Adapters Overview](../README.md)
- [OpenCode Plugin Documentation](../../.opencode/README.md)
