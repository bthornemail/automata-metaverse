---
id: integration-guide
title: "Natural Language Interface Integration Guide"
level: practical
type: guide
tags: [integration, natural-language-interface, ui-integration, api-integration]
keywords: [integration, ui-integration, api-integration, natural-language-interface, backend-integration]
prerequisites: [automaton-user-interactions-rfc2119-spec]
enables: []
related: [automaton-user-interactions-rfc2119-spec]
readingTime: 20
difficulty: 4
blackboard:
  status: active
  assignedAgent: "Query-Interface-Agent"
  lastUpdate: 2025-01-07
  dependencies: [natural-language-query]
  watchers: []
---

# Natural Language Interface Integration Guide

## Overview

This guide explains how to integrate the Natural Language Query Interface with:
1. **Backend API**: REST endpoints for NL queries
2. **UI Components**: React components for chat interface
3. **Existing Systems**: Integration with AIPortal and agent systems

## Backend Integration

### API Endpoints

The NL Query API provides the following endpoints:

#### `POST /api/nl-query/ask`

Ask a question using natural language.

**Request**:
```json
{
  "question": "What agents are available?",
  "conversationId": "conv-1234567890-abc" // Optional
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "answer": "Found 15 agents...",
    "citations": [...],
    "followUpSuggestions": [...],
    "confidence": 0.9,
    "conversationId": "conv-1234567890-abc"
  }
}
```

#### `GET /api/nl-query/history/:conversationId`

Get conversation history.

**Response**:
```json
{
  "success": true,
  "data": [
    {
      "turnId": "turn-1",
      "userInput": "What agents are available?",
      "mergedResponse": "Found 15 agents...",
      "timestamp": 1234567890
    }
  ]
}
```

#### `POST /api/nl-query/conversation`

Create a new conversation.

**Request**:
```json
{
  "userId": "user123" // Optional
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "conversationId": "conv-1234567890-abc",
    "userId": "user123"
  }
}
```

#### `POST /api/nl-query/conversation/:conversationId/clear`

Clear conversation history.

#### `GET /api/nl-query/health`

Health check endpoint.

### Server Integration

The NL Query routes are integrated into `ui-server.ts`:

```typescript
// In handleAPIRequest function
if (apiPath.startsWith('nl-query/')) {
  const { handleNLQueryRequest } = await import('./src/routes/nl-query-simple');
  const handled = await handleNLQueryRequest(apiPath, req, res);
  if (handled) {
    return;
  }
}
```

## UI Integration

### Service Integration

The `nl-query-service.ts` provides a client-side service:

```typescript
import { nlQueryService } from '@/services/nl-query-service';

// Ask a question
const response = await nlQueryService.ask('What agents are available?');

// Get history
const history = await nlQueryService.getHistory(conversationId);

// Create conversation
const conversationId = await nlQueryService.createConversation('user123');
```

### AIPortal Integration

To integrate with the existing AIPortal component:

```typescript
// In AIPortal.tsx
import { nlQueryService } from '@/services/nl-query-service';

// Replace or enhance sendMessage function
const sendMessage = async (message: string) => {
  // Option 1: Use NL Query Service
  try {
    const response = await nlQueryService.ask(message);
    setChat(prev => ({
      ...prev,
      messages: [...prev.messages, {
        role: 'agent',
        content: response.answer
      }]
    }));
  } catch (error) {
    // Fallback to existing LLM service
    // ... existing code ...
  }
};
```

### New Chat Component

Create a new component that uses the NL Query service:

```typescript
// components/NLQueryChat.tsx
import { useState, useEffect } from 'react';
import { nlQueryService, NLQueryResponse } from '@/services/nl-query-service';

export function NLQueryChat() {
  const [messages, setMessages] = useState<Array<{role: 'user' | 'agent', content: string}>>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [followUps, setFollowUps] = useState<string[]>([]);

  useEffect(() => {
    nlQueryService.createConversation().then(id => {
      setConversationId(id);
    });
  }, []);

  const handleAsk = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = input;
    setInput('');
    setIsLoading(true);

    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);

    try {
      const response = await nlQueryService.ask(userMessage, conversationId || undefined);
      
      setMessages(prev => [...prev, { 
        role: 'agent', 
        content: response.answer 
      }]);

      setFollowUps(response.followUpSuggestions);
    } catch (error) {
      setMessages(prev => [...prev, { 
        role: 'agent', 
        content: 'Sorry, I encountered an error. Please try again.' 
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="nl-query-chat">
      <div className="messages">
        {messages.map((msg, i) => (
          <div key={i} className={`message ${msg.role}`}>
            {msg.content}
          </div>
        ))}
      </div>
      
      {followUps.length > 0 && (
        <div className="follow-ups">
          <div>Suggested questions:</div>
          {followUps.map((suggestion, i) => (
            <button key={i} onClick={() => setInput(suggestion)}>
              {suggestion}
            </button>
          ))}
        </div>
      )}
      
      <div className="input-area">
        <input 
          value={input} 
          onChange={e => setInput(e.target.value)}
          onKeyPress={e => e.key === 'Enter' && handleAsk()}
          disabled={isLoading}
          placeholder="Ask a question..."
        />
        <button onClick={handleAsk} disabled={isLoading}>
          Ask
        </button>
      </div>
    </div>
  );
}
```

