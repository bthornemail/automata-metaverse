---
id: metaverse-canvas-portal-api-reference
title: "Metaverse Canvas Portal - API Reference"
level: practical
type: api-reference
tags: [api, reference, metaverse, virtual-world]
keywords: [api, reference, typescript, components, props, interfaces]
prerequisites: [metaverse-canvas-portal]
enables: [metaverse-canvas-portal-integration]
related: [metaverse-canvas-portal]
readingTime: 60
difficulty: 3
---

# Metaverse Canvas Portal - API Reference

## Core Components

### VirtualWorld

Main component integrating all virtual world subsystems.

```typescript
interface VirtualWorldProps {
  config?: VirtualWorldConfig;
  onAvatarClick?: (avatar: AvatarConfig) => void;
  onBuildingClick?: (building: BuildingConfig) => void;
  selectedAvatarId?: string;
  selectedBuildingId?: string;
}

<VirtualWorld {...props} />
```

**Props:**

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `config` | `VirtualWorldConfig` | No | World configuration object |
| `onAvatarClick` | `(avatar: AvatarConfig) => void` | No | Avatar click handler |
| `onBuildingClick` | `(building: BuildingConfig) => void` | No | Building click handler |
| `selectedAvatarId` | `string` | No | Selected avatar ID |
| `selectedBuildingId` | `string` | No | Selected building ID |

### VirtualWorldConfig

Complete configuration object for the virtual world.

```typescript
interface VirtualWorldConfig {
  scene?: VirtualWorldSceneConfig;
  lighting?: LightingConfig;
  atmosphere?: AtmosphericEffectsConfig;
  camera?: CameraConfig;
  navigation?: NavigationConfig;
  avatars?: AvatarConfig[];
  buildings?: BuildingConfig[];
  environmentalObjects?: EnvironmentalObject[];
  showBuildings?: boolean;
  showPaths?: boolean;
  showEnvironment?: boolean;
}
```

## Scene Components

### VirtualWorldScene

Main scene component with terrain and skybox.

```typescript
interface VirtualWorldSceneConfig {
  terrain?: TerrainConfig;
  skybox?: SkyboxConfig;
  fog?: {
    color?: string;
    near?: number;
    far?: number;
  };
  camera?: {
    position?: [number, number, number];
    fov?: number;
  };
  enableControls?: boolean;
}
```

### VirtualWorldTerrain

Terrain configuration.

```typescript
interface TerrainConfig {
  size?: number;              // World size (default: 100)
  texture?: string;           // Ground texture URL
  normalMap?: string;         // Normal map URL
  heightmap?: string;         // Heightmap texture (optional)
  subdivisions?: number;     // Terrain detail (default: 100)
  color?: string;             // Base color (default: '#4a5568')
  roughness?: number;         // Material roughness (default: 0.8)
  metalness?: number;         // Material metalness (default: 0.1)
  repeat?: number;            // Texture repeat (default: 10)
}
```

### VirtualWorldSkybox

Skybox configuration.

```typescript
interface SkyboxConfig {
  type?: 'texture' | 'procedural';  // Sky type (default: 'procedural')
  textureUrl?: string;              // 360° panorama texture URL
  skyColor?: string;                 // Sky color (default: '#87CEEB')
  sunPosition?: [number, number, number];  // Sun position
  cloudDensity?: number;            // Cloud density 0-1 (default: 0.5)
  stars?: boolean;                   // Show stars (default: true)
  dayNightCycle?: boolean;           // Enable day/night cycle
  timeOfDay?: number;                // Time of day 0-1 (0=midnight, 0.5=noon)
}
```

## Avatar Components

### EnhancedGLTFAvatar

Enhanced GLTF avatar component.

```typescript
interface AvatarConfig {
  id: string;
  gltfUrl?: string;                  // GLTF model URL
  position: [number, number, number];
  name: string;
  status?: 'online' | 'offline' | 'away';
  animationState?: 'idle' | 'walking' | 'gesturing';
  showNameTag?: boolean;              // Show name tag (default: true)
  showStatusIndicator?: boolean;      // Show status indicator (default: true)
  dimension?: string;                 // e.g., "0D", "1D"
  color?: string;                     // Avatar color theme
  scale?: number;                     // Avatar scale (default: 1)
}
```

