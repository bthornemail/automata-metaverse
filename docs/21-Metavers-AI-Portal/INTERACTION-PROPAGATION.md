---
id: interaction-propagation-guide
title: "Interaction Propagation System Guide"
level: advanced
type: guide
tags: [ai-portal, interaction-propagation, global-local-personal-peer-agentic, propagation-routing]
keywords: [interaction-propagation, global-propagation, local-propagation, personal-propagation, peer-propagation, agentic-propagation, propagation-routing, canvasl-scripts]
prerequisites: [ai-portal-collaborative-world-spec, agent-movement-interaction-guide]
enables: []
related: [ai-portal-collaborative-world-spec, agent-movement-interaction-guide, learning-backpropagation-guide]
readingTime: 60
difficulty: 4
blackboard:
  status: active
  assignedAgent: "5D-Consensus-Agent"
  lastUpdate: "2025-01-07"
  dependencies: [ai-portal-collaborative-world-spec, canvasl-rfc2119-spec, r5rs-canvas-engine]
  watchers: ["5D-Consensus-Agent", "6D-Intelligence-Agent"]
  r5rsEngine: "r5rs-canvas-engine.scm"
---

# Interaction Propagation System Guide

**Status**: Active Development  
**Version**: 1.0  
**Date**: 2025-01-07  
**Assigned Agent**: 5D-Consensus-Agent

## Overview

This guide describes the interaction propagation system that routes interactions across five levels: global, local, personal, peer, and agentic. The system uses CanvasL scripts and R5RS functions for propagation calculations.

## Propagation Levels

### Global Propagation

**Purpose**: System-wide interactions affecting all agents

**R5RS Function**: `r5rs:church-mult(interaction-event, global-multiplier)`

**CanvasL Definition**:
```canvasl
{"id": "propagate-global", "type": "r5rs-call",
 "function": "r5rs:church-mult",
 "args": ["interaction-event", "global-multiplier"],
 "description": "Propagate interaction to global level"}
```

**Characteristics**:
- Affects all agents in the world
- Highest priority propagation
- Used for world-wide events
- Multiplier typically: 1.0 (full strength)

**Use Cases**:
- World-wide announcements
- Global state changes
- System-wide events

### Local Propagation

**Purpose**: Regional interactions affecting nearby agents

**R5RS Function**: `r5rs:church-mult(interaction-event, local-multiplier)`

**CanvasL Definition**:
```canvasl
{"id": "propagate-local", "type": "r5rs-call",
 "function": "r5rs:church-mult",
 "args": ["interaction-event", "local-multiplier"],
 "description": "Propagate interaction to local level"}
```

**Characteristics**:
- Affects agents within a region (e.g., 50-unit radius)
- Medium priority propagation
- Used for regional events
- Multiplier typically: 0.5-0.8 (reduced strength)

**Use Cases**:
- Regional announcements
- Local state changes
- Area-specific events

### Personal Propagation

**Purpose**: Individual agent interactions

**R5RS Function**: `r5rs:church-add(interaction-event, personal-context)`

**CanvasL Definition**:
```canvasl
{"id": "propagate-personal", "type": "r5rs-call",
 "function": "r5rs:church-add",
 "args": ["interaction-event", "personal-context"],
 "description": "Propagate interaction to personal level"}
```

**Characteristics**:
- Affects single agent
- Low priority propagation
- Used for personal events
- Context adds personalization

**Use Cases**:
- Personal notifications
- Individual state changes
- Agent-specific events

### Peer Propagation

**Purpose**: Peer-to-peer interactions between agents

**R5RS Function**: `r5rs:church-add(interaction-event, peer-context)`

**CanvasL Definition**:
```canvasl
{"id": "propagate-peer", "type": "r5rs-call",
 "function": "r5rs:church-add",
 "args": ["interaction-event", "peer-context"],
 "description": "Propagate interaction to peer level"}
```

**Characteristics**:
- Affects two agents (sender and receiver)
- Medium priority propagation
- Used for direct agent interactions
- Context adds peer relationship information

**Use Cases**:
- Direct messages
- Peer-to-peer collaboration
- Agent-to-agent communication

### Agentic Propagation

**Purpose**: AI-powered interactions with learning capabilities

**R5RS Function**: `r5rs:church-exp(interaction-event, agentic-power)`

**CanvasL Definition**:
```canvasl
{"id": "propagate-agentic", "type": "r5rs-call",
 "function": "r5rs:church-exp",
 "args": ["interaction-event", "agentic-power"],
 "description": "Propagate interaction to agentic level using Church exponentiation"}
```

**Characteristics**:
- Affects agents with AI capabilities
- Highest learning weight
- Used for intelligent interactions
- Power determines learning intensity

**Use Cases**:
- AI-powered learning
- Intelligent agent interactions
- Machine learning training

## Propagation Router

The Propagation Router routes interactions to appropriate propagation levels based on interaction type and context.

### Routing Logic

