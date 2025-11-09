---
id: metaverse-canvas-portal-integration-guide
title: "Metaverse Canvas Portal - Integration Guide"
level: practical
type: guide
tags: [integration, guide, metaverse, virtual-world]
keywords: [integration, guide, examples, agent-api, metaverse-view]
prerequisites: [metaverse-canvas-portal]
enables: [metaverse-canvas-portal-usage]
related: [metaverse-canvas-portal]
readingTime: 45
difficulty: 4
---

# Metaverse Canvas Portal - Integration Guide

## Overview

This guide covers integrating the Virtual World system with existing automaton components, including the Agent API, Metaverse View, and other systems.

## Integration with Agent API

### Converting Agents to Avatars

```typescript
import { VirtualWorld, AvatarConfig } from '@/components/VirtualWorld';
import { useAgentAPI } from '@/hooks/useAgentAPI';

function AgentVirtualWorld() {
  const { agents, loading } = useAgentAPI();

  // Convert agents to avatars
  const avatars: AvatarConfig[] = agents.map(agent => ({
    id: agent.id,
    name: agent.name,
    position: getAgentPosition(agent.dimension),
    dimension: agent.dimension,
    status: agent.status === 'active' ? 'online' : 'offline',
    animationState: agent.isExecuting ? 'walking' : 'idle',
    gltfUrl: agent.avatarUrl,
    color: getDimensionColor(agent.dimension),
    showNameTag: true,
    showStatusIndicator: true
  }));

  const config = {
    avatars,
    scene: {
      terrain: { size: 200 },
      skybox: { type: 'procedural' }
    }
  };

  return <VirtualWorld config={config} />;
}

// Helper functions
function getAgentPosition(dimension: string): [number, number, number] {
  const positions: Record<string, [number, number, number]> = {
    '0D': [-30, 0, -30],
    '1D': [-25, 0, -30],
    '2D': [-20, 0, -30],
    '3D': [20, 0, -30],
    '4D': [25, 0, -30],
    '5D': [-20, 0, 30],
    '6D': [-25, 0, 30],
    '7D': [30, 0, 30]
  };
  return positions[dimension] || [0, 0, 0];
}

function getDimensionColor(dimension: string): string {
  const colors: Record<string, string> = {
    '0D': '#3b82f6',
    '1D': '#6366f1',
    '2D': '#8b5cf6',
    '3D': '#f59e0b',
    '4D': '#f97316',
    '5D': '#10b981',
    '6D': '#14b8a6',
    '7D': '#8b5cf6'
  };
  return colors[dimension] || '#6366f1';
}
```

### Real-time Agent Updates

```typescript
import { useEffect } from 'react';
import { useAvatarManager } from '@/components/VirtualWorld';
import { useAgentAPI } from '@/hooks/useAgentAPI';

function AgentStatusSync() {
  const { updateAvatar } = useAvatarManager();
  const { agents } = useAgentAPI();

  useEffect(() => {
    agents.forEach(agent => {
      updateAvatar(agent.id, {
        status: agent.status === 'active' ? 'online' : 'offline',
        animationState: agent.isExecuting ? 'walking' : 'idle'
      });
    });
  }, [agents, updateAvatar]);

  return null;
}
```

## Integration with Metaverse View

### Adding Virtual World Mode

```typescript
import { VirtualWorld } from '@/components/VirtualWorld';
import { MetaverseView } from '@/components/AIPortal/components/MetaverseView';

function EnhancedMetaverseView() {
  const [mode, setMode] = useState<'abstract' | 'canvasl-3d' | 'unified' | 'virtual-world'>('unified');

  return (
    <div>
      {mode === 'virtual-world' ? (
        <VirtualWorld config={getVirtualWorldConfig()} />
      ) : (
        <MetaverseView mode={mode} {...otherProps} />
      )}
    </div>
  );
}
```

### Switching Between Modes

