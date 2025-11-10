---
id: agent-movement-interaction-guide
title: "Agent Movement and Interaction Guide"
level: advanced
type: guide
tags: [ai-portal, agent-movement, interaction-mechanics, canvasl-scripts, physics-engine]
keywords: [agent-movement, interaction-mechanics, physics-engine, collision-detection, movement-patterns, canvasl-scripts, r5rs-functions]
prerequisites: [ai-portal-collaborative-world-spec, canvasl-rfc2119-spec]
enables: []
related: [ai-portal-collaborative-world-spec, interaction-propagation-guide]
readingTime: 60
difficulty: 4
blackboard:
  status: active
  assignedAgent: "4D-Network-Agent"
  lastUpdate: "2025-01-07"
  dependencies: [ai-portal-collaborative-world-spec, canvasl-rfc2119-spec, r5rs-canvas-engine]
  watchers: ["4D-Network-Agent", "6D-Intelligence-Agent"]
  r5rsEngine: "r5rs-canvas-engine.scm"
---

# Agent Movement and Interaction Guide

**Status**: Active Development  
**Version**: 1.0  
**Date**: 2025-01-07  
**Assigned Agent**: 4D-Network-Agent

## Overview

This guide describes how to implement agent movement and interaction in the AI Portal Collaborative World Creation Environment using CanvasL scripts and R5RS functions.

## Agent Movement System

### Movement Controller

The Movement Controller handles agent movement using Church encoding for position calculations.

#### Forward Movement

```canvasl
{"id": "agent-move-forward", "type": "r5rs-call",
 "function": "r5rs:church-add",
 "args": ["agent-position", "forward-vector"],
 "description": "Move agent forward using Church addition"}
```

**Implementation**:
- Calculate forward vector from agent rotation
- Add forward vector to current position using `r5rs:church-add`
- Update agent position

#### Backward Movement

```canvasl
{"id": "agent-move-backward", "type": "r5rs-call",
 "function": "r5rs:church-add",
 "args": ["agent-position", "backward-vector"],
 "description": "Move agent backward using Church addition"}
```

**Implementation**:
- Calculate backward vector (negative forward vector)
- Add backward vector to current position using `r5rs:church-add`
- Update agent position

#### Rotation

```canvasl
{"id": "agent-rotate", "type": "r5rs-call",
 "function": "r5rs:church-mult",
 "args": ["agent-rotation", "rotation-angle"],
 "description": "Rotate agent using Church multiplication"}
```

**Implementation**:
- Calculate rotation angle (in radians)
- Multiply current rotation by rotation angle using `r5rs:church-mult`
- Update agent rotation

### Physics Engine

The Physics Engine handles velocity, acceleration, and position calculations.

#### Velocity Calculation

```canvasl
{"id": "calculate-velocity", "type": "r5rs-call",
 "function": "r5rs:church-add",
 "args": ["current-velocity", "acceleration"],
 "description": "Calculate new velocity from acceleration"}
```

**Implementation**:
- Get current velocity vector
- Get acceleration vector (from input or physics)
- Add acceleration to velocity using `r5rs:church-add`
- Apply damping/friction if needed
- Update agent velocity

#### Position Calculation

```canvasl
{"id": "calculate-position", "type": "r5rs-call",
 "function": "r5rs:church-add",
 "args": ["current-position", "velocity"],
 "description": "Calculate new position from velocity"}
```

**Implementation**:
- Get current position
- Get velocity vector
- Add velocity to position using `r5rs:church-add`
- Update agent position

### Collision Detector

The Collision Detector checks for collisions between agents and environment objects.

#### Collision Check

```canvasl
{"id": "check-collision", "type": "r5rs-call",
 "function": "r5rs:church-add",
 "args": ["agent-position", "object-position"],
 "description": "Check collision between agent and object"}
```

**Implementation**:
- Calculate distance between agent and object positions
- Check if distance is less than collision radius
- Return collision result

## Movement Patterns

### Random Movement

```canvasl
{"id": "movement-pattern-random", "type": "movement-pattern",
 "name": "Random Movement",
 "r5rs-expression": "(church-add (random-position) (random-velocity))",
 "description": "Random movement pattern using Church addition"}
```

**Usage**:
- Generate random position offset
- Generate random velocity
- Add together using Church addition
- Apply to agent movement

### Follow Pattern

```canvasl
{"id": "movement-pattern-follow", "type": "movement-pattern",
 "name": "Follow Pattern",
 "r5rs-expression": "(church-add agent-position (church-mult follow-direction follow-speed))",
 "description": "Follow another agent using Church operations"}
```

**Usage**:
- Calculate direction to target agent
- Multiply direction by follow speed using `r5rs:church-mult`
- Add to current position using `r5rs:church-add`
- Apply to agent movement

### Avoid Pattern

```canvasl
{"id": "movement-pattern-avoid", "type": "movement-pattern",
 "name": "Avoid Pattern",
 "r5rs-expression": "(church-add agent-position (church-mult avoid-direction avoid-speed))",
 "description": "Avoid obstacles using Church operations"}
```

