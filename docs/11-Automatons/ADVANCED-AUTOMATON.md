---
id: advanced-automaton-docs
title: "advanced-automaton.ts - Core Automaton Engine"
level: foundational
type: documentation
tags: [advanced-automaton, core-engine, church-encoding, dimensional-progression, self-reference, jsonl-operations]
keywords: [advanced-automaton, core-engine, church-encoding-generation, dimensional-progression-0d-7d, self-reference-operations, jsonl-loading-saving, shacl-validation]
prerequisites: [multiverse-canvas-rfc2119-spec, meta-log-docs-readme]
enables: [continuous-automaton-docs, ollama-automaton-docs, bootstrap-automaton-docs]
related: [agents-multi-agent-system, r5rs-canvas-engine, metaverse-canvas-complete]
readingTime: 40
difficulty: 4
blackboard:
  status: active
  assignedAgent: "0D-Topology-Agent"
  lastUpdate: null
  dependencies: [r5rs-canvas-engine]
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

# advanced-automaton.ts - Core Automaton Engine

**Location**: `/home/main/automaton/advanced-automaton.ts`

## Overview

`advanced-automaton.ts` implements the core automaton engine (`AdvancedSelfReferencingAutomaton`) that provides the foundational functionality for all automaton executions. It handles JSONL file operations, dimensional progression, Church encoding generation, and self-referential operations.

## Purpose

Serves as the core engine that:
- Loads and saves JSONL automaton files
- Manages dimensional progression (0D-7D)
- Generates Church encoding patterns
- Implements self-referential operations
- Validates SHACL constraints
- Analyzes self-reference structures

## Key Features

- ✅ JSONL file loading and saving
- ✅ 8-dimensional Church encoding progression
- ✅ Dimension-specific code generation
- ✅ Self-reference pattern analysis
- ✅ SHACL validation
- ✅ Execution history tracking
- ✅ Multiple action types

## Architecture

### Class: `AdvancedSelfReferencingAutomaton`

**Constructor**:
```typescript
new AdvancedSelfReferencingAutomaton(filePath: string)
```

**Key Properties**:
- `filePath`: Path to JSONL automaton file
- `objects`: Array of canvas objects
- `currentDimension`: Current dimension (0-7)
- `executionHistory`: Array of executed actions
- `selfModificationCount`: Count of self-modifications

**Key Methods**:
- `load()`: Loads automaton from JSONL file
- `save()`: Saves current state to JSONL file
- `step(stepCount)`: Executes one step of evolution
- `run(steps)`: Runs automaton for specified steps
- `printState()`: Prints current state
- `analyzeSelfReference()`: Analyzes self-reference patterns
- `getCurrentAutomaton()`: Gets automaton for current dimension
- `executeEvolution()`: Progresses to next dimension
- `executeSelfReference()`: Creates self-referential object
- `executeSelfModification()`: Adds self-modifying object

## Dimensional Progression

### 0D: Quantum Vacuum Topology
- **Church Encoding**: `λf.λx.x` (identity)
- **Pattern**: Empty pattern `()`, point topology
- **Code**: Identity functions, vacuum fluctuations

### 1D: Temporal Topology
- **Church Encoding**: `λn.λf.λx.f(nfx)` (successor)
- **Pattern**: Line topology ℝ¹, time fiber
- **Code**: Successor functions, temporal evolution

### 2D: Bipartite Topology
- **Church Encoding**: `λx.λy.λf.fxy` (pair)
- **Pattern**: Bipartite structure, product topology
- **Code**: Pair constructors, structure operations

### 3D: Algebraic Topology
- **Church Encoding**: `λm.λn.λf.λx.mf(nfx)` (addition)
- **Pattern**: 3-manifold structure
- **Code**: Algebraic operations, Y-combinator

### 4D: Spacetime Topology
- **Church Encoding**: Network operations
- **Pattern**: Spacetime manifold, network topology
- **Code**: Network operations, file I/O, CI/CD

### 5D: Consensus Topology
- **Church Encoding**: Consensus operations
- **Pattern**: Blockchain consensus, immutable ledger
- **Code**: Consensus protocols, validation

### 6D: Intelligence Topology
- **Church Encoding**: AI operations
- **Pattern**: Neural networks, attention mechanisms
- **Code**: Neural network operations, learning

### 7D: Quantum Topology
- **Church Encoding**: Quantum operations
- **Pattern**: Quantum superposition, entanglement
- **Code**: Quantum gates, qubit operations

## Action Types

### `evolve`
Progresses to the next dimension and generates topology code:
- Cycles through dimensions: 0D → 1D → ... → 7D → 0D
- Generates dimension-specific Church encoding
- Creates evolved state object
- Updates current dimension

### `self-reference`
Creates a self-referential object:
- Generates Church encoding for current dimension
- Creates object pointing back to automaton file
- Adds to objects array
- Increments self-modification count

