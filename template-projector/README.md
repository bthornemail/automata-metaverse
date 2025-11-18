# Metaverse Projector

Canvas-based template creation system with affine/projective geometry views

## Overview

Metaverse Projector provides canvas-based template creation using CanvasL/JSONL formats with support for affine and projective geometry views. This package combines voice-controlled template generation with canvas editing capabilities.

## Features

- **Canvas Editing**: JSONL/CanvasL canvas editing with CodeMirror integration
- **Affine/Projective Views**: Geometric visualization of canvas data
- **Voice Control**: Speech recognition and synthesis for template generation
- **MCP/LSP Integration**: Model Context Protocol and Language Server Protocol support
- **Template Generation**: Program template creation using canvas nodes

## Installation

```bash
npm install metaverse-projector
```

## Dependencies

- `meta-log-db`: Core database engine for CanvasL/JSONL operations
- `automaton-evolutions`: Canonical automaton CanvasL data files
- `@codemirror/*`: Code editor components
- `orga`: Org Mode parsing

## Usage

```typescript
import { ProjectiveCanvas } from 'metaverse-projector';
import { AffineView } from 'metaverse-projector/views';

function App() {
  return (
    <ProjectiveCanvas>
      <AffineView />
    </ProjectiveCanvas>
  );
}
```

## Related Packages

- **[meta-log-db](https://www.npmjs.com/package/meta-log-db)** - Core database engine
- **[automaton-evolutions](https://www.npmjs.com/package/automaton-evolutions)** - Canonical CanvasL files
- **[metaverse-portal](https://www.npmjs.com/package/metaverse-portal)** - 3D/AR/VR visualization

## License

MIT License


