# Agent Development Guide

## Overview

This directory contains agent implementations for the Blackboard Architecture Pattern. Each agent is an independent processor that reads from and writes to the shared blackboard (documents + canvas).

## Agent Concept

An agent is a specialized module that:
1. **Decides** if it can process a node (`canProcess()`)
2. **Processes** the node with its specific logic (`process()`)
3. **Reports** results back to the control system
4. **Operates** independently of other agents

## Creating a New Agent

### Step 1: Create the File

```bash
# In this directory
touch MyNewAgent.ts
```

### Step 2: Implement BaseAgent

```typescript
import { BaseAgent } from './BaseAgent';
import { EpistemicNode, IBlackboard, AgentResult } from '../blackboard/types';

export class MyNewAgent extends BaseAgent {
  constructor() {
    // Agent name (must match class) and priority (0-100, lower = earlier)
    super("MyNewAgent", 30);
  }

  /**
   * Decide if this agent should process the given node
   * Return true only if this agent's specific conditions are met
   */
  canProcess(node: EpistemicNode): boolean {
    // Example: Only process foundational documents without tags
    return node.frontmatter.level === 'foundational' &&
           (!node.frontmatter.tags || node.frontmatter.tags.length === 0);
  }

  /**
   * Process the node - this is where your agent's logic goes
   * Always return an AgentResult with success status
   */
  async process(node: EpistemicNode, blackboard: IBlackboard): Promise<AgentResult> {
    this.log(`Processing node ${node.id}`);

    try {
      // 1. Read any data you need from the blackboard
      const content = await blackboard.getDocumentContent(node.id);

      // 2. Do your processing
      const tags = this.extractTags(content);

      // 3. Write results back to the blackboard
      await blackboard.updateNode(node.id, {
        tags,
        blackboard: {
          ...node.frontmatter.blackboard,
          lastUpdate: Date.now(),
          assignedAgent: this.name
        }
      });

      // 4. Return success
      return {
        success: true,
        data: { tags }
      };

    } catch (error) {
      // 5. Handle errors gracefully
      this.logError('Processing failed', error);
      return {
        success: false,
        issues: [error.message]
      };
    }
  }

  // Private helper methods
  private extractTags(content: string): string[] {
    // Your implementation
    return [];
  }
}
```

### Step 3: Register the Agent

Edit `../blackboard/BlackboardManager.ts`:

```typescript
import { MyNewAgent } from '../agents/MyNewAgent';

private initializeDefaultAgents() {
  this.registerAgent(new CanvasSyncAgent());
  this.registerAgent(new PrerequisiteValidatorAgent());
  this.registerAgent(new MyNewAgent()); // ADD THIS LINE
}
```

### Step 4: Test

```bash
# Build the plugin
npm run build

# Reload Obsidian
# Open console (Ctrl/Cmd + Shift + I)
# Run command: "Process Current Document (Blackboard)"
# Check console for your agent's logs
```

## Agent Priority System

Agents are processed in priority order (lowest number first):

- **0-10**: Infrastructure agents (critical operations)
  - Example: `CanvasSyncAgent` (10)

- **11-20**: Validation agents (check consistency)
  - Example: `PrerequisiteValidatorAgent` (20)

- **21-50**: Enrichment agents (add metadata)
  - Example: `TaggingAgent` (25), `LearningPathAgent` (30)

- **51-100**: Optimization agents (cleanup, stats)
  - Example: `OrphanFinderAgent` (60), `StatsCollectorAgent` (80)

Choose a priority that makes sense for when your agent should run relative to others.

## Agent Patterns

### Pattern 1: Content Analyzer

Analyzes document content and updates metadata.

