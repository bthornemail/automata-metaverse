import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Play, SkipForward, RotateCcw, Zap, Eye, BookOpen, Save, Upload } from 'lucide-react';
import { useAutomatonState } from '@/hooks/useAutomatonState';

const ControlPanel: React.FC = () => {
  const { state, actions } = useAutomatonState();
  const [selectedAction, setSelectedAction] = useState('evolve');
  const [intervalMs, setIntervalMs] = useState(2000);
  const [maxIterations, setMaxIterations] = useState(100);

  const availableActions = [
    { id: 'evolve', name: 'Evolve', description: 'Progress to next dimension', icon: SkipForward },
    { id: 'self-reference', name: 'Self-Reference', description: 'Execute self-reference pattern', icon: RotateCcw },
    { id: 'self-modify', name: 'Self-Modify', description: 'Add new self-referential object', icon: Zap },
    { id: 'self-io', name: 'Self-I/O', description: 'Read/write own JSONL file', icon: Upload },
    { id: 'validate-self', name: 'Validate Self', description: 'Check SHACL compliance', icon: Eye },
    { id: 'self-train', name: 'Self-Train', description: 'Learn from execution history', icon: BookOpen },
    { id: 'self-observe', name: 'Self-Observe', description: 'Quantum observation and collapse', icon: Eye },
    { id: 'compose', name: 'Compose', description: 'Compose multiple states', icon: Save },
  ];

  const handleExecuteAction = async () => {
    await actions.executeAction(selectedAction);
  };

  const handleStartStop = async () => {
    if (state.isRunning) {
      await actions.stopAutomaton();
    } else {
      await actions.startAutomaton({ intervalMs, maxIterations });
    }
  };

  const handleIntervalChange = (newInterval: number) => {
    setIntervalMs(newInterval);
    // If running, restart with new interval
    if (state.isRunning) {
      actions.stopAutomaton();
      setTimeout(() => {
        actions.startAutomaton({ intervalMs: newInterval, maxIterations });
      }, 100);
    }
  };

  return (
    <div className="p-6 bg-gray-800 rounded-xl shadow-xl">
      <h3 className="text-xl font-bold text-white mb-6">Control Panel</h3>

      {/* Quick Actions */}
      <div className="mb-6">
        <h4 className="text-sm font-medium text-gray-400 mb-3">Quick Actions</h4>
        <div className="flex flex-wrap gap-3">
          <button
            onClick={handleStartStop}
            className={`control-button flex items-center gap-2 px-6 py-3 ${
              state.isRunning 
                ? 'bg-red-600 hover:bg-red-700 text-white' 
                : 'bg-green-600 hover:bg-green-700 text-white'
            }`}
          >
            {state.isRunning ? (
              <>
                <Play className="w-5 h-5" />
                Stop Automaton
              </>
            ) : (
              <>
                <Play className="w-5 h-5" />
                Start Automaton
              </>
            )}
          </button>

          <button
            onClick={actions.resetAutomaton}
            disabled={state.isRunning}
            className="control-button bg-gray-600 hover:bg-gray-700 text-white flex items-center gap-2 px-6 py-3"
          >
            <RotateCcw className="w-5 h-5" />
            Reset
          </button>
        </div>
      </div>

      {/* Action Selection */}
      <div className="mb-6">
        <h4 className="text-sm font-medium text-gray-400 mb-3">Manual Action Execution</h4>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
          {availableActions.map((action) => {
            const Icon = action.icon;
            return (
              <motion.button
                key={action.id}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setSelectedAction(action.id)}
                className={`p-3 rounded-lg border-2 transition-all duration-200 text-left ${
                  selectedAction === action.id
                     ? 'border-[#6366f1] bg-[#6366f1]/20 text-white'
                    : 'border-gray-600 bg-gray-700/50 text-gray-300 hover:border-gray-500'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className="w-5 h-5" />
                  <div>
                    <div className="font-medium">{action.name}</div>
                    <div className="text-xs opacity-75">{action.description}</div>
                  </div>
                </div>
              </motion.button>
            );
          })}
        </div>

        <button
          onClick={handleExecuteAction}
          disabled={state.isRunning}
          className="control-button w-full bg-[#6366f1] hover:bg-[#8b5cf6] text-white flex items-center justify-center gap-2"
        >
          <Zap className="w-4 h-4" />
          Execute: {availableActions.find(a => a.id === selectedAction)?.name}
        </button>
      </div>

      {/* Execution Parameters */}
      <div className="mb-6">
        <h4 className="text-sm font-medium text-gray-400 mb-3">Execution Parameters</h4>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Interval Control */}
          <div>
            <label className="block text-sm text-gray-300 mb-2">
              Execution Interval: {intervalMs}ms
            </label>
            <input
              type="range"
              min="100"
              max="10000"
              step="100"
              value={intervalMs}
              onChange={(e) => handleIntervalChange(Number(e.target.value))}
              className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
              disabled={state.isRunning}
            />
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>100ms</span>
              <span>10s</span>
            </div>
          </div>

          {/* Max Iterations */}
          <div>
            <label className="block text-sm text-gray-300 mb-2">
              Max Iterations: {maxIterations === Infinity ? 'Unlimited' : maxIterations}
            </label>
            <input
              type="range"
              min="10"
              max="1000"
              step="10"
              value={maxIterations}
              onChange={(e) => setMaxIterations(Number(e.target.value))}
              className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
              disabled={state.isRunning}
            />
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>10</span>
              <span>1000</span>
            </div>
          </div>
        </div>
      </div>

      {/* Dimension Control */}
      <div className="mb-6">
        <h4 className="text-sm font-medium text-gray-400 mb-3">Dimension Control</h4>
        
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-300">Jump to Dimension:</span>
          <div className="flex gap-2">
            {[0, 1, 2, 3, 4, 5, 6, 7].map((dim) => (
              <button
                key={dim}
                onClick={() => actions.setDimension(dim)}
                className={`w-10 h-10 rounded-lg font-medium transition-all duration-200 ${
                  state.currentDimension === dim
                     ? 'bg-[#6366f1] text-white'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                {dim}D
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Current Status */}
      <div className="p-4 bg-gray-700/30 rounded-lg">
        <h4 className="text-sm font-medium text-gray-400 mb-2">Current Status</h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div>
            <span className="text-gray-400">Mode:</span>
            <span className="ml-2 text-white capitalize">{state.executionMode}</span>
          </div>
          <div>
            <span className="text-gray-400">Status:</span>
            <span className="ml-2 text-white capitalize">{state.status}</span>
          </div>
          <div>
            <span className="text-gray-400">Dimension:</span>
            <span className="ml-2 text-white">{state.currentDimension}D</span>
          </div>
          <div>
            <span className="text-gray-400">Iterations:</span>
            <span className="ml-2 text-white">{state.iterationCount}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ControlPanel;