/**
 * Virtual World Example Component
 * Example usage of the VirtualWorld component
 */

import React, { useState } from 'react';
import { VirtualWorld, VirtualWorldConfig, AvatarConfig, BuildingConfig } from './VirtualWorld';

export const VirtualWorldExample: React.FC = () => {
  const [selectedAvatarId, setSelectedAvatarId] = useState<string | undefined>();
  const [selectedBuildingId, setSelectedBuildingId] = useState<string | undefined>();

  // Example avatars based on dimensional agents
  const avatars: AvatarConfig[] = [
    {
      id: 'avatar-0d',
      name: '0D Topology Agent',
      position: [-30, 0, -30],
      dimension: '0D',
      color: '#3b82f6',
      status: 'online',
      animationState: 'idle',
      showNameTag: true,
      showStatusIndicator: true
    },
    {
      id: 'avatar-1d',
      name: '1D Temporal Agent',
      position: [-25, 0, -30],
      dimension: '1D',
      color: '#6366f1',
      status: 'online',
      animationState: 'idle',
      showNameTag: true,
      showStatusIndicator: true
    },
    {
      id: 'avatar-2d',
      name: '2D Structural Agent',
      position: [-20, 0, -30],
      dimension: '2D',
      color: '#8b5cf6',
      status: 'online',
      animationState: 'idle',
      showNameTag: true,
      showStatusIndicator: true
    },
    {
      id: 'avatar-3d',
      name: '3D Algebraic Agent',
      position: [20, 0, -30],
      dimension: '3D',
      color: '#f59e0b',
      status: 'online',
      animationState: 'idle',
      showNameTag: true,
      showStatusIndicator: true
    },
    {
      id: 'avatar-4d',
      name: '4D Network Agent',
      position: [25, 0, -30],
      dimension: '4D',
      color: '#f97316',
      status: 'online',
      animationState: 'idle',
      showNameTag: true,
      showStatusIndicator: true
    },
    {
      id: 'avatar-5d',
      name: '5D Consensus Agent',
      position: [-20, 0, 30],
      dimension: '5D',
      color: '#10b981',
      status: 'online',
      animationState: 'idle',
      showNameTag: true,
      showStatusIndicator: true
    },
    {
      id: 'avatar-6d',
      name: '6D Intelligence Agent',
      position: [-25, 0, 30],
      dimension: '6D',
      color: '#14b8a6',
      status: 'online',
      animationState: 'idle',
      showNameTag: true,
      showStatusIndicator: true
    },
    {
      id: 'avatar-7d',
      name: '7D Quantum Agent',
      position: [30, 0, 30],
      dimension: '7D',
      color: '#8b5cf6',
      status: 'online',
      animationState: 'idle',
      showNameTag: true,
      showStatusIndicator: true
    }
  ];

  // Example buildings from layout
  const buildings: BuildingConfig[] = [
    {
      id: 'foundation-building',
      name: 'Foundation Agents Building',
      position: [-30, 0, -30],
      size: [20, 15, 20],
      zoneId: 'foundation-zone',
      type: 'agent-building',
      color: '#3b82f6',
      showLabel: true,
      interactive: true
    },
    {
      id: 'operational-building',
      name: 'Operational Agents Building',
      position: [30, 0, -30],
      size: [20, 15, 20],
      zoneId: 'operational-zone',
      type: 'agent-building',
      color: '#f59e0b',
      showLabel: true,
      interactive: true
    },
    {
      id: 'advanced-building',
      name: 'Advanced Agents Building',
      position: [-30, 0, 30],
      size: [20, 15, 20],
      zoneId: 'advanced-zone',
      type: 'agent-building',
      color: '#10b981',
      showLabel: true,
      interactive: true
    },
    {
      id: 'quantum-building',
      name: 'Quantum Agent Building',
      position: [30, 0, 30],
      size: [20, 15, 20],
      zoneId: 'quantum-zone',
      type: 'agent-building',
      color: '#8b5cf6',
      showLabel: true,
      interactive: true
    }
  ];

  const config: VirtualWorldConfig = {
    scene: {
      terrain: {
        size: 200,
        color: '#4a5568',
        roughness: 0.8,
        metalness: 0.1,
        repeat: 10
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
      },
      enableControls: true
    },
    lighting: {
      type: 'day',
      sunPosition: [10, 10, 5],
      sunIntensity: 1,
      ambientIntensity: 0.6,
      enableShadows: true,
      shadowMapSize: 2048
    },
    atmosphere: {
      fog: {
        type: 'linear',
        color: '#87CEEB',
        near: 50,
        far: 200
      },
      particles: {
        enabled: false
      }
    },
    camera: {
      mode: 'orbital',
      target: [0, 0, 0],
      distance: 25,
      enableControls: true,
      smoothTransition: true
    },
    navigation: {
      showWaypoints: true,
      enableTeleportation: true
    },
    avatars,
    buildings,
    showBuildings: true,
    showPaths: true,
    showEnvironment: false // Can enable for trees/rocks
  };

  return (
    <div className="w-full h-full">
      <VirtualWorld
        config={config}
        onAvatarClick={(avatar) => {
          setSelectedAvatarId(avatar.id);
          console.log('Avatar clicked:', avatar);
        }}
        onBuildingClick={(building) => {
          setSelectedBuildingId(building.id);
          console.log('Building clicked:', building);
        }}
        selectedAvatarId={selectedAvatarId}
        selectedBuildingId={selectedBuildingId}
      />
    </div>
  );
};
