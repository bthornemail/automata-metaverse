---
id: automaton-user-interactions-agent-api-plan
title: "Agent API Connection Plan"
level: practical
type: implementation-plan
tags: [automaton-user-interactions, agent-api, integration, multi-agent-system]
keywords: [agent-api, agent-connection, multi-agent-system, agent-routing, agent-coordination]
prerequisites: [automaton-user-interactions-next-steps-complete]
enables: [agent-api-integration, real-agent-responses]
related: [automaton-user-interactions-next-steps-complete, agents-md]
readingTime: 25
difficulty: 4
blackboard:
  status: planned
  assignedAgent: "4D-Network-Agent"
  lastUpdate: 2025-11-09
  dependencies: [agents-md, multi-agent-system]
  watchers: ["6D-Intelligence-Agent", "5D-Consensus-Agent"]
---

# Agent API Connection Plan

**Status**: 📋 Planned  
**Last Updated**: 2025-11-09

## Overview

This document outlines the plan for connecting the Automaton User Interactions system to the real multi-agent system defined in `AGENTS.md`. Currently, agent responses are simulated using `KnowledgeBaseManager`; this plan describes how to connect to actual agent execution.

## Current State

### ✅ Completed
- Agent routing logic (`agent-router.ts`)
- Agent query interface
- Simulated agent responses
- Knowledge base integration
- Response formatting

### ⏳ Pending
- Real agent API connection
- Agent execution endpoints
- Agent coordination protocols
- Multi-agent response merging

## Architecture

### Current Architecture

```
User Query
    ↓
NL Query Engine
    ↓
Agent Router
    ↓
KnowledgeBaseManager (simulated)
    ↓
Formatted Response
```

### Target Architecture

```
User Query
    ↓
NL Query Engine
    ↓
Agent Router
    ↓
Agent API Client
    ↓
Agent Execution Service
    ↓
Multi-Agent System (AGENTS.md)
    ↓
Agent Responses
    ↓
Response Merger
    ↓
Formatted Response
```

## Implementation Plan

### Phase 1: Agent API Client

**Goal**: Create client for communicating with agent system

**Tasks**:
1. **Agent API Client**
   - File: `src/shared/agent-api-client.ts`
   - HTTP/WebSocket client for agent communication
   - Request/response handling
   - Error handling and retries

2. **Agent Types**
   - File: `src/shared/agent-types.ts`
   - Type definitions for agent requests/responses
   - Agent capability definitions
   - Response format types

3. **Agent Registry**
   - File: `src/shared/agent-registry.ts`
   - Map agent IDs to endpoints
   - Track agent availability
   - Handle agent discovery

**Estimated Time**: 3-5 days

**Dependencies**:
- Agent execution service endpoints
- Agent system API specification

---

### Phase 2: Agent Execution Integration

**Goal**: Connect to actual agent execution system

**Tasks**:
1. **Agent Execution Service**
   - File: `src/services/agent-execution-service.ts`
   - Route queries to appropriate agents
   - Handle agent execution
   - Manage agent lifecycle

2. **Agent Capability Mapping**
   - Map NL queries to agent capabilities
   - Route based on agent dimensions (0D-7D)
   - Handle agent-specific operations

3. **Response Handling**
   - Collect agent responses
   - Handle timeouts
   - Error recovery

**Estimated Time**: 5-7 days

**Dependencies**:
- Agent API Client (Phase 1)
- Agent system implementation

---

### Phase 3: Multi-Agent Coordination

**Goal**: Enable multi-agent collaboration

**Tasks**:
1. **Agent Coordination Protocol**
   - File: `src/shared/agent-coordination.ts`
   - Coordinate multiple agents
   - Handle agent dependencies
   - Manage agent workflows

2. **Response Merging**
   - File: `src/shared/response-merger.ts`
   - Merge responses from multiple agents
   - Resolve conflicts
   - Prioritize responses

3. **Consensus Mechanism**
   - Use 5D-Consensus-Agent for coordination
   - Handle voting and approval
   - Manage consensus workflows

**Estimated Time**: 7-10 days

**Dependencies**:
- Agent Execution Integration (Phase 2)
- 5D-Consensus-Agent implementation

---

### Phase 4: Advanced Features

**Goal**: Add advanced agent interaction features

**Tasks**:
1. **Agent State Management**
   - Track agent state
   - Handle state transitions
   - Persist agent state

