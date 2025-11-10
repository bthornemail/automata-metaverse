/**
 * Collaborative World Integration
 * Merges Collaborative World functionality with Unified View GLTF avatars
 * Includes buildings, trees, environment, and movement service
 */

import React, { useEffect, useState, useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera } from '@react-three/drei';
import * as THREE from 'three';
import { EnhancedGLTFAvatar, AvatarConfig } from '@/components/VirtualWorld/EnhancedGLTFAvatar';
import { collaborativeWorldService, Agent } from '@/services/collaborative-world';
import type { PropagationLevel } from '@/services/collaborative-world/types';
import { agentMovementService } from '@/services/collaborative-world/agent-movement-service';
import { InteractionVisualization } from '@/components/CollaborativeWorld/InteractionVisualization';
import { KnowledgeGraphVisualization } from '@/components/CollaborativeWorld/KnowledgeGraphVisualization';
import { BuildingGroup, BuildingConfig } from '@/components/VirtualWorld/VirtualWorldBuilding';
import { EnvironmentalObjects, EnvironmentalObject } from '@/components/VirtualWorld/EnvironmentalObjects';
import { VirtualWorldPaths } from '@/components/VirtualWorld/VirtualWorldPaths';
import { VirtualWorldScene, VirtualWorldSceneConfig, WorldLayoutProvider } from '@/components/VirtualWorld/VirtualWorldScene';
import { AdvancedLightingSystem, AdvancedLightingConfig } from '@/components/VirtualWorld/AdvancedLightingSystem';
import { useWorldLayout } from '@/components/VirtualWorld/WorldLayoutManager';
import { Symbol } from '../types';
import { ArrowUp, ArrowDown, ArrowLeft, ArrowRight, RotateCw, Move, Search, Bot, ChevronDown, ChevronUp } from 'lucide-react';
import type { Agent as AgentAPIAgent } from '@/services/agent-api/types';
import { ResearchModePanel } from './ResearchModePanel';
import {
  PhysicsParticles,
  PhysicsQubits,
  PhysicsDimensionNodes,
  PhysicsTopologyGrid
} from './PhysicsLayer';
import { SkyLayer } from './SkyLayer';
import { metaversePhysicsService } from '@/services/metaverse-physics-service';
import { avatarAIService } from '@/services/avatar-ai-service';
import { MiniMap, MiniMapConfig } from '@/components/VirtualWorld/MiniMap';
import { NavigationUI } from '@/components/VirtualWorld/NavigationUI';
import { Waypoint } from '@/components/VirtualWorld/VirtualWorldNavigation';

interface CollaborativeWorldIntegrationProps {
  selectedSymbol: Symbol | null;
  onSymbolSelect: (symbol: Symbol | null) => void;
  agents?: AgentAPIAgent[]; // From Agent API
  agentsLoading?: boolean;
  config?: {
    enableInteractions?: boolean;
    enableLearning?: boolean;
    showKnowledgeGraph?: boolean;
    showBuildings?: boolean;
    showEnvironment?: boolean;
    showPaths?: boolean;
  };
}

// Helper function to get dimension color
const getDimensionColor = (dimension: string): string => {
  const colors: Record<string, string> = {
    '0D': '#ef4444',
    '1D': '#f97316',
    '2D': '#eab308',
    '3D': '#22c55e',
    '4D': '#3b82f6',
    '5D': '#6366f1',
    '6D': '#8b5cf6',
    '7D': '#ec4899'
  };
  return colors[dimension] || '#ffffff';
};

// Helper function to get interaction range from dimension
const getInteractionRangeFromDimension = (dimension: string | null | undefined): PropagationLevel => {
  if (!dimension) return 'personal';
  const dim = dimension.replace('D', '');
  const dimNum = parseInt(dim, 10);
  if (dimNum <= 1) return 'personal';
  if (dimNum <= 3) return 'local';
  if (dimNum <= 5) return 'global';
  return 'agentic';
};

// Convert Agent API agent to CollaborativeWorld agent format
const convertAgentAPIToCollaborativeWorld = (apiAgent: AgentAPIAgent, index: number, total: number): Agent | null => {
  // Skip agents without dimensions (like Query-Interface-Agent, Visualization-Agent)
  if (!apiAgent.dimension) {
    console.log(`[CollaborativeWorld] Skipping agent ${apiAgent.id} - no dimension`);
    return null;
  }
  
  // Arrange agents in a circle around the center
  // Use index relative to total valid agents (will be recalculated after filtering)
  const radius = 15;
  const angle = (index / total) * Math.PI * 2;
  const x = Math.cos(angle) * radius;
  const z = Math.sin(angle) * radius;
  
  return {
    id: apiAgent.id,
    name: apiAgent.name,
    dimension: apiAgent.dimension as '0D' | '1D' | '2D' | '3D' | '4D' | '5D' | '6D' | '7D',
    position: [x, 0, z] as [number, number, number],
    velocity: [0, 0, 0] as [number, number, number],
    rotation: [0, 0, 0] as [number, number, number],
    interactionRange: getInteractionRangeFromDimension(apiAgent.dimension),
    learningEnabled: true,
    isMoving: false,
    animationState: 'idle' as const
  };
};