**Usage**:
- Calculate direction away from obstacle
- Multiply direction by avoid speed using `r5rs:church-mult`
- Add to current position using `r5rs:church-add`
- Apply to agent movement

### Flocking Pattern

```canvasl
{"id": "movement-pattern-flock", "type": "movement-pattern",
 "name": "Flocking Pattern",
 "r5rs-expression": "(church-add agent-position (church-mult flock-center flock-cohesion))",
 "description": "Flocking behavior using Church operations"}
```

**Usage**:
- Calculate flock center (average position of nearby agents)
- Calculate cohesion vector toward flock center
- Multiply cohesion by flock strength using `r5rs:church-mult`
- Add to current position using `r5rs:church-add`
- Apply to agent movement

## Interaction Types

### Touch Interaction

```canvasl
{"id": "interaction-type-touch", "type": "interaction-type",
 "name": "Touch Interaction",
 "propagation-levels": ["personal", "peer"],
 "learning-weight": 0.1,
 "description": "Physical touch interaction"}
```

**Characteristics**:
- Personal and peer propagation
- Low learning weight (0.1)
- Physical contact required

### Communication Interaction

```canvasl
{"id": "interaction-type-communicate", "type": "interaction-type",
 "name": "Communication Interaction",
 "propagation-levels": ["peer", "local"],
 "learning-weight": 0.3,
 "description": "Communication interaction"}
```

**Characteristics**:
- Peer and local propagation
- Medium learning weight (0.3)
- No physical contact required

### Collaboration Interaction

```canvasl
{"id": "interaction-type-collaborate", "type": "interaction-type",
 "name": "Collaboration Interaction",
 "propagation-levels": ["local", "global"],
 "learning-weight": 0.5,
 "description": "Collaboration interaction"}
```

**Characteristics**:
- Local and global propagation
- High learning weight (0.5)
- Multiple agents involved

### Learning Interaction

```canvasl
{"id": "interaction-type-learn", "type": "interaction-type",
 "name": "Learning Interaction",
 "propagation-levels": ["agentic"],
 "learning-weight": 1.0,
 "description": "Learning interaction with full back propagation"}
```

**Characteristics**:
- Agentic propagation only
- Maximum learning weight (1.0)
- Full back propagation enabled

## CanvasL Script Integration

### Loading Movement Script

```typescript
import { parseCanvasL } from '@/services/canvasl-parser';

const script = await parseCanvasL('ai-portal-agent-movement.canvasl');
const movementSystem = script.systems.find(s => s.id === 'agent-movement-system');
const movementController = movementSystem.components.find(c => c.id === 'movement-controller');
```

### Executing Movement

```typescript
// Execute forward movement
const moveForward = script.r5rsCalls.find(c => c.id === 'agent-move-forward');
const newPosition = await executeR5RS(moveForward.function, [
  agent.position,
  calculateForwardVector(agent.rotation)
]);
agent.position = newPosition;
```

### Applying Movement Pattern

```typescript
// Apply random movement pattern
const randomPattern = script.movementPatterns.find(p => p.id === 'movement-pattern-random');
const movement = await evaluateR5RSExpression(randomPattern.r5rsExpression);
agent.position = applyMovement(agent.position, movement);
```

## Implementation Example

```typescript
class AgentMovementSystem {
  private agents: Map<string, Agent>;
  private physicsEngine: PhysicsEngine;
  private collisionDetector: CollisionDetector;
  private r5rsRegistry: R5RSRegistry;

  async moveAgent(agentId: string, direction: 'forward' | 'backward' | 'left' | 'right') {
    const agent = this.agents.get(agentId);
    if (!agent) return;

    // Calculate movement vector
    const movementVector = this.calculateMovementVector(agent, direction);

    // Check collision before moving
    const collision = await this.collisionDetector.check(
      agent.position,
      movementVector
    );

    if (collision) {
      // Handle collision
      return;
    }

    // Calculate new position using R5RS
    const newPosition = await this.r5rsRegistry.call('r5rs:church-add', [
      agent.position,
      movementVector
    ]);

    // Update agent position
    agent.position = newPosition;
  }

  async applyMovementPattern(agentId: string, patternId: string) {
    const agent = this.agents.get(agentId);
    const pattern = this.getMovementPattern(patternId);

    // Evaluate R5RS expression
    const movement = await this.r5rsRegistry.evaluate(pattern.r5rsExpression);

    // Apply movement
    agent.position = this.applyMovement(agent.position, movement);
  }
}
```

## Related Documentation

- **`AI-PORTAL-COLLABORATIVE-WORLD.md`**: Complete specification
- **`INTERACTION-PROPAGATION.md`**: Interaction propagation guide
- **`ai-portal-agent-movement.canvasl`**: CanvasL script

---

**Last Updated**: 2025-01-07  
**Version**: 1.0
