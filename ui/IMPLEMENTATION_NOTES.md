# JSONL Canvas Editing & Markdown Front Matter Integration - Implementation Notes

## Overview
This implementation adds JSONL canvas editing capabilities to the AI Portal and markdown editing with front matter/JSONL references to the Code Editor, with REPL awareness of these relationships.

## Completed Features

### Phase 1: JSONL Canvas Editor in AI Portal ✅
- **JSONL Canvas Editor Component** (`ui/src/components/JSONLCanvasEditor/JSONLCanvasEditor.tsx`)
  - Visual trie/canvas view of JSONL structure
  - Node/edge editing interface
  - Line-by-line JSONL editing
  - Add/edit/delete JSONL entries
  - Visual representation of canvas trie structure
  - Support for: nodes, edges (vertical/horizontal), graphs, self-ref entries
  - Graph view, raw JSONL view, and split view modes
  - Search and filter functionality

- **JSONL Canvas Service** (`ui/src/services/jsonl-canvas-service.ts`)
  - Parse JSONL into trie structure
  - Build graph representation (nodes, edges)
  - Validate JSONL entries
  - Merge/update JSONL entries
  - Export to JSONL format
  - Graph manipulation operations (add/update/delete nodes and edges)

- **AI Portal Integration**
  - Added "Canvas Editor" tab to AI Portal modal
  - Integrated JSONLCanvasEditor component
  - File selector for automaton-kernel.jsonl, generate.metaverse.jsonl, etc.
  - Save changes back to JSONL files via database-service

### Phase 2: Markdown Editor with Front Matter in Code Editor ✅
- **Markdown Language Support** (`ui/src/components/CodeEditor/CodeEditor.tsx`)
  - Added markdown language support to CodeMirror
  - Support front matter parsing (YAML between `---`)
  - Detect JSONL references in front matter
  - Syntax highlighting for markdown + front matter
  - Language switcher (JavaScript/Markdown)

- **Front Matter Parser** (`ui/src/utils/front-matter-parser.ts`)
  - Parse YAML front matter from markdown
  - Extract JSONL references (e.g., `jsonl: automaton-kernel.jsonl`)
  - Extract canvas references
  - Validate front matter structure
  - Convert parsed markdown back to string format

- **Markdown File Management** (`ui/src/services/markdown-service.ts`)
  - Load markdown files
  - Save markdown files with front matter
  - Link markdown files to JSONL files
  - Track bipartite relationships

### Phase 3: REPL Integration with Front Matter & JSONL ✅
- **Front Matter Awareness in REPL** (`ui/src/components/CodeEditor/CodeEditor.tsx`)
  - Parse front matter when evaluating markdown code blocks
  - Load referenced JSONL files automatically
  - Make JSONL data available in REPL context
  - Helper functions: `load-jsonl-from-markdown`, `get-canvas-refs`, `canvas-node`, `update-canvas-node`
  - Extract and evaluate code blocks from markdown

- **REPL Context Enhancement**
  - Auto-load JSONL files referenced in front matter
  - Expose JSONL entries as Scheme data structures
  - Enable queries like `(canvas-node "0D-topology")`
  - Enable editing: `(update-canvas-node "0D-topology" {...})`

### Phase 4: Bipartite Relationship Management ✅
- **Relationship Tracker** (`ui/src/services/bipartite-service.ts`)
  - Track markdown ↔ JSONL relationships
  - Maintain reference graph
  - Update relationships when files change
  - Validate bipartite structure

- **Visual Relationship View** (`ui/src/components/BipartiteViewer/BipartiteViewer.tsx`)
  - Visual graph showing markdown ↔ JSONL links
  - Click to navigate between related files
  - Show which markdown files reference which JSONL files
  - Validation status display
  - Refresh functionality

## Required Package Installation

**IMPORTANT**: The markdown language support requires the `@codemirror/lang-markdown` package:

```bash
cd ui
npm install @codemirror/lang-markdown
```

## Usage Examples

### Using JSONL Canvas Editor
1. Open AI Portal
2. Click "AI Portal - Evolution Engine & Metrics" modal
3. Select "Canvas Editor" tab
4. Choose a JSONL file from the dropdown
5. Edit nodes/edges visually or in raw JSONL view
6. Click "Save" to persist changes

### Using Markdown Editor with Front Matter
1. Open Code Editor
2. Switch language to "Markdown"
3. Add front matter:
   ```markdown
   ---
   jsonl: automaton-kernel.jsonl
   title: My Document
   ---
   
   # Content
   
   ```scheme
   (canvas-node "0D-topology")
   ```
   ```
4. JSONL references are automatically detected and loaded
5. Code blocks can reference JSONL data via REPL

### Using REPL with Front Matter
When evaluating markdown files with front matter:
- JSONL files are automatically loaded into REPL context
- Use `(load-jsonl-from-markdown "file.jsonl")` to load files
- Use `(canvas-node "node-id")` to query nodes
- Use `(update-canvas-node "node-id" {...})` to update nodes
- Use `(get-canvas-refs)` to get all JSONL references

### Using Bipartite Viewer
1. Open BipartiteViewer component
2. View all markdown ↔ JSONL relationships
3. Click on files to navigate
4. Check validation status
5. Refresh to update relationships

## File Structure

```
ui/src/
├── components/
│   ├── JSONLCanvasEditor/
│   │   └── JSONLCanvasEditor.tsx
│   ├── BipartiteViewer/
│   │   └── BipartiteViewer.tsx
│   ├── AIPortal/
│   │   └── AIPortal.tsx (modified)
│   └── CodeEditor/
│       └── CodeEditor.tsx (modified)
├── services/
│   ├── jsonl-canvas-service.ts
│   ├── markdown-service.ts
│   └── bipartite-service.ts
└── utils/
    └── front-matter-parser.ts
```

## Next Steps

1. **Install Required Package**: Run `npm install @codemirror/lang-markdown` in the `ui` directory
2. **Backend API**: Implement backend endpoints for markdown file operations if needed
3. **File System Integration**: Enhance markdown service to scan and index all markdown files
4. **Enhanced Visualization**: Add more advanced graph visualization features to BipartiteViewer
5. **Validation**: Add more comprehensive validation rules for JSONL entries and relationships

## Notes

- The front matter parser uses a simplified YAML parser. For complex YAML, consider using a proper YAML library.
- The bipartite service currently relies on a list of known markdown files. Consider implementing file system scanning.
- JSONL Canvas Editor uses a simple SVG-based edge rendering. Consider using a proper graph visualization library for better performance with large graphs.
