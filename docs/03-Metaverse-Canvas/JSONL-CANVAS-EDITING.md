---
id: jsonl-canvas-editing
title: "JSONL Canvas Editing & Markdown Front Matter Integration"
level: practical
type: implementation
tags: [jsonl, canvas-editing, markdown, front-matter, implementation]
keywords: [jsonl-canvas-editing, markdown-front-matter, r5rs-canvas-engine, blackboard-architecture, automaton-self-building, canvas-editor]
prerequisites: [metaverse-canvas-docs-readme]
enables: [backward-compatibility, implementation-complete]
related: [r5rs-canvas-engine, blackboard-architecture-guide, metaverse-canvas-complete]
readingTime: 45
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
      context:
        module: "MODULE 2: JSONL Parser & Canvas Loader"
        functions: ["r5rs:parse-jsonl-canvas", "r5rs:extract-facts", "r5rs:update-canvas-node"]
---

# JSONL Canvas Editing & Markdown Front Matter Integration

## Overview

This document describes the implementation of JSONL canvas editing capabilities and markdown front matter integration for the Metaverse Canvas system. This implementation maintains full backward compatibility with the dimensional progression architecture described in `docs/00-Inbox/` while adding powerful editing and relationship management features.

## Backward Compatibility

### ✅ Compatible with 00-Inbox Implementation Ideas

This implementation is fully backward compatible with the foundational concepts from `docs/00-Inbox/`:

1. **JSONL Format** (`02-Claude-JSONL.md`)
   - ✅ One JSON object per line (line-by-line processing)
   - ✅ Stream processing support
   - ✅ Grep/filter friendly structure
   - ✅ Version control friendly (independent lines)

2. **JSON Canvas Structure** (`01-JSON Canvas for the dimensional progression.md`)
   - ✅ Nodes with `id`, `type`, `x`, `y`, `text`, `width`, `height`, `color`
   - ✅ Edges with `id`, `type`, `fromNode`, `toNode`, `fromSide`, `toSide`, `label`
   - ✅ Support for dimensional progression (0D-7D)
   - ✅ Vertical and horizontal edge types
   - ✅ Self-reference patterns

3. **R5RS Datalog/Prolog Interface** (`02-Deepseek- R5RS Datalog-Prolog interface.md`)
   - ✅ R5RS function references in JSONL entries
   - ✅ Pattern matching support
   - ✅ Datalog fact extraction
   - ✅ REPL integration for R5RS functions

4. **Patricia/Radix Trie Structure** (`03-Deepseek-Pascals Triangle Patricia-Radix trie structure.md`)
   - ✅ Hierarchical ID naming convention (`{dimension}-{domain}-{interface}`)
   - ✅ Pascal's triangle branching support
   - ✅ Combinatorial addressing system
   - ✅ O(log n) access patterns

5. **Mathematical Foundations**
   - ✅ Binary Quadratic Forms progression (0D: Q()=0, 1D: Q(x)=x², etc.)
   - ✅ Symbol → Polynomial → R5RS Procedure mapping
   - ✅ Trigonometric transformations (tan, sin, cos)
   - ✅ Computational algebraic geometry support

## Architecture

### Component Structure

```
ui/src/
├── components/
│   ├── JSONLCanvasEditor/          # Visual canvas editor
│   │   └── JSONLCanvasEditor.tsx
│   ├── BipartiteViewer/             # Relationship visualization
│   │   └── BipartiteViewer.tsx
│   ├── AIPortal/                    # AI Portal integration
│   │   └── AIPortal.tsx (modified)
│   └── CodeEditor/                  # Markdown editor
│       └── CodeEditor.tsx (modified)
├── services/
│   ├── jsonl-canvas-service.ts      # JSONL parsing & graph operations
│   ├── markdown-service.ts          # Markdown file management
│   └── bipartite-service.ts         # Relationship tracking
└── utils/
    └── front-matter-parser.ts       # YAML front matter parsing
```

### Data Flow

