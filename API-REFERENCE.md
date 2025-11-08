---
id: api-reference-r5rs
title: "R5RS Canvas Engine - API Reference"
level: practical
type: reference
tags: [api-reference, r5rs, function-registry, api-documentation]
keywords: [api-reference, r5rs-canvas-engine, function-registry, r5rs-functions, blackboard-architecture, automaton-self-building]
prerequisites: [r5rs-engine-readme]
enables: []
related: [r5rs-canvas-engine, blackboard-architecture-guide, r5rs-engine-readme, meta-log-implementation-guide]
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
    regeneration:
      function: "r5rs:parse-jsonl-canvas"
      args: ["generate.metaverse.jsonl"]
  modules:
    module1: "Foundation & Primitives - Church encoding, Y-combinator"
    module2: "JSONL Parser & Canvas Loader"
    module3: "RDF Layer"
    module4: "OWL Reasoning"
    module5: "SHACL Validation"
    module6: "Logic Programming - Prolog, Datalog"
    module7: "SPARQL Engine"
    module8: "NLP & M/S-Expressions"
    module9: "Quantum & AI"
    module10: "REPL & Interactive"
    module11: "Public API & Function Registry"
---

# R5RS Canvas Engine - API Reference

## Function Registry

All functions are accessible via the `*function-registry*` with the `r5rs:` prefix.

## Module 1: Foundation & Primitives

### Church Encoding

- **`r5rs:church-zero`**: `(lambda (f) (lambda (x) x))`
- **`r5rs:church-one`**: `(lambda (f) (lambda (x) (f x)))`
- **`r5rs:church-succ`**: `(lambda (n) (lambda (f) (lambda (x) (f ((n f) x)))))`
- **`r5rs:church-add`**: `(lambda (m n) (lambda (f) (lambda (x) ((m f) ((n f) x)))))`
- **`r5rs:church-mult`**: `(lambda (m n) (lambda (f) (m (n f))))`
- **`r5rs:church-exp`**: `(lambda (m n) (n m))`

### Y-Combinator

- **`Y`**: Fixed-point combinator for self-reference

## Module 2: JSONL Parser & Canvas Loader

### Parsing

- **`r5rs:parse-jsonl-canvas`**: `(filename) -> list of parsed objects`
  - Parses a JSONL file and returns a list of association lists

- **`r5rs:extract-facts`**: `(parsed-objects) -> list of facts`
  - Extracts Datalog facts from parsed JSONL objects

- **`r5rs:query-facts`**: `(facts pattern) -> matching facts`
  - Queries facts using pattern matching

### Pattern Matching

- **`match-pattern`**: `(pattern fact) -> bindings or #f`
- **`match-args`**: `(pat-args fact-args bindings) -> bindings or #f`
- **`variable?`**: `(x) -> boolean`

## Module 3: RDF Layer

### Triple Operations

- **`r5rs:jsonl-to-rdf`**: `(facts) -> list of triples`
  - Converts JSONL facts to RDF triples

- **`r5rs:rdf-query`**: `(triples s p o) -> matching triples`
  - Queries RDF triples (use `'?` for wildcards)

- **`r5rs:rdfs-entail`**: `(triples) -> extended triples`
  - Applies RDFS entailment rules

## Module 4: OWL Reasoning

- **`r5rs:owl-entail`**: `(triples) -> extended triples`
  - Applies OWL entailment rules (sameAs, inverseOf, transitive, etc.)

### OWL Closures

- **`owl-sameAs-closure`**: `(triples) -> new triples`
- **`owl-inverse-closure`**: `(triples) -> new triples`
- **`owl-transitive-closure`**: `(triples) -> new triples`
- **`owl-symmetric-closure`**: `(triples) -> new triples`
- **`owl-functional-closure`**: `(triples) -> new triples`
- **`owl-inv-functional-closure`**: `(triples) -> new triples`

## Module 5: SHACL Validation

- **`r5rs:load-shacl-shapes`**: `(facts) -> list of shapes`
  - Loads SHACL shapes from canvas facts

- **`r5rs:shacl-validate`**: `(shapes triples) -> validation report`
  - Validates RDF graph against SHACL shapes

### Validation Helpers

- **`validate-target`**: `(target constraints triples) -> violations`
- **`validate-constraint`**: `(constraint focus triples) -> violations`
- **`valid-node-kind?`**: `(node kind) -> boolean`

