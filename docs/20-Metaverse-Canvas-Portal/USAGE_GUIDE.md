---
id: metaverse-canvas-portal-usage-guide
title: "Metaverse Canvas Portal - Usage Guide"
level: practical
type: guide
tags: [usage, guide, examples, metaverse]
keywords: [usage, guide, examples, best-practices, tutorials]
prerequisites: [metaverse-canvas-portal]
enables: [metaverse-canvas-portal-implementation]
related: [metaverse-canvas-portal]
readingTime: 50
difficulty: 3
---

# Metaverse Canvas Portal - Usage Guide

## Basic Usage

### Minimal Example

```tsx
import { VirtualWorld } from '@/components/VirtualWorld';

function BasicVirtualWorld() {
  return (
    <VirtualWorld
      config={{
        avatars: [
          {
            id: 'avatar-1',
            name: 'Agent',
            position: [0, 0, 0],
            status: 'online'
          }
        ]
      }}
    />
  );
}
```

### Complete Example

```tsx
import { VirtualWorld, VirtualWorldConfig } from '@/components/VirtualWorld';

function CompleteVirtualWorld() {
  const config: VirtualWorldConfig = {
    scene: {
      terrain: {
        size: 200,
        color: '#4a5568',
        roughness: 0.8,
        metalness: 0.1
      },
      skybox: {
        type: 'procedural',
        skyColor: '#87CEEB',
        sunPosition: [0, 1, 0],
        stars: true,
        dayNightCycle: false
      },
      fog: {
        color: '#87CEEB',
        near: 50,
        far: 200
      },
      camera: {
        position: [0, 15, 25],
        fov: 75
      }
    },
    lighting: {
      type: 'day',
      sunPosition: [10, 10, 5],
      sunIntensity: 1,
      ambientIntensity: 0.6,
      enableShadows: true
    },
    atmosphere: {
      fog: {
        type: 'linear',
        color: '#87CEEB',
        near: 50,
        far: 200
      }
    },
    camera: {
      mode: 'orbital',
      target: [0, 0, 0],
      distance: 25,
      enableControls: true
    },
    avatars: [
      {
        id: 'avatar-0d',
        name: '0D Topology Agent',
        position: [-30, 0, -30],
        dimension: '0D',
        status: 'online',
        color: '#3b82f6'
      }
    ],
    buildings: [
      {
        id: 'building-1',
        name: 'Foundation Building',
        position: [-30, 0, -30],
        size: [20, 15, 20],
        zoneId: 'foundation-zone',
        type: 'agent-building',
        color: '#3b82f6'
      }
    ],
    showBuildings: true,
    showPaths: true,
    showEnvironment: false
  };

  return <VirtualWorld config={config} />;
}
```

## Avatar Management

### Adding Avatars

```tsx
import { useAvatarManager } from '@/components/VirtualWorld';

function AvatarManagement() {
  const { addAvatar, updateAvatar, removeAvatar } = useAvatarManager();

  const handleAddAvatar = () => {
    addAvatar({
      id: 'new-avatar',
      name: 'New Agent',
      position: [0, 0, 0],
      status: 'online'
    });
  };

  const handleUpdateAvatar = () => {
    updateAvatar('new-avatar', {
      position: [10, 0, 10],
      status: 'away'
    });
  };

  const handleRemoveAvatar = () => {
    removeAvatar('new-avatar');
  };

  return (
    <div>
      <button onClick={handleAddAvatar}>Add Avatar</button>
      <button onClick={handleUpdateAvatar}>Update Avatar</button>
      <button onClick={handleRemoveAvatar}>Remove Avatar</button>
    </div>
  );
}
```

### Moving Avatars

```tsx
import { useAvatarManager } from '@/components/VirtualWorld';

function AvatarMovement() {
  const { moveAvatar } = useAvatarManager();

  const handleMove = () => {
    moveAvatar('avatar-1', [10, 0, 10]);
  };

  return <button onClick={handleMove}>Move Avatar</button>;
}
```

### Avatar Selection