```
Markdown File (with front matter)
    ↓
Front Matter Parser
    ↓
JSONL References Extraction
    ↓
Database Service → JSONL Files
    ↓
JSONL Canvas Service → Graph Structure
    ↓
REPL Service → R5RS Function Execution
    ↓
Bipartite Service → Relationship Tracking
```

## Features

### 1. JSONL Canvas Editor

**Location**: `ui/src/components/JSONLCanvasEditor/JSONLCanvasEditor.tsx`

**Features**:
- Visual trie/canvas view of JSONL structure
- Node/edge editing interface
- Line-by-line JSONL editing
- Add/edit/delete JSONL entries
- Graph view, raw JSONL view, and split view modes
- Search and filter functionality
- Real-time validation

**Usage**:
```typescript
<JSONLCanvasEditor
  filename="automaton-kernel.jsonl"
  onSave={(content) => console.log('Saved:', content)}
/>
```

**Supported Node Types** (backward compatible):
- `text` - Text nodes with markdown content
- `file` - File reference nodes
- `node` - Generic nodes
- `automaton` - Automaton state nodes
- `shacl` - SHACL validation shapes
- `rfc2119` - RFC 2119 compliance markers
- `asp` - Answer Set Programming rules

**Supported Edge Types** (backward compatible):
- `vertical` - Vertical inheritance (top→bottom)
- `horizontal` - Horizontal implementation (left→right)
- `transition` - State transitions
- `self-ref` - Self-reference patterns

### 2. Markdown Editor with Front Matter

**Location**: `ui/src/components/CodeEditor/CodeEditor.tsx`

**Features**:
- Markdown language support (CodeMirror 6)
- YAML front matter parsing
- JSONL reference detection
- Syntax highlighting for markdown + front matter
- Language switcher (JavaScript/Markdown)

**Front Matter Format**:
```markdown
---
jsonl: automaton-kernel.jsonl
canvas: generate.metaverse.jsonl
title: My Document
description: Document description
tags: [canvas, jsonl, r5rs]
---

# Content

```scheme
(canvas-node "0D-topology")
```
```

### 3. REPL Integration with Front Matter

**Location**: `ui/src/services/scheme-repl-service.ts` (enhanced)

**Features**:
- Automatic front matter parsing
- JSONL file loading from references
- Helper functions in REPL context:
  - `load-jsonl-from-markdown(file)` - Load JSONL file
  - `get-canvas-refs()` - Get all JSONL references
  - `canvas-node(nodeId)` - Query node by ID
  - `update-canvas-node(nodeId, updates)` - Update node

**Example Usage**:
```scheme
;; In markdown code block
(load-jsonl-from-markdown "automaton-kernel.jsonl")
(canvas-node "0D-topology")
(update-canvas-node "0D-topology" '((text . "Updated text")))
```

### 4. Bipartite Relationship Management

**Location**: `ui/src/services/bipartite-service.ts` + `ui/src/components/BipartiteViewer/BipartiteViewer.tsx`

**Features**:
- Track markdown ↔ JSONL relationships
- Maintain reference graph
- Validate bipartite structure
- Visual relationship viewer
- Click-to-navigate between files

## JSONL Format Compatibility

### Standard JSONL Entry Format

```json
{"id": "node-id", "type": "text", "x": 0, "y": 0, "text": "Content", "width": 280, "height": 120, "color": 1}
```

### Edge Format

```json
{"id": "edge-id", "type": "vertical", "fromNode": "node1", "toNode": "node2", "label": "connection"}
```

### Dimensional Progression Support

The implementation fully supports the dimensional progression structure:

