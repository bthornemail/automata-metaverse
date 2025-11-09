---
id: canvasl-docs-readme
title: "CanvasL Documentation"
level: foundational
type: navigation
tags: [canvasl, jsonl, r5rs, specification, documentation]
keywords: [canvasl, jsonl, r5rs-canvas-engine, blackboard-architecture, automaton-self-building]
prerequisites: []
enables: [canvasl-rfc2119-spec, canvasl-quick-reference]
related: [r5rs-canvas-engine, blackboard-architecture-guide, multiverse-canvas-spec]
readingTime: 10
difficulty: 2
blackboard:
  status: active
  assignedAgent: null
  lastUpdate: null
  dependencies: []
  watchers: []
  r5rsEngine: "r5rs-canvas-engine.scm"
  selfBuilding:
    enabled: true
    source: "r5rs-canvas-engine.scm"
    pattern: "blackboard-architecture"
    regeneration:
      function: "r5rs:parse-jsonl-canvas"
      args: ["automaton-kernel.jsonl"]
---

# CanvasL Documentation

This folder contains the RFC 2119 specification for CanvasL, an extended JSONL canvas format designed for the Metaverse Canvas system.

## Documents

### [CANVASL-RFC2119-SPEC.md](./CANVASL-RFC2119-SPEC.md)

**Complete RFC 2119 specification** for CanvasL language:

- File format and grammar specification
- Directive syntax and semantics
- R5RS function integration
- Dimension reference system (0D-7D)
- Node reference resolution
- Scheme expression support
- AST structure requirements
- LSP feature requirements
- Validation requirements
- Implementation requirements

**Use this document for**: Complete specification reference, implementation requirements, grammar definitions

## Quick Reference

### File Extension

- CanvasL files MUST use `.canvasl` extension
- CanvasL files MUST be valid JSONL files (backward compatible)

### Basic Syntax

```canvasl
@version: "1.0"
@schema: "canvasl-v1"

{"id": "0D-topology", "type": "text", "dimension": "0D", "text": "# 0D: Quantum Vacuum"}
{"id": "edge-1", "type": "vertical", "fromNode": "#0D-topology", "toNode": "#1D-topology"}
{"id": "r5rs-add", "type": "r5rs-call", "function": "r5rs:church-add", "args": [2, 3]}
```

### Key Features

1. **Directives**: `@directive: value` for metadata
2. **R5RS Functions**: `r5rs:function-name` for Scheme function calls
3. **Dimensions**: `0D`-`7D` for dimensional references
4. **Node References**: `#id` for referencing other nodes
5. **Scheme Expressions**: `(scheme code)` for inline expressions

## Grammar

CanvasL uses a Lezer grammar (`ui/src/grammars/canvasl.grammar`) that extends JSONL with:

- `canvaslDirective`: `@directive`
- `canvaslReference`: `#id`
- `canvaslDimension`: `0D`-`7D`
- `canvaslR5RSFunction`: `r5rs:function-name`
- `canvaslSchemeExpression`: `(scheme code)`

## Backward Compatibility

✅ **Full backward compatibility** with JSONL:

- Existing `.jsonl` files work without modification
- Can rename `.jsonl` → `.canvasl` for enhanced features
- All JSONL canvas features supported
- No breaking changes

## Implementation Files

- **Grammar**: `ui/src/grammars/canvasl.grammar`
- **AST/Language**: `ui/src/extensions/canvasl-language.ts`
- **LSP Service**: `ui/src/services/canvasl-lsp-service.ts`

## Related Documentation

- **`docs/03-Metaverse-Canvas/CANVASL-LANGUAGE.md`**: Language overview and features
- **`docs/03-Metaverse-Canvas/CANVASL-AST-LSP.md`**: AST and LSP implementation
- **`docs/05-Meta-Log/MULTIVERSE-CANVAS-RFC2119-SPEC.md`**: Multiverse canvas specification (includes CanvasL in Section 4)
- **`docs/05-Meta-Log/IMPLEMENTATION-GUIDE.md`**: Implementation guide with CanvasL examples

## Status

- ✅ RFC 2119 Specification: Complete
- ✅ Grammar Definition: Complete (`ui/src/grammars/canvasl.grammar`)
- ✅ AST Implementation: Complete (`ui/src/extensions/canvasl-language.ts`)
- ✅ LSP Service: Complete (`ui/src/services/canvasl-lsp-service.ts`)
- ✅ CodeMirror Integration: Complete

---

**Last Updated**: 2025-01-07  
**Version**: 1.0  
**Status**: Complete RFC 2119 specification
