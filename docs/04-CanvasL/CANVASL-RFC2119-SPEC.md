---
id: canvasl-rfc2119-spec
title: "CanvasL Language Specification (RFC 2119)"
level: foundational
type: specification
tags: [canvasl, rfc2119, specification, grammar, ast, lsp]
keywords: [canvasl, rfc2119, jsonl, r5rs-canvas-engine, blackboard-architecture, automaton-self-building, church-encoding, dimensional-topology]
prerequisites: [canvasl-docs-readme]
enables: [canvasl-quick-reference, canvasl-implementation]
related: [r5rs-canvas-engine, blackboard-architecture-guide, multiverse-canvas-spec, seed-regeneration-guide]
readingTime: 60
difficulty: 4
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
        functions: ["r5rs:parse-jsonl-canvas", "r5rs:extract-facts", "r5rs:invoke-from-jsonl"]
---

# CanvasL Language Specification (RFC 2119)

**Status**: Draft  
**Version**: 1.0  
**Date**: 2025-01-07  
**Authors**: Automaton System

## Abstract

This specification defines CanvasL, an extended JSONL canvas format designed for the Metaverse Canvas system. CanvasL extends standard JSONL with R5RS function integration, dimension references, node references, directives, and Scheme expressions while maintaining full backward compatibility with JSONL.

## Table of Contents