2. **Agent Monitoring**
   - Monitor agent health
   - Track agent performance
   - Alert on failures

3. **Agent Learning**
   - Learn from interactions
   - Improve routing decisions
   - Optimize agent selection

**Estimated Time**: 10-14 days

**Dependencies**:
- Multi-Agent Coordination (Phase 3)
- Monitoring infrastructure

---

## Technical Implementation

### Agent API Client

```typescript
// agent-api-client.ts
export class AgentAPIClient {
  private baseURL: string;
  private wsConnection?: WebSocket;

  constructor(baseURL: string) {
    this.baseURL = baseURL;
  }

  async queryAgent(
    agentId: string,
    query: string,
    context?: AgentContext
  ): Promise<AgentResponse> {
    const response = await fetch(`${this.baseURL}/agents/${agentId}/query`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query, context }),
    });
    return response.json();
  }

  async executeOperation(
    agentId: string,
    operation: AgentOperation
  ): Promise<OperationResult> {
    // Implementation
  }
}
```

### Agent Router Integration

```typescript
// agent-router.ts (updated)
import { AgentAPIClient } from './agent-api-client';

export class AgentRouter {
  private apiClient: AgentAPIClient;

  async routeToAgent(
    intent: QueryIntent,
    context: ConversationContext
  ): Promise<AgentResponse> {
    const agentId = this.selectAgent(intent);
    
    // Use real agent API instead of KnowledgeBaseManager
    const response = await this.apiClient.queryAgent(
      agentId,
      intent.query,
      { context, sessionId: context.sessionId }
    );

    return this.formatResponse(response);
  }
}
```

### Agent Capability Mapping

```typescript
// agent-capability-mapper.ts
export class AgentCapabilityMapper {
  private agentCapabilities: Map<string, AgentCapabilities>;

  mapQueryToAgent(query: string): string[] {
    // Map query to agent IDs based on capabilities
    const agents: string[] = [];
    
    // Example: Church encoding queries → 0D-3D agents
    if (query.includes('church') || query.includes('lambda')) {
      agents.push('0D-Topology-Agent', '1D-Temporal-Agent', '2D-Structural-Agent', '3D-Algebraic-Agent');
    }
    
    // Example: Network queries → 4D-Network-Agent
    if (query.includes('network') || query.includes('deploy')) {
      agents.push('4D-Network-Agent');
    }
    
    return agents;
  }
}
```

---

## Agent System Integration

### Agent Endpoints

Based on `AGENTS.md`, agents should expose:

1. **Query Endpoint**: `POST /agents/{agentId}/query`
   - Accepts: Query string, context
   - Returns: Agent response

2. **Operation Endpoint**: `POST /agents/{agentId}/execute`
   - Accepts: Operation specification
   - Returns: Operation result

3. **Status Endpoint**: `GET /agents/{agentId}/status`
   - Returns: Agent status and capabilities

### Agent Communication Protocol

```typescript
interface AgentRequest {
  query: string;
  context?: {
    sessionId: string;
    userId?: string;
    conversationHistory?: Message[];
  };
  options?: {
    timeout?: number;
    priority?: 'low' | 'normal' | 'high';
  };
}

interface AgentResponse {
  agentId: string;
  response: string;
  confidence: number;
  citations?: Citation[];
  followUpSuggestions?: string[];
  metadata?: {
    executionTime: number;
    tokensUsed?: number;
  };
}
```

---

## Testing Strategy

### Unit Tests
- Agent API client
- Agent routing logic
- Response formatting

### Integration Tests
- Agent execution flow
- Multi-agent coordination
- Error handling

### E2E Tests
- Complete query flow
- Multi-agent responses
- Error recovery

---

## Migration Path

### Step 1: Parallel Implementation
- Keep existing KnowledgeBaseManager
- Add AgentAPIClient alongside
- Feature flag to switch between

### Step 2: Gradual Migration
- Migrate one agent type at a time
- Test thoroughly before switching
- Monitor performance

### Step 3: Full Migration
- Remove KnowledgeBaseManager simulation
- Use only real agent API
- Optimize based on usage

---

## Related Documentation

- **`NEXT_STEPS_COMPLETE.md`**: Current implementation status
- **`AGENTS.md`**: Multi-agent system specification
- **`INTEGRATION_COMPLETE.md`**: Integration status

---

**Status**: 📋 Planned  
**Next Steps**: Begin Phase 1 when agent execution service is ready
