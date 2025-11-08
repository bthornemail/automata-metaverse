---
id: meta-log-quick-reference
title: "Meta-Log Quick Reference"
level: practical
type: guide
tags: [meta-log, quick-reference, prolog, datalog, r5rs, syntax-reference]
keywords: [meta-log-quick-reference, prolog-syntax, datalog-syntax, r5rs-canvas-engine, blackboard-architecture, automaton-self-building, code-snippets, function-reference]
prerequisites: [multiverse-canvas-rfc2119-spec, meta-log-implementation-guide]
enables: []
related: [r5rs-canvas-engine, blackboard-architecture-guide, multiverse-canvas-rfc2119-spec, canvasl-quick-reference]
readingTime: 30
difficulty: 2
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
        quickFunctions:
          - "r5rs:parse-jsonl-canvas"
          - "r5rs:extract-facts"
          - "r5rs:jsonl-to-rdf"
          - "r5rs:prolog-query"
          - "r5rs:datalog-query"
          - "r5rs:sparql-query"
          - "r5rs:shacl-validate"
  prologQuickRef:
    functions:
      - name: "build-prolog-db"
        signature: "(build-prolog-db facts)"
        description: "Build Prolog database from facts"
      - name: "prolog-query"
        signature: "(prolog-query db goal)"
        description: "Execute Prolog query"
      - name: "unify"
        signature: "(unify term1 term2)"
        description: "Unify two terms"
  datalogQuickRef:
    functions:
      - name: "extract-facts"
        signature: "(extract-facts parsed-objects)"
        description: "Extract Datalog facts from JSONL"
      - name: "datalog-query"
        signature: "(datalog-query program goal)"
        description: "Execute Datalog query"
      - name: "query-facts"
        signature: "(query-facts facts pattern)"
        description: "Query facts with pattern matching"
  rdfQuickRef:
    functions:
      - name: "jsonl-to-rdf"
        signature: "(jsonl-to-rdf facts)"
        description: "Convert facts to RDF triples"
      - name: "sparql-query"
        signature: "(sparql-query query-string triples)"
        description: "Execute SPARQL query"
      - name: "rdf-query"
        signature: "(rdf-query triples subject predicate object)"
        description: "Query RDF triples"
---

# Meta-Log Quick Reference

**Quick reference for ProLog, DataLog, R5RS Lisp → JSONL → CanvasL → Multiverse Canvas**

## Quick Start

### Parse JSONL Files

```scheme
;; Load and parse automaton files
(define metaverse (parse-jsonl-canvas "generate.metaverse.jsonl"))
(define kernel (parse-jsonl-canvas "automaton-kernel.jsonl"))
(define automaton (parse-jsonl-canvas "automaton.jsonl"))
```

### Extract Facts (DataLog)

```scheme
;; Extract Datalog facts from parsed JSONL
(define facts (extract-facts metaverse))

;; Query facts
(define nodes (query-facts facts '(node ?id ?type ?x ?y ?text)))
(define edges (query-facts facts '(edge ?id ?from ?to)))
```

### Convert to RDF

```scheme
;; Convert facts to RDF triples
(define triples (jsonl-to-rdf facts))

;; Query RDF triples
(define node-triples (rdf-query triples "canvas:node-1" "?" "?"))
```

### Prolog Queries

```scheme
;; Build Prolog database from facts
(define prolog-db (build-prolog-db facts))

;; Execute Prolog query
(define results (prolog-query prolog-db '(church_encoding ?X ?D)))
```

### Datalog Queries

```scheme
;; Build Datalog program from facts and rules
(define datalog-program (build-datalog-program facts))

;; Execute Datalog query
(define results (datalog-query datalog-program '(missing_implementation ?N)))
```

### SPARQL Queries

```scheme
;; Execute SPARQL query over RDF triples
(define results (sparql-query 
  "SELECT ?id ?type WHERE { ?id rdf:type canvas:Node }"
  triples))
```

## R5RS Function Reference

### Church Encoding

```scheme
(r5rs:church-zero)          ; λf.λx.x
(r5rs:church-one)           ; λf.λx.f(x)
(r5rs:church-succ n)        ; Successor
(r5rs:church-add m n)       ; Addition
(r5rs:church-mult m n)      ; Multiplication
(r5rs:church-exp m n)       ; Exponentiation
```

### JSONL Operations

```scheme
(r5rs:parse-jsonl-canvas filename)        ; Parse JSONL file
(r5rs:extract-facts parsed-objects)       ; Extract Datalog facts
(r5rs:query-facts facts query-pattern)    ; Query facts
(r5rs:load-canvas! filename)              ; Load into blackboard
(r5rs:bb-query predicate)                 ; Query blackboard
(r5rs:bb-get id)                          ; Get node by ID
```

### RDF Operations

```scheme
(r5rs:jsonl-to-rdf facts)                 ; Convert to RDF triples
(r5rs:rdf-query triples s p o)            ; Query triples
(r5rs:rdf-describe resource)              ; Describe resource
(r5rs:rdfs-entail triples)                ; RDFS entailment
(r5rs:owl-entail triples)                 ; OWL entailment
(r5rs:sparql-query query-str triples)    ; SPARQL query
(r5rs:sparql-update update-str triples)   ; SPARQL UPDATE
```

### Validation

```scheme
(r5rs:load-shacl-shapes facts)            ; Load SHACL shapes
(r5rs:shacl-validate shapes triples)      ; Validate
(r5rs:inheritance-depth node)             ; Compute depth
```

### Logic Programming

