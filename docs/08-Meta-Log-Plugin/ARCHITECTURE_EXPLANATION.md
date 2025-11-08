---
id: meta-log-plugin-architecture-explanation
title: "Meta-Log Plugin Architecture Explanation"
level: foundational
type: explanation
tags: [meta-log-plugin, architecture, explanation, native-package, npm-link, plugin-infrastructure]
keywords: [meta-log-plugin, native-plugin, npm-link, plugin-infrastructure, opencode-integration, obsidian-integration, lifecycle-management]
prerequisites: [meta-log-db-progress-readme, meta-log-plugin-readme]
enables: [meta-log-plugin-api, plugin-integration]
related: [meta-log-db-progress-readme, opencode-readme, blackboard-architecture-guide]
readingTime: 45
difficulty: 4
blackboard:
  status: implemented
  assignedAgent: null
  lastUpdate: 2025-11-08
  dependencies: [meta-log-db]
  watchers: []
  r5rsEngine: "r5rs-canvas-engine.scm"
  selfBuilding:
    enabled: true
    source: "r5rs-canvas-engine.scm"
    pattern: "blackboard-architecture"
---

# Meta-Log Plugin Architecture Explanation

**A comprehensive guide to understanding the meta-log-plugin package, how it works, why it's designed this way, and who it's for.**

## Table of Contents

1. [What Is meta-log-plugin?](#what-is-meta-log-plugin)
2. [What Is It For?](#what-is-it-for)
3. [How Does It Work?](#how-does-it-work)
4. [Why This Architecture?](#why-this-architecture)
5. [Who Is This For?](#who-is-this-for)
6. [How To Use It](#how-to-use-it)
7. [References](#references)

---

## What Is meta-log-plugin?

### Overview

**meta-log-plugin** is a **native npm package** that provides common plugin infrastructure:
- **Base Plugin Class** - Abstract plugin with lifecycle management
- **OpenCode Adapter** - Integration for OpenCode plugins
- **Obsidian Adapter** - Integration for Obsidian plugins
- **Event System** - Plugin event hooks
- **Configuration Management** - Settings persistence
- **State Management** - Plugin state tracking

### Package Structure

```
meta-log-plugin/
├── src/
│   ├── index.ts                 # Main export
│   ├── core/
│   │   ├── plugin.ts            # BaseMetaLogPlugin
│   │   ├── hooks.ts             # Hook interfaces
│   │   └── lifecycle.ts         # Lifecycle management
│   ├── adapters/
│   │   ├── opencode.ts          # OpenCode adapter
│   │   └── obsidian.ts          # Obsidian adapter
│   ├── utils/
│   │   ├── events.ts            # EventEmitter
│   │   ├── config.ts            # ConfigManager
│   │   └── state.ts             # StateManager
│   └── types/
│       ├── index.ts             # Core types
│       ├── opencode.d.ts        # OpenCode types
│       └── obsidian.d.ts        # Obsidian types
```

**Reference**: See [`README.md`](./README.md#package-structure).

---

## What Is It For?

### Problem Statement

**Challenge**: Need plugin infrastructure for multiple platforms:
- OpenCode plugins
- Obsidian plugins
- Common lifecycle management
- Shared event system
- Unified configuration

**Solution**: Create a native npm package that:
- Provides base plugin class
- Adapts to different platforms
- Shares common infrastructure
- Can be `npm link`ed into plugins

### Use Cases

#### 1. OpenCode Plugin

```typescript
import { OpenCodeMetaLogPlugin } from 'meta-log-plugin';

const plugin = new OpenCodeMetaLogPlugin({
  canvasPath: './canvas.jsonl'
});

await plugin.onLoad();
```

**Reference**: See [`src/examples/opencode-example.ts`](../../../plugin/meta-log-plugin/src/examples/opencode-example.ts).

#### 2. Obsidian Plugin

```typescript
import { ObsidianMetaLogPlugin } from 'meta-log-plugin';

export default class MyPlugin extends ObsidianMetaLogPlugin {
  async onLoad() {
    await super.onLoad();
    await this.loadSettings();
  }
}
```

**Reference**: See [`src/examples/obsidian-example.ts`](../../../plugin/meta-log-plugin/src/examples/obsidian-example.ts).

---

## How Does It Work?

### Architecture

```
BaseMetaLogPlugin (Abstract)
    ├── Lifecycle Management
    ├── Event System
    ├── Configuration
    ├── State Management
    └── Database Integration
         │
         ├── OpenCodeMetaLogPlugin
         │   └── Tool Registration
         │
         └── ObsidianMetaLogPlugin
             └── Settings Persistence
```

### Lifecycle Flow

```
Plugin Creation
    ↓
onLoad()
    ↓
onEnable()
    ↓
[Plugin Active]
    ↓
onDisable()
    ↓
onUnload()
```

**Reference**: See [`src/core/plugin.ts`](../../../plugin/meta-log-plugin/src/core/plugin.ts).

---

## Why This Architecture?

### Design Principles

#### 1. Adapter Pattern

**Why**: Different platforms need different implementations

**How**: Base class defines interface, adapters implement platform-specific code

**Benefit**: Common interface, platform-specific code isolated

**Reference**: See [`src/adapters/opencode.ts`](../../../plugin/meta-log-plugin/src/adapters/opencode.ts).

#### 2. Event System

**Why**: Need hooks for customization

**How**: EventEmitter provides before/after hooks

**Benefit**: Extensible without modifying base class

**Reference**: See [`src/utils/events.ts`](../../../plugin/meta-log-plugin/src/utils/events.ts).

#### 3. Native Package

**Why**: Share code across platforms

**How**: npm link for development

**Benefit**: Single codebase, multiple platforms

**Reference**: See [`LINKING_SETUP.md`](../../../plugin/meta-log-plugin/LINKING_SETUP.md).

---

## Who Is This For?

### Primary Users

#### 1. Plugin Developers

**For**: Developers building OpenCode or Obsidian plugins

**What they get**:
- Base plugin class
- Lifecycle management
- Event hooks
- Database integration

**Reference**: See [`docs/06-Meta-Log-Adapters/ARCHITECTURE_EXPLANATION.md`](../06-Meta-Log-Adapters/ARCHITECTURE_EXPLANATION.md).

---

## How To Use It

### Basic Usage

```typescript
import { OpenCodeMetaLogPlugin } from 'meta-log-plugin';

const plugin = new OpenCodeMetaLogPlugin({
  canvasPath: './canvas.jsonl'
});

await plugin.onLoad();
```

**Reference**: See [`README.md`](./README.md#usage).

---

## References

### Documentation

- **Overview**: [`README.md`](./README.md)
- **Implementation Status**: [`IMPLEMENTATION_STATUS.md`](./IMPLEMENTATION_STATUS.md)
- **API Reference**: [`docs/06-Meta-Log-Adapters/02-Meta-Log-Plugin/API.md`](../06-Meta-Log-Adapters/02-Meta-Log-Plugin/API.md)

### Source Code

- **Main Class**: `plugin/meta-log-plugin/src/core/plugin.ts`
- **Adapters**: `plugin/meta-log-plugin/src/adapters/`

---

**Last Updated**: 2025-11-08  
**Status**: Complete explanation document
