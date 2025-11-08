# CanvasL AST & LSP Support

## Overview

CanvasL provides full AST (Abstract Syntax Tree) and LSP (Language Server Protocol) support for enhanced editor features like hover, definition, references, and completion.

## AST Structure

### Node Types

```typescript
interface CanvasLASTNode {
  type: 'node' | 'edge' | 'directive' | 'r5rs-call' | 'reference';
  id?: string;
  line: number;
  column: number;
  length: number;
  children?: CanvasLASTNode[];
  metadata?: {
    dimension?: string;        // 0D-7D
    r5RSFunction?: string;      // r5rs:function-name
    fromNode?: string;          // Edge source
    toNode?: string;            // Edge target
  };
}
```

### AST Generation

```typescript
import { parseCanvasLAST } from './extensions/canvasl-language';

const content = `{"id": "0D-topology", "type": "text"}
{"id": "edge-1", "type": "vertical", "fromNode": "0D-topology", "toNode": "1D-topology"}`;

const ast = parseCanvasLAST(content);
// Returns array of AST nodes
```

## LSP Features

### Hover Information

```typescript
import { canvaslLSPService } from './services/canvasl-lsp-service';

const hover = canvaslLSPService.hover(content, { line: 0, character: 10 });
// Returns: { contents: "**node**: 0D-topology\n\n**Dimension**: 0D", range: {...} }
```

### Definition Finding

```typescript
const definition = canvaslLSPService.definition(content, { line: 5, character: 20 });
// Returns location of node definition
```

### References

```typescript
const references = canvaslLSPService.references(content, { line: 0, character: 10 });
// Returns all locations where this node is referenced
```

### Completion

```typescript
const completions = canvaslLSPService.completion(content, { line: 2, character: 15 });
// Returns: ["0D-topology", "1D-topology", "r5rs:church-zero", ...]
```

### Validation

```typescript
const validation = canvaslLSPService.validate(content);
// Returns: { errors: [{ line: 3, message: "Invalid JSON: ..." }] }
```

## CodeMirror Integration

### Language Detection

The CodeEditor automatically detects `.canvasl` files and applies CanvasL language support:

```typescript
// In CodeEditor.tsx
const languageExtension = fileExtension === '.canvasl' 
  ? canvaslLanguage() 
  : markdownWithFrontMatter();
```

### Syntax Highlighting

CanvasL provides syntax highlighting for:

- **Node IDs**: Blue, bold
- **Node Types**: Purple
- **Edge Types**: Red
- **R5RS Functions**: Light blue, monospace
- **Dimensions**: Orange, bold
- **References**: Blue
- **Directives**: Pink, bold

## AST Usage Examples

### Find Node by ID

```typescript
const ast = parseCanvasLAST(content);
const node = ast.find(n => n.id === "0D-topology");
```

### Get Node at Position

```typescript
const node = getASTNodeAtPosition(ast, 5, 20);
// Returns node at line 5, column 20
```

### Find All References

```typescript
const refs = findReferences(ast, "0D-topology");
// Returns all nodes that reference "0D-topology"
```

### Extract Dimensions

```typescript
const dimensions = ast
  .filter(n => n.metadata?.dimension)
  .map(n => n.metadata!.dimension);
// Returns: ["0D", "1D", "2D", ...]
```

### Extract R5RS Functions

```typescript
const functions = ast
  .filter(n => n.metadata?.r5RSFunction)
  .map(n => n.metadata!.r5RSFunction);
// Returns: ["r5rs:church-zero", "r5rs:church-add", ...]
```

## LSP Service API

### Interface

```typescript
interface CanvasLLSPService {
  parseAST(content: string): CanvasLASTNode[];
  hover(content: string, position: LSPPosition): LSPHover | null;
  definition(content: string, position: LSPPosition): LSPDefinition | null;
  references(content: string, position: LSPPosition): LSPReference[];
  completion(content: string, position: LSPPosition): string[];
  validate(content: string): { errors: Array<{ line: number; message: string }> };
}
```

### Usage

```typescript
import { canvaslLSPService } from './services/canvasl-lsp-service';

// Parse AST
const ast = canvaslLSPService.parseAST(content);

// Get hover info
const hover = canvaslLSPService.hover(content, { line: 0, character: 10 });

// Find definition
const def = canvaslLSPService.definition(content, { line: 5, character: 20 });

// Find references
const refs = canvaslLSPService.references(content, { line: 0, character: 10 });

// Get completions
const completions = canvaslLSPService.completion(content, { line: 2, character: 15 });

// Validate
const validation = canvaslLSPService.validate(content);
```

## Grammar Structure

### Lezer Grammar

**File**: `ui/src/grammars/canvasl.grammar`

```grammar
@top { CanvasL }

CanvasL {
  CanvasLEntry*
}

CanvasLEntry {
  CanvasLDirective? JSONLObject
}
```

### Tokens

- `canvaslDirective`: `@directive`
- `canvaslReference`: `#id`
- `canvaslDimension`: `0D`-`7D`
- `canvaslR5RSFunction`: `r5rs:function-name`
- `canvaslSchemeExpression`: `(scheme code)`

## Future LSP Server

A full LSP server implementation would provide:

1. **Language Server**: Standalone LSP server process
2. **Protocol Support**: Full LSP protocol implementation
3. **Workspace Support**: Multi-file support
4. **Incremental Updates**: Efficient AST updates
5. **Diagnostics**: Real-time error reporting
6. **Code Actions**: Refactoring, formatting, etc.

## Integration with Editors

### VS Code Extension

Future VS Code extension would use:

```json
{
  "contributes": {
    "languages": [{
      "id": "canvasl",
      "extensions": [".canvasl"],
      "aliases": ["CanvasL", "canvasl"]
    }],
    "grammars": [{
      "language": "canvasl",
      "scopeName": "source.canvasl",
      "path": "./syntaxes/canvasl.tmLanguage.json"
    }]
  }
}
```

### CodeMirror 6

Already integrated via `canvaslLanguage()` extension.

## References

- [Language Server Protocol](https://microsoft.github.io/language-server-protocol/)
- [Lezer Grammar Guide](https://lezer.codemirror.net/docs/guide/index.html#writing-a-grammar)
- [CANVASL-LANGUAGE.md](./CANVASL-LANGUAGE.md) - CanvasL language specification
- [JSONL-CANVAS-EDITING.md](./JSONL-CANVAS-EDITING.md) - JSONL canvas editing
