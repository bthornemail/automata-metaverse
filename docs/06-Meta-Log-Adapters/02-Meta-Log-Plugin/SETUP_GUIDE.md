---
id: meta-log-plugin-setup-guide
title: "Meta-Log Plugin Setup Guide"
level: practical
type: guide
tags: [meta-log-plugin, setup, installation, npm-link, development]
keywords: [meta-log-plugin-setup, npm-link-setup, package-development, typescript-setup, plugin-infrastructure]
prerequisites: [meta-log-plugin-readme, meta-log-db-setup-guide]
enables: [meta-log-plugin-api]
related: [meta-log-db-setup, opencode-readme]
readingTime: 45
difficulty: 3
blackboard:
  status: active
  assignedAgent: null
  lastUpdate: null
  dependencies: [meta-log-db]
  watchers: []
  r5rsEngine: "r5rs-canvas-engine.scm"
  selfBuilding:
    enabled: true
    source: "r5rs-canvas-engine.scm"
    pattern: "blackboard-architecture"
    regeneration:
      function: "r5rs:parse-jsonl-canvas"
      args: ["generate.metaverse.jsonl"]
---

# Meta-Log Plugin Setup Guide

Step-by-step guide for creating and setting up the `meta-log-plugin` native package.

## Prerequisites

- Node.js 18+ and npm
- TypeScript 5.0+
- `meta-log-db` package (linked)
- Basic understanding of npm linking

## Step 1: Create Package Structure

```bash
# Create package directory
mkdir -p plugin/meta-log-plugin
cd plugin/meta-log-plugin

# Initialize npm package
npm init -y
```

## Step 2: Configure package.json

Edit `package.json`:

```json
{
  "name": "meta-log-plugin",
  "version": "1.0.0",
  "description": "Native plugin package for Meta-Log (common interface for OpenCode and Obsidian)",
  "main": "dist/index.js",
  "types": "dist/index.d.ts",
  "files": [
    "dist",
    "README.md"
  ],
  "scripts": {
    "build": "tsc",
    "watch": "tsc --watch",
    "clean": "rm -rf dist",
    "prepublishOnly": "npm run build",
    "test": "jest"
  },
  "keywords": [
    "meta-log",
    "plugin",
    "opencode",
    "obsidian",
    "common-interface"
  ],
  "author": "Automaton System",
  "license": "MIT",
  "dependencies": {
    "meta-log-db": "^1.0.0"
  },
  "peerDependencies": {
    "@opencode-ai/plugin": "^1.0.0"
  },
  "devDependencies": {
    "@types/node": "^20.0.0",
    "typescript": "^5.0.0",
    "jest": "^29.0.0",
    "@types/jest": "^29.0.0"
  },
  "engines": {
    "node": ">=18.0.0"
  }
}
```

## Step 3: Link Database Package

```bash
# First, ensure meta-log-db is linked
cd ../meta-log-db
npm link

# Then link it in plugin package
cd ../meta-log-plugin
npm link meta-log-db
```

## Step 4: Create TypeScript Configuration

