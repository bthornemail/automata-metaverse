import React, { useCallback } from 'react';
import { motion } from 'framer-motion';
import { Play, Pause, RotateCcw, Settings, Activity } from 'lucide-react';
import { useStatus, useWsConnected } from '@/hooks/useUnifiedState';
import { useAutomatonActions } from '@/hooks/useAutomatonActions';
import { useAutomatonStore } from '@/store/automatonStore';
import { LoadingSpinner } from '@/components/shared/LoadingSpinner';
import { Button } from '@/components/shared/Button';
import { Card } from '@/components/shared/Card';

const Dashboard: React.FC = () => {
  // Use unified state and hooks
  const status = useStatus();
  const wsConnected = useWsConnected();
  const { startAutomaton, stopAutomaton, resetAutomaton } = useAutomatonActions();
  const setError = useAutomatonStore((state) => state.setError);
  
  // Stable function to clear errors
  const clearError = useCallback((key: string) => {
    setError(key, null);
  }, [setError]);
  
  // Get loading and error states from store
  const loading = useAutomatonStore((state) => state.loading.start || state.loading.stop || state.loading.reset || false);
  const error = useAutomatonStore((state) => state.errors.start || state.errors.stop || state.errors.reset || null);

  const dimensionColors = [
    'bg-dimension-0d', 'bg-dimension-1d', 'bg-dimension-2d', 'bg-dimension-3d',
    'bg-dimension-4d', 'bg-dimension-5d', 'bg-dimension-6d', 'bg-dimension-7d'
  ];

  const getDimensionName = (level: number): string => {
    const names = ['Identity', 'Successor', 'Pair', 'Addition', 'Network', 'Consensus', 'Intelligence', 'Quantum'];
    return names[level] || 'Unknown';
  };

  const getStatusColor = () => {
    switch (status.status) {
      case 'running': return 'status-running';
      case 'idle': return 'status-idle';
      case 'error': return 'status-stopped';
      default: return 'status-idle';
    }
  };

  if (loading) {
    return (
      <Card data-testid="dashboard">
        <LoadingSpinner size="lg" text="Loading dashboard..." />
      </Card>
    );
  }

  return (
    <Card data-testid="dashboard">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-white flex items-center gap-3">
          <Activity className="w-6 h-6" aria-hidden="true" />
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
              {status.status}
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
            onClick={() => {
              clearError('start');
              clearError('stop');
              clearError('reset');
            }}
            className="ml-2 text-red-400 hover:text-red-200 underline"
          >
            Dismiss
          </button>
        </motion.div>
      )}

      {/* Main Status Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6" data-testid="metrics-grid">
        {/* Current Dimension */}
        <div className="bg-gray-700/50 rounded-lg p-4" data-testid="status-card">
          <div className="text-sm text-gray-400 mb-1">Current Dimension</div>
          <div className="flex items-center gap-2">
            <div className={`w-4 h-4 rounded ${dimensionColors[status.currentDimension]}`}></div>
            <span className="text-xl font-bold text-white">
              {status.currentDimension}D
            </span>
          </div>
          <div className="text-xs text-gray-500 mt-1">
            {getDimensionName(status.currentDimension)}
          </div>
        </div>

        {/* Iteration Count */}
        <div className="bg-gray-700/50 rounded-lg p-4">
          <div className="text-sm text-gray-400 mb-1">Iterations</div>
          <div className="text-xl font-bold text-white">
            {status.iterationCount.toLocaleString()}
          </div>
          <div className="text-xs text-gray-500 mt-1">
            Total executed
          </div>
        </div>

        {/* Self-Modifications */}
        <div className="bg-gray-700/50 rounded-lg p-4">
          <div className="text-sm text-gray-400 mb-1">Self-Modifications</div>
          <div className="text-xl font-bold text-white">
            {status.selfModificationCount}
          </div>
          <div className="text-xs text-gray-500 mt-1">
            Dynamic changes
          </div>
        </div>

        {/* Total Objects */}
        <div className="bg-gray-700/50 rounded-lg p-4">
          <div className="text-sm text-gray-400 mb-1">Total Objects</div>
          <div className="text-xl font-bold text-white">
            {status.totalObjects}
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
                index <= status.currentDimension ? color : 'bg-gray-700'
              }`}
            />
          ))}
        </div>
      </div>

      {/* Control Buttons */}
      <div className="flex flex-wrap gap-3">
        <Button
          onClick={() => status.isRunning ? stopAutomaton() : startAutomaton()}
          disabled={status.status === 'error'}
          variant={status.isRunning ? 'danger' : 'success'}
          leftIcon={status.isRunning ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
        >
          {status.isRunning ? 'Stop' : 'Start'}
        </Button>

        <Button
          onClick={resetAutomaton}
          disabled={status.isRunning}
          variant="secondary"
          leftIcon={<RotateCcw className="w-4 h-4" />}
        >
          Reset
        </Button>

        <Button
          variant="secondary"
          leftIcon={<Settings className="w-4 h-4" />}
        >
          Configure
        </Button>
      </div>

      {/* Last Action */}
      {status.lastAction && (
        <div className="mt-4 p-3 bg-gray-700/30 rounded-lg">
          <div className="text-sm text-gray-400">Last Action</div>
          <div className="text-white font-mono">{status.lastAction}</div>
        </div>
      )}

      {/* Execution Mode */}
      <div className="mt-4 flex items-center gap-4">
        <span className="text-sm text-gray-400">Mode:</span>
        <div className="flex gap-2">
          <button
            onClick={() => {/* Handle mode change */}}
            aria-label="Built-in execution mode"
            aria-pressed={status.executionMode === 'builtin'}
            className={`px-3 py-1 rounded text-sm ${
              status.executionMode === 'builtin'
                 ? 'bg-[#6366f1] text-white'
                : 'bg-gray-700 text-gray-400'
            }`}
          >
            Built-in
          </button>
          <button
            onClick={() => {/* Handle mode change */}}
            aria-label="AI (Ollama) execution mode"
            aria-pressed={status.executionMode === 'ollama'}
            className={`px-3 py-1 rounded text-sm ${
              status.executionMode === 'ollama'
                ? 'bg-quantum-superposition text-white'
                : 'bg-gray-700 text-gray-400'
            }`}
          >
            AI (Ollama)
          </button>
        </div>
        {status.executionMode === 'ollama' && status.ollamaModel && (
          <span className="text-xs text-gray-500">
            Model: {status.ollamaModel}
          </span>
        )}
      </div>
    </Card>
  );
};

export default Dashboard;