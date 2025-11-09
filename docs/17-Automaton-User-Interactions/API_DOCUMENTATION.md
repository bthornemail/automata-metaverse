---
id: api-documentation
title: "Natural Language Query API Documentation"
level: practical
type: api-reference
tags: [api-documentation, natural-language-interface, rest-api]
keywords: [api-documentation, rest-api, natural-language-query, endpoints]
prerequisites: [automaton-user-interactions-rfc2119-spec]
enables: []
related: [automaton-user-interactions-rfc2119-spec]
readingTime: 25
difficulty: 3
blackboard:
  status: active
  assignedAgent: "Query-Interface-Agent"
  lastUpdate: 2025-01-07
  dependencies: [natural-language-query]
  watchers: []
---

# Natural Language Query API Documentation

## Base URL

```
http://localhost:3000/api/nl-query
```

## Authentication

Currently, no authentication is required. In production, add authentication headers.

## Endpoints

### POST /api/nl-query/ask

Ask a question using natural language.

**Request Body**:
```json
{
  "question": "What agents are available?",
  "conversationId": "conv-1234567890-abc" // Optional
}
```

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "answer": "Found 15 agents:\n\n- **0D-Topology-Agent** (0D): Maintain quantum vacuum topology...",
    "citations": [
      {
        "source": "AGENTS.md",
        "type": "document",
        "title": "AGENTS.md"
      }
    ],
    "followUpSuggestions": [
      "What are the dependencies of 0D-Topology-Agent?",
      "What are the capabilities of 0D-Topology-Agent?",
      "What rules apply to 0D-Topology-Agent?"
    ],
    "relatedEntities": [
      {
        "id": "entity-1",
        "type": "agent",
        "name": "0D-Topology-Agent"
      }
    ],
    "confidence": 0.9,
    "conversationId": "conv-1234567890-abc"
  },
  "timestamp": 1234567890
}
```

**Error Response** (400 Bad Request):
```json
{
  "success": false,
  "error": "Question is required and must be a string",
  "timestamp": 1234567890
}
```

**Error Response** (500 Internal Server Error):
```json
{
  "success": false,
  "error": "Internal server error message",
  "timestamp": 1234567890
}
```

### GET /api/nl-query/history/:conversationId

Get conversation history.

**Path Parameters**:
- `conversationId` (string): Conversation ID

**Response** (200 OK):
```json
{
  "success": true,
  "data": [
    {
      "turnId": "turn-1",
      "timestamp": 1234567890,
      "userInput": "What agents are available?",
      "intent": {
        "type": "agent",
        "question": "What agents are available?"
      },
      "mergedResponse": "Found 15 agents...",
      "entities": []
    }
  ],
  "timestamp": 1234567890
}
```

**Error Response** (404 Not Found):
```json
{
  "success": false,
  "error": "Conversation not found",
  "timestamp": 1234567890
}
```

### POST /api/nl-query/conversation

Create a new conversation.

**Request Body**:
```json
{
  "userId": "user123" // Optional
}
```

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "conversationId": "conv-1234567890-abc",
    "userId": "user123"
  },
  "timestamp": 1234567890
}
```

### DELETE /api/nl-query/conversation/:conversationId

Delete a conversation.

**Path Parameters**:
- `conversationId` (string): Conversation ID

**Response** (200 OK):
```json
{
  "success": true,
  "message": "Conversation deleted",
  "timestamp": 1234567890
}
```

### POST /api/nl-query/conversation/:conversationId/clear

Clear conversation history.

**Path Parameters**:
- `conversationId` (string): Conversation ID

**Response** (200 OK):
```json
{
  "success": true,
  "message": "Conversation history cleared",
  "timestamp": 1234567890
}
```

### GET /api/nl-query/health

Health check endpoint.

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "status": "healthy",
    "knowledgeBase": {
      "facts": 4302,
      "rules": 738,
      "agents": 15,
      "functions": 132,
      "activeConversations": 5
    },
    "timestamp": 1234567890
  }
}
```

## Usage Examples

### cURL Examples

#### Ask a Question

```bash
curl -X POST http://localhost:3000/api/nl-query/ask \
  -H "Content-Type: application/json" \
  -d '{
    "question": "What agents are available?",
    "conversationId": "conv-1234567890-abc"
  }'
