# Lezer Grammar Setup Guide

## Overview

This project uses CodeMirror 6 with Lezer grammar support for parsing markdown files with YAML front matter. This guide explains the setup and compatibility.

## Required Packages

Install the following packages for Lezer grammar compatibility:

```bash
cd ui
npm install @codemirror/lang-markdown @codemirror/language @lezer/common @lezer/highlight
```

## Package Versions

The following versions are compatible:

```json
{
  "@codemirror/lang-markdown": "^6.2.0",
  "@codemirror/language": "^6.10.0",
  "@lezer/common": "^1.0.0",
  "@lezer/highlight": "^1.1.0"
}
```

## Architecture

### Grammar Definition

**File**: `ui/src/grammars/front-matter.grammar`

This file defines the Lezer grammar for front matter parsing. The grammar follows Lezer conventions:

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
```

### CodeMirror Extension

**File**: `ui/src/extensions/markdown-frontmatter.ts`

This extension:
- Extends standard markdown language support
- Adds front matter syntax highlighting
- Uses ViewPlugin for efficient updates
- Provides theme customization

### Integration

**File**: `ui/src/components/CodeEditor/CodeEditor.tsx`

```typescript
import { markdownWithFrontMatter } from '../../extensions/markdown-frontmatter';

const languageExtension = fileLanguage === 'markdown' 
  ? markdownWithFrontMatter() 
  : javascript();
```

## Lezer Grammar Compatibility

### Token Definitions

Tokens follow Lezer grammar syntax:

```grammar
@tokens {
  frontMatterDelimiter { "---" }
  yamlKey { [a-zA-Z_][a-zA-Z0-9_-]* }
  yamlValue { [^\n\r]+ }
  yamlString { "\"" [^"]* "\"" | "'" [^']* "'" }
  yamlNumber { [0-9]+ ("." [0-9]+)? }
  yamlBoolean { "true" | "false" }
}
```

### Rule Definitions

Rules follow Lezer grammar conventions:

```grammar
Document {
  FrontMatter? MarkdownContent
}

FrontMatter {
  frontMatterDelimiter newline
  YAMLContent
  frontMatterDelimiter newline
}
```

## CodeMirror 6 Integration

### Extension API

The extension uses CodeMirror 6's Extension API:

```typescript
export function markdownWithFrontMatter(): Extension[] {
  return [
    markdown(),              // Base markdown (uses Lezer internally)
    frontMatterHighlightPlugin,
    EditorView.baseTheme({   // Theme customization
      // ...
    }),
  ];
}
```

### ViewPlugin

Uses ViewPlugin for efficient decoration updates:

```typescript
const frontMatterHighlightPlugin = ViewPlugin.fromClass(
  class {
    decorations: DecorationSet;
    // ...
  }
);
```

## Syntax Highlighting

The extension provides syntax highlighting for:

- **Front Matter Delimiters**: `---` (gray, bold)
- **YAML Keys**: Property names (blue)
- **YAML Values**: Strings, numbers, booleans (light blue)
- **YAML Strings**: Quoted strings (light blue, italic)
- **YAML Booleans**: true/false (blue, bold)
- **YAML Numbers**: Numeric values (blue)

## Testing

### Verify Installation

```bash
cd ui
npm install
npm run type-check
```

### Test Front Matter Parsing

```typescript
import { frontMatterParser } from './utils/front-matter-parser';

const markdown = `---
jsonl: automaton-kernel.jsonl
title: Test
---

# Content`;

const parsed = frontMatterParser.parse(markdown);
console.log(parsed.frontMatter); // { jsonl: 'automaton-kernel.jsonl', title: 'Test' }
```

## References

- [Lezer Grammar Guide](https://lezer.codemirror.net/docs/guide/index.html#writing-a-grammar)
- [CodeMirror 6 Documentation](https://codemirror.net/docs/)
- [Lezer Parser Documentation](https://lezer.codemirror.net/docs/)
- [CodeMirror Language Package](https://github.com/codemirror/lang-markdown)

## Notes

- The grammar file (`front-matter.grammar`) is a reference implementation
- The actual parsing uses CodeMirror's markdown parser with custom highlighting
- For full Lezer grammar compilation, you would need to use `@lezer/generator`
- The current implementation uses ViewPlugin for highlighting, which is compatible with Lezer
