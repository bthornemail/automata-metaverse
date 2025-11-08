---
id: ollama-automaton-docs
title: "ollama-automaton.ts - Ollama AI-Powered Automaton"
level: advanced
type: documentation
tags: [ollama-automaton, ai-powered, ollama-integration, context-aware-prompts, intelligent-action-selection]
keywords: [ollama-automaton, ai-powered-automaton, ollama-integration, context-aware-prompts, intelligent-decision-making, dimensional-context]
prerequisites: [automatons-docs-readme, advanced-automaton-docs]
enables: []
related: [run-automaton-script-docs, continuous-automaton-docs, advanced-automaton-docs]
readingTime: 25
difficulty: 4
blackboard:
  status: active
  assignedAgent: "6D-Intelligence-Agent"
  lastUpdate: null
  dependencies: [advanced-automaton-engine, ollama-cli]
  watchers: []
---

# ollama-automaton.ts - Ollama AI-Powered Automaton

**Location**: `/home/main/automaton/ollama-automaton.ts`

## Overview

`ollama-automaton.ts` implements an AI-powered automaton that uses Ollama for intelligent action selection. It generates context-aware prompts based on the current automaton state and uses Ollama's language model to decide the next action.

## Purpose

Provides AI-driven execution of the automaton system with:
- Context-aware decision making
- Understanding of dimensional progression
- Learning from execution history
- Intelligent action selection based on mathematical context

## Key Features

- ✅ Ollama AI integration for action selection
- ✅ **OpenCode model support** - Automatically detects and uses models from `opencode.jsonc`
- ✅ **Response waiting with timeout** - Properly waits for Ollama responses with 5-minute timeout
- ✅ **Dual API support** - Uses native Ollama API and OpenAI-compatible API for OpenCode models
- ✅ **Decision Trie Visualization** - Visual decision-making process showing context, actions, reasoning, and execution
- ✅ **Full LLM Response Display** - Shows complete raw LLM responses with multi-line formatting
- ✅ **LLM Reasoning Extraction** - Automatically extracts and displays reasoning from LLM responses
- ✅ Context-aware prompt generation
- ✅ Execution history analysis
- ✅ Dimensional context understanding
- ✅ Graceful fallback on errors (HTTP → CLI)
- ✅ Automatic state saving and analysis
- ✅ Custom automaton file support via `--file` option

## Architecture

### Response Handling

The automaton **properly waits for Ollama responses** with the following features:

1. **Timeout Protection**: 5-minute timeout for large models (configurable)
2. **HTTP API First**: Uses native Ollama HTTP API (`/api/generate`) for best performance
3. **OpenAI-Compatible Fallback**: Automatically tries `/v1/chat/completions` for OpenCode models
4. **CLI Fallback**: Falls back to `ollama run` CLI if HTTP APIs fail
5. **Error Handling**: Comprehensive error messages and graceful degradation

### OpenCode Model Support

The automaton automatically detects and supports OpenCode models configured in `opencode.jsonc`:

- **Automatic Detection**: Loads models from `opencode.jsonc` → `provider.ollama.models`
- **OpenAI-Compatible API**: Uses `/v1/chat/completions` endpoint for OpenCode models
- **Seamless Integration**: Works with both native Ollama models and OpenCode-configured models

**Example OpenCode models**:
- `gpt-oss:20b` (from your `opencode.jsonc`)
- Any model listed in `provider.ollama.models`

**Usage**:
```bash
./scripts/run-automaton.sh --ollama --model gpt-oss:20b --interval 3000 --max 50
```

### Class: `OllamaAutomatonRunner`

**Constructor**:
```typescript
new OllamaAutomatonRunner(
  automatonFile: string = './automaton.jsonl',
  ollamaModel: string = 'llama3.2'
)
```

**Key Methods**:
- `startContinuous(intervalMs, maxIterations)`: Starts AI-powered execution
- `queryOllama(prompt)`: Queries Ollama via HTTP API or CLI
- `queryOllamaHTTP(prompt)`: Uses native Ollama HTTP API (`/api/generate`)
- `queryOllamaOpenAICompatible(prompt)`: Uses OpenAI-compatible API (`/v1/chat/completions`)
- `queryOllamaCLI(prompt)`: Fallback to CLI (`ollama run`)
- `generateContextPrompt()`: Creates context-aware prompt with reasoning request
- `executeAIAction()`: Executes AI-selected action with decision trie visualization
- `printDecisionTrie()`: Visualizes decision-making process
- `inferReasoning()`: Generates contextual reasoning based on action and history
- `stop()`: Stops execution gracefully

