import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, BarChart, Bar } from 'recharts';
import { Card } from '@/components/shared/Card';
import { ChevronDown, ChevronUp } from 'lucide-react';

interface Automaton {
  id: string;
  dimension: number;
  pattern: string;
}

interface DimensionalProgression {
  dimension: number;
  duration: number;
  timestamp: number;
}

interface DimensionalOverviewProps {
  automata: Automaton[];
  progression: DimensionalProgression[];
  currentDimension?: number;
}

export const DimensionalOverview: React.FC<DimensionalOverviewProps> = ({
  automata,
  progression,
  currentDimension
}) => {
  const [expandedDimensions, setExpandedDimensions] = useState<Set<number>>(new Set());
  const [showProgressionChart, setShowProgressionChart] = useState(true);

  const getDimensionColor = (dimension: number): string => {
    const colors = [
      '#6366f1', '#8b5cf6', '#ec4899', '#f43f5e',
      '#f97316', '#eab308', '#22c55e', '#06b6d4'
    ];
    return colors[dimension] || '#6b7280';
  };

  const getDimensionName = (dimension: number): string => {
    const names = ['Identity', 'Successor', 'Pair', 'Addition', 'Network', 'Consensus', 'Intelligence', 'Quantum'];
    return names[dimension] || 'Unknown';
  };

  // Group automata by dimension
  const automataByDimension = automata.reduce((acc, automaton) => {
    if (!acc[automaton.dimension]) {
      acc[automaton.dimension] = [];
    }
    acc[automaton.dimension].push(automaton);
    return acc;
  }, {} as Record<number, Automaton[]>);

  // Prepare progression data with automata counts
  const progressionData = [0, 1, 2, 3, 4, 5, 6, 7].map(dim => {
    const prog = progression.find(p => p.dimension === dim);
    const dimAutomata = automataByDimension[dim] || [];
    return {
      dimension: `${dim}D`,
      duration: prog?.duration || 0,
      automataCount: dimAutomata.length,
      timestamp: prog?.timestamp || Date.now(),
      fill: getDimensionColor(dim)
    };
  });

  const toggleDimension = (dim: number) => {
    setExpandedDimensions(prev => {
      const newSet = new Set(prev);
      if (newSet.has(dim)) {
        newSet.delete(dim);
      } else {
        newSet.add(dim);
      }
      return newSet;
    });
  };

  return (
    <Card title="Dimensional Overview">
      <div className="space-y-6">
        {/* Unified Dimension Grid with Integrated Automata */}
        <div>
          <h4 className="text-sm font-semibold text-white mb-3">Dimensions & Automata</h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[0, 1, 2, 3, 4, 5, 6, 7].map((dim) => {
              const dimAutomata = automataByDimension[dim] || [];
              const isActive = currentDimension === dim;
              const isExpanded = expandedDimensions.has(dim);
              const prog = progression.find(p => p.dimension === dim);
              
              return (
                <motion.div
                  key={dim}
                  whileHover={{ scale: 1.02 }}
                  className={`rounded-lg border-2 transition-all cursor-pointer ${
                    isActive ? 'ring-2 ring-[#6366f1] ring-offset-2 ring-offset-gray-800' : ''
                  }`}
                  style={{ 
                    backgroundColor: `${getDimensionColor(dim)}${isActive ? '40' : '20'}`,
                    borderColor: getDimensionColor(dim)
                  }}
                  onClick={() => toggleDimension(dim)}
                >
                  {/* Dimension Header */}
                  <div className="p-3">
                    <div className="flex items-center justify-between mb-2">
                      <div className={`text-white font-bold ${isActive ? 'text-lg' : 'text-sm'}`}>
                        {dim}D
                      </div>
                      {dimAutomata.length > 0 && (
                        <button className="text-white opacity-60 hover:opacity-100">
                          {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        </button>
                      )}
                    </div>
                    
                    <div className="text-xs text-white opacity-75 mb-2">
                      {getDimensionName(dim)}
                    </div>
                    
                    {/* Integrated Stats */}
                    <div className="flex items-center justify-between text-xs text-white opacity-60 mb-2">
                      <span>{dimAutomata.length} automata</span>
                      {prog && <span>{prog.duration}ms</span>}
                    </div>
                  </div>

                  {/* Expanded Automata Details */}
                  <AnimatePresence>
                    {isExpanded && dimAutomata.length > 0 && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="border-t border-white/20 overflow-hidden"
                      >
                        <div className="p-3 space-y-2 max-h-48 overflow-y-auto">
                          {dimAutomata.map((automaton) => (
                            <div
                              key={automaton.id}
                              className="p-2 bg-gray-900/50 rounded text-xs"
                            >
                              <div className="text-white font-medium mb-1 truncate">
                                {automaton.id}
                              </div>
                              <div className="text-white opacity-75 font-mono break-all text-xs">
                                {automaton.pattern}
                              </div>
                            </div>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* Unified Progression Chart with Automata Data */}
        {showProgressionChart && progressionData.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-semibold text-white">Dimensional Progression & Automata Distribution</h4>
              <button
                onClick={() => setShowProgressionChart(false)}
                className="text-xs text-gray-400 hover:text-white"
              >
                Hide Chart
              </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Duration Chart */}
              <div>
                <div className="text-xs text-gray-400 mb-2">Duration by Dimension</div>
                <ResponsiveContainer width="100%" height={200}>
                  <LineChart data={progressionData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <XAxis 
                      dataKey="dimension" 
                      stroke="#9ca3af"
                      fontSize={10}
                    />
                    <YAxis stroke="#9ca3af" fontSize={10} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151' }}
                      labelStyle={{ color: '#f3f4f6' }}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="duration" 
                      stroke="#6366f1" 
                      strokeWidth={2}
                      dot={{ fill: '#6366f1', r: 4 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              {/* Automata Count Chart */}
              <div>
                <div className="text-xs text-gray-400 mb-2">Automata Count by Dimension</div>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={progressionData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <XAxis 
                      dataKey="dimension" 
                      stroke="#9ca3af"
                      fontSize={10}
                    />
                    <YAxis stroke="#9ca3af" fontSize={10} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151' }}
                      labelStyle={{ color: '#f3f4f6' }}
                    />
                    <Bar 
                      dataKey="automataCount" 
                      fill="#22c55e"
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )}

        {!showProgressionChart && (
          <button
            onClick={() => setShowProgressionChart(true)}
            className="w-full py-2 text-sm text-gray-400 hover:text-white border border-gray-700 rounded-lg"
          >
            Show Progression Charts
          </button>
        )}

        {/* Summary Statistics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-4 border-t border-gray-700">
          <div className="text-center">
            <div className="text-2xl font-bold text-white">{automata.length}</div>
            <div className="text-xs text-gray-400">Total Automata</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-white">{progression.length}</div>
            <div className="text-xs text-gray-400">Progression Events</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-400">
              {progression.length > 0 
                ? (progression.reduce((sum, p) => sum + p.duration, 0) / progression.length).toFixed(0)
                : 0}ms
            </div>
            <div className="text-xs text-gray-400">Avg Duration</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-400">
              {currentDimension !== undefined ? `${currentDimension}D` : 'N/A'}
            </div>
            <div className="text-xs text-gray-400">Current Dimension</div>
          </div>
        </div>
      </div>
    </Card>
  );
};