```typescript
function ModeSwitcher() {
  const [mode, setMode] = useState('unified');

  return (
    <div className="mode-switcher">
      <button onClick={() => setMode('unified')}>Unified View</button>
      <button onClick={() => setMode('virtual-world')}>Virtual World</button>
      <button onClick={() => setMode('abstract')}>Abstract</button>
    </div>
  );
}
```

## Integration with Canvas Data

### Converting Canvas to Buildings

```typescript
import { BuildingConfig } from '@/components/VirtualWorld';
import { useCanvasData } from '@/hooks/useCanvasData';

function CanvasToBuildings() {
  const { canvasData } = useCanvasData();

  const buildings: BuildingConfig[] = canvasData.nodes
    .filter(node => node.type === 'building')
    .map(node => ({
      id: node.id,
      name: node.name || node.id,
      position: [
        node.position?.x || 0,
        node.position?.y || 0,
        node.position?.z || 0
      ],
      size: [
        node.metadata?.width || 20,
        node.metadata?.height || 15,
        node.metadata?.depth || 20
      ],
      zoneId: node.metadata?.zoneId || 'plaza',
      type: node.metadata?.buildingType || 'workspace',
      gltfModel: node.metadata?.gltfModel,
      color: node.metadata?.color || '#4a5568'
    }));

  return buildings;
}
```

## Integration with Grok Metaverse

### Enhancing GrokMetaverseRenderer

```typescript
import { VirtualWorld } from '@/components/VirtualWorld';
import { GrokMetaverseRenderer } from '@/components/GrokMetaverse/GrokMetaverseRenderer';

function EnhancedGrokMetaverse() {
  const [useVirtualWorld, setUseVirtualWorld] = useState(false);

  if (useVirtualWorld) {
    // Convert Grok metaverse data to VirtualWorld config
    const config = convertGrokToVirtualWorld(grokData);
    return <VirtualWorld config={config} />;
  }

  return <GrokMetaverseRenderer />;
}

function convertGrokToVirtualWorld(grokData: any): VirtualWorldConfig {
  return {
    avatars: grokData.agents.map(agent => ({
      id: agent.id,
      name: agent.name,
      position: agent.position,
      dimension: agent.dimension,
      color: agent.color,
      status: 'online'
    })),
    scene: {
      terrain: { size: 200 },
      skybox: { type: 'procedural' }
    }
  };
}
```

## Integration with Unified Metaverse View

### Adding Virtual World to Unified View

```typescript
import { UnifiedMetaverseView } from '@/components/UnifiedMetaverseView';
import { VirtualWorld } from '@/components/VirtualWorld';

function UnifiedMetaverseWithVirtualWorld() {
  const [majorMode, setMajorMode] = useState('environment');
  const [minorMode, setMinorMode] = useState('3d-gltf');

  if (majorMode === 'environment' && minorMode === 'virtual-world') {
    return <VirtualWorld config={getVirtualWorldConfig()} />;
  }

  return (
    <UnifiedMetaverseView
      initialMajorMode={majorMode}
      initialMinorMode={minorMode}
      onModeChange={(major, minor) => {
        setMajorMode(major);
        setMinorMode(minor);
      }}
    />
  );
}
```

## Integration with WebSocket

### Real-time Avatar Updates

```typescript
import { useEffect } from 'react';
import { useAvatarManager } from '@/components/VirtualWorld';
import { useWebSocket } from '@/hooks/useWebSocket';

function WebSocketAvatarSync() {
  const { addAvatar, updateAvatar, removeAvatar } = useAvatarManager();
  const { socket, connected } = useWebSocket();

  useEffect(() => {
    if (!socket || !connected) return;

    socket.on('avatar:join', (data: AvatarConfig) => {
      addAvatar(data);
    });

    socket.on('avatar:update', (data: { id: string; updates: Partial<AvatarConfig> }) => {
      updateAvatar(data.id, data.updates);
    });

    socket.on('avatar:leave', (data: { id: string }) => {
      removeAvatar(data.id);
    });

    return () => {
      socket.off('avatar:join');
      socket.off('avatar:update');
      socket.off('avatar:leave');
    };
  }, [socket, connected, addAvatar, updateAvatar, removeAvatar]);

  return null;
}
```