## AI Prompt Structure

The automaton generates comprehensive prompts that include:

### Context Information
- Current dimension (0D-7D)
- Current state
- Self-reference information (line, pattern)
- Iteration count
- Recent execution history (last 5 actions)

### Dimensional Context
Each dimension is explained with:
- Church encoding
- Mathematical meaning
- Purpose and operations

### Available Actions
All possible actions with descriptions:
- `evolve`: Progress to next dimension
- `self-reference`: Execute self-reference pattern
- `self-modify`: Add new self-referential object
- `self-io`: Read/write own JSONL file
- `validate-self`: Check SHACL compliance
- `self-train`: Learn from execution history
- `self-observe`: Quantum observation and collapse
- `compose`: Compose multiple states

### Decision Criteria
The prompt asks the AI to consider:
1. Dimensional context and mathematical meaning
2. Execution history patterns
3. Self-referential integrity
4. Exploration vs exploitation balance

## Execution Flow

```
1. Validate Ollama availability
   ↓
2. Initialize automaton from JSONL file
   ↓
3. Print initial state
   ↓
4. Start continuous loop:
   ├─ Print status
   ├─ Generate context prompt
   ├─ Query Ollama for action
   ├─ Parse AI response
   ├─ Execute selected action
   ├─ Save and analyze (every 10 iterations)
   └─ Wait for interval
   ↓
5. Print final state and analysis
```

## Usage

### CLI Interface

```bash
# Basic execution with default model
npx tsx ollama-automaton.ts

# Custom model
npx tsx ollama-automaton.ts qwen2.5:3b

# Custom interval
npx tsx ollama-automaton.ts llama3.2 3000

# Limited iterations
npx tsx ollama-automaton.ts llama3.2 2000 100
```

### Programmatic Usage

```typescript
import { OllamaAutomatonRunner } from './ollama-automaton';

const runner = new OllamaAutomatonRunner('./automaton.jsonl', 'llama3.2');
await runner.startContinuous(3000, 50); // 3s interval, 50 max iterations
```

## CLI Arguments

- **First argument**: Ollama model name (default: `llama3.2`)
- **Second argument**: Interval in milliseconds (default: `3000`)
- **Third argument**: Maximum iterations (optional)
- **Last argument**: Automaton JSONL file path (default: `./automaton.jsonl`)

## Ollama Integration

### Query Method
Uses `spawn('ollama', ['run', model])` to execute Ollama CLI:
- Writes prompt to stdin
- Reads response from stdout
- Handles errors gracefully

### Response Parsing
- Converts response to lowercase
- Normalizes whitespace
- Maps to valid action names
- Falls back to `evolve` if unknown

## Error Handling

### Ollama Not Available
If Ollama is not installed or unavailable:
```
❌ Ollama not available. Please install Ollama first:
   curl -fsSL https://ollama.ai/install.sh | sh
   ollama pull llama3.2
```
**Solution**: Install Ollama and pull the model

### Query Failure
If Ollama query fails:
- Falls back to automatic evolution
- Logs error: `❌ Ollama query failed: [error]`
- Continues execution with default action

### Unknown Action
If AI returns unknown action:
- Logs warning: `⚠️ Unknown action: [action], defaulting to evolve`
- Executes `evolve` action
- Continues execution

## Decision Trie Visualization

The automaton includes a comprehensive **Decision Trie** that visualizes the AI's decision-making process:

### Decision Trie Output Structure

```
🌳 Decision Trie
════════════════════════════════════════════════════════════

📊 Context:
   Dimension: 4D (Network Topology)
   State: evolved
   Self-reference: line 12 (Network Topology (4D))
   Iteration: 15
   History: [evolve, self-modify, evolve, self-io, evolve]

🎯 Available Actions:
   ✅ 1. evolve
      2. self-reference
      3. self-modify
      4. self-io
      5. validate-self
      6. self-train
      7. self-observe
      8. compose

🔀 Decision Path:
   📝 Full LLM Response:
      ┌─ evolve
      │  Reasoning: We are currently at dimension 4D, which represents
      │  network topology and spacetime structures. Evolving to 5D will
      │  introduce consensus mechanisms and blockchain operations, which
      │  is a natural progression in the dimensional hierarchy.
      └─

   🎯 Extracted Action: "evolve"
      ⚙️  Parsed from: "evolve [Reasoning: ...]"

   💡 LLM Reasoning:
      ┌─ We are currently at dimension 4D, which represents network
      │  topology and spacetime structures. Evolving to 5D will
      │  introduce consensus mechanisms and blockchain operations, which
      │  is a natural progression in the dimensional hierarchy.
      └─

   💭 Inferred Reasoning:
      Progression from 4D to 5D | Network to consensus transition

   ⚡ Execution:
      → Executing: evolve
════════════════════════════════════════════════════════════
```