Create `tsconfig.json`:

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "commonjs",
    "lib": ["ES2020"],
    "outDir": "./dist",
    "rootDir": "./src",
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "moduleResolution": "node"
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist", "**/*.test.ts"]
}
```

## Step 5: Create Source Structure

```bash
mkdir -p src/{core,adapters,utils}
mkdir -p types
```

## Step 6: Create Base Plugin Class

Create `src/core/plugin.ts`:

```typescript
import { MetaLogDb, MetaLogDbConfig } from 'meta-log-db';
import { EventEmitter } from '../utils/events.js';
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
    this.db = config.db || new MetaLogDb({
      enableProlog: config.enableProlog ?? true,
      enableDatalog: config.enableDatalog ?? true
    });
    this.configManager = new ConfigManager();
  }

  abstract onLoad(): Promise<void>;
  abstract onUnload(): Promise<void>;
  abstract onEnable(): Promise<void>;
  abstract onDisable(): Promise<void>;

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

## Step 7: Create Adapters

### OpenCode Adapter

Create `src/adapters/opencode.ts`:

```typescript
import { BaseMetaLogPlugin, PluginConfig } from '../core/plugin.js';

export class OpenCodeMetaLogPlugin extends BaseMetaLogPlugin {
  async onLoad(): Promise<void> {
    if (this.config.canvasPath) {
      await this.db.loadCanvas(this.config.canvasPath);
    }
  }

  async onUnload(): Promise<void> {
    // Cleanup
  }

  async onEnable(): Promise<void> {
    // Enable functionality
  }

  async onDisable(): Promise<void> {
    // Disable functionality
  }
}
```

### Obsidian Adapter

Create `src/adapters/obsidian.ts`:

```typescript
import { BaseMetaLogPlugin, PluginConfig } from '../core/plugin.js';

export interface ObsidianPlugin extends Plugin {
  app: any;
  manifest: any;
}

export class ObsidianMetaLogPlugin extends BaseMetaLogPlugin implements ObsidianPlugin {
  app: any;
  manifest: any;

  constructor(app: any, manifest: any, config: PluginConfig) {
    super(config);
    this.app = app;
    this.manifest = manifest;
  }

  async onLoad(): Promise<void> {
    if (this.config.canvasPath) {
      await this.db.loadCanvas(this.config.canvasPath);
    }
  }

  async onUnload(): Promise<void> {
    // Cleanup
  }

  async onEnable(): Promise<void> {
    // Enable functionality
  }

  async onDisable(): Promise<void> {
    // Disable functionality
  }
}
```

## Step 8: Create Utilities

### Event Emitter

Create `src/utils/events.ts`:

```typescript
export class EventEmitter {
  private listeners: Map<string, Function[]> = new Map();

  on(event: string, handler: Function): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event)!.push(handler);
  }

  off(event: string, handler: Function): void {
    const handlers = this.listeners.get(event);
    if (handlers) {
      const index = handlers.indexOf(handler);
      if (index > -1) {
        handlers.splice(index, 1);
      }
    }
  }

  emit(event: string, ...args: any[]): void {
    const handlers = this.listeners.get(event) || [];
    handlers.forEach(handler => handler(...args));
  }
}
```

### Config Manager

Create `src/utils/config.ts`:

```typescript
import * as fs from 'fs';
import * as path from 'path';

export class ConfigManager {
  private configPath: string;

  constructor(configPath?: string) {
    this.configPath = configPath || './meta-log-config.json';
  }

  async load(): Promise<any> {
    if (fs.existsSync(this.configPath)) {
      const data = fs.readFileSync(this.configPath, 'utf-8');
      return JSON.parse(data);
    }
    return {};
  }

  async save(config: any): Promise<void> {
    fs.writeFileSync(
      this.configPath,
      JSON.stringify(config, null, 2),
      'utf-8'
    );
  }
}
```

## Step 9: Create Main Export

Create `src/index.ts`:

```typescript
export { BaseMetaLogPlugin, PluginConfig } from './core/plugin.js';
export { OpenCodeMetaLogPlugin } from './adapters/opencode.js';
export { ObsidianMetaLogPlugin } from './adapters/obsidian.js';
export * from './utils/events.js';
export * from './utils/config.js';
```

## Step 10: Install Dependencies

```bash
npm install
```

## Step 11: Build Package

```bash
npm run build
```

## Step 12: Create npm Link

```bash
npm link
```

## Step 13: Use in Plugins

### OpenCode Plugin

```bash
cd .opencode/plugin
npm link meta-log-db
npm link meta-log-plugin
```

Usage:

```typescript
import { OpenCodeMetaLogPlugin } from 'meta-log-plugin';

const plugin = new OpenCodeMetaLogPlugin({
  canvasPath: './automaton-kernel.jsonl'
});

await plugin.onLoad();
```

### Obsidian Plugin

```bash
cd .obsidian/plugins/universal-life-protocol-plugin
npm link meta-log-db
npm link meta-log-plugin
```

Usage:

```typescript
import { ObsidianMetaLogPlugin } from 'meta-log-plugin';

export default class UniversalLifeProtocolPlugin extends ObsidianMetaLogPlugin {
  async onLoad() {
    await super.onLoad();
    // Obsidian-specific setup
  }
}
```

## Development Workflow

```bash
# 1. Make changes to source files
# Edit src/**/*.ts

# 2. Rebuild
npm run build

# 3. Changes automatically available in linked plugins

# 4. Watch mode
npm run watch
```

## Testing

Create `src/core/plugin.test.ts`:

```typescript
import { BaseMetaLogPlugin } from './plugin.js';

class TestPlugin extends BaseMetaLogPlugin {
  async onLoad(): Promise<void> {}
  async onUnload(): Promise<void> {}
  async onEnable(): Promise<void> {}
  async onDisable(): Promise<void> {}
}

describe('BaseMetaLogPlugin', () => {
  test('should create instance', () => {
    const plugin = new TestPlugin({});
    expect(plugin).toBeDefined();
  });
});
```

## Troubleshooting

### Database Not Found

```bash
# Ensure meta-log-db is linked first
cd plugin/meta-log-db
npm link

# Then link in plugin
cd ../meta-log-plugin
npm link meta-log-db
```

### Type Errors

Ensure both packages are built:

```bash
cd plugin/meta-log-db
npm run build

cd ../meta-log-plugin
npm run build
```

---

**See Also**:
- [Meta-Log Plugin API Documentation](./API.md)
- [Meta-Log Database Setup Guide](../01-Meta-Log-Db/SETUP_GUIDE.md)
