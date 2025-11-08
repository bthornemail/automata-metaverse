---
id: automatons-canvasl-compatibility-matrix
title: "CanvasL Compatibility Matrix"
level: practical
type: reference
tags: [automatons-canvasl, compatibility-matrix, backward-compatibility, forward-compatibility, testing]
keywords: [automatons-canvasl, compatibility-matrix, backward-compatibility, forward-compatibility, jsonl-compatibility, canvasl-compatibility, testing-matrix]
prerequisites: [automatons-canvasl-docs-readme, canvasl-rfc2119-spec]
enables: []
related: [automatons-canvasl-docs-readme, adaptation-guide, file-format-detection]
readingTime: 30
difficulty: 3
blackboard:
  status: active
  assignedAgent: "2D-Structural-Agent"
  lastUpdate: null
  dependencies: [canvasl-parser, advanced-automaton-engine]
  watchers: []
---

# CanvasL Compatibility Matrix

This document defines the compatibility requirements and testing matrix for CanvasL integration in the automaton system.

## Compatibility Requirements

### Backward Compatibility (JSONL → CanvasL)

| Feature | JSONL Support | CanvasL Support | Compatibility |
|---------|---------------|-----------------|---------------|
| **File Extension** | `.jsonl` | `.jsonl`, `.canvasl` | ✅ Full |
| **JSONL Parsing** | ✅ Required | ✅ Required | ✅ Full |
| **Directives** | ❌ Not supported | ✅ Supported | ✅ Backward compatible (ignored in JSONL) |
| **R5RS Calls** | ❌ Not supported | ✅ Supported | ✅ Backward compatible (ignored in JSONL) |
| **Dimension References** | ✅ Supported | ✅ Supported | ✅ Full |
| **Node References** | ✅ Supported | ✅ Supported | ✅ Full |
| **Scheme Expressions** | ❌ Not supported | ✅ Supported | ✅ Backward compatible (ignored in JSONL) |

### Forward Compatibility (CanvasL → JSONL)

| Feature | CanvasL Support | JSONL Support | Compatibility |
|---------|-----------------|---------------|---------------|
| **File Extension** | `.canvasl` | `.jsonl` | ✅ Can convert |
| **JSONL Parsing** | ✅ Required | ✅ Required | ✅ Full |
| **Directives** | ✅ Supported | ❌ Not supported | ⚠️ Lost on conversion |
| **R5RS Calls** | ✅ Supported | ❌ Not supported | ⚠️ Lost on conversion |
| **Dimension References** | ✅ Supported | ✅ Supported | ✅ Full |
| **Node References** | ✅ Supported | ✅ Supported | ✅ Full |
| **Scheme Expressions** | ✅ Supported | ❌ Not supported | ⚠️ Lost on conversion |

## File Format Support Matrix

### Reading Files

| Format | Extension | Parser | Directives | R5RS Calls | Status |
|--------|-----------|--------|------------|------------|--------|
| **JSONL** | `.jsonl` | `parseJSONL()` | ❌ Ignored | ❌ Ignored | ✅ Supported |
| **CanvasL** | `.canvasl` | `parseCanvasL()` | ✅ Parsed | ✅ Processed | ✅ Supported |

### Writing Files

| Format | Extension | Writer | Directives | R5RS Calls | Status |
|--------|-----------|--------|------------|------------|--------|
| **JSONL** | `.jsonl` | `saveJSONL()` | ❌ Not written | ❌ Not written | ✅ Supported |
| **CanvasL** | `.canvasl` | `saveCanvasL()` | ✅ Written | ✅ Preserved | ✅ Supported |

## Feature Support Matrix

### Core Features

| Feature | JSONL | CanvasL | Notes |
|---------|-------|---------|-------|
| **Load JSONL objects** | ✅ | ✅ | Both formats support |
| **Save JSONL objects** | ✅ | ✅ | Both formats support |
| **Parse directives** | ❌ | ✅ | CanvasL only |
| **Process R5RS calls** | ❌ | ✅ | CanvasL only |
| **Evaluate Scheme expressions** | ❌ | ✅ | CanvasL only |
| **Dimension references** | ✅ | ✅ | Both formats support |
| **Node references** | ✅ | ✅ | Both formats support |

### Extended Features

