---
id: metaverse-canvas-docs-readme
title: "Metaverse Canvas Documentation"
level: foundational
type: navigation
tags: [metaverse-canvas, jsonl, canvasl, documentation, canvas-editing]
keywords: [metaverse-canvas, jsonl-canvas-editing, canvasl, r5rs-canvas-engine, blackboard-architecture, automaton-self-building]
prerequisites: []
enables: [jsonl-canvas-editing, canvasl-language, canvasl-ast-lsp, metaverse-canvas-complete]
related: [r5rs-canvas-engine, blackboard-architecture-guide, canvasl-rfc2119-spec]
readingTime: 15
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

# Metaverse Canvas Documentation

This directory contains documentation for the Metaverse Canvas system, including JSONL canvas editing, markdown front matter integration, and relationship management.

## Documents

- **[JSONL-CANVAS-EDITING.md](./JSONL-CANVAS-EDITING.md)** - Comprehensive guide to JSONL canvas editing and markdown integration
- **[BACKWARD-COMPATIBILITY.md](./BACKWARD-COMPATIBILITY.md)** - Backward compatibility verification with 00-Inbox design
- **[LEZER-GRAMMAR-COMPATIBILITY.md](./LEZER-GRAMMAR-COMPATIBILITY.md)** - Lezer grammar compatibility and CodeMirror 6 integration
- **[CODE-MIRROR-LEZER-INTEGRATION.md](./CODE-MIRROR-LEZER-INTEGRATION.md)** - Detailed CodeMirror 6 and Lezer integration guide
- **[CANVASL-LANGUAGE.md](./CANVASL-LANGUAGE.md)** - CanvasL language overview and features
- **[CANVASL-AST-LSP.md](./CANVASL-AST-LSP.md)** - AST and LSP support for CanvasL
- **[CANVASL-SUMMARY.md](./CANVASL-SUMMARY.md)** - CanvasL language summary and quick reference

**For complete RFC 2119 specification**: See `docs/04-CanvasL/CANVASL-RFC2119-SPEC.md`
- **[GRAMMAR-REFERENCE.md](./GRAMMAR-REFERENCE.md)** - Complete grammar reference guide
- **[IMPLEMENTATION-SUMMARY.md](./IMPLEMENTATION-SUMMARY.md)** - Implementation summary and status
- **[IMPLEMENTATION-COMPLETE.md](./IMPLEMENTATION-COMPLETE.md)** - Complete implementation checklist
- **[IMPLEMENTATION-FINAL.md](./IMPLEMENTATION-FINAL.md)** - Final implementation summary with CanvasL
- **[ARCHITECTURE.md](./ARCHITECTURE.md)** - System architecture and design decisions (coming soon)
- **[API-REFERENCE.md](./API-REFERENCE.md)** - Complete API reference (coming soon)

## Quick Start

### Using the JSONL Canvas Editor

1. Open AI Portal
2. Navigate to "AI Portal - Evolution Engine & Metrics" modal
3. Select "Canvas Editor" tab
4. Choose a JSONL file (e.g., `automaton-kernel.jsonl`)
5. Edit nodes and edges visually or in raw JSONL view
6. Save changes

### Using Markdown with Front Matter

1. Open Code Editor
2. Switch language to "Markdown"
3. Add front matter:
   ```markdown
   ---
   jsonl: automaton-kernel.jsonl
   ---
   ```
4. Write markdown content with code blocks
5. JSONL references are automatically loaded in REPL

### Using REPL with Canvas Data

```scheme
;; Load JSONL from markdown front matter
(load-jsonl-from-markdown "automaton-kernel.jsonl")

;; Query canvas nodes
(canvas-node "0D-topology")

;; Update canvas nodes
(update-canvas-node "0D-topology" '((text . "Updated content")))

;; Get all JSONL references
(get-canvas-refs)
```

## Key Features

- ✅ Visual JSONL canvas editing
- ✅ Markdown front matter support
- ✅ REPL integration with JSONL data
- ✅ Bipartite relationship tracking
- ✅ Backward compatible with 00-Inbox design
- ✅ Dimensional progression support (0D-7D)
- ✅ R5RS function references
- ✅ Patricia/Radix trie structure support

## Related Documentation

### CanvasL Specification

- **`docs/04-CanvasL/CANVASL-RFC2119-SPEC.md`**: Complete RFC 2119 specification for CanvasL
- **`docs/04-CanvasL/README.md`**: CanvasL documentation overview
- **`docs/04-CanvasL/QUICK_REFERENCE.md`**: CanvasL quick reference

### Foundational Documents

- **`docs/00-Inbox/`**: Foundational design documents
- **`docs/05-Meta-Log/MULTIVERSE-CANVAS-RFC2119-SPEC.md`**: Multiverse canvas specification
- **`README-R5RS-ENGINE.md`**: R5RS engine documentation
- **`AGENTS.md`**: Multi-agent system architecture
- **`ui/IMPLEMENTATION_NOTES.md`**: Implementation details
