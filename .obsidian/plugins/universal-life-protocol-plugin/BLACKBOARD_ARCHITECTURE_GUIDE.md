# Blackboard Architecture Pattern - Implementation Guide

## Overview

This guide shows how to implement a Blackboard Architecture Pattern in the Universal Life Protocol Obsidian plugin using document frontmatter and canvas integration.

## What is Blackboard Architecture?

The Blackboard Architecture pattern is a problem-solving approach where:
1. **Blackboard**: A shared knowledge/data structure that all components can read/write
2. **Knowledge Sources**: Independent agents/modules that process information
3. **Control**: A coordinator that decides which knowledge sources should act

## Our Implementation

### 1. The Blackboard (Shared State)

The blackboard consists of two synchronized layers:

#### Layer 1: Document Frontmatter (Epistemic Nodes)
```yaml
---
id: unique-identifier
title: "Document Title"
level: gateway | foundational | practical | applied
type: navigation | concept | implementation | guide
tags: [categorization]
keywords: [indexing]
prerequisites: [node-ids-needed-first]
enables: [node-ids-this-unlocks]
related: [related-node-ids]
readingTime: 10
difficulty: 1-5
# Blackboard-specific metadata
blackboard:
  status: active | processing | completed
  assignedAgent: null | "agent-name"
  lastUpdate: timestamp
  dependencies: []
  watchers: []
---
```

#### Layer 2: Canvas Nodes
```json
{
  "nodes": [{
    "id": "node-id",
    "type": "text|file",
    "x": 100,
    "y": 100,
    "file": "path/to/document.md",
    "metadata": {
      "epistemicNodeId": "unique-identifier",
      "blackboardState": {
        "processed": false,
        "agentNotes": []
      }
    }
  }],
  "edges": [{
    "fromNode": "node1",
    "toNode": "node2",
    "metadata": {
      "relationship": "prerequisite|enables|related"
    }
  }]
}
```

### 2. Knowledge Sources (Agents)

Create specialized agents as plugin modules that read from and write to the blackboard.

#### Example Agent Structure

```typescript
// src/agents/BaseAgent.ts
export interface IBlackboardAgent {
  name: string;
  canProcess(node: EpistemicNode): boolean;
  process(node: EpistemicNode, blackboard: Blackboard): Promise<AgentResult>;
  priority: number;
}

export class BaseAgent implements IBlackboardAgent {
  constructor(
    public name: string,
    public priority: number = 0
  ) {}

  canProcess(node: EpistemicNode): boolean {
    return false; // Override in subclass
  }

  async process(node: EpistemicNode, blackboard: Blackboard): Promise<AgentResult> {
    throw new Error("Not implemented");
  }
}
```

#### Specific Agent Implementations

```typescript
// src/agents/LearningPathAgent.ts
export class LearningPathAgent extends BaseAgent {
  constructor() {
    super("LearningPathAgent", 1);
  }

  canProcess(node: EpistemicNode): boolean {
    // Process nodes that don't have learning paths defined
    return !node.frontmatter.prerequisites ||
           node.frontmatter.prerequisites.length === 0;
  }

  async process(node: EpistemicNode, blackboard: Blackboard): Promise<AgentResult> {
    // Analyze content and infer prerequisites
    const content = await blackboard.getDocumentContent(node.id);
    const inferredPrereqs = this.inferPrerequisites(content);

    // Update blackboard
    await blackboard.updateNode(node.id, {
      prerequisites: inferredPrereqs,
      blackboard: {
        lastUpdate: Date.now(),
        assignedAgent: this.name
      }
    });

    return {
      success: true,
      changes: inferredPrereqs
    };
  }

  private inferPrerequisites(content: string): string[] {
    // Implement inference logic
    return [];
  }
}
```

```typescript
// src/agents/CanvasSyncAgent.ts
export class CanvasSyncAgent extends BaseAgent {
  constructor() {
    super("CanvasSyncAgent", 2);
  }

  canProcess(node: EpistemicNode): boolean {
    // Process nodes that have been updated but not reflected in canvas
    return node.blackboard?.status === 'active' &&
           !node.blackboard?.canvasSynced;
  }

  async process(node: EpistemicNode, blackboard: Blackboard): Promise<AgentResult> {
    // Find or create canvas node
    const canvasNode = await blackboard.findCanvasNode(node.id);

    if (!canvasNode) {
      // Create new canvas node
      await blackboard.createCanvasNode({
        id: node.id,
        type: "file",
        file: node.path,
        x: this.calculatePosition(node),
        y: this.calculatePosition(node),
        metadata: {
          epistemicNodeId: node.id,
          level: node.frontmatter.level
        }
      });
    } else {
      // Update existing canvas node
      await blackboard.updateCanvasNode(canvasNode.id, {
        metadata: {
          ...canvasNode.metadata,
          lastSync: Date.now()
        }
      });
    }

    return { success: true };
  }

  private calculatePosition(node: EpistemicNode): number {
    // Use harmonic vector or other positioning logic
    return 0;
  }
}
```

