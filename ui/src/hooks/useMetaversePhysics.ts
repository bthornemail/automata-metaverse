/**
 * Metaverse Physics Hooks
 * Connect physics service to React components
 */

import { useEffect, useState } from 'react';
import {
  metaversePhysicsService,
  PhysicsState,
  ParticleState,
  QubitState,
  DimensionNodeState
} from '@/services/metaverse-physics-service';

// Hook to get physics state
export const useMetaversePhysics = () => {
  const [state, setState] = useState<PhysicsState>(metaversePhysicsService.getState());

  useEffect(() => {
    const unsubscribe = metaversePhysicsService.subscribe(() => {
      setState(metaversePhysicsService.getState());
    });
    return unsubscribe;
  }, []);

  return state;
};

// Hook to get wind at position (for trees, etc.)
export const useWindAt = (position: [number, number, number]) => {
  const [wind, setWind] = useState(() => metaversePhysicsService.getWindAt(position));

  useEffect(() => {
    const unsubscribe = metaversePhysicsService.subscribe(() => {
      setWind(metaversePhysicsService.getWindAt(position));
    });
    return unsubscribe;
  }, [position]);

  return wind;
};

// Hook to get gravity at position (for avatars, objects)
export const useGravityAt = (position: [number, number, number]) => {
  const [gravity, setGravity] = useState(() => metaversePhysicsService.getGravityAt(position));

  useEffect(() => {
    const unsubscribe = metaversePhysicsService.subscribe(() => {
      setGravity(metaversePhysicsService.getGravityAt(position));
    });
    return unsubscribe;
  }, [position]);

  return gravity;
};

// Hook to get topology field at position (for buildings, paths)
export const useTopologyFieldAt = (position: [number, number, number]) => {
  const [fieldStrength, setFieldStrength] = useState(() =>
    metaversePhysicsService.getTopologyFieldAt(position)
  );

  useEffect(() => {
    const unsubscribe = metaversePhysicsService.subscribe(() => {
      setFieldStrength(metaversePhysicsService.getTopologyFieldAt(position));
    });
    return unsubscribe;
  }, [position]);

  return fieldStrength;
};
