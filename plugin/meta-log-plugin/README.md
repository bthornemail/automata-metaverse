# Meta-Log Plugin Package

A native npm package providing common plugin infrastructure that can be `npm link`ed into both OpenCode and Obsidian plugins. This package provides a unified interface for plugin lifecycle management, hooks, and integration utilities.

## Overview

The Meta-Log Plugin package (`meta-log-plugin`) provides:

- **Common Plugin Interface** - Unified API for OpenCode and Obsidian
- **Lifecycle Management** - Load, unload, enable, disable hooks
- **Integration Hooks** - Before/after query, canvas update, fact extraction
- **Shared Utilities** - Config management, event emission, state management
- **Type Definitions** - TypeScript types for both platforms

## Installation & Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Link Database Package

```bash
# First, ensure meta-log-db is linked
cd ../meta-log-db
npm link

# Then link it in plugin package
cd ../meta-log-plugin
npm link meta-log-db
```

### 3. Build Package

```bash
npm run build
```

### 4. Create npm Link

```bash
npm link
```

## Usage

### OpenCode Plugin Integration

```typescript
import { OpenCodeMetaLogPlugin } from 'meta-log-plugin';

const plugin = new OpenCodeMetaLogPlugin({
  canvasPath: './automaton-kernel.jsonl',
  enableProlog: true,
  enableDatalog: true
});

await plugin.onLoad();

plugin.on('beforeQuery', (query) => {
  console.log('Executing query:', query);
});

const results = await plugin.getDb().prologQuery('(node ?Id ?Type)');
```

### Obsidian Plugin Integration

```typescript
import { ObsidianMetaLogPlugin } from 'meta-log-plugin';

export default class UniversalLifeProtocolPlugin extends ObsidianMetaLogPlugin {
  async onLoad() {
    await super.onLoad();
    await this.loadSettings();
    
    this.addRibbonIcon('meta-log', 'Meta-Log', () => {
      // Open view
    });
  }
}
```

## API Reference

### BaseMetaLogPlugin

Base class providing common functionality:

```typescript
abstract class BaseMetaLogPlugin extends EventEmitter {
  protected db: MetaLogDb;
  protected config: PluginConfig;
  
  abstract onLoad(): Promise<void>;
  abstract onUnload(): Promise<void>;
  abstract onEnable(): Promise<void>;
  abstract onDisable(): Promise<void>;
  
  getDb(): MetaLogDb;
  getConfig(): PluginConfig;
  async updateConfig(updates: Partial<PluginConfig>): Promise<void>;
  async loadCanvas(canvasPath?: string): Promise<void>;
}
```

### OpenCodeMetaLogPlugin

OpenCode adapter extending BaseMetaLogPlugin:

```typescript
class OpenCodeMetaLogPlugin extends BaseMetaLogPlugin {
  async onLoad(): Promise<void>;
  async onUnload(): Promise<void>;
  async onEnable(): Promise<void>;
  async onDisable(): Promise<void>;
  getTools(): any[];
}
```

### ObsidianMetaLogPlugin

Obsidian adapter extending BaseMetaLogPlugin:

```typescript
class ObsidianMetaLogPlugin extends BaseMetaLogPlugin implements Plugin {
  app: any;
  manifest: any;
  
  async onLoad(): Promise<void>;
  async onUnload(): Promise<void>;
  async onEnable(): Promise<void>;
  async onDisable(): Promise<void>;
  async loadSettings(): Promise<void>;
  async saveSettings(): Promise<void>;
}
```

## Events

The plugin emits the following events:

- `beforeQuery` - Emitted before query execution
- `afterQuery` - Emitted after query execution
- `canvasUpdate` - Emitted when canvas is updated
- `factExtraction` - Emitted when facts are extracted
- `configUpdate` - Emitted when configuration is updated
- `enabled` - Emitted when plugin is enabled
- `disabled` - Emitted when plugin is disabled

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

```bash
npm test
```

## Structure

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
│       ├── index.ts             # Type definitions
│       ├── opencode.d.ts        # OpenCode types
│       └── obsidian.d.ts        # Obsidian types
└── dist/                        # Compiled output
```

## Dependencies

- `meta-log-db` - Core database functionality (must be linked)

## Peer Dependencies

- `@opencode-ai/plugin` - OpenCode plugin API (optional)

## License

MIT