// Inner component that uses WorldLayout context
const CollaborativeWorldContent: React.FC<{
  selectedSymbol: Symbol | null;
  onSymbolSelect: (symbol: Symbol | null) => void;
  config: Required<CollaborativeWorldIntegrationProps['config']>;
  agents: Agent[];
  setAgents: React.Dispatch<React.SetStateAction<Agent[]>>;
  isInitialized: boolean;
  selectedAgentId: string | null;
  setSelectedAgentId: React.Dispatch<React.SetStateAction<string | null>>;
  showMovementControls: boolean;
  setShowMovementControls: React.Dispatch<React.SetStateAction<boolean>>;
  researchMode: boolean;
  setResearchMode: React.Dispatch<React.SetStateAction<boolean>>;
  buildings: BuildingConfig[];
  environmentalObjects: EnvironmentalObject[];
  showAgentList: boolean;
  setShowAgentList: React.Dispatch<React.SetStateAction<boolean>>;
}> = ({
  selectedSymbol,
  onSymbolSelect,
  config,
  agents,
  setAgents,
  isInitialized,
  selectedAgentId,
  setSelectedAgentId,
  showMovementControls,
  setShowMovementControls,
  researchMode,
  setResearchMode,
  buildings,
  environmentalObjects,
  showAgentList,
  setShowAgentList
}) => {
  const { layout } = useWorldLayout();
  
  // Convert agents to avatar configs - spread them out in a circle for visibility
  const avatarConfigs: AvatarConfig[] = useMemo(() => {
    if (agents.length === 0) {
      console.warn('[CollaborativeWorld] No agents available to create avatar configs');
      return [];
    }
    
    // Log detailed information about agents
    console.log(`[CollaborativeWorld] Creating ${agents.length} avatar configs from agents`);
    console.log(`[CollaborativeWorld] Agents array:`, agents.map(a => ({
      id: a.id,
      name: a.name,
      dimension: a.dimension,
      position: a.position
    })));
    
    // Ensure we have exactly 8 agents
    if (agents.length !== 8) {
      console.warn(`[CollaborativeWorld] Expected 8 agents but got ${agents.length}. This may cause rendering issues.`);
    }
    
    return agents.map((agent, index) => {
      // Debug logging for React DevTools
      if (process.env.NODE_ENV === 'development') {
        console.log(`[React DevTools] Creating avatar config for agent:`, {
          id: agent.id,
          name: agent.name,
          dimension: agent.dimension,
          position: agent.position,
          hasMetadata: !!agent.metadata,
          metadata: agent.metadata
        });
      }
      // Always spread them out in a circle for visibility
      // Use a fixed radius for all avatars so they're evenly spaced in a circle
      const baseRadius = 15; // Fixed radius for circle
      const angle = (index / agents.length) * Math.PI * 2;
      const position: [number, number, number] = [
        Math.cos(angle) * baseRadius,
        0,
        Math.sin(angle) * baseRadius
      ];
      
      console.log(`[CollaborativeWorld] Avatar ${agent.name} (${agent.dimension}) at position:`, position, `angle: ${(angle * 180 / Math.PI).toFixed(1)}°`);
      
      return {
        id: agent.id,
        name: agent.name,
        position,
        dimension: agent.dimension,
        status: 'online' as const,
        animationState: agent.animationState || 'idle',
        showNameTag: true,
        showStatusIndicator: true,
        color: getDimensionColor(agent.dimension),
        scale: 2, // Increased scale to make avatars more visible
        enableAI: true,
        // Note: GLTF URLs can be added here if available:
        // gltfUrl: agent.metadata?.gltfModel || `/models/avatars/${agent.dimension.toLowerCase()}-avatar.gltf`
      };
    });
  }, [agents]);

  const handleAvatarClick = (avatar: AvatarConfig) => {
    console.log('[CollaborativeWorld] Avatar clicked:', avatar.id);
    const agent = agents.find(a => a.id === avatar.id);
    if (agent) {
      console.log('[CollaborativeWorld] Agent found, selecting:', agent.name);
      // Open control panel by setting selected agent
      setSelectedAgentId(agent.id);
      const symbol: Symbol = {
        id: agent.id,
        name: agent.name,
        type: 'avatar',
        environment: '3d-gltf',
        position: agent.position,
        data: agent,
        metadata: {
          dimension: agent.dimension
        }
      };
      onSymbolSelect(symbol);
    } else {
      console.warn('[CollaborativeWorld] Agent not found for avatar:', avatar.id);
    }
  };

  const handleCreateInteraction = async (
    type: 'touch' | 'communicate' | 'collaborate' | 'learn',
    source: string,
    target?: string
  ) => {
    await collaborativeWorldService.createInteraction(type, source, target);
  };

  // Movement handlers
  const handleMoveAgent = async (direction: 'forward' | 'backward' | 'left' | 'right') => {
    if (!selectedAgentId) return;
    try {
      await agentMovementService.moveAgent(selectedAgentId, direction);
    } catch (error) {
      console.error('Failed to move agent:', error);
    }
  };

  const handleMoveAgentTo = async (targetPosition: [number, number, number]) => {
    if (!selectedAgentId) return;
    try {
      await agentMovementService.moveAgentTo(selectedAgentId, targetPosition);
    } catch (error) {
      console.error('Failed to move agent to position:', error);
    }
  };

  // Scene configuration
  const sceneConfig: VirtualWorldSceneConfig = useMemo(() => ({
    terrain: {
      size: 200,
      color: '#4a5568',
      roughness: 0.8,
      metalness: 0.1
    },
    skybox: {
      type: 'procedural',
      skyColor: '#87CEEB',
      stars: true
    },
    enableControls: true,
    camera: {
      position: [0, 20, 30], // Higher and further back to see avatars better
      fov: 75
    }
  }), []);

  // Lighting configuration
  const lightingConfig: AdvancedLightingConfig = useMemo(() => ({
    enableShadows: true,
    ambientIntensity: 0.6
  }), []);

  return (
    <>
      <VirtualWorldScene config={sceneConfig}>
        {/* Advanced Lighting System */}
        <AdvancedLightingSystem config={lightingConfig} />

        {/* Sky Layer - Abstract Components in Sky (Stars/Constellations) */}
        <SkyLayer
          enabled={true}
          skyHeight={75}
          particleCount={100}
          qubitCount={5}
          showDimensionNodes={true}
        />

        {/* Physics Layer - Keep topology grid at ground level for spatial field */}
        <PhysicsTopologyGrid enabled={true} showWireframe={false} />

        {/* Buildings - Aligned to topology grid */}
        {config.showBuildings !== false && buildings.length > 0 && (
          <BuildingGroup
            buildings={buildings}
            onBuildingClick={(building) => {
              console.log('[CollaborativeWorld] Building clicked:', building.name);
            }}
            selectedBuildingId={null}
          />
        )}

        {/* Paths */}
        {config.showPaths !== false && layout.paths.length > 0 && (
          <VirtualWorldPaths paths={layout.paths} />
        )}

        {/* Environmental objects (trees sway with wind, rocks affected by gravity) */}
        {config.showEnvironment !== false && environmentalObjects.length > 0 && (
          <EnvironmentalObjects objects={environmentalObjects} />
        )}

        {/* Render GLTF avatars (affected by gravity from dimension nodes, AI-enabled) */}
        {avatarConfigs.length > 0 ? avatarConfigs.map((avatar, index) => {
          // CRITICAL: Always use the calculated circle position from avatarConfigs
          // Don't override with agent's stored position - that causes all avatars to overlap
          const avatarPosition = avatar.position;
          
          // Debug: Log avatar rendering for React DevTools
          if (process.env.NODE_ENV === 'development' && index === 0) {
            console.log('[React DevTools] Rendering avatars:', {
              totalAvatars: avatarConfigs.length,
              totalAgents: agents.length,
              firstAvatar: {
                id: avatar.id,
                name: avatar.name,
                position: avatarPosition,
                hasGLTF: !!avatar.gltfUrl,
                scale: avatar.scale,
                enableAI: avatar.enableAI
              },
              allAvatars: avatarConfigs.map(a => ({
                id: a.id,
                name: a.name,
                position: a.position,
                hasGLTF: !!a.gltfUrl
              }))
            });
          }
          
          // Calculate nearby agents for AI decision making using avatar config positions
          const nearbyAgents = avatarConfigs
            .filter(a => a.id !== avatar.id)
            .map(a => ({
              id: a.id,
              position: a.position
            }));

          return (
            <EnhancedGLTFAvatar
              key={`avatar-${avatar.id}-${index}`}
              config={{
                ...avatar,
                position: avatarPosition, // Use calculated circle position
                enableAI: true, // Enable AI for all avatars
                nearbyAgents
              }}
              selected={selectedAgentId === avatar.id}
              onClick={() => handleAvatarClick(avatar)}
              onPositionUpdate={(id, newPosition) => {
                // Update agent position in collaborative world service
                const agent = agents.find(a => a.id === id);
                if (agent) {
                  agent.position = newPosition;
                  // Also update in collaborative world service
                  try {
                    const state = collaborativeWorldService.getState();
                    const serviceAgent = state.agents.get(id);
                    if (serviceAgent) {
                      serviceAgent.position = newPosition;
                    }
                  } catch (error) {
                    // Service not available
                  }
                  setAgents([...agents]);
                }
              }}
            />
          );
        }) : (
          // Show message if no avatars
          <group position={[0, 5, 0]}>
            <Text
              position={[0, 0, 0]}
              fontSize={0.5}
              color="#ff6b6b"
              anchorX="center"
              anchorY="middle"
            >
              No avatars available
            </Text>
            <Text
              position={[0, -0.8, 0]}
              fontSize={0.3}
              color="#94a3b8"
              anchorX="center"
              anchorY="middle"
            >
              Agents: {agents.length}
            </Text>
          </group>
        )}

        {/* Render interactions */}
        {config.enableInteractions && (
          <InteractionVisualization agents={agents} />
        )}

        {/* Render knowledge graph */}
        {config.enableLearning && config.showKnowledgeGraph && (
          <KnowledgeGraphVisualization />
        )}

        {/* Mini-Map */}
        <MiniMap
          config={{
            enabled: true,
            position: 'top-right',
            size: 200,
            zoom: 2,
            showZones: true,
            showBuildings: true,
            showAvatars: true,
            showWaypoints: true,
            showPaths: true,
            currentPosition: selectedAgentId 
              ? agents.find(a => a.id === selectedAgentId)?.position 
              : undefined,
            followCamera: false
          }}
          worldSize={200}
        />

        <OrbitControls enableDamping dampingFactor={0.05} />
      </VirtualWorldScene>

      {/* Navigation UI - Teleport buttons and compass */}
      <NavigationUI
        waypoints={[
          // Add buildings as waypoints
          ...buildings.map(b => ({
            id: b.id,
            name: b.name,
            position: b.position,
            type: 'building' as const,
            zoneId: undefined
          })),
          // Add avatar positions as waypoints
          ...agents.map(a => ({
            id: `waypoint-${a.id}`,
            name: `Teleport to ${a.name}`,
            position: a.position,
            type: 'landmark' as const,
            zoneId: undefined
          }))
        ]}
        currentPosition={selectedAgentId 
          ? agents.find(a => a.id === selectedAgentId)?.position 
          : undefined}
        currentRotation={0}
        onWaypointClick={(waypoint) => {
          console.log('[CollaborativeWorld] Waypoint clicked:', waypoint.name);
        }}
        onTeleport={(position) => {
          console.log('[CollaborativeWorld] Teleporting to:', position);
          // If an avatar is selected, teleport the avatar
          if (selectedAgentId) {
            handleMoveAgentTo(position);
          } else {
            // Otherwise, just move camera (could be enhanced to move camera)
            console.log('[CollaborativeWorld] Camera teleport not yet implemented');
          }
        }}
        showCompass={true}
        showWaypointList={true}
        showTeleportMenu={true}
      />

      {/* Agent List - Collapsed into icon button */}
      {agents.length > 0 && !selectedAgentId && (
        <div className="absolute top-4 left-4 z-20">
          {showAgentList ? (
            <div className="bg-gray-900/95 backdrop-blur-sm rounded-lg text-white max-w-xs shadow-xl border border-gray-700">
              <div className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-lg font-bold">Select an Agent</h3>
                  <button
                    onClick={() => setShowAgentList(false)}
                    className="text-gray-400 hover:text-white transition-colors"
                    aria-label="Collapse agent list"
                  >
                    <ChevronUp className="w-5 h-5" />
                  </button>
                </div>
                <div className="space-y-2 max-h-64 overflow-y-auto custom-scrollbar">
                  {agents.map(agent => (
                    <button
                      key={agent.id}
                      onClick={() => {
                        handleAvatarClick({
                          id: agent.id,
                          name: agent.name,
                          position: agent.position,
                          dimension: agent.dimension,
                          status: 'online' as const,
                          animationState: agent.animationState,
                          showNameTag: true,
                          showStatusIndicator: true,
                          color: getDimensionColor(agent.dimension),
                          scale: 1
                        });
                        setShowAgentList(false); // Collapse after selection
                      }}
                      className="w-full text-left px-3 py-2 bg-gray-800 hover:bg-gray-700 rounded text-sm transition-colors"
                    >
                      <div className="font-semibold">{agent.name}</div>
                      <div className="text-xs text-gray-400">{agent.dimension}</div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setShowAgentList(true)}
              className="p-3 bg-gray-900/90 backdrop-blur-sm hover:bg-gray-800/90 rounded-lg transition-colors border border-gray-700 shadow-lg flex items-center gap-2"
              aria-label="Expand agent list"
              title={`${agents.length} Agents Available`}
            >
              <Bot className="w-5 h-5 text-blue-400" />
              <span className="text-sm font-semibold text-white">{agents.length}</span>
            </button>
          )}
        </div>
      )}

      {/* UI Overlay - Control Panel (opens automatically when avatar is clicked) */}
      {selectedAgentId && (
        <div className="absolute top-4 right-4 bg-gray-900/95 backdrop-blur-sm p-4 rounded-lg text-white max-w-sm z-30 shadow-2xl border-2 border-purple-500/50">
          <div className="flex items-start justify-between mb-3">
            <div>
              <h3 className="text-lg font-bold text-purple-300">
                {agents.find(a => a.id === selectedAgentId)?.name}
              </h3>
              <p className="text-xs text-gray-400 mt-1">Avatar Control Panel</p>
            </div>
            <button
              onClick={() => setSelectedAgentId(null)}
              className="text-gray-400 hover:text-white text-lg font-bold transition-colors"
              aria-label="Close control panel"
            >
              ✕
            </button>
          </div>
          <div className="text-sm mb-4">
            <div>Dimension: {agents.find(a => a.id === selectedAgentId)?.dimension}</div>
            <div>Learning: {agents.find(a => a.id === selectedAgentId)?.learningEnabled ? 'Enabled' : 'Disabled'}</div>
            <div>Position: {agents.find(a => a.id === selectedAgentId)?.position.join(', ')}</div>
          </div>
          <div className="flex flex-wrap gap-2 mb-4">
            <button
              onClick={() => handleCreateInteraction('touch', selectedAgentId)}
              className="px-3 py-1 bg-blue-600 rounded text-sm"
            >
              Touch
            </button>
            <button
              onClick={() => handleCreateInteraction('communicate', selectedAgentId)}
              className="px-3 py-1 bg-green-600 rounded text-sm"
            >
              Communicate
            </button>
            <button
              onClick={() => handleCreateInteraction('collaborate', selectedAgentId)}
              className="px-3 py-1 bg-purple-600 rounded text-sm"
            >
              Collaborate
            </button>
            <button
              onClick={() => handleCreateInteraction('learn', selectedAgentId)}
              className="px-3 py-1 bg-yellow-600 rounded text-sm"
            >
              Learn
            </button>
          </div>
          
          {/* Research Mode Toggle */}
          <div className="border-t border-gray-700 pt-3 mt-3 mb-3">
            <button
              onClick={() => {
                console.log('[CollaborativeWorld] Research Mode button clicked for agent:', selectedAgentId);
                setResearchMode(true);
              }}
              className="w-full px-3 py-2 bg-purple-600 hover:bg-purple-700 rounded text-sm flex items-center justify-center gap-2 transition-colors"
            >
              <Search className="w-4 h-4" />
              Enter Research Mode
            </button>
            <div className="text-xs text-gray-400 mt-1 text-center">
              Explore agent history & provenance
            </div>
          </div>

          {/* Movement Controls */}
          <div className="border-t border-gray-700 pt-3 mt-3">
            <div className="flex items-center gap-2 mb-2">
              <Move className="w-4 h-4" />
              <span className="text-sm font-semibold">Movement Controls</span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <div></div>
              <button
                onClick={() => handleMoveAgent('forward')}
                className="px-3 py-2 bg-indigo-600 hover:bg-indigo-700 rounded text-sm"
                title="Move Forward"
              >
                <ArrowUp className="w-4 h-4 mx-auto" />
              </button>
              <div></div>
              <button
                onClick={() => handleMoveAgent('left')}
                className="px-3 py-2 bg-indigo-600 hover:bg-indigo-700 rounded text-sm"
                title="Move Left"
              >
                <ArrowLeft className="w-4 h-4 mx-auto" />
              </button>
              <button
                onClick={() => setShowMovementControls(!showMovementControls)}
                className="px-3 py-2 bg-gray-700 hover:bg-gray-600 rounded text-sm"
                title="Toggle Controls"
              >
                <RotateCw className="w-4 h-4 mx-auto" />
              </button>
              <button
                onClick={() => handleMoveAgent('right')}
                className="px-3 py-2 bg-indigo-600 hover:bg-indigo-700 rounded text-sm"
                title="Move Right"
              >
                <ArrowRight className="w-4 h-4 mx-auto" />
              </button>
              <div></div>
              <button
                onClick={() => handleMoveAgent('backward')}
                className="px-3 py-2 bg-indigo-600 hover:bg-indigo-700 rounded text-sm"
                title="Move Backward"
              >
                <ArrowDown className="w-4 h-4 mx-auto" />
              </button>
              <div></div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export const CollaborativeWorldIntegration: React.FC<CollaborativeWorldIntegrationProps> = ({
  selectedSymbol,
  onSymbolSelect,
  agents: agentAPIAgents,
  agentsLoading: agentAPILoading,
  config = {
    enableInteractions: true,
    enableLearning: true,
    showKnowledgeGraph: true,
    showBuildings: true,
    showEnvironment: true,
    showPaths: true
  }
}) => {
  // React DevTools: Set display name for easier debugging
  CollaborativeWorldIntegration.displayName = 'CollaborativeWorldIntegration';
  
  // Debug logging for React DevTools
  if (process.env.NODE_ENV === 'development') {
    console.log('[React DevTools] CollaborativeWorldIntegration rendered with config:', config);
    console.log('[React DevTools] Agent API agents:', agentAPIAgents?.length || 0);
  }
  
  // Helper function to convert Agent API format to CollaborativeWorld format
  const convertAgentAPIToCollaborativeWorld = (apiAgent: import('@/services/agent-api/types').Agent, index: number): Agent => {
    // Arrange agents in a circle around the center
    const radius = 15;
    const angle = (index / (agentAPIAgents?.length || 1)) * Math.PI * 2;
    const x = Math.cos(angle) * radius;
    const z = Math.sin(angle) * radius;
    
    // Map interaction range based on dimension
    const getInteractionRangeFromDimension = (dimension?: string | null): PropagationLevel => {
      if (!dimension) return 'personal';
      const dim = parseInt(dimension.replace('D', ''));
      if (dim <= 1) return 'personal';
      if (dim <= 3) return 'local';
      if (dim <= 5) return 'global';
      return 'agentic';
    };
    
    return {
      id: apiAgent.id,
      name: apiAgent.name,
      dimension: (apiAgent.dimension || '0D') as '0D' | '1D' | '2D' | '3D' | '4D' | '5D' | '6D' | '7D',
      position: [x, 0, z] as [number, number, number],
      velocity: [0, 0, 0] as [number, number, number],
      rotation: [0, 0, 0] as [number, number, number],
      interactionRange: getInteractionRangeFromDimension(apiAgent.dimension),
      learningEnabled: true,
      isMoving: false,
      animationState: 'idle' as const
    };
  };
  
  // Initialize with empty array - will be populated by initialization
  const [agents, setAgents] = useState<Agent[]>([]);
  const [isInitialized, setIsInitialized] = useState(false);
  const [selectedAgentId, setSelectedAgentId] = useState<string | null>(null);
  
  // React DevTools: Log agents state changes
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      console.log('[React DevTools] Agents state updated:', {
        count: agents.length,
        agents: agents.map(a => ({ id: a.id, name: a.name, position: a.position }))
      });
    }
  }, [agents]);
  
  // Movement controls state
  const [showMovementControls, setShowMovementControls] = useState(false);
  
  // Research mode state
  const [researchMode, setResearchMode] = useState(false);
  
  // Agent list visibility state - collapsed by default
  const [showAgentList, setShowAgentList] = useState(false);

  // Generate buildings
  const buildings = useMemo<BuildingConfig[]>(() => [
    {
      id: 'building-1',
      name: 'Research Center',
      position: [10, 0, 10],
      size: [4, 6, 4],
      rotation: 0,
      color: '#4a5568',
      showLabel: true,
      interactive: true
    },
    {
      id: 'building-2',
      name: 'Agent Hub',
      position: [-10, 0, 10],
      size: [5, 5, 5],
      rotation: Math.PI / 4,
      color: '#6366f1',
      showLabel: true,
      interactive: true
    },
    {
      id: 'building-3',
      name: 'Knowledge Base',
      position: [0, 0, -15],
      size: [6, 8, 6],
      rotation: 0,
      color: '#22c55e',
      showLabel: true,
      interactive: true
    }
  ], []);

  // Generate environmental objects (trees, etc.)
  const environmentalObjects = useMemo<EnvironmentalObject[]>(() => {
    const objects: EnvironmentalObject[] = [];
    // Add trees around the world
    for (let i = 0; i < 50; i++) {
      const angle = (i / 50) * Math.PI * 2;
      const radius = 20 + Math.random() * 15;
      objects.push({
        id: `tree-${i}`,
        type: 'tree',
        position: [
          Math.cos(angle) * radius,
          0,
          Math.sin(angle) * radius
        ],
        scale: 0.8 + Math.random() * 0.4,
        rotation: Math.random() * Math.PI * 2,
        color: '#2d5016'
      });
    }
    // Add some rocks
    for (let i = 0; i < 20; i++) {
      const angle = (i / 20) * Math.PI * 2;
      const radius = 15 + Math.random() * 10;
      objects.push({
        id: `rock-${i}`,
        type: 'rock',
        position: [
          Math.cos(angle) * radius,
          0,
          Math.sin(angle) * radius
        ],
        scale: 0.5 + Math.random() * 0.5,
        rotation: Math.random() * Math.PI * 2,
        color: '#6b7280'
      });
    }
    return objects;
  }, []);

  useEffect(() => {
    let intervalId: NodeJS.Timeout | null = null;
    
    // Initialize physics service
    try {
      metaversePhysicsService.initialize();
    } catch (error) {
      console.warn('Failed to initialize physics service:', error);
    }

    // Initialize avatar AI service
    const initializeAI = async () => {
      try {
        await avatarAIService.initialize();
        console.log('[CollaborativeWorld] Avatar AI service initialized');
      } catch (error) {
        console.warn('Failed to initialize avatar AI service:', error);
      }
    };
    initializeAI();

    // If Agent API agents are provided, use those instead of loading from service
    if (agentAPIAgents && agentAPIAgents.length > 0) {
      console.log(`[CollaborativeWorld] Using ${agentAPIAgents.length} agents from Agent API`);
      console.log(`[CollaborativeWorld] Agent API agents:`, agentAPIAgents.map(a => ({ id: a.id, name: a.name, dimension: a.dimension })));
      
      // First, filter to only agents with dimensions
      const validAgents = agentAPIAgents.filter(a => a.dimension);
      console.log(`[CollaborativeWorld] Found ${validAgents.length} valid agents with dimensions`);
      
      if (validAgents.length === 0) {
        console.warn('[CollaborativeWorld] No valid agents with dimensions, falling back to service');
        // Fall through to service initialization
      } else {
        // Convert valid agents, using their index in the valid array for circle positioning
        const convertedAgents = validAgents.map((apiAgent, index) => {
          const converted = convertAgentAPIToCollaborativeWorld(apiAgent, index, validAgents.length);
          if (!converted) {
            console.error(`[CollaborativeWorld] Failed to convert agent ${apiAgent.id} - this should not happen`);
            return null;
          }
          return converted;
        }).filter((agent): agent is Agent => agent !== null);
        
        console.log(`[CollaborativeWorld] Converted ${convertedAgents.length} agents`);
        console.log(`[CollaborativeWorld] Converted agents:`, convertedAgents.map(a => ({ 
          id: a.id, 
          name: a.name, 
          dimension: a.dimension, 
          position: a.position 
        })));
        
        setAgents(convertedAgents);
        
        // Register all agents with AI service
        convertedAgents.forEach(async (agent) => {
          try {
            await avatarAIService.registerAvatar(agent);
            console.log(`[CollaborativeWorld] Registered Agent API avatar ${agent.id} with AI service`);
          } catch (error) {
            console.warn(`[CollaborativeWorld] Failed to register Agent API avatar ${agent.id}:`, error);
          }
        });
        
        setIsInitialized(true);
        console.log(`[CollaborativeWorld] Successfully initialized with ${convertedAgents.length} Agent API agents`);
        return; // Skip service initialization
      }
    }

    // Helper function to create default agents (used as fallback)
    const createDefaultAgents = (): Agent[] => [
      { id: 'agent-0D', dimension: '0D', name: '0D-Topology-Agent', position: [10, 0, 0], velocity: [0, 0, 0], rotation: [0, 0, 0], interactionRange: 'personal', learningEnabled: true, isMoving: false, animationState: 'idle' },
      { id: 'agent-1D', dimension: '1D', name: '1D-Temporal-Agent', position: [7.07, 0, 7.07], velocity: [0, 0, 0], rotation: [0, 0, 0], interactionRange: 'peer', learningEnabled: true, isMoving: false, animationState: 'idle' },
      { id: 'agent-2D', dimension: '2D', name: '2D-Structural-Agent', position: [0, 0, 10], velocity: [0, 0, 0], rotation: [0, 0, 0], interactionRange: 'local', learningEnabled: true, isMoving: false, animationState: 'idle' },
      { id: 'agent-3D', dimension: '3D', name: '3D-Algebraic-Agent', position: [-7.07, 0, 7.07], velocity: [0, 0, 0], rotation: [0, 0, 0], interactionRange: 'local', learningEnabled: true, isMoving: false, animationState: 'idle' },
      { id: 'agent-4D', dimension: '4D', name: '4D-Network-Agent', position: [-10, 0, 0], velocity: [0, 0, 0], rotation: [0, 0, 0], interactionRange: 'global', learningEnabled: true, isMoving: false, animationState: 'idle' },
      { id: 'agent-5D', dimension: '5D', name: '5D-Consensus-Agent', position: [-7.07, 0, -7.07], velocity: [0, 0, 0], rotation: [0, 0, 0], interactionRange: 'global', learningEnabled: true, isMoving: false, animationState: 'idle' },
      { id: 'agent-6D', dimension: '6D', name: '6D-Intelligence-Agent', position: [0, 0, -10], velocity: [0, 0, 0], rotation: [0, 0, 0], interactionRange: 'agentic', learningEnabled: true, isMoving: false, animationState: 'idle' },
      { id: 'agent-7D', dimension: '7D', name: '7D-Quantum-Agent', position: [7.07, 0, -7.07], velocity: [0, 0, 0], rotation: [0, 0, 0], interactionRange: 'agentic', learningEnabled: true, isMoving: false, animationState: 'idle' }
    ];

    // Initialize collaborative world
    const initialize = async () => {
      try {
        const { loadCollaborativeWorldFromCanvasL, collaborativeWorldService: cws, canvaslParser } = await import('@/services/collaborative-world');
        
        // Try to load CanvasL file, but don't fail if it doesn't exist
        let scriptLoaded = false;
        try {
          await loadCollaborativeWorldFromCanvasL('/ai-portal-agent-movement.canvasl');
          scriptLoaded = true;
          console.log('[CollaborativeWorld] Successfully loaded CanvasL file');
        } catch (error) {
          // Log the actual error details for debugging
          console.warn('[CollaborativeWorld] Failed to load CanvasL file, using default configuration:', {
            error,
            errorType: error?.constructor?.name,
            errorMessage: error?.message,
            errorStack: error?.stack
          });
        }
        
        // If CanvasL file didn't load, use default configuration
        if (!scriptLoaded) {
          try {
            const defaultScript = await canvaslParser.parseScript(`@version: "1.0"
@schema: "canvasl-v1"
@r5rs-engine: "r5rs-canvas-engine.scm"
@dimension: "4D-6D"
@phase: "ai-portal-collaborative-world"

{"id":"agent-0D","type":"agent","dimension":"0D","name":"0D-Topology-Agent","position":[10,0,0],"velocity":[0,0,0],"interactionRange":"personal","learningEnabled":true}
{"id":"agent-1D","type":"agent","dimension":"1D","name":"1D-Temporal-Agent","position":[7.07,0,7.07],"velocity":[0,0,0],"interactionRange":"peer","learningEnabled":true}
{"id":"agent-2D","type":"agent","dimension":"2D","name":"2D-Structural-Agent","position":[0,0,10],"velocity":[0,0,0],"interactionRange":"local","learningEnabled":true}
{"id":"agent-3D","type":"agent","dimension":"3D","name":"3D-Algebraic-Agent","position":[-7.07,0,7.07],"velocity":[0,0,0],"interactionRange":"local","learningEnabled":true}
{"id":"agent-4D","type":"agent","dimension":"4D","name":"4D-Network-Agent","position":[-10,0,0],"velocity":[0,0,0],"interactionRange":"global","learningEnabled":true}
{"id":"agent-5D","type":"agent","dimension":"5D","name":"5D-Consensus-Agent","position":[-7.07,0,-7.07],"velocity":[0,0,0],"interactionRange":"global","learningEnabled":true}
{"id":"agent-6D","type":"agent","dimension":"6D","name":"6D-Intelligence-Agent","position":[0,0,-10],"velocity":[0,0,0],"interactionRange":"agentic","learningEnabled":true}
{"id":"agent-7D","type":"agent","dimension":"7D","name":"7D-Quantum-Agent","position":[7.07,0,-7.07],"velocity":[0,0,0],"interactionRange":"agentic","learningEnabled":true}`);
            await cws.initialize(defaultScript);
            console.log('[CollaborativeWorld] Successfully initialized with default script');
          } catch (initError) {
            console.error('[CollaborativeWorld] Failed to initialize with default script:', {
              error: initError,
              errorType: initError?.constructor?.name,
              errorMessage: initError?.message,
              errorStack: initError?.stack
            });
            // Don't throw - use fallback agents instead
          }
        }
        
        // Get initial state - with comprehensive error handling
        let initialAgents: Agent[] = [];
        let gotState = false;
        try {
          const state = cws.getState();
          initialAgents = Array.from(state.agents.values());
          gotState = true;
          console.log(`[CollaborativeWorld] Got ${initialAgents.length} agents from service state`);
        } catch (stateError) {
          console.warn('[CollaborativeWorld] Failed to get state from service, using fallback:', {
            error: stateError,
            errorType: stateError?.constructor?.name,
            errorMessage: stateError?.message
          });
        }
        
        // Use agents from state, or fallback to default agents
        // IMPORTANT: Always ensure we have at least 8 agents (one per dimension)
        const agentsToUse = initialAgents.length >= 8 ? initialAgents : createDefaultAgents();
        
        // Log detailed agent information
        console.log(`[CollaborativeWorld] Initial agents from service: ${initialAgents.length}`);
        console.log(`[CollaborativeWorld] Agents to use: ${agentsToUse.length}`);
        console.log(`[CollaborativeWorld] Agent IDs:`, agentsToUse.map(a => `${a.id} (${a.name})`));
        console.log(`[CollaborativeWorld] Agent details:`, agentsToUse.map(a => ({
          id: a.id,
          name: a.name,
          dimension: a.dimension,
          position: a.position
        })));
        
        setAgents(agentsToUse);
        
        // Register all agents with AI service
        for (const agent of agentsToUse) {
          try {
            await avatarAIService.registerAvatar(agent);
            console.log(`[CollaborativeWorld] Registered avatar ${agent.id} with AI service`);
          } catch (error) {
            console.warn(`[CollaborativeWorld] Failed to register avatar ${agent.id}:`, error);
          }
        }
        
        setIsInitialized(true);
        console.log(`[CollaborativeWorld] Successfully initialized with ${agentsToUse.length} agents`);
        
        // Update loop - sync with movement service (only if service is available)
        // Only run update loop if we're using service agents (8+), otherwise skip to preserve our 8 agents
        if (agentsToUse.length >= 8 && gotState && initialAgents.length >= 8) {
          intervalId = setInterval(async () => {
            try {
              // Try to get service, but don't fail if it's not available
              let cws;
              try {
                const module = await import('@/services/collaborative-world');
                cws = module.collaborativeWorldService;
              } catch {
                return; // Service not available, skip update
              }
              if (!cws) return;
              
              const currentState = cws.getState();
              const serviceAgents = Array.from(currentState.agents.values());
              
              // Only update if service has 8+ agents
              if (serviceAgents.length >= 8) {
                setAgents(serviceAgents);
              }
              // Otherwise, don't update - preserve our 8 agents
            } catch (error) {
              // Service not initialized or not available - continue with current agents
              // This is expected if service initialization failed
            }
          }, 100);
        } else {
          console.log(`[CollaborativeWorld] Skipping update loop - using ${agentsToUse.length} fallback agents (service had ${initialAgents.length})`);
        }
      } catch (error) {
        console.error('[CollaborativeWorld] Failed to initialize collaborative world:', {
          error,
          errorType: error?.constructor?.name,
          errorMessage: error?.message,
          errorStack: error?.stack
        });
        
        // Create fallback agents if initialization completely failed
        const fallbackAgents = createDefaultAgents();
        setAgents(fallbackAgents);
        console.log(`[CollaborativeWorld] Created ${fallbackAgents.length} fallback agents due to initialization failure`);
        
        // Register fallback agents with AI service
        for (const agent of fallbackAgents) {
          try {
            await avatarAIService.registerAvatar(agent);
            console.log(`[CollaborativeWorld] Registered fallback avatar ${agent.id} with AI service`);
          } catch (regError) {
            console.warn(`[CollaborativeWorld] Failed to register fallback avatar ${agent.id}:`, regError);
          }
        }
      }
      
      // Ensure we're initialized even if everything failed
      setIsInitialized(true);
      console.log('[CollaborativeWorld] Initialization attempt complete');
    };

    // Only initialize from service if Agent API agents are not provided
    if (!agentAPIAgents || agentAPIAgents.length === 0) {
      initialize();
    }

    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
      try {
        metaversePhysicsService.destroy();
      } catch (error) {
        // Ignore cleanup errors
      }
    };
  }, [agentAPIAgents, agentAPILoading]); // Re-run if Agent API agents change

  if (!isInitialized || agentAPILoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-white">
          {agentAPILoading ? 'Loading agents from API...' : 'Initializing Collaborative World...'}
        </div>
      </div>
    );
  }

  // Show research mode panel if enabled
  if (researchMode && selectedAgentId) {
    console.log('[CollaborativeWorld] Entering Research Mode for agent:', selectedAgentId);
    return (
      <ResearchModePanel
        agentId={selectedAgentId}
        onClose={() => {
          console.log('[CollaborativeWorld] Exiting Research Mode');
          setResearchMode(false);
        }}
      />
    );
  }

  return (
    <div className="relative w-full h-full">
      <WorldLayoutProvider>
        <CollaborativeWorldContent
          selectedSymbol={selectedSymbol}
          onSymbolSelect={onSymbolSelect}
          config={config}
          agents={agents}
          setAgents={setAgents}
          isInitialized={isInitialized}
          selectedAgentId={selectedAgentId}
          setSelectedAgentId={setSelectedAgentId}
          showMovementControls={showMovementControls}
          setShowMovementControls={setShowMovementControls}
          researchMode={researchMode}
          setResearchMode={setResearchMode}
          buildings={buildings}
          environmentalObjects={environmentalObjects}
          showAgentList={showAgentList}
          setShowAgentList={setShowAgentList}
        />
      </WorldLayoutProvider>
    </div>
  );
};

