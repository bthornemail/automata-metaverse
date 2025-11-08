# Blackboard Architecture - Quick Start Guide

## What You Have Now

The blackboard architecture has been set up with:

1. **Core Types** (`src/blackboard/types.ts`) - TypeScript interfaces
2. **Blackboard Class** (`src/blackboard/Blackboard.ts`) - Data structure for shared state
3. **Base Agent** (`src/agents/BaseAgent.ts`) - Foundation for creating agents
4. **Canvas Sync Agent** (`src/agents/CanvasSyncAgent.ts`) - Syncs docs to canvas
5. **Prerequisite Validator** (`src/agents/PrerequisiteValidatorAgent.ts`) - Validates learning paths
6. **Blackboard Manager** (`src/blackboard/BlackboardManager.ts`) - Orchestration

## How to Integrate with Your Plugin

### Step 1: Update main.ts

Add these imports at the top of `main.ts`:

```typescript
import { BlackboardManager } from './src/blackboard/BlackboardManager';
```

### Step 2: Add BlackboardManager to Plugin Class

```typescript
export default class UniversalLifeProtocolPlugin extends Plugin {
  settings: UniversalLifeProtocolPluginSettings;
  blackboardManager: BlackboardManager;  // ADD THIS

  async onload() {
    await this.loadSettings();

    // Initialize Blackboard System
    this.blackboardManager = new BlackboardManager(this.app);

    // Start watching for changes
    await this.blackboardManager.watchForChanges();

    // Add commands...
    this.addBlackboardCommands();

    // Rest of your existing code...
    this.registerView(DASHBOARD_VIEW_TYPE, (leaf) => new DashboardView(leaf, this));
    // ... etc
  }

  private addBlackboardCommands() {
    // Command: Process all nodes
    this.addCommand({
      id: 'blackboard-process-all',
      name: 'Process All Nodes (Blackboard)',
      callback: async () => {
        new Notice('Starting blackboard processing...');
        try {
          await this.blackboardManager.processAll(
            (current, total, title) => {
              if (current % 10 === 0) {
                new Notice(`Processing ${current}/${total}: ${title}`);
              }
            }
          );
          new Notice('✓ Blackboard processing complete!');
        } catch (error) {
          new Notice('✗ Error processing blackboard: ' + error.message);
        }
      }
    });

    // Command: Process current document
    this.addCommand({
      id: 'blackboard-process-current',
      name: 'Process Current Document (Blackboard)',
      editorCallback: async (editor, view) => {
        const file = view.file;
        if (!file) return;

        const cache = this.app.metadataCache.getFileCache(file);
        const nodeId = cache?.frontmatter?.id;

        if (nodeId) {
          new Notice(`Processing ${file.basename}...`);
          try {
            await this.blackboardManager.processNode(nodeId);
            new Notice('✓ Processing complete!');
          } catch (error) {
            new Notice('✗ Error: ' + error.message);
          }
        } else {
          new Notice('This document does not have an epistemic node ID');
        }
      }
    });

    // Command: Process directory
    this.addCommand({
      id: 'blackboard-process-directory',
      name: 'Process Directory (Blackboard)',
      callback: async () => {
        const activeFile = this.app.workspace.getActiveFile();
        if (!activeFile) {
          new Notice('No active file');
          return;
        }

        const directory = activeFile.parent?.path || '';
        new Notice(`Processing directory: ${directory}`);

        try {
          await this.blackboardManager.processDirectory(directory);
          new Notice('✓ Directory processing complete!');
        } catch (error) {
          new Notice('✗ Error: ' + error.message);
        }
      }
    });

    // Command: Clear blackboard cache
    this.addCommand({
      id: 'blackboard-clear-cache',
      name: 'Clear Blackboard Cache',
      callback: () => {
        this.blackboardManager.clearCache();
        new Notice('Blackboard cache cleared');
      }
    });
  }
}
```

## Testing the System

### Test 1: Process a Single Document

1. Open any markdown document in your vault
2. Press `Ctrl/Cmd + P` to open command palette
3. Run: "Process Current Document (Blackboard)"
4. Check the document frontmatter - you should see `blackboard` metadata added

### Test 2: Sync to Canvas

