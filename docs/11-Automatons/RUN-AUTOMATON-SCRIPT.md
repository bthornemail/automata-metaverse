---
id: run-automaton-script-docs
title: "run-automaton.sh - Automaton Launcher Script"
level: practical
type: documentation
tags: [automaton-launcher, bash-script, ollama-integration, continuous-execution]
keywords: [run-automaton-script, bash-launcher, ollama-integration, continuous-automaton, ollama-automaton, dependency-checking, model-management]
prerequisites: [automatons-docs-readme]
enables: []
related: [continuous-automaton-docs, ollama-automaton-docs, advanced-automaton-docs]
readingTime: 15
difficulty: 2
blackboard:
  status: active
  assignedAgent: "4D-Network-Agent"
  lastUpdate: null
  dependencies: [continuous-automaton-engine, ollama-automaton-engine]
  watchers: []
---

# run-automaton.sh - Automaton Launcher Script

**Location**: `/home/main/automaton/scripts/run-automaton.sh`

## Overview

`run-automaton.sh` is a bash launcher script that provides a convenient command-line interface for running the Self-Referencing JSONL Automaton system. It handles dependency checking, configuration parsing, and execution of either the built-in intelligence automaton or the Ollama AI-powered automaton.

## Purpose

The script serves as the primary entry point for running automaton executions, abstracting away the complexity of:
- Dependency validation (Node.js, npx, Ollama)
- Model management (checking and pulling Ollama models)
- Argument parsing and validation
- Command construction for TypeScript execution

## Features

- ✅ Automatic dependency checking
- ✅ Ollama integration with model validation
- ✅ Configurable execution intervals
- ✅ Optional iteration limits
- ✅ Graceful error handling
- ✅ Help documentation

## Model Support

### Ollama Models

The script supports any Ollama model installed locally:

```bash
# Standard Ollama models
./scripts/run-automaton.sh --ollama --model llama3.2:latest
./scripts/run-automaton.sh --ollama --model mistral
./scripts/run-automaton.sh --ollama --model codellama
```

### OpenCode Models

The script also supports **OpenCode-configured models** from `opencode.jsonc`:

```bash
# OpenCode models (automatically detected)
./scripts/run-automaton.sh --ollama --model gpt-oss:20b
```

OpenCode models are automatically:
- Detected from `opencode.jsonc` → `provider.ollama.models`
- Used with OpenAI-compatible API endpoint (`/v1/chat/completions`)
- Fallback to native API if needed

## Usage

### Basic Usage

```bash
# Run with built-in intelligence (default)
./scripts/run-automaton.sh

# Run with Ollama AI
./scripts/run-automaton.sh --ollama

# Show help
./scripts/run-automaton.sh --help
```

### Advanced Usage

```bash
# Custom interval and model
./scripts/run-automaton.sh --ollama --model qwen2.5:3b --interval 3000

# Limited execution
./scripts/run-automaton.sh --max 50 --interval 1000

# Custom automaton file
./scripts/run-automaton.sh --file ./automaton-kernel.jsonl --ollama

# Full configuration
./scripts/run-automaton.sh --ollama --model llama3.2 --interval 2000 --max 100 --file ./automaton.jsonl
```

## Command-Line Options

| Option | Description | Default | Example |
|--------|-------------|---------|---------|
| `--ollama` | Use Ollama for AI control | Built-in logic | `--ollama` |
| `--model MODEL` | Ollama model name | `llama3.2` | `--model qwen2.5:3b` |
| `--interval MS` | Interval between iterations (ms) | `2000` | `--interval 3000` |
| `--max N` | Maximum iterations | Unlimited | `--max 50` |
| `--file FILE` | Automaton JSONL file path | `./automaton.jsonl` | `--file ./custom.jsonl` |
| `-h, --help` | Show help message | - | `--help` |

## Execution Flow

