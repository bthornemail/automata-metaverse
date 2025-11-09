---
id: canvasl-quick-reference
title: "CanvasL Quick Reference"
level: practical
type: guide
tags: [canvasl, quick-reference, syntax, examples]
keywords: [canvasl, jsonl, r5rs-canvas-engine, blackboard-architecture, automaton-self-building, syntax-reference]
prerequisites: [canvasl-docs-readme, canvasl-rfc2119-spec]
enables: []
related: [r5rs-canvas-engine, blackboard-architecture-guide, multiverse-canvas-spec]
readingTime: 15
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
      args: ["automaton-kernel.jsonl"]
---

# CanvasL Quick Reference

**Quick reference for CanvasL syntax and features**

## File Format

### File Extension

```bash
# CanvasL files use .canvasl extension
automaton-kernel.canvasl
generate.metaverse.canvasl
```

### Basic Structure

```canvasl
@version: "1.0"
@schema: "canvasl-v1"

{"id": "node-1", "type": "text", "text": "Content"}
{"id": "edge-1", "type": "vertical", "fromNode": "#node-1", "toNode": "#node-2"}
```

## Directives

### Standard Directives

```canvasl
@version: "1.0"              # Format version
@schema: "canvasl-v1"         # Schema version
@r5rs-engine: "r5rs-canvas-engine.scm"  # R5RS engine file
```

### Syntax

- Directives MUST start with `@`
- Directives MUST appear before JSONL entries
- Format: `@directive-name: value`

## R5RS Function Calls

### Function Format

```json
{
  "id": "r5rs-add",
  "type": "r5rs-call",
  "function": "r5rs:church-add",
  "args": [2, 3]
}
```

### Expression Format

```json
{
  "id": "r5rs-compute",
  "type": "r5rs-call",
  "expression": "(church-add 2 3)"
}
```

### Requirements

- Function names MUST be prefixed with `r5rs:`
- Function names MUST match registry entries
- Arguments MUST be valid JSON values

## Dimensions

### Dimension Values

- `0D`: Quantum vacuum topology
- `1D`: Temporal topology
- `2D`: Bipartite topology
- `3D`: Algebraic/analytical structure
- `4D`: Network topology
- `5D`: Consensus topology
- `6D`: Intelligence topology
- `7D`: Quantum topology

### Usage

```json
{
  "id": "0D-topology",
  "type": "text",
  "dimension": "0D",
  "text": "Quantum Vacuum"
}
```

## Node References

### Reference Syntax

```json
{
  "id": "edge-1",
  "type": "vertical",
  "fromNode": "#0D-topology",
  "toNode": "#1D-topology"
}
```

### Requirements

- References MUST start with `#`
- Referenced nodes MUST exist
- References MUST resolve to valid node IDs

## Common Patterns

### Basic Node

```json
{"id": "node-id", "type": "text", "x": 0, "y": 0, "text": "Content"}
```

### Node with Dimension

```json
{"id": "0D-topology", "type": "text", "dimension": "0D", "text": "Quantum Vacuum"}
```

### Edge with References

```json
{"id": "v:0D→1D", "type": "vertical", "fromNode": "#0D-topology", "toNode": "#1D-topology", "label": "tan(): 0 → x"}
```

### R5RS Function Call

```json
{"id": "r5rs-add", "type": "r5rs-call", "function": "r5rs:church-add", "args": [2, 3]}
```

### Complete Example

```canvasl
@version: "1.0"
@schema: "canvasl-v1"

{"id": "0D-topology", "type": "text", "dimension": "0D", "x": 0, "y": 0, "text": "# 0D: Quantum Vacuum"}
{"id": "1D-topology", "type": "text", "dimension": "1D", "x": 0, "y": 180, "text": "# 1D: Time Dimension"}
{"id": "v:0D→1D", "type": "vertical", "fromNode": "#0D-topology", "toNode": "#1D-topology", "label": "tan(): 0 → x"}
{"id": "r5rs-add", "type": "r5rs-call", "function": "r5rs:church-add", "args": [2, 3]}
```

## Validation

### Syntax Validation

- Files MUST be valid JSONL
- Directives MUST be valid
- References MUST resolve
- R5RS functions MUST be registered

### Error Reporting

- Errors MUST include line and column numbers
- Errors MUST specify error type
- Errors MUST be actionable

## Migration

### From JSONL to CanvasL

```bash
# Simple rename
mv file.jsonl file.canvasl

# File works immediately
# Add CanvasL features incrementally
```

## See Also

- `CANVASL-RFC2119-SPEC.md`: Complete RFC 2119 specification
- `docs/03-Metaverse-Canvas/CANVASL-LANGUAGE.md`: Language overview
- `docs/03-Metaverse-Canvas/CANVASL-AST-LSP.md`: AST and LSP details
