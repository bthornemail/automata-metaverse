# Natural Language Query API Documentation

## Overview

The Natural Language Query API provides a comprehensive interface for querying knowledge bases using natural language, with support for conversation context, multi-turn dialogue, and agent coordination.

## Core Components

### 1. EnhancedConversationInterface

Main interface for natural language conversations.

```typescript
import { EnhancedConversationInterface } from './enhanced-conversation-interface';
import { KnowledgeBaseManager } from '../document-knowledge-extractor/knowledge-base';

const knowledgeBase = new KnowledgeBaseManager();
knowledgeBase.loadFromJSONL(fs.readFileSync('knowledge-base.jsonl', 'utf-8'));

const conversation = new EnhancedConversationInterface(knowledgeBase);
```

#### Methods

##### `ask(question: string): Promise<FormattedResponse>`

Ask a question and get a formatted response with citations and follow-up suggestions.

```typescript
const response = await conversation.ask('What agents are available?');

console.log(response.answer);           // Formatted answer
console.log(response.citations);       // Source citations
console.log(response.followUpSuggestions); // Suggested follow-ups
console.log(response.confidence);      // Confidence score (0-1)
```

**Example**:
```typescript
const response = await conversation.ask('Tell me about 4D-Network-Agent');

// Response includes:
// - answer: Detailed agent information
// - citations: [ { source: 'AGENTS.md', type: 'document' } ]
// - followUpSuggestions: ['What are the dependencies?', ...]
// - confidence: 0.9
```

##### `getHistory(): ConversationTurn[]`

Get conversation history.

```typescript
const history = conversation.getHistory();
history.forEach(turn => {
  console.log(`Q: ${turn.userInput}`);
  console.log(`A: ${turn.mergedResponse}`);
});
```

##### `clearHistory(): void`

Clear conversation history.

```typescript
conversation.clearHistory();
```

##### `createNewConversation(userId?: string): string`

Create a new conversation.

```typescript
const newConversationId = conversation.createNewConversation('user123');
```

##### `switchConversation(conversationId: string): boolean`

Switch to an existing conversation.

```typescript
const switched = conversation.switchConversation('conv-1234567890-abc');
if (switched) {
  console.log('Switched to conversation');
}
```

##### `getConversationId(): string`

Get current conversation ID.

```typescript
const currentId = conversation.getConversationId();
```

##### `interactiveMode(): Promise<void>`

Start interactive CLI mode.

```typescript
await conversation.interactiveMode();
```

### 2. ConversationContextManager

Manages conversation state and context.

```typescript
import { ConversationContextManager } from './conversation-context-manager';

const contextManager = new ConversationContextManager();
```

#### Methods

##### `createConversation(userId?: string): ConversationContext`

Create a new conversation context.

```typescript
const context = contextManager.createConversation('user123');
console.log(context.conversationId); // 'conv-1234567890-abc'
```

##### `getContext(conversationId: string): ConversationContext | null`

Get conversation context.

```typescript
const context = contextManager.getContext('conv-1234567890-abc');
if (context) {
  console.log(`Turns: ${context.turns.length}`);
  console.log(`Entities: ${context.entities.size}`);
}
```

##### `addTurn(conversationId: string, turn: ConversationTurn): void`

Add a turn to conversation.

```typescript
const turn: ConversationTurn = {
  turnId: 'turn-1',
  timestamp: Date.now(),
  userInput: 'What agents are available?',
  intent: { type: 'agent', question: 'What agents are available?' },
  mergedResponse: 'Found 15 agents...'
};

contextManager.addTurn(context.conversationId, turn);
```

##### `resolveEntityReference(reference: string, context: ConversationContext): Entity | null`

Resolve entity references like "it", "that agent".

```typescript
const entity = contextManager.resolveEntityReference('it', context);
if (entity) {
  console.log(`Resolved to: ${entity.name}`);
}
```

##### `getHistory(conversationId: string, limit?: number): ConversationTurn[]`

Get conversation history.

```typescript
const history = contextManager.getHistory('conv-1234567890-abc', 10);
```

### 3. EnhancedIntentParser

Parses natural language questions into structured intents.

```typescript
import { EnhancedIntentParser } from './enhanced-intent-parser';
import { NLQueryEngine } from './nl-query-engine';

const parser = new EnhancedIntentParser(queryEngine, contextManager);
```

#### Methods

##### `parseIntent(question: string, conversationId: string): ParsedIntent`

Parse question into structured intent with context awareness.

```typescript
const parsed = parser.parseIntent('Tell me about 4D-Network-Agent', conversationId);

console.log(parsed.type);              // 'agent'
console.log(parsed.entity);            // '4D-Network-Agent'
console.log(parsed.confidence);        // 0.9
console.log(parsed.requiresClarification); // false
```

### 4. DialogueHandler

Handles multi-turn dialogue and follow-up questions.

```typescript
import { DialogueHandler } from './dialogue-handler';

const handler = new DialogueHandler(contextManager, intentParser, queryEngine);
```

#### Methods

##### `handleTurn(conversationId: string, userInput: string): Promise<Response>`

Handle a conversation turn.

```typescript
const response = await handler.handleTurn(conversationId, 'What are its dependencies?');

console.log(response.answer);
console.log(response.requiresClarification);
console.log(response.followUpSuggestions);
```

### 5. AgentRouter

Routes queries to appropriate agents.

```typescript
import { AgentRouter } from './agent-router';

const router = new AgentRouter(knowledgeBase, contextManager);
```

#### Methods

##### `routeQuery(intent: QueryIntent, conversationId: string): AgentRoute[]`

Route query to appropriate agents.