| Feature | JSONL | CanvasL | Notes |
|---------|-------|---------|-------|
| **@version directive** | ❌ | ✅ | CanvasL metadata |
| **@schema directive** | ❌ | ✅ | CanvasL metadata |
| **@r5rs-engine directive** | ❌ | ✅ | CanvasL metadata |
| **r5rs-call type objects** | ❌ | ✅ | CanvasL R5RS integration |
| **Scheme expression objects** | ❌ | ✅ | CanvasL computation |

## Testing Matrix

### Test Cases

| Test Case | JSONL Input | CanvasL Input | Expected Result |
|-----------|-------------|---------------|-----------------|
| **Load standard JSONL** | ✅ | N/A | ✅ Loads successfully |
| **Load CanvasL with directives** | N/A | ✅ | ✅ Loads with directives parsed |
| **Load CanvasL with R5RS calls** | N/A | ✅ | ✅ Loads with R5RS calls processed |
| **Save as JSONL** | ✅ | ✅ | ✅ Saves without directives/R5RS |
| **Save as CanvasL** | ✅ | ✅ | ✅ Saves with directives/R5RS |
| **Convert JSONL → CanvasL** | ✅ | N/A | ✅ Converts with default directives |
| **Convert CanvasL → JSONL** | N/A | ✅ | ⚠️ Loses directives/R5RS calls |

### Compatibility Tests

| Test | Description | Status |
|------|-------------|--------|
| **Backward Compatibility** | Existing `.jsonl` files continue to work | ✅ Required |
| **Forward Compatibility** | New `.canvasl` files work with automaton system | ✅ Required |
| **Format Detection** | Correct format detected by extension | ✅ Required |
| **Directive Parsing** | CanvasL directives parsed correctly | ✅ Required |
| **R5RS Call Processing** | R5RS calls executed correctly | ✅ Required |
| **Round-trip JSONL** | Load → Save JSONL preserves data | ✅ Required |
| **Round-trip CanvasL** | Load → Save CanvasL preserves data | ✅ Required |

## Migration Compatibility

### Migration Paths

| Migration | Source Format | Target Format | Data Loss | Status |
|-----------|---------------|---------------|-----------|--------|
| **JSONL → CanvasL** | `.jsonl` | `.canvasl` | ❌ None | ✅ Safe |
| **CanvasL → JSONL** | `.canvasl` | `.jsonl` | ⚠️ Directives/R5RS lost | ⚠️ Partial |

### Migration Recommendations

1. **JSONL → CanvasL**: ✅ **Recommended**
   - No data loss
   - Gains CanvasL features
   - Backward compatible

2. **CanvasL → JSONL**: ⚠️ **Not Recommended**
   - Loses directives
   - Loses R5RS calls
   - Loses Scheme expressions
   - Only use if CanvasL features not needed

## Implementation Status

### Current Implementation

| Component | JSONL Support | CanvasL Support | Status |
|-----------|---------------|-----------------|--------|
| **File Loading** | ✅ | ⚠️ Planned | 🚧 In Progress |
| **File Saving** | ✅ | ⚠️ Planned | 🚧 In Progress |
| **Format Detection** | ✅ | ⚠️ Planned | 🚧 In Progress |
| **Directive Parsing** | N/A | ⚠️ Planned | 🚧 In Progress |
| **R5RS Call Processing** | N/A | ⚠️ Planned | 🚧 In Progress |
| **Command-Line Interface** | ✅ | ✅ | ✅ Ready (via --file) |

### Planned Features

- [ ] CanvasL file loading
- [ ] CanvasL file saving
- [ ] Format detection by extension
- [ ] Directive parsing
- [ ] R5RS call execution
- [ ] Scheme expression evaluation
- [ ] Format conversion utilities

## See Also

- **`docs/12-Automatons-CanvasL/README.md`**: Overview documentation
- **`docs/12-Automatons-CanvasL/ADAPTATION-GUIDE.md`**: Implementation guide
- **`docs/12-Automatons-CanvasL/FILE-FORMAT-DETECTION.md`**: Format detection details
- **`docs/12-Automatons-CanvasL/R5RS-INTEGRATION.md`**: R5RS integration details
- **`docs/12-Automatons-CanvasL/MIGRATION-GUIDE.md`**: Migration guide
