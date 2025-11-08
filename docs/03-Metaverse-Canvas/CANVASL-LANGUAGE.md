---
id: canvasl-language-overview
title: "CanvasL Language Specification"
level: foundational
type: concept
tags: [canvasl, language, grammar, specification]
keywords: [canvasl, jsonl, r5rs-canvas-engine, blackboard-architecture, automaton-self-building, lezer-grammar]
prerequisites: [metaverse-canvas-docs-readme]
enables: [canvasl-ast-lsp, canvasl-summary, canvasl-rfc2119-spec]
related: [r5rs-canvas-engine, blackboard-architecture-guide, canvasl-rfc2119-spec, grammar-reference]
readingTime: 30
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
      args: ["automaton-kernel.jsonl"]
      context:
        module: "MODULE 2: JSONL Parser & Canvas Loader"
        functions: ["r5rs:parse-jsonl-canvas", "r5rs:extract-facts"]
---

# CanvasL Language Specification

## Overview

CanvasL is an extended JSONL canvas format designed for the Metaverse Canvas system. It extends the standard JSONL canvas format with additional features for R5RS integration, LSP support, and AST generation.

## File Extension

CanvasL files use the `.canvasl` extension:
- `automaton-kernel.canvasl`
- `generate.metaverse.canvasl`
- `my-canvas.canvasl`

## Grammar

CanvasL uses a Lezer grammar (`ui/src/grammars/canvasl.grammar`) that extends JSONL with:

### Additional Tokens

- `canvaslDirective`: `@directive` - Directives for metadata
- `canvaslReference`: `#id` - References to other nodes
- `canvaslDimension`: `0D`-`7D` - Dimension identifiers
- `canvaslType`: Node types (node, edge, graph, automaton, etc.)
- `canvaslEdgeType`: Edge types (vertical, horizontal, transition, self-ref, r5rs-call)
- `canvaslR5RSFunction`: `r5rs:function-name` - R5RS function references
- `canvaslSchemeExpression`: `(scheme code)` - Scheme expressions

### Grammar Structure

```grammar
CanvasL {
  CanvasLEntry*
}

CanvasLEntry {
  CanvasLDirective? JSONLObject
}
```

## Features

### 1. R5RS Function References

```json
{"id": "r5rs-compute", "type": "r5rs-call", "function": "r5rs:church-add", "args": [2, 3]}
```

### 2. Dimension References

```json
{"id": "0D-topology", "type": "text", "dimension": "0D", "text": "Quantum Vacuum"}
{"id": "1D-topology", "type": "text", "dimension": "1D", "text": "Time Dimension"}
```

### 3. Node References

```json
{"id": "edge-1", "type": "vertical", "fromNode": "#0D-topology", "toNode": "#1D-topology"}
```

### 4. Directives

```json
@version: "1.0"
@schema: "canvasl-v1"
{"id": "node-1", "type": "text"}
```

### 5. Scheme Expressions

```json
{"id": "computation", "type": "r5rs-call", "expression": "(church-add 2 3)"}
```

## Syntax Highlighting

CanvasL provides syntax highlighting for:

- **IDs**: Blue, bold
- **Types**: Purple
- **Edge Types**: Red
- **R5RS Functions**: Light blue, monospace
- **Dimensions**: Orange, bold
- **References**: Blue
- **Directives**: Pink, bold

## LSP Support

### AST Structure

```typescript
interface CanvasLASTNode {
  type: 'node' | 'edge' | 'directive' | 'r5rs-call' | 'reference';
  id?: string;
  line: number;
  column: number;
  length: number;
  metadata?: {
    dimension?: string;
    r5RSFunction?: string;
    fromNode?: string;
    toNode?: string;
  };
}
```

### LSP Features

- **Hover**: Show node information on hover
- **Definition**: Jump to definition
- **References**: Find all references
- **Completion**: Auto-complete node IDs, R5RS functions, dimensions
- **Validation**: Real-time error checking

## Usage Examples

### Basic CanvasL File

```canvasl
{"id": "0D-topology", "type": "text", "dimension": "0D", "text": "# 0D: Quantum Vacuum"}
{"id": "1D-topology", "type": "text", "dimension": "1D", "text": "# 1D: Time Dimension"}
{"id": "v:0D→1D", "type": "vertical", "fromNode": "#0D-topology", "toNode": "#1D-topology", "label": "tan(): 0 → x"}
```

### With R5RS Functions

```canvasl
{"id": "r5rs-zero", "type": "r5rs-call", "function": "r5rs:church-zero", "args": []}
{"id": "r5rs-add", "type": "r5rs-call", "function": "r5rs:church-add", "args": [2, 3]}
{"id": "r5rs-attention", "type": "r5rs-call", "function": "r5rs:attention", "args": ["Q", "K", "V"]}
```

### With Directives

```canvasl
@version: "1.0"
@schema: "canvasl-v1"
@r5rs-engine: "r5rs-canvas-engine.scm"

{"id": "node-1", "type": "text", "text": "Content"}
```

## Migration from JSONL

CanvasL is backward compatible with JSONL. Existing `.jsonl` files can be renamed to `.canvasl` and will work immediately.

### Converting JSONL to CanvasL

```bash
# Simple rename
mv automaton-kernel.jsonl automaton-kernel.canvasl

# Or convert with enhancements
# (add directives, R5RS references, etc.)
```

## CodeMirror Integration

CanvasL is integrated into CodeEditor:

```typescript
import { canvaslLanguage } from './extensions/canvasl-language';

const languageExtension = fileExtension === '.canvasl' 
  ? canvaslLanguage() 
  : markdownWithFrontMatter();
```

## LSP Service

**File**: `ui/src/services/canvasl-lsp-service.ts`

Provides LSP features:

- `hover()` - Get hover information
- `definition()` - Find definition
- `references()` - Find all references
- `completion()` - Get completion suggestions
- `validate()` - Validate file

## AST Generation

**File**: `ui/src/extensions/canvasl-language.ts`

Functions:

- `parseCanvasLAST()` - Parse file into AST
- `getASTNodeAtPosition()` - Get node at position
- `findReferences()` - Find references to node

## Future Enhancements

1. **Full LSP Server**: Implement complete LSP server
2. **Grammar Compilation**: Compile Lezer grammar for better performance
3. **Type Checking**: Type checking for R5RS function calls
4. **Refactoring**: Rename node IDs across files
5. **Formatting**: Auto-format CanvasL files
6. **Folding**: Code folding for large files

## References

- [Lezer Grammar Guide](https://lezer.codemirror.net/docs/guide/index.html#writing-a-grammar)
- [Language Server Protocol](https://microsoft.github.io/language-server-protocol/)
- [JSONL Canvas Editing](./JSONL-CANVAS-EDITING.md)
- [Lezer Grammar Compatibility](./LEZER-GRAMMAR-COMPATIBILITY.md)
