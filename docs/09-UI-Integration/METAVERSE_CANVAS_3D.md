# Metaverse Canvas 3D Editor

## Overview

The Metaverse Canvas 3D Editor enables 3D visualization and editing of CanvasL/JSONL files directly in the Metaverse Portal. This provides a spatial, immersive editing experience complementing the 2D editing capabilities of the Unified Editor.

## Features

### 3D Rendering
- **Spatial Node Visualization**: Nodes are rendered as 3D spheres (text nodes) or boxes (file nodes)
- **3D Edge Connections**: Edges are rendered as 3D lines connecting nodes
- **Dimension-Based Layout**: Nodes are positioned in 3D space based on their dimensional properties
- **Church Encoding Display**: Lambda expressions are displayed as labels above nodes
- **Interactive Camera**: Orbit controls for exploring the 3D space

### 3D Editing Capabilities
- **Drag Nodes**: Click and drag nodes to reposition them in 3D space
- **Add Nodes**: Create new nodes directly in 3D space
- **Add Edges**: Connect nodes by selecting source and target
- **Edit Nodes**: Modify node properties (text, position, etc.)
- **Delete Nodes**: Remove nodes and their connected edges
- **Real-time Updates**: Changes are immediately reflected in the 3D view

### File Integration
- **CanvasL/JSONL Loading**: Loads CanvasL and JSONL files from the database
- **Bidirectional Sync**: Changes in 3D are synced back to CanvasL files
- **File Selection**: Choose from available CanvasL/JSONL files
- **Auto-save**: Save changes back to the source file

## Architecture

### Components

#### MetaverseCanvas3D
Main component that renders the 3D canvas editor.

**Location**: `ui/src/components/MetaverseCanvas3D/MetaverseCanvas3D.tsx`

**Props**:
```typescript
interface MetaverseCanvas3DProps {
  filename: string;
  onSave?: (canvas3D: Canvas3D) => void;
  readOnly?: boolean;
}
```

#### CanvasL3DService
Service for converting between CanvasL/JSONL and 3D structures.

**Location**: `ui/src/services/canvasl-3d-service.ts`

**Key Methods**:
- `loadCanvasLTo3D(filename)`: Load CanvasL file and convert to 3D
- `convertGraphTo3D(graph)`: Convert 2D graph to 3D structure
- `convert3DToGraph(canvas3D)`: Convert 3D structure back to 2D graph
- `sync3DToCanvasL(canvas3D, filename)`: Save 3D changes back to CanvasL file

### Data Structures

#### Node3D
```typescript
interface Node3D {
  id: string;
  type: string;
  position: [number, number, number];
  rotation?: [number, number, number];
  scale?: [number, number, number];
  color: string;
  radius: number;
  text?: string;
  metadata?: any;
  dimension?: number;
  churchEncoding?: string;
}
```

#### Edge3D
```typescript
interface Edge3D {
  id: string;
  type: 'vertical' | 'horizontal' | 'transition' | 'self-ref';
  from: string;
  to: string;
  fromPosition: [number, number, number];
  toPosition: [number, number, number];
  color: string;
  label?: string;
  metadata?: any;
}
```

#### Canvas3D
```typescript
interface Canvas3D {
  nodes: Map<string, Node3D>;
  edges: Map<string, Edge3D>;
  nodeList: Node3D[];
  edgeList: Edge3D[];
  bounds: {
    min: [number, number, number];
    max: [number, number, number];
    center: [number, number, number];
  };
}
```

## Usage

### In AIPortal

The Metaverse Portal now has two modes:

1. **Abstract Mode**: Original abstract metaverse visualization
2. **CanvasL 3D Mode**: 3D editor for CanvasL files

Switch between modes using the toggle in the header, and select a CanvasL file to edit.

### Standalone Usage

```tsx
import MetaverseCanvas3D from '@/components/MetaverseCanvas3D';

<MetaverseCanvas3D
  filename="automaton-kernel.canvasl"
  onSave={(canvas3D) => {
    console.log('Saved:', canvas3D);
  }}
/>
```

