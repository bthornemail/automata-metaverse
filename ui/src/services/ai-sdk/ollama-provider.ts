/**
 * Ollama Provider using Vercel AI SDK
 * 
 * Provides Ollama integration via the AI SDK's OpenAI-compatible interface
 * Uses @ai-sdk/openai-compatible for proper OpenAI-compatible provider support
 */

import { createOpenAICompatible } from '@ai-sdk/openai-compatible';
import { generateText, streamText } from 'ai';
import type { CoreMessage, CoreTool } from 'ai';

export interface OllamaProviderConfig {
  baseURL?: string;
  apiKey?: string;
  model: string;
  temperature?: number;
  maxTokens?: number;
  topP?: number;
}

export class OllamaProvider {
  private model: ReturnType<ReturnType<typeof createOpenAICompatible>>;
  private config: OllamaProviderConfig;

  constructor(config: OllamaProviderConfig) {
    this.config = {
      baseURL: config.baseURL || 'http://localhost:11434/v1',
      apiKey: config.apiKey || 'ollama', // Ollama doesn't require a real API key
      model: config.model,
      temperature: config.temperature ?? 0.7,
      maxTokens: config.maxTokens ?? 2048,
      topP: config.topP ?? 0.9,
    };

    // Use createOpenAICompatible for proper OpenAI-compatible provider support
    const ollama = createOpenAICompatible({
      baseURL: this.config.baseURL,
      apiKey: this.config.apiKey,
    });

    this.model = ollama(this.config.model);
  }

  /**
   * Generate text completion
   */
  async generateText(
    messages: CoreMessage[],
    options?: {
      temperature?: number;
      maxTokens?: number;
      topP?: number;
      tools?: CoreTool[];
    }
  ): Promise<{ text: string }> {
    const result = await generateText({
      model: this.model,
      messages,
      temperature: options?.temperature ?? this.config.temperature,
      maxTokens: options?.maxTokens ?? this.config.maxTokens,
      topP: options?.topP ?? this.config.topP,
      tools: options?.tools,
    });

    return { text: result.text };
  }

  /**
   * Stream text completion
   */
  streamText(
    messages: CoreMessage[],
    options?: {
      temperature?: number;
      maxTokens?: number;
      topP?: number;
      tools?: CoreTool[];
    }
  ): AsyncIterable<string> {
    const result = streamText({
      model: this.model,
      messages,
      temperature: options?.temperature ?? this.config.temperature,
      maxTokens: options?.maxTokens ?? this.config.maxTokens,
      topP: options?.topP ?? this.config.topP,
      tools: options?.tools,
    });

    return result.textStream;
  }

  /**
   * Check if Ollama is available
   */
  async checkHealth(): Promise<boolean> {
    try {
      const response = await fetch(`${this.config.baseURL?.replace('/v1', '')}/api/tags`, {
        method: 'GET',
      });
      return response.ok;
    } catch {
      return false;
    }
  }

  /**
   * List available models
   */
  async listModels(): Promise<string[]> {
    try {
      const response = await fetch(`${this.config.baseURL?.replace('/v1', '')}/api/tags`);
      if (!response.ok) {
        return [];
      }
      const data = await response.json();
      return (data.models || []).map((m: any) => m.name);
    } catch {
      return [];
    }
  }
}
