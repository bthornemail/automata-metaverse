---
id: agent-api-phase1-start
title: "Agent API Connection Phase 1 - Getting Started"
level: implementation-guide
type: quick-start
tags: [agent-api, multi-agent-system, implementation]
keywords: [agent-api, phase1, multi-agent, getting-started]
prerequisites: [agent-api-connection-plan]
enables: []
related: [agent-api-connection-plan]
readingTime: 20
difficulty: 3
blackboard:
  status: ready
  assignedAgent: "4D-Network-Agent"
  lastUpdate: 2025-11-09
  dependencies: []
  watchers: []
---

# Agent API Connection Phase 1 - Getting Started

**Last Updated**: 2025-11-09  
**Status**: 🚀 **READY TO START**

## Overview

Phase 1 focuses on designing and implementing a basic Agent API client that can connect to a multi-agent system and execute basic operations.

---

## Phase 1 Goals

1. ✅ Design Agent API client interface
2. ✅ Implement basic HTTP client
3. ✅ Add authentication (if needed)
4. ✅ Test basic connection
5. ✅ Implement agent discovery

---

## Step 1: Design API Client Interface

Create `ui/src/services/agent-api/types.ts`:

```typescript
export interface Agent {
  id: string;
  name: string;
  dimension?: string;
  status: 'active' | 'inactive' | 'busy';
  capabilities: string[];
}

export interface AgentRequest {
  agentId: string;
  operation: string;
  parameters?: Record<string, any>;
}

export interface AgentResponse {
  success: boolean;
  result?: any;
  error?: string;
  agentId: string;
}

export interface AgentAPI {
  // Discovery
  listAgents(): Promise<Agent[]>;
  getAgent(agentId: string): Promise<Agent>;
  
  // Execution
  execute(request: AgentRequest): Promise<AgentResponse>;
  
  // Status
  getAgentStatus(agentId: string): Promise<Agent['status']>;
  
  // Health
  healthCheck(): Promise<boolean>;
}
```

---

## Step 2: Implement HTTP Client

Create `ui/src/services/agent-api/client.ts`:

