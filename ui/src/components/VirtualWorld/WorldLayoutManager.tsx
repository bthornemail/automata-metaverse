/**
 * World Layout Manager
 * Manages zone-based world organization with buildings, paths, and landmarks
 */

import React, { createContext, useContext, useState, useMemo } from 'react';
import * as THREE from 'three';

export interface Zone {
  id: string;
  name: string;
  bounds: {
    min: [number, number, number];
    max: [number, number, number];
  };
  theme: 'plaza' | 'building' | 'garden' | 'workspace';
  avatars: string[]; // Avatar IDs in this zone
  color: string; // Zone color theme
}

export interface Building {
  id: string;
  name: string;
  position: [number, number, number];
  size: [number, number, number]; // width, height, depth
  rotation?: number; // Rotation in radians
  zoneId: string;
  gltfModel?: string; // Optional GLTF model URL
  type: 'agent-building' | 'plaza' | 'workspace' | 'garden';
}

export interface Path {
  id: string;
  from: [number, number, number];
  to: [number, number, number];
  width?: number;
  type: 'road' | 'path' | 'bridge';
  zoneConnections: string[]; // Zone IDs this path connects
}

export interface Landmark {
  id: string;
  name: string;
  position: [number, number, number];
  type: 'spawn' | 'portal' | 'monument' | 'sign';
  zoneId: string;
}

export interface WorldLayout {
  zones: Zone[];
  buildings: Building[];
  paths: Path[];
  landmarks: Landmark[];
  spawnPoints: [number, number, number][];
  center: [number, number, number];
  size: number; // World size
}

interface WorldLayoutContextType {
  layout: WorldLayout;
  getZone: (id: string) => Zone | undefined;
  getBuilding: (id: string) => Building | undefined;
  getPath: (id: string) => Path | undefined;
  getLandmark: (id: string) => Landmark | undefined;
  getZoneForPosition: (position: [number, number, number]) => Zone | undefined;
  addAvatarToZone: (zoneId: string, avatarId: string) => void;
  removeAvatarFromZone: (zoneId: string, avatarId: string) => void;
}

const WorldLayoutContext = createContext<WorldLayoutContextType | null>(null);

export const useWorldLayout = () => {
  const context = useContext(WorldLayoutContext);
  if (!context) {
    throw new Error('useWorldLayout must be used within WorldLayoutProvider');
  }
  return context;
};