```typescript
const intent: QueryIntent = {
  type: 'agent',
  entity: '4D-Network-Agent',
  question: 'Tell me about 4D-Network-Agent'
};

const routes = router.routeQuery(intent, conversationId);
routes.forEach(route => {
  console.log(`${route.agentName}: ${route.confidence} (${route.reason})`);
});
```

##### `coordinateResponse(routes: AgentRoute[], intent: QueryIntent, conversationId: string): Promise<CoordinatedResponse>`

Coordinate responses from multiple agents.

```typescript
const coordinated = await router.coordinateResponse(routes, intent, conversationId);

console.log(coordinated.primaryResponse.response);
console.log(coordinated.mergedAnswer);
console.log(coordinated.agentsUsed);
```

### 6. EnhancedResponseGenerator

Generates formatted responses with citations.

```typescript
import { EnhancedResponseGenerator } from './enhanced-response-generator';

const generator = new EnhancedResponseGenerator();
```

#### Methods

##### `generateResponse(queryResult: QueryResult, parsedIntent: ParsedIntent, coordinatedResponse?: CoordinatedResponse, context?: ConversationContext): FormattedResponse`

Generate formatted response.

```typescript
const formatted = generator.generateResponse(
  queryResult,
  parsedIntent,
  coordinatedResponse,
  context
);

console.log(formatted.answer);
console.log(formatted.citations);
console.log(formatted.followUpSuggestions);
```

## Response Types

### FormattedResponse

```typescript
interface FormattedResponse {
  answer: string;                    // Formatted answer text
  citations: Citation[];             // Source citations
  followUpSuggestions: string[];    // Suggested follow-up questions
  relatedEntities: Entity[];         // Related entities
  confidence: number;                // Confidence score (0-1)
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

## Usage Examples

### Basic Query

```typescript
const conversation = new EnhancedConversationInterface(knowledgeBase);

const response = await conversation.ask('What agents are available?');
console.log(response.answer);
```

### Multi-turn Conversation

```typescript
// First question
await conversation.ask('Tell me about 4D-Network-Agent');

// Follow-up (maintains context)
const response = await conversation.ask('What are its dependencies?');
console.log(response.answer); // Answers about 4D-Network-Agent dependencies
```

### With Citations

```typescript
const response = await conversation.ask('What is Church encoding?');

response.citations.forEach(citation => {
  console.log(`Source: ${citation.source}`);
  if (citation.lineNumber) {
    console.log(`Line: ${citation.lineNumber}`);
  }
});
```

### Conversation Management

```typescript
// Create new conversation
const conversationId = conversation.createNewConversation('user123');

// Switch conversations
conversation.switchConversation(conversationId);

// Get history
const history = conversation.getHistory();
console.log(`Conversation has ${history.length} turns`);

// Clear history
conversation.clearHistory();
```

### Custom Response Formatting

```typescript
const generator = new EnhancedResponseGenerator();
const formatted = generator.generateResponse(queryResult, parsedIntent);

// Format as markdown
const markdown = generator.formatForOutput(formatted, 'markdown');

// Format as plain text
const plain = generator.formatForOutput(formatted, 'plain');

// Format as JSON
const json = generator.formatForOutput(formatted, 'json');
```

## Error Handling

```typescript
try {
  const response = await conversation.ask('Invalid question');
} catch (error) {
  if (error instanceof Error) {
    console.error(`Error: ${error.message}`);
  }
}
```

## Integration Examples

### With Express.js

```typescript
import express from 'express';
import { EnhancedConversationInterface } from './enhanced-conversation-interface';

const app = express();
const conversation = new EnhancedConversationInterface(knowledgeBase);

app.post('/api/ask', async (req, res) => {
  try {
    const { question, conversationId } = req.body;
    
    if (conversationId) {
      conversation.switchConversation(conversationId);
    }
    
    const response = await conversation.ask(question);
    
    res.json({
      answer: response.answer,
      citations: response.citations,
      followUpSuggestions: response.followUpSuggestions,
      conversationId: conversation.getConversationId()
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
```

### With React

```typescript
import { useState } from 'react';

function ChatInterface() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  
  const handleAsk = async () => {
    const response = await fetch('/api/ask', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ question: input })
    });
    
    const data = await response.json();
    setMessages([...messages, { question: input, answer: data.answer }]);
    setInput('');
  };
  
  return (
    <div>
      {messages.map((msg, i) => (
        <div key={i}>
          <div>Q: {msg.question}</div>
          <div>A: {msg.answer}</div>
        </div>
      ))}
      <input value={input} onChange={e => setInput(e.target.value)} />
      <button onClick={handleAsk}>Ask</button>
    </div>
  );
}
```

## Best Practices

1. **Reuse Conversations**: Maintain conversation context for better responses
2. **Handle Errors**: Always wrap API calls in try-catch
3. **Check Confidence**: Use confidence scores to determine response quality
4. **Use Citations**: Always display citations for transparency
5. **Follow-up Suggestions**: Present follow-up suggestions to guide users

## Performance Considerations

- **Conversation Context**: Context is stored in memory, consider persistence for long-running applications
- **Agent Routing**: Agent routing adds overhead, use direct queries for simple questions
- **Response Generation**: Response generation is fast (< 100ms) for most queries

## Limitations

- **Knowledge Base Required**: Requires loaded knowledge base
- **Memory Usage**: Conversation context stored in memory
- **Agent Simulation**: Agent responses are currently simulated (see Integration section)

## Related Documentation

- `README.md`: Overview and quick start
- `TESTING_GUIDE.md`: Testing documentation
- `NL_INTERFACE_IMPLEMENTATION.md`: Implementation details
