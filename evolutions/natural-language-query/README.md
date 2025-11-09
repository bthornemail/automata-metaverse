# Natural Language Query System

Converts natural language questions to structured queries and answers questions about system knowledge.

## Overview

The Natural Language Query System:
- Parses natural language questions
- Converts to structured queries (agent, function, rule, fact, example)
- Queries knowledge base
- Formats answers in natural language
- Provides follow-up question suggestions

## Usage

### Interactive CLI Mode

```bash
# Start interactive conversation interface
tsx evolutions/natural-language-query/conversation-interface.ts ./knowledge-base.jsonl

# Or use default path
tsx evolutions/natural-language-query/conversation-interface.ts
```

### Programmatic Usage

```typescript
import { KnowledgeBaseManager } from '../document-knowledge-extractor/knowledge-base';
import { NLQueryEngine } from './nl-query-engine';

const knowledgeBase = new KnowledgeBaseManager();
knowledgeBase.loadFromJSONL(fs.readFileSync('knowledge-base.jsonl', 'utf-8'));

const queryEngine = new NLQueryEngine(knowledgeBase);

// Query knowledge base
const result = queryEngine.query('What agents are available?');
console.log(result.answer);
console.log(`Confidence: ${result.confidence}`);
```

### Conversation Interface

```typescript
import { ConversationInterface } from './conversation-interface';

const conversation = new ConversationInterface(knowledgeBase);

// Ask questions
const answer = conversation.ask('What is the 5D-Consensus-Agent?');
console.log(answer);

// Get history
const history = conversation.getHistory();

// Clear history
conversation.clearHistory();
```

## Query Types

The system supports queries about:

- **Agents**: "What agents are available?", "What is the 5D-Consensus-Agent?"
- **Functions**: "How do I use r5rs:church-add?", "What R5RS functions are available?"
- **Rules**: "What are the MUST requirements?", "What rules apply to SHACL validation?"
- **Examples**: "Show me an example", "Give me a code example"
- **Facts**: "What is Church encoding?", "Tell me about the blackboard architecture"

## Example Conversation

```
🤖 > What agents are available?

Found 15 agents:

- **0D-Topology-Agent** (0D): Maintain quantum vacuum topology and identity processes
- **1D-Temporal-Agent** (1D): Handle temporal evolution and Church successor operations
- **2D-Structural-Agent** (2D): Manage spatial structure and pattern encoding
...

**Related questions you might ask:**
1. What are the capabilities of 0D-Topology-Agent?
2. What rules apply to 0D-Topology-Agent?
3. What are the dependencies of 0D-Topology-Agent?

🤖 > How do I use r5rs:church-add?

**r5rs:church-add**

**Description:** R5RS function: church-add

**Examples:**
```
{"type": "r5rs-call", "function": "r5rs:church-add", "args": [2, 3]}
```

*Source: docs/05-Meta-Log/MULTIVERSE-CANVAS-RFC2119-SPEC.md*
```

## Integration

- Uses `KnowledgeBaseManager` for knowledge storage
- Used by `ConversationInterface` for interactive queries
- Can be integrated with any system that needs natural language queries