## Conversion Logic

### 2D to 3D Conversion

1. **Position Mapping**: 2D (x, y) → 3D (x/100, z, -y/100)
   - X coordinate scaled and mapped to X axis
   - Y coordinate inverted and mapped to Z axis
   - Z coordinate derived from node dimension

2. **Dimension Stacking**: Nodes are stacked vertically based on their dimension (0D-7D)

3. **Color Mapping**: Node types get assigned colors:
   - Text: `#6366f1`
   - File: `#8b5cf6`
   - Node: `#ec4899`
   - Automaton: `#f43f5e`
   - etc.

4. **Size Mapping**: Node types get assigned radii:
   - Text: 0.5
   - File: 0.6
   - Node: 0.7
   - Automaton: 0.8
   - etc.

### 3D to 2D Conversion

1. **Position Mapping**: 3D (x, z, y) → 2D (x*100, -y*100)
   - X coordinate scaled back
   - Z coordinate becomes Y (inverted)
   - Y coordinate preserved as Z metadata

2. **Metadata Preservation**: All original metadata is preserved

## Integration with Unified Editor

The Unified Editor provides 2D editing capabilities:
- **Code Mode**: Text-based editing of CanvasL files
- **Canvas Mode**: 2D graph visualization and editing
- **Hybrid Mode**: Split view with code and canvas

The Metaverse Canvas 3D Editor complements this with:
- **3D Mode**: Spatial 3D visualization and editing

Both editors sync with the same CanvasL files, allowing users to:
1. Edit in 2D (Unified Editor) → View in 3D (Metaverse Portal)
2. Edit in 3D (Metaverse Portal) → View in 2D (Unified Editor)
3. Use both simultaneously for different perspectives

## Workflow

### Typical Editing Workflow

1. **Load File**: Select a CanvasL file from the dropdown
2. **Explore 3D**: Use orbit controls to navigate the 3D space
3. **Edit Nodes**: 
   - Drag nodes to reposition
   - Click nodes to select
   - Use edit controls to modify properties
4. **Add Connections**: Select source node, click "Add Edge", enter target
5. **Save Changes**: Click "Save" to sync back to CanvasL file
6. **Switch to 2D**: Open Unified Editor to see 2D representation

### Best Practices

- **Use 3D for Spatial Understanding**: Great for understanding relationships and dimensions
- **Use 2D for Detailed Editing**: Better for precise text editing and metadata
- **Save Frequently**: Changes are only persisted when you click "Save"
- **Check Both Views**: Verify changes look correct in both 2D and 3D

## Technical Details

### Rendering Technology
- **React Three Fiber**: React renderer for Three.js
- **@react-three/drei**: Helper components (OrbitControls, Text, etc.)
- **Three.js**: 3D graphics library

### Performance Considerations
- **Efficient Updates**: Only re-renders changed nodes/edges
- **Bounds Calculation**: Automatically centers camera on content
- **Lazy Loading**: Components only load when needed

### Limitations
- **Large Files**: Very large CanvasL files (>1000 nodes) may have performance issues
- **Complex Graphs**: Dense graphs may be hard to navigate in 3D
- **Browser Support**: Requires WebGL support

## Future Enhancements

- [ ] Multi-select and bulk operations
- [ ] 3D edge routing (curved/bezier paths)
- [ ] Node grouping/clustering
- [ ] Animation of changes
- [ ] VR/AR support
- [ ] Collaborative editing
- [ ] Export to 3D formats (GLTF, OBJ)
- [ ] Custom node shapes
- [ ] Physics simulation
- [ ] Search and filter in 3D

## Related Documentation

- [Unified Editor Documentation](./UNIFIED_EDITOR.md)
- [CanvasL Language Specification](../04-CanvasL/CANVASL-RFC2119-SPEC.md)
- [Metaverse Portal Documentation](../components/AdvancedAnimations/README.md)
