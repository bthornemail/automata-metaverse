# SHACL Validation Examples

This document provides comprehensive examples of using the enhanced SHACL shape parser and validator in meta-log-db.

## Basic SHACL Shapes

### Simple NodeShape

```turtle
@prefix sh: <http://www.w3.org/ns/shacl#> .
@prefix rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#> .
@prefix ex: <http://example.org/> .

ex:NodeShape
  a sh:NodeShape ;
  sh:targetClass ex:Node ;
  sh:property [
    sh:path rdfs:label ;
    sh:minCount 1 ;
    sh:datatype xsd:string
  ] .
```

### Loading Shapes

```typescript
import { MetaLogDb } from 'meta-log-db';

const db = new MetaLogDb({ enableShacl: true });

// Load SHACL shapes from file
const shapes = await db.loadShaclShapes('./shapes.ttl');

// Load canvas data
await db.loadCanvas('automaton-kernel.jsonl');

// Convert to RDF triples
const facts = db.extractFacts();
const triples = db.jsonlToRdf(facts);

// Validate
const report = await db.validateShacl(shapes, triples);

if (report.conforms) {
  console.log('Validation passed!');
} else {
  console.log('Validation violations:', report.violations);
}
```

## Property Shapes

### Required Properties

```turtle
ex:NodeShape
  a sh:NodeShape ;
  sh:targetClass ex:Node ;
  sh:property [
    sh:path rdfs:label ;
    sh:minCount 1 ;
    sh:maxCount 1 ;
    sh:datatype xsd:string
  ] ;
  sh:property [
    sh:path ex:type ;
    sh:minCount 1 ;
    sh:datatype xsd:string
  ] .
```

### Optional Properties

```turtle
ex:NodeShape
  a sh:NodeShape ;
  sh:targetClass ex:Node ;
  sh:property [
    sh:path rdfs:label ;
    sh:minCount 1
  ] ;
  sh:property [
    sh:path rdfs:comment ;
    sh:minCount 0 ;
    sh:maxCount 1
  ] .
```

### Cardinality Constraints

```turtle
ex:EdgeShape
  a sh:NodeShape ;
  sh:targetClass ex:Edge ;
  sh:property [
    sh:path ex:from ;
    sh:minCount 1 ;
    sh:maxCount 1
  ] ;
  sh:property [
    sh:path ex:to ;
    sh:minCount 1 ;
    sh:maxCount 1
  ] ;
  sh:property [
    sh:path ex:weight ;
    sh:minCount 0 ;
    sh:maxCount 1 ;
    sh:datatype xsd:float
  ] .
```

## Datatype Constraints

### String Datatype

```turtle
ex:StringPropertyShape
  a sh:PropertyShape ;
  sh:path ex:name ;
  sh:datatype xsd:string ;
  sh:minLength 1 ;
  sh:maxLength 100 .
```

### Integer Datatype

```turtle
ex:IntegerPropertyShape
  a sh:PropertyShape ;
  sh:path ex:count ;
  sh:datatype xsd:integer ;
  sh:minInclusive 0 ;
  sh:maxInclusive 100 .
```

### Boolean Datatype

```turtle
ex:BooleanPropertyShape
  a sh:PropertyShape ;
  sh:path ex:enabled ;
  sh:datatype xsd:boolean .
```

## Class Constraints

### Class Constraint

```turtle
ex:NodeShape
  a sh:NodeShape ;
  sh:targetClass ex:Node ;
  sh:property [
    sh:path ex:parent ;
    sh:class ex:Node
  ] .
```

## Validation Examples

### Basic Validation

```typescript
const db = new MetaLogDb({ enableShacl: true });

// Load shapes
const shapes = await db.loadShaclShapes('./node-shapes.ttl');

// Load and convert data
await db.loadCanvas('automaton.jsonl');
const facts = db.extractFacts();
const triples = db.jsonlToRdf(facts);

// Validate
const report = await db.validateShacl(shapes, triples);

console.log('Conforms:', report.conforms);
console.log('Violations:', report.violations.length);
```

### Handling Violations

```typescript
const report = await db.validateShacl(shapes, triples);

if (!report.conforms) {
  for (const violation of report.violations) {
    console.error(`Violation on ${violation.focusNode}:`);
    console.error(`  Path: ${violation.resultPath}`);
    console.error(`  Message: ${violation.message}`);
    console.error(`  Severity: ${violation.severity}`);
  }
}
```

### Validation with Error Recovery

