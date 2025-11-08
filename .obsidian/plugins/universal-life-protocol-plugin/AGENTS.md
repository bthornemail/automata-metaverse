# Universal Life Protocol Plugin - Agent Instructions

## Project Overview

This is an Obsidian plugin implementing the Universal Life Protocol with a **Blackboard Architecture Pattern** for intelligent document management. The plugin:

- Monitors vault documents with structured frontmatter (Epistemic Nodes)
- Synchronizes documents to visual canvas representations
- Validates learning paths and prerequisites
- Enables extensible agent-based processing

## Architecture

```
Plugin (main.ts)
    ↓
BlackboardManager (orchestrates agents)
    ↓
Blackboard (shared state: documents + canvas)
    ↓
Agents (independent processors)
    • CanvasSyncAgent
    • PrerequisiteValidatorAgent
    • [Custom agents]
```

## Key Files

- `main.ts` - Plugin entry point, dashboard view, settings
- `src/blackboard/` - Core blackboard architecture
- `src/agents/` - Agent implementations
- `services/` - MCP servers and external integrations

## Development Environment Tips

### Essential Commands

```bash
# Install dependencies
npm install

# Build the plugin
npm run build

# Watch mode (auto-rebuild on changes)
npm run dev

# Type checking
npx tsc --noEmit

# Lint
npx eslint src/
```

### Project Structure

- Use TypeScript strict mode - all files must be properly typed
- Import from Obsidian API: `import { App, TFile, Notice } from 'obsidian'`
- Blackboard types are in `src/blackboard/types.ts`
- All agents extend `BaseAgent` from `src/agents/BaseAgent.ts`

### Testing in Obsidian

1. Build: `npm run build`
2. Copy `main.js`, `manifest.json`, `styles.css` to vault's `.obsidian/plugins/universal-life-protocol-plugin/`
3. Reload Obsidian: Ctrl+R (Windows/Linux) or Cmd+R (Mac)
4. Open Developer Console: Ctrl+Shift+I / Cmd+Opt+I
5. Check console for logs and errors

### Hot Reload Setup

For faster development:
1. Run `npm run dev` in terminal
2. Enable "Community plugins" in Obsidian
3. Changes auto-rebuild, then reload Obsidian

## Required Reading

**MUST READ** before working on this plugin:
1. `BLACKBOARD_ARCHITECTURE_GUIDE.md` - Core concepts and architecture
2. `QUICKSTART_BLACKBOARD.md` - Integration instructions
3. `EXAMPLE_WORKFLOW.md` - Real-world usage patterns

**For specific tasks:**
- Creating agents → Read `src/agents/BaseAgent.ts` and existing agent examples
- Working with documents → Read `src/blackboard/Blackboard.ts`
- Canvas integration → Read `src/agents/CanvasSyncAgent.ts`

## Code Style Guidelines

### TypeScript Style

```typescript
// ✅ Good - Explicit types, async/await, proper error handling
export class MyAgent extends BaseAgent {
  async process(node: EpistemicNode, blackboard: IBlackboard): Promise<AgentResult> {
    try {
      const result = await blackboard.getNode(node.id);
      return { success: true };
    } catch (error) {
      this.logError('Processing failed', error);
      return { success: false, issues: [error.message] };
    }
  }
}

// ❌ Bad - No types, no error handling
export class MyAgent {
  async process(node, blackboard) {
    const result = await blackboard.getNode(node.id);
    return { success: true };
  }
}
```

### Naming Conventions

- Classes: `PascalCase` (e.g., `CanvasSyncAgent`)
- Methods: `camelCase` (e.g., `processNode`)
- Constants: `UPPER_SNAKE_CASE` (e.g., `DEFAULT_SETTINGS`)
- Interfaces: `IPascalCase` or just `PascalCase` (e.g., `IBlackboardAgent`)
- Private methods: prefix with underscore if needed (e.g., `_internalHelper`)

### Agent Conventions

```typescript
// Agent structure
export class MyAgent extends BaseAgent {
  constructor() {
    super("MyAgent", priority); // Name matches class name, priority 0-100
  }

  canProcess(node: EpistemicNode): boolean {
    // Return true if this agent should process this node
  }

  async process(node: EpistemicNode, blackboard: IBlackboard): Promise<AgentResult> {
    this.log(`Processing ${node.id}`);
    // Do work
    return { success: true };
  }
}
```

### Logging

```typescript
// Use agent logging methods
this.log("Processing started");           // Info
this.logError("Failed to process", err);  // Error

// Or console for debugging
console.log("Debug info");
console.error("Error details");
```

## Testing Instructions

### Manual Testing