```tsx
import { useState } from 'react';
import { VirtualWorld } from '@/components/VirtualWorld';

function AvatarSelection() {
  const [selectedAvatarId, setSelectedAvatarId] = useState<string | null>(null);

  return (
    <VirtualWorld
      config={getConfig()}
      selectedAvatarId={selectedAvatarId}
      onAvatarClick={(avatar) => {
        setSelectedAvatarId(avatar.id);
        console.log('Selected:', avatar);
      }}
    />
  );
}
```

## Camera Control

### Camera Modes

```tsx
import { VirtualWorld, CameraConfig } from '@/components/VirtualWorld';

function CameraModes() {
  const [cameraMode, setCameraMode] = useState<'orbital' | 'first-person' | 'third-person'>('orbital');

  const cameraConfig: CameraConfig = {
    mode: cameraMode,
    target: [0, 0, 0],
    distance: 25,
    enableControls: true
  };

  return (
    <div>
      <select value={cameraMode} onChange={(e) => setCameraMode(e.target.value as any)}>
        <option value="orbital">Orbital</option>
        <option value="first-person">First Person</option>
        <option value="third-person">Third Person</option>
      </select>
      <VirtualWorld config={{ camera: cameraConfig }} />
    </div>
  );
}
```

### Camera Presets

```tsx
import { VirtualWorld, CameraPresets } from '@/components/VirtualWorld';

function CameraPresetsExample() {
  return (
    <VirtualWorld
      config={{
        camera: CameraPresets.overview
      }}
    />
  );
}
```

## World Layout

### Custom Zones

```tsx
import { VirtualWorld, WorldLayoutProvider, createDefaultWorldLayout } from '@/components/VirtualWorld';

function CustomLayout() {
  const customLayout = {
    ...createDefaultWorldLayout(),
    zones: [
      ...createDefaultWorldLayout().zones,
      {
        id: 'custom-zone',
        name: 'Custom Zone',
        bounds: {
          min: [-10, 0, -10],
          max: [10, 10, 10]
        },
        theme: 'workspace',
        avatars: [],
        color: '#6366f1'
      }
    ]
  };

  return (
    <WorldLayoutProvider initialLayout={customLayout}>
      <VirtualWorld config={getConfig()} />
    </WorldLayoutProvider>
  );
}
```

### Zone Queries

```tsx
import { useWorldLayout } from '@/components/VirtualWorld';

function ZoneQueries() {
  const { getZone, getZoneForPosition, layout } = useWorldLayout();

  const zone = getZone('plaza');
  const zoneAtPosition = getZoneForPosition([0, 0, 0]);
  const allZones = layout.zones;

  return (
    <div>
      <p>Plaza Zone: {zone?.name}</p>
      <p>Zone at [0,0,0]: {zoneAtPosition?.name}</p>
      <p>Total Zones: {allZones.length}</p>
    </div>
  );
}
```

## Lighting & Atmosphere

### Day/Night Cycle

```tsx
import { VirtualWorld } from '@/components/VirtualWorld';

function DayNightCycle() {
  return (
    <VirtualWorld
      config={{
        scene: {
          skybox: {
            type: 'procedural',
            dayNightCycle: true,
            timeOfDay: 0.5 // 0 = midnight, 0.5 = noon, 1 = midnight
          }
        },
        lighting: {
          type: 'cycle',
          cycleSpeed: 1 // Speed multiplier
        }
      }}
    />
  );
}
```

### Custom Lighting

```tsx
import { VirtualWorld } from '@/components/VirtualWorld';

function CustomLighting() {
  return (
    <VirtualWorld
      config={{
        lighting: {
          type: 'night',
          sunIntensity: 0.1,
          ambientIntensity: 0.3,
          enableShadows: true,
          shadowMapSize: 4096
        }
      }}
    />
  );
}
```

### Atmospheric Effects

```tsx
import { VirtualWorld } from '@/components/VirtualWorld';

function AtmosphericEffects() {
  return (
    <VirtualWorld
      config={{
        atmosphere: {
          fog: {
            type: 'exponential',
            color: '#87CEEB',
            density: 0.01
          },
          particles: {
            enabled: true,
            count: 1000,
            color: '#ffffff',
            size: 0.02
          }
        }
      }}
    />
  );
}
```

