---
id: automatons-canvasl-docs-readme
title: "Automatons CanvasL Integration Documentation"
level: foundational
type: documentation
tags: [automatons-canvasl, canvasl-integration, backward-compatibility, forward-compatibility, file-format-adaptation]
keywords: [automatons-canvasl, canvasl-integration, jsonl-compatibility, file-format-adaptation, backward-compatibility, forward-compatibility, r5rs-integration]
prerequisites: [automatons-docs-readme, canvasl-docs-readme, canvasl-rfc2119-spec]
enables: [automatons-canvasl-adaptation-guide, automatons-canvasl-compatibility]
related: [automatons-docs-readme, canvasl-rfc2119-spec, advanced-automaton-docs, run-automaton-script-docs]
readingTime: 20
difficulty: 3
blackboard:
  status: active
  assignedAgent: "2D-Structural-Agent"
  lastUpdate: null
  dependencies: [canvasl-parser, advanced-automaton-engine]
  watchers: []
  r5rsEngine: "r5rs-canvas-engine.scm"
  selfBuilding:
    enabled: true
    source: "advanced-automaton.ts"
    pattern: "canvasl-integration"
    regeneration:
      function: "r5rs:parse-jsonl-canvas"
      args: ["automaton.canvasl"]
---

# Automatons CanvasL Integration Documentation

This directory contains documentation for integrating CanvasL format (`.canvasl` extension) support into the Self-Referencing JSONL Automaton system, with full backward and forward compatibility.

## Overview

The automaton system currently supports standard JSONL files (`.jsonl` extension). This documentation describes the adaptation and integration of CanvasL format support, which extends JSONL with:

- **Directives**: `@version`, `@schema`, `@r5rs-engine`
- **R5RS Function Calls**: `{"type": "r5rs-call", "function": "r5rs:church-add"}`
- **Dimension References**: `{"dimension": "0D"}`
- **Node References**: `{"fromNode": "#node-id"}`
- **Scheme Expressions**: `{"expression": "(church-add 2 3)"}`

## Compatibility Strategy

### Backward Compatibility (JSONL → CanvasL)

- ✅ **Read `.jsonl` files**: Automaton system MUST continue to read standard JSONL files
- ✅ **Parse JSONL lines**: Standard JSON parsing for each line
- ✅ **Ignore directives**: Treat directive lines as comments when reading JSONL
- ✅ **No breaking changes**: Existing `.jsonl` automaton files continue to work

### Forward Compatibility (CanvasL → JSONL)

- ✅ **Read `.canvasl` files**: Automaton system SHOULD support reading CanvasL files
- ✅ **Parse directives**: Extract and process CanvasL directives
- ✅ **Handle R5RS calls**: Process `r5rs-call` type objects
- ✅ **Write `.canvasl` files**: Optionally write in CanvasL format when saving

### Dual Format Support

- ✅ **Auto-detect format**: Detect file format by extension (`.jsonl` vs `.canvasl`)
- ✅ **Unified parsing**: Use same parsing logic with format-specific handlers
- ✅ **Format conversion**: Convert between formats when needed

## Table of Contents

- [Adaptation Guide](./ADAPTATION-GUIDE.md): Step-by-step integration guide
- [Compatibility Matrix](./COMPATIBILITY-MATRIX.md): Compatibility requirements and testing
- [File Format Detection](./FILE-FORMAT-DETECTION.md): Auto-detection and format handling
- [R5RS Integration](./R5RS-INTEGRATION.md): R5RS function call support in automatons
- [Migration Guide](./MIGRATION-GUIDE.md): Migrating existing automaton files to CanvasL

## Key Concepts

### Format Detection

The automaton system detects file format by extension:

```typescript
function detectFormat(filePath: string): 'jsonl' | 'canvasl' {
  if (filePath.endsWith('.canvasl')) return 'canvasl';
  if (filePath.endsWith('.jsonl')) return 'jsonl';
  // Default to jsonl for backward compatibility
  return 'jsonl';
}
```

### Unified Parser

Both formats use the same core parsing logic:

```typescript
function parseAutomatonFile(filePath: string): AutomatonObjects {
  const format = detectFormat(filePath);
  const content = readFileSync(filePath, 'utf-8');
  
  if (format === 'canvasl') {
    return parseCanvasL(content);
  } else {
    return parseJSONL(content);
  }
}
```

### CanvasL Parser

CanvasL parser handles directives and extended features:

```typescript
function parseCanvasL(content: string): ParsedCanvasL {
  const directives: Record<string, string> = {};
  const objects: CanvasObject[] = [];
  
  const lines = content.split('\n');
  for (const line of lines) {
    // Parse directives
    if (line.startsWith('@')) {
      const [key, value] = line.split(':').map(s => s.trim());
      directives[key.substring(1)] = value;
      continue;
    }
    
    // Parse JSONL objects
    if (line.trim().startsWith('{')) {
      const obj = JSON.parse(line);
      objects.push(obj);
    }
  }
  
  return { directives, objects };
}
```

## Integration Points

### 1. File Loading (`advanced-automaton.ts`)

**Current**: Only supports `.jsonl` files
**Adaptation**: Add CanvasL detection and parsing

```typescript
private load(): void {
  const format = this.detectFormat(this.filePath);
  const content = readFileSync(this.filePath, 'utf-8');
  
  if (format === 'canvasl') {
    const parsed = this.parseCanvasL(content);
    this.directives = parsed.directives;
    this.objects = parsed.objects;
  } else {
    this.objects = this.parseJSONL(content);
  }
}
```

### 2. File Saving (`advanced-automaton.ts`)

**Current**: Always saves as JSONL
**Adaptation**: Save in same format as loaded, or allow format specification

```typescript
private save(format?: 'jsonl' | 'canvasl'): void {
  const targetFormat = format || this.detectFormat(this.filePath);
  
  if (targetFormat === 'canvasl') {
    this.saveCanvasL();
  } else {
    this.saveJSONL();
  }
}
```

### 3. R5RS Function Execution

**Current**: No R5RS function support
**Adaptation**: Execute R5RS calls when processing CanvasL files

```typescript
private executeR5RSCall(obj: R5RSCallObject): any {
  const functionName = obj.function.replace('r5rs:', '');
  const args = obj.args || [];
  
  // Call R5RS function from registry
  return this.r5rsRegistry.call(functionName, args);
}
```

### 4. Command-Line Interface (`run-automaton.sh`)

**Current**: Only accepts `.jsonl` files
**Adaptation**: Accept both `.jsonl` and `.canvasl` files

```bash
# Both formats supported
./scripts/run-automaton.sh --file ./automaton.jsonl
./scripts/run-automaton.sh --file ./automaton.canvasl
```

## Benefits

### Enhanced Features

- ✅ **R5RS Integration**: Direct function calls in automaton files
- ✅ **Dimension References**: Explicit dimensional context
- ✅ **Metadata Directives**: Version and schema tracking
- ✅ **Scheme Expressions**: Inline computation support

### Backward Compatibility

- ✅ **No Breaking Changes**: Existing `.jsonl` files continue to work
- ✅ **Gradual Migration**: Migrate files to CanvasL when needed
- ✅ **Format Coexistence**: Both formats can exist in same system

### Forward Compatibility

- ✅ **Future-Proof**: CanvasL format supports future extensions
- ✅ **R5RS Integration**: Direct integration with R5RS engine
- ✅ **Standardized Format**: RFC 2119 compliant specification

## Related Documentation

- **`docs/04-CanvasL/`**: Complete CanvasL specification
- **`docs/11-Automatons/`**: Automaton system documentation
- **`docs/05-Meta-Log/`**: R5RS integration and Meta-Log system

## See Also

- **`docs/12-Automatons-CanvasL/ADAPTATION-GUIDE.md`**: Step-by-step integration guide
- **`docs/12-Automatons-CanvasL/COMPATIBILITY-MATRIX.md`**: Compatibility requirements
- **`docs/12-Automatons-CanvasL/FILE-FORMAT-DETECTION.md`**: Format detection implementation
- **`docs/12-Automatons-CanvasL/R5RS-INTEGRATION.md`**: R5RS function call support
- **`docs/12-Automatons-CanvasL/MIGRATION-GUIDE.md`**: Migration from JSONL to CanvasL
