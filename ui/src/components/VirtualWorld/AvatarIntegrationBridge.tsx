/**
 * Avatar Integration Bridge
 * Bridges old avatar systems (GLTFAvatarRenderer, GestureAnimationSystem) with new EnhancedGLTFAvatarV2
 */

import React from 'react';
import { EnhancedGLTFAvatarV2, EnhancedAvatarConfigV2 } from './EnhancedGLTFAvatarV2';
import { Symbol } from '../UnifiedMetaverseView/types';
import { GestureType } from './AvatarGestureSystem';

/**
 * Convert Symbol (from UnifiedMetaverseView) to EnhancedAvatarConfigV2
 */
export const symbolToAvatarConfig = (symbol: Symbol): EnhancedAvatarConfigV2 => {
  return {
    id: symbol.id,
    name: symbol.name,
    position: symbol.position || [0, 0, 0],
    gltfUrl: symbol.metadata?.gltfModel,
    dimension: symbol.metadata?.dimension,
    status: symbol.metadata?.status || 'online',
    animationState: symbol.metadata?.animationState || 'idle',
    color: symbol.metadata?.color || '#6366f1',
    scale: symbol.metadata?.scale || 1,
    showNameTag: true,
    showStatusIndicator: true,
    customization: symbol.metadata?.customization,
    metadata: symbol.metadata?.avatarMetadata
  };
};

/**
 * Convert old GLTFAvatarRenderer props to EnhancedGLTFAvatarV2 props
 */
export const convertGLTFAvatarProps = (props: {
  symbol: Symbol;
  selected: boolean;
  onClick: () => void;
  onHover?: (hovered: boolean) => void;
}) => {
  const config = symbolToAvatarConfig(props.symbol);
  
  return {
    config,
    selected: props.selected,
    onClick: props.onClick,
    onHover: props.onHover,
    enableGestures: true,
    enableServiceSync: true
  };
};

/**
 * Bridge component that wraps EnhancedGLTFAvatarV2 for compatibility
 */
export const AvatarBridge: React.FC<{
  symbol: Symbol;
  selected: boolean;
  onClick: () => void;
  onHover?: (hovered: boolean) => void;
  enableGestures?: boolean;
  enableServiceSync?: boolean;
}> = ({ symbol, selected, onClick, onHover, enableGestures = true, enableServiceSync = true }) => {
  const config = symbolToAvatarConfig(symbol);
  
  return (
    <EnhancedGLTFAvatarV2
      config={config}
      selected={selected}
      onClick={onClick}
      onHover={onHover}
      enableGestures={enableGestures}
      enableServiceSync={enableServiceSync}
    />
  );
};

/**
 * Convert GestureAnimationSystem props to EnhancedGLTFAvatarV2 props
 */
export const convertGestureAnimationProps = (props: {
  avatarId: string;
  modelUrl?: string;
  position: [number, number, number];
  animationState?: any;
  currentGesture?: GestureType;
}) => {
  return {
    config: {
      id: props.avatarId,
      name: props.avatarId,
      position: props.position,
      gltfUrl: props.modelUrl,
      animationState: props.animationState?.currentAnimation || 'idle',
      currentGesture: props.currentGesture
    },
    enableGestures: true,
    enableServiceSync: true
  };
};

/**
 * Helper to migrate from old avatar system to new one
 */
export const migrateAvatarSystem = {
  /**
   * Migrate GLTFAvatarRenderer avatars
   */
  fromGLTFAvatarRenderer: (symbols: Symbol[]): EnhancedAvatarConfigV2[] => {
    return symbols.map(symbolToAvatarConfig);
  },

  /**
   * Migrate GestureAnimationSystem avatars
   */
  fromGestureAnimationSystem: (avatars: Array<{
    avatarId: string;
    modelUrl?: string;
    position: [number, number, number];
  }>): EnhancedAvatarConfigV2[] => {
    return avatars.map(avatar => ({
      id: avatar.avatarId,
      name: avatar.avatarId,
      position: avatar.position,
      gltfUrl: avatar.modelUrl,
      animationState: 'idle'
    }));
  }
};
