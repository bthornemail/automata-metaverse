---
id: meta-log-db-readme
title: "Meta-Log Database Package"
level: foundational
type: guide
tags: [meta-log-db, native-package, npm-link, database, prolog, datalog, r5rs]
keywords: [meta-log-db, native-database, npm-link, prolog-engine, datalog-engine, r5rs-integration, jsonl-parser, canvasl-support, rdf-sparql, shacl-validation]
prerequisites: [meta-log-adapters-readme, multiverse-canvas-rfc2119-spec]
enables: [meta-log-db-setup, meta-log-db-api]
related: [meta-log-plugin-docs, meta-log-docs-readme, r5rs-canvas-engine, blackboard-architecture-guide]
readingTime: 30
difficulty: 4
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
  databaseFeatures:
    prolog: [query-engine, unification, resolution, built-in-predicates]
    datalog: [fact-extraction, rule-evaluation, fixed-point-computation, aggregation]
    r5rs: [function-registry, function-execution, church-encoding]
    jsonl: [parsing, canvasl-support, fact-extraction]
    rdf: [triple-storage, sparql-query, rdfs-entailment]
    shacl: [shape-validation, constraint-checking]
---

# Meta-Log Database Package

A native npm package providing core database functionality for ProLog, DataLog, and R5RS integration. This package can be `npm link`ed into both OpenCode and Obsidian plugins to provide a common database interface.

## Overview

The Meta-Log Database package (`meta-log-db`) provides:

- **ProLog Engine** - Logic programming with unification and resolution
- **DataLog Engine** - Fact extraction and bottom-up evaluation
- **R5RS Integration** - Function registry and execution
- **JSONL/CanvasL Parser** - File format parsing and fact extraction
- **RDF/SPARQL Support** - Triple storage and SPARQL queries
- **SHACL Validation** - Shape constraint validation

## Package Structure

```
plugin/meta-log-db/
├── package.json
├── tsconfig.json
├── README.md
├── src/
│   ├── index.ts                 # Main export
│   ├── prolog/
│   │   ├── engine.ts            # ProLog query engine
│   │   ├── unification.ts       # Unification algorithm
│   │   └── resolution.ts        # SLD resolution
│   ├── datalog/
│   │   ├── engine.ts            # DataLog engine
│   │   ├── fact-extraction.ts   # Fact extraction from JSONL
│   │   └── fixed-point.ts       # Fixed-point computation
│   ├── r5rs/
│   │   ├── registry.ts          # R5RS function registry
│   │   └── executor.ts          # Function execution
│   ├── jsonl/
│   │   ├── parser.ts            # JSONL parser
│   │   └── canvasl.ts           # CanvasL extension support
│   ├── rdf/
│   │   ├── triple-store.ts      # RDF triple storage
│   │   └── sparql.ts            # SPARQL query engine
│   └── shacl/
│       └── validator.ts         # SHACL validation
└── types/
    └── index.d.ts               # TypeScript definitions
```

## Installation & Setup

### 1. Create Package

```bash
mkdir -p plugin/meta-log-db
cd plugin/meta-log-db
npm init -y
```

### 2. Configure package.json

```json
{
  "name": "meta-log-db",
  "version": "1.0.0",
  "description": "Native database package for Meta-Log (ProLog, DataLog, R5RS)",
  "main": "dist/index.js",
  "types": "dist/index.d.ts",
  "scripts": {
    "build": "tsc",
    "watch": "tsc --watch",
    "test": "jest"
  },
  "keywords": [
    "meta-log",
    "prolog",
    "datalog",
    "r5rs",
    "jsonl",
    "canvasl"
  ],
  "dependencies": {
    "ethers": "^6.0.0"
  },
  "devDependencies": {
    "@types/node": "^20.0.0",
    "typescript": "^5.0.0"
  }
}
```

### 3. Create TypeScript Config

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
    "forceConsistentCasingInFileNames": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
```

### 4. Create Main Export

```typescript
// src/index.ts
export * from './prolog/engine.js';
export * from './datalog/engine.js';
export * from './r5rs/registry.js';
export * from './jsonl/parser.js';
export * from './rdf/triple-store.js';
export * from './shacl/validator.js';

export { MetaLogDb } from './database.js';
```

## Core API

### MetaLogDb Class

```typescript
import { MetaLogDb } from 'meta-log-db';

const db = new MetaLogDb({
  r5rsEnginePath: './r5rs-canvas-engine.scm',
  enableProlog: true,
  enableDatalog: true,
  enableRdf: true,
  enableShacl: true
});

// Load JSONL canvas
await db.loadCanvas('automaton-kernel.jsonl');

// Extract facts
const facts = db.extractFacts();

// ProLog query
const results = await db.prologQuery('(church_encoding ?X ?D)');

// DataLog query
const datalogResults = await db.datalogQuery('(missing_implementation ?N)');

// RDF/SPARQL query
const sparqlResults = await db.sparqlQuery(`
  SELECT ?id ?type WHERE {
    ?id rdf:type ?type
  }
`);

// SHACL validation
const validation = await db.validateShacl();
```

## Integration with R5RS Engine

The database integrates with `r5rs-canvas-engine.scm`:

```typescript
// Load R5RS functions
await db.loadR5RSEngine('./r5rs-canvas-engine.scm');

// Execute R5RS function
const result = await db.executeR5RS('r5rs:church-add', [2, 3]);