```typescript
try {
  const report = await db.validateShacl(shapes, triples);
  
  if (!report.conforms) {
    // Handle violations
    console.warn(`Found ${report.violations.length} violations`);
    
    // Filter out invalid triples
    const validTriples = triples.filter(triple => {
      // Check if triple violates any constraint
      return !report.violations.some(v => 
        v.focusNode === triple.subject && 
        v.resultPath === triple.predicate
      );
    });
    
    return validTriples;
  }
} catch (error) {
  console.error('Validation error:', error);
  // Fallback to unvalidated data
  return triples;
}
```

## Complex Shapes

### Nested Shapes

```turtle
ex:AutomatonShape
  a sh:NodeShape ;
  sh:targetClass ex:Automaton ;
  sh:property [
    sh:path ex:hasNode ;
    sh:node ex:NodeShape
  ] ;
  sh:property [
    sh:path ex:hasEdge ;
    sh:node ex:EdgeShape
  ] .
```

### Multiple Target Classes

```turtle
ex:CommonShape
  a sh:NodeShape ;
  sh:targetClass ex:Node ;
  sh:targetClass ex:Edge ;
  sh:property [
    sh:path rdfs:label ;
    sh:minCount 1
  ] .
```

## Shape Inheritance

### Base Shape

```turtle
ex:BaseShape
  a sh:NodeShape ;
  sh:property [
    sh:path rdfs:label ;
    sh:minCount 1
  ] .

ex:DerivedShape
  a sh:NodeShape ;
  sh:targetClass ex:DerivedNode ;
  sh:property [
    sh:path ex:specificProperty ;
    sh:minCount 1
  ] .
```

## Pattern Constraints

### Regex Pattern

```turtle
ex:IDShape
  a sh:PropertyShape ;
  sh:path ex:id ;
  sh:pattern "^[a-zA-Z0-9_-]+$" ;
  sh:flags "i" .
```

## Validation Workflow

### Complete Validation Pipeline

```typescript
async function validateCanvas(canvasPath: string, shapesPath: string) {
  const db = new MetaLogDb({ 
    enableRdf: true, 
    enableShacl: true 
  });

  // Step 1: Load shapes
  const shapes = await db.loadShaclShapes(shapesPath);
  console.log(`Loaded ${Object.keys(shapes).length} shapes`);

  // Step 2: Load canvas
  await db.loadCanvas(canvasPath);
  console.log('Canvas loaded');

  // Step 3: Extract facts
  const facts = db.extractFacts();
  console.log(`Extracted ${facts.length} facts`);

  // Step 4: Convert to RDF
  const triples = db.jsonlToRdf(facts);
  console.log(`Converted to ${triples.length} triples`);

  // Step 5: Validate
  const report = await db.validateShacl(shapes, triples);
  
  // Step 6: Report results
  if (report.conforms) {
    console.log('✅ Validation passed!');
    return { valid: true, triples };
  } else {
    console.log(`❌ Validation failed: ${report.violations.length} violations`);
    return { 
      valid: false, 
      violations: report.violations,
      triples 
    };
  }
}

// Usage
const result = await validateCanvas(
  './automaton.jsonl',
  './shapes.ttl'
);
```

## Error Handling

### Invalid Shape File

```typescript
try {
  const shapes = await db.loadShaclShapes('./invalid-shapes.ttl');
} catch (error) {
  console.error('Failed to load shapes:', error);
  // Falls back to simplified parser
}
```

### Validation Errors

```typescript
try {
  const report = await db.validateShacl(shapes, triples);
} catch (error) {
  console.error('Validation error:', error);
  // Handle error appropriately
}
```

## Integration Examples

### With SPARQL Queries

```typescript
// Validate before querying
const report = await db.validateShacl(shapes, triples);

if (report.conforms) {
  // Safe to query
  const results = await db.sparqlQuery(`
    SELECT ?id WHERE {
      ?id rdf:type ex:Node
    }
  `);
} else {
  console.warn('Data does not conform to shapes');
}
```

### With ProLog Rules

```typescript
// Add validation rules to ProLog
await db.addPrologRule(`
  invalid_node(N) :-
    node(N, Type),
    not has_label(N, _),
    required_label(Type).
`);

// Validate with SHACL
const report = await db.validateShacl(shapes, triples);

// Query violations with ProLog
const invalidNodes = await db.prologQuery('(invalid_node ?N)');
```

## Best Practices

1. **Define shapes early** - Create SHACL shapes before loading data
2. **Validate incrementally** - Validate as data is added
3. **Handle violations gracefully** - Don't fail on minor violations
4. **Use descriptive messages** - Add custom violation messages
5. **Combine with other validators** - Use SHACL with custom validation

## Performance Tips

1. **Cache shapes** - Load shapes once and reuse
2. **Validate selectively** - Only validate when needed
3. **Batch validation** - Validate multiple triples at once
4. **Optimize shapes** - Keep shapes simple and focused