```
1. Check Node.js availability
   ↓
2. Check npx availability
   ↓
3. Parse command-line arguments
   ↓
4. If --ollama:
   ├─ Check Ollama installation
   ├─ Check model availability
   └─ Pull model if missing
   ↓
5. Build command arguments
   ↓
6. Execute TypeScript automaton:
   ├─ continuous-automaton.ts (built-in)
   └─ ollama-automaton.ts (Ollama)
```

## Examples

### Example 1: Default Execution
```bash
./scripts/run-automaton.sh
```
**What happens**:
- Uses built-in intelligence
- 2000ms interval
- Unlimited iterations
- Executes: `npx tsx continuous-automaton.ts 2000`

### Example 2: Ollama with Default Model
```bash
./scripts/run-automaton.sh --ollama
```
**What happens**:
- Checks Ollama installation
- Verifies `llama3.2` model (pulls if missing)
- Uses Ollama AI for decisions
- 2000ms interval
- Executes: `npx tsx ollama-automaton.ts llama3.2 2000`

### Example 3: Custom Configuration
```bash
./scripts/run-automaton.sh --ollama --model qwen2.5:3b --interval 3000 --max 25
```
**What happens**:
- Checks Ollama installation
- Verifies `qwen2.5:3b` model (pulls if missing)
- Uses Ollama AI
- 3000ms interval
- Stops after 25 iterations
- Executes: `npx tsx ollama-automaton.ts qwen2.5:3b 3000 25`

### Example 4: Limited Built-in Run
```bash
./scripts/run-automaton.sh --interval 1000 --max 10
```
**What happens**:
- Uses built-in intelligence
- 1000ms interval
- Stops after 10 iterations
- Executes: `npx tsx continuous-automaton.ts 1000 --max 10`

## Error Handling

### Node.js Not Found
```
❌ Node.js not found. Please install Node.js first.
```
**Solution**: Install Node.js from [nodejs.org](https://nodejs.org/)

### npx Not Found
```
❌ npx not found. Please install Node.js with npm.
```
**Solution**: Install Node.js (npx comes with npm)

### Ollama Not Found
```
❌ Ollama not found. Install with:
   curl -fsSL https://ollama.ai/install.sh | sh
   ollama pull llama3.2
```
**Solution**: Install Ollama using the provided command

### Model Not Available
```
📦 Pulling Ollama model: llama3.2
```
**What happens**: Script automatically pulls the model if missing

## Implementation Details

### Argument Parsing
The script uses a `while` loop with `case` statements to parse arguments:
- Supports `--option` and `--option value` formats
- Handles `-h` and `--help` shortcuts
- Validates required values

### Model Management
When `--ollama` is specified:
1. Checks if `ollama` command exists
2. Lists available models: `ollama list`
3. Checks if specified model exists
4. Pulls model if missing: `ollama pull MODEL`

### Command Construction
Builds arguments array based on:
- Automaton type (built-in vs Ollama)
- Interval value
- Max iterations (if specified)
- Model name (if Ollama)

### Execution
Executes TypeScript files using `npx tsx`:
- `npx tsx continuous-automaton.ts [interval] [--max N]`
- `npx tsx ollama-automaton.ts [model] [interval] [maxIterations]`

## Dependencies

### Required
- **Node.js**: JavaScript runtime
- **npx**: Package runner (comes with npm)
- **tsx**: TypeScript executor (installed via npx)

### Optional (for Ollama mode)
- **Ollama**: AI model runner
- **Ollama Model**: Specific model (e.g., llama3.2)

## Integration

The script integrates with:
- **`continuous-automaton.ts`**: Built-in intelligence automaton
- **`ollama-automaton.ts`**: Ollama AI automaton
- **`advanced-automaton.ts`**: Core automaton engine (imported by runners)

## See Also

- **`docs/11-Automatons/CONTINUOUS-AUTOMATON.md`**: Built-in intelligence automaton
- **`docs/11-Automatons/OLLAMA-AUTOMATON.md`**: Ollama AI automaton
- **`docs/11-Automatons/ADVANCED-AUTOMATON.md`**: Core engine documentation
