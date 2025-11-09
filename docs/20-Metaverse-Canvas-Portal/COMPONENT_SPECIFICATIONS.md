---
id: metaverse-canvas-portal-component-specifications
title: "Metaverse Canvas Portal - Component Specifications"
level: foundational
type: specification
tags: [specification, components, metaverse]
keywords: [specification, components, props, interfaces, types]
prerequisites: [metaverse-canvas-portal]
enables: [metaverse-canvas-portal-development]
related: [metaverse-canvas-portal]
readingTime: 60
difficulty: 4
---

# Metaverse Canvas Portal - Component Specifications

## Component Specifications

### VirtualWorld

**Purpose**: Main integration component for the virtual world system.

**Props**:
- `config?: VirtualWorldConfig` - Complete world configuration
- `onAvatarClick?: (avatar: AvatarConfig) => void` - Avatar click callback
- `onBuildingClick?: (building: BuildingConfig) => void` - Building click callback
- `selectedAvatarId?: string` - Currently selected avatar ID
- `selectedBuildingId?: string` - Currently selected building ID

**Behavior**:
- Initializes all subsystems
- Provides context providers
- Handles event propagation
- Manages component lifecycle

**Dependencies**:
- `VirtualWorldScene`
- `AvatarManagerProvider`
- `WorldLayoutProvider`

### VirtualWorldScene

**Purpose**: Core scene setup with terrain and skybox.

**Props**:
- `config?: VirtualWorldSceneConfig` - Scene configuration
- `children?: React.ReactNode` - Child components

**Behavior**:
- Creates Three.js Canvas
- Initializes camera
- Sets up lighting
- Renders terrain and skybox

**Dependencies**:
- `VirtualWorldTerrain`
- `VirtualWorldSkybox`
- `WorldLayoutProvider`

### VirtualWorldTerrain

**Purpose**: Ground plane with texture support.

**Props**:
- `config?: TerrainConfig` - Terrain configuration
- `onCollision?: (position: [number, number, number]) => boolean` - Collision callback

**Behavior**:
- Generates plane geometry
- Applies textures
- Handles heightmaps (optional)
- Supports collision detection

**Geometry**:
- Type: `THREE.PlaneGeometry`
- Default size: 100x100 units
- Subdivisions: 100x100

**Materials**:
- Type: `THREE.MeshStandardMaterial`
- Default color: `#4a5568`
- Roughness: 0.8
- Metalness: 0.1

### VirtualWorldSkybox

**Purpose**: 360° environment rendering.

**Props**:
- `config?: SkyboxConfig` - Skybox configuration

**Behavior**:
- Renders procedural sky (default)
- Supports texture-based skybox
- Implements day/night cycle
- Adds stars (optional)

**Modes**:
- `procedural`: Uses `@react-three/drei` Sky component
- `texture`: Uses 360° panorama texture

**Features**:
- Sun position control
- Cloud density adjustment
- Star field rendering
- Day/night cycle animation

### EnhancedGLTFAvatar

**Purpose**: Renders GLTF avatars with enhancements.

**Props**:
- `config: AvatarConfig` - Avatar configuration
- `selected?: boolean` - Selection state
- `onClick?: () => void` - Click handler
- `onHover?: (hovered: boolean) => void` - Hover handler

**Behavior**:
- Loads GLTF model
- Falls back to procedural avatar if GLTF fails
- Renders name tag
- Shows status indicator
- Handles animations
- Displays selection ring

**Features**:
- GLTF model loading with Draco compression
- Animation support via `AvatarAnimationController`
- Name tag with dimension label
- Status indicator (online/offline/away)
- Selection and hover highlighting
- Floating animation for idle state

### AvatarAnimationController

**Purpose**: Manages GLTF avatar animations.

**Props**:
- `scene: THREE.Object3D` - Avatar scene object
- `animationState: 'idle' | 'walking' | 'gesturing'` - Current animation state
- `gltf?: any` - GLTF loader result
- `speed?: number` - Animation speed multiplier

**Behavior**:
- Initializes animation mixer
- Creates actions for each animation clip
- Handles state transitions with fading
- Updates mixer each frame

