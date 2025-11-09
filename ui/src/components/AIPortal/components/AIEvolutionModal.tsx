/**
 * AI Evolution Modal Component
 * 
 * Modal for AI evolution controls and metrics
 */

import React from 'react';
import { Modal } from '@/components/shared/Modal';
import { Card } from '@/components/shared/Card';
import { Play, Pause, Settings } from 'lucide-react';
import { EvolutionMetricsPanel } from './EvolutionMetricsPanel';

interface EvolutionMetrics {
  totalMutations: number;
  successfulMutations: number;
  averageConfidence: number;
  complexityScore: number;
  noveltyScore: number;
  churchEncodingAccuracy: number;
}

interface AIEvolutionModalProps {
  isOpen: boolean;
  onClose: () => void;
  isEvolutionActive: boolean;
  onStartEvolution: () => void;
  onStopEvolution: () => void;
  onOpenSettings: () => void;
  evolutionMetrics: EvolutionMetrics;
  evolutionLog: string[];
}

export const AIEvolutionModal: React.FC<AIEvolutionModalProps> = ({
  isOpen,
  onClose,
  isEvolutionActive,
  onStartEvolution,
  onStopEvolution,
  onOpenSettings,
  evolutionMetrics,
  evolutionLog,
}) => {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="AI Evolution Engine"
      size="lg"
    >
      <div className="space-y-4">
        {/* Controls */}
        <Card className="flex flex-col" title="Controls">
          <div className="flex gap-2">
            <button
              onClick={isEvolutionActive ? onStopEvolution : onStartEvolution}
              className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors ${
                isEvolutionActive
                  ? 'bg-red-600 hover:bg-red-700 text-white'
                  : 'bg-green-600 hover:bg-green-700 text-white'
              }`}
            >
              {isEvolutionActive ? <><Pause className="w-4 h-4 inline mr-1" />Stop</> : <><Play className="w-4 h-4 inline mr-1" />Start</>}
            </button>
            <button
              onClick={onOpenSettings}
              className="px-3 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg"
              title="Settings"
            >
              <Settings className="w-4 h-4" />
            </button>
          </div>
        </Card>

        {/* Evolution Metrics */}
        <EvolutionMetricsPanel
          metrics={evolutionMetrics}
          evolutionLog={evolutionLog}
        />
      </div>
    </Modal>
  );
};
