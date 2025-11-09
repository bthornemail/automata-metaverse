---
id: 3d-implementation-phase1-start
title: "3D Implementation Phase 1 - Getting Started"
level: implementation-guide
type: quick-start
tags: [3d, a-frame, three.js, implementation]
keywords: [3d-implementation, phase1, a-frame, three.js, getting-started]
prerequisites: [3d-implementation-plan]
enables: []
related: [3d-implementation-plan]
readingTime: 20
difficulty: 3
blackboard:
  status: ready
  assignedAgent: "Visualization-Agent"
  lastUpdate: 2025-11-09
  dependencies: []
  watchers: []
---

# 3D Implementation Phase 1 - Getting Started

**Last Updated**: 2025-11-09  
**Status**: 🚀 **READY TO START**

## Overview

Phase 1 focuses on setting up a basic 3D scene using A-Frame, creating the foundation for the Metaverse Portal 3D visualization system.

---

## Phase 1 Goals

1. ✅ Set up A-Frame environment
2. ✅ Create basic 3D scene
3. ✅ Add camera controls
4. ✅ Test rendering
5. ✅ Integrate with existing UI

---

## Step 1: Install Dependencies

```bash
cd ui
npm install aframe aframe-extras
```

**Dependencies**:
- `aframe` - Core A-Frame library
- `aframe-extras` - Additional components and utilities

---

## Step 2: Create Basic Scene Component

Create `ui/src/components/MetaversePortal/3DScene.tsx`:

```typescript
import React, { useEffect, useRef } from 'react';
import 'aframe';
import 'aframe-extras';

interface Scene3DProps {
  canvasData?: any[];
  onNodeClick?: (nodeId: string) => void;
}

export const Scene3D: React.FC<Scene3DProps> = ({ canvasData, onNodeClick }) => {
  const sceneRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!sceneRef.current) return;

    // Scene will be initialized by A-Frame
  }, []);

  return (
    <div ref={sceneRef} style={{ width: '100%', height: '100vh' }}>
      <a-scene
        embedded
        vr-mode-ui="enabled: false"
        renderer="antialias: true; colorManagement: true"
      >
        {/* Camera */}
        <a-camera
          id="camera"
          position="0 1.6 5"
          look-controls="enabled: true"
          wasd-controls="enabled: true"
        >
          <a-cursor
            id="cursor"
            animation="property: scale; startEvents: fusing; from: 1 1 1; to: 0.2 0.2 0.2; dur: 150"
            animation__click="property: scale; startEvents: click; from: 0.2 0.2 0.2; to: 1 1 1; dur: 150"
            fuse="true"
            fuse-timeout="2000"
            raycaster="objects: .clickable"
          />
        </a-camera>

        {/* Lighting */}
        <a-light type="ambient" color="#404040" />
        <a-light type="directional" position="1 1 1" intensity="0.5" />

        {/* Ground plane */}
        <a-plane
          rotation="-90 0 0"
          width="100"
          height="100"
          color="#7BC8A4"
          repeat="10 10"
        />

        {/* Render nodes from canvas data */}
        {canvasData?.map((node, index) => (
          <a-box
            key={node.id || index}
            position={`${node.x || 0} ${node.y || 0} 0`}
            class="clickable"
            color="#4CC3D9"
            onClick={() => onNodeClick?.(node.id)}
            animation__hover="property: scale; to: 1.2 1.2 1.2; dur: 300; start: mouseenter"
            animation__hoverback="property: scale; to: 1 1 1; dur: 300; start: mouseleave"
          >
            <a-text
              value={node.text || node.id}
              align="center"
              position="0 1 0"
              scale="2 2 2"
            />
          </a-box>
        ))}

        {/* Sky */}
        <a-sky color="#ECECEC" />
      </a-scene>
    </div>
  );
};
```

---

## Step 3: Integrate with Metaverse Portal

Update `ui/src/components/AIPortal/AIPortal.tsx`:

```typescript
import { Scene3D } from './MetaversePortal/3DScene';

// Add 3D scene toggle
const [show3D, setShow3D] = useState(false);

// Add button to toggle 3D view
<button onClick={() => setShow3D(!show3D)}>
  {show3D ? '2D View' : '3D View'}
</button>

// Render 3D scene when enabled
{show3D && (
  <Scene3D
    canvasData={canvasData}
    onNodeClick={(nodeId) => {
      console.log('Node clicked:', nodeId);
      // Handle node click
    }}
  />
)}
```

---

## Step 4: Add TypeScript Types

Create `ui/src/types/aframe.d.ts`:

```typescript
declare module 'aframe' {
  export const AFrame: any;
  export default AFrame;
}

declare module 'aframe-extras' {
  export const extras: any;
  export default extras;
}

declare namespace JSX {
  interface IntrinsicElements {
    'a-scene': any;
    'a-camera': any;
    'a-box': any;
    'a-sphere': any;
    'a-plane': any;
    'a-light': any;
    'a-sky': any;
    'a-text': any;
    'a-cursor': any;
  }
}
```

---

## Step 5: Test Basic Scene

1. Start the UI server
2. Navigate to Metaverse Portal
3. Click "3D View" button
4. Verify:
   - Scene renders
   - Camera controls work (WASD + mouse)
   - Ground plane visible
   - Basic lighting works

---

## Next Steps (Phase 2)

After Phase 1 is complete:
- Add avatar system
- Implement node/edge rendering
- Add interaction handlers
- Implement dimensional visualization

---

## Troubleshooting

### A-Frame not loading
- Check browser console for errors
- Verify A-Frame scripts are loaded
- Check React component mounting

### Scene not rendering
- Verify scene element has dimensions
- Check camera position
- Verify lighting setup

### Controls not working
- Check A-Frame version compatibility
- Verify cursor component setup
- Check browser compatibility

---

## Related Documentation

- **`docs/18-Metaverse-Portal-Interface/3D_IMPLEMENTATION_PLAN.md`** - Full implementation plan
- **`docs/09-UI-Integration/GROK_METAVERSE.md`** - Grok Metaverse integration

---

**Status**: 🚀 **READY TO START**  
**Estimated Time**: 2-3 days  
**Dependencies**: A-Frame, React, TypeScript
