/**
 * Evolution Metrics Panel Component
 * 
 * Displays evolution metrics and log
 */

import React from 'react';
import { Card } from '@/components/shared/Card';
import { ChevronDown, ChevronUp } from 'lucide-react';

interface EvolutionMetrics {
  totalMutations: number;
  successfulMutations: number;
  averageConfidence: number;
  complexityScore: number;
  noveltyScore: number;
  churchEncodingAccuracy: number;
}

interface EvolutionMetricsPanelProps {
  metrics: EvolutionMetrics;
  evolutionLog: string[];
  isExpanded?: boolean;
  onToggle?: () => void;
}

export const EvolutionMetricsPanel: React.FC<EvolutionMetricsPanelProps> = ({
  metrics,
  evolutionLog,
  isExpanded = true,
  onToggle,
}) => {
  return (
    <Card className="flex flex-col">
      {/* Header with Toggle */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-white">Evolution Metrics</h3>
        {onToggle && (
          <button
            onClick={onToggle}
            className="text-gray-400 hover:text-white transition-colors"
            title={isExpanded ? 'Collapse' : 'Expand'}
          >
            {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
          </button>
        )}
      </div>
      
      {isExpanded && (
        <>
          {/* Evolution Metrics */}
          <div className="grid grid-cols-2 gap-2 mb-4">
            <div className="bg-gray-900 rounded p-2">
              <div className="text-xs text-gray-400">Total</div>
              <div className="text-lg font-bold text-white">{metrics.totalMutations}</div>
            </div>
            <div className="bg-gray-900 rounded p-2">
              <div className="text-xs text-gray-400">Success</div>
              <div className="text-lg font-bold text-green-400">
                {metrics.totalMutations > 0 
                  ? ((metrics.successfulMutations / metrics.totalMutations) * 100).toFixed(0)
                  : 0}%
              </div>
            </div>
            <div className="bg-gray-900 rounded p-2">
              <div className="text-xs text-gray-400">Complexity</div>
              <div className="text-lg font-bold text-purple-400">
                {metrics.complexityScore.toFixed(0)}
              </div>
            </div>
            <div className="bg-gray-900 rounded p-2">
              <div className="text-xs text-gray-400">Novelty</div>
              <div className="text-lg font-bold text-pink-400">
                {metrics.noveltyScore.toFixed(0)}
              </div>
            </div>
          </div>

          {/* Evolution Log */}
          <div className="flex-1 bg-gray-900 rounded-lg p-3 overflow-y-auto">
            <div className="text-xs font-bold text-white mb-2">Evolution Log</div>
            <div className="space-y-1">
              {evolutionLog.slice(0, 10).map((log, index) => (
                <div key={index} className="text-xs text-gray-400 font-mono">
                  {log}
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </Card>
  );
};
