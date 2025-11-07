import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Play, SkipForward, RotateCcw, Zap, Eye, BookOpen, Save, Upload } from 'lucide-react';
import { useStatus } from '@/hooks/useUnifiedState';
import { useAutomatonActions } from '@/hooks/useAutomatonActions';
import { Card } from '@/components/shared/Card';
import { Button } from '@/components/shared/Button';

const ControlPanel: React.FC = () => {
  const status = useStatus();
  const { startAutomaton, stopAutomaton, resetAutomaton, executeAction, setDimension } = useAutomatonActions();
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
    await executeAction(selectedAction);
  };

  const handleStartStop = async () => {
    if (status.isRunning) {
      await stopAutomaton();
    } else {
      await startAutomaton({ intervalMs, maxIterations });
    }
  };

  const handleIntervalChange = (newInterval: number) => {
    setIntervalMs(newInterval);
    // If running, restart with new interval
    if (status.isRunning) {
      stopAutomaton();
      setTimeout(() => {
        startAutomaton({ intervalMs: newInterval, maxIterations });
      }, 100);
    }
  };

  return (
    <Card title="Control Panel">

      {/* Quick Actions */}
      <div className="mb-6">
        <h4 className="text-sm font-medium text-gray-400 mb-3">Quick Actions</h4>
        <div className="flex flex-wrap gap-3">
          <Button
            onClick={handleStartStop}
            variant={status.isRunning ? 'danger' : 'success'}
            leftIcon={<Play className="w-5 h-5" />}
          >
            {status.isRunning ? 'Stop Automaton' : 'Start Automaton'}
          </Button>

          <Button
            onClick={resetAutomaton}
            disabled={status.isRunning}
            variant="secondary"
            leftIcon={<RotateCcw className="w-5 h-5" />}
          >
            Reset
          </Button>
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

        <Button
          onClick={handleExecuteAction}
          disabled={status.isRunning}
          variant="primary"
          className="w-full"
          leftIcon={<Zap className="w-4 h-4" />}
        >
          Execute: {availableActions.find(a => a.id === selectedAction)?.name}
        </Button>
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
              disabled={status.isRunning}
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
              disabled={status.isRunning}
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
              <Button
                key={dim}
                onClick={() => setDimension(dim)}
                variant={status.currentDimension === dim ? 'primary' : 'secondary'}
                size="sm"
                className="w-10 h-10"
              >
                {dim}D
              </Button>
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
            <span className="ml-2 text-white capitalize">{status.executionMode}</span>
          </div>
          <div>
            <span className="text-gray-400">Status:</span>
            <span className="ml-2 text-white capitalize">{status.status}</span>
          </div>
          <div>
            <span className="text-gray-400">Dimension:</span>
            <span className="ml-2 text-white">{status.currentDimension}D</span>
          </div>
          <div>
            <span className="text-gray-400">Iterations:</span>
            <span className="ml-2 text-white">{status.iterationCount}</span>
          </div>
        </div>
      </div>
    </Card>
  );
};

export default ControlPanel;