### `self-modify`
Adds a self-modifying object:
- Generates dimension-specific modification code
- Creates modification object
- Adds to objects array
- Increments self-modification count

### `self-io`
Reads/writes the automaton's own JSONL file:
- Reloads automaton from file
- Logs I/O operation

### `validate-self`
Validates SHACL constraints:
- Checks automaton objects for validity
- Validates dimensional levels (0-7)
- Validates self-reference structures
- Reports validation results

### `self-train`
Learns from execution history:
- Analyzes action frequencies
- Counts action occurrences
- Prints learned patterns

### `self-observe`
Observes current state:
- Prints current automaton state
- Collapses to 0D (quantum observation)
- Resets current dimension

### `compose`
Composes multiple automaton states:
- Finds multiple automata
- Composes them together
- Logs composition result

## Church Encoding Generation

### `generateChurchEncoding(dimension)`
Generates Church encoding code for each dimension:
- Returns code string and pattern name
- Includes Scheme/R5RS definitions
- Provides mathematical context
- Includes self-referential patterns

### `generateTopologyCode(dimension)`
Generates topology code for dimensional progression:
- Returns code string and pattern name
- Includes topological definitions
- Provides dimensional context
- Links to previous dimensions

### `generateModificationCode(dimension)`
Generates self-modification code for each dimension:
- Returns code string and pattern name
- Includes mutation operations
- Provides evolution patterns
- Dimension-specific modifications

## Condition Evaluation

### `evaluateCondition(condition, context)`
Evaluates transition conditions:
- `'true'`: Always true
- `'line_number < ∞'`: Always true
- `'file_exists'`: Checks if automaton file exists
- `'observation'`: Random observation (70% true)
- `'unifiable(a,b)'`: Random unification (70% true)
- `'numeric(m,n)'`: Random numeric check (60% true)
- `'majority_agree'`: Random consensus (50% true)
- `'gradient_descent'`: Random optimization (40% true)
- `'step_count > N'`: Checks step count in context

## Step Execution

### `step(stepCount)`
Executes one step of automaton evolution:
1. Gets current automaton for current dimension
2. Finds horizontal transitions from current automaton
3. Finds vertical transitions for dimensional progression
4. Prioritizes vertical transitions
5. Evaluates conditions
6. Executes first valid transition
7. Updates current dimension based on target

### `run(steps)`
Runs automaton for specified number of steps:
- Executes `step()` for each iteration
- Forces progression if stuck in self-reference loop
- Prints execution summary
- Saves modifications

## State Management

### Loading
- Reads JSONL file line by line
- Parses JSON objects
- Validates object structure
- Handles parse errors gracefully

### Saving
- Converts objects to JSONL format
- Writes to file
- Appends newline
- Logs save operation

## Analysis

### `analyzeSelfReference()`
Analyzes self-reference patterns:
- Finds self-reference objects
- Finds automaton objects
- Prints dimensional progression
- Shows self-reference links
- Displays dynamic self-references

### `printState()`
Prints current automaton state:
- File path
- Total objects count
- Current dimension
- Self-modification count
- Current automaton details
- Execution history (last 5 actions)

## Usage

### Direct Execution
```bash
npx tsx advanced-automaton.ts
```
Runs 20 steps and prints analysis.

### Programmatic Usage
```typescript
import { AdvancedSelfReferencingAutomaton } from './advanced-automaton';

const automaton = new AdvancedSelfReferencingAutomaton('./automaton.jsonl');
automaton.printState();
automaton.run(20);
automaton.analyzeSelfReference();
```

## Integration

Used by:
- **`continuous-automaton.ts`**: Built-in intelligence runner
- **`ollama-automaton.ts`**: Ollama AI runner
- **`bootstrap-automaton.ts`**: Bootstrap process
- **`complete-demo.ts`**: Complete demonstration

## File Format

### JSONL Structure
Each line is a JSON object:
```json
{"id": "0D-automaton", "type": "automaton", "dimensionalLevel": 0, "currentState": "identity", "selfReference": {"file": "automaton-kernel.jsonl", "line": 2, "pattern": "Church Boolean/Identity (0D)"}}
```

### Object Types
- **`automaton`**: Automaton state objects
- **`transition`**: State transitions
- **`vertical`**: Dimensional transitions
- **`text`**: Text/code objects
- **`file`**: Self-reference objects

## See Also

- **`docs/11-Automatons/README.md`**: Overview documentation
- **`docs/11-Automatons/CONTINUOUS-AUTOMATON.md`**: Built-in runner
- **`docs/11-Automatons/OLLAMA-AUTOMATON.md`**: Ollama runner
- **`docs/11-Automatons/BOOTSTRAP-AUTOMATON.md`**: Bootstrap process
