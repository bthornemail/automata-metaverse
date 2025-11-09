/**
 * Building Interior Component
 * Interior spaces with doors, entrances, and rooms
 */

import React, { useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { Text } from '@react-three/drei';
import * as THREE from 'three';
import { BuildingConfig } from './VirtualWorldBuilding';

export interface InteriorRoom {
  id: string;
  name: string;
  bounds: {
    min: [number, number, number];
    max: [number, number, number];
  };
  type: 'office' | 'meeting' | 'lobby' | 'workspace' | 'garden';
  capacity?: number;
  occupants?: string[]; // Avatar IDs
}

export interface BuildingDoor {
  id: string;
  position: [number, number, number];
  rotation: number;
  roomId: string;
  isOpen: boolean;
  animationProgress?: number; // 0 = closed, 1 = open
}

export interface BuildingInteriorConfig {
  buildingId: string;
  rooms: InteriorRoom[];
  doors: BuildingDoor[];
  entrance?: {
    position: [number, number, number];
    rotation: number;
  };
  showInterior?: boolean;
}

interface BuildingInteriorProps {
  config: BuildingInteriorConfig;
  building: BuildingConfig;
  onDoorClick?: (doorId: string) => void;
  onRoomEnter?: (roomId: string) => void;
}

export const BuildingInterior: React.FC<BuildingInteriorProps> = ({
  config,
  building,
  onDoorClick,
  onRoomEnter
}) => {
  const { rooms, doors, entrance, showInterior = false } = config;

  if (!showInterior) {
    return null;
  }

  return (
    <group>
      {/* Interior rooms */}
      {rooms.map(room => (
        <InteriorRoom
          key={room.id}
          room={room}
          building={building}
          onEnter={() => onRoomEnter?.(room.id)}
        />
      ))}

      {/* Doors */}
      {doors.map(door => (
        <BuildingDoorComponent
          key={door.id}
          door={door}
          building={building}
          onClick={() => onDoorClick?.(door.id)}
        />
      ))}

      {/* Entrance marker */}
      {entrance && (
        <EntranceMarker
          position={entrance.position}
          rotation={entrance.rotation}
        />
      )}
    </group>
  );
};

// Interior room component
const InteriorRoom: React.FC<{
  room: InteriorRoom;
  building: BuildingConfig;
  onEnter?: () => void;
}> = ({ room, building, onEnter }) => {
  const { bounds, name, type, capacity, occupants = [] } = room;
  const { min, max } = bounds;
  const width = max[0] - min[0];
  const height = max[1] - min[1];
  const depth = max[2] - min[2];
  const center: [number, number, number] = [
    (min[0] + max[0]) / 2,
    (min[1] + max[1]) / 2,
    (min[2] + max[2]) / 2
  ];

  const roomColor = {
    office: '#e5e7eb',
    meeting: '#dbeafe',
    lobby: '#f3f4f6',
    workspace: '#fef3c7',
    garden: '#d1fae5'
  }[type] || '#f3f4f6';

  return (
    <group position={center}>
      {/* Room floor */}
      <mesh position={[0, -height / 2 + 0.01, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[width, depth]} />
        <meshStandardMaterial color={roomColor} roughness={0.8} />
      </mesh>

      {/* Room ceiling */}
      <mesh position={[0, height / 2 - 0.01, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <planeGeometry args={[width, depth]} />
        <meshStandardMaterial color="#ffffff" roughness={0.9} />
      </mesh>

      {/* Room label */}
      <Text
        position={[0, height / 2 + 0.5, 0]}
        fontSize={0.3}
        color="#374151"
        anchorX="center"
        anchorY="middle"
      >
        {name}
      </Text>

      {/* Occupancy indicator */}
      {capacity && (
        <Text
          position={[0, height / 2 + 0.2, 0]}
          fontSize={0.2}
          color={occupants.length >= capacity ? '#ef4444' : '#10b981'}
          anchorX="center"
          anchorY="middle"
        >
          {occupants.length}/{capacity}
        </Text>
      )}
    </group>
  );
};

// Building door component
const BuildingDoorComponent: React.FC<{
  door: BuildingDoor;
  building: BuildingConfig;
  onClick?: () => void;
}> = ({ door, building, onClick }) => {
  const doorRef = useRef<THREE.Group>(null);
  const [isOpen, setIsOpen] = useState(door.isOpen);

  useFrame(() => {
    if (doorRef.current) {
      // Animate door opening/closing
      const targetRotation = isOpen ? Math.PI / 2 : 0;
      doorRef.current.rotation.y = THREE.MathUtils.lerp(
        doorRef.current.rotation.y,
        targetRotation,
        0.1
      );
    }
  });

  const handleClick = () => {
    setIsOpen(!isOpen);
    onClick?.();
  };

  return (
    <group
      ref={doorRef}
      position={door.position}
      rotation={[0, door.rotation, 0]}
      onClick={handleClick}
    >
      {/* Door frame */}
      <mesh>
        <boxGeometry args={[2.2, 2.5, 0.2]} />
        <meshStandardMaterial color="#654321" />
      </mesh>

      {/* Door */}
      <mesh position={[-1, 0, 0.1]}>
        <boxGeometry args={[1, 2.3, 0.1]} />
        <meshStandardMaterial color="#8b4513" />
      </mesh>

      {/* Door handle */}
      <mesh position={[-1.8, 0, 0.15]}>
        <sphereGeometry args={[0.05, 8, 8]} />
        <meshStandardMaterial color="#ffd700" />
      </mesh>
    </group>
  );
};

// Entrance marker
const EntranceMarker: React.FC<{
  position: [number, number, number];
  rotation: number;
}> = ({ position, rotation }) => {
  return (
    <group position={position} rotation={[0, rotation, 0]}>
      {/* Entrance arch */}
      <mesh position={[0, 1.5, 0]}>
        <boxGeometry args={[3, 3, 0.2]} />
        <meshStandardMaterial color="#4a5568" />
      </mesh>

      {/* Entrance label */}
      <Text
        position={[0, 2.5, 0]}
        fontSize={0.3}
        color="#ffffff"
        anchorX="center"
        anchorY="middle"
        outlineWidth={0.02}
        outlineColor="#000000"
      >
        ENTRANCE
      </Text>
    </group>
  );
};