1. Create a new canvas at `00-Canvas/Epistemic-Network.canvas`
2. Run: "Process All Nodes (Blackboard)"
3. Open the canvas - you should see nodes appear automatically

### Test 3: Validate Prerequisites

1. Create a document with prerequisites:

```yaml
---
id: test-advanced-concept
title: "Advanced Concept"
level: practical
type: concept
prerequisites: [test-basic-concept]
difficulty: 4
---
```

2. Run: "Process Current Document (Blackboard)"
3. Check frontmatter - if `test-basic-concept` doesn't exist, you'll see validation issues

## Creating Your Own Agent

Here's a template for creating a custom agent:

```typescript
// src/agents/MyCustomAgent.ts
import { BaseAgent } from './BaseAgent';
import { EpistemicNode, IBlackboard, AgentResult } from '../blackboard/types';

export class MyCustomAgent extends BaseAgent {
  constructor() {
    super("MyCustomAgent", 30); // Name and priority
  }

  // Determine if this agent should process the node
  canProcess(node: EpistemicNode): boolean {
    // Example: Only process foundational documents
    return node.frontmatter.level === 'foundational';
  }

  // Do the actual processing
  async process(node: EpistemicNode, blackboard: IBlackboard): Promise<AgentResult> {
    this.log(`Processing ${node.id}`);

    try {
      // Example: Add keywords based on content
      const content = await blackboard.getDocumentContent(node.id);
      const keywords = this.extractKeywords(content);

      // Update the node
      await blackboard.updateNode(node.id, {
        keywords: [...node.frontmatter.keywords, ...keywords],
        blackboard: {
          ...node.frontmatter.blackboard,
          lastUpdate: Date.now(),
          assignedAgent: this.name
        }
      });

      return { success: true, changes: { keywords } };
    } catch (error) {
      this.logError('Processing failed', error);
      return { success: false, issues: [error.message] };
    }
  }

  private extractKeywords(content: string): string[] {
    // Your keyword extraction logic
    return [];
  }
}
```

Then register it in `BlackboardManager.ts`:

```typescript
import { MyCustomAgent } from '../agents/MyCustomAgent';

private initializeDefaultAgents() {
  this.registerAgent(new CanvasSyncAgent());
  this.registerAgent(new PrerequisiteValidatorAgent());
  this.registerAgent(new MyCustomAgent()); // ADD THIS
}
```

## Agent Ideas

Here are some agents you could create:

1. **LearningPathAgent** - Suggests prerequisites based on content analysis
2. **RelatedContentAgent** - Finds related documents using keywords
3. **DifficultySuggestionAgent** - Estimates difficulty from content
4. **TaggingAgent** - Auto-generates tags from content
5. **LinkValidatorAgent** - Checks that all internal links work
6. **ReadingTimeAgent** - Estimates reading time from word count
7. **ImageExtractorAgent** - Extracts images and adds them to canvas
8. **SummaryAgent** - Generates summaries using LLM
9. **GraphAnalyzerAgent** - Analyzes the knowledge graph structure
10. **MetadataEnricherAgent** - Adds additional metadata from external sources

## Monitoring

Check the console (Ctrl/Cmd + Shift + I) to see:
- Which agents are registered
- What nodes are being processed
- Agent processing results
- Any errors or issues

## Next Steps

1. Build the plugin: `npm run build`
2. Reload Obsidian
3. Test the commands
4. Create your own custom agents
5. Watch as your vault becomes a living knowledge system!

## Troubleshooting

**Problem**: Commands don't appear
- Solution: Make sure you've added the `addBlackboardCommands()` method and called it in `onload()`

**Problem**: Agents aren't running
- Solution: Check console for errors, ensure agents are registered in `initializeDefaultAgents()`

**Problem**: Canvas nodes aren't appearing
- Solution: Make sure the canvas path exists, check `determineCanvasPath()` in `Blackboard.ts`

**Problem**: Frontmatter not updating
- Solution: Check that documents have valid YAML frontmatter with `id` field

## Resources

- Full guide: `BLACKBOARD_ARCHITECTURE_GUIDE.md`
- Type definitions: `src/blackboard/types.ts`
- Example agents: `src/agents/`

Happy building! 🚀
