/**
 * Mode Switcher Component
 * UI for switching between major/minor modes
 */

import React from 'react';
import { MajorMode, MinorMode, EnvironmentType, Symbol } from '../types';
import { 
  Globe, Code, Network, Box, 
  Layers, Target, ChevronDown, ChevronUp 
} from 'lucide-react';

interface ModeSwitcherProps {
  majorMode: MajorMode;
  minorMode: MinorMode;
  selectedSymbol: Symbol | null;
  availableEnvironments: EnvironmentType[];
  availableSymbols: Symbol[];
  onMajorModeChange: (mode: MajorMode) => void;
  onMinorModeChange: (mode: MinorMode) => void;
  onSymbolSelect: (symbol: Symbol | null) => void;
}

const environmentIcons: Record<EnvironmentType, React.ReactNode> = {
  'abstract': <Globe className="w-4 h-4" />,
  'canvas-2d': <Network className="w-4 h-4" />,
  'code-media': <Code className="w-4 h-4" />,
  '3d-gltf': <Box className="w-4 h-4" />
};

const environmentLabels: Record<EnvironmentType, string> = {
  'abstract': 'Abstract',
  'canvas-2d': 'Canvas 2D',
  'code-media': 'Code/Media',
  '3d-gltf': '3D GLTF'
};

export const ModeSwitcher: React.FC<ModeSwitcherProps> = ({
  majorMode,
  minorMode,
  selectedSymbol,
  availableEnvironments,
  availableSymbols,
  onMajorModeChange,
  onMinorModeChange,
  onSymbolSelect
}) => {
  const [showEnvironments, setShowEnvironments] = React.useState(false);
  const [showSymbols, setShowSymbols] = React.useState(false);

  const isEnvironmentMode = majorMode === 'environment';
  const isSymbolMode = majorMode === 'symbol';

  return (
    <div className="bg-gray-800 border-b border-gray-700 p-4">
      <div className="flex items-center gap-4">
        {/* Major Mode Selector */}
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-400">Mode:</span>
          <div className="flex gap-1 bg-gray-700 rounded-lg p-1">
            <button
              onClick={() => onMajorModeChange('environment')}
              className={`flex items-center gap-2 px-3 py-1 rounded text-sm transition-colors ${
                isEnvironmentMode
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <Layers className="w-4 h-4" />
              Environment
            </button>
            <button
              onClick={() => onMajorModeChange('symbol')}
              className={`flex items-center gap-2 px-3 py-1 rounded text-sm transition-colors ${
                isSymbolMode
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <Target className="w-4 h-4" />
              Symbol
            </button>
          </div>
        </div>

        {/* Minor Mode Selector - Environments */}
        {isEnvironmentMode && (
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-400">Environment:</span>
            <div className="relative">
              <button
                onClick={() => setShowEnvironments(!showEnvironments)}
                className="flex items-center gap-2 px-3 py-1 bg-gray-700 hover:bg-gray-600 rounded-lg text-sm"
              >
                {environmentIcons[minorMode as EnvironmentType]}
                {environmentLabels[minorMode as EnvironmentType] || minorMode}
                {showEnvironments ? (
                  <ChevronUp className="w-4 h-4" />
                ) : (
                  <ChevronDown className="w-4 h-4" />
                )}
              </button>
              
              {showEnvironments && (
                <div className="absolute top-full left-0 mt-1 bg-gray-700 rounded-lg shadow-lg z-50 min-w-[200px]">
                  {availableEnvironments.map(env => (
                    <button
                      key={env}
                      onClick={() => {
                        onMinorModeChange(env);
                        setShowEnvironments(false);
                      }}
                      className={`w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-gray-600 rounded-lg transition-colors ${
                        minorMode === env ? 'bg-blue-600/20 text-blue-400' : 'text-gray-300'
                      }`}
                    >
                      {environmentIcons[env]}
                      {environmentLabels[env]}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Minor Mode Selector - Symbols */}
        {isSymbolMode && (
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-400">Symbol:</span>
            <div className="relative">
              <button
                onClick={() => setShowSymbols(!showSymbols)}
                className="flex items-center gap-2 px-3 py-1 bg-gray-700 hover:bg-gray-600 rounded-lg text-sm"
              >
                {selectedSymbol ? (
                  <>
                    <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                    {selectedSymbol.name}
                  </>
                ) : (
                  <>
                    <Target className="w-4 h-4" />
                    Select Symbol
                  </>
                )}
                {showSymbols ? (
                  <ChevronUp className="w-4 h-4" />
                ) : (
                  <ChevronDown className="w-4 h-4" />
                )}
              </button>
              
              {showSymbols && (
                <div className="absolute top-full left-0 mt-1 bg-gray-700 rounded-lg shadow-lg z-50 min-w-[250px] max-h-[400px] overflow-y-auto">
                  {availableSymbols.length === 0 ? (
                    <div className="px-3 py-2 text-gray-400 text-sm">No symbols available</div>
                  ) : (
                    availableSymbols.map(symbol => (
                      <button
                        key={symbol.id}
                        onClick={() => {
                          onSymbolSelect(symbol);
                          setShowSymbols(false);
                        }}
                        className={`w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-gray-600 rounded-lg transition-colors ${
                          selectedSymbol?.id === symbol.id ? 'bg-blue-600/20 text-blue-400' : 'text-gray-300'
                        }`}
                      >
                        <span className={`w-2 h-2 rounded-full ${
                          symbol.type === 'node' ? 'bg-green-500' :
                          symbol.type === 'edge' ? 'bg-blue-500' :
                          symbol.type === 'avatar' ? 'bg-purple-500' :
                          symbol.type === 'code' ? 'bg-yellow-500' :
                          'bg-gray-500'
                        }`}></span>
                        <div className="flex-1">
                          <div className="font-medium">{symbol.name}</div>
                          <div className="text-xs text-gray-400">{symbol.type} • {symbol.environment}</div>
                        </div>
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Current Mode Display */}
        <div className="ml-auto flex items-center gap-2 text-xs text-gray-400">
          <span>Major: <span className="text-white font-medium">{majorMode}</span></span>
          <span>•</span>
          <span>Minor: <span className="text-white font-medium">{minorMode}</span></span>
        </div>
      </div>
    </div>
  );
};
