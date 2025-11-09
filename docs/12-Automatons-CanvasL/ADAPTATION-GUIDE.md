---
id: automatons-canvasl-adaptation-guide
title: "CanvasL Adaptation Guide for Automatons"
level: practical
type: guide
tags: [automatons-canvasl, adaptation-guide, implementation-guide, step-by-step]
keywords: [automatons-canvasl, adaptation-guide, implementation-guide, file-format-detection, canvasl-parser, jsonl-parser, backward-compatibility]
prerequisites: [automatons-canvasl-docs-readme, canvasl-rfc2119-spec, advanced-automaton-docs]
enables: []
related: [automatons-canvasl-docs-readme, advanced-automaton-docs, canvasl-rfc2119-spec]
readingTime: 45
difficulty: 4
blackboard:
  status: active
  assignedAgent: "2D-Structural-Agent"
  lastUpdate: null
  dependencies: [canvasl-parser, advanced-automaton-engine]
  watchers: []
---

# CanvasL Adaptation Guide for Automatons

This guide provides step-by-step instructions for adapting the automaton system to support CanvasL format (`.canvasl` extension) while maintaining full backward compatibility with JSONL files.

## Overview

The adaptation involves:
1. Adding format detection logic
2. Implementing CanvasL parser
3. Updating file loading/saving methods
4. Adding R5RS function execution support
5. Updating command-line interface

## Step 1: Format Detection

### 1.1 Add Format Detection Method

Add a method to detect file format by extension:

```typescript
// In advanced-automaton.ts
private detectFormat(filePath: string): 'jsonl' | 'canvasl' {
  if (filePath.endsWith('.canvasl')) {
    return 'canvasl';
  }
  if (filePath.endsWith('.jsonl')) {
    return 'jsonl';
  }
  // Default to jsonl for backward compatibility
  return 'jsonl';
}
```

### 1.2 Store Format Information

Add a property to track the file format:

```typescript
class AdvancedSelfReferencingAutomaton {
  private filePath: string;
  private fileFormat: 'jsonl' | 'canvasl' = 'jsonl';
  private objects: CanvasObject[] = [];
  private directives: Record<string, string> = {}; // For CanvasL
  
  constructor(filePath: string) {
    this.filePath = filePath;
    this.fileFormat = this.detectFormat(filePath);
    this.load();
  }
}
```

## Step 2: CanvasL Parser Implementation

### 2.1 Parse CanvasL Content

Implement CanvasL parser that handles directives and JSONL objects:

```typescript
private parseCanvasL(content: string): {
  directives: Record<string, string>;
  objects: CanvasObject[];
} {
  const directives: Record<string, string> = {};
  const objects: CanvasObject[] = [];
  
  const lines = content.trim().split('\n');
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]!.trim();
    
    // Skip empty lines
    if (!line) continue;
    
    // Parse directives (@directive: value)
    if (line.startsWith('@')) {
      const match = line.match(/^@(\w+):\s*(.+)$/);
      if (match) {
        const [, key, value] = match;
        directives[key] = value.replace(/^["']|["']$/g, ''); // Remove quotes
      }
      continue;
    }
    
    // Parse JSONL objects
    if (line.startsWith('{') && line.endsWith('}')) {
      try {
        const obj = JSON.parse(line);
        if (obj && typeof obj === 'object') {
          objects.push(obj);
        }
      } catch (error) {
        console.warn(`Failed to parse CanvasL line ${i + 1}: ${line}`);
      }
    }
  }
  
  return { directives, objects };
}
```

### 2.2 Parse JSONL Content (Existing)

Keep existing JSONL parser for backward compatibility:

```typescript
private parseJSONL(content: string): CanvasObject[] {
  const objects: CanvasObject[] = [];
  const lines = content.trim().split('\n');
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]!.trim();
    if (line.startsWith('{') && line.endsWith('}')) {
      try {
        const obj = JSON.parse(line);
        if (obj && typeof obj === 'object') {
          objects.push(obj);
        }
      } catch (error) {
        console.warn(`Failed to parse JSONL line ${i + 1}: ${line}`);
      }
    }
  }
  
  return objects;
}
```

## Step 3: Update Load Method

### 3.1 Unified Load Method

Update the `load()` method to handle both formats:

```typescript
private load(): void {
  if (!existsSync(this.filePath)) {
    throw new Error(`Automaton file not found: ${this.filePath}`);
  }

  const content = readFileSync(this.filePath, 'utf-8');
  
  if (this.fileFormat === 'canvasl') {
    const parsed = this.parseCanvasL(content);
    this.directives = parsed.directives;
    this.objects = parsed.objects;
    
    // Process R5RS calls if present
    this.processR5RSCalls();
  } else {
    this.objects = this.parseJSONL(content);
  }
  
  console.log(`Loaded ${this.objects.length} objects from ${this.filePath} (${this.fileFormat})`);
}
```

## Step 4: Update Save Method

### 4.1 Unified Save Method

Update the `save()` method to save in the same format as loaded:

```typescript
private save(): void {
  if (this.fileFormat === 'canvasl') {
    this.saveCanvasL();
  } else {
    this.saveJSONL();
  }
}

private saveJSONL(): void {
  const jsonlContent = this.objects.map(obj => JSON.stringify(obj)).join('\n');
  writeFileSync(this.filePath, jsonlContent + '\n');
  console.log(`Saved ${this.objects.length} objects to ${this.filePath} (JSONL)`);
}

private saveCanvasL(): void {
  const lines: string[] = [];
  
  // Write directives
  if (this.directives.version) {
    lines.push(`@version: "${this.directives.version}"`);
  }
  if (this.directives.schema) {
    lines.push(`@schema: "${this.directives.schema}"`);
  }
  if (this.directives['r5rs-engine']) {
    lines.push(`@r5rs-engine: "${this.directives['r5rs-engine']}"`);
  }
  
  // Add blank line after directives
  if (lines.length > 0) {
    lines.push('');
  }
  
  // Write JSONL objects
  const jsonlContent = this.objects.map(obj => JSON.stringify(obj)).join('\n');
  lines.push(jsonlContent);
  
  writeFileSync(this.filePath, lines.join('\n') + '\n');
  console.log(`Saved ${this.objects.length} objects to ${this.filePath} (CanvasL)`);
}
```

## Step 5: R5RS Function Execution

### 5.1 Process R5RS Calls

Add method to process R5RS function calls in CanvasL files:

```typescript
private processR5RSCalls(): void {
  for (const obj of this.objects) {
    if (obj.type === 'r5rs-call') {
      this.executeR5RSCall(obj);
    }
  }
}

private executeR5RSCall(obj: any): any {
  const functionName = obj.function?.replace('r5rs:', '') || '';
  const args = obj.args || [];
  const expression = obj.expression;
  
  if (!functionName && !expression) {
    console.warn('R5RS call missing function or expression:', obj);
    return null;
  }
  
  // If expression is provided, evaluate it
  if (expression) {
    return this.evaluateSchemeExpression(expression);
  }
  
  // Otherwise, call function with args
  return this.callR5RSFunction(functionName, args);
}

private callR5RSFunction(functionName: string, args: any[]): any {
  // Integration with R5RS engine
  // This would call the actual R5RS function registry
  console.log(`Calling R5RS function: ${functionName} with args:`, args);
  
  // Placeholder: actual implementation would integrate with R5RS engine
  // return this.r5rsRegistry.call(functionName, args);
  return null;
}

private evaluateSchemeExpression(expression: string): any {
  // Integration with Scheme evaluator
  console.log(`Evaluating Scheme expression: ${expression}`);
  
  // Placeholder: actual implementation would evaluate Scheme code
  // return this.schemeEvaluator.evaluate(expression);
  return null;
}
```

## Step 6: Update Command-Line Interface

### 6.1 Update run-automaton.sh

The script already supports `--file` option, which now accepts both formats:

```bash
# JSONL file (backward compatible)
./scripts/run-automaton.sh --file ./automaton.jsonl --ollama

# CanvasL file (forward compatible)
./scripts/run-automaton.sh --file ./automaton.canvasl --ollama
```

### 6.2 Update TypeScript Runners

Both `ollama-automaton.ts` and `continuous-automaton.ts` already accept file path as last argument, so they automatically support both formats:

```typescript
// In ollama-automaton.ts and continuous-automaton.ts
const runner = new OllamaAutomatonRunner(automatonFile, model);
// automatonFile can be either .jsonl or .canvasl
```

## Step 7: Testing

### 7.1 Test Backward Compatibility

```bash
# Test existing JSONL files still work
./scripts/run-automaton.sh --file ./automaton.jsonl --max 1
```

### 7.2 Test Forward Compatibility

```bash
# Test CanvasL files work
./scripts/run-automaton.sh --file ./automaton.canvasl --max 1
```

### 7.3 Test Format Detection

```typescript
// Unit test
const automaton1 = new AdvancedSelfReferencingAutomaton('./test.jsonl');
console.log(automaton1.fileFormat); // Should be 'jsonl'

const automaton2 = new AdvancedSelfReferencingAutomaton('./test.canvasl');
console.log(automaton2.fileFormat); // Should be 'canvasl'
```

## Step 8: Migration Path

### 8.1 Gradual Migration

1. **Phase 1**: Add CanvasL support (this guide)
2. **Phase 2**: Update tools to generate CanvasL files
3. **Phase 3**: Migrate existing files to CanvasL (optional)

### 8.2 Format Conversion

Add utility to convert between formats:

```typescript
function convertJSONLToCanvasL(jsonlPath: string, canvaslPath: string): void {
  const automaton = new AdvancedSelfReferencingAutomaton(jsonlPath);
  automaton.fileFormat = 'canvasl';
  automaton.directives = {
    version: '1.0',
    schema: 'canvasl-v1'
  };
  automaton.filePath = canvaslPath;
  automaton.save();
}
```

## Implementation Checklist

- [ ] Add `detectFormat()` method
- [ ] Add `fileFormat` property
- [ ] Add `directives` property
- [ ] Implement `parseCanvasL()` method
- [ ] Update `load()` method for format detection
- [ ] Implement `saveCanvasL()` method
- [ ] Update `save()` method for format selection
- [ ] Add `processR5RSCalls()` method
- [ ] Add `executeR5RSCall()` method
- [ ] Add `callR5RSFunction()` method
- [ ] Add `evaluateSchemeExpression()` method
- [ ] Test backward compatibility (JSONL files)
- [ ] Test forward compatibility (CanvasL files)
- [ ] Update documentation

## See Also

- **`docs/12-Automatons-CanvasL/README.md`**: Overview documentation
- **`docs/12-Automatons-CanvasL/COMPATIBILITY-MATRIX.md`**: Compatibility requirements
- **`docs/12-Automatons-CanvasL/FILE-FORMAT-DETECTION.md`**: Format detection details
- **`docs/12-Automatons-CanvasL/R5RS-INTEGRATION.md`**: R5RS integration details
- **`docs/12-Automatons-CanvasL/MIGRATION-GUIDE.md`**: Migration guide
