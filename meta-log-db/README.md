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

## Installation

```bash
npm install
npm run build
npm link
```

## Usage

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
const results = await db.prologQuery('(node ?Id ?Type)');

// DataLog query
const datalogResults = await db.datalogQuery('(missing_implementation ?N)');

// SPARQL query
const sparqlResults = await db.sparqlQuery(`
  SELECT ?id ?type WHERE {
    ?id rdf:type ?type
  }
`);

// SHACL validation
const validation = await db.validateShacl();
```

## API Reference

See [API.md](./API.md) for complete API documentation.

## Development

```bash
# Build
npm run build

# Watch mode
npm run watch

# Test
npm test
```

## Linking to Plugins

```bash
# Link meta-log-db
cd meta-log-db
npm link

# Use in OpenCode plugin
cd .opencode
npm link meta-log-db

# Use in Obsidian plugin
cd .obsidian/plugins/universal-life-protocol-plugin
npm link meta-log-db
```

## License

MIT
