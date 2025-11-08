# Blackboard Architecture - Example Workflow

This document shows a complete example of how the blackboard architecture works in practice.

## Scenario: Adding a New Document to Your Vault

Let's walk through what happens when you create a new document about "Quantum Computing Basics".

### Step 1: Create the Document

You create a new file: `01 - Inbox/quantum-computing-basics.md`

```markdown
---
id: inbox-01-quantum-computing-basics
title: "Quantum Computing Basics"
level: foundational
type: concept
tags: [quantum, computing, physics]
keywords: [qubit, superposition, entanglement]
prerequisites: []
enables: []
related: []
readingTime: 20
difficulty: 4
---

# Quantum Computing Basics

Quantum computing harnesses the principles of quantum mechanics...

## Key Concepts

### Qubits
A qubit is the basic unit of quantum information...

### Superposition
Superposition allows a qubit to exist in multiple states...

### Entanglement
When qubits become entangled, measuring one affects the other...
```

### Step 2: Automatic Processing Begins

The moment you save the file, the file watcher triggers:

```
File Change Detected
    ↓
BlackboardManager.watchForChanges() notices the change
    ↓
Schedules processing after 1 second (debounce)
    ↓
BlackboardManager.processNode("inbox-01-quantum-computing-basics")
```

### Step 3: Agent Processing

The BlackboardManager checks all registered agents:

#### Agent 1: CanvasSyncAgent (Priority 10)

**Can Process?**
```typescript
canProcess(node) {
  // This agent processes nodes that aren't synced
  return !node.frontmatter.blackboard?.canvasSynced;
}
// Result: TRUE ✓
```

**Processing:**
```typescript
async process(node, blackboard) {
  // 1. Calculate position based on level and difficulty
  const position = {
    x: levelIndex * 500,  // foundational = 1, so x = 500
    y: difficulty * 400    // difficulty = 4, so y = 1600
  };

  // 2. Determine color based on level
  const color = "#45b7d1"; // foundational

  // 3. Create canvas node
  const canvasNode = {
    id: "inbox-01-quantum-computing-basics",
    type: "file",
    file: "01 - Inbox/quantum-computing-basics.md",
    x: 550, // 500 + 50 (jitter)
    y: 1650, // 1600 + 50 (jitter)
    width: 400,
    height: 300,
    color: "#45b7d1",
    metadata: {
      epistemicNodeId: "inbox-01-quantum-computing-basics",
      level: "foundational",
      difficulty: 4,
      blackboardState: {
        processed: false,
        agentNotes: []
      }
    }
  };

  // 4. Add to canvas
  await blackboard.createCanvasNode(canvasNode);

  // 5. Update document frontmatter
  await blackboard.updateNode(node.id, {
    blackboard: {
      canvasSynced: true,
      lastUpdate: Date.now(),
      assignedAgent: "CanvasSyncAgent"
    }
  });

  return { success: true, data: { action: 'created' } };
}
```

**Result:** Canvas node created at `00-Canvas/Epistemic-Network.canvas`

#### Agent 2: PrerequisiteValidatorAgent (Priority 20)

**Can Process?**
```typescript
canProcess(node) {
  // This agent only processes nodes with prerequisites
  return node.frontmatter.prerequisites &&
         node.frontmatter.prerequisites.length > 0;
}
// Result: FALSE ✗ (no prerequisites defined yet)
```

**Skipped** - This document has no prerequisites to validate.

### Step 4: Document Updated

Your document now has updated frontmatter:

```yaml
---
id: inbox-01-quantum-computing-basics
title: "Quantum Computing Basics"
level: foundational
type: concept
tags: [quantum, computing, physics]
keywords: [qubit, superposition, entanglement]
prerequisites: []
enables: []
related: []
readingTime: 20
difficulty: 4
blackboard:
  status: completed
  canvasSynced: true
  lastUpdate: 1735977600000
  assignedAgent: CanvasSyncAgent
---
```

### Step 5: You Add Prerequisites

Later, you realize this topic needs prerequisites. You edit the document:

```yaml
prerequisites: [inbox-01-linear-algebra, inbox-01-complex-numbers]
```

### Step 6: Automatic Re-Processing

File watcher triggers again:

```
File Modified
    ↓
BlackboardManager.processNode() called
    ↓
Status changed to "processing"
```

#### Agent 1: CanvasSyncAgent

**Can Process?** FALSE (already synced)

#### Agent 2: PrerequisiteValidatorAgent

**Can Process?** TRUE ✓ (now has prerequisites)

**Processing:**
```typescript
async process(node, blackboard) {
  const issues = [];

  // Check prerequisite: inbox-01-linear-algebra
  const prereq1 = await blackboard.getNode("inbox-01-linear-algebra");
  if (!prereq1) {
    issues.push("Missing prerequisite: inbox-01-linear-algebra");
  }

  // Check prerequisite: inbox-01-complex-numbers
  const prereq2 = await blackboard.getNode("inbox-01-complex-numbers");
  if (!prereq2) {
    issues.push("Missing prerequisite: inbox-01-complex-numbers");
  }

  // Update with validation issues
  await blackboard.updateNode(node.id, {
    blackboard: {
      ...node.frontmatter.blackboard,
      validationIssues: issues,
      status: 'needs-review',
      assignedAgent: "PrerequisiteValidatorAgent"
    }
  });

  return { success: false, issues };
}
```

### Step 7: Document Shows Validation Issues

```yaml
blackboard:
  status: needs-review
  canvasSynced: true
  lastUpdate: 1735978200000
  assignedAgent: PrerequisiteValidatorAgent
  validationIssues:
    - "Missing prerequisite: inbox-01-linear-algebra"
    - "Missing prerequisite: inbox-01-complex-numbers"
```

