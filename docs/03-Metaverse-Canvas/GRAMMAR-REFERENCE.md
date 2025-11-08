---
id: grammar-reference
title: "Grammar Reference Guide"
level: practical
type: reference
tags: [grammar, reference, lezer, syntax]
keywords: [grammar-reference, lezer-grammar, r5rs-canvas-engine, blackboard-architecture, automaton-self-building, syntax-reference]
prerequisites: [canvasl-language-overview, code-mirror-lezer-integration]
enables: []
related: [r5rs-canvas-engine, blackboard-architecture-guide, canvasl-rfc2119-spec]
readingTime: 40
difficulty: 3
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

# Grammar Reference Guide

## Overview

This document provides a reference for all Lezer grammars used in the Metaverse Canvas system.

## Grammar Files

### 1. JSONL Canvas Grammar

**File**: `ui/src/grammars/jsonl-canvas.grammar`

Base grammar for JSONL canvas format:

```grammar
@top { JSONLCanvas }

JSONLCanvas {
  JSONLEntry*
}

JSONLEntry {
  jsonObjectStart JSONLObject jsonObjectEnd
}

JSONLObject {
  JSONLProperty (jsonComma JSONLProperty)*
}
```

**Tokens**:
- `jsonObjectStart`, `jsonObjectEnd`
- `jsonString`, `jsonNumber`, `jsonBoolean`, `jsonNull`
- `jsonKey`, `jsonValue`
- `jsonColon`, `jsonComma`

### 2. Front Matter Grammar

**File**: `ui/src/grammars/front-matter.grammar`

Grammar for YAML front matter in markdown:

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

**Tokens**:
- `frontMatterDelimiter`: `---`
- `yamlKey`, `yamlValue`
- `yamlString`, `yamlNumber`, `yamlBoolean`
- `yamlArrayStart`, `yamlArrayEnd`

### 3. CanvasL Grammar

**File**: `ui/src/grammars/canvasl.grammar`

Extended grammar for CanvasL format:

```grammar
@top { CanvasL }

CanvasL {
  CanvasLEntry*
}

CanvasLEntry {
  CanvasLDirective? JSONLObject
}
```

**Additional Tokens**:
- `canvaslDirective`: `@directive`
- `canvaslReference`: `#id`
- `canvaslDimension`: `0D`-`7D`
- `canvaslR5RSFunction`: `r5rs:function-name`
- `canvaslSchemeExpression`: `(scheme code)`

## Grammar Structure

### Token Definitions

```grammar
@tokens {
  tokenName { pattern }
}
```

### Rule Definitions

```grammar
RuleName {
  TokenOrRule+
}
```

### Top-Level Rule

```grammar
@top { TopLevelRule }
```

## Lezer Grammar Conventions

### Token Patterns

- **String literals**: `"---"`
- **Character classes**: `[a-zA-Z0-9]`
- **Repetition**: `[^"]*` (zero or more)
- **Alternatives**: `"true" | "false"`

### Rule Patterns

- **Sequence**: `Token1 Token2`
- **Optional**: `Token?`
- **Repetition**: `Token*` (zero or more), `Token+` (one or more)
- **Grouping**: `(Token1 Token2)`

### Skip Patterns

```grammar
@skip {
  whitespace
  comment
}
```

## CodeMirror Integration

### Language Support

```typescript
import { LRLanguage, LanguageSupport } from '@codemirror/language';

// Create language from grammar
const language = LRLanguage.define({
  parser: compiledParser,
  languageData: {
    // ...
  }
});

// Create language support
const languageSupport = new LanguageSupport(language);
```

### Syntax Highlighting

```typescript
import { styleTags, tags as t } from '@lezer/highlight';

const highlighting = styleTags({
  TokenName: t.keyword,
  // ...
});
```

## Grammar Compilation

### Using @lezer/generator

```bash
npm install @lezer/generator
```

```typescript
import { parser } from '@lezer/common';
import { buildParser } from '@lezer/generator';

// Compile grammar
const compiledParser = buildParser(grammarText);
```

## Grammar Examples

### JSONL Entry

```grammar
JSONLEntry {
  jsonObjectStart
  JSONLProperty (jsonComma JSONLProperty)*
  jsonObjectEnd
}
```

### CanvasL Entry with Directive

```grammar
CanvasLEntry {
  CanvasLDirective? JSONLObject
}

CanvasLDirective {
  canvaslDirective jsonColon JSONLValue newline
}
```

### R5RS Function Call

```grammar
CanvasLR5RSCall {
  "function" jsonColon canvaslR5RSFunction jsonComma
  "args" jsonColon JSONLArray jsonComma
  JSONLProperty*
}
```

## Best Practices

### 1. Token Naming

- Use descriptive names: `canvaslDirective` not `dir`
- Prefix language-specific tokens: `canvasl*` for CanvasL
- Use consistent naming: `json*` for JSON tokens

### 2. Rule Organization

- Group related rules together
- Use clear, descriptive rule names
- Document complex rules

### 3. Error Recovery

- Use optional patterns (`?`) for optional elements
- Provide fallback rules
- Handle edge cases gracefully

### 4. Performance

- Avoid deeply nested rules
- Use efficient token patterns
- Compile grammar for production

## Testing Grammars

### Parse Test

```typescript
import { parseCanvasLAST } from './extensions/canvasl-language';

const content = `{"id": "node-1", "type": "text"}`;
const ast = parseCanvasLAST(content);
// Verify AST structure
```

### Validation Test

```typescript
import { canvaslLSPService } from './services/canvasl-lsp-service';

const validation = canvaslLSPService.validate(content);
// Check for errors
```

## References

- [Lezer Grammar Guide](https://lezer.codemirror.net/docs/guide/index.html#writing-a-grammar)
- [Lezer Parser Documentation](https://lezer.codemirror.net/docs/)
- [CodeMirror Language Package](https://github.com/codemirror/lang-markdown)
- [CANVASL-LANGUAGE.md](./CANVASL-LANGUAGE.md) - CanvasL language specification