## Integration with State Management

### Zustand Store Integration

```typescript
import { create } from 'zustand';
import { VirtualWorldConfig } from '@/components/VirtualWorld';

interface VirtualWorldStore {
  config: VirtualWorldConfig;
  selectedAvatarId: string | null;
  selectedBuildingId: string | null;
  setConfig: (config: VirtualWorldConfig) => void;
  setSelectedAvatar: (id: string | null) => void;
  setSelectedBuilding: (id: string | null) => void;
}

export const useVirtualWorldStore = create<VirtualWorldStore>((set) => ({
  config: getDefaultConfig(),
  selectedAvatarId: null,
  selectedBuildingId: null,
  setConfig: (config) => set({ config }),
  setSelectedAvatar: (id) => set({ selectedAvatarId: id }),
  setSelectedBuilding: (id) => set({ selectedBuildingId: id })
}));

// Usage
function VirtualWorldWithStore() {
  const { config, selectedAvatarId, selectedBuildingId, setSelectedAvatar } = useVirtualWorldStore();

  return (
    <VirtualWorld
      config={config}
      selectedAvatarId={selectedAvatarId}
      selectedBuildingId={selectedBuildingId}
      onAvatarClick={(avatar) => setSelectedAvatar(avatar.id)}
    />
  );
}
```

## Integration with Routing

### Route-based Virtual World

```typescript
import { Routes, Route } from 'react-router-dom';
import { VirtualWorld } from '@/components/VirtualWorld';

function AppRoutes() {
  return (
    <Routes>
      <Route path="/metaverse" element={<MetaverseView />} />
      <Route path="/metaverse/virtual-world" element={<VirtualWorldPage />} />
      <Route path="/metaverse/virtual-world/:zoneId" element={<VirtualWorldZonePage />} />
    </Routes>
  );
}

function VirtualWorldPage() {
  return <VirtualWorld config={getVirtualWorldConfig()} />;
}

function VirtualWorldZonePage() {
  const { zoneId } = useParams();
  const config = getZoneConfig(zoneId);
  return <VirtualWorld config={config} />;
}
```

## Performance Optimization

### Lazy Loading

```typescript
import { lazy, Suspense } from 'react';

const VirtualWorld = lazy(() => import('@/components/VirtualWorld').then(m => ({ default: m.VirtualWorld })));

function LazyVirtualWorld() {
  return (
    <Suspense fallback={<div>Loading virtual world...</div>}>
      <VirtualWorld config={config} />
    </Suspense>
  );
}
```

### Memoization

```typescript
import { useMemo } from 'react';

function OptimizedVirtualWorld({ agents }: { agents: Agent[] }) {
  const avatars = useMemo(() => {
    return agents.map(agent => convertAgentToAvatar(agent));
  }, [agents]);

  const config = useMemo(() => ({
    avatars,
    scene: { terrain: { size: 200 } }
  }), [avatars]);

  return <VirtualWorld config={config} />;
}
```

## Error Handling

### Error Boundaries

```typescript
import { ErrorBoundary } from 'react-error-boundary';

function VirtualWorldWithErrorBoundary() {
  return (
    <ErrorBoundary
      fallback={<div>Error loading virtual world</div>}
      onError={(error) => console.error('Virtual world error:', error)}
    >
      <VirtualWorld config={config} />
    </ErrorBoundary>
  );
}
```

## Testing Integration

### Component Testing

```typescript
import { render, screen } from '@testing-library/react';
import { VirtualWorld } from '@/components/VirtualWorld';

test('renders virtual world', () => {
  const config = getTestConfig();
  render(<VirtualWorld config={config} />);
  // Test assertions
});
```

---

**Last Updated**: 2025-01-07  
**Version**: 1.0.0