### Step 8: You Create Missing Prerequisites

You create `linear-algebra.md` and `complex-numbers.md` with proper frontmatter.

### Step 9: Re-run Validation

You run the command: "Process Current Document (Blackboard)"

```
PrerequisiteValidatorAgent runs again
    ↓
Both prerequisites now exist
    ↓
No validation issues
    ↓
Status updated to "completed"
```

### Step 10: Final State

```yaml
---
id: inbox-01-quantum-computing-basics
title: "Quantum Computing Basics"
level: foundational
type: concept
tags: [quantum, computing, physics]
keywords: [qubit, superposition, entanglement]
prerequisites: [inbox-01-linear-algebra, inbox-01-complex-numbers]
enables: []
related: []
readingTime: 20
difficulty: 4
blackboard:
  status: completed
  canvasSynced: true
  lastUpdate: 1735978800000
  assignedAgent: PrerequisiteValidatorAgent
  validationIssues: []
---
```

## Viewing the Results

### In the Canvas

Open `00-Canvas/Epistemic-Network.canvas`:

```
[Linear Algebra]  [Complex Numbers]
     ↓                    ↓
     └──────[Quantum Computing Basics]──────┐
                                            ↓
                                    [Quantum Algorithms]
                                    (if you add it later)
```

Nodes are:
- **Positioned** by level (x-axis) and difficulty (y-axis)
- **Colored** by level (foundational = blue)
- **Connected** by prerequisite relationships
- **Linked** to the actual markdown files

### In the Dashboard

If you add a blackboard status view to your dashboard, you'd see:

```
📊 Blackboard Status

✓ Completed: 3 documents
⚠ Needs Review: 0 documents
⚙ Processing: 0 documents

Recent Activity:
- CanvasSyncAgent processed "Quantum Computing Basics" (2 min ago)
- PrerequisiteValidatorAgent validated "Quantum Computing Basics" (1 min ago)
- No validation issues found
```

## Advanced Example: Custom Agent

Let's add a custom agent that suggests related documents based on keywords.

### Create RelatedContentAgent

```typescript
// src/agents/RelatedContentAgent.ts
export class RelatedContentAgent extends BaseAgent {
  constructor() {
    super("RelatedContentAgent", 30);
  }

  canProcess(node: EpistemicNode): boolean {
    // Process nodes that don't have related content set
    return !node.frontmatter.related ||
           node.frontmatter.related.length === 0;
  }

  async process(node: EpistemicNode, blackboard: IBlackboard): Promise<AgentResult> {
    const allNodes = await blackboard.getAllNodes();
    const related: string[] = [];

    // Find documents with overlapping keywords
    for (const other of allNodes) {
      if (other.id === node.id) continue;

      const overlap = this.countKeywordOverlap(
        node.frontmatter.keywords,
        other.frontmatter.keywords
      );

      // If 2+ keywords overlap, consider it related
      if (overlap >= 2) {
        related.push(other.id);
      }
    }

    // Update the node
    await blackboard.updateNode(node.id, {
      related,
      blackboard: {
        ...node.frontmatter.blackboard,
        lastUpdate: Date.now(),
        assignedAgent: this.name
      }
    });

    return { success: true, changes: { related } };
  }

  private countKeywordOverlap(keywords1: string[], keywords2: string[]): number {
    const set1 = new Set(keywords1.map(k => k.toLowerCase()));
    const set2 = new Set(keywords2.map(k => k.toLowerCase()));
    let count = 0;

    for (const keyword of set1) {
      if (set2.has(keyword)) count++;
    }

    return count;
  }
}
```

### Register the Agent

In `BlackboardManager.ts`:

```typescript
import { RelatedContentAgent } from '../agents/RelatedContentAgent';

private initializeDefaultAgents() {
  this.registerAgent(new CanvasSyncAgent());
  this.registerAgent(new PrerequisiteValidatorAgent());
  this.registerAgent(new RelatedContentAgent()); // ADD THIS
}
```

### Result

When you run "Process All Nodes", the RelatedContentAgent will:

1. Find `quantum-computing-basics.md` (keywords: qubit, superposition, entanglement)
2. Find `quantum-algorithms.md` (keywords: qubit, algorithm, entanglement)
3. Notice 2 overlapping keywords (qubit, entanglement)
4. Add `quantum-algorithms` to the `related` field
5. Update the frontmatter

Now your documents are automatically connected!

## Real-World Workflow

### Morning: Create Content

1. Write 5 new documents
2. Add basic frontmatter (id, title, level, type)
3. Save files

### Automatic: Background Processing

While you work:
- CanvasSyncAgent adds them to canvas
- RelatedContentAgent finds connections
- ValidationAgent checks for issues

### Afternoon: Review and Refine

1. Open the canvas view
2. See all your new documents positioned automatically
3. Notice suggested relationships
4. Review validation warnings
5. Add missing prerequisites
6. Re-run processing

### Result

Your vault is now:
- ✓ Visually organized
- ✓ Automatically connected
- ✓ Quality validated
- ✓ Ready for readers

## Benefits in Practice

### For Content Creation
- Write naturally, metadata is enriched automatically
- Visual feedback through canvas
- Quality checks catch mistakes early

### For Content Discovery
- Related content suggestions
- Visual knowledge graph
- Clear learning paths

### For Maintenance
- Automatic validation
- Broken link detection
- Consistency checking

## Next Steps

1. **Integrate** the system (see QUICKSTART_BLACKBOARD.md)
2. **Test** with a few documents
3. **Create** custom agents for your needs
4. **Visualize** your knowledge graph
5. **Iterate** and improve

The blackboard architecture grows with your vault!