### AvatarAnimationController

Animation controller props.

```typescript
interface AvatarAnimationControllerProps {
  scene: THREE.Object3D;
  animationState: 'idle' | 'walking' | 'gesturing';
  gltf?: any;                         // GLTF loader result
  speed?: number;                     // Animation speed multiplier
}
```

### AvatarManager

Avatar manager context.

```typescript
interface AvatarManagerContextType {
  avatars: Map<string, AvatarState>;
  addAvatar: (config: AvatarConfig) => void;
  removeAvatar: (id: string) => void;
  updateAvatar: (id: string, updates: Partial<AvatarConfig>) => void;
  moveAvatar: (id: string, targetPosition: [number, number, number]) => void;
  getAvatar: (id: string) => AvatarState | undefined;
  getAvatarsInZone: (zoneId: string) => AvatarState[];
  getAvatarsByDimension: (dimension: string) => AvatarState[];
}
```

## World Structure Components

### VirtualWorldBuilding

Building configuration.

```typescript
interface BuildingConfig extends Building {
  gltfModel?: string;                 // Optional GLTF model URL
  color?: string;                     // Building color
  emissive?: string;                  // Emissive color
  showLabel?: boolean;                // Show building label
  interactive?: boolean;              // Enable interactions
}

interface Building {
  id: string;
  name: string;
  position: [number, number, number];
  size: [number, number, number];     // width, height, depth
  rotation?: number;                  // Rotation in radians
  zoneId: string;
  type: 'agent-building' | 'plaza' | 'workspace' | 'garden';
}
```

### VirtualWorldPaths

Path configuration.

```typescript
interface PathConfig extends Path {
  color?: string;                     // Path color
  showMarkers?: boolean;              // Show path markers
  animated?: boolean;                 // Animate path
}

interface Path {
  id: string;
  from: [number, number, number];
  to: [number, number, number];
  width?: number;                      // Path width (default: 3)
  type: 'road' | 'path' | 'bridge';
  zoneConnections: string[];          // Zone IDs this path connects
}
```

### EnvironmentalObjects

Environmental object configuration.

```typescript
interface EnvironmentalObject {
  id: string;
  type: 'tree' | 'rock' | 'plant' | 'decoration';
  position: [number, number, number];
  scale?: number;                     // Object scale
  rotation?: number;                  // Rotation in radians
  gltfModel?: string;                  // Optional GLTF model
  color?: string;                      // Object color
}
```

## Lighting & Atmosphere

### WorldLightingSystem

Lighting configuration.

```typescript
interface LightingConfig {
  type?: 'day' | 'night' | 'cycle';   // Lighting mode
  sunPosition?: [number, number, number];
  sunIntensity?: number;               // Sun light intensity (default: 1)
  ambientIntensity?: number;           // Ambient light intensity (default: 0.6)
  shadowMapSize?: number;             // Shadow map resolution (default: 2048)
  enableShadows?: boolean;             // Enable shadow casting (default: true)
  timeOfDay?: number;                 // Time of day 0-1 (0=midnight, 0.5=noon)
  cycleSpeed?: number;                 // Day/night cycle speed multiplier
}
```

### AtmosphericEffects

Atmospheric effects configuration.

```typescript
interface AtmosphericEffectsConfig {
  fog?: {
    type?: 'linear' | 'exponential';
    color?: string;                    // Fog color
    near?: number;                     // Near distance
    far?: number;                      // Far distance
    density?: number;                  // Density (exponential only)
  };
  particles?: {
    enabled?: boolean;                 // Enable particles
    count?: number;                    // Particle count (default: 1000)
    color?: string;                     // Particle color
    size?: number;                      // Particle size (default: 0.02)
  };
}
```

## Camera & Navigation

### VirtualWorldCamera

Camera configuration.

