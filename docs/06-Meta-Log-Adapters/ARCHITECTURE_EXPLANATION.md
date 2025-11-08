---
id: meta-log-adapters-architecture-explanation
title: "Meta-Log Adapters Architecture Explanation"
level: foundational
type: explanation
tags: [meta-log-adapters, architecture, explanation, npm-link, native-packages, plugin-infrastructure]
keywords: [meta-log-architecture, npm-link-explanation, native-packages, plugin-infrastructure, opencode-integration, obsidian-integration, prolog-datalog-r5rs]
prerequisites: [meta-log-adapters-readme]
enables: [meta-log-db-progress-readme, meta-log-plugin-progress-readme]
related: [meta-log-docs-readme, multiverse-canvas-rfc2119-spec, opencode-readme, blackboard-architecture-guide]
readingTime: 45
difficulty: 3
blackboard:
  status: active
  assignedAgent: null
  lastUpdate: 2025-11-08
  dependencies: [r5rs-canvas-engine]
  watchers: []
  r5rsEngine: "r5rs-canvas-engine.scm"
  selfBuilding:
    enabled: true
    source: "r5rs-canvas-engine.scm"
    pattern: "blackboard-architecture"
---

# Meta-Log Adapters Architecture Explanation

**A comprehensive guide to understanding what the Meta-Log packages are, how they work, why they're designed this way, and who they're for.**

## Table of Contents