## Module 6: Logic Programming

### Prolog

- **`r5rs:prolog-query`**: `(db goal) -> list of solutions`
  - Queries a Prolog database with a goal

### Datalog

- **`r5rs:datalog-query`**: `(program goal) -> list of solutions`
  - Queries a Datalog program with a goal

### Unification

- **`unify`**: `(x y bindings) -> bindings or #f`
- **`bind`**: `(var val bindings) -> bindings`
- **`subst`**: `(bindings term) -> substituted term`

## Module 7: SPARQL Engine

- **`r5rs:sparql-query`**: `(query-str triples) -> results`
  - Executes a SPARQL query over RDF triples

### SPARQL Parser

- **`parse-sparql`**: `(str) -> parsed query`
- **`execute-query`**: `(parsed triples) -> results`
- **`execute-bgp`**: `(patterns triples) -> results`
- **`apply-filters`**: `(results filters) -> filtered results`
- **`apply-optionals`**: `(results optionals triples) -> results`

## Module 8: NLP & M/S-Expressions

- **`r5rs:m->s`**: `(expr mappings) -> s-expression`
  - Converts M-expression to S-expression

- **`r5rs:s->m`**: `(expr mappings) -> m-expression`
  - Converts S-expression to M-expression

- **`r5rs:nlp-eval`**: `(query-str mappings) -> (m s)`
  - Evaluates a natural language query

### Pattern Matching

- **`rewrite`**: `(expr rules) -> rewritten expr`
- **`match`**: `(pat expr bindings) -> bindings or #f`
- **`instantiate`**: `(template bindings) -> instantiated expr`

## Module 9: Quantum & AI

### Attention Mechanism

- **`r5rs:attention`**: `(Q K V) -> output`
  - Computes attention: `softmax(QK^T)V`

- **`mat-mul`**: `(A B) -> matrix`
- **`transpose`**: `(M) -> transposed matrix`
- **`softmax`**: `(scores) -> probabilities`

### Quantum Operations

- **`r5rs:qubit`**: `(alpha beta) -> qubit state`
  - Creates a qubit: `|ψ⟩ = α|0⟩ + β|1⟩`

- **`r5rs:apply-gate`**: `(state gate) -> new state`
  - Applies a quantum gate to a qubit state

- **`mat-vec-mul`**: `(M v) -> vector`
- **`complex-mul`**: `(a b) -> complex number`
- **`complex-sum`**: `(lst) -> complex sum`

## Module 11: Public API & Function Registry

### Registry Access

- **`*function-registry*`**: Association list mapping function names to implementations

- **`invoke-from-jsonl`**: `(func-name args context) -> result`
  - Invokes a function from the registry with arguments and context

- **`get-context`**: `(context key) -> value`
  - Gets a value from the context association list

## Context Structure

The `context` parameter passed to `invoke-from-jsonl` should be an association list:

```scheme
'((facts . <list-of-facts>)
  (triples . <list-of-triples>)
  (prolog-db . <prolog-database>)
  (datalog-db . <datalog-program>)
  (shapes . <list-of-shacl-shapes>)
  (mappings . <m-s-mappings>))
```

## Example Usage

```scheme
;; Setup context
(define parsed (parse-jsonl-canvas "canvas.jsonl"))
(define facts (extract-facts parsed))
(define triples (jsonl-to-rdf facts))
(define context `((facts . ,facts) (triples . ,triples)))

;; Invoke function from JSONL reference
(invoke-from-jsonl 'r5rs:attention 
                   '((1.0 0.0) (0.0 1.0) (1.0 1.0))
                   context)

;; Query RDF
(invoke-from-jsonl 'r5rs:rdf-query
                   '(? "rdfs:subClassOf" "canvas:0D-topology")
                   context)
```

## Error Handling

Functions return error values or use Scheme's `error` procedure:

- **Function not found**: `(error "Function not found" func-name)`
- **Invalid input**: Functions validate inputs and return `#f` or empty lists on failure
- **Pattern match failure**: Returns `#f` when patterns don't match

## Performance Notes

- Pure functions enable memoization
- Immutable data structures allow safe sharing
- Functions can be parallelized where dependencies allow
- Large datasets may benefit from lazy evaluation (not implemented)
