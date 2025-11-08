import React from 'react';
import { CheckCircle, AlertCircle, Settings, Zap, Brain, Search, Play, Terminal } from 'lucide-react';
import { Agent } from '../types';

interface EditorToolbarProps {
  isConnected: boolean;
  onShowConfig: () => void;
  onShowAgents: () => void;
  onAnalyze: () => void;
  onGenerateCode: () => void;
  onExecuteQuery: () => void;
  onRunCode: () => void;
  onToggleConsole: () => void;
  showConsole: boolean;
  availableAgents: Agent[];
}

export const EditorToolbar: React.FC<EditorToolbarProps> = ({
  isConnected,
  onShowConfig,
  onShowAgents,
  onAnalyze,
  onGenerateCode,
  onExecuteQuery,
  onRunCode,
  onToggleConsole,
  showConsole,
  availableAgents
}) => {
  return (
    <div className="flex items-center gap-2">
      <div className={`flex items-center space-x-1 px-2 py-1 rounded-full text-xs ${
        isConnected ? 'bg-green-900 text-green-300' : 'bg-red-900 text-red-300'
      }`}>
        {isConnected ? (
          <>
            <CheckCircle className="w-3 h-3" />
            <span>Connected</span>
          </>
        ) : (
          <>
            <AlertCircle className="w-3 h-3" />
            <span>Disconnected</span>
          </>
        )}
      </div>

      <div className="h-6 w-px bg-gray-600" />

      <button
        onClick={onShowConfig}
        className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
        title="OpenCode Configuration"
      >
        <Settings className="w-4 h-4 text-gray-300" />
      </button>

      <button
        onClick={onShowAgents}
        className="p-2 hover:bg-gray-700 rounded-lg transition-colors relative"
        title="AI Agents"
      >
        <Brain className="w-4 h-4 text-gray-300" />
        {availableAgents.length > 0 && (
          <span className="absolute -top-1 -right-1 bg-blue-600 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
            {availableAgents.length}
          </span>
        )}
      </button>

      <div className="h-6 w-px bg-gray-600" />

      <button
        onClick={onAnalyze}
        className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
        title="Analyze Code"
      >
        <Zap className="w-4 h-4 text-gray-300" />
      </button>

      <button
        onClick={onGenerateCode}
        className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
        title="Generate Code"
      >
        <Play className="w-4 h-4 text-gray-300" />
      </button>

      <button
        onClick={onExecuteQuery}
        className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
        title="Execute Query"
      >
        <Search className="w-4 h-4 text-gray-300" />
      </button>

      <button
        onClick={onRunCode}
        className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
        title="Run Code"
      >
        <Terminal className="w-4 h-4 text-gray-300" />
      </button>

      <div className="h-6 w-px bg-gray-600" />

      <button
        onClick={onToggleConsole}
        className={`p-2 hover:bg-gray-700 rounded-lg transition-colors ${
          showConsole ? 'bg-gray-700' : ''
        }`}
        title="Toggle Console"
      >
        <Terminal className="w-4 h-4 text-gray-300" />
      </button>
    </div>
  );
};