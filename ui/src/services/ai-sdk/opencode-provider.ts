/**
 * OpenCode Provider using Vercel AI SDK
 * 
 * Provides OpenCode integration via the AI SDK
 * Supports OpenCode's agent-based configuration from opencode.jsonc
 * Uses @ai-sdk/openai-compatible for proper OpenAI-compatible provider support
 */

import { createOpenAICompatible } from '@ai-sdk/openai-compatible';
import { generateText, streamText } from 'ai';
import type { CoreMessage } from 'ai';
import type { ToolSet } from 'ai';

export interface OpenCodeProviderConfig {
  baseURL?: string;
  apiKey?: string;
  model: string;
  agent?: string; // Agent name from opencode.jsonc
  temperature?: number;
  maxTokens?: number;
  topP?: number;
}

export class OpenCodeProvider {
  private model: ReturnType<ReturnType<typeof createOpenAICompatible>>;
  private config: OpenCodeProviderConfig;

  constructor(config: OpenCodeProviderConfig) {
    // OpenCode typically uses OpenAI-compatible endpoints
    // Default to OpenRouter or configured endpoint
    this.config = {
      baseURL: config.baseURL || 'https://openrouter.ai/api/v1',
      apiKey: config.apiKey || import.meta.env.VITE_OPENROUTER_API_KEY,
      model: config.model,
      agent: config.agent,
      temperature: config.temperature ?? 0.3,
      maxTokens: config.maxTokens ?? 2048,
      topP: config.topP ?? 0.9,
    };

    // Use createOpenAICompatible for proper OpenAI-compatible provider support
    const opencode = createOpenAICompatible({
      name: 'opencode',
      baseURL: this.config.baseURL,
      apiKey: this.config.apiKey,
    });

    this.model = opencode(this.config.model);
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
      tools?: ToolSet;
    }
  ): Promise<{ text: string }> {
    // If agent is specified, prepend agent prompt
    const finalMessages = this.config.agent
      ? [
          {
            role: 'system' as const,
            content: `You are the ${this.config.agent} agent from OpenCode. Follow the agent's instructions and behavior.`,
          },
          ...messages,
        ]
      : messages;

    const result = await generateText({
      model: this.model,
      messages: finalMessages,
      temperature: options?.temperature ?? this.config.temperature,
      maxTokens: options?.maxTokens ?? this.config.maxTokens,
      topP: options?.topP ?? this.config.topP,
      tools: options?.tools,
    } as any);

    return { text: result.text };
  }

  /**
   * Stream text completion
   */
  async streamText(
    messages: CoreMessage[],
    options?: {
      temperature?: number;
      maxTokens?: number;
      topP?: number;
      tools?: ToolSet;
    }
  ): Promise<AsyncIterable<string>> {
    // If agent is specified, prepend agent prompt
    const finalMessages = this.config.agent
      ? [
          {
            role: 'system' as const,
            content: `You are the ${this.config.agent} agent from OpenCode. Follow the agent's instructions and behavior.`,
          },
          ...messages,
        ]
      : messages;

    const result = await streamText({
      model: this.model,
      messages: finalMessages,
      temperature: options?.temperature ?? this.config.temperature,
      maxTokens: options?.maxTokens ?? this.config.maxTokens,
      topP: options?.topP ?? this.config.topP,
      tools: options?.tools,
    } as any);

    return result.textStream;
  }

  /**
   * Check if OpenCode provider is available
   */
  async checkHealth(): Promise<boolean> {
    try {
      const response = await fetch(`${this.config.baseURL}/models`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${this.config.apiKey}`,
        },
      });
      return response.ok;
    } catch {
      return false;
    }
  }
}
