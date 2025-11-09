import React, { useState, useRef, useEffect } from 'react';
import { Terminal, ChevronUp, ChevronDown } from 'lucide-react';
import { ConsoleOutput } from '../types';

interface REPLConsoleProps {
  outputs: ConsoleOutput[];
  onExecuteCommand: (command: string) => void;
  onClear: () => void;
  isVisible: boolean;
  onToggleVisibility: () => void;
  height?: number;
}

export const REPLConsole: React.FC<REPLConsoleProps> = ({
  outputs,
  onExecuteCommand,
  onClear,
  isVisible,
  onToggleVisibility,
  height = 300
}) => {
  const [input, setInput] = useState('');
  const [history, setHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const outputRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (outputRef.current) {
      outputRef.current.scrollTop = outputRef.current.scrollHeight;
    }
  }, [outputs]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim()) {
      onExecuteCommand(input);
      setHistory(prev => [...prev, input]);
      setHistoryIndex(-1);
      setInput('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (history.length > 0) {
        const newIndex = historyIndex < history.length - 1 ? historyIndex + 1 : historyIndex;
        setHistoryIndex(newIndex);
        setInput(history[history.length - 1 - newIndex]);
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (historyIndex > 0) {
        const newIndex = historyIndex - 1;
        setHistoryIndex(newIndex);
        setInput(history[history.length - 1 - newIndex]);
      } else if (historyIndex === 0) {
        setHistoryIndex(-1);
        setInput('');
      }
    }
  };

  const getOutputColor = (type: ConsoleOutput['type']) => {
    switch (type) {
      case 'error': return 'text-red-400';
      case 'warning': return 'text-yellow-400';
      case 'success': return 'text-green-400';
      default: return 'text-gray-300';
    }
  };

  if (!isVisible) {
    return (
      <div className="border-t border-gray-700 p-2 bg-gray-800">
        <button
          onClick={onToggleVisibility}
          className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors text-sm"
        >
          <Terminal className="w-4 h-4 text-green-400" />
          <span>Show REPL Console</span>
          <ChevronUp className="w-4 h-4 text-gray-400" />
        </button>
      </div>
    );
  }

  return (
    <div className="border-t border-gray-700 bg-gray-900 flex flex-col" style={{ height }}>
      <div className="flex items-center justify-between px-4 py-2 bg-gray-800 border-b border-gray-700">
        <div className="flex items-center gap-2">
          <Terminal className="w-4 h-4 text-green-400" />
          <span className="text-sm font-medium text-white">REPL Console</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={onClear}
            className="px-2 py-1 text-xs bg-gray-700 hover:bg-gray-600 rounded transition-colors text-gray-300"
          >
            Clear
          </button>
          <button
            onClick={onToggleVisibility}
            className="p-1 hover:bg-gray-700 rounded transition-colors"
          >
            <ChevronDown className="w-4 h-4 text-gray-400" />
          </button>
        </div>
      </div>

      <div
        ref={outputRef}
        className="flex-1 overflow-y-auto p-4 font-mono text-sm"
        style={{ maxHeight: height - 80 }}
      >
        {outputs.map((output) => (
          <div
            key={output.id}
            className={`mb-2 ${getOutputColor(output.type)}`}
          >
            <span className="opacity-70">
              [{new Date(output.timestamp).toLocaleTimeString()}]
            </span>{' '}
            {output.message}
          </div>
        ))}
        {outputs.length === 0 && (
          <div className="text-gray-500 italic">
            Type a command below and press Enter to execute...
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit} className="border-t border-gray-700 p-3">
        <div className="flex items-center gap-2">
          <span className="text-green-400 font-mono">$</span>
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Enter command..."
            className="flex-1 bg-transparent border-none outline-none text-white font-mono text-sm placeholder-gray-500"
            autoFocus
          />
        </div>
      </form>
    </div>
  );
};