## Navigation

### Waypoints

```tsx
import { VirtualWorld } from '@/components/VirtualWorld';

function Waypoints() {
  return (
    <VirtualWorld
      config={{
        navigation: {
          waypoints: [
            {
              id: 'waypoint-1',
              name: 'Spawn Point',
              position: [0, 0, 0],
              type: 'spawn'
            },
            {
              id: 'waypoint-2',
              name: 'Portal',
              position: [10, 0, 10],
              type: 'portal'
            }
          ],
          showWaypoints: true,
          enableTeleportation: true
        }
      }}
    />
  );
}
```

### Path Following

```tsx
import { usePathFollowing } from '@/components/VirtualWorld';

function PathFollowing() {
  const { currentPosition, isMoving, startFollowing } = usePathFollowing(
    [0, 0, 0],
    [10, 0, 10],
    5 // speed
  );

  return (
    <div>
      <button onClick={startFollowing}>Follow Path</button>
      <p>Moving: {isMoving ? 'Yes' : 'No'}</p>
      <p>Position: {currentPosition.join(', ')}</p>
    </div>
  );
}
```

## GLTF Models

### Loading GLTF Avatars

```tsx
import { VirtualWorld } from '@/components/VirtualWorld';

function GLTFAvatars() {
  return (
    <VirtualWorld
      config={{
        avatars: [
          {
            id: 'avatar-1',
            name: 'Agent',
            position: [0, 0, 0],
            gltfUrl: '/models/avatar.gltf',
            status: 'online',
            animationState: 'idle'
          }
        ]
      }}
    />
  );
}
```

### GLTF Buildings

```tsx
import { VirtualWorld } from '@/components/VirtualWorld';

function GLTFBuildings() {
  return (
    <VirtualWorld
      config={{
        buildings: [
          {
            id: 'building-1',
            name: 'Custom Building',
            position: [0, 0, 0],
            size: [20, 15, 20],
            zoneId: 'plaza',
            type: 'agent-building',
            gltfModel: '/models/building.gltf'
          }
        ]
      }}
    />
  );
}
```

## Best Practices

### Performance

1. **Limit Avatar Count**: Keep avatars under 50 for optimal performance
2. **Optimize GLTF Models**: Use compressed GLTF (< 5MB per model)
3. **Disable Unused Features**: Turn off particles/fog if not needed
4. **Use Memoization**: Memoize expensive computations
5. **Lazy Loading**: Lazy load the VirtualWorld component

### Configuration

1. **Start Simple**: Begin with minimal config and add features gradually
2. **Use Defaults**: Leverage default values where possible
3. **Type Safety**: Use TypeScript types for configuration
4. **Error Handling**: Handle GLTF loading errors gracefully

### Avatar Management

1. **Batch Updates**: Batch multiple avatar updates
2. **Zone Awareness**: Use zones for organization
3. **Status Sync**: Keep avatar status in sync with backend
4. **Cleanup**: Remove avatars when no longer needed

### Camera Control

1. **Smooth Transitions**: Enable smooth transitions for better UX
2. **Presets**: Use camera presets for common views
3. **User Control**: Allow users to switch camera modes
4. **Follow Avatars**: Use third-person mode to follow avatars

## Common Patterns

### Avatar List Component

```tsx
function AvatarList() {
  const { avatars } = useAvatarManager();

  return (
    <div>
      {Array.from(avatars.values()).map(avatar => (
        <div key={avatar.config.id}>
          <p>{avatar.config.name}</p>
          <p>Status: {avatar.config.status}</p>
          <p>Zone: {avatar.currentZone}</p>
        </div>
      ))}
    </div>
  );
}
```

### Zone Visualization

```tsx
function ZoneVisualization() {
  const { layout } = useWorldLayout();

  return (
    <div>
      {layout.zones.map(zone => (
        <div key={zone.id}>
          <h3>{zone.name}</h3>
          <p>Avatars: {zone.avatars.length}</p>
          <p>Theme: {zone.theme}</p>
        </div>
      ))}
    </div>
  );
}
```

---

**Last Updated**: 2025-01-07  
**Version**: 1.0.0
