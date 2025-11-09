# Virtual World Metaverse System

A comprehensive virtual world system for the automaton metaverse, featuring terrain, skybox, buildings, paths, enhanced GLTF avatars, lighting, and navigation.

## Overview

The Virtual World system transforms the metaverse from abstract visualizations into an immersive virtual world with:

- **Terrain & Skybox**: Ground plane with textures and 360° environment
- **Enhanced GLTF Avatars**: Animated avatars with name tags and status indicators
- **World Structures**: Buildings, paths, and environmental objects
- **Advanced Lighting**: Directional lighting, shadows, and day/night cycle
- **Atmospheric Effects**: Fog, particles, and post-processing
- **Multiple Camera Modes**: First-person, third-person, and orbital
- **Navigation System**: Waypoints, path following, and teleportation

## Quick Start

```tsx
import { VirtualWorld, VirtualWorldConfig } from '@/components/VirtualWorld';

const config: VirtualWorldConfig = {
  scene: {
    terrain: { size: 200, color: '#4a5568' },
    skybox: { type: 'procedural', stars: true }
  },
  avatars: [
    {
      id: 'avatar-1',
      name: 'Agent',
      position: [0, 0, 0],
      dimension: '0D',
      status: 'online'
    }
  ]
};

<VirtualWorld config={config} />
```

## Components

### Core Components

#### `VirtualWorld`
Main component integrating all subsystems.

**Props:**
- `config?: VirtualWorldConfig` - World configuration
- `onAvatarClick?: (avatar: AvatarConfig) => void` - Avatar click handler
- `onBuildingClick?: (building: BuildingConfig) => void` - Building click handler
- `selectedAvatarId?: string` - Selected avatar ID
- `selectedBuildingId?: string` - Selected building ID

#### `VirtualWorldScene`
Main scene component with terrain, skybox, and layout.

#### `VirtualWorldTerrain`
Ground plane with texture support and optional heightmap.

**Config:**
```typescript
{
  size?: number;           // World size (default: 100)
  texture?: string;        // Ground texture URL
  normalMap?: string;       // Normal map URL
  color?: string;          // Base color
  roughness?: number;     // Material roughness
  metalness?: number;      // Material metalness
}
```

#### `VirtualWorldSkybox`
360° environment with texture or procedural sky.

**Config:**
```typescript
{
  type?: 'texture' | 'procedural';
  textureUrl?: string;     // 360° panorama
  skyColor?: string;       // Sky color
  sunPosition?: [number, number, number];
  stars?: boolean;          // Show stars
  dayNightCycle?: boolean; // Enable cycle
}
```

### Avatar System

#### `EnhancedGLTFAvatar`
Enhanced GLTF avatar with animations, name tags, and status.

**Config:**
```typescript
{
  id: string;
  gltfUrl?: string;        // GLTF model URL
  position: [number, number, number];
  name: string;
  status?: 'online' | 'offline' | 'away';
  animationState?: 'idle' | 'walking' | 'gesturing';
  dimension?: string;      // e.g., "0D"
  color?: string;          // Avatar color theme
}
```

#### `AvatarAnimationController`
Manages GLTF avatar animations (idle, walking, gestures).

#### `AvatarManager`
Manages avatar registry, positions, and zone coordination.

### World Structures

#### `VirtualWorldBuilding`
Modular building system with GLTF models or procedural generation.

**Config:**
```typescript
{
  id: string;
  name: string;
  position: [number, number, number];
  size: [number, number, number]; // width, height, depth
  type: 'agent-building' | 'plaza' | 'workspace';
  gltfModel?: string;      // Optional GLTF model
  color?: string;
}
```

#### `VirtualWorldPaths`
Roads, paths, and walkways connecting zones.

**Config:**
```typescript
{
  id: string;
  from: [number, number, number];
  to: [number, number, number];
  width?: number;
  type: 'road' | 'path' | 'bridge';
}
```

#### `EnvironmentalObjects`
Trees, rocks, plants, and decorative elements.

### Lighting & Atmosphere

#### `WorldLightingSystem`
Advanced lighting with shadows and day/night cycle.

**Config:**
```typescript
{
  type?: 'day' | 'night' | 'cycle';
  sunPosition?: [number, number, number];
  sunIntensity?: number;
  ambientIntensity?: number;
  enableShadows?: boolean;
  shadowMapSize?: number;
}
```

#### `AtmosphericEffects`
Fog, particles, and post-processing effects.

**Config:**
```typescript
{
  fog?: {
    type?: 'linear' | 'exponential';
    color?: string;
    near?: number;
    far?: number;
  };
  particles?: {
    enabled?: boolean;
    count?: number;
    color?: string;
  };
}
```

### Camera & Navigation

#### `VirtualWorldCamera`
Multiple camera modes: first-person, third-person, and orbital.

**Config:**
```typescript
{
  mode?: 'first-person' | 'third-person' | 'orbital';
  target?: [number, number, number];
  distance?: number;
  height?: number;
  fov?: number;
  enableControls?: boolean;
}
```

#### `VirtualWorldNavigation`
Waypoint system, path following, and teleportation.

**Config:**
```typescript
{
  waypoints?: Waypoint[];
  showWaypoints?: boolean;
  enableTeleportation?: boolean;
  pathFollowingSpeed?: number;
}
```

## World Layout

The system uses a zone-based layout system:

- **Central Plaza**: Main gathering area (20x20 units)
- **Foundation Zone (0D-2D)**: Blue/purple theme
- **Operational Zone (3D-4D)**: Orange/yellow theme
- **Advanced Zone (5D-6D)**: Green/cyan theme
- **Quantum Zone (7D)**: Cyan/purple theme

Each zone has:
- Buildings for agent groups
- Paths connecting to the plaza
- Spawn points and landmarks

## Example Usage

See `VirtualWorldExample.tsx` for a complete example with:
- 8 dimensional agent avatars
- 4 agent buildings
- Zone-based layout
- Paths connecting zones
- Lighting and atmosphere

## Integration with Existing Components

The Virtual World can be integrated with existing metaverse components:

```tsx
import { VirtualWorld } from '@/components/VirtualWorld';
import { useAgentAPI } from '@/hooks/useAgentAPI';

// Convert agents to avatars
const avatars = agents.map(agent => ({
  id: agent.id,
  name: agent.name,
  position: [0, 0, 0],
  dimension: agent.dimension,
  status: agent.status,
  gltfUrl: agent.avatarUrl
}));

<VirtualWorld config={{ avatars }} />
```

## Performance Considerations

- **Avatar Limit**: Optimized for 50+ avatars at 60 FPS
- **GLTF Models**: Use compressed GLTF (< 5MB per avatar)
- **Shadows**: Shadow map size affects performance (default: 2048)
- **Particles**: Disable for better performance on low-end devices
- **LOD**: Consider implementing level-of-detail for distant objects

## Future Enhancements

- [ ] Post-processing effects (bloom, tone mapping)
- [ ] Multiplayer synchronization
- [ ] Voice chat integration
- [ ] Avatar customization system
- [ ] Building interiors
- [ ] Interactive objects
- [ ] Mini-map overlay
- [ ] VR support

## Related Documentation

- `docs/09-UI-Integration/GROK_METAVERSE.md` - Grok Metaverse visualization
- `docs/18-Metaverse-Portal-Interface/` - Metaverse portal interface
- `AGENTS.md` - Multi-agent system documentation
