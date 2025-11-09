/**
 * Configuration Panel Component
 * 
 * Handles AI Portal configuration settings
 */

import React, { useState, useEffect } from 'react';
import { Settings, Save, Brain, Cpu, Code } from 'lucide-react';
import type { LLMProviderConfig } from '@/services/llm-service';

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
  llmProviderConfig?: LLMProviderConfig;
  onLLMProviderConfigChange?: (config: LLMProviderConfig) => void;
  onLLMProviderSettingsClick?: () => void;
  className?: string;
}

export const ConfigPanel: React.FC<ConfigPanelProps> = ({
  config,
  onConfigChange,
  llmProviderConfig,
  onLLMProviderConfigChange,
  onLLMProviderSettingsClick,
  className = '',
}) => {
  const [localConfig, setLocalConfig] = useState<AIPortalConfig>(config);
  const [localLLMConfig, setLocalLLMConfig] = useState<LLMProviderConfig | undefined>(llmProviderConfig);
  const [isDirty, setIsDirty] = useState(false);
  const [isLLMDirty, setIsLLMDirty] = useState(false);

  // Sync localLLMConfig when prop changes
  useEffect(() => {
    if (llmProviderConfig) {
      // Create a new object to ensure state update
      const newConfig = { ...llmProviderConfig };
      setLocalLLMConfig(newConfig);
      setIsLLMDirty(false);
    } else {
      setLocalLLMConfig(undefined);
      setIsLLMDirty(false);
    }
  }, [
    llmProviderConfig?.provider,
    llmProviderConfig?.model,
    llmProviderConfig?.temperature,
    llmProviderConfig?.maxTokens,
    llmProviderConfig?.topP,
    llmProviderConfig?.ollamaUrl,
    llmProviderConfig?.opencodeEndpoint,
    llmProviderConfig?.openaiApiKey
  ]);

  const handleChange = (updates: Partial<AIPortalConfig>) => {
    setLocalConfig({ ...localConfig, ...updates });
    setIsDirty(true);
  };

  const handleSave = () => {
    onConfigChange(localConfig);
    setIsDirty(false);
  };

  const handleLLMChange = (updates: Partial<LLMProviderConfig>) => {
    if (localLLMConfig && onLLMProviderConfigChange) {
      const updated = { ...localLLMConfig, ...updates };
      setLocalLLMConfig(updated);
      setIsLLMDirty(true);
    }
  };

  const handleLLMSave = () => {
    if (localLLMConfig && onLLMProviderConfigChange) {
      onLLMProviderConfigChange(localLLMConfig);
      setIsLLMDirty(false);
    }
  };

  const getProviderIcon = (provider: string) => {
    switch (provider) {
      case 'webllm':
        return <Brain className="w-4 h-4" />;
      case 'ollama':
        return <Cpu className="w-4 h-4" />;
      case 'opencode':
        return <Code className="w-4 h-4" />;
      default:
        return <Brain className="w-4 h-4" />;
    }
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
        {/* LLM Provider Settings */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-sm font-medium text-gray-300">LLM Provider Settings</h4>
            {onLLMProviderSettingsClick && (
              <button
                onClick={onLLMProviderSettingsClick}
                className="flex items-center gap-2 px-3 py-1.5 text-xs bg-blue-600 hover:bg-blue-700 text-white rounded transition-colors"
              >
                <Brain className="w-3 h-3" />
                Advanced Settings
              </button>
            )}
          </div>
          
          {/* Current LLM Provider Config */}
          {localLLMConfig && (
            <div className="p-3 bg-gray-800/50 rounded border border-gray-700 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {getProviderIcon(localLLMConfig.provider)}
                  <span className="text-xs font-medium text-gray-300 capitalize">
                    {localLLMConfig.provider}
                  </span>
                </div>
                {isLLMDirty && onLLMProviderConfigChange && (
                  <button
                    onClick={handleLLMSave}
                    className="px-2 py-1 text-xs bg-green-600 hover:bg-green-700 text-white rounded"
                  >
                    Save LLM
                  </button>
                )}
              </div>
              
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="text-gray-400">Model:</span>
                  <span className="text-gray-300 ml-1">{localLLMConfig.model}</span>
                </div>
                <div>
                  <span className="text-gray-400">Temperature:</span>
                  <span className="text-gray-300 ml-1">{localLLMConfig.temperature.toFixed(2)}</span>
                </div>
                <div>
                  <span className="text-gray-400">Max Tokens:</span>
                  <span className="text-gray-300 ml-1">{localLLMConfig.maxTokens}</span>
                </div>
                <div>
                  <span className="text-gray-400">Top P:</span>
                  <span className="text-gray-300 ml-1">{localLLMConfig.topP.toFixed(2)}</span>
                </div>
              </div>

              {/* Quick Provider Switch */}
              {onLLMProviderConfigChange && (
                <div className="flex gap-2 mt-2">
                  {(['webllm', 'ollama', 'opencode'] as const).map((provider) => (
                    <button
                      key={provider}
                      onClick={() => handleLLMChange({ provider })}
                      className={`px-2 py-1 text-xs rounded transition-colors ${
                        localLLMConfig.provider === provider
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                      }`}
                    >
                      {provider}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
          
          {!localLLMConfig && (
            <div className="p-3 bg-gray-800/50 rounded border border-gray-700 text-xs text-gray-400">
              Configure WebLLM, Ollama, and OpenCode providers with advanced settings.
            </div>
          )}
        </div>

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
