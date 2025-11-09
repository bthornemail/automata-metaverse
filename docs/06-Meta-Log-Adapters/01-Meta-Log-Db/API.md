---
id: meta-log-db-api
title: "Meta-Log Database API Reference"
level: practical
type: reference
tags: [meta-log-db, api-reference, prolog, datalog, r5rs]
keywords: [meta-log-db-api, prolog-api, datalog-api, r5rs-api, jsonl-api, rdf-api, shacl-api]
prerequisites: [meta-log-db-readme, meta-log-db-setup-guide]
enables: []
related: [meta-log-plugin-api, multiverse-canvas-rfc2119-spec]
readingTime: 60
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
---

# Meta-Log Database API Reference

Complete API reference for the `meta-log-db` package.

## MetaLogDb Class

### Constructor

```typescript
new MetaLogDb(config?: MetaLogDbConfig)
```

**Parameters:**
- `config.r5rsEnginePath?: string` - Path to R5RS canvas engine
- `config.enableProlog?: boolean` - Enable ProLog engine (default: true)
- `config.enableDatalog?: boolean` - Enable DataLog engine (default: true)
- `config.enableRdf?: boolean` - Enable RDF/SPARQL (default: true)
- `config.enableShacl?: boolean` - Enable SHACL validation (default: true)

### Methods

#### `loadR5RSEngine(path: string): Promise<void>`

Load R5RS canvas engine from file path.

#### `loadCanvas(path: string): Promise<void>`

Load JSONL/CanvasL canvas file and extract facts.

#### `prologQuery(query: string): Promise<PrologQueryResult>`

Execute ProLog query.

**Example:**
```typescript
const results = await db.prologQuery('(church_encoding ?X ?D)');
```

#### `datalogQuery(query: string, program?: DatalogProgram): Promise<DatalogQueryResult>`

Execute DataLog query.

**Example:**
```typescript
const results = await db.datalogQuery('(missing_implementation ?N)');
```

#### `sparqlQuery(query: string): Promise<SparqlQueryResult>`

Execute SPARQL query.

**Example:**
```typescript
const results = await db.sparqlQuery(`
  SELECT ?id ?type WHERE {
    ?id rdf:type ?type
  }
`);
```

#### `validateShacl(shapes?: ShaclShapes, triples?: RdfTriples): Promise<ShaclValidationReport>`

Validate RDF triples against SHACL shapes.

#### `extractFacts(): Fact[]`

Extract facts from loaded canvas.

## ProLog Engine

### `PrologEngine` Class

```typescript
class PrologEngine {
  addFacts(facts: Fact[]): void;
  addRule(rule: PrologRule): void;
  query(goal: string): Promise<PrologQueryResult>;
  buildDb(facts: Fact[]): void;
}
```

## DataLog Engine

### `DatalogEngine` Class

```typescript
class DatalogEngine {
  addFacts(facts: Fact[]): void;
  addRule(rule: DatalogRule): void;
  query(goal: string, program?: DatalogProgram): Promise<DatalogQueryResult>;
  buildProgram(rules: DatalogRule[]): DatalogProgram;
  fixedPoint(program: DatalogProgram): Fact[];
}
```

## R5RS Registry

### `R5RSRegistry` Class

```typescript
class R5RSRegistry {
  load(path: string): Promise<void>;
  execute(functionName: string, args: any[]): Promise<any>;
  register(name: string, fn: Function): void;
  getFunction(name: string): Function | null;
}
```

## JSONL Parser

### `JsonlParser` Class

```typescript
class JsonlParser {
  parse(path: string): Promise<Canvas>;
  parseCanvasL(path: string): Promise<Canvas>;
  extractFacts(canvas: Canvas): Fact[];
  toRdf(facts: Fact[]): RdfTriple[];
  getFacts(): Fact[];
}
```

## RDF Triple Store

### `TripleStore` Class

```typescript
class TripleStore {
  addTriples(triples: RdfTriple[]): void;
  sparql(query: string): Promise<SparqlQueryResult>;
  rdfsEntailment(triples: RdfTriple[]): RdfTriple[];
  query(pattern: TriplePattern): RdfTriple[];
}
```

## SHACL Validator

### `ShaclValidator` Class

```typescript
class ShaclValidator {
  loadShapes(path: string): Promise<ShaclShapes>;
  validate(shapes: ShaclShapes, triples: RdfTriple[]): Promise<ShaclValidationReport>;
  checkConstraint(shape: ShaclShape, node: string, triples: RdfTriple[]): boolean;
}
```

## Type Definitions

```typescript
interface Fact {
  predicate: string;
  args: any[];
}

interface PrologQueryResult {
  bindings: Record<string, any>[];
}

interface DatalogQueryResult {
  facts: Fact[];
}

interface SparqlQueryResult {
  results: {
    bindings: Record<string, { value: string; type: string }>[];
  };
}

interface ShaclValidationReport {
  conforms: boolean;
  violations: ShaclViolation[];
}

interface ShaclViolation {
  focusNode: string;
  resultPath: string;
  message: string;
  severity: 'error' | 'warning' | 'info';
}
```

---

**See Also**: [Meta-Log Database README](./README.md)