```typescript
export class KeywordExtractorAgent extends BaseAgent {
  constructor() {
    super("KeywordExtractorAgent", 35);
  }

  canProcess(node: EpistemicNode): boolean {
    // Process nodes without keywords
    return !node.frontmatter.keywords ||
           node.frontmatter.keywords.length < 3;
  }

  async process(node: EpistemicNode, blackboard: IBlackboard): Promise<AgentResult> {
    const content = await blackboard.getDocumentContent(node.id);
    const keywords = this.extractKeywords(content);

    await blackboard.updateNode(node.id, {
      keywords: [...new Set([...node.frontmatter.keywords, ...keywords])]
    });

    return { success: true, data: { keywords } };
  }

  private extractKeywords(content: string): string[] {
    // NLP, word frequency, or other keyword extraction logic
    return [];
  }
}
```

### Pattern 2: Relationship Builder

Finds relationships between documents.

```typescript
export class RelatedContentAgent extends BaseAgent {
  constructor() {
    super("RelatedContentAgent", 40);
  }

  canProcess(node: EpistemicNode): boolean {
    // Always process to update relationships
    return true;
  }

  async process(node: EpistemicNode, blackboard: IBlackboard): Promise<AgentResult> {
    const allNodes = await blackboard.getAllNodes();
    const related: string[] = [];

    for (const other of allNodes) {
      if (other.id === node.id) continue;

      // Calculate similarity
      const similarity = this.calculateSimilarity(node, other);
      if (similarity > 0.7) {
        related.push(other.id);
      }
    }

    await blackboard.updateNode(node.id, { related });
    return { success: true, data: { related } };
  }

  private calculateSimilarity(node1: EpistemicNode, node2: EpistemicNode): number {
    // Cosine similarity on keywords, tags, etc.
    return 0;
  }
}
```

### Pattern 3: Validator

Checks for issues and reports problems.

```typescript
export class LinkValidatorAgent extends BaseAgent {
  constructor() {
    super("LinkValidatorAgent", 15);
  }

  canProcess(node: EpistemicNode): boolean {
    return true; // Validate all nodes
  }

  async process(node: EpistemicNode, blackboard: IBlackboard): Promise<AgentResult> {
    const content = await blackboard.getDocumentContent(node.id);
    const links = this.extractLinks(content);
    const issues: string[] = [];

    for (const link of links) {
      const targetNode = await blackboard.getNode(link);
      if (!targetNode) {
        issues.push(`Broken link: ${link}`);
      }
    }

    await blackboard.updateNode(node.id, {
      blackboard: {
        ...node.frontmatter.blackboard,
        validationIssues: issues.length > 0 ? issues : undefined,
        lastUpdate: Date.now(),
        assignedAgent: this.name
      }
    });

    return {
      success: issues.length === 0,
      issues
    };
  }

  private extractLinks(content: string): string[] {
    // Extract [[wikilinks]] or other link formats
    const regex = /\[\[([^\]]+)\]\]/g;
    const matches = content.matchAll(regex);
    return Array.from(matches, m => m[1]);
  }
}
```

### Pattern 4: Canvas Integration

Updates canvas based on document state.

```typescript
export class GraphLayoutAgent extends BaseAgent {
  constructor() {
    super("GraphLayoutAgent", 45);
  }

  canProcess(node: EpistemicNode): boolean {
    // Process nodes that have prerequisites (need graph layout)
    return node.frontmatter.prerequisites &&
           node.frontmatter.prerequisites.length > 0;
  }

  async process(node: EpistemicNode, blackboard: IBlackboard): Promise<AgentResult> {
    // Get prerequisite nodes
    const prereqNodes = await Promise.all(
      node.frontmatter.prerequisites.map(id => blackboard.getNode(id))
    );

    // Calculate optimal position based on prerequisites
    const position = this.calculatePosition(node, prereqNodes);

    // Update canvas node
    await blackboard.updateCanvasNode(node.id, {
      x: position.x,
      y: position.y
    });

    return { success: true };
  }

  private calculatePosition(
    node: EpistemicNode,
    prereqs: (EpistemicNode | null)[]
  ): { x: number, y: number } {
    // Graph layout algorithm (force-directed, hierarchical, etc.)
    return { x: 0, y: 0 };
  }
}
```

