/**
 * Enhanced GLTF Avatar Component
 * Renders GLTF models with animations, name tags, and status indicators
 */

import React, { useRef, useState, useEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { useGLTF, Text, Html } from '@react-three/drei';
import * as THREE from 'three';
import { AvatarAnimationController } from './AvatarAnimationController';
import { useGravityAt } from '@/hooks/useMetaversePhysics';
import { avatarAIService, ConversationMessage } from '@/services/avatar-ai-service';

export interface AvatarConfig {
  id: string;
  gltfUrl?: string;
  position: [number, number, number];
  name: string;
  status?: 'online' | 'offline' | 'away';
  animationState?: 'idle' | 'walking' | 'gesturing';
  showNameTag?: boolean;
  showStatusIndicator?: boolean;
  dimension?: string; // e.g., "0D", "1D", etc.
  color?: string; // Avatar color theme
  scale?: number; // Avatar scale (default: 1)
  enableAI?: boolean; // Enable AI-driven autonomous behavior
  nearbyAgents?: Array<{ id: string; position: [number, number, number] }>; // For AI decision making
}

interface EnhancedGLTFAvatarProps {
  config: AvatarConfig;
  selected?: boolean;
  onClick?: () => void;
  onHover?: (hovered: boolean) => void;
  onPositionUpdate?: (id: string, position: [number, number, number]) => void; // Callback for AI-driven movement
}

export const EnhancedGLTFAvatar: React.FC<EnhancedGLTFAvatarProps> = ({
  config,
  selected = false,
  onClick,
  onHover,
  onPositionUpdate
}) => {
  // React DevTools: Set display name for easier debugging
  EnhancedGLTFAvatar.displayName = `EnhancedGLTFAvatar(${config.name || config.id})`;
  
  // Debug logging for React DevTools inspection
  if (process.env.NODE_ENV === 'development') {
    console.log(`[React DevTools] EnhancedGLTFAvatar rendered:`, {
      id: config.id,
      name: config.name,
      position: config.position,
      dimension: config.dimension,
      hasGLTF: !!config.gltfUrl,
      gltfUrl: config.gltfUrl,
      enableAI: config.enableAI,
      scale: config.scale
    });
  }
  const groupRef = useRef<THREE.Group>(null);
  const [hovered, setHovered] = useState(false);
  const [gltfLoaded, setGltfLoaded] = useState(false);
  const [gltfError, setGltfError] = useState<string | null>(null);
  const [currentPosition, setCurrentPosition] = useState<[number, number, number]>(config.position);
  const [conversationBubble, setConversationBubble] = useState<ConversationMessage | null>(null);
  const [learningIndicator, setLearningIndicator] = useState(false);
  const [aiAnimationState, setAiAnimationState] = useState<'idle' | 'walking' | 'gesturing'>(config.animationState || 'idle');
  const lastDecisionTime = useRef<number>(0);
  const movementTarget = useRef<[number, number, number] | null>(null);

  // Register avatar with raycasting system
  useEffect(() => {
    if (groupRef.current && (window as any).__registerAvatarRef) {
      (window as any).__registerAvatarRef(config.id, groupRef.current);
    }
    return () => {
      if ((window as any).__registerAvatarRef) {
        (window as any).__registerAvatarRef(config.id, null);
      }
    };
  }, [config.id, gltfLoaded]);

  const {
    gltfUrl,
    position,
    name,
    status = 'online',
    animationState = 'idle',
    showNameTag = true,
    showStatusIndicator = true,
    dimension,
    color = '#6366f1',
    scale = 1
  } = config;

  // Load GLTF model
  let gltf: any = null;
  if (gltfUrl) {
    try {
      gltf = useGLTF(gltfUrl, true); // true = useDraco
      if (gltf && !gltfLoaded) {
        setGltfLoaded(true);
      }
    } catch (error) {
      if (!gltfError) {
        setGltfError(error instanceof Error ? error.message : 'Failed to load GLTF');
        console.error('GLTF load error:', error);
      }
    }
  }

  // Get gravity at avatar position
  const gravity = useGravityAt(currentPosition);

  // AI-driven autonomous behavior
  useEffect(() => {
    if (!config.enableAI) return;

    const aiLoop = async () => {
      const now = Date.now();
      const timeSinceLastDecision = now - lastDecisionTime.current;

      // Make decision every 2-5 seconds
      if (timeSinceLastDecision > 2000 + Math.random() * 3000) {
        try {
          // Calculate nearby agents
          const nearbyAgents = (config.nearbyAgents || []).map(agent => {
            const dx = agent.position[0] - currentPosition[0];
            const dy = agent.position[1] - currentPosition[1];
            const dz = agent.position[2] - currentPosition[2];
            const distance = Math.sqrt(dx * dx + dy * dy + dz * dz);
            return { ...agent, distance };
          }).filter(a => a.distance < 20).sort((a, b) => a.distance - b.distance);

          const decision = await avatarAIService.makeDecision(config.id, {
            position: currentPosition,
            nearbyAgents,
            nearbyObjects: [],
            timeSinceLastAction: timeSinceLastDecision
          });

          lastDecisionTime.current = now;

          // Execute decision
          if (decision.action === 'move' && decision.target?.direction) {
            const direction = decision.target.direction;
            const moveDistance = 2;
            let newPosition: [number, number, number] = [...currentPosition];
            
            switch (direction) {
              case 'forward':
                newPosition[2] -= moveDistance;
                break;
              case 'backward':
                newPosition[2] += moveDistance;
                break;
              case 'left':
                newPosition[0] -= moveDistance;
                break;
              case 'right':
                newPosition[0] += moveDistance;
                break;
            }
            
            movementTarget.current = newPosition;
            setAiAnimationState('walking');
          } else if (decision.action === 'explore' && decision.target?.position) {
            movementTarget.current = decision.target.position;
            setAiAnimationState('walking');
          } else if (decision.action === 'converse' && decision.target?.agentId) {
            const message = await avatarAIService.generateConversation(
              config.id,
              decision.target.agentId
            );
            setConversationBubble(message);
            setAiAnimationState('gesturing');
            setTimeout(() => setConversationBubble(null), 5000);
          } else if (decision.action === 'learn') {
            setLearningIndicator(true);
            setTimeout(() => setLearningIndicator(false), 2000);
          } else if (decision.action === 'idle') {
            setAiAnimationState('idle');
          }
        } catch (error) {
          console.error(`[AvatarAI] Error making decision for ${config.id}:`, error);
        }
      }

      // Move towards target
      if (movementTarget.current && groupRef.current) {
        const dx = movementTarget.current[0] - currentPosition[0];
        const dy = movementTarget.current[1] - currentPosition[1];
        const dz = movementTarget.current[2] - currentPosition[2];
        const distance = Math.sqrt(dx * dx + dy * dy + dz * dz);

        if (distance > 0.1) {
          const speed = 0.05;
          const newPos: [number, number, number] = [
            currentPosition[0] + (dx / distance) * speed,
            currentPosition[1] + (dy / distance) * speed,
            currentPosition[2] + (dz / distance) * speed
          ];
          setCurrentPosition(newPos);
          if (onPositionUpdate) {
            onPositionUpdate(config.id, newPos);
          }
        } else {
          movementTarget.current = null;
          setAiAnimationState('idle');
        }
      }
    };

    const interval = setInterval(aiLoop, 100);
    return () => clearInterval(interval);
  }, [config.enableAI, config.id, config.nearbyAgents, currentPosition, onPositionUpdate]);

  // Listen for conversations from other avatars
  useEffect(() => {
    if (!config.enableAI) return;

    const checkConversations = () => {
      const conversations = avatarAIService.getConversations(config.id);
      const recentConversation = conversations
        .filter(c => Date.now() - c.timestamp < 5000)
        .sort((a, b) => b.timestamp - a.timestamp)[0];

      if (recentConversation && recentConversation.from !== config.id) {
        setConversationBubble(recentConversation);
        setAiAnimationState('gesturing');
        setTimeout(() => {
          setConversationBubble(null);
          setAiAnimationState('idle');
        }, 5000);
      }
    };

    const interval = setInterval(checkConversations, 1000);
    return () => clearInterval(interval);
  }, [config.enableAI, config.id]);

  // Animation and interaction
  useFrame((state) => {
    if (groupRef.current) {
      // Use current position (updated by AI if enabled)
      const displayPosition = config.enableAI ? currentPosition : position;
      
      // Apply gravity physics (subtle effect on position)
      const gravityEffect = gravity[1] * 0.001; // Subtle vertical pull
      const baseY = displayPosition[1] + gravityEffect;
      
      // Use AI animation state if AI is enabled
      const effectiveAnimationState = config.enableAI ? aiAnimationState : animationState;
      
      // Gentle floating animation for idle (affected by gravity)
      if (effectiveAnimationState === 'idle') {
        groupRef.current.position.y = baseY + Math.sin(state.clock.elapsedTime * 0.5) * 0.1;
      } else {
        groupRef.current.position.y = baseY;
      }

      // Update position
      groupRef.current.position.x = displayPosition[0];
      groupRef.current.position.z = displayPosition[2];

      // Subtle tilt based on gravity direction (for dimension node attraction)
      if (Math.abs(gravity[0]) > 0.1 || Math.abs(gravity[2]) > 0.1) {
        const tiltX = gravity[0] * 0.01;
        const tiltZ = gravity[2] * 0.01;
        groupRef.current.rotation.x = tiltZ;
        groupRef.current.rotation.z = -tiltX;
      }

      // Selection pulsing
      if (selected) {
        const pulseScale = 1 + Math.sin(state.clock.elapsedTime * 3) * 0.05;
        groupRef.current.scale.setScalar(scale * pulseScale);
      } else {
        groupRef.current.scale.setScalar(scale);
      }
    }
  });

  const handlePointerOver = () => {
    setHovered(true);
    if (onHover) onHover(true);
  };

  const handlePointerOut = () => {
    setHovered(false);
    if (onHover) onHover(false);
  };

  // Render GLTF model or fallback
  const renderAvatar = () => {
    if (gltf && gltf.scene && gltfLoaded) {
      const clonedScene = gltf.scene.clone();
      
      return (
        <group>
          <primitive object={clonedScene} />
          <AvatarAnimationController
            scene={clonedScene}
            animationState={animationState}
            gltf={gltf}
          />
        </group>
      );
    }

    // Fallback avatar
    return <DefaultAvatar color={color} dimension={dimension} />;
  };

  const statusColor = {
    online: '#10b981',
    offline: '#6b7280',
    away: '#f59e0b'
  }[status];

  // Drag and drop state
  const [dragging, setDragging] = useState(false);
  const dragStartPos = useRef<[number, number, number] | null>(null);
  const { camera, raycaster, pointer } = useThree();

  // Handle drag start
  const handlePointerDown = (e: any) => {
    e.stopPropagation();
    if (e.button === 0) { // Left mouse button
      setDragging(true);
      dragStartPos.current = [...currentPosition] as [number, number, number];
    }
  };

  // Handle drag
  useFrame(() => {
    if (dragging && dragStartPos.current) {
      // Use raycaster to project pointer onto ground plane (y=0)
      raycaster.setFromCamera(pointer, camera);
      const plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
      const intersection = new THREE.Vector3();
      raycaster.ray.intersectPlane(plane, intersection);
      
      if (intersection) {
        const newPosition: [number, number, number] = [
          intersection.x,
          currentPosition[1], // Keep Y position
          intersection.z
        ];
        setCurrentPosition(newPosition);
        if (onPositionUpdate) {
          onPositionUpdate(config.id, newPosition);
        }
      }
    }
  });

  // Handle drag end
  useEffect(() => {
    const handlePointerUp = () => {
      if (dragging) {
        setDragging(false);
        dragStartPos.current = null;
      }
    };

    if (dragging) {
      window.addEventListener('pointerup', handlePointerUp);
      return () => window.removeEventListener('pointerup', handlePointerUp);
    }
  }, [dragging]);

  return (
    <group
      ref={groupRef}
      position={currentPosition}
      onClick={onClick}
      onPointerOver={handlePointerOver}
      onPointerOut={handlePointerOut}
      onPointerDown={handlePointerDown}
    >
      {/* Avatar model */}
      {renderAvatar()}

      {/* Name tag */}
      {showNameTag && name && (
        <group position={[0, 2.5, 0]}>
          <Text
            position={[0, 0, 0]}
            fontSize={0.3}
            color="white"
            anchorX="center"
            anchorY="middle"
            outlineWidth={0.02}
            outlineColor="#000000"
            maxWidth={5}
          >
            {String(name)}
          </Text>
          
          {/* Dimension label */}
          {dimension && (
            <Text
              position={[0, -0.4, 0]}
              fontSize={0.2}
              color={color}
              anchorX="center"
              anchorY="middle"
            >
              {String(dimension)}
            </Text>
          )}
        </group>
      )}

      {/* Status indicator */}
      {showStatusIndicator && (
        <mesh position={[0, 2, 0]}>
          <sphereGeometry args={[0.15, 8, 8]} />
          <meshBasicMaterial color={statusColor} />
        </mesh>
      )}

      {/* Selection ring */}
      {selected && (
        <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 0.1, 0]}>
          <ringGeometry args={[1.2, 1.3, 32]} />
          <meshBasicMaterial color={color} side={THREE.DoubleSide} transparent opacity={0.6} />
        </mesh>
      )}

      {/* Hover highlight */}
      {hovered && !selected && (
        <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 0.1, 0]}>
          <ringGeometry args={[1.1, 1.15, 32]} />
          <meshBasicMaterial color="#ffffff" side={THREE.DoubleSide} transparent opacity={0.3} />
        </mesh>
      )}

      {/* Conversation bubble */}
      {conversationBubble && conversationBubble.message && (
        <Html
          position={[0, 3, 0]}
          center
          distanceFactor={10}
          style={{
            pointerEvents: 'none',
            userSelect: 'none'
          }}
        >
          <div className="bg-black/80 text-white px-3 py-2 rounded-lg text-sm max-w-xs shadow-lg border border-white/20">
            <div className="font-semibold text-xs mb-1 opacity-70">
              {conversationBubble.type === 'greeting' ? '👋' : 
               conversationBubble.type === 'question' ? '❓' :
               conversationBubble.type === 'statement' ? '💬' : '💭'}
            </div>
            <div>{String(conversationBubble.message)}</div>
            <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-8 border-r-8 border-t-8 border-transparent border-t-black/80"></div>
          </div>
        </Html>
      )}

      {/* Learning indicator */}
      {learningIndicator && (
        <group position={[0, 2.5, 0]}>
          <mesh>
            <sphereGeometry args={[0.2, 8, 8]} />
            <meshBasicMaterial color="#fbbf24" transparent opacity={0.8} />
          </mesh>
          <Text
            position={[0, 0.4, 0]}
            fontSize={0.15}
            color="#fbbf24"
            anchorX="center"
            anchorY="middle"
          >
            ✨ Learning
          </Text>
        </group>
      )}

      {/* AI indicator */}
      {config.enableAI && (
        <mesh position={[0, 1.8, 0]}>
          <sphereGeometry args={[0.1, 8, 8]} />
          <meshStandardMaterial color="#10b981" emissive="#10b981" emissiveIntensity={0.5} />
        </mesh>
      )}
    </group>
  );
};

// Default avatar fallback
const DefaultAvatar: React.FC<{
  color?: string;
  dimension?: string;
}> = ({ color = '#6366f1', dimension }) => {
  const meshRef = useRef<THREE.Group>(null);

  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.y = state.clock.elapsedTime * 0.3;
    }
  });

  return (
    <group ref={meshRef}>
      {/* Body */}
      <mesh>
        <boxGeometry args={[0.8, 1.6, 0.4]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={0.2}
          roughness={0.3}
          metalness={0.7}
        />
      </mesh>
      
      {/* Head */}
      <mesh position={[0, 1.1, 0]}>
        <sphereGeometry args={[0.35, 16, 16]} />
        <meshStandardMaterial
          color="#fbbf24"
          roughness={0.5}
        />
      </mesh>
      
      {/* Dimension indicator on chest */}
      {dimension && (
        <mesh position={[0, 0.3, 0.25]}>
          <planeGeometry args={[0.4, 0.4]} />
          <meshBasicMaterial color={color} />
        </mesh>
      )}
    </group>
  );
};
