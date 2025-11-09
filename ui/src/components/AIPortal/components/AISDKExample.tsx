/**
 * AI SDK Example Component
 * 
 * Demonstrates usage of Ollama and OpenCode providers via Vercel AI SDK
 */

import React, { useState } from 'react';
import { useAISDK } from '../../../hooks/useAISDK';
import { ModernButton, GlassCard } from '../../VirtualWorld/ModernUI';
import { Send, Loader2 } from 'lucide-react';

export const AISDKExample: React.FC = () => {
  const [input, setInput] = useState('');
  const [response, setResponse] = useState('');
  const [provider, setProvider] = useState<'ollama' | 'opencode'>('ollama');

  const aiSDK = useAISDK({
    provider,
    ollamaConfig: {
      baseURL: 'http://localhost:11434/v1',
      model: 'llama3.2',
      temperature: 0.7,
    },
    opencodeConfig: {
      baseURL: 'https://openrouter.ai/api/v1',
      model: 'z-ai/glm-4.5-air:free',
      agent: 'automaton-interface',
      temperature: 0.3,
    },
  });

  const handleSubmit = async () => {
    if (!input.trim()) return;

    setResponse('');
    try {
      const result = await aiSDK.generateText([
        {
          role: 'user',
          content: input,
        },
      ]);
      setResponse(result);
    } catch (error) {
      setResponse(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const handleStream = async () => {
    if (!input.trim()) return;

    setResponse('');
    try {
      await aiSDK.streamText(
        [
          {
            role: 'user',
            content: input,
          },
        ],
        (chunk) => {
          setResponse((prev) => prev + chunk);
        }
      );
    } catch (error) {
      setResponse(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  return (
    <GlassCard className="p-6">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-white font-semibold text-lg">AI SDK Integration</h3>
          <div className="flex gap-2">
            <ModernButton
              onClick={() => setProvider('ollama')}
              variant={provider === 'ollama' ? 'primary' : 'secondary'}
              size="sm"
            >
              Ollama
            </ModernButton>
            <ModernButton
              onClick={() => setProvider('opencode')}
              variant={provider === 'opencode' ? 'primary' : 'secondary'}
              size="sm"
            >
              OpenCode
            </ModernButton>
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm text-white/70">
            <div className={`w-2 h-2 rounded-full ${aiSDK.isAvailable ? 'bg-green-500' : 'bg-red-500'}`} />
            <span>
              {provider === 'ollama' ? 'Ollama' : 'OpenCode'}:{' '}
              {aiSDK.isAvailable ? 'Available' : 'Unavailable'}
            </span>
          </div>
        </div>

        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && handleSubmit()}
            placeholder="Enter your message..."
            className="flex-1 px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
            disabled={aiSDK.loading}
          />
          <ModernButton
            onClick={handleSubmit}
            disabled={!input.trim() || aiSDK.loading || !aiSDK.isAvailable}
            variant="primary"
            icon={aiSDK.loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          >
            Send
          </ModernButton>
          <ModernButton
            onClick={handleStream}
            disabled={!input.trim() || aiSDK.loading || !aiSDK.isAvailable}
            variant="secondary"
          >
            Stream
          </ModernButton>
        </div>

        {aiSDK.error && (
          <div className="p-3 bg-red-500/20 border border-red-500/50 rounded-lg text-red-400 text-sm">
            {aiSDK.error.message}
          </div>
        )}

        {response && (
          <div className="p-4 bg-white/5 border border-white/10 rounded-lg">
            <div className="text-white/70 text-sm mb-2">Response:</div>
            <div className="text-white whitespace-pre-wrap">{response}</div>
          </div>
        )}
      </div>
    </GlassCard>
  );
};