// Register custom R5RS function
db.registerR5RSFunction('my-function', (args) => {
  // Implementation
});
```

## ProLog Integration

```typescript
// Build ProLog database from facts
db.buildPrologDb(facts);

// Query with variables
const results = await db.prologQuery('(inherits ?X ?Y)');

// Add ProLog rules
db.addPrologRule('(parent ?X ?Y) :- (father ?X ?Y)');
db.addPrologRule('(parent ?X ?Y) :- (mother ?X ?Y)');
```

## DataLog Integration

```typescript
// Extract facts from JSONL
const facts = db.extractFacts();

// Build DataLog program
const program = db.buildDatalogProgram([
  '(missing_implementation ?N) :- (implements ?N ?Y), not (has_implementation ?N)'
]);

// Execute DataLog query
const results = await db.datalogQuery('(missing_implementation ?N)', program);
```

## JSONL/CanvasL Support

```typescript
// Parse JSONL file
const canvas = await db.parseJsonlCanvas('automaton-kernel.jsonl');

// Parse CanvasL file (with extensions)
const canvasl = await db.parseCanvasL('canvas.canvasl');

// Extract facts from parsed canvas
const facts = db.extractFactsFromCanvas(canvas);

// Convert to RDF
const triples = db.jsonlToRdf(facts);
```

## RDF/SPARQL Support

```typescript
// Convert JSONL facts to RDF triples
const triples = db.jsonlToRdf(facts);

// Store triples
db.storeTriples(triples);

// SPARQL query
const results = await db.sparqlQuery(`
  PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
  SELECT ?subject ?predicate ?object
  WHERE {
    ?subject ?predicate ?object
  }
`);

// RDFS entailment
const entailedTriples = db.rdfsEntailment(triples);
```

## SHACL Validation

```typescript
// Load SHACL shapes
const shapes = await db.loadShaclShapes('./shapes.ttl');

// Validate triples against shapes
const report = await db.validateShacl(shapes, triples);

// Check for violations
if (report.conforms) {
  console.log('Validation passed');
} else {
  console.log('Violations:', report.violations);
}
```

## Usage in Plugins

### OpenCode Plugin

```typescript
// .opencode/plugin/index.ts
import { MetaLogDb } from 'meta-log-db';

const db = new MetaLogDb();
await db.loadCanvas('./automaton-kernel.jsonl');
```

### Obsidian Plugin

```typescript
// .obsidian/plugins/universal-life-protocol-plugin/src/main.ts
import { MetaLogDb } from 'meta-log-db';

const db = new MetaLogDb();
await db.loadCanvas(this.app.vault.configDir + '/automaton-kernel.jsonl');
```

## npm link Setup

### 1. Create Link

```bash
cd plugin/meta-log-db
npm link
```

### 2. Use in Plugins

```bash
# In OpenCode plugin
cd .opencode/plugin
npm link meta-log-db

# In Obsidian plugin
cd .obsidian/plugins/universal-life-protocol-plugin
npm link meta-log-db
```

### 3. Development Workflow

```bash
# Make changes to meta-log-db
cd plugin/meta-log-db
npm run build

# Changes automatically available in linked plugins
# (no need to re-link)
```

## Type Definitions

```typescript
// types/index.d.ts
export interface MetaLogDbConfig {
  r5rsEnginePath?: string;
  enableProlog?: boolean;
  enableDatalog?: boolean;
  enableRdf?: boolean;
  enableShacl?: boolean;
}

export interface PrologQueryResult {
  bindings: Record<string, any>[];
}

export interface DatalogQueryResult {
  facts: any[];
}

export interface SparqlQueryResult {
  results: {
    bindings: Record<string, { value: string; type: string }>[];
  };
}

export interface ShaclValidationReport {
  conforms: boolean;
  violations: ShaclViolation[];
}

export interface ShaclViolation {
  focusNode: string;
  resultPath: string;
  message: string;
}
```

## Testing

```typescript
// tests/database.test.ts
import { MetaLogDb } from 'meta-log-db';

describe('MetaLogDb', () => {
  let db: MetaLogDb;

  beforeEach(() => {
    db = new MetaLogDb();
  });

  test('should parse JSONL canvas', async () => {
    const canvas = await db.parseJsonlCanvas('test.jsonl');
    expect(canvas).toBeDefined();
  });

  test('should extract facts', async () => {
    await db.loadCanvas('test.jsonl');
    const facts = db.extractFacts();
    expect(facts.length).toBeGreaterThan(0);
  });

  test('should execute ProLog query', async () => {
    await db.loadCanvas('test.jsonl');
    const results = await db.prologQuery('(node ?Id ?Type)');
    expect(results.bindings.length).toBeGreaterThan(0);
  });
});
```

## Build & Publish

```bash
# Build
npm run build

# Test
npm test

# Publish (if publishing to npm)
npm publish
```

## Integration Points

- **Blackboard Architecture** - Epistemic node fact extraction
- **R5RS Canvas Engine** - Function registry and execution
- **ProLog/DataLog** - Logic programming queries
- **JSONL/CanvasL** - File format parsing
- **Manifest System** - Merkle-trie manifest generation

---

**See Also**:
- [Meta-Log Plugin Documentation](../02-Meta-Log-Plugin/)
- [Meta-Log Main Documentation](../../05-Meta-Log/)
- [R5RS Canvas Engine](../../README-R5RS-ENGINE.md)
