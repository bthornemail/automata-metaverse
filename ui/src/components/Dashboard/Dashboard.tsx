import React from 'react';
import { motion } from 'framer-motion';
import { Play, Pause, RotateCcw, Settings, Activity } from 'lucide-react';
import { useAutomatonState } from '@/hooks/useAutomatonState';

const Dashboard: React.FC = () => {
  const { state, loading, error, wsConnected, actions } = useAutomatonState();

  const dimensionColors = [
    'bg-dimension-0d', 'bg-dimension-1d', 'bg-dimension-2d', 'bg-dimension-3d',
    'bg-dimension-4d', 'bg-dimension-5d', 'bg-dimension-6d', 'bg-dimension-7d'
  ];

  const getDimensionName = (level: number): string => {
    const names = ['Identity', 'Successor', 'Pair', 'Addition', 'Network', 'Consensus', 'Intelligence', 'Quantum'];
    return names[level] || 'Unknown';
  };

  const getStatusColor = () => {
    switch (state.status) {
      case 'running': return 'status-running';
      case 'idle': return 'status-idle';
      case 'error': return 'status-stopped';
      default: return 'status-idle';
    }
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
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-white flex items-center gap-3">
          <Activity className="w-6 h-6" />
          Automaton Dashboard
        </h2>
        
        <div className="flex items-center gap-4">
          {/* Connection Status */}
          <div className="flex items-center gap-2">
            <div className={`status-indicator ${wsConnected ? 'status-running' : 'status-stopped'}`}></div>
            <span className="text-sm text-gray-400">
              {wsConnected ? 'Connected' : 'Disconnected'}
            </span>
          </div>

          {/* System Status */}
          <div className="flex items-center gap-2">
            <div className={`status-indicator ${getStatusColor()}`}></div>
            <span className="text-sm text-gray-400 capitalize">
              {state.status}
            </span>
          </div>
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
          <button
            onClick={actions.clearError}
            className="ml-2 text-red-400 hover:text-red-200 underline"
          >
            Dismiss
          </button>
        </motion.div>
      )}

      {/* Main Status Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {/* Current Dimension */}
        <div className="bg-gray-700/50 rounded-lg p-4">
          <div className="text-sm text-gray-400 mb-1">Current Dimension</div>
          <div className="flex items-center gap-2">
            <div className={`w-4 h-4 rounded ${dimensionColors[state.currentDimension]}`}></div>
            <span className="text-xl font-bold text-white">
              {state.currentDimension}D
            </span>
          </div>
          <div className="text-xs text-gray-500 mt-1">
            {getDimensionName(state.currentDimension)}
          </div>
        </div>

        {/* Iteration Count */}
        <div className="bg-gray-700/50 rounded-lg p-4">
          <div className="text-sm text-gray-400 mb-1">Iterations</div>
          <div className="text-xl font-bold text-white">
            {state.iterationCount.toLocaleString()}
          </div>
          <div className="text-xs text-gray-500 mt-1">
            Total executed
          </div>
        </div>

        {/* Self-Modifications */}
        <div className="bg-gray-700/50 rounded-lg p-4">
          <div className="text-sm text-gray-400 mb-1">Self-Modifications</div>
          <div className="text-xl font-bold text-white">
            {state.selfModificationCount}
          </div>
          <div className="text-xs text-gray-500 mt-1">
            Dynamic changes
          </div>
        </div>

        {/* Total Objects */}
        <div className="bg-gray-700/50 rounded-lg p-4">
          <div className="text-sm text-gray-400 mb-1">Total Objects</div>
          <div className="text-xl font-bold text-white">
            {state.totalObjects}
          </div>
          <div className="text-xs text-gray-500 mt-1">
            In JSONL file
          </div>
        </div>
      </div>

      {/* Dimensional Progress Bar */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-gray-400">Dimensional Progression</span>
          <span className="text-xs text-gray-500">0D → 7D</span>
        </div>
        <div className="flex gap-1">
          {dimensionColors.map((color, index) => (
            <div
              key={index}
              className={`flex-1 h-3 rounded-full transition-all duration-300 ${
                index <= state.currentDimension ? color : 'bg-gray-700'
              }`}
            />
          ))}
        </div>
      </div>

      {/* Control Buttons */}
      <div className="flex flex-wrap gap-3">
        <button
          onClick={() => state.isRunning ? actions.stopAutomaton() : actions.startAutomaton()}
          disabled={state.status === 'error'}
          className={`control-button flex items-center gap-2 ${
            state.isRunning 
              ? 'bg-red-600 hover:bg-red-700 text-white' 
              : 'bg-green-600 hover:bg-green-700 text-white'
          }`}
        >
          {state.isRunning ? (
            <>
              <Pause className="w-4 h-4" />
              Stop
            </>
          ) : (
            <>
              <Play className="w-4 h-4" />
              Start
            </>
          )}
        </button>

        <button
          onClick={actions.resetAutomaton}
          disabled={state.isRunning}
          className="control-button bg-gray-600 hover:bg-gray-700 text-white flex items-center gap-2"
        >
          <RotateCcw className="w-4 h-4" />
          Reset
        </button>

        <button
          className="control-button bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-2"
        >
          <Settings className="w-4 h-4" />
          Configure
        </button>
      </div>

      {/* Last Action */}
      {state.lastAction && (
        <div className="mt-4 p-3 bg-gray-700/30 rounded-lg">
          <div className="text-sm text-gray-400">Last Action</div>
          <div className="text-white font-mono">{state.lastAction}</div>
        </div>
      )}

      {/* Execution Mode */}
      <div className="mt-4 flex items-center gap-4">
        <span className="text-sm text-gray-400">Mode:</span>
        <div className="flex gap-2">
          <button
            className={`px-3 py-1 rounded text-sm ${
              state.executionMode === 'builtin'
                 ? 'bg-[#6366f1] text-white'
                : 'bg-gray-700 text-gray-400'
            }`}
          >
            Built-in
          </button>
          <button
            className={`px-3 py-1 rounded text-sm ${
              state.executionMode === 'ollama'
                ? 'bg-quantum-superposition text-white'
                : 'bg-gray-700 text-gray-400'
            }`}
          >
            AI (Ollama)
          </button>
        </div>
        {state.executionMode === 'ollama' && state.ollamaModel && (
          <span className="text-xs text-gray-500">
            Model: {state.ollamaModel}
          </span>
        )}
      </div>
    </div>
  );
};

export default Dashboard;