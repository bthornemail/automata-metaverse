/**
 * AI SDK Services
 * 
 * Unified interface for AI providers using Vercel AI SDK
 */

export { OllamaProvider } from './ollama-provider';
export type { OllamaProviderConfig } from './ollama-provider';

export { OpenCodeProvider } from './opencode-provider';
export type { OpenCodeProviderConfig } from './opencode-provider';

export * from 'ai';