## Working with the Blackboard

### Reading Data

```typescript
// Get a node
const node = await blackboard.getNode(nodeId);

// Get node by path
const node = await blackboard.getNodeByPath('path/to/file.md');

// Get all nodes
const allNodes = await blackboard.getAllNodes();

// Get document content (without frontmatter)
const content = await blackboard.getDocumentContent(nodeId);

// Find canvas node
const canvasNode = await blackboard.findCanvasNode(nodeId);

// Get canvas
const canvas = await blackboard.getCanvas('path/to/canvas.canvas');
```

### Writing Data

```typescript
// Update node frontmatter
await blackboard.updateNode(nodeId, {
  tags: ['new', 'tags'],
  keywords: ['new', 'keywords'],
  blackboard: {
    lastUpdate: Date.now(),
    assignedAgent: this.name
  }
});

// Create canvas node
await blackboard.createCanvasNode({
  id: nodeId,
  type: 'file',
  file: 'path/to/file.md',
  x: 100,
  y: 100,
  width: 400,
  height: 300
});

// Update canvas node
await blackboard.updateCanvasNode(nodeId, {
  x: newX,
  y: newY,
  color: '#ff0000'
});
```

## Logging and Debugging

### Use Agent Logging Methods

```typescript
// Info logging
this.log('Processing started');
this.log(`Found ${count} items`);

// Error logging
this.logError('Failed to process', error);
```

### Console Output

When your agent runs, you'll see:
```
[MyAgent] Processing node inbox-01-example
[MyAgent] Found 5 keywords
[MyAgent] ✓ Processing complete
```

### Common Debugging

```typescript
// Log node details
this.log('Node:', JSON.stringify(node.frontmatter, null, 2));

// Log intermediate results
const result = await someOperation();
this.log('Operation result:', result);

// Check what's in the blackboard
const allNodes = await blackboard.getAllNodes();
this.log(`Total nodes: ${allNodes.length}`);
```

## Testing Your Agent

### Manual Testing

1. **Create test document** with specific conditions
   ```yaml
   ---
   id: test-node
   title: "Test Document"
   level: foundational
   type: concept
   ---
   ```

2. **Add console.log** in your agent's process method

3. **Build and reload**
   ```bash
   npm run build
   # Reload Obsidian
   ```

4. **Run processing**
   - Open test document
   - Run command: "Process Current Document (Blackboard)"
   - Check console for logs

5. **Verify results**
   - Check frontmatter was updated
   - Check canvas if applicable
   - Verify no errors in console

### Unit Testing (Advanced)

```typescript
// Create a test file: MyAgent.test.ts
import { MyAgent } from './MyAgent';
import { EpistemicNode, IBlackboard } from '../blackboard/types';

describe('MyAgent', () => {
  let agent: MyAgent;
  let mockBlackboard: IBlackboard;

  beforeEach(() => {
    agent = new MyAgent();
    mockBlackboard = createMockBlackboard();
  });

  test('canProcess returns true for valid nodes', () => {
    const node: EpistemicNode = {
      id: 'test',
      path: 'test.md',
      frontmatter: {
        level: 'foundational',
        // ... other required fields
      }
    };

    expect(agent.canProcess(node)).toBe(true);
  });

  test('process updates node correctly', async () => {
    const node = createTestNode();
    const result = await agent.process(node, mockBlackboard);

    expect(result.success).toBe(true);
    expect(mockBlackboard.updateNode).toHaveBeenCalled();
  });
});
```

## Agent Ideas

Here are some agent ideas to get you started:

### Content Enhancement
- **SummaryAgent** - Generate summaries using LLM
- **TaggingAgent** - Auto-suggest tags based on content
- **KeywordExtractorAgent** - Extract important keywords
- **ReadingTimeAgent** - Calculate reading time from word count
- **DifficultyEstimatorAgent** - Estimate difficulty from content

