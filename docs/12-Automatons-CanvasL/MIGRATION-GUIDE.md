---
id: automatons-canvasl-migration-guide
title: "Migration Guide: JSONL to CanvasL"
level: practical
type: guide
tags: [automatons-canvasl, migration-guide, jsonl-to-canvasl, format-conversion]
keywords: [automatons-canvasl, migration-guide, jsonl-to-canvasl, format-conversion, backward-compatibility, forward-compatibility]
prerequisites: [automatons-canvasl-docs-readme, adaptation-guide]
enables: []
related: [automatons-canvasl-docs-readme, adaptation-guide, compatibility-matrix]
readingTime: 25
difficulty: 3
blackboard:
  status: active
  assignedAgent: "2D-Structural-Agent"
  lastUpdate: null
  dependencies: [canvasl-parser, advanced-automaton-engine]
  watchers: []
---

# Migration Guide: JSONL to CanvasL

This guide explains how to migrate existing automaton files from JSONL format to CanvasL format.

## Migration Overview

### Why Migrate?

- ✅ **Enhanced Features**: R5RS function calls, directives, Scheme expressions
- ✅ **Future-Proof**: CanvasL supports future extensions
- ✅ **R5RS Integration**: Direct integration with R5RS engine
- ✅ **Standardized Format**: RFC 2119 compliant specification

### Migration Safety

- ✅ **No Data Loss**: All JSONL data preserved
- ✅ **Backward Compatible**: Can still read JSONL files
- ✅ **Reversible**: Can convert back to JSONL (with feature loss)

## Migration Steps

### Step 1: Backup Existing Files

```bash
# Backup existing JSONL files
cp automaton.jsonl automaton.jsonl.backup
cp automaton-kernel.jsonl automaton-kernel.jsonl.backup
```

### Step 2: Convert JSONL to CanvasL

#### Manual Conversion

1. **Add Directives**: Add CanvasL directives at the top of the file:

```canvasl
@version: "1.0"
@schema: "canvasl-v1"

# Existing JSONL content follows
{"id": "node-1", "type": "text", "text": "Content"}
```

2. **Rename File**: Change extension from `.jsonl` to `.canvasl`:

```bash
mv automaton.jsonl automaton.canvasl
```

#### Automated Conversion

Use conversion utility (when implemented):

```typescript
import { convertJSONLToCanvasL } from './utils/converter';

convertJSONLToCanvasL('./automaton.jsonl', './automaton.canvasl');
```

### Step 3: Verify Conversion

```bash
# Test loading CanvasL file
./scripts/run-automaton.sh --file ./automaton.canvasl --max 1
```

### Step 4: Update References

Update any scripts or tools that reference the file:

```bash
# Old reference
./scripts/run-automaton.sh --file ./automaton.jsonl

# New reference
./scripts/run-automaton.sh --file ./automaton.canvasl
```

## Conversion Examples

### Example 1: Basic Conversion

**Before (JSONL)**:
```jsonl
{"id": "0D-topology", "type": "automaton", "dimension": 0, "text": "0D: Quantum Vacuum"}
{"id": "1D-temporal", "type": "automaton", "dimension": 1, "text": "1D: Temporal Evolution"}
```

**After (CanvasL)**:
```canvasl
@version: "1.0"
@schema: "canvasl-v1"

{"id": "0D-topology", "type": "automaton", "dimension": 0, "text": "0D: Quantum Vacuum"}
{"id": "1D-temporal", "type": "automaton", "dimension": 1, "text": "1D: Temporal Evolution"}
```

### Example 2: With R5RS Integration

**Before (JSONL)**:
```jsonl
{"id": "evolve-0d", "type": "action", "action": "evolve", "from": 0, "to": 1}
```

**After (CanvasL)**:
```canvasl
@version: "1.0"
@schema: "canvasl-v1"
@r5rs-engine: "r5rs-canvas-engine.scm"

{"id": "evolve-0d", "type": "action", "action": "evolve", "from": 0, "to": 1}
{"id": "r5rs-successor", "type": "r5rs-call", "function": "r5rs:church-succ", "args": [0]}
```

