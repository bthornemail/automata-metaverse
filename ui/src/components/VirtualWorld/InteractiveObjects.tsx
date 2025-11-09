/**
 * Interactive Environmental Objects
 * Objects that can be interacted with (benches, lamps, fountains, etc.)
 */

import React, { useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { useGLTF, Text } from '@react-three/drei';
import * as THREE from 'three';
import { EnvironmentalObject } from './EnvironmentalObjects';

export type InteractiveObjectType = 
  | 'bench'
  | 'lamp'
  | 'fountain'
  | 'sign'
  | 'table'
  | 'chair'
  | 'trash_can'
  | 'mailbox'
  | 'vending_machine'
  | 'atm';

export interface InteractiveObjectConfig extends EnvironmentalObject {
  type: InteractiveObjectType;
  interactive?: boolean;
  state?: 'on' | 'off' | 'open' | 'closed' | 'idle' | 'active';
  onClick?: () => void;
  onInteract?: (objectId: string) => void;
  metadata?: {
    description?: string;
    capacity?: number;
    occupants?: string[];
  };
}

interface InteractiveObjectsProps {
  objects: InteractiveObjectConfig[];
  onObjectClick?: (object: InteractiveObjectConfig) => void;
}

export const InteractiveObjects: React.FC<InteractiveObjectsProps> = ({
  objects,
  onObjectClick
}) => {
  return (
    <>
      {objects.map(obj => (
        <InteractiveObjectRenderer
          key={obj.id}
          object={obj}
          onClick={() => {
            obj.onClick?.();
            onObjectClick?.(obj);
          }}
        />
      ))}
    </>
  );
};

// Interactive object renderer
const InteractiveObjectRenderer: React.FC<{
  object: InteractiveObjectConfig;
  onClick: () => void;
}> = ({ object, onClick }) => {
  const meshRef = useRef<THREE.Group>(null);
  const [hovered, setHovered] = useState(false);
  const [state, setState] = useState(object.state || 'idle');

  const {
    type,
    position,
    scale = 1,
    rotation = 0,
    gltfModel,
    color,
    interactive = true,
    metadata
  } = object;

  // Load GLTF if provided
  let gltf: any = null;
  if (gltfModel) {
    try {
      gltf = useGLTF(gltfModel, true);
    } catch (error) {
      console.error('Failed to load interactive object GLTF:', error);
    }
  }

  // Animate based on type and state
  useFrame((state) => {
    if (meshRef.current) {
      switch (type) {
        case 'lamp':
          if (object.state === 'on') {
            // Pulsing light
            const intensity = 0.5 + Math.sin(state.clock.elapsedTime * 2) * 0.1;
            meshRef.current.children.forEach((child: any) => {
              if (child.material && child.material.emissive) {
                child.material.emissiveIntensity = intensity;
              }
            });
          }
          break;
        case 'fountain':
          if (object.state === 'active') {
            // Rotating fountain
            meshRef.current.rotation.y = state.clock.elapsedTime * 0.2;
          }
          break;
      }
    }
  });

  const handleClick = () => {
    if (interactive) {
      // Toggle state
      if (type === 'lamp') {
        setState(state === 'on' ? 'off' : 'on');
      } else if (type === 'bench' || type === 'chair') {
        setState(state === 'occupied' ? 'idle' : 'occupied');
      }
      onClick();
    }
  };

  // Render GLTF or procedural object
  if (gltf && gltf.scene) {
    const clonedScene = gltf.scene.clone();
    clonedScene.scale.setScalar(scale);
    return (
      <group
        ref={meshRef}
        position={position}
        rotation={[0, rotation, 0]}
        onClick={handleClick}
        onPointerOver={() => setHovered(true)}
        onPointerOut={() => setHovered(false)}
      >
        <primitive object={clonedScene} />
        {hovered && interactive && (
          <Text
            position={[0, 1, 0]}
            fontSize={0.2}
            color="#fbbf24"
            anchorX="center"
            anchorY="middle"
          >
            Click to interact
          </Text>
        )}
      </group>
    );
  }

  // Procedural interactive objects
  return (
    <group
      ref={meshRef}
      position={position}
      rotation={[0, rotation, 0]}
      onClick={handleClick}
      onPointerOver={() => setHovered(true)}
      onPointerOut={() => setHovered(false)}
    >
      {type === 'bench' && <ProceduralBench scale={scale} state={state} color={color} />}
      {type === 'lamp' && <ProceduralLamp scale={scale} state={state} color={color} />}
      {type === 'fountain' && <ProceduralFountain scale={scale} state={state} color={color} />}
      {type === 'sign' && <ProceduralSign scale={scale} state={state} color={color} />}
      {type === 'table' && <ProceduralTable scale={scale} state={state} color={color} />}
      {type === 'chair' && <ProceduralChair scale={scale} state={state} color={color} />}
      
      {/* Interaction indicator */}
      {hovered && interactive && (
        <mesh position={[0, 1, 0]}>
          <ringGeometry args={[0.5, 0.6, 16]} />
          <meshBasicMaterial color="#fbbf24" transparent opacity={0.6} side={THREE.DoubleSide} />
        </mesh>
      )}

      {/* Description */}
      {metadata?.description && hovered && (
        <Text
          position={[0, 1.5, 0]}
          fontSize={0.2}
          color="white"
          anchorX="center"
          anchorY="middle"
          outlineWidth={0.01}
          outlineColor="#000000"
          maxWidth={3}
        >
          {metadata.description}
        </Text>
      )}
    </group>
  );
};

// Procedural bench
const ProceduralBench: React.FC<{ scale: number; state: string; color?: string }> = ({ scale, state, color = '#8b4513' }) => {
  return (
    <group scale={scale}>
      {/* Seat */}
      <mesh position={[0, 0.3, 0]} castShadow>
        <boxGeometry args={[2, 0.2, 0.5]} />
        <meshStandardMaterial color={color} />
      </mesh>
      {/* Back */}
      <mesh position={[0, 0.6, -0.2]} castShadow>
        <boxGeometry args={[2, 0.6, 0.1]} />
        <meshStandardMaterial color={color} />
      </mesh>
      {/* Legs */}
      {[-0.8, 0.8].map(x => (
        <mesh key={x} position={[x, 0.15, 0]} castShadow>
          <boxGeometry args={[0.1, 0.3, 0.1]} />
          <meshStandardMaterial color={color} />
        </mesh>
      ))}
    </group>
  );
};

// Procedural lamp
const ProceduralLamp: React.FC<{ scale: number; state: string; color?: string }> = ({ scale, state, color = '#ffd700' }) => {
  const isOn = state === 'on';
  return (
    <group scale={scale}>
      {/* Pole */}
      <mesh position={[0, 1, 0]} castShadow>
        <cylinderGeometry args={[0.05, 0.05, 2, 8]} />
        <meshStandardMaterial color="#4a5568" />
      </mesh>
      {/* Light */}
      <mesh position={[0, 2.2, 0]} castShadow>
        <sphereGeometry args={[0.3, 16, 16]} />
        <meshStandardMaterial
          color={isOn ? color : '#6b7280'}
          emissive={isOn ? color : '#000000'}
          emissiveIntensity={isOn ? 0.8 : 0}
        />
      </mesh>
      {/* Light cone */}
      {isOn && (
        <mesh position={[0, 2, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <coneGeometry args={[0.5, 1, 8]} />
          <meshBasicMaterial color={color} transparent opacity={0.2} />
        </mesh>
      )}
    </group>
  );
};

// Procedural fountain
const ProceduralFountain: React.FC<{ scale: number; state: string; color?: string }> = ({ scale, state, color = '#3b82f6' }) => {
  const isActive = state === 'active';
  return (
    <group scale={scale}>
      {/* Base */}
      <mesh position={[0, 0.2, 0]} castShadow>
        <cylinderGeometry args={[1, 1, 0.4, 16]} />
        <meshStandardMaterial color="#4a5568" />
      </mesh>
      {/* Center */}
      <mesh position={[0, 0.8, 0]} castShadow>
        <cylinderGeometry args={[0.3, 0.3, 0.6, 16]} />
        <meshStandardMaterial color={color} />
      </mesh>
      {/* Water effect */}
      {isActive && (
        <mesh position={[0, 1.1, 0]}>
          <sphereGeometry args={[0.2, 16, 16]} />
          <meshBasicMaterial color={color} transparent opacity={0.6} />
        </mesh>
      )}
    </group>
  );
};

// Procedural sign
const ProceduralSign: React.FC<{ scale: number; state: string; color?: string }> = ({ scale, state, color = '#ffffff' }) => {
  return (
    <group scale={scale}>
      {/* Post */}
      <mesh position={[0, 0.5, 0]} castShadow>
        <cylinderGeometry args={[0.05, 0.05, 1, 8]} />
        <meshStandardMaterial color="#4a5568" />
      </mesh>
      {/* Sign board */}
      <mesh position={[0, 1.2, 0]} castShadow>
        <boxGeometry args={[1, 0.6, 0.05]} />
        <meshStandardMaterial color={color} />
      </mesh>
    </group>
  );
};

// Procedural table
const ProceduralTable: React.FC<{ scale: number; state: string; color?: string }> = ({ scale, state, color = '#8b4513' }) => {
  return (
    <group scale={scale}>
      {/* Tabletop */}
      <mesh position={[0, 0.4, 0]} castShadow>
        <boxGeometry args={[1.5, 0.1, 1]} />
        <meshStandardMaterial color={color} />
      </mesh>
      {/* Legs */}
      {[-0.6, 0.6].map(x => (
        [-0.4, 0.4].map(z => (
          <mesh key={`${x}-${z}`} position={[x, 0.2, z]} castShadow>
            <boxGeometry args={[0.1, 0.4, 0.1]} />
            <meshStandardMaterial color={color} />
          </mesh>
        ))
      ))}
    </group>
  );
};

// Procedural chair
const ProceduralChair: React.FC<{ scale: number; state: string; color?: string }> = ({ scale, state, color = '#8b4513' }) => {
  return (
    <group scale={scale}>
      {/* Seat */}
      <mesh position={[0, 0.3, 0]} castShadow>
        <boxGeometry args={[0.5, 0.1, 0.5]} />
        <meshStandardMaterial color={color} />
      </mesh>
      {/* Back */}
      <mesh position={[0, 0.6, -0.2]} castShadow>
        <boxGeometry args={[0.5, 0.5, 0.1]} />
        <meshStandardMaterial color={color} />
      </mesh>
      {/* Legs */}
      {[-0.2, 0.2].map(x => (
        [-0.2, 0.2].map(z => (
          <mesh key={`${x}-${z}`} position={[x, 0.15, z]} castShadow>
            <boxGeometry args={[0.05, 0.3, 0.05]} />
            <meshStandardMaterial color={color} />
          </mesh>
        ))
      ))}
    </group>
  );
};
