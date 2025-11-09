# Natural Language Query Examples

## Basic Usage Examples

### Example 1: Simple Agent Query

```typescript
import { EnhancedConversationInterface } from './enhanced-conversation-interface';
import { KnowledgeBaseManager } from '../document-knowledge-extractor/knowledge-base';

const knowledgeBase = new KnowledgeBaseManager();
knowledgeBase.loadFromJSONL(fs.readFileSync('knowledge-base.jsonl', 'utf-8'));

const conversation = new EnhancedConversationInterface(knowledgeBase);

// Ask about an agent
const response = await conversation.ask('What is the 4D-Network-Agent?');

console.log(response.answer);
// Output:
// **4D-Network-Agent**
// 
// **Purpose:** Manage network operations
// **Dimension:** 4D
// 
// **Capabilities:**
// - IPv4/IPv6
// - CI/CD
// - Deployment
// 
// **Dependencies:** 3D-Algebraic-Agent
// 
// *Source: AGENTS.md*

console.log(response.citations);
// Output:
// [
//   { source: 'AGENTS.md', type: 'document', title: 'AGENTS.md' }
// ]

console.log(response.followUpSuggestions);
// Output:
// [
//   'What are the dependencies of 4D-Network-Agent?',
//   'What are the capabilities of 4D-Network-Agent?',
//   'What rules apply to 4D-Network-Agent?'
// ]
```

### Example 2: Multi-turn Conversation

```typescript
// First question
await conversation.ask('Tell me about 4D-Network-Agent');

// Follow-up question (maintains context)
const response = await conversation.ask('What are its dependencies?');

console.log(response.answer);
// Output:
// Following up on "Tell me about 4D-Network-Agent":
// 
// **Dependencies:**
// - 3D-Algebraic-Agent
// 
// *Source: AGENTS.md*
```

### Example 3: Function Query

```typescript
const response = await conversation.ask('How do I use r5rs:church-add?');

console.log(response.answer);
// Output:
// **r5rs:church-add**
// 
// **Description:** R5RS function: church-add
// 
// **Signature:** `(church-add m n)`
// 
// **Examples:**
// ```
// {"type": "r5rs-call", "function": "r5rs:church-add", "args": [2, 3]}
// ```
// 
// *Source: docs/05-Meta-Log/MULTIVERSE-CANVAS-RFC2119-SPEC.md*
```

### Example 4: Rule Query

```typescript
const response = await conversation.ask('What are the MUST requirements?');

console.log(response.answer);
// Output:
// Found 45 rules:
// 
// - **MUST**: Implement exactly one system per topology dimension
// - **MUST**: Use specified technologies (Three.js, WebLLM, etc.)
// - **MUST**: Maintain SHACL shape compliance
// ...
```

### Example 5: Fact Query

```typescript
const response = await conversation.ask('What is Church encoding?');

console.log(response.answer);
// Output:
// Church encoding is a way to represent natural numbers and operations
// using lambda calculus. The Church numeral n is represented as a function
// that applies another function n times...
// 
// *Source: docs/01-R5RS-Expressions/CHURCH_ENCODING.md*
```

## API Usage Examples

### Example 6: REST API Query

```typescript
// Using fetch API
const response = await fetch('http://localhost:3000/api/nl-query/ask', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    question: 'What agents are available?',
    conversationId: 'conv-1234567890-abc' // Optional
  }),
});

const data = await response.json();

console.log(data.data.answer);
console.log(data.data.citations);
console.log(data.data.followUpSuggestions);
```

### Example 7: React Component Integration

```typescript
import { useState, useEffect } from 'react';
import { nlQueryService } from '@/services/nl-query-service';

