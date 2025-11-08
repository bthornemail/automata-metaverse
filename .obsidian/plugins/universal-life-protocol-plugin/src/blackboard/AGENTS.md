# Blackboard Core - Developer Guide

## Overview

This directory contains the core blackboard architecture implementation. The blackboard is a shared knowledge space that agents read from and write to.

## Files in This Directory

- `types.ts` - TypeScript type definitions and interfaces
- `Blackboard.ts` - Core data structure for managing documents and canvas
- `BlackboardManager.ts` - Control system that orchestrates agents

## Architecture

```
BlackboardManager (orchestrates)
    ↓
Blackboard (data access layer)
    ↓
    ├─ Documents (via Obsidian Vault API)
    └─ Canvas Files (JSON)
```

## Working with This Code

### Understanding types.ts

This file defines all the interfaces used throughout the blackboard system.

**Key Types:**

```typescript
// Represents a document with structured frontmatter
interface EpistemicNode {
  id: string;
  path: string;
  frontmatter: EpistemicNodeFrontmatter;
}

// The frontmatter schema
interface EpistemicNodeFrontmatter {
  id: string;
  title: string;
  level: 'gateway' | 'foundational' | 'practical' | 'applied';
  type: 'navigation' | 'concept' | 'implementation' | 'guide';
  // ... and more fields
}

// Represents a node on the canvas
interface CanvasNode {
  id: string;
  type: 'text' | 'file' | 'link';
  x: number;
  y: number;
  file?: string;
  metadata?: any;
}

// Canvas structure
interface Canvas {
  nodes: CanvasNode[];
  edges: CanvasEdge[];
  metadata?: any;
}
```

**When to Modify types.ts:**
- Adding new frontmatter fields
- Creating new canvas node types
- Extending agent capabilities
- Adding new result types

### Understanding Blackboard.ts

This is the data access layer. It provides methods to read and write both documents and canvas files.

**Key Methods:**

```typescript
class Blackboard implements IBlackboard {
  // Document operations
  async getNode(nodeId: string): Promise<EpistemicNode | null>
  async getNodeByPath(path: string): Promise<EpistemicNode | null>
  async getAllNodes(): Promise<EpistemicNode[]>
  async updateNode(nodeId: string, updates: Partial<EpistemicNodeFrontmatter>): Promise<void>
  async getDocumentContent(nodeId: string): Promise<string>

  // Canvas operations
  async findCanvasNode(nodeId: string): Promise<CanvasNode | null>
  async createCanvasNode(node: CanvasNode): Promise<void>
  async updateCanvasNode(nodeId: string, updates: Partial<CanvasNode>): Promise<void>
  async getCanvas(canvasPath: string): Promise<Canvas | null>
  async updateCanvas(canvasPath: string, canvas: Canvas): Promise<void>

  // Cache management
  clearCache(): void
}
```

**When to Modify Blackboard.ts:**
- Adding new data access methods
- Changing how frontmatter is parsed
- Modifying canvas path logic
- Improving caching strategy

### Understanding BlackboardManager.ts

This is the control layer. It coordinates agents and manages the processing lifecycle.

**Key Methods:**

```typescript
class BlackboardManager {
  // Agent management
  registerAgent(agent: IBlackboardAgent): void
  getAgents(): IBlackboardAgent[]

  // Processing
  async processNode(nodeId: string, force?: boolean): Promise<void>
  async processAll(progressCallback?: Function): Promise<void>
  async processDirectory(directoryPath: string): Promise<void>

  // Lifecycle
  async watchForChanges(): void
  clearCache(): void
}
```

**When to Modify BlackboardManager.ts:**
- Changing agent processing order
- Modifying file watching behavior
- Adding new processing modes
- Implementing new control strategies

## Common Modifications

### Adding a New Frontmatter Field

**Step 1:** Update types.ts
```typescript
interface EpistemicNodeFrontmatter {
  // ... existing fields
  myNewField?: string; // Add your field
}
```

**Step 2:** Agents can now read/write this field
```typescript
await blackboard.updateNode(nodeId, {
  myNewField: 'some value'
});
```

### Adding a New Canvas Metadata Field

**Step 1:** Update types.ts
```typescript
interface CanvasNode {
  // ... existing fields
  metadata?: {
    epistemicNodeId?: string;
    myNewMetadata?: string; // Add your field
  };
}
```

**Step 2:** Use in agents
```typescript
await blackboard.updateCanvasNode(nodeId, {
  metadata: {
    myNewMetadata: 'value'
  }
});
```

