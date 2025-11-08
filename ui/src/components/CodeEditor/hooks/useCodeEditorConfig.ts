import { useState } from 'react';
import { OpenCodeConfig } from '../types';

const DEFAULT_CONFIG: OpenCodeConfig = {
  model: 'llama2',
  temperature: 0.7,
  maxTokens: 2048,
  enableWebLLM: false,
  enableQueries: true,
  enableAgents: true,
  wordWrap: true,
  theme: 'dark'
};

export const useCodeEditorConfig = (initialConfig?: Partial<OpenCodeConfig>) => {
  const [config, setConfig] = useState<OpenCodeConfig>({
    ...DEFAULT_CONFIG,
    ...initialConfig
  });

  const updateConfig = (updates: Partial<OpenCodeConfig>) => {
    setConfig(prev => ({ ...prev, ...updates }));
  };

  const resetConfig = () => {
    setConfig(DEFAULT_CONFIG);
  };

  const loadConfig = (savedConfig: Partial<OpenCodeConfig>) => {
    setConfig({ ...DEFAULT_CONFIG, ...savedConfig });
  };

  const saveConfig = (): OpenCodeConfig => {
    return { ...config };
  };

  return {
    config,
    updateConfig,
    resetConfig,
    loadConfig,
    saveConfig
  };
};