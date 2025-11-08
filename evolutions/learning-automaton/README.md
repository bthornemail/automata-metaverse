# Learning Automaton

Extends `MemoryOptimizedAutomaton` with learning capabilities to track execution patterns and adapt modification strategies.

## Overview

The Learning Automaton:
- Tracks execution patterns and frequencies
- Learns which modifications lead to better outcomes
- Adapts modification patterns based on history
- Stores learned patterns in `learned-patterns.jsonl`
- Uses learned patterns to guide future modifications

## Usage

### Basic Usage

```typescript
import { LearningAutomaton } from './evolutions/learning-automaton/learning-automaton';

const automaton = new LearningAutomaton('./automaton.jsonl', {
  enableLearning: true,
  patternFile: './learned-patterns.jsonl',
  minPatternConfidence: 0.5,
  adaptationRate: 0.3
});

// Execute actions (learning happens automatically)
for (let i = 0; i < 100; i++) {
  automaton.executeAction();
}

// Get learning statistics
const stats = automaton.getLearningStats();
console.log(`Success rate: ${stats.successRate}`);
console.log(`Total patterns: ${stats.totalPatterns}`);

// Save learned patterns
automaton.saveLearnedPatterns();
```

### Pattern Tracking

The `PatternTracker` tracks:
- **Modification Patterns**: Success/failure rates, memory usage, execution time
- **Execution Patterns**: Action sequences, outcomes, performance metrics
- **Learned Patterns**: High-confidence patterns with recommendations

### Learning Statistics

```typescript
const stats = automaton.getLearningStats();
// Returns:
// {
//   totalPatterns: number,
//   learnedPatterns: number,
//   successRate: number,
//   dimensionStats: Array<{
//     dimension: number,
//     successRate: number,
//     averageMemory: number,
//     averageTime: number,
//     totalExecutions: number
//   }>
// }
```

## Pattern Files

Learned patterns are stored in `learned-patterns.jsonl`:

```jsonl
{"type":"modification-pattern","id":"0D-add-abc123","dimension":0,"patternType":"add","successCount":10,"failureCount":2,...}
{"type":"learned-pattern","pattern":{...},"confidence":0.85,"usageCount":12,"lastSuccessRate":0.83,...}
{"type":"execution-pattern","id":"exec-123","dimension":0,"actionSequence":["add","modify"],"outcome":"success",...}
```

## Integration

- Extends `MemoryOptimizedAutomaton` for memory optimization
- Uses `PatternTracker` for pattern tracking
- Used by `generate-variant-automaton-files.ts` for variant-specific patterns
- Can be integrated with any automaton variant
