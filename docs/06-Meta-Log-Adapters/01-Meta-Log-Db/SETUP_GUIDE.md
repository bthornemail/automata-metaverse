---
id: meta-log-db-setup-guide
title: "Meta-Log Database Setup Guide"
level: practical
type: guide
tags: [meta-log-db, setup, installation, npm-link, development]
keywords: [meta-log-db-setup, npm-link-setup, package-development, typescript-setup, build-configuration]
prerequisites: [meta-log-db-readme]
enables: [meta-log-db-api]
related: [meta-log-plugin-setup, meta-log-docs-readme]
readingTime: 45
difficulty: 3
blackboard:
  status: active
  assignedAgent: null
  lastUpdate: null
  dependencies: []
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

# Meta-Log Database Setup Guide

Step-by-step guide for creating and setting up the `meta-log-db` native package.

## Prerequisites

- Node.js 18+ and npm
- TypeScript 5.0+
- Basic understanding of npm linking

## Step 1: Create Package Structure

```bash
# Create package directory
mkdir -p plugin/meta-log-db
cd plugin/meta-log-db

# Initialize npm package
npm init -y
```

## Step 2: Configure package.json

Edit `package.json`:

```json
{
  "name": "meta-log-db",
  "version": "1.0.0",
  "description": "Native database package for Meta-Log (ProLog, DataLog, R5RS)",
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
    "prolog",
    "datalog",
    "r5rs",
    "jsonl",
    "canvasl",
    "database"
  ],
  "author": "Automaton System",
  "license": "MIT",
  "dependencies": {
    "ethers": "^6.0.0"
  },
  "devDependencies": {
    "@types/node": "^20.0.0",
    "typescript": "^5.0.0",
    "jest": "^29.0.0",
    "@types/jest": "^29.0.0"
  },
  "peerDependencies": {},
  "engines": {
    "node": ">=18.0.0"
  }
}
```

## Step 3: Create TypeScript Configuration

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

## Step 4: Create Source Structure

```bash
mkdir -p src/{prolog,datalog,r5rs,jsonl,rdf,shacl}
mkdir -p types
```

## Step 5: Create Main Database Class

Create `src/database.ts`:

```typescript
import { PrologEngine } from './prolog/engine.js';
import { DatalogEngine } from './datalog/engine.js';
import { R5RSRegistry } from './r5rs/registry.js';
import { JsonlParser } from './jsonl/parser.js';
import { TripleStore } from './rdf/triple-store.js';
import { ShaclValidator } from './shacl/validator.js';

export interface MetaLogDbConfig {
  r5rsEnginePath?: string;
  enableProlog?: boolean;
  enableDatalog?: boolean;
  enableRdf?: boolean;
  enableShacl?: boolean;
}

export class MetaLogDb {
  private prolog?: PrologEngine;
  private datalog?: DatalogEngine;
  private r5rs?: R5RSRegistry;
  private jsonl: JsonlParser;
  private rdf?: TripleStore;
  private shacl?: ShaclValidator;
  private config: MetaLogDbConfig;

  constructor(config: MetaLogDbConfig = {}) {
    this.config = {
      enableProlog: true,
      enableDatalog: true,
      enableRdf: true,
      enableShacl: true,
      ...config
    };

    this.jsonl = new JsonlParser();

    if (this.config.enableProlog) {
      this.prolog = new PrologEngine();
    }

    if (this.config.enableDatalog) {
      this.datalog = new DatalogEngine();
    }

    if (this.config.enableRdf) {
      this.rdf = new TripleStore();
    }

    if (this.config.enableShacl) {
      this.shacl = new ShaclValidator();
    }

    if (this.config.r5rsEnginePath) {
      this.loadR5RSEngine(this.config.r5rsEnginePath);
    }
  }

  async loadR5RSEngine(path: string): Promise<void> {
    // Load R5RS engine implementation
    this.r5rs = new R5RSRegistry(path);
    await this.r5rs.load();
  }

  async loadCanvas(path: string): Promise<void> {
    const canvas = await this.jsonl.parse(path);
    const facts = this.jsonl.extractFacts(canvas);
    
    if (this.prolog) {
      this.prolog.addFacts(facts);
    }
    
    if (this.datalog) {
      this.datalog.addFacts(facts);
    }
    
    if (this.rdf) {
      const triples = this.jsonl.toRdf(facts);
      this.rdf.addTriples(triples);
    }
  }

  async prologQuery(query: string): Promise<any> {
    if (!this.prolog) {
      throw new Error('ProLog engine not enabled');
    }
    return await this.prolog.query(query);
  }

  async datalogQuery(query: string, program?: any): Promise<any> {
    if (!this.datalog) {
      throw new Error('DataLog engine not enabled');
    }
    return await this.datalog.query(query, program);
  }

  async sparqlQuery(query: string): Promise<any> {
    if (!this.rdf) {
      throw new Error('RDF engine not enabled');
    }
    return await this.rdf.sparql(query);
  }

  async validateShacl(shapes?: any, triples?: any): Promise<any> {
    if (!this.shacl) {
      throw new Error('SHACL validator not enabled');
    }
    return await this.shacl.validate(shapes, triples);
  }

  extractFacts(): any[] {
    return this.jsonl.getFacts();
  }
}
```

