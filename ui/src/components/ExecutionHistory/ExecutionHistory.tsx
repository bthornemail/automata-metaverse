import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell, Sankey } from 'recharts';
import { History, TrendingUp, Clock, Zap, Activity } from 'lucide-react';
import { useExecutionHistory } from '@/hooks/useExecutionHistory';

const ExecutionHistory: React.FC = () => {
  const { data, loading, error, actions } = useExecutionHistory();
  const [selectedView, setSelectedView] = useState<'timeline' | 'frequency' | 'progression' | 'performance'>('timeline');

  const dimensionColors = [
    '#6366f1', '#8b5cf6', '#ec4899', '#f43f5e',
    '#f97316', '#eab308', '#22c55e', '#06b6d4'
  ];

  const actionColors = [
    '#3b82f6', '#10b981', '#f59e0b', '#ef4444',
    '#8b5cf6', '#ec4899', '#06b6d4', '#f97316'
  ];

  // Prepare data for charts
  const actionFrequencyData = Array.from(data.actionFrequency.entries()).map(([action, count]) => ({
    action: action.replace('-', ' '),
    count,
    fill: actionColors[Math.floor(Math.random() * actionColors.length)]
  }));

  const dimensionalProgressionData = data.dimensionalProgression.map((prog, index) => ({
    dimension: `${prog.dimension}D`,
    duration: prog.duration,
    timestamp: prog.timestamp,
    fill: dimensionColors[prog.dimension] || '#6b7280'
  }));

  const performanceData = [
    { metric: 'Avg Execution Time', value: data.performanceMetrics.avgExecutionTime, unit: 'ms' },
    { metric: 'Success Rate', value: data.performanceMetrics.successRate, unit: '%' }
  ];

  const recentHistory = data.history.slice(-20).map((entry, index) => ({
    ...entry,
    displayTime: new Date(entry.timestamp).toLocaleTimeString(),
    actionDisplay: entry.action.replace('-', ' ')
  }));

  const getDimensionName = (level: number): string => {
    const names = ['Identity', 'Successor', 'Pair', 'Addition', 'Network', 'Consensus', 'Intelligence', 'Quantum'];
    return names[level] || 'Unknown';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#6366f1]"></div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-gray-800 rounded-xl shadow-xl">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-bold text-white flex items-center gap-3">
          <History className="w-6 h-6" />
          Execution History & Analysis
        </h3>
        
        <div className="flex gap-2">
          <button
            onClick={() => actions.loadHistory()}
            disabled={loading}
            className="control-button bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-2"
          >
            <Zap className="w-4 h-4" />
            Refresh
          </button>
          
          <button
            onClick={actions.clearHistory}
            className="control-button bg-red-600 hover:bg-red-700 text-white flex items-center gap-2"
          >
            <Clock className="w-4 h-4" />
            Clear
          </button>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-4 p-3 bg-red-900/50 border border-red-500 rounded-lg text-red-200 text-sm"
        >
          <strong>Error:</strong> {error}
        </motion.div>
      )}

      {/* View Selector */}
      <div className="flex gap-2 mb-6">
        {[
          { id: 'timeline', label: 'Timeline', icon: Clock },
          { id: 'frequency', label: 'Action Frequency', icon: Activity },
          { id: 'progression', label: 'Dimensional Progression', icon: TrendingUp },
          { id: 'performance', label: 'Performance', icon: Zap }
        ].map((view) => {
          const Icon = view.icon;
          return (
            <button
              key={view.id}
              onClick={() => setSelectedView(view.id as any)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-200 ${
                selectedView === view.id
                  ? 'bg-[#6366f1] text-white'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              <Icon className="w-4 h-4" />
              {view.label}
            </button>
          );
        })}
      </div>

      {/* Timeline View */}
      {selectedView === 'timeline' && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="space-y-4"
        >
          <div className="bg-gray-700/30 rounded-lg p-4">
            <h4 className="text-lg font-semibold text-white mb-4">Recent Execution Timeline</h4>
            
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {recentHistory.length === 0 ? (
                <div className="text-center text-gray-400 py-8">
                  No execution history available
                </div>
              ) : (
                recentHistory.map((entry, index) => (
                  <motion.div
                    key={`${entry.timestamp}-${index}`}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="p-3 bg-gray-800 rounded-lg border-l-4 border-[#6366f1]"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-white font-medium">{entry.actionDisplay}</div>
                        <div className="text-sm text-gray-400">
                          {entry.from} → {entry.to}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm text-gray-400">Iteration {entry.iteration}</div>
                        <div className="text-xs text-gray-500">{entry.displayTime}</div>
                      </div>
                    </div>
                  </motion.div>
                ))
              )}
            </div>
          </div>
        </motion.div>
      )}

      {/* Action Frequency View */}
      {selectedView === 'frequency' && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="space-y-4"
        >
          <div className="bg-gray-700/30 rounded-lg p-4">
            <h4 className="text-lg font-semibold text-white mb-4">Action Frequency Distribution</h4>
            
            {actionFrequencyData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={actionFrequencyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis 
                    dataKey="action" 
                    stroke="#9ca3af"
                    angle={-45}
                    textAnchor="end"
                    height={80}
                  />
                  <YAxis stroke="#9ca3af" />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151' }}
                    labelStyle={{ color: '#f3f4f6' }}
                  />
                  <Bar dataKey="count" fill="#6366f1" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-center text-gray-400 py-8">
                No action frequency data available
              </div>
            )}
          </div>
        </motion.div>
      )}

      {/* Dimensional Progression View */}
      {selectedView === 'progression' && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="space-y-4"
        >
          <div className="bg-gray-700/30 rounded-lg p-4">
            <h4 className="text-lg font-semibold text-white mb-4">Dimensional Progression</h4>
            
            {dimensionalProgressionData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={dimensionalProgressionData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis 
                    dataKey="dimension" 
                    stroke="#9ca3af"
                  />
                  <YAxis stroke="#9ca3af" />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151' }}
                    labelStyle={{ color: '#f3f4f6' }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="duration" 
                    stroke="#6366f1" 
                    strokeWidth={2}
                    dot={{ fill: '#6366f1', r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-center text-gray-400 py-8">
                No dimensional progression data available
              </div>
            )}
          </div>

          {/* Dimension Summary */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[0, 1, 2, 3, 4, 5, 6, 7].map((dim) => (
              <div
                key={dim}
                className="p-3 bg-gray-700/50 rounded-lg border-2"
                style={{ borderColor: dimensionColors[dim] }}
              >
                <div className="text-white font-bold text-center">
                  {dim}D
                </div>
                <div className="text-xs text-gray-400 text-center">
                  {getDimensionName(dim)}
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Performance View */}
      {selectedView === 'performance' && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="space-y-4"
        >
          <div className="bg-gray-700/30 rounded-lg p-4">
            <h4 className="text-lg font-semibold text-white mb-4">Performance Metrics</h4>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={performanceData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis dataKey="metric" stroke="#9ca3af" />
                  <YAxis stroke="#9ca3af" />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151' }}
                    labelStyle={{ color: '#f3f4f6' }}
                  />
                  <Bar dataKey="value" fill="#22c55e" />
                </BarChart>
              </ResponsiveContainer>

              <div className="space-y-4">
                <div className="bg-gray-800 rounded-lg p-4">
                  <div className="text-sm text-gray-400 mb-1">Total Executions</div>
                  <div className="text-2xl font-bold text-white">
                    {data.history.length}
                  </div>
                </div>
                
                <div className="bg-gray-800 rounded-lg p-4">
                  <div className="text-sm text-gray-400 mb-1">Unique Actions</div>
                  <div className="text-2xl font-bold text-white">
                    {data.actionFrequency.size}
                  </div>
                </div>
                
                <div className="bg-gray-800 rounded-lg p-4">
                  <div className="text-sm text-gray-400 mb-1">Success Rate</div>
                  <div className="text-2xl font-bold text-green-400">
                    {data.performanceMetrics.successRate.toFixed(1)}%
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default ExecutionHistory;