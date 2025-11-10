/**
 * Environment Renderer
 * Renders different environment types based on mode
 */

import React from 'react';
import { EnvironmentRendererProps, EnvironmentType, Symbol } from '../types';
import WebGLMetaverseEvolution from '../../AdvancedAnimations/WebGLMetaverseEvolution';
import MetaverseCanvas3D from '../../MetaverseCanvas3D/MetaverseCanvas3D';
import UnifiedEditor from '../../UnifiedEditor';
import { Combined3DEnvironment } from './Combined3DEnvironment';

export const EnvironmentRenderer: React.FC<EnvironmentRendererProps> = ({
  environment,
  selectedSymbol,
  selectedSymbols,
  onSymbolSelect,
  config,
  agents,
  agentsLoading
}) => {
  switch (environment) {
    case 'abstract':
      // Abstract view is now part of 3d-gltf environment
      return (
        <div className="flex items-center justify-center h-full bg-gray-900 text-gray-400">
          Abstract view is now integrated into 3D GLTF environment
        </div>
      );

    case 'canvas-2d':
      // Canvas 2D is now a symbol mode, not an environment
      return (
        <div className="flex items-center justify-center h-full bg-gray-900 text-gray-400">
          Canvas 2D is available as a symbol mode
        </div>
      );

    case 'code-media':
      return (
        <UnifiedEditor
          filename={config?.filename || 'editor.code'}
          initialMode="code"
          height="100%"
          onSave={(content, format) => {
            // Handle save
          }}
        />
      );

    case '3d-gltf':
      // Combined 3D environment with abstract view integrated
      return (
        <Combined3DEnvironment
          selectedSymbol={selectedSymbol}
          onSymbolSelect={onSymbolSelect}
          agents={agents}
          agentsLoading={agentsLoading}
          config={{
            showAbstract: true,
            showGrokMetaverse: true,
            layout: 'layered'
          }}
        />
      );

    default:
      return (
        <div className="flex items-center justify-center h-full bg-gray-900 text-gray-400">
          Unknown environment: {environment}
        </div>
      );
  }
};
