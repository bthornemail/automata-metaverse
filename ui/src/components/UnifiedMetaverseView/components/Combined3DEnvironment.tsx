/**
 * Combined 3D GLTF Environment
 * Integrates abstract view (WebGLMetaverseEvolution) with Grok Metaverse Renderer
 */

import React, { useState } from 'react';
import WebGLMetaverseEvolution from '../../AdvancedAnimations/WebGLMetaverseEvolution';
import GrokMetaverseRenderer from '../../GrokMetaverse/GrokMetaverseRenderer';
import { DimensionalAgent } from '../../../services/grok-metaverse-service';
import { Symbol } from '../types';
import { motion } from 'framer-motion';
import { Layers, Grid3x3 } from 'lucide-react';

interface Combined3DEnvironmentProps {
  selectedSymbol: Symbol | null;
  onSymbolSelect: (symbol: Symbol | null) => void;
  config?: {
    showAbstract?: boolean;
    showGrokMetaverse?: boolean;
    layout?: 'overlay' | 'split' | 'layered';
  };
}

export const Combined3DEnvironment: React.FC<Combined3DEnvironmentProps> = ({
  selectedSymbol,
  onSymbolSelect,
  config = {
    showAbstract: true,
    showGrokMetaverse: true,
    layout: 'layered'
  }
}) => {
  const [activeLayer, setActiveLayer] = useState<'abstract' | 'grok' | 'both'>('both');
  const [abstractStats, setAbstractStats] = useState<any>(null);

  const handleAgentSelect = (agent: DimensionalAgent | null) => {
    if (agent) {
      const symbol: Symbol = {
        id: agent.id,
        name: agent.name,
        type: agent.type === 'topology' ? 'node' : 'avatar',
        environment: '3d-gltf',
        position: agent.position,
        data: agent,
        metadata: {
          dimension: agent.dimension,
          churchEncoding: agent.churchEncoding
        }
      };
      onSymbolSelect(symbol);
    } else {
      onSymbolSelect(null);
    }
  };

  if (config.layout === 'layered') {
    return (
      <div className="relative h-full w-full bg-gray-900">
        {/* Abstract View Layer - Background */}
        {config.showAbstract && (activeLayer === 'abstract' || activeLayer === 'both') && (
          <div className={`absolute inset-0 z-0 ${activeLayer === 'both' ? 'opacity-40' : 'opacity-100'} transition-opacity duration-300`}>
            <WebGLMetaverseEvolution
              onOpenAIModal={() => {}}
              onDimensionChange={(dimension) => {
                // Handle dimension change
              }}
              onStatsUpdate={(stats) => {
                setAbstractStats(stats);
              }}
            />
          </div>
        )}

        {/* Grok Metaverse Layer - Foreground */}
        {config.showGrokMetaverse && (activeLayer === 'grok' || activeLayer === 'both') && (
          <div className={`absolute inset-0 z-10 ${activeLayer === 'both' ? 'opacity-100' : 'opacity-100'} transition-opacity duration-300`}>
            <GrokMetaverseRenderer
              onAgentSelect={handleAgentSelect}
              selectedAgentId={selectedSymbol?.id || null}
            />
          </div>
        )}

        {/* Layer Control */}
        <div className="absolute top-4 right-4 z-20 bg-gray-800/90 backdrop-blur-lg rounded-lg p-2 border border-gray-700">
          <div className="flex gap-2">
            <button
              onClick={() => setActiveLayer('abstract')}
              className={`px-3 py-1 rounded text-sm transition-colors ${
                activeLayer === 'abstract' ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
              title="Abstract View Only"
            >
              <Layers className="w-4 h-4 inline mr-1" />
              Abstract
            </button>
            <button
              onClick={() => setActiveLayer('grok')}
              className={`px-3 py-1 rounded text-sm transition-colors ${
                activeLayer === 'grok' ? 'bg-purple-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
              title="Grok Metaverse Only"
            >
              <Grid3x3 className="w-4 h-4 inline mr-1" />
              Grok
            </button>
            <button
              onClick={() => setActiveLayer('both')}
              className={`px-3 py-1 rounded text-sm transition-colors ${
                activeLayer === 'both' ? 'bg-indigo-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
              title="Both Layers"
            >
              <Layers className="w-4 h-4 inline mr-1" />
              Both
            </button>
          </div>
        </div>

        {/* Stats Overlay */}
        {abstractStats && activeLayer !== 'grok' && (
          <div className="absolute bottom-4 left-4 z-10 bg-gray-800/90 backdrop-blur-lg rounded-lg p-3 border border-gray-700 text-xs text-gray-300">
            <div className="font-semibold mb-2 text-white">Abstract Stats</div>
            <div>Dimension: {abstractStats.currentDimension || 0}D</div>
            <div>Evolution Events: {abstractStats.evolutionEvents?.length || 0}</div>
            <div>Qubits: {abstractStats.qubits?.length || 0}</div>
            <div>Particles: {abstractStats.particles?.length || 0}</div>
          </div>
        )}
      </div>
    );
  }

  // Split layout (side by side)
  if (config.layout === 'split') {
    return (
      <div className="h-full w-full flex bg-gray-900">
        {config.showAbstract && (
          <div className="flex-1 border-r border-gray-700">
            <WebGLMetaverseEvolution
              onOpenAIModal={() => {}}
              onDimensionChange={(dimension) => {}}
              onStatsUpdate={(stats) => setAbstractStats(stats)}
            />
          </div>
        )}
        {config.showGrokMetaverse && (
          <div className="flex-1">
            <GrokMetaverseRenderer
              onAgentSelect={handleAgentSelect}
              selectedAgentId={selectedSymbol?.id || null}
            />
          </div>
        )}
      </div>
    );
  }

  // Overlay layout (Grok on top of Abstract)
  return (
    <div className="relative h-full w-full bg-gray-900">
      {config.showAbstract && (
        <div className="absolute inset-0 z-0">
          <WebGLMetaverseEvolution
            onOpenAIModal={() => {}}
            onDimensionChange={(dimension) => {}}
            onStatsUpdate={(stats) => setAbstractStats(stats)}
          />
        </div>
      )}
      {config.showGrokMetaverse && (
        <div className="absolute inset-0 z-10">
          <GrokMetaverseRenderer
            onAgentSelect={handleAgentSelect}
            selectedAgentId={selectedSymbol?.id || null}
          />
        </div>
      )}
    </div>
  );
};

export default Combined3DEnvironment;
