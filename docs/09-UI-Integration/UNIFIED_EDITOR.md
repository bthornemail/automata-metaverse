---
id: unified-editor
title: "Unified Editor Documentation"
level: practical
type: documentation
tags: [unified-editor, code-editor, canvas-editor, codemirror, lezer]
keywords: [unified-editor, code-editor, canvas-editor, codemirror, lezer, hybrid-editing, file-type-detection]
prerequisites: [ui-integration-readme]
enables: []
related: [ui-integration-rfc2119-spec, grok-metaverse, metaverse-canvas-complete]
readingTime: 45
difficulty: 4
blackboard:
  status: active
  assignedAgent: "Visualization-Agent"
  lastUpdate: 2025-01-07
  dependencies: [codemirror, lezer]
  watchers: []
  r5rsEngine: "r5rs-canvas-engine.scm"
  selfBuilding:
    enabled: true
    source: "r5rs-canvas-engine.scm"
    pattern: "ui-visualization"
---

# Unified Editor Documentation

## Overview

The Unified Editor combines the functionality of both the Code Editor and Canvas Editor into a single, seamless interface. It automatically detects file types and provides appropriate editing modes, with the ability to switch between code, canvas, hybrid, and base views.

## Architecture

### Component Structure

```
UnifiedEditor/
├── UnifiedEditor.tsx          # Main component
├── types.ts                   # TypeScript types
├── components/
│   ├── UnifiedToolbar.tsx     # Toolbar with mode switching
│   ├── CodeEditorPanel.tsx    # Code editor panel
│   ├── CanvasEditorPanel.tsx  # Canvas editor panel
│   ├── HybridView.tsx         # Split view (code + canvas)
│   └── BaseViewPanel.tsx      # Base file viewer
└── utils/
    ├── mode-detector.ts       # File type detection
    ├── data-sync.ts           # Code ↔ Canvas synchronization
    └── export-import.ts       # Format conversion
```

## Features

### Mode Detection

The editor automatically detects the appropriate mode based on file extension:

- **`.jsonl`** → Canvas mode
- **`.canvasl`** → Canvas mode
- **`.base`** → Base mode
- **Other** → Code mode

### Editing Modes

1. **Code Mode**
   - CodeMirror 6 editor with syntax highlighting
   - Supports JavaScript, Markdown, CanvasL, Prolog, Datalog
   - Full REPL integration (from CodeEditor)
   - AI agent assistance
   - WebLLM code generation
   - Query interface (Prolog/Datalog/SPARQL)

2. **Canvas Mode**
   - Visual graph/canvas view
   - Node and edge editing
   - Graph visualization
   - JSONL/CanvasL parsing
   - Search and filter
   - Raw JSONL editing

3. **Hybrid Mode**
   - Split view: Code editor on left, Canvas on right
   - Synchronized editing
   - Real-time updates between views
   - Resizable panels
   - Auto-sync toggle

4. **Base Mode**
   - BasesManager integration
   - Conversion controls
   - Table/metadata views

### Data Synchronization

The editor maintains synchronization between code and canvas representations:

- **Code → Canvas**: Parses JSONL/CanvasL code into graph structure
- **Canvas → Code**: Exports graph structure to JSONL/CanvasL format
- **Validation**: Ensures data consistency between representations
- **Auto-sync**: Optional real-time synchronization in hybrid mode

## Usage

### Basic Usage

```tsx
import UnifiedEditor from '@/components/UnifiedEditor';

<UnifiedEditor
  filename="example.jsonl"
  initialMode="auto"
  height="100%"
  onSave={(content, format) => {
    console.log(`Saved as ${format}:`, content);
  }}
/>
```

### Props

```typescript
interface UnifiedEditorProps {
  filename: string;                    // File to edit
  initialMode?: EditorMode | 'auto';  // Initial mode (default: 'auto')
  onSave?: (content: string, format: 'code' | 'jsonl' | 'canvasl') => void;
  onClose?: () => void;
  height?: string;                     // Height (default: '100%')
  readOnly?: boolean;                  // Read-only mode
  initialContent?: string;             // Initial content
}
```

### Mode Switching

Users can switch between modes using the toolbar:

1. **Code** - Text editor mode
2. **Canvas** - Visual graph mode
3. **Hybrid** - Split view mode
4. **Base** - Base file viewer mode

