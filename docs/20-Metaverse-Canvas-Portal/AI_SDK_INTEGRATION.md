# AI SDK Integration - Ollama & OpenCode

## Overview

Full integration of Ollama and OpenCode providers into the AI Portal using the Vercel AI SDK (`ai` package). This provides a unified interface for all LLM providers (WebLLM, Ollama, OpenCode) with comprehensive settings modals.

## Components Created

### 1. LLM Provider Settings Modal (`LLMProviderSettingsModal.tsx`)

**Location**: `ui/src/components/AIPortal/components/LLMProviderSettingsModal.tsx`

**Features**:
- Provider selection (WebLLM, Ollama, OpenCode)
- Common settings (model, temperature, maxTokens, topP)
- Provider-specific settings:
  - **Ollama**: URL configuration, model list loading, connection testing
  - **OpenCode**: API endpoint, API key, agent selection
  - **WebLLM**: Model selection dropdown
- Real-time provider testing with visual feedback
- Unsaved changes tracking
- Modern UI with glassmorphism styling

**Usage**:
```typescript
<LLMProviderSettingsModal
  isOpen={showLLMProviderModal}
  onClose={() => setShowLLMProviderModal(false)}
  config={llmProviderConfig}
  onConfigChange={(newConfig) => {
    setLlmProviderConfig(newConfig);
    initializeLLMProvider();
  }}
/>
```

### 2. AI SDK Providers

#### Ollama Provider (`ollama-provider.ts`)
- Uses Vercel AI SDK's `openai` function with OpenAI-compatible endpoint
- Supports health checks and model listing
- Automatic `/v1` endpoint handling

#### OpenCode Provider (`opencode-provider.ts`)
- Supports OpenAI-compatible endpoints (OpenRouter by default)
- Agent-based configuration from `opencode.jsonc`
- System prompt injection for agent behavior

### 3. React Hook (`useAISDK.ts`)

**Location**: `ui/src/hooks/useAISDK.ts`

Provides React hook interface for AI SDK providers:
- Provider switching
- Text generation (sync and streaming)
- Health checking
- Loading and error states

## Integration Points

### Updated LLM Service

**File**: `ui/src/services/llm-service.ts`

- `generateOllamaResponse()` now uses `OllamaProvider` from AI SDK
- `generateOpenCodeResponse()` now uses `OpenCodeProvider` from AI SDK
- Maintains backward compatibility with existing code

### Updated Config Panel

**File**: `ui/src/components/AIPortal/components/ConfigPanel.tsx`

- Added "Configure Providers" button
- Links to LLM Provider Settings Modal
- Maintains existing WebLLM configuration

### Updated AI Portal

**File**: `ui/src/components/AIPortal/AIPortal.tsx`

- Added `showLLMProviderModal` state
- Integrated `LLMProviderSettingsModal` component
- Provider configuration changes trigger LLM reinitialization

## Configuration

### Ollama Configuration

```typescript
{
  provider: 'ollama',
  model: 'llama3.2',
  ollamaUrl: 'http://localhost:11434', // Auto-appends /v1
  temperature: 0.7,
  maxTokens: 2048,
  topP: 0.9
}
```

### OpenCode Configuration

```typescript
{
  provider: 'opencode',
  model: 'z-ai/glm-4.5-air:free',
  opencodeEndpoint: 'https://openrouter.ai/api/v1',
  openaiApiKey: 'your-api-key', // For OpenRouter/OpenCode
  temperature: 0.3,
  maxTokens: 2048,
  topP: 0.9
}
```

## Accessing the Settings

1. Click the **Settings** icon in the AI Portal header
2. In the Settings modal, click **"Configure Providers"** button
3. Select provider (WebLLM, Ollama, or OpenCode)
4. Configure provider-specific settings
5. Test connection (for Ollama/OpenCode)
6. Save settings

## Features

### Provider Testing
- **Ollama**: Tests connection and performs actual text generation
- **OpenCode**: Tests API endpoint availability
- Visual feedback with success/error indicators

### Model Discovery
- **Ollama**: Automatically loads available models from Ollama server
- **WebLLM**: Pre-configured model list
- **OpenCode**: Manual model entry (supports any OpenAI-compatible model)

### Configuration Persistence
- Settings are saved to component state
- Changes trigger LLM provider reinitialization
- Unsaved changes are tracked and highlighted

## Integration with Metaverse Portal

The Metaverse Portal receives `llmProviderConfig` as a prop and uses it for:
- NLP → LLM processing
- Bridge status updates
- Natural language command processing

## Environment Variables

For OpenCode/OpenRouter:
```bash
VITE_OPENROUTER_API_KEY=your_api_key_here
```

## Dependencies

- `ai` - Vercel AI SDK (installed)
- `@react-three/drei` - For UI components (already installed)
- `framer-motion` - For animations (already installed)

## Example Usage

```typescript
// In AIPortal component
const [llmProviderConfig, setLlmProviderConfig] = useState<LLMProviderConfig>({
  provider: 'ollama',
  model: 'llama3.2',
  ollamaUrl: 'http://localhost:11434',
  temperature: 0.7,
  maxTokens: 2048,
  topP: 0.9,
});

// Open settings modal
<LLMProviderSettingsModal
  isOpen={showLLMProviderModal}
  onClose={() => setShowLLMProviderModal(false)}
  config={llmProviderConfig}
  onConfigChange={(newConfig) => {
    setLlmProviderConfig(newConfig);
    initializeLLMProvider(); // Reinitialize with new config
  }}
/>
```

## Testing

### Ollama
1. Ensure Ollama is running: `ollama serve`
2. Pull a model: `ollama pull llama3.2`
3. Select "Ollama" provider in settings
4. Click "Test" button
5. Should see success message with sample response

### OpenCode
1. Set `VITE_OPENROUTER_API_KEY` environment variable (optional)
2. Select "OpenCode" provider in settings
3. Enter API endpoint (defaults to OpenRouter)
4. Enter API key if not using env var
5. Click "Test" button
6. Should see success message

## Future Enhancements

- [ ] Stream support in UI components
- [ ] Model fine-tuning configuration
- [ ] Provider-specific advanced options
- [ ] Configuration presets/profiles
- [ ] Usage statistics and cost tracking
- [ ] Multi-provider fallback support