**Animation States**:
- `idle`: Breathing, subtle movements
- `walking`: Locomotion animation
- `gesturing`: Hand gestures, expressions

**Fallback**:
- Uses procedural animations if GLTF animations unavailable

### AvatarManager

**Purpose**: Manages avatar registry and coordination.

**Context API**:
- `avatars: Map<string, AvatarState>` - Avatar registry
- `addAvatar(config: AvatarConfig)` - Add avatar
- `removeAvatar(id: string)` - Remove avatar
- `updateAvatar(id: string, updates: Partial<AvatarConfig>)` - Update avatar
- `moveAvatar(id: string, targetPosition: [number, number, number])` - Move avatar
- `getAvatar(id: string)` - Get avatar by ID
- `getAvatarsInZone(zoneId: string)` - Get avatars in zone
- `getAvatarsByDimension(dimension: string)` - Get avatars by dimension

**Behavior**:
- Maintains avatar registry
- Tracks avatar positions
- Manages zone assignments
- Handles avatar state updates

### VirtualWorldBuilding

**Purpose**: Renders buildings with GLTF or procedural generation.

**Props**:
- `building: BuildingConfig` - Building configuration
- `selected?: boolean` - Selection state
- `onClick?: () => void` - Click handler
- `onHover?: (hovered: boolean) => void` - Hover handler

**Behavior**:
- Loads GLTF model if provided
- Falls back to procedural generation
- Renders building label
- Handles interactions

**Features**:
- GLTF model support
- Procedural building generation
- Window lighting
- Building labels
- Selection highlighting

### VirtualWorldPaths

**Purpose**: Renders paths and roads connecting zones.

**Props**:
- `paths: PathConfig[]` - Path configurations
- `showMarkers?: boolean` - Show path markers

**Behavior**:
- Generates path geometry
- Renders path surface
- Adds path markers
- Supports different path types

**Path Types**:
- `road`: Wide path with road texture
- `path`: Narrow walkway
- `bridge`: Elevated path with dashed line

### EnvironmentalObjects

**Purpose**: Renders environmental objects (trees, rocks, etc.).

**Props**:
- `objects: EnvironmentalObject[]` - Object configurations
- `density?: number` - Objects per 100 units

**Behavior**:
- Renders procedural objects
- Supports GLTF models
- Handles object animations
- Manages object placement

**Object Types**:
- `tree`: Procedural tree with trunk and foliage
- `rock`: Procedural rock with dodecahedron geometry
- `plant`: Procedural plant with stem and leaves
- `decoration`: Procedural decorative object

### WorldLightingSystem

**Purpose**: Advanced lighting with shadows and day/night cycle.

**Props**:
- `config?: LightingConfig` - Lighting configuration

**Behavior**:
- Sets up directional light (sun)
- Configures ambient light
- Enables shadow casting
- Implements day/night cycle

**Lighting Modes**:
- `day`: Full daylight
- `night`: Night lighting with moon
- `cycle`: Animated day/night cycle

**Features**:
- Configurable shadow map size
- Sun position control
- Intensity adjustment
- Color temperature variation

### AtmosphericEffects

**Purpose**: Fog, particles, and atmospheric effects.

**Props**:
- `config?: AtmosphericEffectsConfig` - Effects configuration

**Behavior**:
- Renders fog (linear or exponential)
- Manages particle systems
- Handles post-processing hooks

**Fog Types**:
- `linear`: Linear fog with near/far distances
- `exponential`: Exponential fog with density

**Particle System**:
- Configurable particle count
- Color and size control
- Animated particle movement
- Additive blending

### VirtualWorldCamera

**Purpose**: Multiple camera modes with smooth transitions.

**Props**:
- `config?: CameraConfig` - Camera configuration
- `avatarPosition?: [number, number, number]` - Avatar position for following

**Behavior**:
- Sets up camera based on mode
- Handles smooth transitions
- Integrates with controls
- Updates camera position

**Camera Modes**:
- `orbital`: Orbit around target (default)
- `first-person`: First-person view
- `third-person`: Third-person following

**Features**:
- Smooth position interpolation
- Configurable FOV
- Control integration
- Preset positions

### VirtualWorldNavigation

**Purpose**: Waypoint system and navigation.