```typescript
// src/agents/PrerequisiteValidatorAgent.ts
export class PrerequisiteValidatorAgent extends BaseAgent {
  constructor() {
    super("PrerequisiteValidatorAgent", 3);
  }

  canProcess(node: EpistemicNode): boolean {
    return node.frontmatter.prerequisites &&
           node.frontmatter.prerequisites.length > 0;
  }

  async process(node: EpistemicNode, blackboard: Blackboard): Promise<AgentResult> {
    const issues: string[] = [];

    for (const prereqId of node.frontmatter.prerequisites) {
      const prereqNode = await blackboard.getNode(prereqId);

      if (!prereqNode) {
        issues.push(`Missing prerequisite: ${prereqId}`);
      } else if (prereqNode.frontmatter.difficulty > node.frontmatter.difficulty) {
        issues.push(`Prerequisite ${prereqId} has higher difficulty`);
      }
    }

    if (issues.length > 0) {
      await blackboard.updateNode(node.id, {
        blackboard: {
          validationIssues: issues,
          status: 'needs-review'
        }
      });
    }

    return { success: issues.length === 0, issues };
  }
}
```

### 3. The Control Component (Blackboard Manager)

```typescript
// src/blackboard/BlackboardManager.ts
export class BlackboardManager {
  private agents: IBlackboardAgent[] = [];
  private blackboard: Blackboard;
  private processingQueue: EpistemicNode[] = [];

  constructor(private app: App, private plugin: UniversalLifeProtocolPlugin) {
    this.blackboard = new Blackboard(app, plugin);
    this.initializeAgents();
  }

  private initializeAgents() {
    // Register agents in priority order
    this.registerAgent(new LearningPathAgent());
    this.registerAgent(new CanvasSyncAgent());
    this.registerAgent(new PrerequisiteValidatorAgent());
    // Add more agents as needed
  }

  registerAgent(agent: IBlackboardAgent) {
    this.agents.push(agent);
    this.agents.sort((a, b) => a.priority - b.priority);
  }

  async processNode(nodeId: string) {
    const node = await this.blackboard.getNode(nodeId);
    if (!node) return;

    // Mark as processing
    await this.blackboard.updateNode(nodeId, {
      blackboard: { status: 'processing' }
    });

    // Find capable agents
    const capableAgents = this.agents.filter(agent => agent.canProcess(node));

    for (const agent of capableAgents) {
      try {
        const result = await agent.process(node, this.blackboard);
        console.log(`Agent ${agent.name} processed ${nodeId}:`, result);
      } catch (error) {
        console.error(`Agent ${agent.name} failed on ${nodeId}:`, error);
      }
    }

    // Mark as completed
    await this.blackboard.updateNode(nodeId, {
      blackboard: { status: 'completed' }
    });
  }

  async processAll() {
    const allNodes = await this.blackboard.getAllNodes();

    for (const node of allNodes) {
      await this.processNode(node.id);
    }
  }

  async watchForChanges() {
    // Set up file watcher for markdown files
    this.app.vault.on('modify', async (file) => {
      if (file instanceof TFile && file.extension === 'md') {
        const node = await this.blackboard.getNodeByPath(file.path);
        if (node) {
          await this.processNode(node.id);
        }
      }
    });
  }
}
```

### 4. The Blackboard Data Structure

