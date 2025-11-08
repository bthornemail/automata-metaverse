---
id: automatons-docs-readme
title: "Automatons Documentation"
level: foundational
type: documentation
tags: [automatons, execution-scripts, continuous-automaton, ollama-automaton, bootstrap-automaton, church-encoding, dimensional-progression]
keywords: [automatons, run-automaton-script, continuous-automaton, ollama-automaton, advanced-automaton, bootstrap-automaton, automaton-runner, self-referencing-automaton, jsonl-automaton, church-encoding, dimensional-progression-0d-7d]
prerequisites: [multiverse-canvas-rfc2119-spec, meta-log-docs-readme]
enables: [run-automaton-script-docs, continuous-automaton-docs, ollama-automaton-docs, advanced-automaton-docs, bootstrap-automaton-docs]
related: [agents-multi-agent-system, r5rs-canvas-engine, metaverse-canvas-complete]
readingTime: 30
difficulty: 3
blackboard:
  status: active
  assignedAgent: "4D-Network-Agent"
  lastUpdate: null
  dependencies: [advanced-automaton-engine]
  watchers: []
  r5rsEngine: "r5rs-canvas-engine.scm"
  selfBuilding:
    enabled: true
    source: "advanced-automaton.ts"
    pattern: "self-referencing-automaton"
    regeneration:
      function: "r5rs:parse-jsonl-canvas"
      args: ["automaton.jsonl"]
---

# Automatons Documentation

This directory contains documentation for all automaton execution scripts and TypeScript implementations in the Self-Referencing JSONL Automaton system.

## Overview

The automaton system implements a self-referential computational topology that evolves through 8 dimensions (0D-7D), each representing a different level of Church encoding and mathematical abstraction. The system can operate with built-in intelligence or integrate with Ollama AI for advanced decision-making.

### Recent Improvements

- ✅ **Custom Automaton File Support**: Use `--file` option to specify any JSONL automaton file
- ✅ **Decision Trie Visualization**: Visual decision-making process showing context, actions, reasoning, and execution
- ✅ **Full LLM Response Display**: Complete raw LLM responses with multi-line formatting
- ✅ **LLM Reasoning Extraction**: Automatically extracts and displays reasoning from LLM responses
- ✅ **OpenCode Model Support**: Automatically detects and uses models from `opencode.jsonc`
- ✅ **Enhanced Response Handling**: Proper timeout handling and dual API support (HTTP + OpenAI-compatible)

## Table of Contents

