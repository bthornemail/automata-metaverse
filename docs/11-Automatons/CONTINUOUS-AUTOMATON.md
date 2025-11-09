---
id: continuous-automaton-docs
title: "continuous-automaton.ts - Built-in Intelligence Automaton"
level: practical
type: documentation
tags: [continuous-automaton, built-in-intelligence, action-selection, dimensional-progression]
keywords: [continuous-automaton, built-in-intelligence, smart-action-selection, periodic-actions, dimension-specific-actions, execution-flow]
prerequisites: [automatons-docs-readme, advanced-automaton-docs]
enables: []
related: [run-automaton-script-docs, advanced-automaton-docs, ollama-automaton-docs]
readingTime: 20
difficulty: 3
blackboard:
  status: active
  assignedAgent: "6D-Intelligence-Agent"
  lastUpdate: null
  dependencies: [advanced-automaton-engine]
  watchers: []
---

# continuous-automaton.ts - Built-in Intelligence Automaton

**Location**: `/home/main/automaton/continuous-automaton.ts`

## Overview

`continuous-automaton.ts` implements a continuous execution automaton with built-in intelligent action selection. It operates the Self-Referencing JSONL Automaton system using rule-based logic rather than external AI models.

## Purpose

Provides autonomous execution of the automaton system with intelligent decision-making based on:
- Iteration count patterns
- Current dimensional context
- Execution history
- Built-in heuristics

## Key Features

- ✅ Built-in intelligent action selection
- ✅ Periodic self-modification and validation
- ✅ Dimension-specific action patterns
- ✅ Automatic state saving and analysis
- ✅ Graceful SIGINT handling (Ctrl+C)
- ✅ Optional Ollama fallback support

## Architecture

### Class: `ContinuousAutomatonRunner`

**Constructor**:
```typescript
new ContinuousAutomatonRunner(
  automatonFile: string = './automaton.jsonl',
  useOllama: boolean = false,
  ollamaModel: string = 'llama3.2'
)
```

**Key Methods**:
- `startContinuous(intervalMs, maxIterations)`: Starts continuous execution
- `stop()`: Stops execution gracefully
- `getSmartAction()`: Selects next action based on heuristics
- `executeAction(action)`: Executes the selected action
- `saveAndAnalyze()`: Saves state and analyzes self-reference

## Action Selection Logic

### Periodic Actions (Based on Iteration Count)

| Iteration Modulo | Action | Purpose |
|-----------------|--------|---------|
| `% 20 === 0` | `self-modify` | Periodic self-modification |
| `% 15 === 0` | `self-io` | Periodic self-I/O operations |
| `% 10 === 0` | `validate-self` | Periodic SHACL validation |
| `% 8 === 0` | `self-train` | Periodic learning from history |

### Dimension-Specific Actions

| Dimension | Action Probability | Actions |
|-----------|-------------------|---------|
| **0D** | 70% evolve, 30% self-reference | Identity operations |
| **2D** | 60% evolve, 40% self-modify | Pattern operations |
| **4D** | 50% evolve, 50% self-io | Network operations |
| **6D** | 60% evolve, 40% self-train | Intelligence operations |
| **7D** | 70% evolve, 30% self-observe | Quantum operations |
| **Default** | 100% evolve | Dimensional progression |

## Execution Flow

```
1. Initialize automaton from JSONL file
   ↓
2. Print initial state
   ↓
3. Start continuous loop:
   ├─ Print status (dimension, iteration, state)
   ├─ Select action (smart or Ollama fallback)
   ├─ Execute action
   ├─ Save and analyze (every 25 iterations)
   └─ Wait for interval
   ↓
4. Print final state and analysis
```

## Usage

### CLI Interface

```bash
# Basic execution
npx tsx continuous-automaton.ts

# Custom interval
npx tsx continuous-automaton.ts 3000

# Limited iterations
npx tsx continuous-automaton.ts 2000 --max 50

# With Ollama fallback
npx tsx continuous-automaton.ts --ollama --model llama3.2
```

### Programmatic Usage

```typescript
import { ContinuousAutomatonRunner } from './continuous-automaton';

const runner = new ContinuousAutomatonRunner('./automaton.jsonl');
await runner.startContinuous(2000, 100); // 2s interval, 100 max iterations
```

## CLI Arguments

- **First argument**: Interval in milliseconds (default: 2000)
- **`--max=N`**: Maximum iterations (default: unlimited)
- **`--ollama`**: Attempt to use Ollama (falls back to built-in if unavailable)
- **`--model=MODEL`**: Ollama model name (default: llama3.2)

## Action Types

### `evolve`
Progresses to the next dimension (0D → 1D → ... → 7D → 0D)

### `self-reference`
Creates a self-referential object pointing back to the automaton file

### `self-modify`
Adds a new self-modifying object with dimension-specific modification code

### `self-io`
Reads/writes the automaton's own JSONL file

### `validate-self`
Validates SHACL constraints and dimensional integrity

### `self-train`
Learns from execution history and action frequencies

### `self-observe`
Observes current state and collapses to 0D (quantum observation)

### `compose`
Composes multiple automaton states together

## Status Output

The automaton prints status information for each iteration:

```
============================================================
🔄 Iteration 42 | Dimension 3D
📍 State: evolved
🔗 Self-reference: line 15 (Church Algebra + Y-Combinator (3D))
🔧 Self-modifications: 2
📚 Total objects: 103
🤖 AI Mode: Built-in logic
```

## State Management

### Automatic Saving
- Saves automaton state every 25 iterations
- Analyzes self-reference patterns after saving

### Analysis
- Prints dimensional progression
- Shows self-reference patterns
- Displays execution history

## Error Handling

### Ollama Fallback
If `--ollama` is specified but Ollama fails:
- Falls back to built-in intelligent logic
- Logs warning: `⚠️ Ollama failed, using built-in logic`

### SIGINT Handling
Gracefully handles Ctrl+C:
- Stops execution loop
- Prints final state
- Exits cleanly

## Examples

### Example 1: Basic Run
```bash
npx tsx continuous-automaton.ts
```
Runs with default 2s interval, unlimited iterations.

### Example 2: Fast Limited Run
```bash
npx tsx continuous-automaton.ts 1000 --max 10
```
Runs with 1s interval, stops after 10 iterations.

### Example 3: With Ollama Fallback
```bash
npx tsx continuous-automaton.ts --ollama --model llama3.2 2000
```
Attempts Ollama, falls back to built-in if unavailable.

### Example 4: Custom Automaton File
```bash
npx tsx continuous-automaton.ts 2000 --max 50 ./automaton-kernel.jsonl
```
Uses custom automaton file `automaton-kernel.jsonl`, 2s interval, 50 max iterations.

## Integration

Integrates with:
- **`advanced-automaton.ts`**: Core automaton engine
- **`run-automaton.sh`**: Launcher script
- **`automaton.jsonl`**: Main automaton file

## See Also

- **`docs/11-Automatons/README.md`**: Overview documentation
- **`docs/11-Automatons/ADVANCED-AUTOMATON.md`**: Core engine details
- **`docs/11-Automatons/OLLAMA-AUTOMATON.md`**: Ollama AI version