### Example 3: With Scheme Expressions

**Before (JSONL)**:
```jsonl
{"id": "compute-sum", "type": "computation", "value": 5}
```

**After (CanvasL)**:
```canvasl
@version: "1.0"
@schema: "canvasl-v1"

{"id": "compute-sum", "type": "r5rs-call", "expression": "(church-add 2 3)"}
```

## Migration Checklist

- [ ] Backup existing JSONL files
- [ ] Add CanvasL directives (`@version`, `@schema`)
- [ ] Rename file extension (`.jsonl` → `.canvasl`)
- [ ] Verify file loads correctly
- [ ] Test automaton execution
- [ ] Update script references
- [ ] Document migration in project
- [ ] Remove old JSONL files (optional)

## Reverse Migration (CanvasL → JSONL)

### When to Reverse Migrate

- ⚠️ **Not Recommended**: Loses CanvasL-specific features
- ⚠️ **Use Cases**: Only if CanvasL features not needed

### Reverse Migration Steps

1. **Remove Directives**: Remove all `@directive` lines
2. **Remove R5RS Calls**: Remove `r5rs-call` type objects
3. **Rename File**: Change extension from `.canvasl` to `.jsonl`

**Warning**: This process loses:
- Directives (`@version`, `@schema`, `@r5rs-engine`)
- R5RS function calls
- Scheme expressions

## Migration Tools

### Conversion Utility (Planned)

```typescript
// utils/converter.ts
export function convertJSONLToCanvasL(
  jsonlPath: string,
  canvaslPath: string,
  options?: {
    version?: string;
    schema?: string;
    r5rsEngine?: string;
  }
): void {
  const automaton = new AdvancedSelfReferencingAutomaton(jsonlPath);
  
  // Set CanvasL format
  automaton.fileFormat = 'canvasl';
  
  // Set directives
  automaton.directives = {
    version: options?.version || '1.0',
    schema: options?.schema || 'canvasl-v1',
    'r5rs-engine': options?.r5rsEngine || 'r5rs-canvas-engine.scm'
  };
  
  // Save as CanvasL
  automaton.filePath = canvaslPath;
  automaton.save();
}
```

### Batch Conversion Script

```bash
#!/bin/bash
# convert-all-jsonl-to-canvasl.sh

for file in *.jsonl; do
    canvasl_file="${file%.jsonl}.canvasl"
    echo "Converting $file to $canvasl_file"
    # Use conversion utility
    npx tsx utils/converter.ts "$file" "$canvasl_file"
done
```

## Best Practices

### 1. Gradual Migration

- ✅ Migrate files incrementally
- ✅ Test each migrated file
- ✅ Keep backups of original files

### 2. Version Control

- ✅ Commit JSONL files before migration
- ✅ Commit CanvasL files after migration
- ✅ Document migration in commit message

### 3. Testing

- ✅ Test file loading
- ✅ Test automaton execution
- ✅ Test R5RS function calls (if added)
- ✅ Verify no data loss

### 4. Documentation

- ✅ Document migration date
- ✅ Document any manual changes
- ✅ Update project documentation

## Troubleshooting

### Issue: File Won't Load

**Solution**: Check file extension and format:

```bash
# Verify file extension
ls -la automaton.canvasl

# Check file content
head -5 automaton.canvasl
```

### Issue: Directives Not Parsed

**Solution**: Ensure directives are at the top of the file:

```canvasl
@version: "1.0"
@schema: "canvasl-v1"

# Directives must come before JSONL objects
```

### Issue: R5RS Calls Not Executed

**Solution**: Ensure R5RS engine is configured:

```canvasl
@r5rs-engine: "r5rs-canvas-engine.scm"
```

## See Also

- **`docs/12-Automatons-CanvasL/README.md`**: Overview documentation
- **`docs/12-Automatons-CanvasL/ADAPTATION-GUIDE.md`**: Implementation guide
- **`docs/12-Automatons-CanvasL/COMPATIBILITY-MATRIX.md`**: Compatibility requirements
- **`docs/04-CanvasL/CANVASL-RFC2119-SPEC.md`**: CanvasL specification
