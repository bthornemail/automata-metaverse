/**
 * Enhanced Virtual World Component V2
 * Complete integration with Phase 6 enhancements
 */

import React, { useState, useMemo, useEffect } from 'react';
import './styles.css';
import { VirtualWorldScene, VirtualWorldSceneConfig, WorldLayoutProvider } from './VirtualWorldScene';
import { EnhancedGLTFAvatar, AvatarConfig } from './EnhancedGLTFAvatar';
import { AvatarManagerProvider } from './AvatarManager';
import { BuildingGroup, BuildingConfig } from './VirtualWorldBuilding';
import { VirtualWorldPaths } from './VirtualWorldPaths';
import { EnvironmentalObjects, EnvironmentalObject } from './EnvironmentalObjects';
import { AdvancedLightingSystem, AdvancedLightingConfig } from './AdvancedLightingSystem';
import { EnhancedCamera, EnhancedCameraConfig } from './EnhancedCamera';
import { EnhancedNavigation, EnhancedNavigationConfig } from './EnhancedNavigation';
import { MiniMap, MiniMapConfig } from './MiniMap';
import { NavigationUI, NavigationUIProps } from './NavigationUI';
import { PerformanceOptimizer, PerformanceOptimizerConfig } from './PerformanceOptimizer';
import { WorldPersistence, WorldPersistenceProps } from './WorldPersistence';
import { WorldSettings } from './WorldSettings';
import { AvatarInteractionSystem } from './AvatarInteractionSystem';
import { useWorldLayout } from './WorldLayoutManager';
import { worldService, WorldState } from '../../services/world-service';

export interface EnhancedVirtualWorldConfig {
  scene?: VirtualWorldSceneConfig;
  lighting?: AdvancedLightingConfig;
  camera?: EnhancedCameraConfig;
  navigation?: EnhancedNavigationConfig;
  minimap?: MiniMapConfig;
  performance?: PerformanceOptimizerConfig;
  avatars?: AvatarConfig[];
  buildings?: BuildingConfig[];
  environmentalObjects?: EnvironmentalObject[];
  showBuildings?: boolean;
  showPaths?: boolean;
  showEnvironment?: boolean;
  enablePersistence?: boolean;
  enableSettings?: boolean;
  enableDebug?: boolean;
  worldSize?: number;
}

interface EnhancedVirtualWorldProps {
  config?: EnhancedVirtualWorldConfig;
  onAvatarClick?: (avatar: AvatarConfig) => void;
  onBuildingClick?: (building: BuildingConfig) => void;
  selectedAvatarId?: string;
  selectedBuildingId?: string;
  onWorldStateChange?: (state: WorldState) => void;
}

// Inner component that uses context
const EnhancedVirtualWorldContent: React.FC<EnhancedVirtualWorldProps> = ({
  config = {},
  onAvatarClick,
  onBuildingClick,
  selectedAvatarId,
  selectedBuildingId,
  onWorldStateChange
}) => {
  const { layout } = useWorldLayout();
  const [showSettings, setShowSettings] = useState(false);
  const [worldState, setWorldState] = useState<WorldState | null>(null);

  const {
    avatars = [],
    buildings = [],
    environmentalObjects = [],
    showBuildings = true,
    showPaths = true,
    showEnvironment = true,
    enablePersistence = true,
    enableSettings = true,
    enableDebug = false,
    worldSize = 200
  } = config;

  // World state sync
  useEffect(() => {
    const handleStateChange = (state: WorldState) => {
      setWorldState(state);
      onWorldStateChange?.(state);
    };

    worldService.on('world:state-change', handleStateChange);
    worldService.syncServices();

    return () => {
      worldService.off('world:state-change', handleStateChange);
    };
  }, [onWorldStateChange]);

  // Generate environmental objects if not provided
  const envObjects = useMemo(() => {
    if (environmentalObjects.length > 0) {
      return environmentalObjects;
    }
    if (showEnvironment) {
      return [];
    }
    return [];
  }, [environmentalObjects, showEnvironment]);

  const selectedAvatar = useMemo(() => {
    return avatars.find(a => a.id === selectedAvatarId);
  }, [avatars, selectedAvatarId]);

  return (
    <PerformanceOptimizer config={config.performance}>
      {/* Lighting */}
      <AdvancedLightingSystem config={config.lighting} />

      {/* Camera */}
      <EnhancedCamera
        config={config.camera}
        avatarPosition={selectedAvatar?.position}
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

      {/* Avatar Interaction System (Raycasting for hover and click) */}
      <AvatarInteractionSystem
        avatars={avatars}
        onAvatarHover={(avatar) => {
          // Handle hover state if needed
        }}
        onAvatarClick={(avatar) => {
          onAvatarClick?.(avatar);
        }}
        enableStatusDisplay={true}
      />

      {/* Navigation */}
      <EnhancedNavigation config={config.navigation} />

      {/* Mini-Map */}
      {config.minimap?.enabled !== false && (
        <MiniMap
          config={{
            ...config.minimap,
            currentPosition: selectedAvatar?.position,
            worldSize
          }}
          worldSize={worldSize}
        />
      )}
    </PerformanceOptimizer>
  );
};