```typescript
interface CameraConfig {
  mode?: 'first-person' | 'third-person' | 'orbital';
  target?: [number, number, number];   // Target position
  distance?: number;                   // Distance from target
  height?: number;                     // Camera height (first-person)
  fov?: number;                         // Field of view (default: 75)
  enableControls?: boolean;            // Enable manual controls
  smoothTransition?: boolean;           // Smooth camera transitions
}
```

### VirtualWorldNavigation

Navigation configuration.

```typescript
interface NavigationConfig {
  waypoints?: Waypoint[];
  showWaypoints?: boolean;             // Show waypoint markers
  enableTeleportation?: boolean;       // Enable teleportation
  pathFollowingSpeed?: number;         // Path following speed
}

interface Waypoint {
  id: string;
  name: string;
  position: [number, number, number];
  type?: 'spawn' | 'portal' | 'landmark';
  zoneId?: string;
}
```

## World Layout

### WorldLayout

World layout structure.

```typescript
interface WorldLayout {
  zones: Zone[];
  buildings: Building[];
  paths: Path[];
  landmarks: Landmark[];
  spawnPoints: [number, number, number][];
  center: [number, number, number];
  size: number;                        // World size
}

interface Zone {
  id: string;
  name: string;
  bounds: {
    min: [number, number, number];
    max: [number, number, number];
  };
  theme: 'plaza' | 'building' | 'garden' | 'workspace';
  avatars: string[];                   // Avatar IDs in this zone
  color: string;                       // Zone color theme
}

interface Landmark {
  id: string;
  name: string;
  position: [number, number, number];
  type: 'spawn' | 'portal' | 'monument' | 'sign';
  zoneId: string;
}
```

## Hooks

### useWorldLayout

Access world layout context.

```typescript
const {
  layout,
  getZone,
  getBuilding,
  getPath,
  getLandmark,
  getZoneForPosition,
  addAvatarToZone,
  removeAvatarFromZone
} = useWorldLayout();
```

### useAvatarManager

Access avatar manager context.

```typescript
const {
  avatars,
  addAvatar,
  removeAvatar,
  updateAvatar,
  moveAvatar,
  getAvatar,
  getAvatarsInZone,
  getAvatarsByDimension
} = useAvatarManager();
```

### usePathFollowing

Path following hook.

```typescript
const {
  currentPosition,
  isMoving,
  progress,
  startFollowing
} = usePathFollowing(
  start: [number, number, number],
  end: [number, number, number],
  speed?: number
);
```

### useTeleportation

Teleportation hook.

```typescript
const { teleport } = useTeleportation(
  onTeleport?: (position: [number, number, number]) => void
);
```

## Utility Functions

### createDefaultWorldLayout

Create default world layout.

```typescript
function createDefaultWorldLayout(): WorldLayout;
```

### generateEnvironmentalObjects

Generate environmental objects procedurally.

```typescript
function generateEnvironmentalObjects(
  worldSize: number,
  density?: number,
  zones?: Array<{ bounds: { min: [number, number, number]; max: [number, number, number] } }>
): EnvironmentalObject[];
```

## Camera Presets

### CameraPresets

Predefined camera configurations.

```typescript
const CameraPresets = {
  overview: {
    mode: 'orbital',
    target: [0, 0, 0],
    distance: 30,
    fov: 60
  },
  close: {
    mode: 'orbital',
    target: [0, 0, 0],
    distance: 10,
    fov: 75
  },
  firstPerson: {
    mode: 'first-person',
    height: 1.6,
    fov: 90
  },
  thirdPerson: {
    mode: 'third-person',
    distance: 5,
    height: 1.6,
    fov: 75
  }
};
```

## Type Exports

All types are exported from the main module:

```typescript
import type {
  VirtualWorldConfig,
  VirtualWorldProps,
  TerrainConfig,
  SkyboxConfig,
  AvatarConfig,
  BuildingConfig,
  PathConfig,
  EnvironmentalObject,
  LightingConfig,
  AtmosphericEffectsConfig,
  CameraConfig,
  NavigationConfig,
  Waypoint,
  WorldLayout,
  Zone,
  Building,
  Path,
  Landmark
} from '@/components/VirtualWorld';
```

---

**Last Updated**: 2025-01-07  
**Version**: 1.0.0