function ChatInterface() {
  const [messages, setMessages] = useState<Array<{role: 'user' | 'agent', content: string}>>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);

  useEffect(() => {
    // Create conversation on mount
    nlQueryService.createConversation().then(id => {
      setConversationId(id);
    });
  }, []);

  const handleAsk = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = input;
    setInput('');
    setIsLoading(true);

    // Add user message
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);

    try {
      const response = await nlQueryService.ask(userMessage, conversationId || undefined);
      
      // Add agent response
      setMessages(prev => [...prev, { 
        role: 'agent', 
        content: response.answer 
      }]);

      // Show follow-up suggestions
      if (response.followUpSuggestions.length > 0) {
        console.log('Follow-up suggestions:', response.followUpSuggestions);
      }
    } catch (error) {
      console.error('Query error:', error);
      setMessages(prev => [...prev, { 
        role: 'agent', 
        content: 'Sorry, I encountered an error. Please try again.' 
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      <div className="messages">
        {messages.map((msg, i) => (
          <div key={i} className={msg.role}>
            {msg.content}
          </div>
        ))}
      </div>
      <input 
        value={input} 
        onChange={e => setInput(e.target.value)}
        onKeyPress={e => e.key === 'Enter' && handleAsk()}
        disabled={isLoading}
      />
      <button onClick={handleAsk} disabled={isLoading}>
        Ask
      </button>
    </div>
  );
}
```

## Advanced Examples

### Example 8: Conversation Management

```typescript
// Create new conversation
const conversationId = await nlQueryService.createConversation('user123');

// Switch conversations
nlQueryService.setConversationId(conversationId);

// Get history
const history = await nlQueryService.getHistory(conversationId);
console.log(`Conversation has ${history.length} turns`);

// Clear history
await nlQueryService.clearHistory(conversationId);
```

### Example 9: Error Handling

```typescript
try {
  const response = await conversation.ask('Invalid question');
  
  if (response.confidence < 0.5) {
    console.warn('Low confidence response:', response.answer);
  }
} catch (error) {
  if (error instanceof Error) {
    console.error('Error:', error.message);
  }
}
```

### Example 10: Custom Response Formatting

```typescript
import { EnhancedResponseGenerator } from './enhanced-response-generator';

const generator = new EnhancedResponseGenerator();
const formatted = generator.generateResponse(queryResult, parsedIntent);

// Format as markdown
const markdown = generator.formatForOutput(formatted, 'markdown');

// Format as plain text
const plain = generator.formatForOutput(formatted, 'plain');

// Format as JSON
const json = generator.formatForOutput(formatted, 'json');
```

## Integration Examples

### Example 11: Express.js Backend

```typescript
import express from 'express';
import { EnhancedConversationInterface } from './enhanced-conversation-interface';

const app = express();
app.use(express.json());

const conversation = new EnhancedConversationInterface(knowledgeBase);

app.post('/api/ask', async (req, res) => {
  try {
    const { question, conversationId } = req.body;
    const response = await conversation.ask(question);
    res.json({ success: true, data: response });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    });
  }
});

app.listen(3000);
```

### Example 12: Next.js API Route

```typescript
// pages/api/nl-query.ts
import { EnhancedConversationInterface } from '../../../evolutions/natural-language-query/enhanced-conversation-interface';
import { KnowledgeBaseManager } from '../../../evolutions/document-knowledge-extractor/knowledge-base';

let conversation: EnhancedConversationInterface | null = null;

async function getConversation() {
  if (!conversation) {
    const kb = new KnowledgeBaseManager();
    kb.loadFromJSONL(/* load from file */);
    conversation = new EnhancedConversationInterface(kb);
  }
  return conversation;
}

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const conv = await getConversation();
  const response = await conv.ask(req.body.question);
  
  res.json({ success: true, data: response });
}
```

## Best Practices

1. **Reuse Conversations**: Maintain conversation context for better responses
2. **Handle Errors**: Always wrap API calls in try-catch
3. **Check Confidence**: Use confidence scores to determine response quality
4. **Use Citations**: Always display citations for transparency
5. **Follow-up Suggestions**: Present follow-up suggestions to guide users
6. **Memory Management**: Clear old conversations periodically
7. **Error Messages**: Provide helpful error messages to users

## Common Patterns

### Pattern 1: Question-Answer Loop

```typescript
while (true) {
  const question = await getUserInput();
  const response = await conversation.ask(question);
  displayResponse(response);
  
  if (response.followUpSuggestions.length > 0) {
    displaySuggestions(response.followUpSuggestions);
  }
}
```

### Pattern 2: Context-Aware Queries

```typescript
// First, establish context
await conversation.ask('Tell me about agents');

// Then ask follow-up questions
await conversation.ask('Which ones handle network operations?');
await conversation.ask('What are their dependencies?');
```

### Pattern 3: Error Recovery

```typescript
async function askWithRetry(question: string, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await conversation.ask(question);
    } catch (error) {
      if (i === maxRetries - 1) throw error;
      await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
    }
  }
}
```
