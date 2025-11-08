# Unified Metaverse View

## Overview

The Unified Metaverse View merges all environment types (abstract metaverse, 2D canvas, code/media interface, and 3D GLTF avatars) into a single unified interface with a major/minor mode system for environment and symbol selection.

## Major/Minor Mode System

### Major Modes

1. **Environment Mode** (`environment`)
   - Focuses on switching between different environment types
   - Minor modes are environment types: `abstract`, `canvas-2d`, `code-media`, `3d-gltf`

2. **Symbol Mode** (`symbol`)
   - Focuses on selecting and working with specific symbols
   - Minor modes are symbol IDs
   - Automatically switches to the symbol's environment when selected

### Minor Modes

**Environment Types:**
- `abstract`: Abstract metaverse visualization
- `canvas-2d`: 2D canvas editor (UnifiedEditor in canvas mode)
- `code-media`: Code/media editor (UnifiedEditor in code mode)
- `3d-gltf`: 3D GLTF avatar viewer

**Symbol IDs:**
- Any symbol ID from loaded CanvasL files or avatars
- When a symbol is selected, minor mode becomes the symbol ID

## Architecture

### Components

```
UnifiedMetaverseView/
├── UnifiedMetaverseView.tsx    # Main component
├── types.ts                    # Type definitions
├── components/
│   ├── ModeSwitcher.tsx        # Mode switching UI
│   ├── EnvironmentRenderer.tsx # Environment renderer
│   └── GLTFAvatarRenderer.tsx  # GLTF avatar renderer
└── utils/
    └── mode-manager.ts          # Mode management logic
```

### Mode Manager

The `ModeManager` class handles:
- Major/minor mode transitions
- Symbol selection
- Mode change notifications
- State synchronization

**Key Methods:**
- `setMajorMode(major, minor?)`: Set major mode
- `setMinorMode(minor)`: Set minor mode (auto-detects major)
- `selectSymbol(symbol)`: Select symbol (switches to symbol mode)
- `subscribe(listener)`: Subscribe to mode changes

## Environments

### Abstract Environment
- Original abstract metaverse visualization
- WebGLMetaverseEvolution component
- Dimensional progression visualization

### Canvas 2D Environment
- UnifiedEditor in canvas mode
- Visual graph editing
- JSONL/CanvasL file editing

### Code/Media Environment
- UnifiedEditor in code mode
- Text-based editing
- Code syntax highlighting
- Media file support

### 3D GLTF Environment
- GLTF avatar renderer
- 3D avatar visualization
- Avatar selection and interaction
- Fallback to default avatars if GLTF unavailable

## Symbols

### Symbol Types

1. **Node Symbols** (`node`)
   - Canvas nodes from CanvasL files
   - Position, dimension, Church encoding

2. **Edge Symbols** (`edge`)
   - Canvas edges from CanvasL files
   - Connections between nodes

3. **Avatar Symbols** (`avatar`)
   - 3D GLTF avatars
   - Position in 3D space
   - GLTF model paths

4. **Code Symbols** (`code`)
   - Code snippets or files
   - Code content

5. **Media Symbols** (`media`)
   - Media files
   - Media URLs

### Symbol Loading

Symbols are automatically loaded from:
- CanvasL files (nodes and edges)
- JSONL files (nodes and edges)
- Default avatars (for 3D GLTF mode)

## Usage

### Basic Usage

```tsx
import UnifiedMetaverseView from '@/components/UnifiedMetaverseView';

<UnifiedMetaverseView
  initialMajorMode="environment"
  initialMinorMode="abstract"
  onModeChange={(major, minor) => {
    console.log(`Mode: ${major}/${minor}`);
  }}
  onSymbolSelect={(symbol) => {
    console.log('Selected:', symbol);
  }}
/>
```

### Mode Switching

1. **Switch Major Mode**: Click "Environment" or "Symbol" button
2. **Switch Minor Mode**: 
   - In Environment mode: Select environment from dropdown
   - In Symbol mode: Select symbol from dropdown
3. **Select Symbol**: Clicking a symbol automatically switches to Symbol mode

### Integration in AIPortal

The Unified Metaverse View is integrated into AIPortal with three modes:
- **Unified**: Full unified view with major/minor modes (default)
- **Abstract**: Abstract metaverse only
- **CanvasL 3D**: 3D canvas editor only

## Workflow Examples

### Example 1: Explore Abstract Metaverse
1. Set major mode to `environment`
2. Set minor mode to `abstract`
3. View abstract metaverse visualization

### Example 2: Edit Canvas in 2D
1. Set major mode to `environment`
2. Set minor mode to `canvas-2d`
3. Edit CanvasL file in 2D

### Example 3: Select and Edit Symbol
1. Set major mode to `symbol`
2. Select symbol from dropdown (or click in view)
3. View switches to symbol's environment
4. Edit symbol properties

### Example 4: View 3D Avatars
1. Set major mode to `environment`
2. Set minor mode to `3d-gltf`
3. View and interact with 3D avatars

## GLTF Avatar Support

### Adding GLTF Models

1. Place GLTF files in `public/models/` directory
2. Reference in symbol metadata:
```typescript
{
  id: 'avatar-0d',
  metadata: {
    gltfModel: '/models/avatar-0d.gltf'
  }
}
```

### Default Avatars

If GLTF model fails to load, falls back to default avatar representation:
- Box body with sphere head
- Color-coded by selection state
- Name label above

## State Management

### Unified View State

```typescript
interface UnifiedViewState {
  majorMode: MajorMode;
  minorMode: MinorMode;
  selectedSymbol: Symbol | null;
  selectedSymbols: Set<string>;
  activeEnvironments: Set<EnvironmentType>;
  environmentConfigs: Map<EnvironmentType, any>;
  viewportLayout: 'single' | 'split-horizontal' | 'split-vertical' | 'grid';
}
```

### Mode Transitions

- **Environment → Symbol**: Selecting a symbol switches to symbol mode
- **Symbol → Environment**: Deselecting switches back to environment mode
- **Minor Mode Changes**: Auto-detects major mode based on minor mode type

## Future Enhancements

- [ ] Multi-environment split view
- [ ] Symbol cross-referencing
- [ ] Symbol search and filter
- [ ] Custom symbol types
- [ ] Symbol grouping
- [ ] Animation between mode transitions
- [ ] Symbol history/undo
- [ ] Collaborative symbol editing
- [ ] Symbol templates
- [ ] Export symbols to different formats

## Related Documentation

- [Unified Editor](./UNIFIED_EDITOR.md)
- [Metaverse Canvas 3D](./METAVERSE_CANVAS_3D.md)
- [CanvasL Language Specification](../04-CanvasL/CANVASL-RFC2119-SPEC.md)
