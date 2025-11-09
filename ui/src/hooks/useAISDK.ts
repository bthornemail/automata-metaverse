/**
 * useAISDK Hook
 * 
 * React hook for using Vercel AI SDK with Ollama and OpenCode providers
 */

import { useState, useCallback, useEffect } from 'react';
import { OllamaProvider, OllamaProviderConfig } from '../services/ai-sdk/ollama-provider';
import { OpenCodeProvider, OpenCodeProviderConfig } from '../services/ai-sdk/opencode-provider';
import type { CoreMessage } from 'ai';

export type AIProvider = 'ollama' | 'opencode';

export interface UseAISDKConfig {
  provider: AIProvider;
  ollamaConfig?: OllamaProviderConfig;
  opencodeConfig?: OpenCodeProviderConfig;
}

export interface UseAISDKReturn {
  // State
  loading: boolean;
  error: Error | null;
  isAvailable: boolean;
  provider: AIProvider | null;

  // Actions
  generateText: (messages: CoreMessage[]) => Promise<string>;
  streamText: (messages: CoreMessage[], onChunk: (chunk: string) => void) => Promise<void>;
  checkHealth: () => Promise<boolean>;
  switchProvider: (provider: AIProvider) => void;
}

/**
 * Hook for AI SDK interactions
 */
export const useAISDK = (config: UseAISDKConfig): UseAISDKReturn => {
  const [provider, setProvider] = useState<AIProvider | null>(config.provider);
  const [ollamaProvider, setOllamaProvider] = useState<OllamaProvider | null>(null);
  const [opencodeProvider, setOpenCodeProvider] = useState<OpenCodeProvider | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [isAvailable, setIsAvailable] = useState(false);

  // Initialize providers
  useEffect(() => {
    if (config.ollamaConfig) {
      const ollama = new OllamaProvider(config.ollamaConfig);
      setOllamaProvider(ollama);
      ollama.checkHealth().then(setIsAvailable);
    }
    if (config.opencodeConfig) {
      const opencode = new OpenCodeProvider(config.opencodeConfig);
      setOpenCodeProvider(opencode);
      opencode.checkHealth().then(setIsAvailable);
    }
  }, [config.ollamaConfig, config.opencodeConfig]);

  /**
   * Get current provider instance
   */
  const getCurrentProvider = useCallback(() => {
    if (provider === 'ollama' && ollamaProvider) {
      return ollamaProvider;
    }
    if (provider === 'opencode' && opencodeProvider) {
      return opencodeProvider;
    }
    return null;
  }, [provider, ollamaProvider, opencodeProvider]);

  /**
   * Generate text completion
   */
  const generateText = useCallback(
    async (messages: CoreMessage[]): Promise<string> => {
      const currentProvider = getCurrentProvider();
      if (!currentProvider) {
        throw new Error(`Provider ${provider} is not initialized`);
      }

      setLoading(true);
      setError(null);

      try {
        const result = await currentProvider.generateText(messages);
        return result.text;
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Failed to generate text');
        setError(error);
        throw error;
      } finally {
        setLoading(false);
      }
    },
    [getCurrentProvider, provider]
  );

  /**
   * Stream text completion
   */
  const streamText = useCallback(
    async (messages: CoreMessage[], onChunk: (chunk: string) => void): Promise<void> => {
      const currentProvider = getCurrentProvider();
      if (!currentProvider) {
        throw new Error(`Provider ${provider} is not initialized`);
      }

      setLoading(true);
      setError(null);

      try {
        const result = await currentProvider.streamText(messages);
        for await (const chunk of result) {
          onChunk(chunk);
        }
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Failed to stream text');
        setError(error);
        throw error;
      } finally {
        setLoading(false);
      }
    },
    [getCurrentProvider, provider]
  );

  /**
   * Check provider health
   */
  const checkHealth = useCallback(async (): Promise<boolean> => {
    const currentProvider = getCurrentProvider();
    if (!currentProvider) {
      return false;
    }

    try {
      const healthy = await currentProvider.checkHealth();
      setIsAvailable(healthy);
      return healthy;
    } catch {
      setIsAvailable(false);
      return false;
    }
  }, [getCurrentProvider]);

  /**
   * Switch provider
   */
  const switchProvider = useCallback((newProvider: AIProvider) => {
    setProvider(newProvider);
    setError(null);
    // Re-check health for new provider
    setTimeout(() => {
      checkHealth();
    }, 100);
  }, [checkHealth]);

  return {
    loading,
    error,
    isAvailable,
    provider,
    generateText,
    streamText,
    checkHealth,
    switchProvider,
  };
};
