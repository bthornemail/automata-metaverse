# SPARQL Query Examples

This document provides comprehensive examples of using the enhanced SPARQL query support in meta-log-db.

## Basic SELECT Queries

### Simple SELECT

```typescript
import { MetaLogDb } from 'meta-log-db';

const db = new MetaLogDb({ enableRdf: true });

// Load canvas data
await db.loadCanvas('automaton-kernel.jsonl');

// Simple SELECT query
const result = await db.sparqlQuery(`
  SELECT ?id ?type WHERE {
    ?id rdf:type ?type
  }
`);

console.log(result.results.bindings);
// Output: [{ id: { value: "node1", type: "uri" }, type: { value: "Node", type: "uri" } }]
```

### SELECT with DISTINCT

```typescript
// Get distinct types
const distinctTypes = await db.sparqlQuery(`
  SELECT DISTINCT ?type WHERE {
    ?id rdf:type ?type
  }
`);
```

### SELECT with Multiple Variables

```typescript
// Select multiple variables
const multiVar = await db.sparqlQuery(`
  SELECT ?subject ?predicate ?object WHERE {
    ?subject ?predicate ?object
  }
`);
```

## Filtering

### FILTER with Equality

```typescript
// Filter by exact match
const filtered = await db.sparqlQuery(`
  SELECT ?id WHERE {
    ?id rdf:type ?type
    FILTER (?type = "Node")
  }
`);
```

### FILTER with Comparison

```typescript
// Filter with greater than
const greaterThan = await db.sparqlQuery(`
  SELECT ?id ?value WHERE {
    ?id :hasValue ?value
    FILTER (?value > 10)
  }
`);
```

### FILTER with Regex

```typescript
// Filter with pattern matching
const regexFilter = await db.sparqlQuery(`
  SELECT ?id WHERE {
    ?id rdfs:label ?label
    FILTER (regex(?label, "automaton", "i"))
  }
`);
```

### FILTER with BOUND

```typescript
// Check if variable is bound
const boundCheck = await db.sparqlQuery(`
  SELECT ?id ?optional WHERE {
    ?id rdf:type ?type
    OPTIONAL { ?id :optionalProperty ?optional }
    FILTER (bound(?optional))
  }
`);
```

## Sorting and Pagination

### ORDER BY

```typescript
// Sort results
const sorted = await db.sparqlQuery(`
  SELECT ?id ?label WHERE {
    ?id rdfs:label ?label
  }
  ORDER BY ?label
`);
```

### ORDER BY DESC

```typescript
// Sort descending
const descSorted = await db.sparqlQuery(`
  SELECT ?id ?value WHERE {
    ?id :hasValue ?value
  }
  ORDER BY DESC(?value)
`);
```

### LIMIT

```typescript
// Limit results
const limited = await db.sparqlQuery(`
  SELECT ?id WHERE {
    ?id rdf:type ?type
  }
  LIMIT 10
`);
```

### OFFSET

```typescript
// Pagination with OFFSET
const paginated = await db.sparqlQuery(`
  SELECT ?id WHERE {
    ?id rdf:type ?type
  }
  ORDER BY ?id
  LIMIT 10
  OFFSET 20
`);
```

## OPTIONAL Patterns

### Basic OPTIONAL

```typescript
// Optional property
const optional = await db.sparqlQuery(`
  SELECT ?id ?label ?description WHERE {
    ?id rdf:type ?type
    ?id rdfs:label ?label
    OPTIONAL { ?id rdfs:comment ?description }
  }
`);
```

### Multiple OPTIONAL

```typescript
// Multiple optional properties
const multiOptional = await db.sparqlQuery(`
  SELECT ?id ?label ?desc ?metadata WHERE {
    ?id rdf:type ?type
    OPTIONAL { ?id rdfs:label ?label }
    OPTIONAL { ?id rdfs:comment ?desc }
    OPTIONAL { ?id :metadata ?metadata }
  }
`);
```

## Complex Queries

### Multiple Patterns

```typescript
// Multiple triple patterns
const complex = await db.sparqlQuery(`
  SELECT ?node ?edge ?target WHERE {
    ?node rdf:type "Node"
    ?edge :from ?node
    ?edge :to ?target
    ?target rdf:type "Node"
  }
`);
```

### Combined Filters

```typescript
// Multiple filters
const combinedFilters = await db.sparqlQuery(`
  SELECT ?id ?value WHERE {
    ?id :hasValue ?value
    FILTER (?value > 10)
    FILTER (?value < 100)
  }
`);
```

## Query Caching

### Enable/Disable Caching

```typescript
// Get triple store
const tripleStore = db.getDb().getTripleStore();

// Disable caching
tripleStore.setCacheEnabled(false);

// Enable caching (default)
tripleStore.setCacheEnabled(true);

// Clear cache
tripleStore.clearCache();
```

### Cached Query Example

```typescript
// First query - executes and caches
const result1 = await db.sparqlQuery(`
  SELECT ?id WHERE {
    ?id rdf:type ?type
  }
`);

// Second identical query - uses cache
const result2 = await db.sparqlQuery(`
  SELECT ?id WHERE {
    ?id rdf:type ?type
  }
`);
```

## Error Handling

### Invalid Query

```typescript
try {
  const result = await db.sparqlQuery('INVALID QUERY');
} catch (error) {
  console.error('SPARQL query error:', error);
  // Falls back to simple parser if enhanced parser fails
}
```

### Empty Results

```typescript
// Query with no matches
const empty = await db.sparqlQuery(`
  SELECT ?id WHERE {
    ?id rdf:type "NonExistentType"
  }
`);

console.log(empty.results.bindings); // []
```

## Performance Tips

1. **Use DISTINCT sparingly** - It requires additional processing
2. **Limit result sets** - Use LIMIT to avoid large result sets
3. **Enable caching** - For repeated queries
4. **Filter early** - Apply FILTERs before OPTIONAL patterns
5. **Index frequently queried properties** - Consider indexing for performance

## Advanced Examples

### Nested Patterns

```typescript
// Complex nested query
const nested = await db.sparqlQuery(`
  SELECT ?parent ?child WHERE {
    ?parent rdf:type "Node"
    ?parent :hasChild ?child
    ?child rdf:type "Node"
    OPTIONAL {
      ?child :hasMetadata ?meta
      FILTER (?meta = "important")
    }
  }
  ORDER BY ?parent
  LIMIT 50
`);
```

### Type Inference

```typescript
// Query with type inference
const typed = await db.sparqlQuery(`
  SELECT ?id ?value WHERE {
    ?id :hasValue ?value
    FILTER (isLiteral(?value))
  }
`);
```

## Integration with Other Features

### With ProLog

```typescript
// Use SPARQL results in ProLog
const sparqlResults = await db.sparqlQuery(`
  SELECT ?id WHERE {
    ?id rdf:type "Node"
  }
`);

// Convert to ProLog facts
for (const binding of sparqlResults.results.bindings) {
  await db.prologQuery(`(node ${binding.id.value})`);
}
```

### With DataLog

```typescript
// Combine SPARQL and DataLog
const facts = db.extractFacts();
const triples = db.jsonlToRdf(facts);
db.storeTriples(triples);

// Query with SPARQL
const results = await db.sparqlQuery(`
  SELECT ?subject ?object WHERE {
    ?subject rdf:type ?object
  }
`);
```
