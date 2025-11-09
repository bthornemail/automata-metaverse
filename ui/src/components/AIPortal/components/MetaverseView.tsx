/**
 * Metaverse View Component
 * 
 * Renders the 3D metaverse portal based on selected mode
 */

import React from 'react';
import WebGLMetaverseEvolution from '@/components/AdvancedAnimations/WebGLMetaverseEvolution';
import MetaverseCanvas3D from '@/components/MetaverseCanvas3D/MetaverseCanvas3D';
import UnifiedMetaverseView from '@/components/UnifiedMetaverseView';

interface MetaverseViewProps {
  mode: 'abstract' | 'canvasl-3d' | 'unified';
  selectedJSONLFile: string;
  onOpenAIModal: () => void;
  onDimensionChange: (dimension: number) => void;
  onStatsUpdate: (stats: any) => void;
  onSave: (canvas3D: any) => void;
  onModeChange: (major: string, minor: string) => void;
  onSymbolSelect: (symbol: any) => void;
  onEvolutionLog: (message: string) => void;
}

export const MetaverseView: React.FC<MetaverseViewProps> = ({
  mode,
  selectedJSONLFile,
  onOpenAIModal,
  onDimensionChange,
  onStatsUpdate,
  onSave,
  onModeChange,
  onSymbolSelect,
  onEvolutionLog,
}) => {
  return (
    <div className="w-full h-full">
      {mode === 'unified' ? (
        <UnifiedMetaverseView
          initialMajorMode="environment"
          initialMinorMode="3d-gltf"
          onModeChange={(major, minor) => {
            onModeChange(major, minor);
            onEvolutionLog(`Mode changed: ${major}/${minor}`);
          }}
          onSymbolSelect={(symbol) => {
            if (symbol) {
              onSymbolSelect(symbol);
              onEvolutionLog(`Selected symbol: ${symbol.name} (${symbol.type})`);
            }
          }}
          height="100%"
        />
      ) : mode === 'abstract' ? (
        <WebGLMetaverseEvolution 
          onOpenAIModal={onOpenAIModal}
          onDimensionChange={onDimensionChange}
          onStatsUpdate={onStatsUpdate}
        />
      ) : (
        <MetaverseCanvas3D
          filename={selectedJSONLFile}
          onSave={(canvas3D) => {
            onSave(canvas3D);
            onEvolutionLog(`Saved 3D canvas: ${selectedJSONLFile}`);
          }}
        />
      )}
    </div>
  );
};