When switching modes, the editor automatically synchronizes data:
- Code → Canvas: Parses code into graph
- Canvas → Code: Exports graph to code
- Hybrid: Maintains both representations

## Integration

### App.tsx Integration

The Unified Editor replaces the Code Editor in the main app:

```tsx
{activeTab === 'code-editor' && (
  <UnifiedEditor
    filename="editor.code"
    initialMode="auto"
    height="100%"
  />
)}
```

### AIPortal Integration

The Unified Editor replaces JSONLCanvasEditor in AIPortal:

```tsx
<UnifiedEditor
  filename={selectedJSONLFile}
  initialMode="auto"
  height="100%"
  onSave={(content, format) => {
    addEvolutionLog(`Saved canvas: ${selectedJSONLFile} (${format})`);
  }}
/>
```

## Preserved Features

### From CodeEditor

✅ CodeMirror editor with syntax highlighting
✅ Multiple language support (JS, Markdown, CanvasL, Prolog, Datalog)
✅ REPL console integration
✅ Agent chat modal
✅ Front matter parsing
✅ WebLLM integration
✅ Query interface (Prolog/Datalog/SPARQL)
✅ OpenCode integration

### From JSONLCanvasEditor

✅ Visual graph/canvas view
✅ Node/edge editing
✅ Graph visualization
✅ JSONL/CanvasL parsing
✅ Search and filter
✅ Base view integration
✅ Split view modes

### New Unified Features

✅ Mode switching
✅ Data synchronization
✅ Unified save/load
✅ File type detection
✅ Format conversion
✅ Hybrid view with auto-sync

## File Format Support

### JSONL Format

```jsonl
{"id": "node-1", "type": "text", "x": 100, "y": 100, "text": "Hello"}
{"id": "edge-1", "type": "vertical", "from": "node-1", "to": "node-2"}
```

### CanvasL Format

Same as JSONL but with `.canvasl` extension and optional directives:

```canvasl
@version 1.0
@schema canvas
{"id": "node-1", "type": "text", "x": 100, "y": 100, "text": "Hello"}
```

### Base Format

Binary format for efficient storage and querying (handled by BasesManager).

## Migration Guide

### From CodeEditor

Replace:
```tsx
import CodeEditor from './components/CodeEditor/CodeEditor';
<CodeEditor />
```

With:
```tsx
import UnifiedEditor from './components/UnifiedEditor';
<UnifiedEditor filename="file.js" initialMode="code" />
```

### From JSONLCanvasEditor

Replace:
```tsx
import JSONLCanvasEditor from './components/JSONLCanvasEditor/JSONLCanvasEditor';
<JSONLCanvasEditor filename="file.jsonl" />
```

With:
```tsx
import UnifiedEditor from './components/UnifiedEditor';
<UnifiedEditor filename="file.jsonl" initialMode="canvas" />
```

## Performance Considerations

- **Lazy Loading**: Panels are only rendered when their mode is active
- **Debounced Sync**: Data synchronization is debounced to prevent excessive updates
- **Efficient Parsing**: JSONL parsing uses streaming for large files
- **Memoization**: Graph structures are memoized to prevent unnecessary re-renders

## Future Enhancements

- [ ] Undo/redo support
- [ ] Collaborative editing
- [ ] Plugin system for custom modes
- [ ] Advanced search and replace
- [ ] Multi-file editing
- [ ] Version control integration
- [ ] Export to multiple formats (SVG, PNG, PDF)

## Troubleshooting

### Canvas not loading

If canvas mode shows "No canvas data available":
1. Check file format (must be valid JSONL/CanvasL)
2. Verify file exists in database
3. Check browser console for parsing errors

### Sync issues in hybrid mode

If auto-sync isn't working:
1. Toggle auto-sync off and on
2. Check for parsing errors in console
3. Verify JSONL format is valid

### Mode switching issues

If mode switching fails:
1. Ensure file content is valid
2. Check for unsaved changes
3. Verify file type matches expected format

## Related Documentation

- [Code Editor Documentation](../components/CodeEditor/README.md)
- [Canvas Editor Documentation](../components/JSONLCanvasEditor/README.md)
- [Bases Manager Documentation](../components/BasesManager/README.md)
- [CanvasL Language Specification](../04-CanvasL/CANVASL-RFC2119-SPEC.md)