```scheme
(r5rs:prolog-query db goal)               ; Prolog query
(r5rs:prolog-assert head body)            ; Assert Prolog rule
(r5rs:unify x y bindings)                 ; Unification
(r5rs:datalog-query program goal)         ; Datalog query
(r5rs:datalog-assert head body...)        ; Assert Datalog rule
(r5rs:evaluate-program)                   ; Evaluate (fixed-point)
```

### M-Expression/S-Expression

```scheme
(r5rs:m->s mexpr)                         ; M → S conversion
(r5rs:s->m sexpr)                         ; S → M conversion
(r5rs:m->rdf mexpr)                       ; M → RDF reification
(r5rs:s->rdf sexpr)                       ; S → RDF reification
(r5rs:nlp->rdf query-str)                 ; NLP → RDF
```

## Common Patterns

### Pattern 1: Load and Query

```scheme
(define (load-and-query filename)
  (let ((parsed (parse-jsonl-canvas filename)))
    (let ((facts (extract-facts parsed)))
      (let ((triples (jsonl-to-rdf facts)))
        (sparql-query "SELECT ?id WHERE { ?id rdf:type canvas:Node }" triples)))))
```

### Pattern 2: Validate File

```scheme
(define (validate-file filename)
  (let ((facts (extract-facts (parse-jsonl-canvas filename))))
    (let ((shapes (load-shacl-shapes facts))
          (triples (jsonl-to-rdf facts)))
      (shacl-validate shapes triples))))
```

### Pattern 3: Generate from Metaverse

```scheme
(define (generate-from-metaverse)
  (let ((metaverse (parse-jsonl-canvas "generate.metaverse.jsonl")))
    (let ((facts (extract-facts metaverse)))
      (let ((triples (jsonl-to-rdf facts)))
        (let ((references (sparql-query 
                           "SELECT ?id ?target WHERE { ?id rdf:type metaverse:Reference }"
                           triples)))
          (for-each generate-file references))))))
```

## CanvasL Examples

### Basic CanvasL File

```canvasl
@version: "1.0"
@schema: "canvasl-v1"

{"id": "0D-topology", "type": "text", "dimension": "0D", "x": 0, "y": 0, "text": "# 0D: Quantum Vacuum"}
{"id": "1D-topology", "type": "text", "dimension": "1D", "x": 0, "y": 180, "text": "# 1D: Time Dimension"}
{"id": "v:0D→1D", "type": "vertical", "fromNode": "#0D-topology", "toNode": "#1D-topology", "label": "tan(): 0 → x"}
```

### R5RS Function Call

```json
{
  "id": "r5rs-compute",
  "type": "r5rs-call",
  "function": "r5rs:church-add",
  "args": [2, 3]
}
```

### Prolog Rule

```json
{
  "id": "prolog-rule-1",
  "type": "prolog",
  "head": "church_encoding(X,D)",
  "body": ["implements(X,Y)", "dimension(Y,D)"]
}
```

### Datalog Rule

```json
{
  "id": "datalog-rule-1",
  "type": "datalog",
  "head": "missing_implementation(N)",
  "body": ["node(N)", "not implements(N,_)"]
}
```

## Query Examples

### Query Nodes by Dimension

```scheme
;; Datalog query
(define nodes-0D (query-facts facts '(node ?id ?type ?x ?y ?text) 
                               '((dimension ?id "0D"))))

;; SPARQL query
(define nodes-0D (sparql-query 
  "SELECT ?id ?type WHERE { ?id rdf:type canvas:Node . ?id canvas:dimension \"0D\" }"
  triples))
```

### Query Edges by Type

```scheme
;; Datalog query
(define vertical-edges (query-facts facts '(vertical ?id ?from ?to)))

;; SPARQL query
(define vertical-edges (sparql-query 
  "SELECT ?id ?from ?to WHERE { ?id rdf:type canvas:VerticalEdge }"
  triples))
```

### Query Prolog Rules

```scheme
;; Prolog query
(define church-encodings (prolog-query prolog-db '(church_encoding ?X ?D)))
```

### Query Datalog Rules

```scheme
;; Datalog query
(define missing-impls (datalog-query datalog-program '(missing_implementation ?N)))
```

## File Structure

### Key Files

- `generate.metaverse.jsonl`: Metaverse generator
- `automaton-kernel.seed.jsonl`: Kernel seed
- `automaton-kernel.jsonl`: Full kernel
- `automaton.canvas.space.jsonl`: Canvas space
- `automaton.jsonl`: Operational automaton
- `r5rs-functions-trie.jsonl`: R5RS functions registry

### R5RS Engine

- `r5rs-canvas-engine.scm`: Unified R5RS function implementations
- `grok_files/*.md`: R5RS concept definitions

## Constraint Types

### RFC2119 Constraints

```json
{
  "id": "rfc-must-1",
  "type": "rfc2119",
  "keyword": "MUST",
  "message": "Each dimension MUST implement exactly one system"
}
```

### SHACL Constraints

```json
{
  "id": "shacl-shape-automaton",
  "type": "shacl",
  "target": "automaton",
  "constraints": [
    {
      "sh:path": "selfReference",
      "sh:minCount": 1,
      "sh:hasValue": "automaton-kernel.jsonl"
    }
  ]
}
```

### ASP Constraints

```json
{
  "id": "asp-rule-1",
  "type": "asp",
  "rule": "1 { layer(N,D) : depth(D) } 1",
  "body": "node(N)"
}
```

## See Also

- `MULTIVERSE-CANVAS-RFC2119-SPEC.md`: Complete RFC 2119 specification
- `IMPLEMENTATION-GUIDE.md`: Detailed implementation guide
- `README.md`: Overview and documentation index
