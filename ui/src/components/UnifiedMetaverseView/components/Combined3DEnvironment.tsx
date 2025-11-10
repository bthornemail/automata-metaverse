/**
 * Combined 3D GLTF Environment
 * Unified View: Full Collaborative World with abstract view elements merged
 * No layer switching - everything is integrated into one unified view
 */

import React from 'react';
import { Symbol } from '../types';
import { CollaborativeWorldIntegration } from './CollaborativeWorldIntegration';

interface Combined3DEnvironmentProps {
  selectedSymbol: Symbol | null;
  onSymbolSelect: (symbol: Symbol | null) => void;
  agents?: any[]; // Agent API agents
  agentsLoading?: boolean;
  config?: {
    enableInteractions?: boolean;
    enableLearning?: boolean;
    showKnowledgeGraph?: boolean;
  };
}

export const Combined3DEnvironment: React.FC<Combined3DEnvironmentProps> = ({
  selectedSymbol,
  onSymbolSelect,
  agents,
  agentsLoading,
  config = {
    enableInteractions: true,
    enableLearning: true,
    showKnowledgeGraph: true
  }
}) => {
  return (
    <div className="relative h-full w-full bg-gray-900">
      <CollaborativeWorldIntegration
        selectedSymbol={selectedSymbol}
        onSymbolSelect={onSymbolSelect}
        agents={agents}
        agentsLoading={agentsLoading}
        config={config}
      />
    </div>
  );
};


export default Combined3DEnvironment;
