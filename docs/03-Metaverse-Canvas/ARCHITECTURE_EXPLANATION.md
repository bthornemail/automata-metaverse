---
id: metaverse-canvas-architecture-explanation
title: "Metaverse Canvas Architecture Explanation"
level: foundational
type: explanation
tags: [metaverse-canvas, architecture, explanation, jsonl, canvasl, codemirror, lezer]
keywords: [metaverse-canvas, jsonl-canvas, canvasl, codemirror-integration, lezer-grammar, canvas-editing, frontmatter-integration]
prerequisites: []
enables: [metaverse-canvas-complete, canvasl-language]
related: [canvasl-rfc2119-spec, r5rs-canvas-engine, blackboard-architecture-guide]
readingTime: 50
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

# Metaverse Canvas Architecture Explanation

**A comprehensive guide to understanding the Metaverse Canvas system, how it works, why it's designed this way, and who it's for.**

## Table of Contents

1. [What Is Metaverse Canvas?](#what-is-metaverse-canvas)
2. [What Is It For?](#what-is-it-for)
3. [How Does It Work?](#how-does-it-work)
4. [Why This Architecture?](#why-this-architecture)
5. [Who Is This For?](#who-is-this-for)
6. [How To Use It](#how-to-use-it)
7. [References](#references)

---

## What Is Metaverse Canvas?

### Overview

**Metaverse Canvas** is a visual knowledge management system that represents computational topology and relationships using:
- **JSONL format** - Line-delimited JSON for canvas data
- **CanvasL extensions** - Enhanced format with directives and R5RS integration
- **CodeMirror 6** - Advanced code editor integration
- **Lezer grammars** - Syntax parsing and highlighting
- **Markdown frontmatter** - Metadata integration

### Core Components

#### 1. JSONL Canvas Format

**What it is**: A file format where each line is a JSON object representing a canvas element (node or edge).

**Example**:
```jsonl
{"id": "node-1", "type": "text", "text": "Hello World", "x": 100, "y": 200}
{"id": "edge-1", "type": "vertical", "fromNode": "node-1", "toNode": "node-2"}
{"id": "node-2", "type": "text", "text": "Connected Node", "x": 100, "y": 400}
```

**Reference**: See [`JSONL-CANVAS-EDITING.md`](./JSONL-CANVAS-EDITING.md).

#### 2. CanvasL Language

**What it is**: An extension of JSONL that adds:
- **Directives** - `@version`, `@schema`, `@r5rs-engine`
- **R5RS function calls** - Execute Scheme functions inline
- **Dimension references** - Reference 0D-7D dimensional progression
- **Node references** - `#node-id` syntax

**Example**:
```canvasl
@version: "1.0"
@schema: "canvasl-v1"

{"id": "0D-topology", "type": "text", "dimension": "0D", "text": "# 0D: Quantum Vacuum"}
{"id": "r5rs-add", "type": "r5rs-call", "function": "r5rs:church-add", "args": [2, 3]}
{"id": "edge-1", "type": "vertical", "fromNode": "#0D-topology", "toNode": "#1D-topology"}
```

**Reference**: See [`CANVASL-LANGUAGE.md`](./CANVASL-LANGUAGE.md) and [`docs/04-CanvasL/CANVASL-RFC2119-SPEC.md`](../04-CanvasL/CANVASL-RFC2119-SPEC.md).

#### 3. CodeMirror 6 Integration

**What it is**: Integration with CodeMirror 6 editor for:
- Syntax highlighting
- Auto-completion
- Error detection
- LSP support

**Reference**: See [`CODE-MIRROR-LEZER-INTEGRATION.md`](./CODE-MIRROR-LEZER-INTEGRATION.md).

#### 4. Lezer Grammar System

**What it is**: Grammar-based parsing system for:
- JSONL parsing
- CanvasL directive parsing
- Markdown frontmatter parsing
- Syntax tree generation

**Reference**: See [`LEZER-GRAMMAR-COMPATIBILITY.md`](./LEZER-GRAMMAR-COMPATIBILITY.md) and [`GRAMMAR-REFERENCE.md`](./GRAMMAR-REFERENCE.md).

---

## What Is It For?

### Problem Statement

**Challenge**: Representing complex computational topology and relationships in a way that is:
- **Editable** - Humans can read and modify
- **Machine-readable** - Programs can parse and query
- **Visual** - Can be rendered as a canvas
- **Extensible** - Supports custom types and functions
- **Version-controlled** - Works with Git

### Solution: JSONL + CanvasL + CodeMirror

The Metaverse Canvas system solves this by:

1. **JSONL Format** - Simple, line-delimited format that's:
   - Human-readable
   - Git-friendly (line-by-line diffs)
   - Easy to parse programmatically
   - Supports streaming

2. **CanvasL Extensions** - Adds power without complexity:
   - Directives for metadata
   - R5RS function integration
   - Dimension references
   - Node references

3. **CodeMirror Integration** - Provides:
   - Syntax highlighting
   - Error detection
   - Auto-completion
   - LSP support

### Use Cases

#### 1. Knowledge Graph Visualization

**For**: Visualizing relationships between concepts

**Example**:
```jsonl
{"id": "concept-1", "type": "text", "text": "Church Encoding"}
{"id": "concept-2", "type": "text", "text": "Lambda Calculus"}
{"id": "edge-1", "type": "horizontal", "fromNode": "concept-1", "toNode": "concept-2"}
```

**Reference**: See [`JSONL-CANVAS-EDITING.md`](./JSONL-CANVAS-EDITING.md#canvas-structure).

#### 2. Computational Topology Mapping

**For**: Mapping 0D-7D dimensional progression

**Example**:
```canvasl
@version: "1.0"
@dimension: "0D-7D"

{"id": "0D", "type": "text", "dimension": "0D", "text": "Quantum Vacuum"}
{"id": "1D", "type": "text", "dimension": "1D", "text": "Temporal Evolution"}
{"id": "v-edge", "type": "vertical", "fromNode": "#0D", "toNode": "#1D"}
```

**Reference**: See [`CANVASL-LANGUAGE.md`](./CANVASL-LANGUAGE.md#dimensions).

#### 3. R5RS Function Execution

**For**: Embedding executable Scheme code in canvas

**Example**:
```canvasl
{"id": "compute", "type": "r5rs-call", "function": "r5rs:church-add", "args": [2, 3]}
{"id": "result", "type": "text", "text": "Result: {{compute}}"}
```

**Reference**: See [`CANVASL-LANGUAGE.md`](./CANVASL-LANGUAGE.md#r5rs-function-calls).

---

## How Does It Work?

### Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│                  User Interface Layer                   │
│  ┌──────────────────────────────────────────────┐     │
│  │         CodeMirror 6 Editor                   │     │
│  │  - Syntax Highlighting                        │     │
│  │  - Auto-completion                            │     │
│  │  - Error Detection                            │     │
│  └──────────────────┬───────────────────────────┘     │
└──────────────────────┼───────────────────────────────────┘
                       │
┌──────────────────────┼───────────────────────────────────┐
│              Parsing Layer                               │
│  ┌──────────────────────────────────────────────┐        │
│  │         Lezer Grammar System                 │        │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐  │        │
│  │  │ JSONL    │  │ CanvasL  │  │FrontMatter│  │        │
│  │  │ Grammar  │  │ Grammar  │  │ Grammar  │  │        │
│  │  └────┬─────┘  └────┬─────┘  └────┬─────┘  │        │
│  │       │             │              │         │        │
│  │       └─────────────┼──────────────┘         │        │
│  │                     │                        │        │
│  │            ┌────────▼────────┐               │        │
│  │            │  Syntax Tree    │               │        │
│  │            │  (AST)          │               │        │
│  │            └────────┬────────┘               │        │
│  └────────────────────┼──────────────────────┘        │
│                        │                                  │
└────────────────────────┼──────────────────────────────────┘
                         │
┌────────────────────────┼───────────────────────────────────┐
│              Processing Layer                              │
│  ┌──────────────────────────────────────────────┐         │
│  │         Canvas Processor                      │         │
│  │  - Parse JSONL lines                          │         │
│  │  - Process CanvasL directives                │         │
│  │  - Resolve node references                   │         │
│  │  - Execute R5RS functions                    │         │
│  │  - Generate canvas structure                  │         │
│  └──────────────────┬───────────────────────────┘         │
│                     │                                       │
│  ┌──────────────────▼───────────────────────────┐         │
│  │         R5RS Engine Integration              │         │
│  │  - Function registry                         │         │
│  │  - Function execution                        │         │
│  │  - Church encoding                           │         │
│  └──────────────────────────────────────────────┘         │
└───────────────────────────────────────────────────────────┘
                         │
┌────────────────────────┼───────────────────────────────────┐
│              Storage Layer                                │
│  ┌──────────────────────────────────────────────┐        │
│  │         JSONL/CanvasL Files                    │        │
│  │  - automaton-kernel.jsonl                     │        │
│  │  - generate.metaverse.canvasl                 │        │
│  │  - canvas.canvasl                             │        │
│  └──────────────────────────────────────────────┘        │
└───────────────────────────────────────────────────────────┘
```

### Data Flow

#### 1. Loading a Canvas File

```
User opens canvas.canvasl
    ↓
CodeMirror loads file
    ↓
Lezer parser parses syntax
    ↓
AST generated
    ↓
Canvas processor extracts:
  - Nodes
  - Edges
  - Directives
  - R5RS calls
    ↓
Canvas structure created
    ↓
Rendered in UI
```

**Reference**: See [`CODE-MIRROR-LEZER-INTEGRATION.md`](./CODE-MIRROR-LEZER-INTEGRATION.md#integration-flow).

#### 2. Editing Canvas

```
User edits in CodeMirror
    ↓
Lezer re-parses on change
    ↓
Syntax errors detected
    ↓
Auto-completion suggestions
    ↓
Canvas structure updated
    ↓
Visual preview updated
```

**Reference**: See [`JSONL-CANVAS-EDITING.md`](./JSONL-CANVAS-EDITING.md#editing-workflow).

#### 3. Executing R5RS Functions

```
CanvasL contains: {"type": "r5rs-call", "function": "r5rs:church-add", "args": [2, 3]}
    ↓
Parser extracts R5RS call
    ↓
R5RS registry looks up function
    ↓
Function executed: church-add(2, 3)
    ↓
Result: 5
    ↓
Result embedded in canvas
```

**Reference**: See [`CANVASL-LANGUAGE.md`](./CANVASL-LANGUAGE.md#r5rs-function-calls).

---

## Why This Architecture?

### Design Principles

#### 1. Text-Based Format

**Why JSONL instead of binary or complex formats**:
- **Git-friendly** - Line-by-line diffs work perfectly
- **Human-readable** - Can edit with any text editor
- **Streaming** - Can process line-by-line without loading entire file
- **Simple parsing** - Each line is independent JSON

**Trade-off**: Less compact than binary, but worth it for editability.

**Reference**: See [`JSONL-CANVAS-EDITING.md`](./JSONL-CANVAS-EDITING.md#why-jsonl).

#### 2. Extensibility Through CanvasL

**Why extend JSONL instead of creating new format**:
- **Backward compatible** - All JSONL files are valid CanvasL
- **Progressive enhancement** - Can use basic JSONL or advanced CanvasL
- **No breaking changes** - Existing tools still work

**Reference**: See [`BACKWARD-COMPATIBILITY.md`](./BACKWARD-COMPATIBILITY.md).

#### 3. Grammar-Based Parsing

**Why Lezer instead of regex or manual parsing**:
- **Accurate** - Handles edge cases correctly
- **Maintainable** - Grammar is declarative
- **Extensible** - Easy to add new syntax
- **Error recovery** - Better error messages

**Reference**: See [`LEZER-GRAMMAR-COMPATIBILITY.md`](./LEZER-GRAMMAR-COMPATIBILITY.md#why-lezer).

#### 4. CodeMirror Integration

**Why CodeMirror 6**:
- **Modern** - Built for modern web
- **Extensible** - Plugin architecture
- **Performance** - Handles large files well
- **LSP support** - Language server protocol

**Reference**: See [`CODE-MIRROR-LEZER-INTEGRATION.md`](./CODE-MIRROR-LEZER-INTEGRATION.md#why-codemirror-6).

---

## Who Is This For?

### Primary Users

#### 1. Canvas Editors

**For**: Users creating and editing canvas files

**What they get**:
- Syntax highlighting
- Auto-completion
- Error detection
- Visual preview

**Example**: Editing `automaton-kernel.jsonl` with CodeMirror

**Reference**: See [`JSONL-CANVAS-EDITING.md`](./JSONL-CANVAS-EDITING.md).

#### 2. Developers Building Canvas Tools

**For**: Developers creating tools that work with canvas files

**What they get**:
- Grammar definitions
- Parser APIs
- AST structure
- Extension points

**Example**: Building a canvas visualization tool

**Reference**: See [`GRAMMAR-REFERENCE.md`](./GRAMMAR-REFERENCE.md).

#### 3. System Integrators

**For**: Developers integrating canvas into larger systems

**What they get**:
- File format specification
- Parsing libraries
- R5RS integration
- Extension mechanisms

**Example**: Integrating canvas into knowledge management system

**Reference**: See [`CANVASL-AST-LSP.md`](./CANVASL-AST-LSP.md).

#### 4. Researchers

**For**: Researchers studying computational topology

**What they get**:
- Structured representation
- Query capabilities
- R5RS function execution
- Dimension references

**Example**: Analyzing 0D-7D dimensional progression

**Reference**: See [`CANVASL-LANGUAGE.md`](./CANVASL-LANGUAGE.md#dimensions).

---

## How To Use It

### For Canvas Editors

#### Step 1: Open Canvas File

```typescript
// In CodeMirror editor
import { EditorView } from '@codemirror/view';
import { jsonlCanvas } from './extensions/jsonl-canvas';

const view = new EditorView({
  doc: canvasContent,
  extensions: [jsonlCanvas()]
});
```

**Reference**: See [`CODE-MIRROR-LEZER-INTEGRATION.md`](./CODE-MIRROR-LEZER-INTEGRATION.md#usage).

#### Step 2: Edit Canvas

```jsonl
{"id": "node-1", "type": "text", "text": "My Node", "x": 100, "y": 200}
{"id": "edge-1", "type": "vertical", "fromNode": "node-1", "toNode": "node-2"}
```

**Reference**: See [`JSONL-CANVAS-EDITING.md`](./JSONL-CANVAS-EDITING.md#basic-editing).

#### Step 3: Use CanvasL Features

```canvasl
@version: "1.0"
@schema: "canvasl-v1"

{"id": "compute", "type": "r5rs-call", "function": "r5rs:church-add", "args": [2, 3]}
```

**Reference**: See [`CANVASL-LANGUAGE.md`](./CANVASL-LANGUAGE.md#basic-syntax).

### For Developers

#### Step 1: Parse Canvas File

```typescript
import { parseJsonlCanvas } from './parsers/jsonl-parser';

const canvas = await parseJsonlCanvas('canvas.jsonl');
// Returns: { nodes: [...], edges: [...] }
```

**Reference**: See [`JSONL-CANVAS-EDITING.md`](./JSONL-CANVAS-EDITING.md#parsing).

#### Step 2: Process CanvasL

```typescript
import { parseCanvasL } from './parsers/canvasl-parser';

const canvas = await parseCanvasL('canvas.canvasl');
// Processes directives and R5RS calls
```

**Reference**: See [`CANVASL-LANGUAGE.md`](./CANVASL-LANGUAGE.md#parsing).

#### Step 3: Use Grammar

```typescript
import { jsonlCanvasGrammar } from './grammars/jsonl-canvas.grammar';

const parser = new LezerParser(jsonlCanvasGrammar);
const tree = parser.parse(canvasContent);
```

**Reference**: See [`GRAMMAR-REFERENCE.md`](./GRAMMAR-REFERENCE.md#usage).

---

## References

### Documentation

- **Overview**: [`README.md`](./README.md)
- **JSONL Editing**: [`JSONL-CANVAS-EDITING.md`](./JSONL-CANVAS-EDITING.md)
- **CanvasL Language**: [`CANVASL-LANGUAGE.md`](./CANVASL-LANGUAGE.md)
- **CodeMirror Integration**: [`CODE-MIRROR-LEZER-INTEGRATION.md`](./CODE-MIRROR-LEZER-INTEGRATION.md)
- **Grammar Reference**: [`GRAMMAR-REFERENCE.md`](./GRAMMAR-REFERENCE.md)
- **Implementation**: [`IMPLEMENTATION-COMPLETE.md`](./IMPLEMENTATION-COMPLETE.md)

### Related Systems

- **CanvasL Specification**: [`docs/04-CanvasL/CANVASL-RFC2119-SPEC.md`](../04-CanvasL/CANVASL-RFC2119-SPEC.md)
- **Meta-Log System**: [`docs/05-Meta-Log/README.md`](../05-Meta-Log/README.md)
- **R5RS Engine**: [`README-R5RS-ENGINE.md`](../../README-R5RS-ENGINE.md)

### Source Code

- **CodeMirror Extensions**: `ui/src/extensions/`
- **Lezer Grammars**: `ui/src/grammars/`
- **Parsers**: `src/services/`

---

**Last Updated**: 2025-11-08  
**Status**: Complete explanation document