1. **Test Single Document**
   ```
   1. Open any .md file in vault
   2. Run command: "Process Current Document (Blackboard)"
   3. Check console for logs
   4. Verify frontmatter updated
   ```

2. **Test Canvas Sync**
   ```
   1. Ensure canvas exists: 00-Canvas/Epistemic-Network.canvas
   2. Run command: "Process All Nodes (Blackboard)"
   3. Open canvas
   4. Verify nodes appear with correct positions/colors
   ```

3. **Test Prerequisite Validation**
   ```
   1. Create doc with invalid prerequisites
   2. Process document
   3. Check for validationIssues in frontmatter
   4. Fix prerequisites
   5. Re-process
   6. Verify issues cleared
   ```

### Agent Testing

When creating a new agent:

```typescript
// 1. Register in BlackboardManager.ts
this.registerAgent(new MyAgent());

// 2. Create test document in vault
// 3. Add console.log in agent
// 4. Run "Process Current Document"
// 5. Check console output
// 6. Verify frontmatter changes
```

### Common Test Cases

- [ ] Plugin loads without errors
- [ ] Commands appear in palette
- [ ] Dashboard view opens
- [ ] File watcher triggers processing
- [ ] Agents process in priority order
- [ ] Canvas nodes created correctly
- [ ] Prerequisite validation works
- [ ] Error handling graceful
- [ ] Cache clears properly

## Working with Frontmatter

### Reading Frontmatter

```typescript
// Via Blackboard
const node = await blackboard.getNode(nodeId);
const level = node.frontmatter.level;

// Via Obsidian API
const cache = this.app.metadataCache.getFileCache(file);
const frontmatter = cache?.frontmatter;
```

### Updating Frontmatter

```typescript
// Always use Blackboard.updateNode()
await blackboard.updateNode(nodeId, {
  tags: [...node.frontmatter.tags, 'new-tag'],
  blackboard: {
    ...node.frontmatter.blackboard,
    lastUpdate: Date.now()
  }
});

// Never modify files directly - use Blackboard API
```

### Frontmatter Schema

```yaml
id: string              # Required, unique identifier
title: string           # Required, document title
level: string           # gateway | foundational | practical | applied
type: string            # navigation | concept | implementation | guide
tags: string[]          # Categorization
keywords: string[]      # Indexing
prerequisites: string[] # IDs of required docs
enables: string[]       # IDs of unlocked docs
related: string[]       # IDs of related docs
readingTime: number     # Minutes
difficulty: number      # 1-5
blackboard:             # Added by agents
  status: string        # active | processing | completed | needs-review
  assignedAgent: string # Last agent that processed
  lastUpdate: number    # Timestamp
  validationIssues: string[] # Validation errors
  canvasSynced: boolean # Canvas sync status
```

## Working with Canvas

### Canvas Structure

```json
{
  "nodes": [{
    "id": "node-id",
    "type": "file" | "text",
    "x": 100,
    "y": 100,
    "width": 400,
    "height": 300,
    "file": "path/to/file.md",
    "color": "#hex",
    "metadata": {
      "epistemicNodeId": "matches-frontmatter-id"
    }
  }],
  "edges": [{
    "fromNode": "id1",
    "toNode": "id2",
    "metadata": {
      "relationship": "prerequisite" | "enables" | "related"
    }
  }]
}
```

### Canvas Operations

```typescript
// Get canvas
const canvas = await blackboard.getCanvas("path/to/file.canvas");

// Find node
const node = await blackboard.findCanvasNode(epistemicNodeId);

// Create node
await blackboard.createCanvasNode({
  id: epistemicNodeId,
  type: "file",
  file: "path/to/doc.md",
  x: 100, y: 100,
  width: 400, height: 300
});

// Update node
await blackboard.updateCanvasNode(nodeId, {
  x: newX,
  y: newY,
  metadata: { updated: true }
});
```

## Common Patterns

### Safe Node Processing

```typescript
async process(node: EpistemicNode, blackboard: IBlackboard): Promise<AgentResult> {
  try {
    // 1. Validate inputs
    if (!node.frontmatter.id) {
      return { success: false, issues: ['Missing node ID'] };
    }

    // 2. Read data you need
    const content = await blackboard.getDocumentContent(node.id);

    // 3. Process
    const result = this.doProcessing(content);

    // 4. Update blackboard
    await blackboard.updateNode(node.id, {
      blackboard: {
        ...node.frontmatter.blackboard,
        lastUpdate: Date.now(),
        assignedAgent: this.name
      }
    });

    // 5. Return result
    return { success: true, data: result };
  } catch (error) {
    this.logError('Processing failed', error);
    return { success: false, issues: [error.message] };
  }
}
```

