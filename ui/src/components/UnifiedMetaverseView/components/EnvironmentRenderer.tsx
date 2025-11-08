/**
 * Environment Renderer
 * Renders different environment types based on mode
 */

import React from 'react';
import { EnvironmentRendererProps, EnvironmentType, Symbol } from '../types';
import WebGLMetaverseEvolution from '../../AdvancedAnimations/WebGLMetaverseEvolution';
import MetaverseCanvas3D from '../../MetaverseCanvas3D/MetaverseCanvas3D';
import UnifiedEditor from '../../UnifiedEditor';
import GrokMetaverseRenderer from '../../GrokMetaverse/GrokMetaverseRenderer';

export const EnvironmentRenderer: React.FC<EnvironmentRendererProps> = ({
  environment,
  selectedSymbol,
  selectedSymbols,
  onSymbolSelect,
  config
}) => {
  switch (environment) {
    case 'abstract':
      return (
        <WebGLMetaverseEvolution
          onOpenAIModal={() => {}}
          onDimensionChange={(dimension) => {
            // Handle dimension change
          }}
          onStatsUpdate={(stats) => {
            // Handle stats update
          }}
        />
      );

    case 'canvas-2d':
      return (
        <UnifiedEditor
          filename={config?.filename || 'automaton-kernel.canvasl'}
          initialMode="canvas"
          height="100%"
          onSave={(content, format) => {
            // Handle save
          }}
        />
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
      return (
        <GrokMetaverseRenderer
          onAgentSelect={(agent) => {
            if (agent) {
              // Convert agent to symbol
              const symbol: Symbol = {
                id: agent.id,
                name: agent.name,
                type: agent.type === 'topology' ? 'node' : 'avatar',
                environment: '3d-gltf',
                position: agent.position,
                data: agent,
                metadata: {
                  dimension: agent.dimension,
                  churchEncoding: agent.churchEncoding,
                  gltfModel: undefined
                }
              };
              onSymbolSelect(symbol);
            } else {
              onSymbolSelect(null);
            }
          }}
          selectedAgentId={selectedSymbol?.id || null}
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
