/**
 * Configuration Panel Component
 * 
 * Handles AI Portal configuration settings
 */

import React, { useState } from 'react';
import { Settings, Save } from 'lucide-react';

export interface WebLLMConfig {
  model: string;
  temperature: number;
  topK: number;
  topP: number;
  maxTokens: number;
}

export interface AIPortalConfig {
  webllm: WebLLMConfig;
  autoApplyMutations: boolean;
  showCitations: boolean;
  showPerformanceMetrics: boolean;
}

interface ConfigPanelProps {
  config: AIPortalConfig;
  onConfigChange: (config: AIPortalConfig) => void;
  className?: string;
}

export const ConfigPanel: React.FC<ConfigPanelProps> = ({
  config,
  onConfigChange,
  className = '',
}) => {
  const [localConfig, setLocalConfig] = useState<AIPortalConfig>(config);
  const [isDirty, setIsDirty] = useState(false);

  const handleChange = (updates: Partial<AIPortalConfig>) => {
    setLocalConfig({ ...localConfig, ...updates });
    setIsDirty(true);
  };

  const handleSave = () => {
    onConfigChange(localConfig);
    setIsDirty(false);
  };

  return (
    <div className={`bg-gray-900 border border-gray-700 rounded-lg p-4 ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-white flex items-center gap-2">
          <Settings className="w-5 h-5" />
          Configuration
        </h3>
        {isDirty && (
          <button
            onClick={handleSave}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 flex items-center gap-2"
          >
            <Save className="w-4 h-4" />
            Save
          </button>
        )}
      </div>

      <div className="space-y-4">
        {/* WebLLM Config */}
        <div>
          <h4 className="text-sm font-medium text-gray-300 mb-2">WebLLM Settings</h4>
          <div className="space-y-2">
            <div>
              <label className="block text-xs text-gray-400 mb-1">Model</label>
              <select
                value={localConfig.webllm.model}
                onChange={(e) =>
                  handleChange({
                    webllm: { ...localConfig.webllm, model: e.target.value },
                  })
                }
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white text-sm"
              >
                <option value="llama2">Llama 2</option>
                <option value="mistral">Mistral</option>
                <option value="codellama">CodeLlama</option>
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">
                Temperature: {localConfig.webllm.temperature}
              </label>
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={localConfig.webllm.temperature}
                onChange={(e) =>
                  handleChange({
                    webllm: { ...localConfig.webllm, temperature: parseFloat(e.target.value) },
                  })
                }
                className="w-full"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">
                Max Tokens: {localConfig.webllm.maxTokens}
              </label>
              <input
                type="number"
                min="1"
                max="4096"
                value={localConfig.webllm.maxTokens}
                onChange={(e) =>
                  handleChange({
                    webllm: { ...localConfig.webllm, maxTokens: parseInt(e.target.value) },
                  })
                }
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white text-sm"
              />
            </div>
          </div>
        </div>

        {/* UI Options */}
        <div>
          <h4 className="text-sm font-medium text-gray-300 mb-2">UI Options</h4>
          <div className="space-y-2">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={localConfig.autoApplyMutations}
                onChange={(e) => handleChange({ autoApplyMutations: e.target.checked })}
                className="w-4 h-4"
              />
              <span className="text-sm text-gray-300">Auto-apply mutations</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={localConfig.showCitations}
                onChange={(e) => handleChange({ showCitations: e.target.checked })}
                className="w-4 h-4"
              />
              <span className="text-sm text-gray-300">Show citations</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={localConfig.showPerformanceMetrics}
                onChange={(e) => handleChange({ showPerformanceMetrics: e.target.checked })}
                className="w-4 h-4"
              />
              <span className="text-sm text-gray-300">Show performance metrics</span>
            </label>
          </div>
        </div>
      </div>
    </div>
  );
};
