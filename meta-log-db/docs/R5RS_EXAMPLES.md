# R5RS Scheme Parser Examples

This document provides comprehensive examples of using the R5RS Scheme parser in meta-log-db.

## Basic Scheme File Parsing

### Loading Scheme Files

```typescript
import { MetaLogDb } from 'meta-log-db';

const db = new MetaLogDb({
  r5rsEnginePath: './r5rs-canvas-engine.scm'
});

// The parser automatically extracts function definitions
await db.loadR5RSEngine('./r5rs-canvas-engine.scm');
```

### Simple Function Definition

```scheme
;; r5rs-canvas-engine.scm
(define (church-add m n)
  (lambda (f)
    (lambda (x)
      ((m f) ((n f) x)))))
```

### Parsing Result

```typescript
// The parser extracts:
// - Function name: church-add
// - Parameters: [m, n]
// - Body: (lambda (f) (lambda (x) ((m f) ((n f) x)))))
```

## Function Definitions

### Simple Define

```scheme
;; Define a constant
(define pi 3.14159)

;; Define a variable
(define x 42)
```

### Function Define

```scheme
;; Define a function
(define (square x)
  (* x x))

;; Equivalent to:
(define square
  (lambda (x)
    (* x x)))
```

### Lambda Expressions

```scheme
;; Lambda function
(lambda (x y)
  (+ x y))

;; Higher-order function
(define (make-adder n)
  (lambda (x)
    (+ x n)))
```

## Church Encoding Examples

### Church Numerals

```scheme
;; Church zero
(define church-zero
  (lambda (f)
    (lambda (x)
      x)))

;; Church successor
(define (church-succ n)
  (lambda (f)
    (lambda (x)
      (f ((n f) x)))))

;; Church addition
(define (church-add m n)
  (lambda (f)
    (lambda (x)
      ((m f) ((n f) x)))))

;; Church multiplication
(define (church-mult m n)
  (lambda (f)
    (m (n f))))

;; Church exponentiation
(define (church-exp m n)
  (n m))
```

### Y-Combinator

```scheme
;; Y-combinator for recursion
(define Y
  (lambda (f)
    ((lambda (x)
       (f (lambda (y)
            ((x x) y))))
     (lambda (x)
       (f (lambda (y)
            ((x x) y)))))))
```

## List Operations

### Basic Lists

```scheme
;; Cons cell
(define (cons a b)
  (lambda (f)
    (f a b)))

;; Car (first element)
(define (car pair)
  (pair (lambda (a b) a)))

;; Cdr (rest)
(define (cdr pair)
  (pair (lambda (a b) b)))

;; Null check
(define (null? x)
  (or (eq? x '())
      (eq? x null)))
```

## Canvas Operations

### JSONL Parsing

```scheme
;; Parse JSONL canvas
(define (parse-jsonl-canvas path)
  ;; Implementation would parse JSONL file
  '())

;; Extract facts
(define (extract-facts canvas)
  ;; Extract facts from canvas
  '())
```

### RDF Conversion

```scheme
;; Convert to RDF
(define (jsonl-to-rdf facts)
  ;; Convert facts to RDF triples
  '())
```

## Using Parsed Functions

### Executing R5RS Functions

```typescript
import { MetaLogDb } from 'meta-log-db';

const db = new MetaLogDb({
  r5rsEnginePath: './r5rs-canvas-engine.scm'
});

await db.loadR5RSEngine('./r5rs-canvas-engine.scm');

// Execute a parsed function
const result = await db.executeR5RSFunction('church-add', [2, 3]);
```

### Registering Custom Functions

```typescript
// Register a custom function
db.registerR5RSFunction('custom-add', (a, b) => a + b);

// Execute
const result = await db.executeR5RSFunction('custom-add', [5, 10]);
```

## Complex Examples

### Recursive Functions

```scheme
;; Factorial using Y-combinator
(define factorial
  (Y (lambda (fact)
       (lambda (n)
         (if (= n 0)
             1
             (* n (fact (- n 1))))))))
```

### Higher-Order Functions

```scheme
;; Map function
(define (map f lst)
  (if (null? lst)
      '()
      (cons (f (car lst))
            (map f (cdr lst)))))

;; Filter function
(define (filter pred lst)
  (if (null? lst)
      '()
      (if (pred (car lst))
          (cons (car lst)
                (filter pred (cdr lst)))
          (filter pred (cdr lst)))))
```

### Pattern Matching

```scheme
;; Pattern matching example
(define (process-node node)
  (cond
    ((eq? (car node) 'type)
     (process-type-node node))
    ((eq? (car node) 'edge)
     (process-edge-node node))
    (else
     (process-default-node node))))
```

## Integration Examples

### With Canvas Loading

```typescript
const db = new MetaLogDb({
  r5rsEnginePath: './r5rs-canvas-engine.scm'
});

// Load R5RS engine
await db.loadR5RSEngine('./r5rs-canvas-engine.scm');

// Load canvas (may use R5RS functions)
await db.loadCanvas('automaton.jsonl');

// Extract facts (may use R5RS functions)
const facts = db.extractFacts();
```

### With ProLog Queries

```typescript
// Use R5RS functions in ProLog rules
await db.addPrologRule(`
  church_sum(A, B, Result) :-
    r5rs_call('church-add', [A, B], Result).
`);

// Query
const results = await db.prologQuery('(church_sum 2 3 ?Result)');
```

### With SPARQL Queries

```typescript
// Convert R5RS results to RDF
const r5rsResult = await db.executeR5RSFunction('church-add', [2, 3]);

// Store as RDF triple
db.storeTriples([{
  subject: 'http://example.org/result',
  predicate: 'http://example.org/value',
  object: r5rsResult.toString()
}]);

// Query with SPARQL
const results = await db.sparqlQuery(`
  SELECT ?value WHERE {
    ?result :value ?value
  }
`);
```

## Error Handling

### Invalid Scheme File

```typescript
try {
  await db.loadR5RSEngine('./invalid-scheme.scm');
} catch (error) {
  console.error('Failed to parse Scheme file:', error);
  // Falls back to builtin functions
}
```

### Function Not Found

```typescript
try {
  await db.executeR5RSFunction('non-existent-function', []);
} catch (error) {
  console.error('Function not found:', error);
}
```

## Best Practices

1. **Organize functions** - Group related functions together
2. **Use meaningful names** - Clear function names improve readability
3. **Document functions** - Add comments explaining function behavior
4. **Test functions** - Test R5RS functions independently
5. **Handle errors** - Always handle parsing and execution errors

## Performance Tips

1. **Parse once** - Parse Scheme files once and reuse
2. **Cache results** - Cache function execution results
3. **Optimize functions** - Write efficient Scheme code
4. **Lazy evaluation** - Use lazy evaluation where appropriate
