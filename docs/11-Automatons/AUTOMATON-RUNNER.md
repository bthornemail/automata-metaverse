---
id: automaton-runner-docs
title: "automaton-runner.ts - Basic Automaton Runner"
level: practical
type: documentation
tags: [automaton-runner, basic-runner, simplified-execution, demonstration]
keywords: [automaton-runner, basic-runner, simplified-execution-model, demonstration-automaton]
prerequisites: [automatons-docs-readme]
enables: []
related: [advanced-automaton-docs, continuous-automaton-docs]
readingTime: 10
difficulty: 2
blackboard:
  status: active
  assignedAgent: null
  lastUpdate: null
  dependencies: [advanced-automaton-engine]
  watchers: []
---

# automaton-runner.ts - Basic Automaton Runner

**Location**: `/home/main/automaton/automaton-runner.ts`

## Overview

`automaton-runner.ts` implements a simplified automaton runner (`SelfReferencingAutomaton`) that provides basic execution capabilities for the Self-Referencing JSONL Automaton system. It's a simpler version of `advanced-automaton.ts` primarily used for basic demonstrations.

## Purpose

Provides a simplified execution model for:
- Basic automaton operations
- Simple self-reference operations
- Execution history tracking
- State analysis

## Key Features

- ✅ JSONL file loading and saving
- ✅ Basic step execution
- ✅ Self-reference operations
- ✅ Execution history tracking
- ✅ State printing and analysis

## Architecture

### Class: `SelfReferencingAutomaton`

**Constructor**:
```typescript
new SelfReferencingAutomaton(filePath: string)
```

**Key Properties**:
- `filePath`: Path to JSONL automaton file
- `objects`: Array of canvas objects
- `currentLine`: Current line index
- `executionHistory`: Array of executed actions

**Key Methods**:
- `load()`: Loads automaton from JSONL file
- `save()`: Saves current state to JSONL file
- `step()`: Executes one step
- `run(steps)`: Runs automaton for specified steps
- `printState()`: Prints current state
- `analyzeSelfReference()`: Analyzes self-reference patterns

## Action Types

### `self-reference`
Logs self-reference information from current automaton

### `evolve`
Progresses to next line in automaton file

### `self-modify`
Adds a new self-modification reference object

### `compose`
Composes multiple automaton states

### `self-io`
Reloads automaton from file

### `validate-self`
Validates automaton objects

### `self-train`
Learns from execution history

### `self-observe`
Observes current state and resets to line 0

## Usage

### Direct Execution
```bash
npx tsx automaton-runner.ts
```
Runs 15 steps and prints analysis.

### Programmatic Usage
```typescript
import { SelfReferencingAutomaton } from './automaton-runner';

const automaton = new SelfReferencingAutomaton('./automaton.jsonl');
automaton.printState();
automaton.run(15);
automaton.analyzeSelfReference();
```

## Differences from Advanced Automaton

| Feature | automaton-runner.ts | advanced-automaton.ts |
|---------|---------------------|----------------------|
| Dimensional progression | Line-based | Dimension-based (0D-7D) |
| Church encoding | Not included | Full Church encoding |
| Topology code | Not included | Dimension-specific topology |
| Modification code | Basic | Dimension-specific |
| Complexity | Simple | Advanced |

## See Also

- **`docs/11-Automatons/ADVANCED-AUTOMATON.md`**: Advanced version
- **`docs/11-Automatons/README.md`**: Overview documentation