```json
{"id": "0D-topology", "type": "text", "text": "# 0D: Quantum Vacuum\n\n**Symbol**: `()`\n**Polynomial**: $0$\n**Procedure**: `(lambda () 'vacuum)`"}
{"id": "1D-topology", "type": "text", "text": "# 1D: Time Dimension\n\n**Symbol**: `Point0D`\n**Polynomial**: $x$\n**Procedure**: `(define (time-evolve state) (tan state))`"}
{"id": "v:0D-topology→1D-topology", "type": "vertical", "fromNode": "0D-topology", "toNode": "1D-topology", "label": "tan(): 0 → x"}
```

### R5RS Function References

Support for R5RS function references in JSONL entries:

```json
{"id": "r5rs-function-ref", "type": "node", "function": "r5rs:church-zero", "args": []}
{"id": "r5rs-computation", "type": "node", "function": "r5rs:attention", "args": ["Q", "K", "V"]}
```

## Patricia Trie Structure Support

### ID Naming Convention

The implementation supports the Patricia/Radix trie naming convention:

```
Layer 0: 0D-topology, 0D-system-r5rs
Layer 1: 1D-topology, 1D-system-r5rs, 1D-topology-r5rs
Layer 2: 2D-topology, 2D-system-r5rs, 2D-topology-r5rs, 2D-system-topology, 2D-topology-system
```

### Pascal's Triangle Branching

The graph structure supports Pascal's triangle combinatorial branching:
- Layer 0: 2 nodes (topology + system)
- Layer 1: 3 nodes (2^1 + 1)
- Layer 2: 5 nodes (2^2 + 1)
- Layer N: 2^N + 1 nodes

## Integration Points

### AI Portal Integration

The Canvas Editor is integrated into the AI Portal as a new tab:

1. Open AI Portal
2. Click "AI Portal - Evolution Engine & Metrics" modal
3. Select "Canvas Editor" tab
4. Choose JSONL file from dropdown
5. Edit nodes/edges visually or in raw JSONL view
6. Save changes

### Code Editor Integration

Markdown support is integrated into the Code Editor:

1. Open Code Editor
2. Switch language to "Markdown"
3. Add front matter with JSONL references
4. JSONL references are automatically detected
5. Code blocks can reference JSONL data via REPL

### REPL Integration

The REPL automatically:
1. Parses front matter when evaluating markdown
2. Loads referenced JSONL files
3. Makes JSONL data available in REPL context
4. Provides helper functions for canvas operations

## API Reference

### JSONL Canvas Service

```typescript
interface JSONLCanvasService {
  parseJSONL(content: string): CanvasGraph;
  buildGraph(entries: any[]): CanvasGraph;
  validateEntry(entry: any): { valid: boolean; errors: string[] };
  mergeEntries(existing: any[], updates: any[]): any[];
  exportToJSONL(graph: CanvasGraph): string;
  findNodeById(graph: CanvasGraph, id: string): JSONLNode | null;
  findEdgesByNode(graph: CanvasGraph, nodeId: string): JSONLEdge[];
  addNode(graph: CanvasGraph, node: JSONLNode): CanvasGraph;
  updateNode(graph: CanvasGraph, nodeId: string, updates: Partial<JSONLNode>): CanvasGraph;
  deleteNode(graph: CanvasGraph, nodeId: string): CanvasGraph;
  addEdge(graph: CanvasGraph, edge: JSONLEdge): CanvasGraph;
  deleteEdge(graph: CanvasGraph, edgeId: string): CanvasGraph;
}
```

### Front Matter Parser

```typescript
interface FrontMatterParser {
  parse(markdown: string): ParsedMarkdown;
  extractJSONLReferences(frontMatter: FrontMatter): string[];
  extractCanvasReferences(frontMatter: FrontMatter): string[];
  validate(frontMatter: FrontMatter): { valid: boolean; errors: string[] };
  stringify(parsed: ParsedMarkdown): string;
}
```

### Bipartite Service

```typescript
interface BipartiteService {
  getRelationships(): Promise<RelationshipGraph>;
  addRelationship(markdownPath: string, jsonlPath: string): Promise<void>;
  removeRelationship(markdownPath: string, jsonlPath: string): Promise<void>;
  getMarkdownFilesForJSONL(jsonlPath: string): Promise<string[]>;
  getJSONLFilesForMarkdown(markdownPath: string): Promise<string[]>;
  validateBipartiteStructure(): Promise<{ valid: boolean; errors: string[] }>;
  updateRelationshipsFromFiles(): Promise<void>;
}
```

## Examples

### Example 1: Creating a Dimensional Progression Canvas

```json
{"id": "0D-topology", "type": "text", "x": 0, "y": 0, "width": 280, "height": 120, "color": 1, "text": "# 0D: Quantum Vacuum\n\n**Symbol**: `()`\n**Polynomial**: $0$\n**Procedure**: `(lambda () 'vacuum)`"}
{"id": "1D-topology", "type": "text", "x": 400, "y": -100, "width": 320, "height": 140, "color": 2, "text": "# 1D: Time Dimension\n\n**Symbol**: `Point0D`\n**Polynomial**: $x$\n**Procedure**: `(define (time-evolve state) (tan state))`"}
{"id": "v:0D→1D", "type": "vertical", "fromNode": "0D-topology", "toNode": "1D-topology", "label": "tan(): 0 → x"}
```

### Example 2: Markdown with JSONL Reference

```markdown
---
jsonl: automaton-kernel.jsonl
title: Dimensional Analysis
---

# Dimensional Progression

```scheme
;; Load the canvas
(load-jsonl-from-markdown "automaton-kernel.jsonl")

;; Query nodes
(canvas-node "0D-topology")
(canvas-node "1D-topology")

;; Get all references
(get-canvas-refs)
```
```

### Example 3: R5RS Function Reference

```json
{"id": "church-zero-node", "type": "node", "function": "r5rs:church-zero", "args": [], "text": "Church encoding: zero"}
{"id": "church-add-node", "type": "node", "function": "r5rs:church-add", "args": [2, 3], "text": "Church addition: 2 + 3"}
```

## Migration Guide

### From JSON Canvas to JSONL

If you have existing JSON Canvas files, convert them to JSONL:

```javascript
// Convert JSON Canvas to JSONL
const canvas = JSON.parse(jsonCanvasString);
const jsonlLines = [
  ...canvas.nodes.map(node => JSON.stringify(node)),
  ...canvas.edges.map(edge => JSON.stringify(edge))
];
const jsonlContent = jsonlLines.join('\n');
```

### Adding Front Matter to Existing Markdown

Add front matter to existing markdown files:

```markdown
---
jsonl: your-canvas.jsonl
---

[existing content]
```

## Testing

### Test JSONL Compatibility

```bash
# Test JSONL parsing
cat automaton-kernel.jsonl | jq -c 'select(.id == "0D-topology")'

# Test line-by-line processing
while IFS= read -r line; do
  echo "$line" | jq '.id'
done < automaton-kernel.jsonl
```

### Test Front Matter Parsing

```typescript
import { frontMatterParser } from './utils/front-matter-parser';

const markdown = `---
jsonl: automaton-kernel.jsonl
---

# Content`;

const parsed = frontMatterParser.parse(markdown);
console.log(parsed.frontMatter.jsonl); // "automaton-kernel.jsonl"
```

## Performance Considerations

- **Large JSONL Files**: The editor supports streaming for large files
- **Graph Rendering**: Uses efficient Map-based structures for O(1) lookups
- **Front Matter Parsing**: Lightweight YAML parser (consider full YAML library for complex cases)
- **Relationship Tracking**: Cached for performance

## Future Enhancements

1. **Enhanced YAML Parser**: Use full YAML library for complex front matter
2. **File System Integration**: Scan and index all markdown files automatically
3. **Advanced Graph Visualization**: Use D3.js or similar for better graph rendering
4. **Real-time Collaboration**: WebSocket support for collaborative editing
5. **Version Control Integration**: Git integration for JSONL files
6. **R5RS Function Registry**: Enhanced function discovery and documentation

## References

- `docs/00-Inbox/01-JSON Canvas for the dimensional progression.md` - Original JSON Canvas design
- `docs/00-Inbox/02-Claude-JSONL.md` - JSONL format specification
- `docs/00-Inbox/02-Deepseek- R5RS Datalog-Prolog interface.md` - R5RS integration
- `docs/00-Inbox/03-Deepseek-Pascals Triangle Patricia-Radix trie structure.md` - Trie structure
- `README-R5RS-ENGINE.md` - R5RS engine documentation
- `AGENTS.md` - Multi-agent system architecture

## License

Part of the Automaton Metaverse Canvas system.
