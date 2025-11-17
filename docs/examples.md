---
layout: default
title: Usage Examples
permalink: /automata-metaverse/examples/
---

# Usage Examples

Practical examples for using `automata-metaverse` with `meta-log-db` and `automaton-evolutions`.

## Basic Usage

### Create and Initialize Automaton

```typescript
import { AdvancedSelfReferencingAutomaton } from 'automata-metaverse';
import { MetaLogDb } from 'meta-log-db';
import { AUTOMATON_FILES } from 'automaton-evolutions';

const db = new MetaLogDb({
  enableProlog: true,
  enableDatalog: true
});

const automaton = new AdvancedSelfReferencingAutomaton(
  AUTOMATON_FILES.a0Unified,
  db
);

await automaton.init();
await automaton.executeSelfIO();
```

### Continuous Execution

```typescript
import { ContinuousAutomatonRunner } from 'automata-metaverse';

const runner = new ContinuousAutomatonRunner(
  './automaton.jsonl',
  false, // useOllama
  'llama3.2' // ollamaModel
);

await runner.startContinuous(2000, 100); // 2s interval, 100 iterations
```

## Memory Optimization

### Memory-Optimized Automaton

```typescript
import { MemoryOptimizedAutomaton } from 'automata-metaverse';

const automaton = new MemoryOptimizedAutomaton('./automaton.jsonl', {
  maxObjects: 2000,
  maxExecutionHistory: 500,
  gcInterval: 5000,
  trimInterval: 10000,
  memoryPressureThreshold: 200,
  enableGC: true
});

await automaton.init();
```

### Object Pool Usage

```typescript
import { ObjectPool } from 'automata-metaverse';

const pool = new ObjectPool(
  () => ({ id: '', type: '', data: {} }),
  (obj) => {
    obj.id = '';
    obj.type = '';
    obj.data = {};
  },
  100 // max pool size
);

// Acquire object
const obj = pool.acquire();
obj.id = 'test';
obj.type = 'node';

// Release when done
pool.release(obj);
```

## Vector Clock Systems

### Distributed Causality Tracking

```typescript
import { VectorClock } from 'automata-metaverse';

const clock1 = new VectorClock('node1');
const clock2 = new VectorClock('node2');

// Node 1 operations
clock1.tick();
clock1.update('node2', clock2.getClock('node2'));

// Node 2 operations
clock2.tick();
clock2.update('node1', clock1.getClock('node1'));

// Check causality
const happenedBefore = clock1.happenedBefore(clock2);
const concurrent = clock1.isConcurrent(clock2);
```

### Vector Clock Automaton

```typescript
import { VectorClockAutomaton } from 'automata-metaverse';

class MyAutomaton extends VectorClockAutomaton {
  constructor(id: string) {
    super(id, null);
  }

  async tick(): Promise<void> {
    this.tickClock();
    // Your automaton logic
  }
}
```

## Server-Side Usage

### Automaton Controller with Socket.IO

```typescript
import { AutomatonController } from 'automata-metaverse/server';
import { AdvancedSelfReferencingAutomaton } from 'automata-metaverse';
import { Server } from 'socket.io';
import { MetaLogDb } from 'meta-log-db';

const db = new MetaLogDb();
const automaton = new AdvancedSelfReferencingAutomaton('./automaton.jsonl', db);
await automaton.init();

const io = new Server(3000);
const controller = new AutomatonController({
  automaton,
  io
});

controller.start(2000, 100);

// Socket.IO clients receive events:
// - 'status': Automaton status updates
// - 'action': Action execution events
// - 'error': Error events
```

## Browser Usage

### Browser-Compatible Automaton

```typescript
import { AdvancedSelfReferencingAutomaton } from 'automata-metaverse/browser';
import { CanvasLMetaverseBrowser } from 'meta-log-db/browser';
import { AUTOMATON_FILES } from 'automaton-evolutions';

const browser = new CanvasLMetaverseBrowser({
  enableProlog: true,
  enableDatalog: true
});

await browser.init();

// Load canvas from package
const response = await fetch(`/node_modules/automaton-evolutions/files/${AUTOMATON_FILES.a0Unified}`);
const text = await response.text();
const canvas = await browser.parseJsonlCanvas(text);

const automaton = new AdvancedSelfReferencingAutomaton(
  AUTOMATON_FILES.a0Unified,
  browser
);

await automaton.init();
```

## Using with Canonical Files

### Load from automaton-evolutions

```typescript
import { AdvancedSelfReferencingAutomaton } from 'automata-metaverse';
import { MetaLogDb } from 'meta-log-db';
import { AUTOMATON_FILES, getAllAutomatonFiles } from 'automaton-evolutions';

const db = new MetaLogDb();

// Load unified automaton
const automaton = new AdvancedSelfReferencingAutomaton(
  AUTOMATON_FILES.a0Unified,
  db
);

// Or load all files
const files = getAllAutomatonFiles();
for (const file of files) {
  const automaton = new AdvancedSelfReferencingAutomaton(file, db);
  await automaton.init();
}
```

## Advanced Patterns

### Custom Automaton with Learning

```typescript
import { LearningAutomaton } from 'automata-metaverse';

const automaton = new LearningAutomaton('./automaton.jsonl', {
  enableLearning: true,
  minPatternConfidence: 0.5,
  adaptationRate: 0.3,
  trackMemory: true
});

await automaton.init();
await automaton.executeAction('evolve');
```

### Evolved Automaton with Dimension Progression

```typescript
import { EvolvedAutomaton } from 'automata-metaverse';

const automaton = new EvolvedAutomaton('./automaton.jsonl', {
  enableDimensionProgression: true,
  dimensionProgressionInterval: 5000,
  modificationInterval: 100,
  burstModifications: 3
});

await automaton.init();
```