```typescript
import { Agent, AgentRequest, AgentResponse, AgentAPI } from './types';

export class AgentAPIClient implements AgentAPI {
  private baseURL: string;
  private apiKey?: string;

  constructor(baseURL: string, apiKey?: string) {
    this.baseURL = baseURL.replace(/\/$/, '');
    this.apiKey = apiKey;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseURL}${endpoint}`;
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (this.apiKey) {
      headers['Authorization'] = `Bearer ${this.apiKey}`;
    }

    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (!response.ok) {
      throw new Error(`API request failed: ${response.statusText}`);
    }

    return response.json();
  }

  async listAgents(): Promise<Agent[]> {
    return this.request<Agent[]>('/agents');
  }

  async getAgent(agentId: string): Promise<Agent> {
    return this.request<Agent>(`/agents/${agentId}`);
  }

  async execute(request: AgentRequest): Promise<AgentResponse> {
    return this.request<AgentResponse>('/agents/execute', {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }

  async getAgentStatus(agentId: string): Promise<Agent['status']> {
    const agent = await this.getAgent(agentId);
    return agent.status;
  }

  async healthCheck(): Promise<boolean> {
    try {
      const response = await this.request<{ status: string }>('/health');
      return response.status === 'ok';
    } catch {
      return false;
    }
  }
}
```

---

## Step 3: Create Mock Agent Service (for testing)

Create `ui/src/services/agent-api/mock-client.ts`:

```typescript
import { Agent, AgentRequest, AgentResponse, AgentAPI } from './types';

export class MockAgentAPIClient implements AgentAPI {
  private agents: Agent[] = [
    {
      id: '0D-Topology-Agent',
      name: '0D Topology Agent',
      dimension: '0D',
      status: 'active',
      capabilities: ['topology', 'identity']
    },
    {
      id: '1D-Temporal-Agent',
      name: '1D Temporal Agent',
      dimension: '1D',
      status: 'active',
      capabilities: ['temporal', 'evolution']
    },
    // Add more agents...
  ];

  async listAgents(): Promise<Agent[]> {
    return Promise.resolve([...this.agents]);
  }

  async getAgent(agentId: string): Promise<Agent> {
    const agent = this.agents.find(a => a.id === agentId);
    if (!agent) {
      throw new Error(`Agent not found: ${agentId}`);
    }
    return Promise.resolve({ ...agent });
  }

  async execute(request: AgentRequest): Promise<AgentResponse> {
    const agent = this.agents.find(a => a.id === request.agentId);
    if (!agent) {
      return {
        success: false,
        error: `Agent not found: ${request.agentId}`,
        agentId: request.agentId
      };
    }

    // Mock execution
    return {
      success: true,
      result: {
        operation: request.operation,
        parameters: request.parameters,
        executed: true
      },
      agentId: request.agentId
    };
  }

  async getAgentStatus(agentId: string): Promise<Agent['status']> {
    const agent = await this.getAgent(agentId);
    return agent.status;
  }

  async healthCheck(): Promise<boolean> {
    return Promise.resolve(true);
  }
}
```

---

## Step 4: Create Agent Service Hook

Create `ui/src/hooks/useAgentAPI.ts`:

```typescript
import { useState, useEffect } from 'react';
import { AgentAPIClient, MockAgentAPIClient } from '../services/agent-api/client';
import { Agent, AgentRequest, AgentResponse } from '../services/agent-api/types';

export const useAgentAPI = (useMock: boolean = false) => {
  const [client] = useState(() => {
    if (useMock) {
      return new MockAgentAPIClient();
    }
    const baseURL = process.env.REACT_APP_AGENT_API_URL || 'http://localhost:3000/api';
    const apiKey = process.env.REACT_APP_AGENT_API_KEY;
    return new AgentAPIClient(baseURL, apiKey);
  });

  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    loadAgents();
  }, []);

  const loadAgents = async () => {
    setLoading(true);
    setError(null);
    try {
      const agentList = await client.listAgents();
      setAgents(agentList);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to load agents'));
    } finally {
      setLoading(false);
    }
  };

  const executeOperation = async (
    request: AgentRequest
  ): Promise<AgentResponse> => {
    setLoading(true);
    setError(null);
    try {
      const response = await client.execute(request);
      return response;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Execution failed');
      setError(error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const getAgent = async (agentId: string): Promise<Agent> => {
    return client.getAgent(agentId);
  };

  const healthCheck = async (): Promise<boolean> => {
    return client.healthCheck();
  };

  return {
    agents,
    loading,
    error,
    loadAgents,
    executeOperation,
    getAgent,
    healthCheck,
  };
};
```

---

## Step 5: Test Basic Connection

Create `ui/src/components/AgentAPI/AgentList.tsx`:

```typescript
import React from 'react';
import { useAgentAPI } from '../../hooks/useAgentAPI';

export const AgentList: React.FC = () => {
  const { agents, loading, error, loadAgents } = useAgentAPI(true); // Use mock for now

  if (loading) return <div>Loading agents...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return (
    <div>
      <h2>Available Agents</h2>
      <button onClick={loadAgents}>Refresh</button>
      <ul>
        {agents.map(agent => (
          <li key={agent.id}>
            <strong>{agent.name}</strong> ({agent.dimension || 'N/A'})
            <br />
            Status: {agent.status}
            <br />
            Capabilities: {agent.capabilities.join(', ')}
          </li>
        ))}
      </ul>
    </div>
  );
};
```

---

## Step 6: Environment Configuration

Create `.env.example`:

```bash
# Agent API Configuration
REACT_APP_AGENT_API_URL=http://localhost:3000/api
REACT_APP_AGENT_API_KEY=your-api-key-here
REACT_APP_USE_MOCK_AGENT_API=true
```

---

## Testing Checklist

- [ ] Agent API client initializes
- [ ] Can list agents (mock)
- [ ] Can get individual agent
- [ ] Can execute operations
- [ ] Health check works
- [ ] Error handling works
- [ ] Loading states work

---

## Next Steps (Phase 2)

After Phase 1 is complete:
- Connect to real agent service
- Implement agent execution workflows
- Add result handling
- Implement multi-agent coordination

---

## Related Documentation

- **`docs/17-Automaton-User-Interactions/AGENT_API_CONNECTION_PLAN.md`** - Full implementation plan
- **`AGENTS.md`** - Multi-agent system specification

---

**Status**: 🚀 **READY TO START**  
**Estimated Time**: 3-5 days  
**Dependencies**: Agent service endpoint (or mock for testing)