### Decision Trie Features

1. **Context Display**: Shows current dimension, state, self-reference, iteration, and recent history
2. **Available Actions**: Lists all possible actions with the chosen one marked
3. **Full LLM Response**: Displays complete raw response from Ollama with multi-line formatting
4. **Extracted Action**: Shows the parsed action name
5. **LLM Reasoning**: Extracts and displays reasoning provided by the LLM (from brackets, bullet points, or multi-line text)
6. **Inferred Reasoning**: System-generated contextual reasoning based on action and history
7. **Execution**: Shows the action about to be executed

### Reasoning Extraction

The decision trie automatically extracts reasoning from LLM responses using multiple patterns:
- `[Reasoning: ...]` or `[briefly ...]` brackets
- `Reasoning:` or `Brief reasoning:` lines
- Multi-line text after the action
- Generic bracketed content with reasoning keywords

## Status Output

The automaton prints detailed status information:

```
============================================================
🔄 Iteration 15 | Dimension 4D
📍 State: evolved
🔗 Self-reference: line 12 (Network Topology (4D))
🔧 Self-modifications: 1
📚 Total objects: 98
🤖 Querying Ollama (llama3.2:latest)...
🧠 AI Decision: evolve
```

## State Management

### Automatic Saving
- Saves automaton state every 10 iterations
- Analyzes self-reference patterns after saving

### Analysis
- Prints dimensional progression
- Shows self-reference patterns
- Displays execution history

## Requirements

### Required
- **Ollama**: AI model runner
  ```bash
  curl -fsSL https://ollama.ai/install.sh | sh
  ```

### Model Installation
```bash
# Default model
ollama pull llama3.2

# Alternative models
ollama pull qwen2.5:3b
ollama pull codellama
ollama pull mistral
```

## Examples

### Example 1: Default Execution
```bash
npx tsx ollama-automaton.ts
```
Uses `llama3.2`, 3s interval, unlimited iterations.

### Example 2: Custom Model
```bash
npx tsx ollama-automaton.ts qwen2.5:3b 2000
```
Uses `qwen2.5:3b`, 2s interval, unlimited iterations.

### Example 3: Limited Run
```bash
npx tsx ollama-automaton.ts llama3.2 3000 50
```
Uses `llama3.2`, 3s interval, stops after 50 iterations.

### Example 4: Custom Automaton File
```bash
npx tsx ollama-automaton.ts llama3.2 3000 50 ./automaton-kernel.jsonl
```
Uses `llama3.2`, 3s interval, stops after 50 iterations, loads `automaton-kernel.jsonl`.

## AI Decision Making

The AI receives comprehensive context and is asked to:
1. **Consider dimensional context**: Understand the mathematical meaning of each dimension
2. **Analyze history**: Learn from previous actions
3. **Maintain integrity**: Ensure self-referential consistency
4. **Balance exploration**: Explore new patterns vs exploit known patterns

### Example Prompt
```
You are an AI controller for a self-referencing JSONL automaton...

Current state:
- Dimension: 4D
- State: evolved
- Self-reference: line 12
- Pattern: Network Topology (4D)
- Iteration: 15
- Recent actions: evolve, self-modify, evolve, self-io, evolve

Available actions:
- evolve: Progress to next dimension
- self-reference: Execute self-reference pattern
...

Respond with the action name that should be executed next. You may optionally include brief reasoning.

Format: action-name [optional: brief reasoning]
```

## Integration

Integrates with:
- **`advanced-automaton.ts`**: Core automaton engine
- **`run-automaton.sh`**: Launcher script
- **Ollama CLI**: External AI model runner
- **`automaton.jsonl`**: Main automaton file

## See Also

- **`docs/11-Automatons/README.md`**: Overview documentation
- **`docs/11-Automatons/CONTINUOUS-AUTOMATON.md`**: Built-in intelligence version
- **`docs/11-Automatons/ADVANCED-AUTOMATON.md`**: Core engine details
