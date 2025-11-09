# AI SDK Integration

This directory contains AI provider integrations using the [Vercel AI SDK](https://ai-sdk.dev/docs/foundations/overview) and [OpenAI-Compatible Providers](https://ai-sdk.dev/providers/openai-compatible-providers).

## Providers

### Ollama Provider

Local AI models via Ollama server using OpenAI-compatible API.

**Implementation**: Uses `@ai-sdk/openai-compatible` with `createOpenAICompatible` for proper OpenAI-compatible provider support.

```typescript
import { OllamaProvider } from './services/ai-sdk/ollama-provider';

const ollama = new OllamaProvider({
  baseURL: 'http://localhost:11434/v1', // Ollama OpenAI-compatible endpoint
  model: 'llama3.2',
  temperature: 0.7,
});

// Generate text
const result = await ollama.generateText([
  { role: 'user', content: 'Hello!' }
]);
console.log(result.text);

// Stream text
for await (const chunk of ollama.streamText([
  { role: 'user', content: 'Tell me a story' }
])) {
  console.log(chunk);
}
```

### OpenCode Provider

OpenCode agent-based AI via OpenAI-compatible endpoints (OpenRouter, etc.).

**Implementation**: Uses `@ai-sdk/openai-compatible` with `createOpenAICompatible` for proper OpenAI-compatible provider support.

```typescript
import { OpenCodeProvider } from './services/ai-sdk/opencode-provider';

const opencode = new OpenCodeProvider({
  baseURL: 'https://openrouter.ai/api/v1',
  model: 'z-ai/glm-4.5-air:free',
  agent: 'automaton-interface',
  temperature: 0.3,
});

// Generate text with agent context
const result = await opencode.generateText([
  { role: 'user', content: 'Analyze this code' }
]);
```

## React Hook

Use the `useAISDK` hook for React components:

```typescript
import { useAISDK } from '../hooks/useAISDK';

function MyComponent() {
  const aiSDK = useAISDK({
    provider: 'ollama',
    ollamaConfig: {
      model: 'llama3.2',
      baseURL: 'http://localhost:11434/v1',
    },
  });

  const handleGenerate = async () => {
    const text = await aiSDK.generateText([
      { role: 'user', content: 'Hello!' }
    ]);
    console.log(text);
  };

  return (
    <button onClick={handleGenerate} disabled={!aiSDK.isAvailable}>
      Generate
    </button>
  );
}
```

## Configuration

### Ollama

- **baseURL**: Ollama API endpoint (default: `http://localhost:11434/v1`)
- **model**: Model name (e.g., `llama3.2`, `qwen2.5:3b`)
- **temperature**: Sampling temperature (0-1)
- **maxTokens**: Maximum tokens to generate
- **topP**: Nucleus sampling parameter

### OpenCode

- **baseURL**: OpenAI-compatible API endpoint (default: OpenRouter)
- **apiKey**: API key (from `VITE_OPENROUTER_API_KEY` env var)
- **model**: Model identifier
- **agent**: Agent name from `opencode.jsonc` (optional)
- **temperature**: Sampling temperature
- **maxTokens**: Maximum tokens to generate
- **topP**: Nucleus sampling parameter

## Environment Variables

Add to `.env`:

```bash
VITE_OPENROUTER_API_KEY=your_api_key_here
```

## Integration with Metaverse Portal

The AI SDK providers can be integrated into the Metaverse Portal for NLP → WebLLM → Metaverse bridging:

```typescript
import { useAISDK } from '../hooks/useAISDK';

// In MetaversePortal component
const aiSDK = useAISDK({
  provider: 'ollama',
  ollamaConfig: {
    model: 'llama3.2',
  },
});

// Process NLP input through AI SDK
const processNLP = async (input: string) => {
  const aiResponse = await aiSDK.generateText([
    { role: 'user', content: input }
  ]);
  // Translate AI response to Metaverse actions
  executeMetaverseAction(aiResponse);
};
```

## Technical Details

### OpenAI-Compatible Provider Pattern

Both providers use `createOpenAICompatible` from `@ai-sdk/openai-compatible`, which is the recommended approach for OpenAI-compatible APIs:

```typescript
import { createOpenAICompatible } from '@ai-sdk/openai-compatible';

const provider = createOpenAICompatible({
  baseURL: 'https://api.example.com/v1',
  apiKey: 'your-api-key',
});

const model = provider('model-name');
```

This pattern ensures:
- Proper API compatibility
- Consistent error handling
- Full AI SDK feature support (streaming, tools, etc.)
- Type safety

### Why `@ai-sdk/openai-compatible`?

According to the [AI SDK documentation](https://ai-sdk.dev/providers/openai-compatible-providers), `createOpenAICompatible` provides:
- Better compatibility with OpenAI-compatible APIs
- Proper handling of API differences
- Enhanced error messages
- Support for all AI SDK features

## See Also

- [Vercel AI SDK Documentation](https://ai-sdk.dev/docs/foundations/overview)
- [OpenAI-Compatible Providers Guide](https://ai-sdk.dev/providers/openai-compatible-providers)
- [Ollama Documentation](https://ollama.ai/docs)
- [OpenCode Configuration](../opencode.jsonc)
