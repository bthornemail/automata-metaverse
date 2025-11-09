---
id: automatons-canvasl-file-format-detection
title: "File Format Detection for Automatons"
level: practical
type: guide
tags: [automatons-canvasl, file-format-detection, extension-detection, auto-detection]
keywords: [automatons-canvasl, file-format-detection, extension-detection, auto-detection, jsonl-detection, canvasl-detection]
prerequisites: [automatons-canvasl-docs-readme, adaptation-guide]
enables: []
related: [automatons-canvasl-docs-readme, adaptation-guide, compatibility-matrix]
readingTime: 20
difficulty: 2
blackboard:
  status: active
  assignedAgent: "2D-Structural-Agent"
  lastUpdate: null
  dependencies: [advanced-automaton-engine]
  watchers: []
---

# File Format Detection for Automatons

This document describes how the automaton system detects and handles different file formats (JSONL and CanvasL).

## Detection Strategy

### Extension-Based Detection

The primary detection method is based on file extension:

```typescript
function detectFormat(filePath: string): 'jsonl' | 'canvasl' {
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

### Detection Rules

| File Extension | Detected Format | Parser Used |
|----------------|-----------------|-------------|
| `.canvasl` | `canvasl` | `parseCanvasL()` |
| `.jsonl` | `jsonl` | `parseJSONL()` |
| No extension | `jsonl` (default) | `parseJSONL()` |
| Unknown extension | `jsonl` (default) | `parseJSONL()` |

## Implementation

### Basic Detection

```typescript
class AdvancedSelfReferencingAutomaton {
  private filePath: string;
  private fileFormat: 'jsonl' | 'canvasl';
  
  constructor(filePath: string) {
    this.filePath = filePath;
    this.fileFormat = this.detectFormat(filePath);
    this.load();
  }
  
  private detectFormat(filePath: string): 'jsonl' | 'canvasl' {
    const lowerPath = filePath.toLowerCase();
    
    if (lowerPath.endsWith('.canvasl')) {
      return 'canvasl';
    }
    
    if (lowerPath.endsWith('.jsonl')) {
      return 'jsonl';
    }
    
    // Default to jsonl for backward compatibility
    return 'jsonl';
  }
}
```

### Case-Insensitive Detection

File extension detection is case-insensitive:

```typescript
private detectFormat(filePath: string): 'jsonl' | 'canvasl' {
  const lowerPath = filePath.toLowerCase();
  
  if (lowerPath.endsWith('.canvasl')) {
    return 'canvasl';
  }
  
  if (lowerPath.endsWith('.jsonl')) {
    return 'jsonl';
  }
  
  return 'jsonl';
}
```

### Examples

```typescript
// CanvasL files
detectFormat('./automaton.canvasl')     // → 'canvasl'
detectFormat('./AUTOMATON.CANVASL')     // → 'canvasl'
detectFormat('./test.canvasl')          // → 'canvasl'

// JSONL files
detectFormat('./automaton.jsonl')       // → 'jsonl'
detectFormat('./AUTOMATON.JSONL')       // → 'jsonl'
detectFormat('./test.jsonl')            // → 'jsonl'