### Changing Canvas Positioning Logic

Modify `determineCanvasPath()` in Blackboard.ts:

```typescript
private determineCanvasPath(node: CanvasNode): string {
  // Current: All nodes go to one canvas
  return '00-Canvas/Epistemic-Network.canvas';

  // Custom: Route by metadata
  if (node.metadata?.level === 'foundational') {
    return '00-Canvas/Foundational.canvas';
  }
  return '00-Canvas/Other.canvas';
}
```

### Adding New Processing Modes

Add a method to BlackboardManager.ts:

```typescript
async processNodesByDifficulty(minDifficulty: number): Promise<void> {
  const allNodes = await this.blackboard.getAllNodes();
  const filtered = allNodes.filter(n => n.frontmatter.difficulty >= minDifficulty);

  for (const node of filtered) {
    await this.processNode(node.id);
  }
}
```

## Development Patterns

### Safe Frontmatter Updates

```typescript
// ✅ Good - Preserve existing blackboard metadata
await blackboard.updateNode(nodeId, {
  tags: newTags,
  blackboard: {
    ...node.frontmatter.blackboard, // Preserve existing
    lastUpdate: Date.now(),
    assignedAgent: this.name
  }
});

// ❌ Bad - Overwrites existing metadata
await blackboard.updateNode(nodeId, {
  tags: newTags,
  blackboard: {
    lastUpdate: Date.now()
    // Lost: status, canvasSynced, validationIssues, etc.
  }
});
```

### Error Handling

```typescript
// ✅ Good - Graceful degradation
try {
  const node = await blackboard.getNode(nodeId);
  if (!node) {
    console.warn(`Node ${nodeId} not found`);
    return;
  }
  // Process node
} catch (error) {
  console.error('Error:', error);
  // Don't crash - continue with other nodes
}

// ❌ Bad - Uncaught error crashes system
const node = await blackboard.getNode(nodeId);
// Will throw if node doesn't exist
```

### Efficient Batch Operations

```typescript
// ✅ Good - Single load, multiple operations
const allNodes = await blackboard.getAllNodes();
for (const node of allNodes) {
  await processNode(node);
}

// ❌ Bad - Multiple cache lookups
for (const id of nodeIds) {
  const node = await blackboard.getNode(id); // Cache hit, but overhead
  await processNode(node);
}
```

## Testing Changes

### Test Frontmatter Changes

```typescript
// 1. Create test document with specific frontmatter
// 2. Call blackboard.updateNode()
// 3. Read file manually to verify YAML
// 4. Call blackboard.getNode() to verify parsing
```

### Test Canvas Changes

```typescript
// 1. Create test canvas
const canvas: Canvas = {
  nodes: [],
  edges: []
};

// 2. Add node
await blackboard.createCanvasNode({
  id: 'test-node',
  type: 'file',
  file: 'test.md',
  x: 0, y: 0
});

// 3. Verify in canvas file
const updated = await blackboard.getCanvas('test.canvas');
console.log(updated.nodes); // Should have new node
```

### Test Manager Changes

```typescript
// 1. Register test agent
blackboardManager.registerAgent(new TestAgent());

// 2. Process
await blackboardManager.processNode('test-id');

// 3. Check results
const node = await blackboard.getNode('test-id');
console.log(node.frontmatter.blackboard);
```

## Performance Considerations

### Caching Strategy

The Blackboard implements a simple Map-based cache:

```typescript
private nodeCache: Map<string, EpistemicNode> = new Map();
private canvasCache: Map<string, Canvas> = new Map();
```

**Cache Behavior:**
- First `getNode()` reads from file → stores in cache
- Subsequent `getNode()` reads from cache
- `updateNode()` invalidates cache entry
- `clearCache()` clears all cached data

**When to Clear Cache:**
- After bulk updates
- After external file modifications
- When memory is constrained
- When you need fresh data

### Obsidian API Usage

Always use Obsidian's Vault API, never Node.js fs:

```typescript
// ✅ Good - Uses Obsidian API
const file = this.app.vault.getAbstractFileByPath(path);
if (file instanceof TFile) {
  const content = await this.app.vault.read(file);
}

// ❌ Bad - Direct file system access
import fs from 'fs';
const content = fs.readFileSync(path);
```

### YAML Parsing

Uses Obsidian's built-in YAML parser:

```typescript
import { parseYaml, stringifyYaml } from 'obsidian';

// Parse
const obj = parseYaml(yamlString);

// Stringify
const yaml = stringifyYaml(obj);
```