- [Scripts](#scripts)
- [TypeScript Automatons](#typescript-automatons)
- [Usage Guide](#usage-guide)
- [Architecture](#architecture)
- [Dimensional Progression](#dimensional-progression)

## Scripts

### `run-automaton.sh`

**Location**: `/home/main/automaton/scripts/run-automaton.sh`

A bash launcher script that provides a convenient CLI interface for running automaton executables with various configuration options.

**Features**:
- Supports both built-in intelligence and Ollama AI integration
- Configurable execution intervals
- Optional maximum iteration limits
- Automatic Ollama model detection and installation
- Graceful error handling

**Usage**:
```bash
# Built-in intelligence (default)
./scripts/run-automaton.sh

# With Ollama AI
./scripts/run-automaton.sh --ollama

# Custom configuration
./scripts/run-automaton.sh --ollama --model llama3.2 --interval 3000 --max 50

# Custom automaton file
./scripts/run-automaton.sh --file ./automaton-kernel.jsonl --ollama

# Help
./scripts/run-automaton.sh --help
```

**Options**:
- `--ollama`: Use Ollama for AI control (default: built-in logic)
- `--model MODEL`: Ollama model name (default: llama3.2)
- `--interval MS`: Interval between iterations in milliseconds (default: 2000)
- `--max N`: Maximum number of iterations (default: unlimited)
- `--file FILE`: Automaton JSONL file path (default: ./automaton.jsonl)
- `-h, --help`: Show help message

**What it does**:
1. Validates Node.js and npx availability
2. Checks Ollama installation if `--ollama` is specified
3. Verifies Ollama model availability (pulls if missing)
4. Validates automaton file existence (warns if missing)
5. Constructs appropriate command arguments
6. Executes either `continuous-automaton.ts` (built-in) or `ollama-automaton.ts` (Ollama)
7. Passes interval, max iteration, and automaton file parameters

**Examples**:
```bash
# Quick start with defaults
./scripts/run-automaton.sh

# AI-powered execution
./scripts/run-automaton.sh --ollama --model qwen2.5:3b

# Limited run for testing
./scripts/run-automaton.sh --max 10 --interval 1000
```

## TypeScript Automatons

### 1. `continuous-automaton.ts`

**Purpose**: Continuous execution automaton with built-in intelligent action selection

**Key Features**:
- Built-in intelligent action selection based on iteration count and dimension
- Periodic self-modification, self-I/O, validation, and training
- Dimension-specific action patterns
- Automatic state saving and analysis
- Graceful SIGINT handling

**Action Selection Logic**:
- Every 20 iterations: `self-modify`
- Every 15 iterations: `self-io`
- Every 10 iterations: `validate-self`
- Every 8 iterations: `self-train`
- Dimension-specific actions based on current dimension (0D-7D)
- Default: `evolve` for dimensional progression

**Usage**:
```bash
npx tsx continuous-automaton.ts [interval] [--max iterations]
```

**Example**:
```bash
npx tsx continuous-automaton.ts 2000 --max 50
```

**CLI Arguments**:
- First argument: Interval in milliseconds (default: 2000)
- `--max=N`: Maximum iterations (default: unlimited)
- Last argument: Automaton JSONL file path (default: ./automaton.jsonl)
- `--ollama`: Use Ollama (falls back to built-in if unavailable)
- `--model=MODEL`: Ollama model name

### 2. `ollama-automaton.ts`

**Purpose**: AI-powered automaton using Ollama for intelligent action selection

**Key Features**:
- Integrates with Ollama CLI for AI decision-making
- Generates context-aware prompts based on current automaton state
- Includes execution history, dimensional context, and available actions
- Falls back to built-in logic if Ollama fails
- Validates Ollama availability before starting

**AI Prompt Structure**:
- Current dimension and state
- Self-reference information
- Execution history (last 5 actions)
- Available actions with descriptions
- Dimensional context (0D-7D Church encodings)

**Usage**:
```bash
npx tsx ollama-automaton.ts [model] [interval] [maxIterations]
```

**Example**:
```bash
npx tsx ollama-automaton.ts llama3.2 3000 100
```

**CLI Arguments**:
- First argument: Ollama model name (default: llama3.2)
- Second argument: Interval in milliseconds (default: 3000)
- Third argument: Maximum iterations (optional)
- Last argument: Automaton JSONL file path (default: ./automaton.jsonl)

**Requirements**:
- Ollama must be installed: `curl -fsSL https://ollama.ai/install.sh | sh`
- Model must be available: `ollama pull llama3.2`

### 3. `advanced-automaton.ts`

**Purpose**: Core automaton engine with advanced self-referential capabilities

**Key Features**:
- Loads and saves JSONL automaton files
- Implements 8-dimensional Church encoding progression
- Supports multiple action types (evolve, self-reference, self-modify, etc.)
- Generates dimension-specific Church encoding patterns
- Analyzes self-reference structures
- Validates SHACL constraints

**Core Class**: `AdvancedSelfReferencingAutomaton`

**Key Methods**:
- `load()`: Loads automaton from JSONL file
- `save()`: Saves current state to JSONL file
- `step()`: Executes one step of automaton evolution
- `run(steps)`: Runs automaton for specified number of steps
- `executeEvolution()`: Progresses to next dimension
- `executeSelfReference()`: Creates self-referential objects
- `executeSelfModification()`: Adds new self-modifying objects
- `analyzeSelfReference()`: Analyzes self-reference patterns

**Dimensional Actions**:
- **0D**: Identity operations, quantum vacuum topology
- **1D**: Successor operations, temporal evolution
- **2D**: Pair operations, bipartite structures
- **3D**: Algebraic operations (add, mult, exp), Y-combinator
- **4D**: Network topology, spacetime structures
- **5D**: Blockchain consensus, immutable ledgers
- **6D**: Neural networks, attention mechanisms
- **7D**: Quantum computing, superposition, entanglement

**Usage**:
```typescript
import { AdvancedSelfReferencingAutomaton } from './advanced-automaton';

const automaton = new AdvancedSelfReferencingAutomaton('./automaton.jsonl');
automaton.printState();
automaton.run(20);
automaton.analyzeSelfReference();
```

### 4. `bootstrap-automaton.ts`

**Purpose**: Optimized self-instantiation bootstrap for initializing automaton from kernel

**Key Features**:
- Transaction-based bootstrap process
- Validates SHACL constraints
- Progresses through all 8 dimensions
- Activates OpenCode integration
- Creates self-reference structures
- Links dimensional automata to kernel

**Bootstrap Phases**:
1. **Phase 1: Kernel Bootstrap**
   - Loads `automaton-kernel.jsonl`
   - Executes transaction bootstrap steps
   - Validates SHACL constraints
   - Initializes Church encoding evaluator

2. **Phase 2: Dimensional Progression**
   - Instantiates each dimension (0D-7D)
   - Validates Church encodings
   - Verifies self-reference line numbers

3. **Phase 3: Integration Activation**
   - Activates OpenCode integration
   - Tests integration with sample commands
   - Verifies topology state

4. **Phase 4: Self-Reference Execution**
   - Creates kernel self-reference
   - Creates automaton self-reference
   - Links dimensional automata to kernel

**Usage**:
```bash
npx tsx bootstrap-automaton.ts
```

**Dependencies**:
- `automaton-kernel.jsonl`: Seed kernel file
- `automaton.jsonl`: Target automaton file
- OpenCode integration modules

### 5. `automaton-runner.ts`

**Purpose**: Basic automaton runner with simplified execution model

**Key Features**:
- Simplified execution model
- Basic self-reference operations
- Execution history tracking
- State analysis

**Usage**:
```bash
npx tsx automaton-runner.ts
```

**Note**: This is a simpler version of `advanced-automaton.ts` and is primarily used for basic demonstrations.

## Usage Guide

### Quick Start

1. **Run with built-in intelligence**:
   ```bash
   ./scripts/run-automaton.sh
   ```

2. **Run with Ollama AI**:
   ```bash
   ./scripts/run-automaton.sh --ollama
   ```

3. **Bootstrap from kernel**:
   ```bash
   npx tsx bootstrap-automaton.ts
   ```

### Advanced Usage

**Custom interval and limits**:
```bash
./scripts/run-automaton.sh --interval 1000 --max 25
```

**Specific Ollama model**:
```bash
./scripts/run-automaton.sh --ollama --model qwen2.5:3b --interval 2000
```

**Direct TypeScript execution**:
```bash
# Built-in intelligence
npx tsx continuous-automaton.ts 2000 --max 50

# Ollama AI
npx tsx ollama-automaton.ts llama3.2 3000 100
```

## Architecture

### Execution Flow

```
run-automaton.sh
    ↓
[Check dependencies]
    ↓
[Select automaton type]
    ├─→ continuous-automaton.ts (built-in)
    └─→ ollama-automaton.ts (AI-powered)
        ↓
    AdvancedSelfReferencingAutomaton
        ↓
    [Load JSONL]
        ↓
    [Execute Actions]
        ├─→ evolve
        ├─→ self-reference
        ├─→ self-modify
        ├─→ self-io
        ├─→ validate-self
        ├─→ self-train
        ├─→ self-observe
        └─→ compose
        ↓
    [Save State]
        ↓
    [Analyze Self-Reference]
```

### Dimensional Progression

The automaton progresses through 8 dimensions:

```
0D (Identity) → 1D (Successor) → 2D (Pair) → 3D (Algebra)
    ↓
4D (Network) → 5D (Consensus) → 6D (Intelligence) → 7D (Quantum)
    ↓
[Cycle back to 0D]
```

Each dimension has:
- **Church Encoding**: Lambda calculus representation
- **Topology Pattern**: Mathematical structure
- **Actions**: Dimension-specific operations
- **Self-Reference**: Points back to kernel/automaton file

## Dimensional Progression

### 0D: Quantum Vacuum Topology
- **Church Encoding**: `λf.λx.x` (identity)
- **Pattern**: Empty pattern `()`, point topology
- **Actions**: Identity operations, vacuum fluctuations

### 1D: Temporal Topology
- **Church Encoding**: `λn.λf.λx.f(nfx)` (successor)
- **Pattern**: Line topology ℝ¹, time fiber
- **Actions**: Successor operations, temporal evolution

### 2D: Bipartite Topology
- **Church Encoding**: `λx.λy.λf.fxy` (pair)
- **Pattern**: Bipartite structure, product topology
- **Actions**: Pair operations, structure reorganization

### 3D: Algebraic Topology
- **Church Encoding**: `λm.λn.λf.λx.mf(nfx)` (addition)
- **Pattern**: 3-manifold structure
- **Actions**: Algebraic operations, Y-combinator recursion

### 4D: Spacetime Topology
- **Church Encoding**: `λnetwork.execute(spacetime)`
- **Pattern**: Spacetime manifold, network topology
- **Actions**: Network operations, file I/O, CI/CD operations

### 5D: Consensus Topology
- **Church Encoding**: `λconsensus.validate(ledger)`
- **Pattern**: Blockchain consensus, immutable ledger
- **Actions**: Consensus operations, validation, governance

### 6D: Intelligence Topology
- **Church Encoding**: `λai.attention(transform)`
- **Pattern**: Neural networks, attention mechanisms
- **Actions**: AI operations, learning, training

### 7D: Quantum Topology
- **Church Encoding**: `λquantum.superposition(ψ)`
- **Pattern**: Quantum superposition, entanglement
- **Actions**: Quantum operations, observation, collapse

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

## File Structure

```
/home/main/automaton/
├── scripts/
│   └── run-automaton.sh          # Main launcher script
├── continuous-automaton.ts       # Built-in intelligence runner
├── ollama-automaton.ts           # Ollama AI runner
├── advanced-automaton.ts         # Core automaton engine
├── bootstrap-automaton.ts        # Bootstrap from kernel
├── automaton-runner.ts           # Basic runner
└── automaton.jsonl               # Main automaton file
```

## Related Documentation

- **`docs/05-Meta-Log/`**: Logic programming integration (ProLog, DataLog, R5RS)
- **`docs/03-Metaverse-Canvas/`**: JSONL canvas editing system
- **`docs/04-CanvasL/`**: CanvasL format specification
- **`AGENTS.md`**: Multi-agent system architecture
- **`grok_files/`**: R5RS concept definitions

## Troubleshooting

### Ollama Not Found
```bash
curl -fsSL https://ollama.ai/install.sh | sh
ollama pull llama3.2
```

### Model Not Available
```bash
ollama pull llama3.2
# or
ollama pull qwen2.5:3b
```

### JSONL File Not Found
Ensure `automaton.jsonl` exists in the project root, or bootstrap from kernel:
```bash
npx tsx bootstrap-automaton.ts
```

### Permission Denied
Make script executable:
```bash
chmod +x scripts/run-automaton.sh
```

## Examples

### Example 1: Basic Execution
```bash
./scripts/run-automaton.sh
```
Runs with built-in intelligence, 2s intervals, unlimited iterations.

### Example 2: AI-Powered Limited Run
```bash
./scripts/run-automaton.sh --ollama --model llama3.2 --interval 3000 --max 20
```
Runs with Ollama AI, 3s intervals, stops after 20 iterations.

### Example 3: Bootstrap from Kernel
```bash
npx tsx bootstrap-automaton.ts
```
Initializes automaton from `automaton-kernel.jsonl` with full dimensional progression.

### Example 4: Direct TypeScript Execution
```bash
npx tsx continuous-automaton.ts 1000 --max 10
```
Runs continuous automaton directly with 1s intervals, 10 iterations max.

## See Also

- **`scripts/run-automaton.sh`**: Main launcher script documentation
- **`continuous-automaton.ts`**: Built-in intelligence implementation
- **`ollama-automaton.ts`**: Ollama AI integration
- **`advanced-automaton.ts`**: Core engine documentation
- **`bootstrap-automaton.ts`**: Bootstrap process documentation
