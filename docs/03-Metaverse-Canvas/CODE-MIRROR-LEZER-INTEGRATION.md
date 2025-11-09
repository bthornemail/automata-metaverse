---
id: code-mirror-lezer-integration
title: "CodeMirror Lezer Integration"
level: practical
type: implementation
tags: [codemirror, lezer, integration, implementation]
keywords: [codemirror-6, lezer-grammar, integration, r5rs-canvas-engine, blackboard-architecture, automaton-self-building]
prerequisites: [canvasl-ast-lsp, lezer-grammar-compatibility]
enables: [implementation-final]
related: [r5rs-canvas-engine, blackboard-architecture-guide, grammar-reference]
readingTime: 35
difficulty: 4
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

# CodeMirror Lezer Integration

## Overview

This document describes the CodeMirror 6 integration with Lezer grammar system for parsing and highlighting markdown files with YAML front matter.

## Lezer Grammar Compatibility

### Architecture

CodeMirror 6 uses Lezer internally for parsing. The `@codemirror/lang-markdown` package already includes a Lezer-based markdown parser. Our implementation extends this with front matter highlighting.

```
CodeMirror 6 Editor
    ↓
@codemirror/lang-markdown (Lezer-based parser)
    ↓
markdownWithFrontMatter() extension
    ↓
Front Matter Highlighting (ViewPlugin)
```

### Grammar Reference

**File**: `ui/src/grammars/front-matter.grammar`

This grammar file follows Lezer grammar conventions as documented at:
https://lezer.codemirror.net/docs/guide/index.html#writing-a-grammar

```grammar
@top { Document }

@tokens {
  frontMatterDelimiter { "---" }
  yamlKey { [a-zA-Z_][a-zA-Z0-9_-]* }
  yamlValue { [^\n\r]+ }
  yamlString { "\"" [^"]* "\"" | "'" [^']* "'" }
  yamlNumber { [0-9]+ ("." [0-9]+)? }
  yamlBoolean { "true" | "false" }
  markdownContent { [^] }
}

Document {
  FrontMatter? MarkdownContent
}

FrontMatter {
  frontMatterDelimiter newline
  YAMLContent
  frontMatterDelimiter newline
}
```

## Implementation

### Extension Structure

**File**: `ui/src/extensions/markdown-frontmatter.ts`

```typescript
export function markdownWithFrontMatter(): Extension[] {
  return [
    markdown(),                    // Base markdown (uses Lezer internally)
    frontMatterHighlightPlugin,    // Front matter highlighting
    EditorView.baseTheme({         // Theme customization
      // CSS classes for highlighting
    }),
  ];
}
```

### ViewPlugin Integration

Uses CodeMirror's ViewPlugin API for efficient decoration updates:

```typescript
const frontMatterHighlightPlugin = ViewPlugin.fromClass(
  class {
    decorations: DecorationSet;
    
    buildDecorations(view: EditorView): DecorationSet {
      // Parse front matter and create decorations
      // Uses frontMatterParser for parsing
      // Creates decorations for syntax highlighting
    }
  }
);
```

## CodeMirror 6 Compatibility

### Extension API

✅ **Extension[] return type**: Compatible with CodeMirror 6 extension system
✅ **ViewPlugin**: Uses ViewPlugin for efficient updates
✅ **Decoration API**: Uses Decoration.mark() for syntax highlighting
✅ **Theme API**: Uses EditorView.baseTheme() for styling

### Lezer Integration

✅ **Markdown Parser**: Uses Lezer-based markdown parser from @codemirror/lang-markdown
✅ **Syntax Tree**: Compatible with CodeMirror's syntax tree system
✅ **Incremental Parsing**: Leverages CodeMirror's incremental parsing
✅ **Error Recovery**: Graceful error handling

## Syntax Highlighting

### Front Matter Elements

- **Delimiters** (`---`): Gray, bold
- **YAML Keys**: Blue (#79b8ff), medium weight
- **YAML Values**: Light blue (#9ecbff)
- **YAML Strings**: Light blue, italic
- **YAML Booleans**: Blue, bold
- **YAML Numbers**: Blue

### CSS Classes

```css
.cm-frontMatter-section    /* Entire front matter section */
.cm-frontMatter-key        /* YAML keys */
.cm-frontMatter-value      /* Generic YAML values */
.cm-frontMatter-string     /* String values */
.cm-frontMatter-boolean    /* Boolean values */
.cm-frontMatter-number     /* Numeric values */
.cm-frontMatter-delimiter  /* --- delimiters */
```

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

### In CodeEditor Component

```typescript
const languageExtension = fileLanguage === 'markdown' 
  ? markdownWithFrontMatter() 
  : javascript();
```

## Dependencies

### Required Packages

```json
{
  "@codemirror/lang-markdown": "^6.2.0",
  "@codemirror/language": "^6.10.0",
  "@lezer/common": "^1.0.0",
  "@lezer/highlight": "^1.1.0"
}
```

### Installation

```bash
cd ui
npm install @codemirror/lang-markdown @codemirror/language @lezer/common @lezer/highlight
```

## Performance

### Efficient Updates

- **ViewPlugin**: Only updates decorations when document changes
- **Incremental Parsing**: CodeMirror's markdown parser uses incremental parsing
- **Decoration Caching**: Decorations are cached and only updated when needed

### Optimization

- Front matter parsing only occurs when markdown language is selected
- Decorations are built incrementally
- Syntax tree is reused from CodeMirror's markdown parser

## Testing

### Test Front Matter Highlighting

1. Open Code Editor
2. Switch to Markdown language
3. Add front matter:
   ```markdown
   ---
   jsonl: automaton-kernel.jsonl
   title: Test
   ---
   ```
4. Verify:
   - `---` delimiters are gray and bold
   - `jsonl` and `title` keys are blue
   - Values are light blue

### Test Parsing

```typescript
import { frontMatterParser } from './utils/front-matter-parser';

const markdown = `---
jsonl: automaton-kernel.jsonl
---

# Content`;

const parsed = frontMatterParser.parse(markdown);
// ✅ Should parse correctly
```

## Future Enhancements

1. **Full Lezer Grammar Compilation**: Use @lezer/generator to compile grammar
2. **YAML Grammar**: Complete YAML parsing support
3. **Auto-completion**: YAML key/value auto-completion
4. **Validation**: Real-time front matter validation
5. **Error Reporting**: Better error messages for malformed front matter

## References

- [Lezer Grammar Guide](https://lezer.codemirror.net/docs/guide/index.html#writing-a-grammar)
- [CodeMirror 6 Documentation](https://codemirror.net/docs/)
- [CodeMirror Language Package](https://github.com/codemirror/lang-markdown)
- [Lezer Parser Documentation](https://lezer.codemirror.net/docs/)

## Notes

- The markdown parser from `@codemirror/lang-markdown` already uses Lezer internally
- Our extension adds front matter highlighting on top of the existing parser
- The grammar file (`front-matter.grammar`) is a reference implementation
- For production use, consider compiling the grammar with `@lezer/generator`