// Default (no extension or unknown)
detectFormat('./automaton')             // → 'jsonl'
detectFormat('./automaton.txt')         // → 'jsonl'
```

## Content-Based Detection (Optional)

### Heuristic Detection

As a fallback, content-based detection can be used:

```typescript
private detectFormatByContent(content: string): 'jsonl' | 'canvasl' {
  const lines = content.split('\n');
  
  // Check for CanvasL directives
  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.startsWith('@')) {
      return 'canvasl';
    }
  }
  
  // Default to jsonl
  return 'jsonl';
}
```

### Combined Detection

Combine extension and content detection:

```typescript
private detectFormat(filePath: string, content?: string): 'jsonl' | 'canvasl' {
  // Primary: extension-based
  const extensionFormat = this.detectFormatByExtension(filePath);
  
  // Fallback: content-based (if content provided)
  if (content && extensionFormat === 'jsonl') {
    const contentFormat = this.detectFormatByContent(content);
    // If content suggests CanvasL but extension is jsonl, use content
    if (contentFormat === 'canvasl') {
      console.warn(`File ${filePath} has .jsonl extension but contains CanvasL directives`);
      return 'canvasl';
    }
  }
  
  return extensionFormat;
}
```

## Format-Specific Parsing

### Parser Selection

Based on detected format, select appropriate parser:

```typescript
private load(): void {
  if (!existsSync(this.filePath)) {
    throw new Error(`Automaton file not found: ${this.filePath}`);
  }

  const content = readFileSync(this.filePath, 'utf-8');
  
  // Re-detect format if needed (for content-based detection)
  if (this.fileFormat === 'jsonl') {
    const contentFormat = this.detectFormatByContent(content);
    if (contentFormat === 'canvasl') {
      this.fileFormat = 'canvasl';
    }
  }
  
  // Parse based on format
  if (this.fileFormat === 'canvasl') {
    const parsed = this.parseCanvasL(content);
    this.directives = parsed.directives;
    this.objects = parsed.objects;
  } else {
    this.objects = this.parseJSONL(content);
  }
}
```

## Error Handling

### Invalid Format Detection

Handle cases where format cannot be determined:

```typescript
private detectFormat(filePath: string): 'jsonl' | 'canvasl' {
  const lowerPath = filePath.toLowerCase();
  
  if (lowerPath.endsWith('.canvasl')) {
    return 'canvasl';
  }
  
  if (lowerPath.endsWith('.jsonl')) {
    return 'jsonl';
  }
  
  // Warn about unknown extension
  console.warn(`Unknown file extension for ${filePath}, defaulting to JSONL`);
  return 'jsonl';
}
```

### Format Mismatch Warnings

Warn when content doesn't match extension:

```typescript
private load(): void {
  const content = readFileSync(this.filePath, 'utf-8');
  
  // Check for format mismatch
  if (this.fileFormat === 'jsonl' && content.includes('@version')) {
    console.warn(`File ${this.filePath} has .jsonl extension but contains CanvasL directives`);
  }
  
  if (this.fileFormat === 'canvasl' && !content.includes('@')) {
    console.warn(`File ${this.filePath} has .canvasl extension but contains no CanvasL directives`);
  }
  
  // Continue with detected format
  // ...
}
```

## Command-Line Interface

### File Path Handling

The `--file` option accepts both formats:

```bash
# JSONL file
./scripts/run-automaton.sh --file ./automaton.jsonl

# CanvasL file
./scripts/run-automaton.sh --file ./automaton.canvasl
```

### Format Validation

Validate file format in script:

```bash
# In run-automaton.sh
if [[ ! "$AUTOMATON_FILE" =~ \.(jsonl|canvasl)$ ]]; then
    echo "⚠️  Warning: File does not have .jsonl or .canvasl extension"
    echo "   Defaulting to JSONL format"
fi
```

## Testing

### Test Cases

```typescript
// Test extension detection
assert(detectFormat('./test.jsonl') === 'jsonl');
assert(detectFormat('./test.canvasl') === 'canvasl');
assert(detectFormat('./test') === 'jsonl'); // Default

// Test case-insensitive
assert(detectFormat('./TEST.JSONL') === 'jsonl');
assert(detectFormat('./TEST.CANVASL') === 'canvasl');

// Test content-based detection
assert(detectFormatByContent('@version: "1.0"\n{}') === 'canvasl');
assert(detectFormatByContent('{}') === 'jsonl');
```

## Best Practices

1. **Always use extension-based detection** as primary method
2. **Default to JSONL** for backward compatibility
3. **Warn on format mismatches** but continue processing
4. **Case-insensitive detection** for user convenience
5. **Content-based fallback** only when extension unclear

## See Also

- **`docs/12-Automatons-CanvasL/README.md`**: Overview documentation
- **`docs/12-Automatons-CanvasL/ADAPTATION-GUIDE.md`**: Implementation guide
- **`docs/12-Automatons-CanvasL/COMPATIBILITY-MATRIX.md`**: Compatibility requirements
