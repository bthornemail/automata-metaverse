---
id: federated-provenance-rfc2119-spec
title: "Federated Provenance Specification (RFC 2119)"
level: foundational
type: specification
tags: [federated-provenance, rfc2119, specification, self-reference, metadata, rdf, prolog, datalog]
keywords: [federated-provenance, rfc2119-specification, self-reference-metadata, embedded-provenance, file-line-provenance, cross-file-tracking, unified-topology, rdf-triples, provenance-tracking]
prerequisites: [multiverse-canvas-rfc2119-spec, meta-log-docs-readme, metaverse-canvas-complete]
enables: [federated-provenance-implementation-guide, federated-provenance-quick-reference]
related: [r5rs-canvas-engine, blackboard-architecture-guide, multiverse-canvas-rfc2119-spec, meta-log-db-readme]
readingTime: 90
difficulty: 5
blackboard:
  status: active
  assignedAgent: null
  lastUpdate: null
  dependencies: [r5rs-canvas-engine, meta-log-db]
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
        functions: ["r5rs:parse-jsonl-canvas", "r5rs:extract-facts", "r5rs:jsonl-to-rdf", "r5rs:prolog-query", "r5rs:datalog-query", "r5rs:sparql-query"]
        pipeline:
          - step: "parse-jsonl-canvas"
            function: "r5rs:parse-jsonl-canvas"
            args: ["generate.metaverse.jsonl"]
          - step: "extract-facts-with-provenance"
            function: "r5rs:extract-facts"
            args: ["parsed-objects"]
          - step: "convert-to-rdf-with-provenance"
            function: "r5rs:jsonl-to-rdf"
            args: ["facts"]
          - step: "query-provenance"
            function: "r5rs:sparql-query"
            args: ["SELECT ?id ?file ?line WHERE { ?id prov:wasDerivedFrom ?source }", "triples"]
  provenanceTracking:
    enabled: true
    mechanisms:
      - selfReference: "Embedded file/line metadata in JSONL entries"
      - referenceNodes: "Explicit file-to-file relationships"
      - unifiedTopology: "RDF triples encoding provenance relationships"
    queryInterfaces:
      - prolog: "r5rs:prolog-query for provenance queries"
      - datalog: "r5rs:datalog-query for fact-based provenance"
      - sparql: "r5rs:sparql-query for RDF provenance triples"
---

# Federated Provenance Specification (RFC 2119)

**Status**: Draft  
**Version**: 1.0  
**Date**: 2025-01-07  
**Authors**: Automaton System

## Abstract

This specification defines how federated provenance tracking is implemented in the Meta-Log multiverse canvas system. The system embeds provenance directly in JSONL data structures through self-reference metadata, reference nodes, and unified topology creation, avoiding the need for separate provenance databases while maintaining full traceability across multiple files.

## Table of Contents

