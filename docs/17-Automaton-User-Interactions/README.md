---
id: automaton-user-interactions-readme
title: "Automaton User Interactions Documentation"
level: foundational
type: overview
tags: [user-interactions, natural-language-interface, conversation-management, api-integration]
keywords: [user-interactions, natural-language-interface, conversation-context, multi-turn-dialogue, agent-routing, api-integration]
prerequisites: [knowledge-extraction-propagation-readme]
enables: [metaverse-user-interactions-complete]
related: [agents-multi-agent-system, natural-language-interface-plan]
readingTime: 15
difficulty: 3
blackboard:
  status: active
  assignedAgent: "Query-Interface-Agent"
  lastUpdate: 2025-01-07
  dependencies: [document-knowledge-extractor, natural-language-query]
  watchers: []
---

# Automaton User Interactions Documentation

## Overview

This folder contains documentation for natural language user interactions with the Automaton multi-agent system, including conversation management, intent parsing, agent routing, and response generation.

## Documentation Structure

### Core Specification

- **`AUTOMATON-USER-INTERACTIONS-RFC2119-SPEC.md`**: Complete RFC2119 specification for user interactions
  - Conversation context management
  - Intent parsing and understanding
  - Multi-turn dialogue handling
  - Agent routing and coordination
  - Response generation
  - API specification
  - Error handling
  - Performance requirements

### Integration Documentation

- **`INTEGRATION_GUIDE.md`**: Complete integration guide
  - Backend API integration
  - Frontend service integration
  - UI component integration
  - Agent API integration (prepared)
  - Testing instructions
  - Troubleshooting guide

- **`INTEGRATION_COMPLETE.md`**: Integration status summary
  - Completed tasks
  - Architecture overview
  - Usage examples
  - Testing instructions

- **`API_DOCUMENTATION.md`**: REST API documentation
  - Endpoint specifications
  - Request/response formats
  - Error handling
  - Usage examples

## Key Components

### Conversation Context Manager

Manages conversation state, entity tracking, and reference resolution.

**Location**: `evolutions/natural-language-query/conversation-context-manager.ts`

**Key Features**:
- Conversation creation and management
- Turn tracking
- Entity reference resolution
- Context updates
- History management

### Enhanced Intent Parser

Parses natural language questions into structured intents with context awareness.

**Location**: `evolutions/natural-language-query/enhanced-intent-parser.ts`

**Key Features**:
- Intent parsing
- Entity extraction
- Reference resolution
- Intent refinement
- Clarification detection

### Dialogue Handler

Handles multi-turn dialogue and follow-up questions.

**Location**: `evolutions/natural-language-query/dialogue-handler.ts`

**Key Features**:
- Follow-up detection
- Context switching
- Clarification questions
- Follow-up suggestions

### Agent Router

Routes queries to appropriate agents and coordinates responses.

**Location**: `evolutions/natural-language-query/agent-router.ts`

**Key Features**:
- Query routing
- Agent matching
- Multi-agent coordination
- Response merging

### Response Generator

Generates formatted responses with citations.

**Location**: `evolutions/natural-language-query/enhanced-response-generator.ts`

**Key Features**:
- Response formatting
- Citation extraction
- Follow-up suggestions
- Multiple output formats

## API Endpoints

### POST /api/nl-query/ask

Ask a question using natural language.

```bash
curl -X POST http://localhost:3000/api/nl-query/ask \
  -H "Content-Type: application/json" \
  -d '{"question": "What agents are available?"}'
```

### GET /api/nl-query/history/:conversationId

Get conversation history.

### POST /api/nl-query/conversation

Create a new conversation.

### Other Endpoints

See `API_DOCUMENTATION.md` for complete endpoint list.

## Usage Examples

### Basic Usage

```typescript
import { nlQueryService } from '@/services/nl-query-service';

// Ask a question
const response = await nlQueryService.ask('What agents are available?');
console.log(response.answer);
console.log(response.citations);
console.log(response.followUpSuggestions);
```

### Multi-turn Conversation

```typescript
// First question
await nlQueryService.ask('Tell me about 4D-Network-Agent');

// Follow-up (maintains context)
const response = await nlQueryService.ask('What are its dependencies?');
console.log(response.answer); // Answers about 4D-Network-Agent dependencies
```

## Integration Status

✅ **Complete**:
- Conversation context management
- Intent parsing and understanding
- Multi-turn dialogue handling
- Agent routing and coordination
- Response generation
- Backend API integration
- Frontend service integration
- UI component integration
- API documentation
- Examples and guides

## Related Documentation

- **`docs/16-Knowledge-Extraction-Propagation/`**: Knowledge extraction and propagation
- **`docs/18-Metaverse-Portal-Interface/`**: Metaverse Portal Interface (chat messaging, avatars, 3D visualization)
- **`evolutions/natural-language-query/API.md`**: Complete API reference
- **`evolutions/natural-language-query/EXAMPLES.md`**: Usage examples
- **`AGENTS.md`**: Multi-agent system specification

## Quick Start

1. **Load Knowledge Base**: Ensure knowledge base is loaded
2. **Start Server**: Run `tsx ui-server.ts`
3. **Use API**: Query `/api/nl-query/ask` endpoint
4. **Use Service**: Import `nlQueryService` in UI components
5. **Integrate UI**: Use in AIPortal or create custom chat component

## Next Steps

1. **Testing**: Run integration tests
2. **Enhancements**: Add citation display, follow-up buttons
3. **Persistence**: Store conversations in database
4. **Real Agents**: Connect to actual agent APIs
