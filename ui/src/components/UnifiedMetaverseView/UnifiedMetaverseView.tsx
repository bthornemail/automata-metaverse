/**
 * Unified Metaverse View
 * Merges abstract, 2D canvas, code/media, and 3D GLTF avatars in one view
 * with major/minor mode system for environments and symbol selection
 */

import React, { useState, useEffect } from 'react';
import { UnifiedMetaverseViewProps, UnifiedViewState, EnvironmentType, Symbol, MajorMode, MinorMode } from './types';
import { modeManager } from './utils/mode-manager';
import { ModeSwitcher } from './components/ModeSwitcher';
import { EnvironmentRenderer } from './components/EnvironmentRenderer';
import { canvasl3DService } from '../../services/canvasl-3d-service';
import { databaseService } from '../../services/database-service';
import { jsonlCanvasService } from '../../services/jsonl-canvas-service';
import { grokMetaverseService } from '../../services/grok-metaverse-service';

export const UnifiedMetaverseView: React.FC<UnifiedMetaverseViewProps> = ({
  initialMajorMode = 'environment',
  initialMinorMode = 'abstract',
  onModeChange,
  onSymbolSelect,
  height = '100%'
}) => {
  const [state, setState] = useState<UnifiedViewState>({
    majorMode: initialMajorMode,
    minorMode: initialMinorMode,
    selectedSymbol: null,
    selectedSymbols: new Set(),
    activeEnvironments: new Set(['abstract']),
    environmentConfigs: new Map(),
    viewportLayout: 'single'
  });

  const [availableSymbols, setAvailableSymbols] = useState<Symbol[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Initialize mode manager
  useEffect(() => {
    modeManager.setMajorMode(initialMajorMode, initialMinorMode);

    const unsubscribe = modeManager.subscribe((major, minor) => {
      setState(prev => ({
        ...prev,
        majorMode: major,
        minorMode: minor,
        selectedSymbol: modeManager.getSelectedSymbol(),
        selectedSymbols: modeManager.getSelectedSymbols()
      }));

      if (onModeChange) {
        onModeChange(major, minor);
      }
    });

    return unsubscribe;
  }, [initialMajorMode, initialMinorMode, onModeChange]);

  // Load symbols from CanvasL files
  useEffect(() => {
    loadSymbols();
  }, []);

  const loadSymbols = async () => {
    setIsLoading(true);
    try {
      const symbols: Symbol[] = [];

      // Load symbols from CanvasL files
      const files = [
        'automaton-kernel.canvasl',
        'generate.metaverse.canvasl',
        'automaton.canvas.space.jsonl'
      ];

      for (const filename of files) {
        try {
          const entries = await databaseService.readJSONL(filename);
          const graph = jsonlCanvasService.parseJSONL(
            entries.map(e => JSON.stringify(e)).join('\n')
          );

          // Convert nodes to symbols
          for (const node of graph.nodeList) {
            symbols.push({
              id: node.id,
              name: node.text || node.id,
              type: node.type === 'file' ? 'code' : 'node',
              environment: 'canvas-2d' as EnvironmentType,
              position: node.x && node.y ? [node.x / 100, 0, -node.y / 100] : undefined,
              data: node,
              metadata: {
                dimension: extractDimension(node.type),
                churchEncoding: extractChurchEncoding(node),
                codeContent: node.text
              }
            });
          }

          // Convert edges to symbols
          for (const edge of graph.edgeList) {
            const fromNode = graph.nodes.get(edge.from || edge.fromNode || '');
            const toNode = graph.nodes.get(edge.to || edge.toNode || '');
            
            if (fromNode && toNode) {
              symbols.push({
                id: edge.id,
                name: edge.label || edge.id,
                type: 'edge',
                environment: 'canvas-2d' as EnvironmentType,
                data: edge,
                metadata: {
                  dimension: extractDimension(edge.type)
                }
              });
            }
          }
        } catch (err) {
          console.warn(`Failed to load symbols from ${filename}:`, err);
        }
      }

      // Load dimensional agents from grok metaverse as symbols
      try {
        const metaverse = await grokMetaverseService.loadGrokMetaverse();
        const agentSymbols: Symbol[] = metaverse.agentList.map(agent => ({
          id: agent.id,
          name: agent.name,
          type: agent.type === 'topology' ? 'node' : 'avatar',
          environment: '3d-gltf' as EnvironmentType,
          position: agent.position,
          data: agent,
          metadata: {
            dimension: agent.dimension,
            churchEncoding: agent.churchEncoding
          }
        }));
        symbols.push(...agentSymbols);
      } catch (err) {
        console.warn('Failed to load grok metaverse agents:', err);
      }

      setAvailableSymbols(symbols);
    } catch (err) {
      console.error('Failed to load symbols:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleMajorModeChange = (mode: MajorMode) => {
    modeManager.setMajorMode(mode);
  };

  const handleMinorModeChange = (mode: MinorMode) => {
    modeManager.setMinorMode(mode);
  };

  const handleSymbolSelect = (symbol: Symbol | null) => {
    modeManager.selectSymbol(symbol);
    if (onSymbolSelect) {
      onSymbolSelect(symbol);
    }
  };

  const getCurrentEnvironment = (): EnvironmentType => {
    if (state.majorMode === 'symbol' && state.selectedSymbol) {
      return state.selectedSymbol.environment;
    }
    return state.minorMode as EnvironmentType;
  };

  const getEnvironmentConfig = (env: EnvironmentType) => {
    return state.environmentConfigs.get(env) || {};
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-400">Loading unified metaverse view...</p>
        </div>
      </div>
    );
  }

  const currentEnvironment = getCurrentEnvironment();

  return (
    <div className="h-full flex flex-col bg-gray-900" style={{ height }}>
      {/* Mode Switcher */}
      <ModeSwitcher
        majorMode={state.majorMode}
        minorMode={state.minorMode}
        selectedSymbol={state.selectedSymbol}
        availableEnvironments={['abstract', 'canvas-2d', 'code-media', '3d-gltf']}
        availableSymbols={availableSymbols}
        onMajorModeChange={handleMajorModeChange}
        onMinorModeChange={handleMinorModeChange}
        onSymbolSelect={handleSymbolSelect}
      />

      {/* Environment Renderer */}
      <div className="flex-1 overflow-hidden">
        <EnvironmentRenderer
          environment={currentEnvironment}
          selectedSymbol={state.selectedSymbol}
          selectedSymbols={state.selectedSymbols}
          onSymbolSelect={handleSymbolSelect}
          config={getEnvironmentConfig(currentEnvironment)}
        />
      </div>
    </div>
  );
};

// Helper functions
function extractDimension(type: string): number {
  if (type.includes('0D') || type.includes('topology')) return 0;
  if (type.includes('1D') || type.includes('temporal')) return 1;
  if (type.includes('2D') || type.includes('structural')) return 2;
  if (type.includes('3D') || type.includes('algebraic')) return 3;
  if (type.includes('4D') || type.includes('network')) return 4;
  if (type.includes('5D') || type.includes('consensus')) return 5;
  if (type.includes('6D') || type.includes('intelligence')) return 6;
  if (type.includes('7D') || type.includes('quantum')) return 7;
  return 0;
}

function extractChurchEncoding(node: any): string | undefined {
  if (node.metadata?.churchEncoding) return node.metadata.churchEncoding;
  if (node.text?.includes('λ')) {
    const match = node.text.match(/λ[^λ]*/);
    return match ? match[0] : undefined;
  }
  return undefined;
}

export default UnifiedMetaverseView;
