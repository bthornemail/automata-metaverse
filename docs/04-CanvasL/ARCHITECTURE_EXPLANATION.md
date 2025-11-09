---
id: canvasl-architecture-explanation
title: "CanvasL Architecture Explanation"
level: foundational
type: explanation
tags: [canvasl, architecture, explanation, jsonl, r5rs, specification]
keywords: [canvasl, jsonl-extension, r5rs-integration, directive-syntax, dimension-references, node-references, scheme-expressions]
prerequisites: [metaverse-canvas-docs-readme]
enables: [canvasl-rfc2119-spec, canvasl-quick-reference]
related: [metaverse-canvas-complete, r5rs-canvas-engine, multiverse-canvas-spec]
readingTime: 40
difficulty: 3
blackboard:
  status: active
  assignedAgent: null
  lastUpdate: 2025-11-08
  dependencies: [r5rs-canvas-engine]
  watchers: []
  r5rsEngine: "r5rs-canvas-engine.scm"
  selfBuilding:
    enabled: true
    source: "r5rs-canvas-engine.scm"
    pattern: "blackboard-architecture"
---

# CanvasL Architecture Explanation

**A comprehensive guide to understanding CanvasL, how it extends JSONL, why it's designed this way, and who it's for.**

## Table of Contents

1. [What Is CanvasL?](#what-is-canvasl)
2. [What Is It For?](#what-is-it-for)
3. [How Does It Work?](#how-does-it-work)
4. [Why This Design?](#why-this-design)
5. [Who Is This For?](#who-is-this-for)
6. [How To Use It](#how-to-use-it)
7. [References](#references)

---

## What Is CanvasL?

### Overview

**CanvasL** is an **extension of JSONL** (JSON Lines) that adds:
- **Directives** - Metadata and configuration (`@version`, `@schema`)
- **R5RS Function Calls** - Execute Scheme functions inline
- **Dimension References** - Reference 0D-7D dimensional progression
- **Node References** - `#node-id` syntax for referencing nodes
- **Scheme Expressions** - Embed Scheme code directly

### Relationship to JSONL

```
JSONL (Base Format)
    ↓
CanvasL (Extended Format)
    ├── All JSONL is valid CanvasL
    ├── Adds directives
    ├── Adds R5RS integration
    └── Adds reference syntax
```

**Key Principle**: CanvasL is **backward compatible** with JSONL. Every valid JSONL file is also a valid CanvasL file.

**Reference**: See [`CANVASL-RFC2119-SPEC.md`](./CANVASL-RFC2119-SPEC.md#backward-compatibility).

### File Extension

- **JSONL files**: `.jsonl` extension
- **CanvasL files**: `.canvasl` extension

Both can be parsed by CanvasL parser, but `.canvasl` indicates CanvasL features are used.

---

## What Is It For?

### Problem Statement

**Challenge**: JSONL is simple but limited:
- No way to specify metadata (version, schema)
- No way to execute functions
- No way to reference other nodes
- No way to express dimensional relationships
- No way to embed computations

### Solution: CanvasL Extensions

CanvasL solves this by adding:

1. **Directives** - For metadata and configuration
2. **R5RS Integration** - For executable functions
3. **Reference Syntax** - For node relationships
4. **Dimension System** - For 0D-7D progression
5. **Scheme Expressions** - For embedded code

### Use Cases

#### 1. Versioned Canvas Files

**Problem**: Need to specify canvas format version

**Solution**: Use `@version` directive

```canvasl
@version: "1.0"
@schema: "canvasl-v1"

{"id": "node-1", "type": "text", "text": "Hello"}
```

**Reference**: See [`CANVASL-RFC2119-SPEC.md`](./CANVASL-RFC2119-SPEC.md#directives).

#### 2. Executable Computations

**Problem**: Need to compute values in canvas

**Solution**: Use R5RS function calls

```canvasl
{"id": "add", "type": "r5rs-call", "function": "r5rs:church-add", "args": [2, 3]}
{"id": "result", "type": "text", "text": "Sum: {{add}}"}
```

**Reference**: See [`CANVASL-RFC2119-SPEC.md`](./CANVASL-RFC2119-SPEC.md#r5rs-function-calls).

#### 3. Node Relationships

**Problem**: Need to reference other nodes

**Solution**: Use `#node-id` syntax

```canvasl
{"id": "parent", "type": "text", "text": "Parent Node"}
{"id": "child", "type": "text", "text": "Child Node"}
{"id": "edge", "type": "vertical", "fromNode": "#parent", "toNode": "#child"}
```

**Reference**: See [`CANVASL-RFC2119-SPEC.md`](./CANVASL-RFC2119-SPEC.md#node-references).

#### 4. Dimensional Progression

**Problem**: Need to express 0D-7D relationships

**Solution**: Use dimension property and vertical edges

```canvasl
{"id": "0D", "type": "text", "dimension": "0D", "text": "Quantum Vacuum"}
{"id": "1D", "type": "text", "dimension": "1D", "text": "Temporal Evolution"}
{"id": "v-edge", "type": "vertical", "fromNode": "#0D", "toNode": "#1D"}
```

**Reference**: See [`CANVASL-RFC2119-SPEC.md`](./CANVASL-RFC2119-SPEC.md#dimensions).

---

## How Does It Work?

### Parsing Flow

```
CanvasL File
    ↓
1. Parse Directives (lines starting with @)
    ↓
2. Parse JSONL Lines (standard JSON objects)
    ↓
3. Process R5RS Calls
    ↓
4. Resolve Node References (#node-id)
    ↓
5. Process Dimension References
    ↓
6. Generate Canvas Structure
```

**Reference**: See [`CANVASL-RFC2119-SPEC.md`](./CANVASL-RFC2119-SPEC.md#parsing).

### Directive Processing

```canvasl
@version: "1.0"
@schema: "canvasl-v1"
@r5rs-engine: "r5rs-canvas-engine.scm"
```

**Processing**:
1. Extract directive name (`version`, `schema`, `r5rs-engine`)
2. Extract directive value (`"1.0"`, `"canvasl-v1"`, `"r5rs-canvas-engine.scm"`)
3. Store in metadata object
4. Use for validation and processing

**Reference**: See [`CANVASL-RFC2119-SPEC.md`](./CANVASL-RFC2119-SPEC.md#directive-syntax).

### R5RS Function Execution

```canvasl
{"id": "compute", "type": "r5rs-call", "function": "r5rs:church-add", "args": [2, 3]}
```

**Processing**:
1. Detect `r5rs-call` type
2. Extract function name (`r5rs:church-add`)
3. Extract arguments (`[2, 3]`)
4. Look up function in R5RS registry
5. Execute function with arguments
6. Store result for later use

**Reference**: See [`CANVASL-RFC2119-SPEC.md`](./CANVASL-RFC2119-SPEC.md#r5rs-function-execution).

### Node Reference Resolution

```canvasl
{"id": "node-1", "type": "text", "text": "Hello"}
{"id": "edge-1", "type": "vertical", "fromNode": "#node-1", "toNode": "#node-2"}
```

**Processing**:
1. Parse JSONL lines
2. Build node index by ID
3. When encountering `#node-id`:
   - Remove `#` prefix
   - Look up node in index
   - Replace reference with actual node ID
   - Validate node exists

**Reference**: See [`CANVASL-RFC2119-SPEC.md`](./CANVASL-RFC2119-SPEC.md#node-reference-resolution).

---

## Why This Design?

### Design Principles

#### 1. Backward Compatibility

**Why**: Existing JSONL files must continue to work

**How**: CanvasL parser accepts all JSONL, CanvasL features are optional

**Benefit**: No migration needed, gradual adoption

**Reference**: See [`CANVASL-RFC2119-SPEC.md`](./CANVASL-RFC2119-SPEC.md#backward-compatibility).

#### 2. Progressive Enhancement

**Why**: Not all features needed for all use cases

**How**: Features are additive, can use basic JSONL or full CanvasL

**Benefit**: Simple files stay simple, complex files get power

**Reference**: See [`QUICK_REFERENCE.md`](./QUICK_REFERENCE.md#progressive-enhancement).

#### 3. Text-Based Format

**Why**: Must be human-readable and Git-friendly

**How**: All features expressed as text, no binary data

**Benefit**: Easy to edit, version control works perfectly

**Reference**: See [`CANVASL-RFC2119-SPEC.md`](./CANVASL-RFC2119-SPEC.md#file-format).

#### 4. R5RS Integration

**Why**: Need executable functions for computations

**How**: Direct integration with R5RS Scheme engine

**Benefit**: Powerful computations, Church encoding support

**Reference**: See [`CANVASL-RFC2119-SPEC.md`](./CANVASL-RFC2119-SPEC.md#r5rs-integration).

### Trade-offs

#### Simplicity vs. Power

**Trade-off**: More features = more complexity

**Decision**: Keep core simple (JSONL), add power via extensions (CanvasL)

**Result**: Simple files are simple, complex files get power

#### Compatibility vs. Innovation

**Trade-off**: New features might break compatibility

**Decision**: All new features are optional, backward compatible

**Result**: Old files work, new files can use new features

---

## Who Is This For?

### Primary Users

#### 1. Canvas File Authors

**For**: Users creating canvas files

**What they get**:
- Simple JSONL for basic files
- CanvasL extensions for advanced features
- R5RS functions for computations
- Node references for relationships

**Example**: Creating a computational topology canvas

```canvasl
@version: "1.0"
{"id": "0D", "type": "text", "dimension": "0D", "text": "Quantum Vacuum"}
{"id": "compute", "type": "r5rs-call", "function": "r5rs:church-add", "args": [2, 3]}
```

**Reference**: See [`QUICK_REFERENCE.md`](./QUICK_REFERENCE.md).

#### 2. Tool Developers

**For**: Developers building tools that process canvas files

**What they get**:
- RFC 2119 specification
- Grammar definitions
- Parser APIs
- Extension points

**Example**: Building a canvas visualization tool

**Reference**: See [`CANVASL-RFC2119-SPEC.md`](./CANVASL-RFC2119-SPEC.md).

#### 3. System Integrators

**For**: Developers integrating canvas into systems

**What they get**:
- File format specification
- Parsing libraries
- R5RS integration
- Validation rules

**Example**: Integrating canvas into knowledge management system

**Reference**: See [`CANVASL-RFC2119-SPEC.md`](./CANVASL-RFC2119-SPEC.md#integration).

#### 4. Researchers

**For**: Researchers studying computational topology

**What they get**:
- Structured representation
- Executable functions
- Dimension references
- Query capabilities

**Example**: Analyzing 0D-7D dimensional progression

**Reference**: See [`CANVASL-RFC2119-SPEC.md`](./CANVASL-RFC2119-SPEC.md#dimensions).

---

## How To Use It

### Basic Usage (JSONL)

```jsonl
{"id": "node-1", "type": "text", "text": "Hello", "x": 100, "y": 200}
{"id": "edge-1", "type": "vertical", "fromNode": "node-1", "toNode": "node-2"}
```

**Reference**: See [`QUICK_REFERENCE.md`](./QUICK_REFERENCE.md#basic-jsonl).

### With Directives

```canvasl
@version: "1.0"
@schema: "canvasl-v1"

{"id": "node-1", "type": "text", "text": "Hello"}
```

**Reference**: See [`QUICK_REFERENCE.md`](./QUICK_REFERENCE.md#directives).

### With R5RS Functions

```canvasl
{"id": "add", "type": "r5rs-call", "function": "r5rs:church-add", "args": [2, 3]}
{"id": "result", "type": "text", "text": "Sum: {{add}}"}
```

**Reference**: See [`QUICK_REFERENCE.md`](./QUICK_REFERENCE.md#r5rs-functions).

### With Node References

```canvasl
{"id": "parent", "type": "text", "text": "Parent"}
{"id": "child", "type": "text", "text": "Child"}
{"id": "edge", "type": "vertical", "fromNode": "#parent", "toNode": "#child"}
```

**Reference**: See [`QUICK_REFERENCE.md`](./QUICK_REFERENCE.md#node-references).

### With Dimensions

```canvasl
{"id": "0D", "type": "text", "dimension": "0D", "text": "Quantum Vacuum"}
{"id": "1D", "type": "text", "dimension": "1D", "text": "Temporal Evolution"}
{"id": "v-edge", "type": "vertical", "fromNode": "#0D", "toNode": "#1D"}
```

**Reference**: See [`QUICK_REFERENCE.md`](./QUICK_REFERENCE.md#dimensions).

---

## References

### Documentation

- **Overview**: [`README.md`](./README.md)
- **RFC 2119 Specification**: [`CANVASL-RFC2119-SPEC.md`](./CANVASL-RFC2119-SPEC.md)
- **Quick Reference**: [`QUICK_REFERENCE.md`](./QUICK_REFERENCE.md)

### Related Systems

- **Metaverse Canvas**: [`docs/03-Metaverse-Canvas/README.md`](../03-Metaverse-Canvas/README.md)
- **Meta-Log System**: [`docs/05-Meta-Log/README.md`](../05-Meta-Log/README.md)
- **R5RS Engine**: [`README-R5RS-ENGINE.md`](../../README-R5RS-ENGINE.md)

### Implementation

- **Parser**: `meta-log-db/src/jsonl/parser.ts`
- **CanvasL Support**: `meta-log-db/src/jsonl/parser.ts#parseCanvasL`

---

**Last Updated**: 2025-11-08  
**Status**: Complete explanation document