**Props**:
- `config?: NavigationConfig` - Navigation configuration
- `onWaypointReached?: (waypoint: Waypoint) => void` - Waypoint callback

**Behavior**:
- Renders waypoint markers
- Handles waypoint interactions
- Supports teleportation
- Manages path following

**Features**:
- Waypoint visualization
- Floating markers
- Path following
- Teleportation support

## Context Providers

### WorldLayoutProvider

**Purpose**: Provides world layout context.

**Props**:
- `children: React.ReactNode` - Child components
- `initialLayout?: WorldLayout` - Initial layout

**Context Value**:
- `layout: WorldLayout` - Current layout
- `getZone(id: string)` - Get zone by ID
- `getBuilding(id: string)` - Get building by ID
- `getPath(id: string)` - Get path by ID
- `getLandmark(id: string)` - Get landmark by ID
- `getZoneForPosition(position)` - Get zone for position
- `addAvatarToZone(zoneId, avatarId)` - Add avatar to zone
- `removeAvatarFromZone(zoneId, avatarId)` - Remove avatar from zone

### AvatarManagerProvider

**Purpose**: Provides avatar manager context.

**Props**:
- `children: React.ReactNode` - Child components
- `initialAvatars?: AvatarConfig[]` - Initial avatars

**Context Value**:
- `avatars: Map<string, AvatarState>` - Avatar registry
- `addAvatar(config)` - Add avatar
- `removeAvatar(id)` - Remove avatar
- `updateAvatar(id, updates)` - Update avatar
- `moveAvatar(id, targetPosition)` - Move avatar
- `getAvatar(id)` - Get avatar
- `getAvatarsInZone(zoneId)` - Get avatars in zone
- `getAvatarsByDimension(dimension)` - Get avatars by dimension

## Hooks

### useWorldLayout

**Purpose**: Access world layout context.

**Returns**: `WorldLayoutContextType`

**Usage**:
```typescript
const { layout, getZone, getZoneForPosition } = useWorldLayout();
```

### useAvatarManager

**Purpose**: Access avatar manager context.

**Returns**: `AvatarManagerContextType`

**Usage**:
```typescript
const { avatars, addAvatar, updateAvatar } = useAvatarManager();
```

### usePathFollowing

**Purpose**: Path following hook.

**Parameters**:
- `start: [number, number, number]` - Start position
- `end: [number, number, number]` - End position
- `speed?: number` - Movement speed

**Returns**:
- `currentPosition: [number, number, number]` - Current position
- `isMoving: boolean` - Moving state
- `progress: number` - Progress 0-1
- `startFollowing: () => void` - Start following

### useTeleportation

**Purpose**: Teleportation hook.

**Parameters**:
- `onTeleport?: (position: [number, number, number]) => void` - Teleport callback

**Returns**:
- `teleport: (position: [number, number, number]) => void` - Teleport function

## Utility Functions

### createDefaultWorldLayout

**Purpose**: Create default world layout.

**Returns**: `WorldLayout`

**Layout Structure**:
- Central Plaza (40x40 units)
- Foundation Zone (0D-2D)
- Operational Zone (3D-4D)
- Advanced Zone (5D-6D)
- Quantum Zone (7D)

### generateEnvironmentalObjects

**Purpose**: Generate environmental objects procedurally.

**Parameters**:
- `worldSize: number` - World size
- `density?: number` - Objects per 100 units
- `zones?: Zone[]` - Zones to avoid

**Returns**: `EnvironmentalObject[]`

## Performance Specifications

### Rendering Targets

- **Frame Rate**: 60 FPS
- **Avatar Limit**: 50+ avatars
- **GLTF Size**: < 5MB per model
- **Shadow Map**: 2048x2048 (default)

### Memory Management

- **GLTF Caching**: Models cached after first load
- **Texture Pooling**: Textures reused
- **Geometry Pooling**: Geometries reused
- **Cleanup**: Proper disposal of Three.js objects

### Optimization Strategies

- **Frustum Culling**: Only render visible objects
- **Selective Updates**: Only update changed components
- **Memoization**: Memoize expensive computations
- **Debouncing**: Debounce rapid updates

---

**Last Updated**: 2025-01-07  
**Version**: 1.0.0
