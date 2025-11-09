---
id: meta-log-plugin-obsidian-functions
title: "Obsidian Functions Integration"
level: practical
type: guide
tags: [meta-log-plugin, obsidian, functions, dataview, file-operations]
keywords: [obsidian-functions, dataview-integration, file-operations, date-time-functions, string-functions, array-functions]
prerequisites: [meta-log-plugin-readme, meta-log-plugin-views-guide]
enables: []
related: [obsidian-markdown-syntax, meta-log-plugin-api]
readingTime: 30
difficulty: 3
blackboard:
  status: active
  assignedAgent: null
  lastUpdate: 2025-11-08
  dependencies: [meta-log-db]
  watchers: []
---

# Obsidian Functions Integration

**Guide to using Obsidian's function system in Meta-Log views.**

## Overview

The Meta-Log plugin provides `ObsidianFunctions` class for accessing Obsidian's function system, including:

- **File Operations** - Read, write, list files
- **Date/Time Functions** - Format, parse dates
- **String Functions** - Join, split, replace
- **Array Functions** - Map, filter, reduce, sort
- **Math Functions** - Sum, average, min, max
- **Meta-Log Queries** - ProLog, DataLog, SPARQL

**Reference**: [Obsidian Functions Documentation](https://help.obsidian.md/bases/functions)

## ObsidianFunctions Class

### Basic Usage

```typescript
import { ObsidianFunctions } from 'meta-log-plugin';

const functions = new ObsidianFunctions(plugin);

// Use functions
const now = functions.now();
const formatted = functions.formatDate(now);
```

### In BaseMetaLogView

The `BaseMetaLogView` class provides helper methods:

```typescript
class MyView extends BaseMetaLogView {
  async onOpen(): Promise<void> {
    // Get functions interface
    const functions = this.getFunctions();
    
    // Use functions
    const now = functions.now();
    const files = await functions.listFiles('/');
  }
}
```

## File Operations

### Read File

```typescript
const content = await functions.readFile('path/to/file.md');
```

### Write File

```typescript
await functions.writeFile('path/to/file.md', 'Content here');
```

### List Files

```typescript
const files = await functions.listFiles('path/to/directory');
// Returns: ['file1.md', 'file2.md', ...]
```

## Date/Time Functions

### Get Current Date

```typescript
const now = functions.now();
// Returns: Date object
```

### Format Date

```typescript
const formatted = functions.formatDate(now, 'YYYY-MM-DD');
// Returns: '2025-11-08'
```

### Parse Date

```typescript
const date = functions.parseDate('2025-11-08');
// Returns: Date object
```

## String Functions

### Join Array

```typescript
const joined = functions.join(['a', 'b', 'c'], ', ');
// Returns: 'a, b, c'
```

### Split String

```typescript
const parts = functions.split('a,b,c', ',');
// Returns: ['a', 'b', 'c']
```

### Replace Text

```typescript
const replaced = functions.replace('hello world', 'world', 'universe');
// Returns: 'hello universe'
```

### Substring

```typescript
const sub = functions.substring('hello world', 0, 5);
// Returns: 'hello'
```

## Array Functions

### Map

```typescript
const mapped = functions.map([1, 2, 3], x => x * 2);
// Returns: [2, 4, 6]
```

### Filter

```typescript
const filtered = functions.filter([1, 2, 3], x => x > 1);
// Returns: [2, 3]
```

### Reduce

```typescript
const sum = functions.reduce([1, 2, 3], (acc, x) => acc + x, 0);
// Returns: 6
```

### Sort

```typescript
const sorted = functions.sort([3, 1, 2]);
// Returns: [1, 2, 3]
```

## Math Functions

### Sum

```typescript
const total = functions.sum([1, 2, 3, 4, 5]);
// Returns: 15
```

### Average

```typescript
const avg = functions.average([1, 2, 3, 4, 5]);
// Returns: 3
```

### Min/Max

```typescript
const min = functions.min([1, 2, 3, 4, 5]);
const max = functions.max([1, 2, 3, 4, 5]);
```

### Round

```typescript
const rounded = functions.round(3.14159, 2);
// Returns: 3.14
```

## Meta-Log Query Functions

### ProLog Query

```typescript
const results = await functions.queryMetaLog('(node ?Id ?Type)', 'prolog');
```

### DataLog Query

```typescript
const facts = await functions.queryMetaLog('(missing_implementation ?N)', 'datalog');
```

### SPARQL Query

```typescript
const triples = await functions.queryMetaLog(
  'SELECT ?id ?type WHERE { ?id rdf:type ?type }',
  'sparql'
);
```

### Extract Facts

```typescript
const facts = functions.extractFacts();
// Returns: [{predicate: 'node', args: [...]}, ...]
```

### Load Canvas

```typescript
await functions.loadCanvas('automaton-kernel.jsonl');
```

### Get Facts Count

```typescript
const count = functions.getFactsCount();
// Returns: number of facts
```

## Custom Functions

### Register Custom Function

```typescript
functions.registerFunction('myFunction', (arg1, arg2) => {
  return arg1 + arg2;
});
```

### Call Custom Function

```typescript
const result = functions.callFunction('myFunction', 1, 2);
// Returns: 3
```

## Usage Example

```typescript
class MyView extends BaseMetaLogView {
  async onOpen(): Promise<void> {
    const container = this.initializeContainer();
    const content = this.createContent(container);

    const functions = this.getFunctions();

    // Get current date
    const now = functions.now();
    const formatted = functions.formatDate(now, 'YYYY-MM-DD HH:mm:ss');

    // Query database
    const facts = functions.extractFacts();
    const count = facts.length;

    // Render with markdown
    const markdown = `
# My View

> [!info]
> Last updated: ${formatted}

## Statistics

- **Facts**: ${count}
- **Date**: ${formatted}

## Files

${(await functions.listFiles('/')).map(f => `- [[${f}]]`).join('\n')}
`;

    await this.renderMarkdown(markdown, content);
  }
}
```

## Integration with Views

### FunctionsView Example

See `src/views/functions-view.ts` for a complete example demonstrating:
- File operations
- Date/time formatting
- String manipulation
- Array operations
- Math functions
- Meta-Log queries

## Reference

- **Obsidian Functions Docs**: https://help.obsidian.md/bases/functions
- **ObsidianFunctions Class**: `plugin/meta-log-plugin/src/views/obsidian-functions.ts`
- **FunctionsView Example**: `plugin/meta-log-plugin/src/views/functions-view.ts`

---

**Last Updated**: 2025-11-08