## Agent API Integration

### Current State

Currently, agent responses are **simulated** based on knowledge base data. To integrate with real agent APIs:

### Step 1: Create Agent API Interface

```typescript
// evolutions/natural-language-query/agent-api.ts
export interface AgentAPI {
  query(agentId: string, query: string, context?: any): Promise<AgentResponse>;
}

export class HTTPAgentAPI implements AgentAPI {
  constructor(private baseUrl: string) {}

  async query(agentId: string, query: string, context?: any): Promise<AgentResponse> {
    const response = await fetch(`${this.baseUrl}/agents/${agentId}/query`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query, context })
    });
    
    return response.json();
  }
}
```

### Step 2: Update Agent Router

```typescript
// In agent-router.ts
import { AgentAPI } from './agent-api';

export class AgentRouter {
  private agentAPI: AgentAPI;

  constructor(
    knowledgeBase: KnowledgeBaseManager,
    contextManager: ConversationContextManager,
    agentAPI?: AgentAPI
  ) {
    this.agentAPI = agentAPI || new SimulatedAgentAPI(knowledgeBase);
    // ...
  }

  private async queryAgent(
    route: AgentRoute,
    intent: QueryIntent,
    conversationId: string
  ): Promise<AgentResponse> {
    // Use real API if available
    if (this.agentAPI) {
      return await this.agentAPI.query(route.agentId, intent.question || '', {
        conversationId,
        intent
      });
    }
    
    // Fallback to knowledge base
    // ... existing code ...
  }
}
```

### Step 3: Configure Agent API

```typescript
// In enhanced-conversation-interface.ts
import { HTTPAgentAPI } from './agent-api';

const agentAPI = new HTTPAgentAPI('http://localhost:3000/api/agents');
const agentRouter = new AgentRouter(knowledgeBase, contextManager, agentAPI);
```

## Integration Checklist

### Backend

- [x] Create NL Query API routes (`src/routes/nl-query-simple.ts`)
- [x] Integrate routes into `ui-server.ts`
- [x] Load knowledge base on server start
- [x] Handle conversation management
- [ ] Add authentication (if needed)
- [ ] Add rate limiting (if needed)
- [ ] Add persistence (database/Redis)

### Frontend

- [x] Create NL Query service (`ui/src/services/nl-query-service.ts`)
- [x] Create API documentation (`evolutions/natural-language-query/API.md`)
- [x] Create examples (`evolutions/natural-language-query/EXAMPLES.md`)
- [ ] Integrate with AIPortal component
- [ ] Create dedicated NL Query chat component
- [ ] Add error handling UI
- [ ] Add loading states
- [ ] Add citation display

### Agent Integration

- [x] Simulated agent responses (knowledge base)
- [ ] Create Agent API interface
- [ ] Update Agent Router to use real APIs
- [ ] Test with real agent endpoints
- [ ] Add agent health checks

## Testing Integration

### Test Backend API

```bash
# Test health endpoint
curl http://localhost:3000/api/nl-query/health

# Test ask endpoint
curl -X POST http://localhost:3000/api/nl-query/ask \
  -H "Content-Type: application/json" \
  -d '{"question": "What agents are available?"}'
```

### Test Frontend Service

```typescript
// In browser console or test file
import { nlQueryService } from '@/services/nl-query-service';

const response = await nlQueryService.ask('What agents are available?');
console.log(response);
```

## Troubleshooting

### Knowledge Base Not Loading

**Issue**: Knowledge base not found or empty.

**Solution**:
1. Check knowledge base file exists
2. Run knowledge extraction: `tsx evolutions/document-knowledge-extractor/extract-docs.ts`
3. Verify file path in server logs

### Agent Routing Fails

**Issue**: Agent router returns "I don't have information about that."

**Solution**:
1. Check knowledge base has agents loaded
2. Verify agent names match (case-sensitive)
3. Check agent router fallback logic
4. Use direct query engine as fallback

### Conversation Context Lost

**Issue**: Follow-up questions don't maintain context.

**Solution**:
1. Ensure conversation ID is passed correctly
2. Check conversation context manager is persisting state
3. Verify entity resolution is working

## Next Steps

1. **Complete UI Integration**: Integrate NL Query into AIPortal
2. **Add Persistence**: Store conversations in database
3. **Real Agent APIs**: Connect to actual agent endpoints
4. **Performance Optimization**: Cache responses, optimize queries
5. **Enhanced Features**: Add voice input, streaming responses

## Related Documentation

- `API.md`: Complete API documentation
- `EXAMPLES.md`: Usage examples
- `NL_INTERFACE_IMPLEMENTATION.md`: Implementation details
- `TESTING_GUIDE.md`: Testing documentation
