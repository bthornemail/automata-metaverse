/**
 * Mutation Panel Component
 * 
 * Displays AI-generated mutations and allows applying them
 */

import React, { useState } from 'react';
import { Sparkles, Check, X, AlertCircle } from 'lucide-react';

export interface AIMutation {
  id: string;
  type: 'church-encoding' | 'dimensional' | 'topological' | 'self-reference';
  description: string;
  code: string;
  confidence: number;
  impact: 'low' | 'medium' | 'high' | 'critical';
  timestamp: number;
  applied: boolean;
}

interface MutationPanelProps {
  mutations: AIMutation[];
  onApplyMutation: (mutation: AIMutation) => Promise<void>;
  onRejectMutation: (mutationId: string) => void;
  className?: string;
}

export const MutationPanel: React.FC<MutationPanelProps> = ({
  mutations,
  onApplyMutation,
  onRejectMutation,
  className = '',
}) => {
  const [expandedMutation, setExpandedMutation] = useState<string | null>(null);

  const getImpactColor = (impact: AIMutation['impact']) => {
    switch (impact) {
      case 'critical':
        return 'text-red-400';
      case 'high':
        return 'text-orange-400';
      case 'medium':
        return 'text-yellow-400';
      case 'low':
        return 'text-green-400';
      default:
        return 'text-gray-400';
    }
  };

  return (
    <div className={`bg-gray-900 border border-gray-700 rounded-lg p-4 ${className}`}>
      <h3 className="text-lg font-semibold text-white flex items-center gap-2 mb-4">
        <Sparkles className="w-5 h-5" />
        AI Mutations ({mutations.length})
      </h3>

      {mutations.length === 0 ? (
        <div className="text-center py-8 text-gray-400">
          <Sparkles className="w-12 h-12 mx-auto mb-2 opacity-50" />
          <p>No mutations generated yet</p>
        </div>
      ) : (
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {mutations.map((mutation) => (
            <div
              key={mutation.id}
              className={`border rounded-lg p-3 ${
                mutation.applied
                  ? 'border-green-600 bg-green-600/10'
                  : 'border-gray-700 bg-gray-800'
              }`}
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-medium text-white capitalize">
                      {mutation.type.replace(/-/g, ' ')}
                    </span>
                    <span className={`text-xs font-medium ${getImpactColor(mutation.impact)}`}>
                      {mutation.impact.toUpperCase()}
                    </span>
                    <span className="text-xs text-gray-400">
                      {Math.round(mutation.confidence * 100)}% confidence
                    </span>
                  </div>
                  <p className="text-sm text-gray-300">{mutation.description}</p>
                </div>
                {!mutation.applied && (
                  <div className="flex gap-2 ml-4">
                    <button
                      onClick={() => onApplyMutation(mutation)}
                      className="p-1 text-green-400 hover:text-green-300 transition-colors"
                      title="Apply mutation"
                    >
                      <Check className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => onRejectMutation(mutation.id)}
                      className="p-1 text-red-400 hover:text-red-300 transition-colors"
                      title="Reject mutation"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>

              {expandedMutation === mutation.id && (
                <div className="mt-2 p-2 bg-gray-900 rounded border border-gray-700">
                  <pre className="text-xs text-gray-300 overflow-x-auto">
                    {mutation.code}
                  </pre>
                </div>
              )}

              {!mutation.applied && (
                <button
                  onClick={() =>
                    setExpandedMutation(expandedMutation === mutation.id ? null : mutation.id)
                  }
                  className="text-xs text-blue-400 hover:text-blue-300 mt-2"
                >
                  {expandedMutation === mutation.id ? 'Hide code' : 'Show code'}
                </button>
              )}

              {mutation.applied && (
                <div className="flex items-center gap-1 text-xs text-green-400 mt-2">
                  <Check className="w-3 h-3" />
                  Applied
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