## Step 6: Create Main Export

Create `src/index.ts`:

```typescript
export { MetaLogDb, MetaLogDbConfig } from './database.js';
export * from './prolog/engine.js';
export * from './datalog/engine.js';
export * from './r5rs/registry.js';
export * from './jsonl/parser.js';
export * from './rdf/triple-store.js';
export * from './shacl/validator.js';
```

## Step 7: Install Dependencies

```bash
npm install
```

## Step 8: Build Package

```bash
npm run build
```

## Step 9: Create npm Link

```bash
npm link
```

This creates a global symlink to your package.

## Step 10: Use in Plugins

### OpenCode Plugin

```bash
cd .opencode/plugin
npm link meta-log-db
```

### Obsidian Plugin

```bash
cd .obsidian/plugins/universal-life-protocol-plugin
npm link meta-log-db
```

## Step 11: Development Workflow

```bash
# 1. Make changes to source files
# Edit src/**/*.ts

# 2. Rebuild
npm run build

# 3. Changes automatically available in linked plugins
# (No need to re-link or reinstall)

# 4. Watch mode for development
npm run watch
```

## Step 12: Testing

Create `src/database.test.ts`:

```typescript
import { MetaLogDb } from './database.js';

describe('MetaLogDb', () => {
  let db: MetaLogDb;

  beforeEach(() => {
    db = new MetaLogDb();
  });

  test('should create instance', () => {
    expect(db).toBeDefined();
  });

  test('should load canvas', async () => {
    await db.loadCanvas('./test.jsonl');
    const facts = db.extractFacts();
    expect(facts.length).toBeGreaterThan(0);
  });
});
```

Run tests:

```bash
npm test
```

## Troubleshooting

### Link Not Found

```bash
# Ensure package is linked
cd plugin/meta-log-db
npm link

# Verify link exists
npm ls -g --depth=0 | grep meta-log-db
```

### Type Errors

```bash
# Rebuild package
npm run build

# Clear node_modules in plugin
cd .opencode/plugin
rm -rf node_modules
npm install
npm link meta-log-db
```

### Module Not Found

Ensure `package.json` has correct `main` and `types` fields:

```json
{
  "main": "dist/index.js",
  "types": "dist/index.d.ts"
}
```

## Next Steps

- Implement ProLog engine (`src/prolog/engine.ts`)
- Implement DataLog engine (`src/datalog/engine.ts`)
- Implement R5RS registry (`src/r5rs/registry.ts`)
- Implement JSONL parser (`src/jsonl/parser.ts`)
- Implement RDF triple store (`src/rdf/triple-store.ts`)
- Implement SHACL validator (`src/shacl/validator.ts`)

---

**See Also**:
- [Meta-Log Database API Documentation](./API.md)
- [Meta-Log Plugin Setup Guide](../02-Meta-Log-Plugin/SETUP_GUIDE.md)
