# Lezer Grammar Compatibility

## Overview

This document describes the Lezer grammar compatibility implementation for CodeMirror 6, ensuring proper parsing and highlighting of markdown files with YAML front matter.

## Lezer Grammar System

Lezer is CodeMirror's parser system that uses grammar-based parsing. Reference: https://lezer.codemirror.net/docs/guide/index.html#writing-a-grammar

### Architecture

```
Front Matter Grammar (front-matter.grammar)
    ↓
Lezer Parser Generator
    ↓
CodeMirror Extension (markdown-frontmatter.ts)
    ↓
CodeEditor Integration
```

## Implementation

### 1. Grammar Definition

**File**: `ui/src/grammars/front-matter.grammar`

Defines the grammar structure for parsing front matter:

```grammar
@top { Document }

Document {
  FrontMatter? MarkdownContent
}

FrontMatter {
  frontMatterDelimiter newline
  YAMLContent
  frontMatterDelimiter newline
}

YAMLContent {
  YAMLEntry*
}

YAMLEntry {
  yamlKey yamlColon YAMLValue newline
}
```

### 2. CodeMirror Extension

**File**: `ui/src/extensions/markdown-frontmatter.ts`

Provides CodeMirror 6 integration:

- **ViewPlugin**: Real-time syntax highlighting
- **Decoration API**: Visual highlighting of front matter sections
- **Syntax Tree Integration**: Uses CodeMirror's syntax tree for parsing

### 3. Integration

**File**: `ui/src/components/CodeEditor/CodeEditor.tsx`

```typescript
import { markdownWithFrontMatter } from '../../extensions/markdown-frontmatter';

const languageExtension = fileLanguage === 'markdown' 
  ? markdownWithFrontMatter() 
  : javascript();
```

## Features

### Syntax Highlighting

- **Front Matter Delimiters**: `---` highlighted as comments
- **YAML Keys**: Highlighted as property names (blue)
- **YAML Values**: Highlighted as strings (light blue)
- **YAML Arrays**: Proper array syntax highlighting

### Parsing

- **Grammar-based**: Uses Lezer grammar for proper parsing
- **Error Recovery**: Gracefully handles malformed front matter
- **Performance**: Efficient incremental parsing

### Visual Feedback

- **Background Highlighting**: Front matter section has subtle background
- **Key/Value Distinction**: Different colors for keys and values
- **Delimiter Highlighting**: Clear visual separation

## Grammar Structure

### Tokens

```grammar
@tokens {
  frontMatterDelimiter { "---" }
  yamlKey { [a-zA-Z_][a-zA-Z0-9_-]* }
  yamlValue { [^\n\r]+ }
  yamlString { "\"" [^"]* "\"" | "'" [^']* "'" }
  yamlNumber { [0-9]+ ("." [0-9]+)? }
  yamlBoolean { "true" | "false" }
  markdownContent { [^] }
}
```

### Rules

```grammar
Document {
  FrontMatter? MarkdownContent
}

FrontMatter {
  frontMatterDelimiter newline
  YAMLContent
  frontMatterDelimiter newline
}

YAMLContent {
  YAMLEntry*
}
```

## CodeMirror Integration

### Extension API

```typescript
export function markdownWithFrontMatter(): Extension[] {
  return [
    markdown(),                    // Base markdown support
    frontMatterHighlightPlugin,    // Front matter highlighting
    EditorView.baseTheme({         // Theme customization
      '.cm-frontMatter-section': { /* styles */ },
      '.cm-frontMatter-key': { /* styles */ },
      '.cm-frontMatter-value': { /* styles */ },
    }),
  ];
}
```

### ViewPlugin

```typescript
const frontMatterHighlightPlugin = ViewPlugin.fromClass(
  class {
    decorations: DecorationSet;
    
    buildDecorations(view: EditorView): DecorationSet {
      // Parse front matter and create decorations
      // Uses syntax tree for accurate parsing
    }
  }
);
```

## Compatibility

### Lezer Grammar Standards

✅ **Token Definitions**: Proper token syntax
✅ **Rule Definitions**: Grammar rules follow Lezer conventions
✅ **Error Recovery**: Handles parsing errors gracefully
✅ **Incremental Parsing**: Efficient updates on document changes

### CodeMirror 6 Standards

✅ **Extension API**: Uses Extension[] return type
✅ **ViewPlugin**: Proper plugin lifecycle management
✅ **Decoration API**: Efficient decoration updates
✅ **Syntax Tree**: Integrates with CodeMirror's syntax tree

## Usage

### Basic Usage

```typescript
import { markdownWithFrontMatter } from './extensions/markdown-frontmatter';

const extensions = [
  markdownWithFrontMatter(),
  oneDark,
  // ... other extensions
];
```

### Custom Styling

```typescript
EditorView.baseTheme({
  '.cm-frontMatter-section': {
    backgroundColor: 'rgba(100, 100, 100, 0.1)',
  },
  '.cm-frontMatter-key': {
    color: '#79b8ff',
    fontWeight: 'bold',
  },
});
```

## Dependencies

Required packages:

```json
{
  "@codemirror/lang-markdown": "^6.2.0",
  "@codemirror/language": "^6.10.0",
  "@lezer/common": "^1.0.0",
  "@lezer/highlight": "^1.1.0"
}
```

## Testing

### Grammar Parsing Test

```typescript
const markdown = `---
jsonl: automaton-kernel.jsonl
title: Test
---

# Content`;

const parsed = frontMatterParser.parse(markdown);
// ✅ Should parse front matter correctly
```

### Syntax Highlighting Test

```typescript
// Front matter should be highlighted
// YAML keys should be blue
// YAML values should be light blue
// Delimiters should be gray
```

## Performance

- **Incremental Parsing**: Only re-parses changed sections
- **Efficient Decorations**: Minimal decoration updates
- **Syntax Tree Caching**: Leverages CodeMirror's syntax tree cache

## Future Enhancements

1. **Full YAML Grammar**: Complete YAML parsing support
2. **Grammar Compilation**: Pre-compile grammar for better performance
3. **Error Reporting**: Better error messages for malformed front matter
4. **Auto-completion**: YAML key/value auto-completion
5. **Validation**: Real-time front matter validation

## References

- [Lezer Grammar Guide](https://lezer.codemirror.net/docs/guide/index.html#writing-a-grammar)
- [CodeMirror 6 Documentation](https://codemirror.net/docs/)
- [Lezer Parser Documentation](https://lezer.codemirror.net/docs/)
- [CODE-MIRROR-LEZER-INTEGRATION.md](./CODE-MIRROR-LEZER-INTEGRATION.md) - Detailed integration guide
- [LEZER-SETUP.md](../../ui/LEZER-SETUP.md) - Setup instructions
