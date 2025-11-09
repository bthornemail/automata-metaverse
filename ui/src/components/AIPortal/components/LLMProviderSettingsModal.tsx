/**
 * LLM Provider Settings Modal
 * 
 * Comprehensive settings for all LLM providers (WebLLM, Ollama, OpenCode)
 */

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Brain, Cpu, Code, Settings, CheckCircle, XCircle, AlertCircle,
  Save, RefreshCw, TestTube
} from 'lucide-react';
import { Modal } from '@/components/shared/Modal';
import { GlassCard, ModernButton, ModernInput, ModernToggle, ModernBadge } from '../../VirtualWorld/ModernUI';
import { OllamaProvider } from '@/services/ai-sdk/ollama-provider';
import { OpenCodeProvider } from '@/services/ai-sdk/opencode-provider';
import type { LLMProviderConfig } from '@/services/llm-service';

export interface LLMProviderSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: LLMProviderConfig;
  onConfigChange: (config: LLMProviderConfig) => void;
}

export const LLMProviderSettingsModal: React.FC<LLMProviderSettingsModalProps> = ({
  isOpen,
  onClose,
  config,
  onConfigChange,
}) => {
  const [localConfig, setLocalConfig] = useState<LLMProviderConfig>(config);
  const [isDirty, setIsDirty] = useState(false);
  const [testingProvider, setTestingProvider] = useState<string | null>(null);
  const [testResults, setTestResults] = useState<Record<string, { status: 'success' | 'error' | 'testing'; message?: string }>>({});
  const [availableOllamaModels, setAvailableOllamaModels] = useState<string[]>([]);
  const [loadingModels, setLoadingModels] = useState(false);

  // Sync config only when modal opens (not on every prop change to allow editing)
  const prevIsOpen = useRef(isOpen);
  useEffect(() => {
    // Only sync when modal transitions from closed to open
    if (isOpen && !prevIsOpen.current) {
      setLocalConfig({ ...config });
      setIsDirty(false);
    }
    prevIsOpen.current = isOpen;
  }, [isOpen, config]);

  // Load available Ollama models when provider is Ollama
  useEffect(() => {
    if (localConfig.provider === 'ollama' && isOpen) {
      loadOllamaModels();
    }
  }, [localConfig.provider, isOpen]);

  const loadOllamaModels = async () => {
    setLoadingModels(true);
    try {
      const ollamaUrl = localConfig.ollamaUrl || 'http://localhost:11434';
      const response = await fetch(`${ollamaUrl}/api/tags`);
      if (response.ok) {
        const data = await response.json();
        setAvailableOllamaModels((data.models || []).map((m: any) => m.name));
      }
    } catch (error) {
      console.error('Failed to load Ollama models:', error);
    } finally {
      setLoadingModels(false);
    }
  };

  const handleConfigChange = (updates: Partial<LLMProviderConfig>) => {
    setLocalConfig(prev => ({ ...prev, ...updates }));
    setIsDirty(true);
  };

  const handleSave = () => {
    // Create a new object reference to ensure React detects the change
    onConfigChange({ ...localConfig });
    setIsDirty(false);
  };

  const testProvider = async (provider: 'ollama' | 'opencode') => {
    setTestingProvider(provider);
    setTestResults(prev => ({ ...prev, [provider]: { status: 'testing' } }));

    try {
      if (provider === 'ollama') {
        // Ensure Ollama URL ends with /v1 for OpenAI-compatible API
        const ollamaBaseUrl = localConfig.ollamaUrl || 'http://localhost:11434';
        const ollamaUrl = ollamaBaseUrl.endsWith('/v1') ? ollamaBaseUrl : `${ollamaBaseUrl}/v1`;
        
        const ollama = new OllamaProvider({
          baseURL: ollamaUrl,
          model: localConfig.model,
          temperature: localConfig.temperature,
          maxTokens: localConfig.maxTokens,
          topP: localConfig.topP,
        });

        const isHealthy = await ollama.checkHealth();
        if (isHealthy) {
          // Test actual generation
          const result = await ollama.generateText([
            { role: 'user', content: 'Hello' }
          ]);
          setTestResults(prev => ({
            ...prev,
            [provider]: { status: 'success', message: `Response: ${result.text.substring(0, 50)}...` }
          }));
        } else {
          throw new Error('Ollama health check failed');
        }
      } else if (provider === 'opencode') {
        const opencode = new OpenCodeProvider({
          baseURL: localConfig.opencodeEndpoint || 'https://openrouter.ai/api/v1',
          model: localConfig.model,
          agent: 'automaton-interface',
          temperature: localConfig.temperature,
          maxTokens: localConfig.maxTokens,
          topP: localConfig.topP,
        });

        const isHealthy = await opencode.checkHealth();
        if (isHealthy) {
          setTestResults(prev => ({
            ...prev,
            [provider]: { status: 'success', message: 'OpenCode provider is available' }
          }));
        } else {
          throw new Error('OpenCode health check failed');
        }
      }
    } catch (error) {
      setTestResults(prev => ({
        ...prev,
        [provider]: {
          status: 'error',
          message: error instanceof Error ? error.message : 'Unknown error'
        }
      }));
    } finally {
      setTestingProvider(null);
    }
  };

  const getProviderIcon = (provider: string) => {
    switch (provider) {
      case 'webllm':
        return <Brain className="w-5 h-5" />;
      case 'ollama':
        return <Cpu className="w-5 h-5" />;
      case 'opencode':
        return <Code className="w-5 h-5" />;
      default:
        return <Settings className="w-5 h-5" />;
    }
  };

  const getProviderColor = (provider: string) => {
    switch (provider) {
      case 'webllm':
        return 'text-purple-400';
      case 'ollama':
        return 'text-blue-400';
      case 'opencode':
        return 'text-green-400';
      default:
        return 'text-gray-400';
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="LLM Provider Settings"
      size="lg"
    >
      <div className="space-y-6">
        {/* Provider Selection */}
        <div>
          <label className="block text-sm font-medium text-white mb-3">Provider</label>
          <div className="grid grid-cols-3 gap-3">
            {(['webllm', 'ollama', 'opencode'] as const).map((provider) => (
              <button
                key={provider}
                onClick={() => handleConfigChange({ provider })}
                className={`p-4 rounded-lg border-2 transition-all ${
                  localConfig.provider === provider
                    ? 'border-blue-500 bg-blue-500/10'
                    : 'border-gray-700 bg-gray-800/50 hover:border-gray-600'
                }`}
              >
                <div className={`flex items-center justify-center mb-2 ${getProviderColor(provider)}`}>
                  {getProviderIcon(provider)}
                </div>
                <div className="text-white text-sm font-medium capitalize">{provider}</div>
                {localConfig.provider === provider && (
                  <div className="mt-1">
                    <CheckCircle className="w-4 h-4 text-blue-500 mx-auto" />
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Common Settings */}
        <GlassCard className="p-4">
          <h4 className="text-white font-semibold mb-4">Common Settings</h4>
          <div className="space-y-4">
            <div>
              <label className="block text-sm text-white/70 mb-2">Model</label>
              {localConfig.provider === 'ollama' && availableOllamaModels.length > 0 ? (
                <select
                  value={localConfig.model}
                  onChange={(e) => handleConfigChange({ model: e.target.value })}
                  className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white"
                  disabled={loadingModels}
                >
                  {loadingModels ? (
                    <option>Loading models...</option>
                  ) : (
                    availableOllamaModels.map((model) => (
                      <option key={model} value={model}>
                        {model}
                      </option>
                    ))
                  )}
                </select>
              ) : (
                <ModernInput
                  value={localConfig.model}
                  onChange={(value) => handleConfigChange({ model: String(value) })}
                  placeholder="Model name"
                />
              )}
            </div>

            <div>
              <label className="block text-sm text-white/70 mb-2">
                Temperature: {localConfig.temperature.toFixed(2)}
              </label>
              <input
                type="range"
                min="0"
                max="2"
                step="0.1"
                value={localConfig.temperature}
                onChange={(e) => handleConfigChange({ temperature: parseFloat(e.target.value) })}
                className="w-full"
              />
            </div>

            <div>
              <label className="block text-sm text-white/70 mb-2">
                Max Tokens: {localConfig.maxTokens}
              </label>
              <ModernInput
                type="number"
                min={1}
                max={8192}
                value={localConfig.maxTokens}
                onChange={(value) => handleConfigChange({ maxTokens: Number(value) || 2048 })}
              />
            </div>

            <div>
              <label className="block text-sm text-white/70 mb-2">
                Top P: {localConfig.topP.toFixed(2)}
              </label>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={localConfig.topP}
                onChange={(e) => handleConfigChange({ topP: parseFloat(e.target.value) })}
                className="w-full"
              />
            </div>
          </div>
        </GlassCard>

        {/* Provider-Specific Settings */}
        <AnimatePresence mode="wait">
          {localConfig.provider === 'ollama' && (
            <motion.div
              key="ollama"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              <GlassCard className="p-4">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-white font-semibold flex items-center gap-2">
                    <Cpu className="w-5 h-5 text-blue-400" />
                    Ollama Settings
                  </h4>
                  <ModernButton
                    onClick={() => testProvider('ollama')}
                    variant="secondary"
                    size="sm"
                    icon={testingProvider === 'ollama' ? <RefreshCw className="w-4 h-4 animate-spin" /> : <TestTube className="w-4 h-4" />}
                    disabled={testingProvider === 'ollama'}
                  >
                    Test
                  </ModernButton>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm text-white/70 mb-2">Ollama URL</label>
                    <ModernInput
                      value={localConfig.ollamaUrl || 'http://localhost:11434'}
                      onChange={(value) => handleConfigChange({ ollamaUrl: String(value) })}
                      placeholder="http://localhost:11434"
                    />
                  </div>
                  <ModernButton
                    onClick={loadOllamaModels}
                    variant="ghost"
                    size="sm"
                    icon={<RefreshCw className={`w-4 h-4 ${loadingModels ? 'animate-spin' : ''}`} />}
                    disabled={loadingModels}
                  >
                    Refresh Models
                  </ModernButton>
                  {testResults.ollama && (
                    <div className={`p-3 rounded-lg flex items-start gap-2 ${
                      testResults.ollama.status === 'success' 
                        ? 'bg-green-500/20 border border-green-500/50' 
                        : testResults.ollama.status === 'error'
                        ? 'bg-red-500/20 border border-red-500/50'
                        : 'bg-blue-500/20 border border-blue-500/50'
                    }`}>
                      {testResults.ollama.status === 'success' ? (
                        <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                      ) : testResults.ollama.status === 'error' ? (
                        <XCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                      ) : (
                        <AlertCircle className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5 animate-pulse" />
                      )}
                      <div className="flex-1">
                        <div className={`text-sm font-medium ${
                          testResults.ollama.status === 'success' ? 'text-green-400' : 
                          testResults.ollama.status === 'error' ? 'text-red-400' : 'text-blue-400'
                        }`}>
                          {testResults.ollama.status === 'success' ? 'Connection successful' :
                           testResults.ollama.status === 'error' ? 'Connection failed' :
                           'Testing...'}
                        </div>
                        {testResults.ollama.message && (
                          <div className="text-xs text-white/60 mt-1">{testResults.ollama.message}</div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </GlassCard>
            </motion.div>
          )}

          {localConfig.provider === 'opencode' && (
            <motion.div
              key="opencode"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              <GlassCard className="p-4">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-white font-semibold flex items-center gap-2">
                    <Code className="w-5 h-5 text-green-400" />
                    OpenCode Settings
                  </h4>
                  <ModernButton
                    onClick={() => testProvider('opencode')}
                    variant="secondary"
                    size="sm"
                    icon={testingProvider === 'opencode' ? <RefreshCw className="w-4 h-4 animate-spin" /> : <TestTube className="w-4 h-4" />}
                    disabled={testingProvider === 'opencode'}
                  >
                    Test
                  </ModernButton>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm text-white/70 mb-2">API Endpoint</label>
                    <ModernInput
                      value={localConfig.opencodeEndpoint || 'https://openrouter.ai/api/v1'}
                      onChange={(value) => handleConfigChange({ opencodeEndpoint: String(value) })}
                      placeholder="https://openrouter.ai/api/v1"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-white/70 mb-2">API Key</label>
                    <ModernInput
                      type="text"
                      value={localConfig.openaiApiKey || ''}
                      onChange={(value) => handleConfigChange({ openaiApiKey: String(value) })}
                      placeholder="Enter API key (or use VITE_OPENROUTER_API_KEY env var)"
                    />
                  </div>
                  {testResults.opencode && (
                    <div className={`p-3 rounded-lg flex items-start gap-2 ${
                      testResults.opencode.status === 'success' 
                        ? 'bg-green-500/20 border border-green-500/50' 
                        : testResults.opencode.status === 'error'
                        ? 'bg-red-500/20 border border-red-500/50'
                        : 'bg-blue-500/20 border border-blue-500/50'
                    }`}>
                      {testResults.opencode.status === 'success' ? (
                        <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                      ) : testResults.opencode.status === 'error' ? (
                        <XCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                      ) : (
                        <AlertCircle className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5 animate-pulse" />
                      )}
                      <div className="flex-1">
                        <div className={`text-sm font-medium ${
                          testResults.opencode.status === 'success' ? 'text-green-400' : 
                          testResults.opencode.status === 'error' ? 'text-red-400' : 'text-blue-400'
                        }`}>
                          {testResults.opencode.status === 'success' ? 'Connection successful' :
                           testResults.opencode.status === 'error' ? 'Connection failed' :
                           'Testing...'}
                        </div>
                        {testResults.opencode.message && (
                          <div className="text-xs text-white/60 mt-1">{testResults.opencode.message}</div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </GlassCard>
            </motion.div>
          )}

          {localConfig.provider === 'webllm' && (
            <motion.div
              key="webllm"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              <GlassCard className="p-4">
                <h4 className="text-white font-semibold flex items-center gap-2 mb-4">
                  <Brain className="w-5 h-5 text-purple-400" />
                  WebLLM Settings
                </h4>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm text-white/70 mb-2">Available Models</label>
                    <select
                      value={localConfig.model}
                      onChange={(e) => handleConfigChange({ model: e.target.value })}
                      className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white"
                    >
                      <option value="Llama-2-7b-chat-hf-q4f32_1">Llama 2 7B Chat</option>
                      <option value="TinyLlama-1.1B-Chat-v0.4">TinyLlama 1.1B Chat</option>
                      <option value="Phi-3-mini-4k-instruct-q4f32_1-MLC">Phi-3 Mini 4K</option>
                      <option value="Mistral-7B-Instruct-v0.2-q4f32_1-MLC">Mistral 7B Instruct</option>
                    </select>
                  </div>
                  <div className="p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                    <div className="text-sm text-blue-400 font-medium mb-1">Note</div>
                    <div className="text-xs text-white/70">
                      WebLLM models run entirely in your browser. The model will be downloaded on first use.
                    </div>
                  </div>
                </div>
              </GlassCard>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Action Buttons */}
        <div className="flex items-center justify-between pt-4 border-t border-white/10">
          <div className="flex items-center gap-2">
            {isDirty && (
              <ModernBadge variant="warning">Unsaved changes</ModernBadge>
            )}
          </div>
          <div className="flex gap-2">
            <ModernButton
              onClick={onClose}
              variant="ghost"
            >
              Cancel
            </ModernButton>
            <ModernButton
              onClick={handleSave}
              variant="primary"
              icon={<Save className="w-4 h-4" />}
              disabled={!isDirty}
            >
              Save Settings
            </ModernButton>
          </div>
        </div>
      </div>
    </Modal>
  );
};