```typescript
class PropagationRouter {
  route(interaction: InteractionEvent): PropagationLevel[] {
    const levels: PropagationLevel[] = [];

    // Check interaction type
    switch (interaction.type) {
      case 'touch':
        levels.push('personal', 'peer');
        break;
      case 'communicate':
        levels.push('peer', 'local');
        break;
      case 'collaborate':
        levels.push('local', 'global');
        break;
      case 'learn':
        levels.push('agentic');
        break;
    }

    return levels;
  }
}
```

### CanvasL Integration

```canvasl
{"id": "propagation-router", "type": "component",
 "name": "Propagation Router",
 "system": "interaction-propagation-system",
 "r5rs-functions": ["r5rs:church-add", "r5rs:church-mult"],
 "description": "Routes interactions to appropriate propagation levels"}
```

## Interaction Queue

The Interaction Queue manages interaction events for asynchronous processing.

### Queue Operations

```canvasl
{"id": "queue-interaction", "type": "r5rs-call",
 "function": "r5rs:church-add",
 "args": ["interaction-queue", "new-interaction"],
 "description": "Add interaction to queue"}
```

### Queue Characteristics

- **Asynchronous Processing**: Interactions processed in background
- **Priority-Based Ordering**: High-priority interactions processed first
- **Event Deduplication**: Duplicate interactions filtered
- **Rate Limiting**: Prevents queue overflow

## Propagation Flow

```
Interaction Event
        ↓
Interaction Type Detection
        ↓
Propagation Router
        ↓
Determine Propagation Levels
        ↓
Queue Interaction
        ↓
Process Each Level:
  ├─→ Global: r5rs:church-mult(event, global-multiplier)
  ├─→ Local: r5rs:church-mult(event, local-multiplier)
  ├─→ Personal: r5rs:church-add(event, personal-context)
  ├─→ Peer: r5rs:church-add(event, peer-context)
  └─→ Agentic: r5rs:church-exp(event, agentic-power)
        ↓
Apply to Affected Agents
        ↓
Trigger Learning (if agentic)
```

## Implementation Example

```typescript
class InteractionPropagationSystem {
  private router: PropagationRouter;
  private queue: InteractionQueue;
  private r5rsRegistry: R5RSRegistry;

  async propagate(interaction: InteractionEvent) {
    // Route interaction
    const levels = this.router.route(interaction);

    // Queue interaction
    await this.queue.enqueue(interaction);

    // Process each level
    for (const level of levels) {
      await this.processLevel(interaction, level);
    }
  }

  private async processLevel(interaction: InteractionEvent, level: PropagationLevel) {
    switch (level) {
      case 'global':
        const globalResult = await this.r5rsRegistry.call('r5rs:church-mult', [
          interaction,
          this.globalMultiplier
        ]);
        await this.applyToAllAgents(globalResult);
        break;

      case 'local':
        const localResult = await this.r5rsRegistry.call('r5rs:church-mult', [
          interaction,
          this.localMultiplier
        ]);
        await this.applyToLocalAgents(interaction.source, localResult);
        break;

      case 'personal':
        const personalResult = await this.r5rsRegistry.call('r5rs:church-add', [
          interaction,
          this.getPersonalContext(interaction.target)
        ]);
        await this.applyToAgent(interaction.target, personalResult);
        break;

      case 'peer':
        const peerResult = await this.r5rsRegistry.call('r5rs:church-add', [
          interaction,
          this.getPeerContext(interaction.source, interaction.target)
        ]);
        await this.applyToAgents([interaction.source, interaction.target], peerResult);
        break;

      case 'agentic':
        const agenticResult = await this.r5rsRegistry.call('r5rs:church-exp', [
          interaction,
          this.getAgenticPower(interaction.source)
        ]);
        await this.applyToAgenticAgents(agenticResult);
        await this.triggerLearning(agenticResult);
        break;
    }
  }
}
```

## CanvasL Script Usage

### Loading Propagation Script

```typescript
import { parseCanvasL } from '@/services/canvasl-parser';

const script = await parseCanvasL('ai-portal-agent-movement.canvasl');
const propagationSystem = script.systems.find(s => s.id === 'interaction-propagation-system');
const router = propagationSystem.components.find(c => c.id === 'propagation-router');
```

### Executing Propagation

```typescript
// Execute global propagation
const propagateGlobal = script.r5rsCalls.find(c => c.id === 'propagate-global');
const result = await executeR5RS(propagateGlobal.function, [
  interactionEvent,
  globalMultiplier
]);
```

## Related Documentation

- **`AI-PORTAL-COLLABORATIVE-WORLD.md`**: Complete specification
- **`AGENT-MOVEMENT-INTERACTION.md`**: Agent movement guide
- **`LEARNING-BACKPROPAGATION.md`**: Learning system guide
- **`ai-portal-agent-movement.canvasl`**: CanvasL script

---

**Last Updated**: 2025-01-07  
**Version**: 1.0
