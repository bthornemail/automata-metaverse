/**
 * Virtual World Component
 * Main component integrating all virtual world subsystems
 */

import React, { useState, useMemo } from 'react';
import { VirtualWorldScene, VirtualWorldSceneConfig } from './VirtualWorldScene';
import { EnhancedGLTFAvatar, AvatarConfig } from './EnhancedGLTFAvatar';
import { AvatarManagerProvider } from './AvatarManager';
import { BuildingGroup, BuildingConfig } from './VirtualWorldBuilding';
import { VirtualWorldPaths } from './VirtualWorldPaths';
import { EnvironmentalObjects, EnvironmentalObject } from './EnvironmentalObjects';
import { WorldLightingSystem, LightingConfig } from './WorldLightingSystem';
import { AtmosphericEffects, AtmosphericEffectsConfig } from './AtmosphericEffects';
import { VirtualWorldCamera, CameraMode, CameraConfig } from './VirtualWorldCamera';
import { VirtualWorldNavigation, NavigationConfig } from './VirtualWorldNavigation';
import { useWorldLayout } from './WorldLayoutManager';

export interface VirtualWorldConfig {
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

export interface VirtualWorldProps {
  config?: VirtualWorldConfig;
  onAvatarClick?: (avatar: AvatarConfig) => void;
  onBuildingClick?: (building: BuildingConfig) => void;
  selectedAvatarId?: string;
  selectedBuildingId?: string;
}

// Inner component that uses context
const VirtualWorldContent: React.FC<VirtualWorldProps> = ({
  config = {},
  onAvatarClick,
  onBuildingClick,
  selectedAvatarId,
  selectedBuildingId
}) => {
  const { layout } = useWorldLayout();
  const {
    avatars = [],
    buildings = [],
    environmentalObjects = [],
    showBuildings = true,
    showPaths = true,
    showEnvironment = true
  } = config;

  // Generate environmental objects if not provided
  const envObjects = useMemo(() => {
    if (environmentalObjects.length > 0) {
      return environmentalObjects;
    }
    if (showEnvironment) {
      // Generate procedural objects
      return []; // Would use generateEnvironmentalObjects helper
    }
    return [];
  }, [environmentalObjects, showEnvironment]);

  return (
    <>
      {/* Lighting */}
      <WorldLightingSystem config={config.lighting} />

      {/* Atmospheric effects */}
      <AtmosphericEffects config={config.atmosphere} />

      {/* Camera */}
      <VirtualWorldCamera
        config={config.camera}
        avatarPosition={selectedAvatarId ? avatars.find(a => a.id === selectedAvatarId)?.position : undefined}
      />

      {/* Buildings */}
      {showBuildings && buildings.length > 0 && (
        <BuildingGroup
          buildings={buildings}
          onBuildingClick={onBuildingClick}
          selectedBuildingId={selectedBuildingId}
        />
      )}

      {/* Paths */}
      {showPaths && layout.paths.length > 0 && (
        <VirtualWorldPaths paths={layout.paths} />
      )}

      {/* Environmental objects */}
      {showEnvironment && envObjects.length > 0 && (
        <EnvironmentalObjects objects={envObjects} />
      )}

      {/* Avatars */}
      {avatars.map(avatar => (
        <EnhancedGLTFAvatar
          key={avatar.id}
          config={avatar}
          selected={selectedAvatarId === avatar.id}
          onClick={() => onAvatarClick?.(avatar)}
        />
      ))}

      {/* Navigation */}
      <VirtualWorldNavigation config={config.navigation} />
    </>
  );
};

export const VirtualWorld: React.FC<VirtualWorldProps> = (props) => {
  const { config = {} } = props;

  // Prepare initial avatars for AvatarManager
  const initialAvatars = useMemo(() => config.avatars || [], [config.avatars]);

  return (
    <VirtualWorldScene config={config.scene}>
      <AvatarManagerProvider initialAvatars={initialAvatars}>
        <VirtualWorldContent {...props} />
      </AvatarManagerProvider>
    </VirtualWorldScene>
  );
};

// Export all components and types
export * from './VirtualWorldTerrain';
export * from './VirtualWorldSkybox';
export * from './WorldLayoutManager';
export * from './VirtualWorldScene';
export * from './EnhancedGLTFAvatar';
export * from './AvatarAnimationController';
export * from './AvatarManager';
export * from './VirtualWorldBuilding';
export * from './VirtualWorldPaths';
export * from './EnvironmentalObjects';
export * from './WorldLightingSystem';
export * from './AtmosphericEffects';
export * from './VirtualWorldCamera';
export * from './VirtualWorldNavigation';