export const EnhancedVirtualWorld: React.FC<EnhancedVirtualWorldProps> = (props) => {
  const { config = {} } = props;

  // Prepare initial avatars for AvatarManager
  const initialAvatars = useMemo(() => config.avatars || [], [config.avatars]);

  // Initialize world service
  useEffect(() => {
    worldService.startMetricsCollection();
    return () => {
      worldService.stopMetricsCollection();
    };
  }, []);

  const [showSettings, setShowSettings] = useState(false);
  const selectedAvatar = useMemo(() => {
    return config.avatars?.find(a => a.id === props.selectedAvatarId);
  }, [config.avatars, props.selectedAvatarId]);

  return (
    <div className="relative w-full h-full">
      <VirtualWorldScene config={config.scene}>
        <AvatarManagerProvider initialAvatars={initialAvatars}>
          <EnhancedVirtualWorldContent {...props} />
        </AvatarManagerProvider>
      </VirtualWorldScene>
      
      {/* UI Components - Rendered outside Canvas */}
      <WorldLayoutProvider>
        <NavigationUIWrapper
          navigation={config.navigation}
          selectedAvatar={selectedAvatar}
        />
      </WorldLayoutProvider>
      
      {/* World Persistence - Outside Canvas */}
      {config.enablePersistence && (
        <WorldPersistence
          onSave={(state) => {
            worldService.setState(state);
          }}
          onLoad={(state) => {
            worldService.setState(state);
          }}
        />
      )}
      
      {/* World Settings - Outside Canvas */}
      {config.enableSettings && (
        <>
          <button
            onClick={() => setShowSettings(true)}
            className="absolute top-4 right-4 p-2 bg-gray-800/90 backdrop-blur-lg rounded-lg border border-gray-700 hover:bg-gray-700 transition-colors z-50"
            title="Settings"
          >
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </button>
          <WorldSettings
            visible={showSettings}
            onClose={() => setShowSettings(false)}
          />
        </>
      )}
      
      {/* World Debug - Disabled for now (requires useThree but renders HTML) */}
      {/* TODO: Create a separate WorldDebug component that doesn't use useThree */}
    </div>
  );
};

// Wrapper component to access WorldLayoutProvider context outside Canvas
const NavigationUIWrapper: React.FC<{
  navigation?: EnhancedNavigationConfig;
  selectedAvatar?: AvatarConfig;
}> = ({ navigation, selectedAvatar }) => {
  return (
    <NavigationUI
      waypoints={navigation?.waypoints}
      currentPosition={selectedAvatar?.position}
      onTeleport={(position) => {
        // Teleport avatar
        if (selectedAvatar) {
          // Would update avatar position via avatarService
        }
      }}
    />
  );
};