// Default world layout: Central plaza with dimension-based zones
export const createDefaultWorldLayout = (): WorldLayout => {
  const worldSize = 200;
  const plazaSize = 40;
  const buildingSize = 20;
  const zoneSize = 60;

  const zones: Zone[] = [
    {
      id: 'plaza',
      name: 'Central Plaza',
      bounds: {
        min: [-plazaSize / 2, 0, -plazaSize / 2],
        max: [plazaSize / 2, 10, plazaSize / 2]
      },
      theme: 'plaza',
      avatars: [],
      color: '#6366f1'
    },
    {
      id: 'foundation-zone',
      name: 'Foundation Zone (0D-2D)',
      bounds: {
        min: [-zoneSize, 0, -zoneSize],
        max: [-plazaSize / 2, 10, -plazaSize / 2]
      },
      theme: 'building',
      avatars: [],
      color: '#3b82f6'
    },
    {
      id: 'operational-zone',
      name: 'Operational Zone (3D-4D)',
      bounds: {
        min: [plazaSize / 2, 0, -zoneSize],
        max: [zoneSize, 10, -plazaSize / 2]
      },
      theme: 'building',
      avatars: [],
      color: '#f59e0b'
    },
    {
      id: 'advanced-zone',
      name: 'Advanced Zone (5D-6D)',
      bounds: {
        min: [-zoneSize, 0, plazaSize / 2],
        max: [-plazaSize / 2, 10, zoneSize]
      },
      theme: 'building',
      avatars: [],
      color: '#10b981'
    },
    {
      id: 'quantum-zone',
      name: 'Quantum Zone (7D)',
      bounds: {
        min: [plazaSize / 2, 0, plazaSize / 2],
        max: [zoneSize, 10, zoneSize]
      },
      theme: 'building',
      avatars: [],
      color: '#8b5cf6'
    }
  ];

  const buildings: Building[] = [
    {
      id: 'plaza-building',
      name: 'Central Plaza',
      position: [0, 0, 0],
      size: [plazaSize, 5, plazaSize],
      zoneId: 'plaza',
      type: 'plaza'
    },
    {
      id: 'foundation-building',
      name: 'Foundation Agents Building',
      position: [-zoneSize / 2 - plazaSize / 4, 0, -zoneSize / 2 - plazaSize / 4],
      size: [buildingSize, 15, buildingSize],
      zoneId: 'foundation-zone',
      type: 'agent-building'
    },
    {
      id: 'operational-building',
      name: 'Operational Agents Building',
      position: [zoneSize / 2 + plazaSize / 4, 0, -zoneSize / 2 - plazaSize / 4],
      size: [buildingSize, 15, buildingSize],
      zoneId: 'operational-zone',
      type: 'agent-building'
    },
    {
      id: 'advanced-building',
      name: 'Advanced Agents Building',
      position: [-zoneSize / 2 - plazaSize / 4, 0, zoneSize / 2 + plazaSize / 4],
      size: [buildingSize, 15, buildingSize],
      zoneId: 'advanced-zone',
      type: 'agent-building'
    },
    {
      id: 'quantum-building',
      name: 'Quantum Agent Building',
      position: [zoneSize / 2 + plazaSize / 4, 0, zoneSize / 2 + plazaSize / 4],
      size: [buildingSize, 15, buildingSize],
      zoneId: 'quantum-zone',
      type: 'agent-building'
    }
  ];

  const paths: Path[] = [
    {
      id: 'path-plaza-foundation',
      from: [-plazaSize / 2, 0, 0],
      to: [-zoneSize / 2 - plazaSize / 4, 0, -zoneSize / 2 - plazaSize / 4],
      width: 3,
      type: 'path',
      zoneConnections: ['plaza', 'foundation-zone']
    },
    {
      id: 'path-plaza-operational',
      from: [plazaSize / 2, 0, 0],
      to: [zoneSize / 2 + plazaSize / 4, 0, -zoneSize / 2 - plazaSize / 4],
      width: 3,
      type: 'path',
      zoneConnections: ['plaza', 'operational-zone']
    },
    {
      id: 'path-plaza-advanced',
      from: [-plazaSize / 2, 0, 0],
      to: [-zoneSize / 2 - plazaSize / 4, 0, zoneSize / 2 + plazaSize / 4],
      width: 3,
      type: 'path',
      zoneConnections: ['plaza', 'advanced-zone']
    },
    {
      id: 'path-plaza-quantum',
      from: [plazaSize / 2, 0, 0],
      to: [zoneSize / 2 + plazaSize / 4, 0, zoneSize / 2 + plazaSize / 4],
      width: 3,
      type: 'path',
      zoneConnections: ['plaza', 'quantum-zone']
    }
  ];

  const landmarks: Landmark[] = [
    {
      id: 'spawn-plaza',
      name: 'Plaza Spawn Point',
      position: [0, 0, 0],
      type: 'spawn',
      zoneId: 'plaza'
    }
  ];

  return {
    zones,
    buildings,
    paths,
    landmarks,
    spawnPoints: [[0, 0, 0]],
    center: [0, 0, 0],
    size: worldSize
  };
};

interface WorldLayoutProviderProps {
  children: React.ReactNode;
  initialLayout?: WorldLayout;
}

export const WorldLayoutProvider: React.FC<WorldLayoutProviderProps> = ({
  children,
  initialLayout
}) => {
  const [layout, setLayout] = useState<WorldLayout>(
    initialLayout || createDefaultWorldLayout()
  );

  const getZone = (id: string) => layout.zones.find(z => z.id === id);
  const getBuilding = (id: string) => layout.buildings.find(b => b.id === id);
  const getPath = (id: string) => layout.paths.find(p => p.id === id);
  const getLandmark = (id: string) => layout.landmarks.find(l => l.id === id);

  const getZoneForPosition = (position: [number, number, number]): Zone | undefined => {
    return layout.zones.find(zone => {
      const [x, y, z] = position;
      const { min, max } = zone.bounds;
      return (
        x >= min[0] && x <= max[0] &&
        y >= min[1] && y <= max[1] &&
        z >= min[2] && z <= max[2]
      );
    });
  };

  const addAvatarToZone = (zoneId: string, avatarId: string) => {
    setLayout(prev => ({
      ...prev,
      zones: prev.zones.map(zone =>
        zone.id === zoneId && !zone.avatars.includes(avatarId)
          ? { ...zone, avatars: [...zone.avatars, avatarId] }
          : zone
      )
    }));
  };

  const removeAvatarFromZone = (zoneId: string, avatarId: string) => {
    setLayout(prev => ({
      ...prev,
      zones: prev.zones.map(zone =>
        zone.id === zoneId
          ? { ...zone, avatars: zone.avatars.filter(id => id !== avatarId) }
          : zone
      )
    }));
  };

  const value = useMemo(
    () => ({
      layout,
      getZone,
      getBuilding,
      getPath,
      getLandmark,
      getZoneForPosition,
      addAvatarToZone,
      removeAvatarFromZone
    }),
    [layout]
  );

  return (
    <WorldLayoutContext.Provider value={value}>
      {children}
    </WorldLayoutContext.Provider>
  );
};
