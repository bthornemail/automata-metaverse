---
id: meta-log-db-architecture-explanation
title: "Meta-Log Database Architecture Explanation"
level: foundational
type: explanation
tags: [meta-log-db, architecture, explanation, native-package, npm-link, database]
keywords: [meta-log-db, native-database, npm-link, prolog-engine, datalog-engine, r5rs-integration, database-architecture]
prerequisites: [meta-log-docs-readme, meta-log-db-readme]
enables: [meta-log-db-api, meta-log-plugin-progress]
related: [meta-log-plugin-progress, meta-log-docs-readme, r5rs-canvas-engine]
readingTime: 45
difficulty: 4
blackboard:
  status: implemented
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

# Meta-Log Database Architecture Explanation

**A comprehensive guide to understanding the meta-log-db package, how it works, why it's designed this way, and who it's for.**

## Table of Contents

1. [What Is meta-log-db?](#what-is-meta-log-db)
2. [What Is It For?](#what-is-it-for)
3. [How Does It Work?](#how-does-it-work)
4. [Why This Architecture?](#why-this-architecture)
5. [Who Is This For?](#who-is-this-for)
6. [How To Use It](#how-to-use-it)
7. [References](#references)

---

## What Is meta-log-db?

### Overview

**meta-log-db** is a **native npm package** that provides database engines for:
- **ProLog** - Logic programming with unification and resolution
- **DataLog** - Fact extraction and bottom-up evaluation
- **R5RS** - Scheme function registry and execution
- **JSONL/CanvasL** - File format parsing and fact extraction
- **RDF/SPARQL** - Triple storage and semantic queries
- **SHACL** - Shape constraint validation

### Package Structure

```
meta-log-db/
├── src/
│   ├── database.ts              # Main MetaLogDb class
│   ├── index.ts                 # Main export
│   ├── prolog/
│   │   ├── engine.ts            # ProLog query engine
│   │   ├── unification.ts       # Unification algorithm
│   │   └── resolution.ts        # SLD resolution
│   ├── datalog/
│   │   ├── engine.ts            # DataLog engine
│   │   ├── fact-extraction.ts   # Fact extraction
│   │   └── fixed-point.ts       # Fixed-point computation
│   ├── r5rs/
│   │   └── registry.ts          # R5RS function registry
│   ├── jsonl/
│   │   └── parser.ts            # JSONL/CanvasL parser
│   ├── rdf/
│   │   └── triple-store.ts      # RDF triple store
│   ├── shacl/
│   │   └── validator.ts         # SHACL validator
│   └── types/
│       └── index.ts             # TypeScript types
```

**Reference**: See [`README.md`](./README.md#package-structure).

---

## What Is It For?

### Problem Statement

**Challenge**: Need database functionality for Meta-Log system:
- Query canvas data with ProLog
- Extract facts with DataLog
- Execute R5RS functions
- Store and query RDF triples
- Validate with SHACL

**Solution**: Create a native npm package that:
- Can be `npm link`ed into plugins
- Provides all database engines
- Has a unified API
- Is platform-independent

### Use Cases

#### 1. Query Canvas Data

```typescript
const db = new MetaLogDb();
await db.loadCanvas('automaton-kernel.jsonl');

// ProLog query
const nodes = await db.prologQuery('(node ?Id ?Type)');
```

**Reference**: See [`docs/06-Meta-Log-Adapters/01-Meta-Log-Db/README.md`](../06-Meta-Log-Adapters/01-Meta-Log-Db/README.md#core-api).

#### 2. Extract Facts

```typescript
const facts = db.extractFacts();
// Returns: [{predicate: 'node', args: [...]}, ...]
```

**Reference**: See [`src/datalog/fact-extraction.ts`](../../../meta-log-db/src/datalog/fact-extraction.ts).

#### 3. Execute R5RS Functions

```typescript
const result = await db.executeR5RS('r5rs:church-add', [2, 3]);
```

**Reference**: See [`src/r5rs/registry.ts`](../../../meta-log-db/src/r5rs/registry.ts).

---

## How Does It Work?

### Architecture

```
MetaLogDb (Main Class)
    ├── PrologEngine
    │   ├── Unification
    │   └── Resolution
    ├── DatalogEngine
    │   ├── Fact Extraction
    │   └── Fixed-Point Computation
    ├── R5RSRegistry
    │   └── Function Execution
    ├── JsonlParser
    │   └── CanvasL Support
    ├── TripleStore
    │   └── SPARQL Support
    └── ShaclValidator
        └── Constraint Checking
```

### Data Flow

#### Loading Canvas

```
loadCanvas('canvas.jsonl')
    ↓
JsonlParser.parse()
    ↓
Extract facts
    ↓
Add to ProLog engine
    ↓
Add to DataLog engine
    ↓
Convert to RDF triples
    ↓
Store in triple store
```

**Reference**: See [`src/database.ts`](../../../meta-log-db/src/database.ts#loadCanvas).

#### ProLog Query

```
prologQuery('(node ?Id ?Type)')
    ↓
PrologEngine.query()
    ↓
Resolution.resolve()
    ↓
Unification.unify()
    ↓
Return bindings
```

**Reference**: See [`src/prolog/engine.ts`](../../../meta-log-db/src/prolog/engine.ts#query).

---

## Why This Architecture?

### Design Principles

#### 1. Modular Engines

**Why**: Each engine is independent

**How**: Engines can be enabled/disabled via config

**Benefit**: Use only what you need

**Reference**: See [`src/database.ts`](../../../meta-log-db/src/database.ts#constructor).

#### 2. Unified API

**Why**: Single interface for all operations

**How**: MetaLogDb class wraps all engines

**Benefit**: Consistent API, easy to use

**Reference**: See [`src/database.ts`](../../../meta-log-db/src/database.ts).

#### 3. Native Package

**Why**: Can be shared across platforms

**How**: npm link for development

**Benefit**: Single codebase, multiple platforms

**Reference**: See [`LINKING_SETUP.md`](../../../meta-log-db/LINKING_SETUP.md).

---

## Who Is This For?

### Primary Users

#### 1. Plugin Developers

**For**: Developers building plugins that need database functionality

**What they get**:
- Pre-built database engines
- Unified API
- Type-safe interfaces

**Reference**: See [`docs/06-Meta-Log-Adapters/ARCHITECTURE_EXPLANATION.md`](../06-Meta-Log-Adapters/ARCHITECTURE_EXPLANATION.md).

#### 2. System Integrators

**For**: Developers integrating Meta-Log into systems

**What they get**:
- Standalone database package
- Multiple query interfaces
- Validation capabilities

**Reference**: See [`docs/06-Meta-Log-Adapters/01-Meta-Log-Db/README.md`](../06-Meta-Log-Adapters/01-Meta-Log-Db/README.md).

---

## How To Use It

### Basic Usage

```typescript
import { MetaLogDb } from 'meta-log-db';

const db = new MetaLogDb({
  enableProlog: true,
  enableDatalog: true
});

await db.loadCanvas('canvas.jsonl');
const results = await db.prologQuery('(node ?Id ?Type)');
```

**Reference**: See [`README.md`](./README.md#usage).

---

## References

### Documentation

- **Overview**: [`README.md`](./README.md)
- **Implementation Status**: [`IMPLEMENTATION_STATUS.md`](./IMPLEMENTATION_STATUS.md)
- **API Reference**: [`docs/06-Meta-Log-Adapters/01-Meta-Log-Db/API.md`](../06-Meta-Log-Adapters/01-Meta-Log-Db/API.md)

### Source Code

- **Main Class**: `meta-log-db/src/database.ts`
- **Engines**: `meta-log-db/src/*/`

---

**Last Updated**: 2025-11-08  
**Status**: Complete explanation document
