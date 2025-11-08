# CanvasL Language Summary

## Overview

CanvasL (`.canvasl` extension) is an extended JSONL canvas format designed for the Metaverse Canvas system. It provides enhanced features for R5RS integration, LSP support, and AST generation while maintaining full backward compatibility with standard JSONL canvas files.

## Key Features

### 1. Extended JSONL Format
- ✅ All standard JSONL canvas features
- ✅ R5RS function references (`r5rs:function-name`)
- ✅ Dimension references (`0D`-`7D`)
- ✅ Node references (`#id`)
- ✅ Directives (`@directive`)
- ✅ Scheme expressions

### 2. Lezer Grammar Support
- ✅ Grammar definition (`ui/src/grammars/canvasl.grammar`)
- ✅ Compatible with Lezer grammar conventions
- ✅ Token and rule definitions
- ✅ Syntax tree generation

### 3. LSP & AST Support
- ✅ AST parsing (`parseCanvasLAST()`)
- ✅ Hover information
- ✅ Definition finding
- ✅ Reference finding
- ✅ Auto-completion
- ✅ Validation

### 4. CodeMirror Integration
- ✅ Syntax highlighting
- ✅ Language support extension
- ✅ Theme customization
- ✅ ViewPlugin integration

## File Structure

```
ui/src/
├── grammars/
│   ├── jsonl-canvas.grammar      # Base JSONL canvas grammar
│   └── canvasl.grammar             # Extended CanvasL grammar
├── extensions/
│   └── canvasl-language.ts        # CodeMirror extension + AST
└── services/
    └── canvasl-lsp-service.ts     # LSP service implementation
```

## Usage

### Creating a CanvasL File

```canvasl
@version: "1.0"
@schema: "canvasl-v1"

{"id": "0D-topology", "type": "text", "dimension": "0D", "text": "# 0D: Quantum Vacuum"}
{"id": "1D-topology", "type": "text", "dimension": "1D", "text": "# 1D: Time Dimension"}
{"id": "v:0D→1D", "type": "vertical", "fromNode": "#0D-topology", "toNode": "#1D-topology", "label": "tan(): 0 → x"}
{"id": "r5rs-add", "type": "r5rs-call", "function": "r5rs:church-add", "args": [2, 3]}
```

### In Code Editor

1. Select "CanvasL (.canvasl)" from language dropdown
2. Syntax highlighting automatically applied
3. LSP features available (hover, definition, references)

### In Canvas Editor

1. Select `.canvasl` file from dropdown
2. Visual editing with CanvasL support
3. R5RS function references highlighted

## Grammar Tokens

### CanvasL-Specific Tokens

- `canvaslDirective`: `@directive` - Metadata directives
- `canvaslReference`: `#id` - Node references
- `canvaslDimension`: `0D`-`7D` - Dimension identifiers
- `canvaslR5RSFunction`: `r5rs:function-name` - R5RS function calls
- `canvaslSchemeExpression`: `(scheme code)` - Scheme expressions

## AST Structure

```typescript
interface CanvasLASTNode {
  type: 'node' | 'edge' | 'directive' | 'r5rs-call' | 'reference';
  id?: string;
  line: number;
  column: number;
  length: number;
  metadata?: {
    dimension?: string;
    r5RSFunction?: string;
    fromNode?: string;
    toNode?: string;
  };
}
```

## LSP Features

### Available Operations

- **Hover**: Show node information
- **Definition**: Jump to definition
- **References**: Find all references
- **Completion**: Auto-complete suggestions
- **Validation**: Error checking

### Example Usage

```typescript
import { canvaslLSPService } from './services/canvasl-lsp-service';

// Hover
const hover = canvaslLSPService.hover(content, { line: 0, character: 10 });

// Definition
const def = canvaslLSPService.definition(content, { line: 5, character: 20 });

// References
const refs = canvaslLSPService.references(content, { line: 0, character: 10 });

// Completion
const completions = canvaslLSPService.completion(content, { line: 2, character: 15 });

// Validation
const validation = canvaslLSPService.validate(content);
```

## Backward Compatibility

✅ **Full backward compatibility** with JSONL canvas format:

- Existing `.jsonl` files work without modification
- Can rename `.jsonl` → `.canvasl` for enhanced features
- All JSONL canvas features supported
- No breaking changes

## Migration

### From JSONL to CanvasL

```bash
# Simple rename
mv automaton-kernel.jsonl automaton-kernel.canvasl

# Or convert with enhancements
# Add directives, R5RS references, etc.
```

### Enhanced Features

CanvasL adds:
- R5RS function references
- Dimension-aware parsing
- Node reference resolution
- Directives for metadata
- LSP/AST support

## Syntax Highlighting

CanvasL provides syntax highlighting for:

- **IDs**: Blue (#79b8ff), bold
- **Types**: Purple (#b392f0)
- **Edge Types**: Red (#f97583)
- **R5RS Functions**: Light blue (#9ecbff), monospace
- **Dimensions**: Orange (#ffab70), bold
- **References**: Blue (#79b8ff)
- **Directives**: Pink (#fdaeb7), bold

## Future Enhancements

1. **Full LSP Server**: Standalone LSP server implementation
2. **Grammar Compilation**: Compile Lezer grammar for performance
3. **Type Checking**: R5RS function call validation
4. **Refactoring**: Rename node IDs across files
5. **Formatting**: Auto-format CanvasL files
6. **Folding**: Code folding for large files
7. **Go to Definition**: Jump to node definitions
8. **Find References**: Find all usages of a node

## References

- [CANVASL-LANGUAGE.md](./CANVASL-LANGUAGE.md) - Complete language specification
- [CANVASL-AST-LSP.md](./CANVASL-AST-LSP.md) - AST and LSP documentation
- [LEZER-GRAMMAR-COMPATIBILITY.md](./LEZER-GRAMMAR-COMPATIBILITY.md) - Lezer grammar guide
- [JSONL-CANVAS-EDITING.md](./JSONL-CANVAS-EDITING.md) - JSONL canvas editing

## Files

### Grammar Files
- `ui/src/grammars/jsonl-canvas.grammar` - Base JSONL grammar
- `ui/src/grammars/canvasl.grammar` - Extended CanvasL grammar

### Implementation Files
- `ui/src/extensions/canvasl-language.ts` - CodeMirror extension + AST
- `ui/src/services/canvasl-lsp-service.ts` - LSP service

### Documentation
- `docs/03-Metaverse-Canvas/CANVASL-LANGUAGE.md` - Language spec
- `docs/03-Metaverse-Canvas/CANVASL-AST-LSP.md` - AST/LSP guide
- `docs/03-Metaverse-Canvas/CANVASL-SUMMARY.md` - This file