```

#### Create Conversation

```bash
curl -X POST http://localhost:3000/api/nl-query/conversation \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "user123"
  }'
```

#### Get History

```bash
curl http://localhost:3000/api/nl-query/history/conv-1234567890-abc
```

#### Clear History

```bash
curl -X POST http://localhost:3000/api/nl-query/conversation/conv-1234567890-abc/clear
```

#### Health Check

```bash
curl http://localhost:3000/api/nl-query/health
```

### JavaScript/TypeScript Examples

#### Using Fetch API

```typescript
// Ask a question
const response = await fetch('http://localhost:3000/api/nl-query/ask', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    question: 'What agents are available?',
    conversationId: 'conv-1234567890-abc'
  }),
});

const data = await response.json();
console.log(data.data.answer);
```

#### Using Axios

```typescript
import axios from 'axios';

// Ask a question
const response = await axios.post('http://localhost:3000/api/nl-query/ask', {
  question: 'What agents are available?',
  conversationId: 'conv-1234567890-abc'
});

console.log(response.data.data.answer);
```

#### Using NL Query Service

```typescript
import { nlQueryService } from '@/services/nl-query-service';

// Ask a question
const response = await nlQueryService.ask('What agents are available?');
console.log(response.answer);
```

## Response Types

### FormattedResponse

```typescript
interface FormattedResponse {
  answer: string;                    // Formatted answer text
  citations: Citation[];             // Source citations
  followUpSuggestions: string[];     // Suggested follow-up questions
  relatedEntities: Entity[];         // Related entities
  confidence: number;                // Confidence score (0-1)
  conversationId: string;            // Conversation ID
}
```

### Citation

```typescript
interface Citation {
  source: string;                    // Source file path
  type: 'document' | 'agent' | 'function' | 'rule';
  title?: string;                    // Document title
  lineNumber?: number;               // Line number
  url?: string;                      // Optional URL
}
```

### ConversationTurn

```typescript
interface ConversationTurn {
  turnId: string;
  timestamp: number;
  userInput: string;
  intent: QueryIntent;
  agentResponses?: AgentResponse[];
  mergedResponse?: string;
  contextUpdates?: ContextUpdate[];
  entities?: Entity[];
}
```

## Error Handling

All endpoints return a consistent error format:

```json
{
  "success": false,
  "error": "Error message",
  "timestamp": 1234567890
}
```

Common HTTP status codes:
- `200 OK`: Success
- `400 Bad Request`: Invalid request (missing parameters, wrong types)
- `404 Not Found`: Resource not found (conversation, etc.)
- `500 Internal Server Error`: Server error

## Rate Limiting

Currently, no rate limiting is implemented. In production, consider:
- Rate limiting per IP address
- Rate limiting per user/conversation
- Request throttling

## Best Practices

1. **Reuse Conversations**: Pass `conversationId` to maintain context
2. **Handle Errors**: Always check `success` field
3. **Check Confidence**: Use `confidence` score to determine response quality
4. **Display Citations**: Always show citations for transparency
5. **Follow-up Suggestions**: Present follow-up suggestions to guide users

## Performance Considerations

- **Response Time**: Typically < 500ms for simple queries
- **Memory Usage**: Conversations stored in memory (consider persistence)
- **Concurrent Requests**: Handles multiple concurrent conversations

## Related Documentation

- `AUTOMATON-USER-INTERACTIONS-RFC2119-SPEC.md`: RFC2119 specification
- `INTEGRATION_GUIDE.md`: Integration guide
- `INTEGRATION_COMPLETE.md`: Integration status
- `evolutions/natural-language-query/API.md`: Complete API reference
- `evolutions/natural-language-query/EXAMPLES.md`: Usage examples
- `docs/16-Knowledge-Extraction-Propagation/NL_INTERFACE_IMPLEMENTATION.md`: Implementation details