```typescript
// src/blackboard/Blackboard.ts
export interface EpistemicNode {
  id: string;
  path: string;
  frontmatter: {
    title: string;
    level: string;
    type: string;
    tags: string[];
    keywords: string[];
    prerequisites: string[];
    enables: string[];
    related: string[];
    readingTime: number;
    difficulty: number;
    blackboard?: {
      status?: 'active' | 'processing' | 'completed' | 'needs-review';
      assignedAgent?: string;
      lastUpdate?: number;
      validationIssues?: string[];
      canvasSynced?: boolean;
    };
  };
}

export class Blackboard {
  private nodeCache: Map<string, EpistemicNode> = new Map();
  private canvasCache: Map<string, any> = new Map();

  constructor(private app: App, private plugin: UniversalLifeProtocolPlugin) {}

  async getNode(nodeId: string): Promise<EpistemicNode | null> {
    if (this.nodeCache.has(nodeId)) {
      return this.nodeCache.get(nodeId)!;
    }

    // Find file by node ID
    const file = this.findFileByNodeId(nodeId);
    if (!file) return null;

    const content = await this.app.vault.read(file);
    const frontmatter = this.parseFrontmatter(content);

    const node: EpistemicNode = {
      id: nodeId,
      path: file.path,
      frontmatter
    };

    this.nodeCache.set(nodeId, node);
    return node;
  }

  async getAllNodes(): Promise<EpistemicNode[]> {
    const files = this.app.vault.getMarkdownFiles();
    const nodes: EpistemicNode[] = [];

    for (const file of files) {
      const content = await this.app.vault.read(file);
      const frontmatter = this.parseFrontmatter(content);

      if (frontmatter.id) {
        nodes.push({
          id: frontmatter.id,
          path: file.path,
          frontmatter
        });
      }
    }

    return nodes;
  }

  async updateNode(nodeId: string, updates: Partial<EpistemicNode['frontmatter']>) {
    const file = this.findFileByNodeId(nodeId);
    if (!file) return;

    const content = await this.app.vault.read(file);
    const updatedContent = this.updateFrontmatter(content, updates);
    await this.app.vault.modify(file, updatedContent);

    // Clear cache
    this.nodeCache.delete(nodeId);
  }

  async getDocumentContent(nodeId: string): Promise<string> {
    const file = this.findFileByNodeId(nodeId);
    if (!file) return '';
    return await this.app.vault.read(file);
  }

  async findCanvasNode(nodeId: string): Promise<any> {
    // Search through canvas files for node
    const canvasFiles = this.app.vault.getFiles().filter(f => f.extension === 'canvas');

    for (const canvasFile of canvasFiles) {
      const content = await this.app.vault.read(canvasFile);
      const canvas = JSON.parse(content);

      const node = canvas.nodes?.find((n: any) =>
        n.metadata?.epistemicNodeId === nodeId
      );

      if (node) {
        return { ...node, canvasFile: canvasFile.path };
      }
    }

    return null;
  }

  async createCanvasNode(node: any) {
    // Find appropriate canvas or create new one
    const canvasPath = this.determineCanvasPath(node);
    const canvasFile = this.app.vault.getAbstractFileByPath(canvasPath);

    if (canvasFile instanceof TFile) {
      const content = await this.app.vault.read(canvasFile);
      const canvas = JSON.parse(content);
      canvas.nodes.push(node);
      await this.app.vault.modify(canvasFile, JSON.stringify(canvas, null, 2));
    }
  }

  async updateCanvasNode(nodeId: string, updates: any) {
    const canvasNode = await this.findCanvasNode(nodeId);
    if (!canvasNode) return;

    const canvasFile = this.app.vault.getAbstractFileByPath(canvasNode.canvasFile);
    if (!(canvasFile instanceof TFile)) return;

    const content = await this.app.vault.read(canvasFile);
    const canvas = JSON.parse(content);

    const index = canvas.nodes.findIndex((n: any) => n.id === canvasNode.id);
    if (index !== -1) {
      canvas.nodes[index] = { ...canvas.nodes[index], ...updates };
      await this.app.vault.modify(canvasFile, JSON.stringify(canvas, null, 2));
    }
  }

  private findFileByNodeId(nodeId: string): TFile | null {
    const files = this.app.vault.getMarkdownFiles();

    for (const file of files) {
      const cache = this.app.metadataCache.getFileCache(file);
      if (cache?.frontmatter?.id === nodeId) {
        return file;
      }
    }

    return null;
  }

  private parseFrontmatter(content: string): any {
    const match = content.match(/^---\n([\s\S]*?)\n---/);
    if (!match) return {};

    const yaml = match[1];
    // Simple YAML parsing (use a proper YAML parser in production)
    const frontmatter: any = {};

    yaml.split('\n').forEach(line => {
      const [key, ...valueParts] = line.split(':');
      if (key && valueParts.length > 0) {
        const value = valueParts.join(':').trim();
        try {
          frontmatter[key.trim()] = JSON.parse(value);
        } catch {
          frontmatter[key.trim()] = value.replace(/^["']|["']$/g, '');
        }
      }
    });

    return frontmatter;
  }

  private updateFrontmatter(content: string, updates: any): string {
    const match = content.match(/^---\n([\s\S]*?)\n---/);
    if (!match) return content;

    const yaml = match[1];
    const frontmatter = this.parseFrontmatter(content);
    const merged = { ...frontmatter, ...updates };

    // Convert back to YAML
    let newYaml = '';
    for (const [key, value] of Object.entries(merged)) {
      if (typeof value === 'object') {
        newYaml += `${key}: ${JSON.stringify(value)}\n`;
      } else {
        newYaml += `${key}: ${value}\n`;
      }
    }

    return content.replace(/^---\n[\s\S]*?\n---/, `---\n${newYaml}---`);
  }

  private determineCanvasPath(node: any): string {
    // Logic to determine which canvas this node belongs to
    // Based on level, type, or other metadata
    return '00-Canvas/Epistemic-Network.canvas';
  }
}
```

