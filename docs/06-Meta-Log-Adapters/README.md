---
id: meta-log-adapters-readme
title: "Meta-Log Adapters Documentation"
level: foundational
type: navigation
tags: [meta-log-adapters, native-plugin, native-db, npm-link, opencode, obsidian, common-interface]
keywords: [meta-log-adapters, native-plugin, native-database, npm-link, opencode-integration, obsidian-integration, common-interface, prolog, datalog, r5rs]
prerequisites: [meta-log-docs-readme, multiverse-canvas-rfc2119-spec]
enables: [meta-log-db-docs, meta-log-plugin-docs]
related: [meta-log-docs-readme, multiverse-canvas-rfc2119-spec, opencode-readme, blackboard-architecture-guide]
readingTime: 15
difficulty: 3
blackboard:
  status: active
  assignedAgent: null
  lastUpdate: null
  dependencies: [r5rs-canvas-engine]
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
        functions: ["r5rs:parse-jsonl-canvas", "r5rs:extract-facts", "r5rs:prolog-query", "r5rs:datalog-query"]
  adapters:
    database: "meta-log-db"
    plugin: "meta-log-plugin"
    commonInterface: "shared-interface"
---

# Meta-Log Adapters Documentation

This folder documents the creation of native Meta-Log database and plugin packages that can be `npm link`ed to provide a common usage interface for both OpenCode and Obsidian plugins.

## Overview

The Meta-Log adapters provide:

1. **Native Database Package** (`01-Meta-Log-Db/`) - Core database functionality for ProLog, DataLog, and R5RS integration
2. **Native Plugin Package** (`02-Meta-Log-Plugin/`) - Plugin infrastructure that can be shared between OpenCode and Obsidian

Both packages use `npm link` to enable:
- **Shared codebase** between OpenCode and Obsidian plugins
- **Common interface** for Meta-Log operations
- **Type-safe** TypeScript/JavaScript APIs
- **Easy updates** - update once, use everywhere

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│              OpenCode Plugin                            │
│  (.opencode/plugin/)                                    │
│                                                          │
│  ┌──────────────────────────────────────┐              │
│  │  npm link meta-log-plugin            │              │
│  │  npm link meta-log-db                │              │
│  └──────────────────────────────────────┘              │
└─────────────────────────────────────────────────────────┘
                        │
                        │ Common Interface
                        │
┌─────────────────────────────────────────────────────────┐
│         Obsidian Plugin                                 │
│  (.obsidian/plugins/universal-life-protocol-plugin/)   │
│                                                          │
│  ┌──────────────────────────────────────┐              │
│  │  npm link meta-log-plugin            │              │
│  │  npm link meta-log-db                │              │
│  └──────────────────────────────────────┘              │
└─────────────────────────────────────────────────────────┘
                        │
                        │ Shared Packages
                        │
        ┌───────────────┴───────────────┐
        │                               │
┌───────▼────────┐           ┌─────────▼────────┐
│ meta-log-db    │           │ meta-log-plugin  │
│ (Native DB)    │           │ (Native Plugin)  │
│                │           │                  │
│ - ProLog       │           │ - Common API     │
│ - DataLog      │           │ - Plugin hooks   │
│ - R5RS         │           │ - Lifecycle      │
│ - JSONL/CanvasL│           │ - Integration    │
└────────────────┘           └──────────────────┘
```

## Documents

### [01-Meta-Log-Db](./01-Meta-Log-Db/)
Native database package providing:
- ProLog query engine
- DataLog fact extraction
- R5RS function integration
- JSONL/CanvasL parsing
- RDF/SPARQL support
- SHACL validation

### [02-Meta-Log-Plugin](./02-Meta-Log-Plugin/)
Native plugin package providing:
- Common plugin interface
- Lifecycle management
- Integration hooks
- Shared utilities
- Type definitions

## Quick Start

### 1. Create Native Packages

```bash
# Create database package
mkdir -p plugin/meta-log-db
cd plugin/meta-log-db
npm init -y

# Create plugin package
mkdir -p plugin/meta-log-plugin
cd plugin/meta-log-plugin
npm init -y
```

### 2. Link Packages

```bash
# In meta-log-db directory
npm link

# In meta-log-plugin directory
npm link
npm link meta-log-db  # Plugin depends on DB

# In OpenCode plugin
cd .opencode/plugin
npm link meta-log-db
npm link meta-log-plugin

# In Obsidian plugin
cd .obsidian/plugins/universal-life-protocol-plugin
npm link meta-log-db
npm link meta-log-plugin
```

### 3. Use Common Interface

```typescript
// In either OpenCode or Obsidian plugin
import { MetaLogDb } from 'meta-log-db';
import { MetaLogPlugin } from 'meta-log-plugin';

const db = new MetaLogDb();
const plugin = new MetaLogPlugin(db);
```

## Benefits

- ✅ **Single Source of Truth** - Core logic in one place
- ✅ **Type Safety** - Shared TypeScript types
- ✅ **Easy Updates** - Update packages, all plugins benefit
- ✅ **Consistent API** - Same interface everywhere
- ✅ **Testing** - Test packages independently
- ✅ **Documentation** - Centralized docs

## Integration Points

- **Blackboard Architecture** - Epistemic node tracking
- **R5RS Canvas Engine** - Function registry and execution
- **ProLog/DataLog** - Logic programming integration
- **JSONL/CanvasL** - File format support
- **Manifest System** - Merkle-trie manifests

---

**See Also**:
- [Meta-Log Database Documentation](./01-Meta-Log-Db/)
- [Meta-Log Plugin Documentation](./02-Meta-Log-Plugin/)
- [Meta-Log Main Documentation](../05-Meta-Log/)