1. [Introduction](#1-introduction)
2. [Terminology](#2-terminology)
3. [Architecture Overview](#3-architecture-overview)
4. [Self-Reference Metadata](#4-self-reference-metadata)
5. [Reference Nodes](#5-reference-nodes)
6. [Unified Topology](#6-unified-topology)
7. [Provenance Extraction](#7-provenance-extraction)
8. [Provenance Queries](#8-provenance-queries)
9. [Cross-File Relationships](#9-cross-file-relationships)
10. [Implementation Requirements](#10-implementation-requirements)
11. [Validation Requirements](#11-validation-requirements)
12. [References](#12-references)

---

## 1. Introduction

### 1.1 Purpose

This specification defines how provenance (the origin and derivation history of data) is tracked across multiple JSONL files in a federated system without requiring separate provenance databases. The system embeds provenance directly in data structures through three mechanisms:

1. **Self-Reference Metadata**: Each JSONL entry contains `file` and `line` provenance
2. **Reference Nodes**: Explicit file-to-file relationships in `generate.metaverse.jsonl`
3. **Unified Topology**: Epistemic and semantic relationships encoded as RDF triples

### 1.2 Scope

This specification covers:

- Self-reference metadata structure and requirements
- Reference node format and relationships
- Unified topology creation for provenance tracking
- Provenance extraction from JSONL entries
- Query interfaces for provenance (ProLog, DataLog, SPARQL)
- Cross-file relationship tracking
- Validation requirements for provenance integrity

### 1.3 RFC 2119 Keywords

The key words "MUST", "MUST NOT", "REQUIRED", "SHALL", "SHALL NOT", "SHOULD", "SHOULD NOT", "RECOMMENDED", "MAY", and "OPTIONAL" in this document are to be interpreted as described in RFC 2119.

### 1.4 Problem Statement

In a federated system with multiple JSONL files (`automaton-kernel.jsonl`, `automaton.canvas.space.jsonl`, `automaton.jsonl`, etc.), we need to answer:

- **Where did this data come from?** (source file and line)
- **How are files related?** (which files reference which other files)
- **What is the derivation chain?** (how data flows between files)

Traditional solutions require separate provenance databases (like PROV-O), but this specification defines an embedded approach where provenance travels with the data.

---

## 2. Terminology

### 2.1 Core Terms

- **Provenance**: The origin and derivation history of data, including source file and line number
- **Self-Reference Metadata**: Embedded provenance information in JSONL entries (`selfReference` field)
- **Reference Node**: JSONL entry that explicitly references another file (`type: "reference"`)
- **Unified Topology**: RDF graph encoding relationships between files and data
- **Epistemic Topology**: Knowledge relationships (knows, generates, validates)
- **Semantic Topology**: Meaning relationships (means, implements, bootstraps)
- **Federated System**: Multiple JSONL files that reference each other

### 2.2 File Types

- **`generate.metaverse.jsonl`**: Metaverse generator file containing reference nodes
- **`automaton-kernel.jsonl`**: Kernel file with self-reference metadata
- **`automaton.canvas.space.jsonl`**: Canvas space file with constraint enforcement
- **`automaton.jsonl`**: Operational automaton file

### 2.3 Provenance Relationships

- **`generates`**: File A generates file B
- **`validates`**: File A validates file B
- **`implements`**: File A implements file B
- **`bootstraps`**: File A bootstraps file B
- **`wasDerivedFrom`**: Data derived from source (file + line)

---

## 3. Architecture Overview

### 3.1 Three-Layer Provenance Architecture

The federated provenance system SHALL implement a three-layer architecture:

```
┌─────────────────────────────────────────┐
│  LAYER 1: Self-Reference Metadata        │
│  (Embedded in each JSONL entry)          │
│  - file: source filename                 │
│  - line: source line number               │
│  - pattern: semantic pattern             │
└─────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────┐
│  LAYER 2: Reference Nodes               │
│  (Explicit file-to-file relationships)   │
│  - type: "reference"                    │
│  - target: target filename              │
│  - metadata.reference: relationship info │
└─────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────┐
│  LAYER 3: Unified Topology             │
│  (RDF triples encoding relationships)    │
│  - Epistemic topology (knows, generates)│
│  - Semantic topology (means, implements)│
│  - RDF graph (SPARQL queryable)         │
└─────────────────────────────────────────┘
```

### 3.2 Data Flow

The system SHALL implement the following provenance data flow:

```
JSONL Entry (with selfReference)
    ↓ [extract metadata]
Provenance Fact (file, line, pattern)
    ↓ [query relationships]
Reference Node (file-to-file)
    ↓ [convert to RDF]
RDF Triple (prov:wasDerivedFrom)
    ↓ [query with SPARQL]
Unified Topology (cross-file relationships)
```

### 3.3 Integration Points

The system MUST integrate:

1. **JSONL Parser**: Extract `selfReference` metadata from entries
2. **Fact Extractor**: Create provenance facts from metadata
3. **RDF Converter**: Convert provenance facts to RDF triples
4. **ProLog Engine**: Query provenance using ProLog
5. **DataLog Engine**: Query provenance using DataLog
6. **SPARQL Engine**: Query provenance using SPARQL

---

## 4. Self-Reference Metadata

### 4.1 Structure Requirements

Each JSONL entry that requires provenance tracking MUST include a `selfReference` field:

```json
{
  "id": "0D-automaton",
  "type": "automaton",
  "currentState": "identity",
  "dimensionalLevel": 0,
  "selfReference": {
    "file": "automaton-kernel.jsonl",
    "line": 14,
    "pattern": "identity"
  }
}
```

### 4.2 Field Requirements

#### 4.2.1 `file` Field

- **MUST** be present in `selfReference` object
- **MUST** be a string containing the source filename
- **MUST** be a valid filename (no path traversal)
- **SHOULD** be relative to the workspace root

#### 4.2.2 `line` Field

- **MUST** be present in `selfReference` object
- **MUST** be a positive integer (1-based line number)
- **MUST** correspond to the actual line number in the source file
- **SHOULD** be accurate to enable precise source location

#### 4.2.3 `pattern` Field

- **SHOULD** be present in `selfReference` object
- **MAY** be a string describing the semantic pattern
- **MAY** be used for pattern matching and querying
- **SHOULD** be descriptive (e.g., "identity", "successor", "meta-circular")

### 4.3 Extraction Requirements

The system MUST extract `selfReference` metadata when parsing JSONL files:

```scheme
(define (extract-self-reference obj)
  (let ((self-ref (assoc 'selfReference obj)))
    (if self-ref
        (list (cdr (assoc 'file self-ref))
              (cdr (assoc 'line self-ref))
              (cdr (assoc 'pattern self-ref)))
        #f)))
```

### 4.4 Fact Creation

The system MUST create provenance facts from `selfReference` metadata:

```prolog
provenance(Id, File, Line, Pattern) :-
    node(Id, Type, ...),
    selfReference(Id, File, Line, Pattern).
```

### 4.5 Validation Requirements

- **SHACL Constraint**: `selfReference` field MUST have `sh:minCount: 1` for automaton nodes
- **File Validation**: `file` field MUST point to a valid, accessible file
- **Line Validation**: `line` field MUST be within file bounds
- **Pattern Validation**: `pattern` field SHOULD match known patterns

---

## 5. Reference Nodes

### 5.1 Structure Requirements

Reference nodes in `generate.metaverse.jsonl` MUST have the following structure:

```json
{
  "id": "metaverse-ref-kernel",
  "type": "reference",
  "target": "automaton-kernel.jsonl",
  "metadata": {
    "regenerate": {
      "function": "r5rs:parse-jsonl-canvas",
      "args": ["automaton-kernel.jsonl"]
    },
    "reference": {
      "file": "automaton-kernel.jsonl",
      "type": "kernel",
      "role": "full-implementation"
    }
  }
}
```

### 5.2 Field Requirements

#### 5.2.1 `type` Field

- **MUST** be `"reference"` for reference nodes
- **MUST** be present in the JSONL entry

#### 5.2.2 `target` Field

- **MUST** be present in reference nodes
- **MUST** be a string containing the target filename
- **MUST** be a valid filename (no path traversal)
- **SHOULD** be relative to the workspace root

#### 5.2.3 `metadata.reference` Field

- **MUST** be present in reference nodes
- **MUST** contain a `file` field matching `target`
- **SHOULD** contain a `type` field describing the file type
- **SHOULD** contain a `role` field describing the relationship role

### 5.3 Relationship Types

Reference nodes MUST support the following relationship types:

- **`generates`**: Source file generates target file
- **`validates`**: Source file validates target file
- **`implements`**: Source file implements target file
- **`bootstraps`**: Source file bootstraps target file
- **`references`**: Source file references target file (generic)

### 5.4 Extraction Requirements

The system MUST extract reference nodes when parsing `generate.metaverse.jsonl`:

```scheme
(define (extract-reference-nodes canvas)
  (filter (lambda (obj)
            (equal? (cdr (assoc 'type obj)) "reference"))
          canvas))
```

### 5.5 Fact Creation

The system MUST create reference facts from reference nodes:

```prolog
reference(Id, SourceFile, TargetFile, RelationshipType, Role) :-
    node(Id, "reference", ...),
    target(Id, TargetFile),
    referenceMetadata(Id, SourceFile, RelationshipType, Role).
```

---

## 6. Unified Topology

### 6.1 Epistemic Topology Requirements

The system MUST create epistemic topology (knowledge relationships):

```prolog
knows(canvas-space, kernel).
knows(kernel, automaton).
generates(seed, kernel).
validates(canvas-space, kernel).
validates(canvas-space, seed).
```

#### 6.1.1 Epistemic Predicates

- **`knows(A, B)`**: A knows about B
- **`generates(A, B)`**: A generates B
- **`validates(A, B)`**: A validates B
- **`bootstraps(A, B)`**: A bootstraps B

### 6.2 Semantic Topology Requirements

The system MUST create semantic topology (meaning relationships):

```prolog
means(canvas-space, constraint-enforcement).
means(kernel-seed, bootstrap).
means(kernel, full-implementation).
means(automaton, operational).
```

#### 6.2.1 Semantic Predicates

- **`means(A, B)`**: A means B (semantic meaning)
- **`implements(A, B)`**: A implements B
- **`represents(A, B)`**: A represents B

### 6.3 RDF Graph Requirements

The system MUST convert provenance relationships to RDF triples:

```turtle
metaverse:metaverse metaverse:generates metaverse:canvas-space .
metaverse:metaverse metaverse:generates metaverse:kernel-seed .
metaverse:metaverse metaverse:generates metaverse:kernel .
metaverse:metaverse metaverse:generates metaverse:automaton .
metaverse:canvas-space metaverse:validates metaverse:kernel .
metaverse:kernel-seed metaverse:bootstraps metaverse:kernel .
metaverse:kernel metaverse:implements metaverse:automaton .
```

#### 6.3.1 RDF Namespace

- **MUST** use `metaverse:` namespace for metaverse relationships
- **SHOULD** use `prov:` namespace for PROV-O compatibility
- **MAY** use custom namespaces for domain-specific relationships

#### 6.3.2 RDF Properties

- **`metaverse:generates`**: Generation relationship
- **`metaverse:validates`**: Validation relationship
- **`metaverse:implements`**: Implementation relationship
- **`metaverse:bootstraps`**: Bootstrap relationship
- **`prov:wasDerivedFrom`**: Derivation relationship (PROV-O compatible)

### 6.4 Topology Creation Function

The system MUST provide a function to create unified topology:

```scheme
(define (create-unified-topology . files)
  (let ((metaverse (parse-jsonl-canvas "generate.metaverse.jsonl"))
        (references (extract-reference-nodes metaverse))
        (all-files (map parse-jsonl-canvas files)))
    (let ((epistemic (create-epistemic-topology references))
          (semantic (create-semantic-topology references))
          (rdf-triples (create-rdf-triples references)))
      (list epistemic semantic rdf-triples))))
```

---

## 7. Provenance Extraction

### 7.1 Extraction Pipeline

The system MUST implement the following extraction pipeline:

```
1. Parse JSONL file line-by-line
2. Extract selfReference metadata from each entry
3. Create provenance facts (Id, File, Line, Pattern)
4. Extract reference nodes from generate.metaverse.jsonl
5. Create reference facts (Id, SourceFile, TargetFile, RelationshipType)
6. Convert facts to RDF triples
7. Store in unified topology
```

### 7.2 Fact Extraction Requirements

The system MUST extract provenance facts using DataLog:

```prolog
provenance(Id, File, Line, Pattern) :-
    node(Id, Type, ...),
    selfReference(Id, File, Line, Pattern).

reference(Id, SourceFile, TargetFile, RelationshipType, Role) :-
    node(Id, "reference", ...),
    target(Id, TargetFile),
    referenceMetadata(Id, SourceFile, RelationshipType, Role).
```

### 7.3 RDF Conversion Requirements

The system MUST convert provenance facts to RDF triples:

```scheme
(define (provenance-to-rdf facts)
  (map (lambda (fact)
         (match fact
           (('provenance id file line pattern)
            `(,id prov:wasDerivedFrom ,(make-uri file line)))
           (('reference id source target rel-type role)
            `(,source ,(relationship-to-predicate rel-type) ,target))))
       facts))
```

### 7.4 Preservation Requirements

- **MUST** preserve provenance through all transformations
- **MUST** maintain file and line accuracy
- **SHOULD** preserve pattern information
- **MUST** handle missing provenance gracefully (warn, don't fail)

---

## 8. Provenance Queries

### 8.1 ProLog Query Interface

The system MUST support ProLog queries for provenance:

```scheme
;; Find all nodes from a specific file
(prolog-query prolog-db 
  '(node ?Id ?Type) 
  '((provenance ?Id "automaton-kernel.jsonl" ?Line)))

;; Find all nodes derived from a specific line range
(prolog-query prolog-db 
  '(node ?Id ?Type) 
  '((provenance ?Id ?File ?Line)
    (>= ?Line 10)
    (<= ?Line 20)))
```

### 8.2 DataLog Query Interface

The system MUST support DataLog queries for provenance:

```scheme
;; Find all nodes from a specific file
(datalog-query datalog-program 
  '(node ?Id ?Type) 
  '((provenance ?Id "automaton-kernel.jsonl" ?Line)))

;; Find all nodes from lines 10-20
(datalog-query datalog-program 
  '(node ?Id ?Type) 
  '((provenance ?Id ?File ?Line)
    (>= ?Line 10)
    (<= ?Line 20)))
```

### 8.3 SPARQL Query Interface

The system MUST support SPARQL queries for provenance:

```sparql
# Find all nodes generated by metaverse
SELECT ?id WHERE {
  ?id rdf:type canvas:Node .
  metaverse:metaverse metaverse:generates ?id .
}

# Find all nodes derived from automaton-kernel.jsonl
SELECT ?id ?line WHERE {
  ?id prov:wasDerivedFrom ?source .
  ?source prov:file "automaton-kernel.jsonl" .
  ?source prov:line ?line .
}
```

### 8.4 Query Performance Requirements

- **SHOULD** index provenance facts for fast queries
- **SHOULD** cache unified topology for repeated queries
- **MUST** support incremental updates to provenance
- **SHOULD** optimize cross-file queries

---

## 9. Cross-File Relationships

### 9.1 Relationship Tracking Requirements

The system MUST track cross-file relationships:

- **File-to-file**: Which files reference which other files
- **Generation chain**: How files are generated from other files
- **Validation chain**: Which files validate which other files
- **Implementation chain**: Which files implement which other files

### 9.2 Relationship Extraction

The system MUST extract relationships from reference nodes:

```scheme
(define (extract-file-relationships metaverse)
  (let ((references (extract-reference-nodes metaverse)))
    (map (lambda (ref)
           (list (get-source-file ref)
                 (get-target-file ref)
                 (get-relationship-type ref)
                 (get-role ref)))
         references)))
```

### 9.3 Relationship Graph Requirements

The system MUST create a relationship graph:

- **Nodes**: Files in the system
- **Edges**: Relationships between files
- **Labels**: Relationship types (generates, validates, implements)
- **Metadata**: Roles and additional information

### 9.4 Query Requirements

The system MUST support queries for:

- **Direct relationships**: Files directly referenced
- **Transitive relationships**: Files referenced transitively
- **Reverse relationships**: Files that reference a given file
- **Relationship paths**: Paths between files

---

## 10. Implementation Requirements

### 10.1 JSONL Parser Requirements

The JSONL parser MUST:

- Extract `selfReference` metadata from entries
- Preserve file and line information during parsing
- Handle missing `selfReference` gracefully
- Report provenance extraction errors

### 10.2 Fact Extractor Requirements

The fact extractor MUST:

- Create provenance facts from `selfReference` metadata
- Create reference facts from reference nodes
- Preserve all provenance information
- Handle malformed provenance data

### 10.3 RDF Converter Requirements

The RDF converter MUST:

- Convert provenance facts to RDF triples
- Use standard RDF namespaces (`prov:`, `metaverse:`)
- Preserve file and line information in RDF
- Support SPARQL queries

### 10.4 Query Engine Requirements

Query engines MUST:

- Support provenance queries in ProLog
- Support provenance queries in DataLog
- Support provenance queries in SPARQL
- Return accurate provenance information

### 10.5 Database Requirements

The database MUST:

- Store provenance facts efficiently
- Index provenance for fast queries
- Support incremental provenance updates
- Preserve provenance through transformations

---

## 11. Validation Requirements

### 11.1 Provenance Validation Pipeline

The system MUST validate provenance in this order:

1. **Self-Reference Validation**: `selfReference` fields are valid
2. **File Validation**: Referenced files exist and are accessible
3. **Line Validation**: Line numbers are within file bounds
4. **Reference Validation**: Reference nodes point to valid files
5. **Relationship Validation**: Relationships are consistent
6. **RDF Validation**: RDF triples are valid

### 11.2 Self-Reference Validation

The system MUST validate:

- **Presence**: `selfReference` field exists for required entries
- **File**: `file` field points to valid, accessible file
- **Line**: `line` field is within file bounds
- **Pattern**: `pattern` field matches known patterns (if provided)

### 11.3 Reference Node Validation

The system MUST validate:

- **Type**: `type` field is `"reference"`
- **Target**: `target` field points to valid file
- **Metadata**: `metadata.reference` field is present and valid
- **Consistency**: `target` matches `metadata.reference.file`

### 11.4 Unified Topology Validation

The system MUST validate:

- **Completeness**: All referenced files are included
- **Consistency**: Relationships are consistent across files
- **RDF Validity**: RDF triples are valid RDF
- **Queryability**: Topology is queryable via SPARQL

### 11.5 Validation Functions

The system MUST provide validation functions:

```scheme
(define (validate-provenance canvas)
  (and (validate-self-references canvas)
       (validate-reference-nodes canvas)
       (validate-unified-topology canvas)
       (validate-rdf-triples canvas)))
```

---

## 12. References

### 12.1 Related Documentation

- **`docs/03-Metaverse-Canvas/METAVERSE-CANVAS-COMPLETE.md`**: Self-reference patterns
- **`docs/05-Meta-Log/MULTIVERSE-CANVAS-RFC2119-SPEC.md`**: Multiverse canvas specification
- **`docs/05-Meta-Log/IMPLEMENTATION-GUIDE.md`**: Implementation patterns
- **`docs/07-Meta-Log-Db/ARCHITECTURE_EXPLANATION.md`**: Database architecture

### 12.2 Standards

- **RFC 2119**: Key words for use in RFCs to Indicate Requirement Levels
- **PROV-O**: W3C Provenance Ontology (for compatibility)
- **RDF 1.1**: Resource Description Framework
- **SPARQL 1.1**: SPARQL Query Language for RDF

### 12.3 Implementation Files

- **`meta-log-db/src/jsonl/parser.ts`**: JSONL parser with provenance extraction
- **`meta-log-db/src/datalog/fact-extraction.ts`**: Fact extraction with provenance
- **`meta-log-db/src/rdf/triple-store.ts`**: RDF conversion with provenance
- **`generate.metaverse.jsonl`**: Reference nodes for file relationships

---

**Last Updated**: 2025-01-07  
**Status**: Draft RFC 2119 Specification  
**Version**: 1.0