## Common Issues

### Issue: Node not found

**Symptom:** `getNode()` returns null

**Causes:**
1. Document doesn't have `id` in frontmatter
2. Frontmatter is malformed YAML
3. File doesn't exist

**Solution:**
```typescript
const node = await blackboard.getNode(id);
if (!node) {
  console.warn(`Node ${id} not found. Check frontmatter has 'id' field.`);
  return;
}
```

### Issue: Frontmatter not updating

**Symptom:** Changes don't persist to file

**Causes:**
1. File is read-only
2. YAML syntax error in update
3. Vault not saving properly

**Solution:**
```typescript
try {
  await blackboard.updateNode(id, updates);
  console.log('Update successful');
} catch (error) {
  console.error('Update failed:', error);
  // Check file permissions, YAML syntax
}
```

### Issue: Canvas nodes not appearing

**Symptom:** `createCanvasNode()` succeeds but node not in canvas

**Causes:**
1. Wrong canvas path
2. Canvas file doesn't exist
3. Invalid canvas node structure

**Solution:**
```typescript
// Verify canvas exists
const canvas = await blackboard.getCanvas(path);
if (!canvas) {
  console.error(`Canvas not found: ${path}`);
}

// Check node structure
console.log('Creating node:', JSON.stringify(node, null, 2));
await blackboard.createCanvasNode(node);
```

## Integration with Agents

Agents interact with the Blackboard through the IBlackboard interface:

```typescript
interface IBlackboard {
  getNode(nodeId: string): Promise<EpistemicNode | null>;
  updateNode(nodeId: string, updates: Partial<EpistemicNodeFrontmatter>): Promise<void>;
  // ... other methods
}
```

**Agent Usage:**
```typescript
async process(node: EpistemicNode, blackboard: IBlackboard): Promise<AgentResult> {
  // Read
  const content = await blackboard.getDocumentContent(node.id);

  // Process
  const result = doSomething(content);

  // Write
  await blackboard.updateNode(node.id, {
    someField: result
  });

  return { success: true };
}
```

## Debugging

### Enable Verbose Logging

Add console.log statements:

```typescript
// In Blackboard.ts
async getNode(nodeId: string): Promise<EpistemicNode | null> {
  console.log(`[Blackboard] Getting node: ${nodeId}`);

  if (this.nodeCache.has(nodeId)) {
    console.log(`[Blackboard] Cache hit: ${nodeId}`);
    return this.nodeCache.get(nodeId)!;
  }

  console.log(`[Blackboard] Cache miss, loading from file: ${nodeId}`);
  // ... rest of method
}
```

### Check Obsidian Metadata Cache

```typescript
// Obsidian maintains its own cache
const cache = this.app.metadataCache.getFileCache(file);
console.log('Obsidian cache:', cache?.frontmatter);

// Our cache
const node = await blackboard.getNode(id);
console.log('Blackboard cache:', node?.frontmatter);
```

### Inspect Canvas JSON

```typescript
const canvas = await blackboard.getCanvas(path);
console.log('Canvas structure:', JSON.stringify(canvas, null, 2));
```

## Best Practices

### ✅ Do

- Use TypeScript types strictly
- Handle null/undefined cases
- Clear cache when appropriate
- Log errors with context
- Test with edge cases
- Document complex logic

### ❌ Don't

- Skip type checking with `any`
- Assume files exist
- Modify cache directly
- Skip error handling
- Access file system directly
- Break interface contracts

## Testing Checklist

- [ ] Types compile without errors
- [ ] getNode() works for existing nodes
- [ ] getNode() returns null for missing nodes
- [ ] updateNode() persists to file
- [ ] updateNode() clears cache
- [ ] Canvas operations work correctly
- [ ] Error handling is graceful
- [ ] No memory leaks in cache

## Quick Reference

```typescript
// Get node
const node = await blackboard.getNode(id);

// Update node
await blackboard.updateNode(id, { tags: ['new'] });

// Get content
const content = await blackboard.getDocumentContent(id);

// Canvas operations
const canvasNode = await blackboard.findCanvasNode(id);
await blackboard.createCanvasNode({ /* node */ });
await blackboard.updateCanvasNode(id, { x: 100 });

// Cache
blackboard.clearCache();
```

## Additional Resources

- [Obsidian API Docs](https://github.com/obsidianmd/obsidian-api)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- Parent directory AGENTS.md for plugin-level instructions
- `../agents/AGENTS.md` for agent development guide

---

When in doubt, check existing code patterns and add comprehensive logging!
