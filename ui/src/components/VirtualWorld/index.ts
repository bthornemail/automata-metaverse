/**
 * Virtual World Components Export
 */

export { VirtualWorld } from './VirtualWorld';
export type { VirtualWorldConfig, VirtualWorldProps } from './VirtualWorld';

export { VirtualWorldTerrain } from './VirtualWorldTerrain';
export type { TerrainConfig } from './VirtualWorldTerrain';

export { VirtualWorldSkybox, AtmosphericFog } from './VirtualWorldSkybox';
export type { SkyboxConfig } from './VirtualWorldSkybox';

export { VirtualWorldScene } from './VirtualWorldScene';
export type { VirtualWorldSceneConfig } from './VirtualWorldScene';

export { EnhancedGLTFAvatar } from './EnhancedGLTFAvatar';
export type { AvatarConfig } from './EnhancedGLTFAvatar';

export { EnhancedGLTFAvatarV2 } from './EnhancedGLTFAvatarV2';
export type { EnhancedAvatarConfigV2 } from './EnhancedGLTFAvatarV2';

export { useAvatarGestures, PREDEFINED_GESTURES, GestureAnimationController } from './AvatarGestureSystem';
export type { GestureType, Gesture, GestureState } from './AvatarGestureSystem';

export { AvatarBridge, migrateAvatarSystem, symbolToAvatarConfig, convertGLTFAvatarProps, convertGestureAnimationProps } from './AvatarIntegrationBridge';

export { AvatarAnimationController } from './AvatarAnimationController';
export type { AvatarAnimationControllerProps, AnimationState } from './AvatarAnimationController';

export { AvatarManagerProvider, useAvatarManager } from './AvatarManager';
export type { AvatarState } from './AvatarManager';

export { VirtualWorldBuilding, BuildingGroup } from './VirtualWorldBuilding';
export type { BuildingConfig } from './VirtualWorldBuilding';

export { EnhancedBuilding } from './EnhancedBuilding';
export type { EnhancedBuildingConfig } from './EnhancedBuilding';

export { BuildingInterior } from './BuildingInterior';
export type { BuildingInteriorConfig, InteriorRoom, BuildingDoor } from './BuildingInterior';

export { VirtualWorldPaths, PathGroup } from './VirtualWorldPaths';
export type { PathConfig } from './VirtualWorldPaths';

export { PathNavigation } from './PathNavigation';
export type { CurvedPathConfig, PathFollower } from './PathNavigation';

export { EnvironmentalObjects, generateEnvironmentalObjects } from './EnvironmentalObjects';
export type { EnvironmentalObject } from './EnvironmentalObjects';

export { InteractiveObjects } from './InteractiveObjects';
export type { InteractiveObjectConfig, InteractiveObjectType } from './InteractiveObjects';

export { WorldLightingSystem, SkyLighting, InteriorLighting } from './WorldLightingSystem';
export type { LightingConfig } from './WorldLightingSystem';

export { AdvancedLightingSystem } from './AdvancedLightingSystem';
export type { AdvancedLightingConfig } from './AdvancedLightingSystem';

export { VolumetricLighting, generateLightProbes } from './VolumetricLighting';
export type { VolumetricLightConfig, LightProbeConfig } from './VolumetricLighting';

export { PostProcessingSystem } from './PostProcessingSystem';
export type { PostProcessingConfig } from './PostProcessingSystem';

export { WeatherSystem } from './WeatherSystem';
export type { WeatherConfig, WeatherType } from './WeatherSystem';

export { AdvancedShadows, ShadowCaster, optimizeShadows } from './AdvancedShadows';
export type { CascadedShadowConfig, SoftShadowConfig } from './AdvancedShadows';

export { AtmosphericEffects } from './AtmosphericEffects';
export type { AtmosphericEffectsConfig } from './AtmosphericEffects';

export { VirtualWorldCamera, CameraPresets } from './VirtualWorldCamera';
export type { CameraMode, CameraConfig } from './VirtualWorldCamera';

export { EnhancedCamera } from './EnhancedCamera';
export type { EnhancedCameraMode, EnhancedCameraConfig } from './EnhancedCamera';

export { VirtualWorldNavigation, usePathFollowing, useTeleportation } from './VirtualWorldNavigation';
export type { Waypoint, NavigationConfig } from './VirtualWorldNavigation';

export { EnhancedNavigation } from './EnhancedNavigation';
export type { EnhancedNavigationConfig } from './EnhancedNavigation';

export { MiniMap } from './MiniMap';
export type { MiniMapConfig } from './MiniMap';

export { NavigationUI } from './NavigationUI';
export type { NavigationUIProps } from './NavigationUI';

export { PerformanceOptimizer, usePerformanceOptimizer } from './PerformanceOptimizer';
export type { PerformanceOptimizerConfig } from './PerformanceOptimizer';

export { WorldPersistence } from './WorldPersistence';
export type { WorldPersistenceProps } from './WorldPersistence';

export { WorldSettings } from './WorldSettings';
export type { WorldSettingsProps } from './WorldSettings';

export { WorldDebug } from './WorldDebug';
export type { WorldDebugProps } from './WorldDebug';

export { EnhancedVirtualWorld } from './EnhancedVirtualWorld';
export type { EnhancedVirtualWorldConfig, EnhancedVirtualWorldProps } from './EnhancedVirtualWorld';

export { GlassCard, ModernButton, ModernPanel, ModernInput, ModernToggle, ModernBadge, ModernTooltip } from './ModernUI';

export { WorldLayoutProvider, useWorldLayout, createDefaultWorldLayout } from './WorldLayoutManager';
export type { WorldLayout, Zone, Building, Path, Landmark } from './WorldLayoutManager';