### Relationship Building
- **RelatedContentAgent** - Find related documents by similarity
- **LearningPathAgent** - Suggest prerequisites based on content
- **BacklinkAnalyzerAgent** - Analyze document connections
- **ClusteringAgent** - Group similar documents

### Validation
- **LinkValidatorAgent** - Check for broken links
- **CircularDependencyAgent** - Detect circular prerequisites
- **MetadataValidatorAgent** - Ensure frontmatter consistency
- **DuplicateDetectorAgent** - Find duplicate content

### Canvas Integration
- **GraphLayoutAgent** - Optimize node positions
- **EdgeCreatorAgent** - Create edges based on relationships
- **ColorCodingAgent** - Color nodes by category
- **ClusterVisualizerAgent** - Group related nodes visually

### Maintenance
- **OrphanFinderAgent** - Find unconnected documents
- **StatsCollectorAgent** - Gather vault statistics
- **CleanupAgent** - Remove obsolete metadata
- **ArchiveAgent** - Archive old documents

## Best Practices

### ✅ Do

- Keep agents focused on one task
- Use descriptive names
- Add comprehensive logging
- Handle errors gracefully
- Document your agent's purpose
- Test with edge cases
- Update blackboard metadata
- Return meaningful results

### ❌ Don't

- Process all nodes if not needed
- Modify files directly (use Blackboard API)
- Block on external API calls without timeout
- Throw uncaught errors
- Assume frontmatter structure
- Skip error handling
- Forget to log progress
- Return success when failing

## Performance Considerations

### Be Selective in canProcess()

```typescript
// ✅ Good - Specific condition
canProcess(node: EpistemicNode): boolean {
  return !node.frontmatter.tags || node.frontmatter.tags.length === 0;
}

// ❌ Bad - Always returns true (processes everything)
canProcess(node: EpistemicNode): boolean {
  return true;
}
```

### Batch Operations

```typescript
// ✅ Good - Batch load
const allNodes = await blackboard.getAllNodes();
for (const node of allNodes) {
  // Process
}

// ❌ Bad - Individual loads in loop
for (const id of nodeIds) {
  const node = await blackboard.getNode(id);
}
```

### Cache Appropriately

```typescript
// Blackboard caching is automatic
const node1 = await blackboard.getNode(id); // Load from file
const node2 = await blackboard.getNode(id); // Load from cache
```

## Common Patterns

### Safe Async Operations

```typescript
async process(node: EpistemicNode, blackboard: IBlackboard): Promise<AgentResult> {
  try {
    const data = await this.fetchExternalData(node);
    await blackboard.updateNode(node.id, { /* data */ });
    return { success: true };
  } catch (error) {
    this.logError('External fetch failed', error);
    return { success: false, issues: [error.message] };
  }
}
```

### Progressive Enhancement

```typescript
async process(node: EpistemicNode, blackboard: IBlackboard): Promise<AgentResult> {
  // Start with what we have
  const existing = node.frontmatter.keywords || [];

  // Add new keywords
  const newKeywords = this.extractKeywords(await blackboard.getDocumentContent(node.id));

  // Merge without duplicates
  const merged = [...new Set([...existing, ...newKeywords])];

  await blackboard.updateNode(node.id, { keywords: merged });
  return { success: true, data: { added: newKeywords.length } };
}
```

## Questions?

1. Check existing agents in this directory for examples
2. Read `../blackboard/types.ts` for interfaces
3. See `../blackboard/Blackboard.ts` for API details
4. Consult `BLACKBOARD_ARCHITECTURE_GUIDE.md` in root directory

## Quick Reference

```typescript
// Agent template
export class MyAgent extends BaseAgent {
  constructor() { super("MyAgent", 30); }
  canProcess(node: EpistemicNode): boolean { return true; }
  async process(node: EpistemicNode, blackboard: IBlackboard): Promise<AgentResult> {
    try {
      // Your logic here
      return { success: true };
    } catch (error) {
      return { success: false, issues: [error.message] };
    }
  }
}
```

Happy agent building! 🤖