### Agent Priority System

- **0-10**: Critical system agents (infrastructure)
- **11-20**: High priority (sync, validation)
- **21-50**: Normal priority (enrichment, analysis)
- **51-100**: Low priority (optimization, cleanup)

Lower numbers run first. Set priority in constructor:
```typescript
constructor() {
  super("MyAgent", 25); // Normal priority
}
```

## Security Considerations

### File System Access

- Always use Obsidian's Vault API, never Node.js `fs` directly
- Validate all file paths before operations
- Handle permission errors gracefully

```typescript
// ✅ Good
const file = this.app.vault.getAbstractFileByPath(path);
if (file instanceof TFile) {
  const content = await this.app.vault.read(file);
}

// ❌ Bad
import fs from 'fs';
const content = fs.readFileSync(path);
```

### Input Validation

```typescript
// Always validate node IDs
if (!nodeId || typeof nodeId !== 'string') {
  throw new Error('Invalid node ID');
}

// Validate frontmatter structure
if (!node.frontmatter?.id) {
  return { success: false, issues: ['Invalid frontmatter'] };
}
```

### Error Handling

```typescript
// Never let errors crash the plugin
try {
  await riskyOperation();
} catch (error) {
  console.error('Operation failed:', error);
  new Notice('Operation failed. Check console for details.');
  return { success: false, issues: [error.message] };
}
```

## Performance Tips

### Caching

```typescript
// Blackboard has built-in caching
const node = await blackboard.getNode(id); // Cached after first load

// Clear cache when needed
blackboard.clearCache();
```

### Batch Processing

```typescript
// ✅ Good - Process in batches
const nodes = await blackboard.getAllNodes();
for (const node of nodes) {
  await this.processNode(node.id);
}

// ❌ Bad - Loading nodes repeatedly
for (const id of nodeIds) {
  const node = await blackboard.getNode(id); // Cached, but still overhead
}
```

### Debouncing

File watcher uses debouncing (1 second) to avoid excessive processing on rapid changes. This is already implemented in BlackboardManager.

## Common Issues

### Issue: "Node not found"
- Check that document has `id` in frontmatter
- Verify frontmatter is valid YAML
- Try clearing cache: `blackboard.clearCache()`

### Issue: "Canvas node not appearing"
- Check canvas path in `Blackboard.determineCanvasPath()`
- Verify canvas file exists
- Check console for errors

### Issue: "Agent not processing"
- Verify agent is registered in `BlackboardManager`
- Check `canProcess()` returns true for your test case
- Look for errors in console

### Issue: "Frontmatter not updating"
- Ensure using `blackboard.updateNode()` not direct file writes
- Check file is not read-only
- Verify YAML syntax is valid

## PR Instructions

### Before Submitting

1. **Build succeeds**: `npm run build`
2. **No TypeScript errors**: `npx tsc --noEmit`
3. **Tested manually** in Obsidian
4. **Console is clean** (no errors)
5. **Documentation updated** if adding features

### PR Format

```
Title: [Plugin] Add XYZ feature

Description:
- What: Brief description of changes
- Why: Reason for the change
- How: Technical approach
- Testing: How you tested it

Changes:
- [ ] Added XYZ agent
- [ ] Updated documentation
- [ ] Tested with sample documents
```

### Code Review Checklist

- [ ] Types are explicit (no `any`)
- [ ] Error handling present
- [ ] Logging added for debugging
- [ ] Follows existing patterns
- [ ] Documentation updated
- [ ] No console warnings/errors

## Additional Resources

- [Obsidian Plugin API](https://github.com/obsidianmd/obsidian-api)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- Project docs in this directory:
  - `BLACKBOARD_ARCHITECTURE_GUIDE.md`
  - `QUICKSTART_BLACKBOARD.md`
  - `EXAMPLE_WORKFLOW.md`
  - `IMPLEMENTATION_SUMMARY.md`

## Getting Help

1. Check documentation files (listed above)
2. Check console for error messages
3. Review existing agent implementations
4. Check Obsidian API documentation
5. Look at similar plugins for patterns

## Quick Reference

```bash
# Build plugin
npm run build

# Watch mode
npm run dev

# Check types
npx tsc --noEmit

# Test in Obsidian
1. Build
2. Copy files to vault plugins directory
3. Reload Obsidian (Ctrl/Cmd + R)
4. Check console (Ctrl/Cmd + Shift + I)
```

---

**Remember**: The blackboard architecture is designed to be extensible. When in doubt, create a new agent rather than modifying existing ones. Each agent should do one thing well.