1. [What Are These Packages?](#what-are-these-packages)
2. [What Are They For?](#what-are-they-for)
3. [How Do They Work?](#how-do-they-work)
4. [Why This Architecture?](#why-this-architecture)
5. [Who Is This For?](#who-is-this-for)
6. [How To Use Them](#how-to-use-them)
7. [References](#references)

---

## What Are These Packages?

### Overview

The Meta-Log adapters consist of **two native npm packages** that provide a shared codebase for interacting with the Meta-Log system (ProLog, DataLog, R5RS) across different platforms:

1. **`meta-log-db`** - Core database functionality
2. **`meta-log-plugin`** - Plugin infrastructure layer

### Package 1: meta-log-db

**Location**: `/home/main/automaton/meta-log-db/`

**What it is**: A native npm package providing database engines for:
- **ProLog** - Logic programming with unification and resolution
- **DataLog** - Fact extraction and bottom-up evaluation  
- **R5RS** - Scheme function registry and execution
- **JSONL/CanvasL** - File format parsing and fact extraction
- **RDF/SPARQL** - Triple storage and semantic queries
- **SHACL** - Shape constraint validation

**Key Files**:
- `src/database.ts` - Main `MetaLogDb` class
- `src/prolog/engine.ts` - ProLog query engine
- `src/datalog/engine.ts` - DataLog engine
- `src/jsonl/parser.ts` - JSONL/CanvasL parser
- `src/rdf/triple-store.ts` - RDF triple store
- `src/shacl/validator.ts` - SHACL validator

**Reference**: See [`docs/07-Meta-Log-Db/README.md`](../../07-Meta-Log-Db/README.md) for implementation status.

### Package 2: meta-log-plugin

**Location**: `/home/main/automaton/plugin/meta-log-plugin/`

**What it is**: A native npm package providing common plugin infrastructure:
- **Base Plugin Class** - Abstract plugin with lifecycle management
- **OpenCode Adapter** - Integration for OpenCode plugins
- **Obsidian Adapter** - Integration for Obsidian plugins
- **Event System** - Plugin event hooks
- **Configuration Management** - Settings persistence
- **State Management** - Plugin state tracking

**Key Files**:
- `src/core/plugin.ts` - `BaseMetaLogPlugin` abstract class
- `src/adapters/opencode.ts` - OpenCode adapter
- `src/adapters/obsidian.ts` - Obsidian adapter
- `src/utils/events.ts` - EventEmitter
- `src/utils/config.ts` - ConfigManager

**Reference**: See [`docs/08-Meta-Log-Plugin/README.md`](../../08-Meta-Log-Plugin/README.md) for implementation status.

---

## What Are They For?

### Problem Statement

The Meta-Log system needs to be accessible from multiple platforms:
- **OpenCode** - AI coding assistant plugin system
- **Obsidian** - Knowledge management application

**Challenge**: Without shared packages, each platform would need:
- Duplicate code for database operations
- Different APIs for the same functionality
- Maintenance overhead (fix bugs twice)
- Inconsistent behavior across platforms

### Solution: Native Packages with npm link

These packages solve this by:
1. **Single Codebase** - Write database logic once, use everywhere
2. **Common Interface** - Same API across all platforms
3. **Type Safety** - Shared TypeScript types
4. **Easy Updates** - Update package, all plugins benefit
5. **Testing** - Test infrastructure independently

### Use Cases

#### 1. Query JSONL Canvas Files

```typescript
// Same code works in both OpenCode and Obsidian
import { MetaLogDb } from 'meta-log-db';

const db = new MetaLogDb();
await db.loadCanvas('automaton-kernel.jsonl');

// ProLog query
const results = await db.prologQuery('(node ?Id ?Type)');
```

**Reference**: See [`docs/06-Meta-Log-Adapters/01-Meta-Log-Db/README.md`](./01-Meta-Log-Db/README.md#core-api).

#### 2. Extract Facts from Canvas

```typescript
// Extract facts for DataLog processing
const facts = db.extractFacts();
// Returns: [{ predicate: 'node', args: ['id1', 'text', ...] }, ...]
```

**Reference**: See [`src/datalog/fact-extraction.ts`](../../../meta-log-db/src/datalog/fact-extraction.ts).

#### 3. Execute R5RS Functions

```typescript
// Execute Church encoding functions
const result = await db.executeR5RS('r5rs:church-add', [2, 3]);
// Returns: 5 (via Church encoding)
```

**Reference**: See [`src/r5rs/registry.ts`](../../../meta-log-db/src/r5rs/registry.ts).

#### 4. Validate with SHACL

```typescript
// Validate canvas against SHACL shapes
const report = await db.validateShacl(shapes, triples);
if (!report.conforms) {
  console.log('Violations:', report.violations);
}
```

**Reference**: See [`src/shacl/validator.ts`](../../../meta-log-db/src/shacl/validator.ts).

---

## How Do They Work?

### Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│                    Platform Layer                        │
│  ┌──────────────┐              ┌──────────────┐        │
│  │   OpenCode   │              │   Obsidian   │        │
│  │   Plugin     │              │   Plugin     │        │
│  └──────┬───────┘              └──────┬───────┘        │
│         │                             │                 │
│         └──────────────┬──────────────┘                 │
│                        │                                 │
└────────────────────────┼─────────────────────────────────┘
                         │
┌────────────────────────┼─────────────────────────────────┐
│         Plugin Infrastructure Layer                      │
│  ┌──────────────────────────────────────────┐           │
│  │      meta-log-plugin                      │           │
│  │  ┌──────────────┐  ┌──────────────┐     │           │
│  │  │ OpenCode    │  │ Obsidian     │     │           │
│  │  │ Adapter     │  │ Adapter      │     │           │
│  │  └──────┬──────┘  └──────┬───────┘     │           │
│  │         │                 │              │           │
│  │         └─────────┬────────┘              │           │
│  │                   │                       │           │
│  │         ┌─────────▼────────┐              │           │
│  │         │ BaseMetaLogPlugin│              │           │
│  │         │  - Lifecycle     │              │           │
│  │         │  - Hooks         │              │           │
│  │         │  - Events        │              │           │
│  │         └─────────┬────────┘              │           │
│  └───────────────────┼──────────────────────┘           │
│                      │                                    │
└──────────────────────┼────────────────────────────────────┘
                       │
┌──────────────────────┼────────────────────────────────────┐
│              Database Layer                                │
│  ┌──────────────────────────────────────────┐            │
│  │         meta-log-db                       │            │
│  │  ┌──────────┐  ┌──────────┐  ┌────────┐ │            │
│  │  │ ProLog   │  │ DataLog  │  │  R5RS  │ │            │
│  │  │ Engine   │  │ Engine   │  │Registry│ │            │
│  │  └────┬─────┘  └────┬─────┘  └────┬───┘ │            │
│  │       │             │              │      │            │
│  │  ┌────▼─────────────▼──────────────▼───┐ │            │
│  │  │         MetaLogDb                  │ │            │
│  │  │  - loadCanvas()                    │ │            │
│  │  │  - prologQuery()                   │ │            │
│  │  │  - datalogQuery()                  │ │            │
│  │  │  - sparqlQuery()                   │ │            │
│  │  │  - validateShacl()                 │ │            │
│  │  └────────────────────────────────────┘ │            │
│  │                                          │            │
│  │  ┌──────────┐  ┌──────────┐  ┌────────┐ │            │
│  │  │ JSONL    │  │   RDF    │  │ SHACL  │ │            │
│  │  │ Parser   │  │  Store   │  │Validator│            │
│  │  └──────────┘  └──────────┘  └────────┘ │            │
│  └──────────────────────────────────────────┘            │
└───────────────────────────────────────────────────────────┘
```

### How npm link Works

**npm link** creates symbolic links between packages:

```bash
# 1. Create global link for meta-log-db
cd /home/main/automaton/meta-log-db
npm link
# Creates: /usr/local/lib/node_modules/meta-log-db -> /home/main/automaton/meta-log-db

# 2. Link meta-log-db into meta-log-plugin
cd /home/main/automaton/plugin/meta-log-plugin
npm link meta-log-db
# Creates: node_modules/meta-log-db -> /home/main/automaton/meta-log-db

# 3. Link meta-log-plugin into OpenCode plugin
cd /home/main/automaton/.opencode
npm link meta-log-plugin
# Creates: node_modules/meta-log-plugin -> /home/main/automaton/plugin/meta-log-plugin
```

**Why this works**:
- Changes to source files are immediately available
- No need to publish to npm
- Development-friendly workflow
- TypeScript types are shared

**Reference**: See [`meta-log-db/LINKING_SETUP.md`](../../../meta-log-db/LINKING_SETUP.md).

### Data Flow

#### 1. Loading a Canvas

```typescript
// In OpenCode or Obsidian plugin
const plugin = new OpenCodeMetaLogPlugin({
  canvasPath: './automaton-kernel.jsonl'
});

await plugin.onLoad();
// ↓ Calls plugin.loadCanvas()
// ↓ Calls db.loadCanvas()
// ↓ Calls jsonl.parse()
// ↓ Extracts facts
// ↓ Adds to ProLog/DataLog engines
// ↓ Converts to RDF triples
```

**Reference**: See [`src/database.ts`](../../../meta-log-db/src/database.ts#loadCanvas).

#### 2. Executing a Query

```typescript
// ProLog query
const results = await plugin.getDb().prologQuery('(node ?Id ?Type)');
// ↓ Calls db.prologQuery()
// ↓ Calls prolog.query()
// ↓ Calls Resolution.resolve()
// ↓ Calls Unification.unify()
// ↓ Returns bindings
```

**Reference**: See [`src/prolog/engine.ts`](../../../meta-log-db/src/prolog/engine.ts#query).

#### 3. Event Hooks

```typescript
plugin.on('beforeQuery', (query) => {
  console.log('Executing:', query);
});

plugin.on('afterQuery', (query, results) => {
  console.log('Results:', results);
});

// When query executes:
// 1. Emits 'beforeQuery' event
// 2. Executes query
// 3. Emits 'afterQuery' event
```

**Reference**: See [`src/core/plugin.ts`](../../../plugin/meta-log-plugin/src/core/plugin.ts#beforeQuery).

---

## Why This Architecture?

### Design Principles

#### 1. Separation of Concerns

**Database Layer** (`meta-log-db`):
- Pure database operations
- No platform-specific code
- Reusable across any platform

**Plugin Layer** (`meta-log-plugin`):
- Platform integration
- Lifecycle management
- Event handling
- Configuration

**Why**: Each layer has a single responsibility, making code easier to maintain and test.

**Reference**: See [`docs/06-Meta-Log-Adapters/README.md`](./README.md#architecture).

#### 2. Dependency Inversion

```
meta-log-plugin depends on meta-log-db
     ↓
OpenCode/Obsidian plugins depend on meta-log-plugin
```

**Why**: 
- Database logic is independent
- Plugin layer adapts database to platforms
- Platforms don't need to know database internals

**Reference**: See [`src/core/plugin.ts`](../../../plugin/meta-log-plugin/src/core/plugin.ts#constructor).

#### 3. Adapter Pattern

```typescript
// Base class defines interface
abstract class BaseMetaLogPlugin {
  abstract onLoad(): Promise<void>;
  // ...
}

// Platform-specific implementations
class OpenCodeMetaLogPlugin extends BaseMetaLogPlugin {
  async onLoad() {
    // OpenCode-specific setup
  }
}

class ObsidianMetaLogPlugin extends BaseMetaLogPlugin {
  async onLoad() {
    // Obsidian-specific setup
  }
}
```

**Why**:
- Common interface for all platforms
- Platform-specific code isolated
- Easy to add new platforms

**Reference**: See [`src/adapters/opencode.ts`](../../../plugin/meta-log-plugin/src/adapters/opencode.ts).

#### 4. npm link for Development

**Why npm link instead of npm publish**:
- **Fast iteration** - Changes immediately available
- **No versioning** - No need to bump versions during development
- **Local development** - Works offline
- **TypeScript support** - Types are shared via symlinks

**Trade-offs**:
- Requires local development setup
- Not suitable for production distribution
- All developers need same directory structure

**Reference**: See [`docs/06-Meta-Log-Adapters/01-Meta-Log-Db/SETUP_GUIDE.md`](./01-Meta-Log-Db/SETUP_GUIDE.md#npm-link-setup).

---

## Who Is This For?

### Primary Users

#### 1. Plugin Developers

**For**: Developers building OpenCode or Obsidian plugins that need Meta-Log functionality.

**What they get**:
- Pre-built database engines (ProLog, DataLog, R5RS)
- Common plugin infrastructure
- Type-safe APIs
- Event hooks for customization

**Example Use Case**: Building a canvas visualization plugin

```typescript
// OpenCode plugin developer
import { OpenCodeMetaLogPlugin } from 'meta-log-plugin';

const plugin = new OpenCodeMetaLogPlugin({
  canvasPath: './canvas.jsonl'
});

// Register custom tool
plugin.on('afterQuery', (query, results) => {
  // Custom visualization logic
  visualizeResults(results);
});
```

**Reference**: See [`src/examples/opencode-example.ts`](../../../plugin/meta-log-plugin/src/examples/opencode-example.ts).

#### 2. System Integrators

**For**: Developers integrating Meta-Log into existing systems.

**What they get**:
- Standalone database package
- Can use without plugin layer
- Direct access to engines

**Example Use Case**: Integrating into a custom application

```typescript
// Custom application
import { MetaLogDb } from 'meta-log-db';

const db = new MetaLogDb({
  enableProlog: true,
  enableDatalog: true
});

await db.loadCanvas('./data.jsonl');
const facts = db.extractFacts();
```

**Reference**: See [`docs/06-Meta-Log-Adapters/01-Meta-Log-Db/README.md`](./01-Meta-Log-Db/README.md#usage-in-plugins).

#### 3. Researchers and Analysts

**For**: Users analyzing computational topology canvases.

**What they get**:
- Query interface for canvas data
- Fact extraction capabilities
- RDF/SPARQL semantic queries
- SHACL validation

**Example Use Case**: Analyzing automaton structure

```typescript
// Research script
const db = new MetaLogDb();
await db.loadCanvas('automaton-kernel.jsonl');

// Find all nodes of a type
const nodes = await db.prologQuery('(node ?Id "text")');

// Find inheritance relationships
const inheritance = await db.datalogQuery('(inherits ?X ?Y)');
```

**Reference**: See [`docs/06-Meta-Log-Adapters/01-Meta-Log-Db/API.md`](./01-Meta-Log-Db/API.md#metalogdb-class).

#### 4. Meta-Log System Maintainers

**For**: Developers maintaining the Meta-Log system itself.

**What they get**:
- Centralized database logic
- Single place to fix bugs
- Consistent behavior across platforms
- Easier testing

**Example Use Case**: Fixing a bug in ProLog unification

```typescript
// Fix bug in meta-log-db/src/prolog/unification.ts
// All plugins automatically get the fix via npm link
```

**Reference**: See [`docs/07-Meta-Log-Db/IMPLEMENTATION_STATUS.md`](../../07-Meta-Log-Db/IMPLEMENTATION_STATUS.md).

---

## How To Use Them

### For Plugin Developers

#### Step 1: Link Packages

```bash
# Link meta-log-db
cd /home/main/automaton/meta-log-db
npm link

# Link meta-log-plugin
cd /home/main/automaton/plugin/meta-log-plugin
npm link
npm link meta-log-db

# Use in your plugin
cd /home/main/automaton/.opencode  # or .obsidian/plugins/your-plugin
npm link meta-log-plugin
npm link meta-log-db
```

**Reference**: See [`meta-log-plugin/LINKING_SETUP.md`](../../../plugin/meta-log-plugin/LINKING_SETUP.md).

#### Step 2: Create Plugin

**OpenCode Plugin**:

```typescript
import { OpenCodeMetaLogPlugin } from 'meta-log-plugin';

const plugin = new OpenCodeMetaLogPlugin({
  canvasPath: './automaton-kernel.jsonl',
  enableProlog: true,
  enableDatalog: true
});

await plugin.onLoad();

// Use database
const results = await plugin.getDb().prologQuery('(node ?Id ?Type)');
```

**Reference**: See [`src/examples/opencode-example.ts`](../../../plugin/meta-log-plugin/src/examples/opencode-example.ts).

**Obsidian Plugin**:

```typescript
import { ObsidianMetaLogPlugin } from 'meta-log-plugin';

export default class MyPlugin extends ObsidianMetaLogPlugin {
  async onLoad() {
    await super.onLoad();
    await this.loadSettings();
    
    // Obsidian-specific setup
    this.addRibbonIcon('meta-log', 'Meta-Log', () => {
      this.openView();
    });
  }
}
```

**Reference**: See [`src/examples/obsidian-example.ts`](../../../plugin/meta-log-plugin/src/examples/obsidian-example.ts).

#### Step 3: Use Database Features

```typescript
// ProLog queries
const nodes = await plugin.getDb().prologQuery('(node ?Id ?Type)');

// DataLog queries
const missing = await plugin.getDb().datalogQuery('(missing_implementation ?N)');

// SPARQL queries
const triples = await plugin.getDb().sparqlQuery(`
  SELECT ?id ?type WHERE {
    ?id rdf:type ?type
  }
`);

// SHACL validation
const report = await plugin.getDb().validateShacl();
```

**Reference**: See [`docs/06-Meta-Log-Adapters/01-Meta-Log-Db/API.md`](./01-Meta-Log-Db/API.md).

### For System Integrators

#### Direct Database Usage

```typescript
import { MetaLogDb } from 'meta-log-db';

const db = new MetaLogDb({
  r5rsEnginePath: './r5rs-canvas-engine.scm',
  enableProlog: true,
  enableDatalog: true,
  enableRdf: true,
  enableShacl: true
});

// Load canvas
await db.loadCanvas('automaton-kernel.jsonl');

// Extract facts
const facts = db.extractFacts();

// Query
const results = await db.prologQuery('(node ?Id ?Type)');
```

**Reference**: See [`docs/06-Meta-Log-Adapters/01-Meta-Log-Db/README.md`](./01-Meta-Log-Db/README.md#core-api).

---

## References

### Documentation

- **Architecture Overview**: [`docs/06-Meta-Log-Adapters/README.md`](./README.md)
- **Database Package**: [`docs/06-Meta-Log-Adapters/01-Meta-Log-Db/README.md`](./01-Meta-Log-Db/README.md)
- **Plugin Package**: [`docs/06-Meta-Log-Adapters/02-Meta-Log-Plugin/README.md`](./02-Meta-Log-Plugin/README.md)
- **Database API**: [`docs/06-Meta-Log-Adapters/01-Meta-Log-Db/API.md`](./01-Meta-Log-Db/API.md)
- **Plugin API**: [`docs/06-Meta-Log-Adapters/02-Meta-Log-Plugin/API.md`](./02-Meta-Log-Plugin/API.md)

### Implementation Status

- **Database Progress**: [`docs/07-Meta-Log-Db/README.md`](../../07-Meta-Log-Db/README.md)
- **Plugin Progress**: [`docs/08-Meta-Log-Plugin/README.md`](../../08-Meta-Log-Plugin/README.md)

### Source Code

- **Database**: `/home/main/automaton/meta-log-db/src/`
- **Plugin**: `/home/main/automaton/plugin/meta-log-plugin/src/`
- **Examples**: `/home/main/automaton/plugin/meta-log-plugin/src/examples/`

### Setup Guides

- **Database Setup**: [`docs/06-Meta-Log-Adapters/01-Meta-Log-Db/SETUP_GUIDE.md`](./01-Meta-Log-Db/SETUP_GUIDE.md)
- **Plugin Setup**: [`docs/06-Meta-Log-Adapters/02-Meta-Log-Plugin/SETUP_GUIDE.md`](./02-Meta-Log-Plugin/SETUP_GUIDE.md)
- **Linking Setup**: [`meta-log-db/LINKING_SETUP.md`](../../../meta-log-db/LINKING_SETUP.md)

### Related Systems

- **Meta-Log System**: [`docs/05-Meta-Log/README.md`](../05-Meta-Log/README.md)
- **R5RS Canvas Engine**: [`README-R5RS-ENGINE.md`](../../../README-R5RS-ENGINE.md)
- **Blackboard Architecture**: [`AGENTS.md`](../../../AGENTS.md#architecture-foundation)
- **OpenCode Integration**: [`OPENCODE_INTEGRATION.md`](../../../OPENCODE_INTEGRATION.md)

---

**Last Updated**: 2025-11-08  
**Status**: Complete explanation document
