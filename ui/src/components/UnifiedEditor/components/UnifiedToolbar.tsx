/**
 * Unified Toolbar Component
 * Provides mode switching, language selection, and file operations
 */

import React from 'react';
import { Save, FileText, Code, Network, Database, Settings, Search, Filter } from 'lucide-react';
import { EditorMode } from '../utils/mode-detector';

interface UnifiedToolbarProps {
  mode: EditorMode;
  onModeChange: (mode: EditorMode) => void;
  language: string;
  onLanguageChange: (language: string) => void;
  filename: string;
  onSave: () => void;
  onSearch?: (query: string) => void;
  searchQuery?: string;
  isSaving?: boolean;
  readOnly?: boolean;
  availableLanguages?: string[];
}

export const UnifiedToolbar: React.FC<UnifiedToolbarProps> = ({
  mode,
  onModeChange,
  language,
  onLanguageChange,
  filename,
  onSave,
  onSearch,
  searchQuery = '',
  isSaving = false,
  readOnly = false,
  availableLanguages = ['javascript', 'markdown', 'canvasl', 'prolog', 'datalog']
}) => {
  return (
    <div className="bg-gray-800 border-b border-gray-700 p-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <FileText className="w-5 h-5 text-blue-400" />
          <h2 className="text-xl font-bold text-white">Unified Editor: {filename}</h2>
          <span className={`text-xs px-2 py-1 rounded ${
            mode === 'canvas' 
              ? 'bg-purple-900/30 text-purple-400 border border-purple-700' 
              : mode === 'base'
              ? 'bg-green-900/30 text-green-400 border border-green-700'
              : 'bg-gray-700 text-gray-400'
          }`}>
            {mode === 'canvas' ? 'Canvas' : mode === 'base' ? 'Base' : 'Code'}
          </span>
        </div>
        <div className="flex items-center gap-2">
          {!readOnly && (
            <button
              onClick={onSave}
              disabled={isSaving}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 rounded-lg transition-colors"
            >
              <Save className="w-4 h-4" />
              {isSaving ? 'Saving...' : 'Save'}
            </button>
          )}
        </div>
      </div>

      {/* Mode Selector */}
      <div className="flex items-center gap-4 mb-4">
        <div className="flex items-center gap-2">
          <button
            onClick={() => onModeChange('code')}
            className={`flex items-center gap-2 px-3 py-1 rounded transition-colors ${
              mode === 'code' ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            <Code className="w-4 h-4" />
            Code
          </button>
          <button
            onClick={() => onModeChange('canvas')}
            className={`flex items-center gap-2 px-3 py-1 rounded transition-colors ${
              mode === 'canvas' ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            <Network className="w-4 h-4" />
            Canvas
          </button>
          <button
            onClick={() => onModeChange('hybrid')}
            className={`flex items-center gap-2 px-3 py-1 rounded transition-colors ${
              mode === 'hybrid' ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            <FileText className="w-4 h-4" />
            Hybrid
          </button>
          <button
            onClick={() => onModeChange('base')}
            className={`flex items-center gap-2 px-3 py-1 rounded transition-colors ${
              mode === 'base' ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            <Database className="w-4 h-4" />
            Base
          </button>
        </div>

        {/* Language Selector (for code mode) */}
        {(mode === 'code' || mode === 'hybrid') && (
          <select
            value={language}
            onChange={(e) => onLanguageChange(e.target.value)}
            className="px-3 py-1 bg-gray-700 border border-gray-600 rounded-lg text-white text-sm focus:outline-none focus:border-blue-500"
          >
            {availableLanguages.map(lang => (
              <option key={lang} value={lang}>
                {lang.charAt(0).toUpperCase() + lang.slice(1)}
              </option>
            ))}
          </select>
        )}

        {/* Search */}
        {onSearch && (
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => onSearch(e.target.value)}
              placeholder="Search..."
              className="w-full pl-8 pr-3 py-1 bg-gray-700 border border-gray-600 rounded-lg text-white text-sm focus:outline-none focus:border-blue-500"
            />
          </div>
        )}

        <button
          className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
          title="Settings"
        >
          <Settings className="w-4 h-4 text-gray-400" />
        </button>
      </div>
    </div>
  );
};