1. [Introduction](#1-introduction)
2. [Terminology](#2-terminology)
3. [File Format](#3-file-format)
4. [Grammar Specification](#4-grammar-specification)
5. [Directives](#5-directives)
6. [R5RS Function Integration](#6-r5rs-function-integration)
7. [Dimension References](#7-dimension-references)
8. [Node References](#8-node-references)
9. [Scheme Expressions](#9-scheme-expressions)
10. [Backward Compatibility](#10-backward-compatibility)
11. [AST Structure](#11-ast-structure)
12. [LSP Support](#12-lsp-support)
13. [Validation Requirements](#13-validation-requirements)
14. [Implementation Requirements](#14-implementation-requirements)
15. [References](#15-references)

---

## 1. Introduction

### 1.1 Purpose

This specification defines CanvasL (`.canvasl`), an extended JSONL canvas format that:

- Extends standard JSONL canvas format with additional features
- Integrates R5RS Scheme functions for computational operations
- Supports dimension-aware parsing (0D-7D)
- Enables node reference resolution
- Provides directives for metadata
- Supports LSP and AST generation
- Maintains full backward compatibility with JSONL

### 1.2 Scope

This specification covers:

- CanvasL file format and grammar
- Extension syntax and semantics
- R5RS function integration
- Dimension reference system
- Node reference resolution
- Directive syntax
- Scheme expression support
- AST structure
- LSP feature requirements
- Validation requirements

### 1.3 RFC 2119 Keywords

The key words "MUST", "MUST NOT", "REQUIRED", "SHALL", "SHALL NOT", "SHOULD", "SHOULD NOT", "RECOMMENDED", "MAY", and "OPTIONAL" in this document are to be interpreted as described in RFC 2119.

### 1.4 Related Documentation

- **`docs/03-Metaverse-Canvas/CANVASL-LANGUAGE.md`**: Language overview and features
- **`docs/03-Metaverse-Canvas/CANVASL-AST-LSP.md`**: AST and LSP implementation details
- **`docs/05-Meta-Log/MULTIVERSE-CANVAS-RFC2119-SPEC.md`**: Multiverse canvas specification
- **`ui/src/grammars/canvasl.grammar`**: Lezer grammar definition

---

## 2. Terminology

### 2.1 Core Terms

- **JSONL**: JSON Lines format - one JSON object per line
- **CanvasL**: Extended JSONL format with R5RS, dimension, and reference support (`.canvasl` extension)
- **Directive**: Metadata instruction starting with `@`
- **Node Reference**: Reference to another node using `#id` syntax
- **Dimension Reference**: Reference to dimensional level using `0D`-`7D` format
- **R5RS Function**: Scheme function prefixed with `r5rs:`
- **Scheme Expression**: Valid R5RS Scheme code in parentheses

### 2.2 File Types

- **`.jsonl`**: Standard JSONL canvas file
- **`.canvasl`**: Extended CanvasL file with additional features

---

## 3. File Format

### 3.1 File Extension

- CanvasL files MUST use the `.canvasl` file extension
- CanvasL files MUST be valid JSONL files (backward compatible)
- CanvasL files MAY include directives before JSONL entries

### 3.2 File Structure

A CanvasL file SHALL have the following structure:

```
[Directives]*
[JSONL Entries]*
```

Where:
- **Directives** (OPTIONAL): Zero or more directive lines
- **JSONL Entries** (REQUIRED): One or more JSON objects, one per line

### 3.3 Line-by-Line Processing

- Each line MUST be processed independently
- Empty lines MUST be ignored
- Comments (if supported) MUST follow JSONL comment conventions
- Each non-empty line MUST contain exactly one JSON object

---

## 4. Grammar Specification

### 4.1 Grammar Definition

CanvasL SHALL use a Lezer grammar (`ui/src/grammars/canvasl.grammar`) that extends JSONL.

### 4.2 Top-Level Rule

```grammar
CanvasL {
  CanvasLEntry*
}

CanvasLEntry {
  CanvasLDirective? JSONLObject
}
```

### 4.3 Token Definitions

The grammar MUST define the following tokens:

#### 4.3.1 Standard JSONL Tokens

- `jsonObjectStart`: `{`
- `jsonObjectEnd`: `}`
- `jsonArrayStart`: `[`
- `jsonArrayEnd`: `]`
- `jsonString`: `"..."` (quoted string)
- `jsonNumber`: Numeric literals
- `jsonBoolean`: `true` | `false`
- `jsonNull`: `null`
- `jsonColon`: `:`
- `jsonComma`: `,`
- `jsonKey`: Identifier for object keys
- `jsonValue`: Generic JSON value

#### 4.3.2 CanvasL-Specific Tokens

- `canvaslDirective`: `@[a-zA-Z_][a-zA-Z0-9_-]*` - Directives for metadata
- `canvaslReference`: `#[a-zA-Z0-9_-]+` - References to other nodes
- `canvaslDimension`: `[0-7]D` - Dimension identifiers (0D-7D)
- `canvaslR5RSFunction`: `r5rs:[a-zA-Z_][a-zA-Z0-9_-]*` - R5RS function references
- `canvaslSchemeExpression`: `([^)]*)` - Scheme expressions in parentheses

#### 4.3.3 Type Tokens

- `canvaslType`: Node types (`node`, `edge`, `graph`, `automaton`, `shacl`, `rfc2119`, `asp`, `r5rs`)
- `canvaslEdgeType`: Edge types (`vertical`, `horizontal`, `transition`, `self-ref`, `r5rs-call`)

### 4.4 Grammar Rules

#### 4.4.1 Directive Rule

```grammar
CanvasLDirective {
  canvaslDirective jsonColon JSONLValue
}
```

- Directives MUST start with `@`
- Directives MUST be followed by `:` and a value
- Directives MUST appear before JSONL entries

#### 4.4.2 JSONL Object Rule

```grammar
JSONLObject {
  JSONLProperty (jsonComma JSONLProperty)*
}

JSONLProperty {
  jsonKey jsonColon JSONLValue
}

JSONLValue {
  jsonString | jsonNumber | jsonBoolean | jsonNull | JSONLObject | JSONLArray |
  canvaslReference | canvaslDimension | canvaslR5RSFunction | canvaslSchemeExpression | jsonValue
}
```

#### 4.4.3 Node Rule

```grammar
CanvasLNode {
  "id" jsonColon jsonString jsonComma
  "type" jsonColon canvaslType jsonComma
  JSONLProperty*
}
```

#### 4.4.4 Edge Rule

```grammar
CanvasLEdge {
  "id" jsonColon jsonString jsonComma
  "type" jsonColon canvaslEdgeType jsonComma
  ("from" | "fromNode") jsonColon (jsonString | canvaslReference) jsonComma
  ("to" | "toNode") jsonColon (jsonString | canvaslReference) jsonComma
  JSONLProperty*
}
```

#### 4.4.5 R5RS Call Rule

```grammar
CanvasLR5RSCall {
  "id" jsonColon jsonString jsonComma
  "type" jsonColon "r5rs-call" jsonComma
  ("function" jsonColon canvaslR5RSFunction | "expression" jsonColon canvaslSchemeExpression) jsonComma
  ("args" jsonColon JSONLArray)?
  JSONLProperty*
}
```

### 4.5 Grammar Implementation

- The grammar MUST be implemented in Lezer format
- The grammar file MUST be located at `ui/src/grammars/canvasl.grammar`
- The grammar MUST be compatible with CodeMirror 6 and Lezer parser

---

## 5. Directives

### 5.1 Directive Syntax

Directives MUST follow this syntax:

```canvasl
@directive-name: value
```

Where:
- `directive-name` MUST start with `@` followed by an identifier
- `value` MUST be a valid JSON value (string, number, boolean, null, object, array)

### 5.2 Directive Placement

- Directives MUST appear at the beginning of the file
- Directives MUST appear before any JSONL entries
- Directives MAY appear on separate lines
- Multiple directives MAY be specified

### 5.3 Standard Directives

The following directives are RECOMMENDED:

#### 5.3.1 Version Directive

```canvasl
@version: "1.0"
```

- Specifies CanvasL format version
- Value MUST be a string
- SHOULD be present in CanvasL files

#### 5.3.2 Schema Directive

```canvasl
@schema: "canvasl-v1"
```

- Specifies CanvasL schema version
- Value MUST be a string
- SHOULD be present in CanvasL files

#### 5.3.3 R5RS Engine Directive

```canvasl
@r5rs-engine: "r5rs-canvas-engine.scm"
```

- Specifies R5RS engine file
- Value MUST be a string (file path)
- MAY be used to specify custom R5RS engine

### 5.4 Custom Directives

- Implementations MAY define custom directives
- Custom directives MUST start with `@`
- Custom directives MUST follow directive syntax
- Custom directives MUST NOT conflict with standard directives

### 5.5 Directive Processing

- Directives MUST be parsed before JSONL entries
- Directives MUST be available for AST and LSP processing
- Directives MUST be included in file metadata

---

## 6. R5RS Function Integration

### 6.1 R5RS Function Syntax

R5RS functions MUST be referenced using the `r5rs:` prefix:

```json
{
  "id": "r5rs-compute",
  "type": "r5rs-call",
  "function": "r5rs:church-add",
  "args": [2, 3]
}
```

### 6.2 Function Name Requirements

- R5RS function names MUST be prefixed with `r5rs:`
- Function names MUST match entries in `r5rs-functions-trie.jsonl`
- Function names MUST be valid identifiers: `[a-zA-Z_][a-zA-Z0-9_-]*`

### 6.3 Function Call Format

R5RS function calls MUST use one of two formats:

#### 6.3.1 Function with Arguments

```json
{
  "id": "r5rs-call-id",
  "type": "r5rs-call",
  "function": "r5rs:function-name",
  "args": [arg1, arg2, ...]
}
```

- `function` MUST be present
- `args` MUST be an array of JSON values
- `args` MAY be empty array `[]`

#### 6.3.2 Expression Format

```json
{
  "id": "r5rs-call-id",
  "type": "r5rs-call",
  "expression": "(function-name arg1 arg2 ...)"
}
```

- `expression` MUST be valid R5RS Scheme syntax
- `expression` MUST be evaluable by the R5RS engine
- `expression` MAY reference R5RS functions

### 6.4 Function Registry

- R5RS functions MUST be registered in `r5rs-functions-trie.jsonl`
- Function registry MUST be queryable via `r5rs:query-facts`
- Function invocations MUST use `r5rs:invoke-from-jsonl`

### 6.5 Function Validation

- Function names MUST be validated against registry
- Function arguments MUST be validated for type compatibility
- Function calls MUST be validated before execution

**Reference**: See `docs/05-Meta-Log/MULTIVERSE-CANVAS-RFC2119-SPEC.md` Section 5 for complete R5RS integration details.

---

## 7. Dimension References

### 7.1 Dimension Format

Dimensions MUST be specified in format `[0-7]D`:

- `0D`: Quantum vacuum topology
- `1D`: Temporal topology
- `2D`: Bipartite topology
- `3D`: Algebraic/analytical structure
- `4D`: Network topology
- `5D`: Consensus topology
- `6D`: Intelligence topology
- `7D`: Quantum topology

### 7.2 Dimension Field

Dimensions MAY be specified in node entries:

```json
{
  "id": "0D-topology",
  "type": "text",
  "dimension": "0D",
  "text": "Quantum Vacuum"
}
```

- `dimension` field is OPTIONAL
- `dimension` value MUST be `0D`, `1D`, `2D`, `3D`, `4D`, `5D`, `6D`, or `7D`
- `dimension` MAY be used in node IDs

### 7.3 Dimension Validation

- Dimension values MUST be validated against allowed set (0D-7D)
- Dimension references MUST correspond to dimensional progression
- Dimension-aware parsing MUST be supported

---

## 8. Node References

### 8.1 Reference Syntax

Node references MUST use `#id` syntax:

```json
{
  "id": "edge-1",
  "type": "vertical",
  "fromNode": "#0D-topology",
  "toNode": "#1D-topology"
}
```

- References MUST start with `#`
- References MUST be followed by a valid node ID
- References MAY be used in `fromNode`, `toNode`, or other fields

### 8.2 Reference Resolution

- Referenced nodes MUST exist in the same file or referenced files
- Node references MUST resolve to valid node IDs
- Reference resolution MUST be performed during AST generation
- Unresolved references MUST be reported as errors

### 8.3 Reference Validation

- References MUST be validated for existence
- Circular references MUST be detected
- Reference chains MUST be resolvable

### 8.4 Cross-File References

- References MAY point to nodes in other files
- Cross-file references MUST specify file path
- Cross-file references MUST be resolvable via file system or URI

---

## 9. Scheme Expressions

### 9.1 Expression Syntax

Scheme expressions MUST be enclosed in parentheses:

```json
{
  "id": "computation",
  "type": "r5rs-call",
  "expression": "(church-add 2 3)"
}
```

- Expressions MUST be valid R5RS Scheme syntax
- Expressions MUST be evaluable by the R5RS engine
- Expressions MAY reference R5RS functions

### 9.2 Expression Evaluation

- Expressions MUST be evaluated by the R5RS engine
- Expression results MUST be serializable to JSON
- Expression errors MUST be reported

### 9.3 Expression Context

- Expressions MAY access canvas context
- Expressions MAY reference other nodes
- Expressions MAY use R5RS functions

---

## 10. Backward Compatibility

### 10.1 JSONL Compatibility

- CanvasL files MUST be valid JSONL files
- Standard JSONL entries (without CanvasL extensions) MUST be supported
- CanvasL extensions are OPTIONAL and MUST NOT break standard JSONL parsing

### 10.2 Migration Path

- Existing `.jsonl` files MAY be renamed to `.canvasl`
- Renamed files MUST work without modification
- CanvasL features MAY be added incrementally

### 10.3 Dual Format Support

- Implementations MUST support both `.jsonl` and `.canvasl` files
- Implementations MUST detect file format by extension
- Implementations MUST apply appropriate parsing based on format

### 10.4 Edge Format Compatibility

CanvasL MUST support both edge formats:

- **Old format**: `from`/`to`
- **New format**: `fromNode`/`toNode`
- Implementations MUST normalize to new format internally
- Both formats MUST be accepted during parsing

---

## 11. AST Structure

### 11.1 AST Node Interface

The AST MUST provide the following interface:

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
    directive?: string;
    value?: any;
  };
}
```

### 11.2 AST Generation Requirements

- AST MUST be generated from CanvasL source
- AST MUST include position information (line, column, length)
- AST MUST include node type information
- AST MUST include metadata for extensions

### 11.3 AST Functions

Implementations MUST provide:

- `parseCanvasLAST(content: string): CanvasLASTNode[]` - Parse file into AST
- `getASTNodeAtPosition(ast: CanvasLASTNode[], position: Position): CanvasLASTNode | null` - Get node at position
- `findReferences(ast: CanvasLASTNode[], nodeId: string): CanvasLASTNode[]` - Find references to node

**Reference**: See `docs/03-Metaverse-Canvas/CANVASL-AST-LSP.md` for AST implementation details.

---

## 12. LSP Support

### 12.1 LSP Features

Implementations MUST support the following LSP features:

#### 12.1.1 Hover

- MUST provide hover information for nodes, edges, R5RS functions, and references
- Hover information MUST include node type, dimension, and metadata
- Hover information MUST be available at cursor position

#### 12.1.2 Definition

- MUST provide definition lookup for node IDs and R5RS functions
- Definition MUST return file path and position
- Definition MUST support cross-file references

#### 12.1.3 References

- MUST find all references to a node ID
- References MUST include file path and position
- References MUST support cross-file references

#### 12.1.4 Completion

- MUST provide auto-completion for:
  - Node IDs
  - R5RS function names
  - Dimension values (0D-7D)
  - Directive names
- Completion MUST be context-aware

#### 12.1.5 Validation

- MUST validate CanvasL syntax
- MUST validate node references
- MUST validate R5RS function calls
- MUST validate dimension values
- MUST report errors with position information

### 12.2 LSP Service Interface

Implementations MUST provide LSP service with:

```typescript
interface CanvasLLSPService {
  hover(content: string, position: Position): Hover | null;
  definition(content: string, position: Position): Definition | null;
  references(content: string, position: Position): Location[];
  completion(content: string, position: Position): CompletionItem[];
  validate(content: string): Diagnostic[];
}
```

**Reference**: See `docs/03-Metaverse-Canvas/CANVASL-AST-LSP.md` for LSP implementation details.

---

## 13. Validation Requirements

### 13.1 Syntax Validation

- CanvasL files MUST be validated for syntax correctness
- Syntax errors MUST be reported with line and column numbers
- Syntax validation MUST occur during parsing

### 13.2 Reference Validation

- Node references MUST be validated for existence
- Unresolved references MUST be reported as errors
- Circular references MUST be detected and reported

### 13.3 R5RS Function Validation

- R5RS function names MUST be validated against registry
- Function arguments MUST be validated for type compatibility
- Function calls MUST be validated before execution

### 13.4 Dimension Validation

- Dimension values MUST be validated against allowed set (0D-7D)
- Dimension references MUST correspond to dimensional progression
- Invalid dimensions MUST be reported as errors

### 13.5 Directive Validation

- Directives MUST be validated for syntax
- Standard directives MUST be validated for value format
- Unknown directives MUST be reported as warnings (not errors)

### 13.6 Schema Validation

- CanvasL files MAY be validated against schema
- Schema validation MUST use `@schema` directive if present
- Schema validation errors MUST be reported

---

## 14. Implementation Requirements

### 14.1 Grammar Implementation

- Grammar MUST be implemented in Lezer format
- Grammar file MUST be located at `ui/src/grammars/canvasl.grammar`
- Grammar MUST be compatible with CodeMirror 6

### 14.2 Parser Implementation

- Parser MUST be generated from Lezer grammar
- Parser MUST produce AST structure
- Parser MUST handle errors gracefully

### 14.3 AST Implementation

- AST implementation MUST be in `ui/src/extensions/canvasl-language.ts`
- AST functions MUST be exported
- AST MUST include position information

### 14.4 LSP Implementation

- LSP service MUST be in `ui/src/services/canvasl-lsp-service.ts`
- LSP service MUST implement all required features
- LSP service MUST use AST for operations

### 14.5 CodeMirror Integration

- CanvasL MUST be integrated into CodeEditor
- Syntax highlighting MUST be provided
- Language support extension MUST be available

### 14.6 R5RS Integration

- R5RS functions MUST be invocable from CanvasL entries
- Function registry MUST be queryable
- Function invocations MUST use `r5rs:invoke-from-jsonl`

**Reference**: See `docs/05-Meta-Log/MULTIVERSE-CANVAS-RFC2119-SPEC.md` Section 5 for R5RS integration details.

---

## 15. References

### 15.1 Standards

- **RFC 2119**: Key words for use in RFCs to Indicate Requirement Levels
- **JSON**: ECMA-404 The JSON Data Interchange Standard
- **JSONL**: JSON Lines format (one JSON object per line)
- **R5RS**: Revised^5 Report on the Algorithmic Language Scheme
- **LSP**: Language Server Protocol (Microsoft)

### 15.2 Related Documents

- **`docs/03-Metaverse-Canvas/CANVASL-LANGUAGE.md`**: Language overview and features
- **`docs/03-Metaverse-Canvas/CANVASL-AST-LSP.md`**: AST and LSP implementation details
- **`docs/03-Metaverse-Canvas/CANVASL-SUMMARY.md`**: Quick reference summary
- **`docs/05-Meta-Log/MULTIVERSE-CANVAS-RFC2119-SPEC.md`**: Multiverse canvas specification
- **`docs/05-Meta-Log/IMPLEMENTATION-GUIDE.md`**: Implementation guide

### 15.3 Implementation Files

- **`ui/src/grammars/canvasl.grammar`**: Lezer grammar definition
- **`ui/src/extensions/canvasl-language.ts`**: CodeMirror extension and AST
- **`ui/src/services/canvasl-lsp-service.ts`**: LSP service implementation
- **`r5rs-canvas-engine.scm`**: R5RS function implementations
- **`r5rs-functions-trie.jsonl`**: R5RS function registry

### 15.4 External References

- [Lezer Grammar Guide](https://lezer.codemirror.net/docs/guide/index.html#writing-a-grammar)
- [Language Server Protocol](https://microsoft.github.io/language-server-protocol/)
- [CodeMirror 6 Documentation](https://codemirror.net/docs/)

---

## Appendix A: Complete Grammar Definition

See `ui/src/grammars/canvasl.grammar` for the complete Lezer grammar definition.

## Appendix B: Example CanvasL File

```canvasl
@version: "1.0"
@schema: "canvasl-v1"
@r5rs-engine: "r5rs-canvas-engine.scm"

{"id": "0D-topology", "type": "text", "dimension": "0D", "x": 0, "y": 0, "text": "# 0D: Quantum Vacuum"}
{"id": "1D-topology", "type": "text", "dimension": "1D", "x": 0, "y": 180, "text": "# 1D: Time Dimension"}
{"id": "v:0D→1D", "type": "vertical", "fromNode": "#0D-topology", "toNode": "#1D-topology", "label": "tan(): 0 → x"}
{"id": "r5rs-add", "type": "r5rs-call", "function": "r5rs:church-add", "args": [2, 3]}
{"id": "r5rs-compute", "type": "r5rs-call", "expression": "(church-mult (church-add 2 3) 4)"}
```

## Appendix C: Migration Guide

### From JSONL to CanvasL

1. **Rename file**: `mv file.jsonl file.canvasl`
2. **Add directives** (optional):
   ```canvasl
   @version: "1.0"
   @schema: "canvasl-v1"
   ```
3. **Enhance with CanvasL features** (optional):
   - Add dimension references
   - Add node references (`#id`)
   - Add R5RS function calls
   - Add Scheme expressions

---

**End of Specification**
