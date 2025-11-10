/**
 * Metaverse View Component
 * 
 * Always renders the Unified Metaverse View (full collaborative world)
 */

import React from 'react';
import UnifiedMetaverseView from '@/components/UnifiedMetaverseView';

interface MetaverseViewProps {
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
    </div>
  );
};