### 5. Integration with Main Plugin

```typescript
// In main.ts, add to UniversalLifeProtocolPlugin class

export default class UniversalLifeProtocolPlugin extends Plugin {
  settings: UniversalLifeProtocolPluginSettings;
  blackboardManager: BlackboardManager;

  async onload() {
    await this.loadSettings();

    // Initialize Blackboard System
    this.blackboardManager = new BlackboardManager(this.app, this);

    // Start watching for changes
    await this.blackboardManager.watchForChanges();

    // Add command to process all nodes
    this.addCommand({
      id: 'process-blackboard',
      name: 'Process Blackboard (Run All Agents)',
      callback: async () => {
        new Notice('Processing blackboard...');
        await this.blackboardManager.processAll();
        new Notice('Blackboard processing complete!');
      }
    });

    // Add command to process single node
    this.addCommand({
      id: 'process-current-node',
      name: 'Process Current Document',
      editorCallback: async (editor: Editor, view: MarkdownView) => {
        const file = view.file;
        if (!file) return;

        const cache = this.app.metadataCache.getFileCache(file);
        const nodeId = cache?.frontmatter?.id;

        if (nodeId) {
          new Notice(`Processing ${nodeId}...`);
          await this.blackboardManager.processNode(nodeId);
          new Notice('Processing complete!');
        }
      }
    });

    // Rest of your existing plugin code...
  }
}
```

## Usage Example

### 1. Create a New Document

```markdown
---
id: my-new-concept
title: "Understanding Vector Spaces"
level: foundational
type: concept
tags: [mathematics, vector-space]
keywords: [linear-algebra, basis, dimension]
prerequisites: []
enables: []
related: []
readingTime: 15
difficulty: 3
blackboard:
  status: active
  assignedAgent: null
  lastUpdate: null
---

# Understanding Vector Spaces

...content...
```

### 2. Run Blackboard Processing

Execute the command: "Process Blackboard (Run All Agents)"

### 3. Agents Will:
- **LearningPathAgent**: Analyze content and suggest prerequisites
- **CanvasSyncAgent**: Create or update canvas node
- **PrerequisiteValidatorAgent**: Validate learning path integrity

### 4. Result

The document frontmatter will be updated:

```yaml
prerequisites: [linear-algebra-basics, set-theory]
enables: [tensor-calculus, quantum-mechanics]
blackboard:
  status: completed
  assignedAgent: LearningPathAgent
  lastUpdate: 1735977600000
  canvasSynced: true
```

## Advanced Features

### Event-Driven Processing

```typescript
// Trigger processing on specific events
this.app.workspace.on('file-open', async (file) => {
  if (file instanceof TFile) {
    const cache = this.app.metadataCache.getFileCache(file);
    const nodeId = cache?.frontmatter?.id;
    if (nodeId) {
      await this.blackboardManager.processNode(nodeId);
    }
  }
});
```

### Agent Communication

```typescript
// Agents can communicate through the blackboard
export class RecommendationAgent extends BaseAgent {
  async process(node: EpistemicNode, blackboard: Blackboard): Promise<AgentResult> {
    // Read what other agents have written
    const validationIssues = node.frontmatter.blackboard?.validationIssues || [];

    if (validationIssues.length > 0) {
      // React to validation issues by suggesting fixes
      const recommendations = this.generateRecommendations(validationIssues);

      await blackboard.updateNode(node.id, {
        blackboard: {
          ...node.frontmatter.blackboard,
          recommendations
        }
      });
    }

    return { success: true };
  }
}
```

### Canvas Visualization

Create a canvas view that shows the blackboard state:

```typescript
export class BlackboardCanvasView extends ItemView {
  async onOpen() {
    // Render canvas showing all nodes and their states
    // Color code by blackboard status
    // Show agent assignments
    // Display validation issues
  }
}
```

## Benefits of This Architecture

1. **Decoupled Components**: Agents work independently
2. **Extensible**: Easy to add new agents
3. **Observable**: All state changes visible on blackboard
4. **Fault Tolerant**: Agent failures don't crash system
5. **Priority-Based**: Agents process in order of importance
6. **Event-Driven**: Responds to vault changes automatically

## Next Steps

1. Implement base agent framework
2. Create initial agents (learning path, validation, sync)
3. Build blackboard manager
4. Add canvas integration
5. Create visualization views
6. Add agent monitoring dashboard
