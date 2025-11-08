---
id: knowledge-extraction-propagation-quick-start
title: "Quick Start Guide"
level: practical
type: guide
tags: [quick-start, natural-language, metaverse, getting-started]
keywords: [quick-start, natural-language-interface, metaverse-getting-started]
prerequisites: [knowledge-extraction-propagation-readme]
enables: []
related: []
readingTime: 10
difficulty: 2
blackboard:
  status: active
  assignedAgent: "Query-Interface-Agent"
  lastUpdate: 2025-01-07
  dependencies: []
  watchers: []
---

# Quick Start Guide

## Overview

This phase builds a full metaverse with natural language interfacing between humans and agents. Start here to understand the plan and begin implementation.

## Current State

✅ **What Works**:
- Knowledge extraction: 1263 facts, 164 rules, 15 agents, 92 functions
- Basic NL queries: "What agents are available?"
- Multi-agent system: 15 agents across 0D-7D dimensions
- Automaton evolution: Self-modifying with snapshots

🔄 **What We're Building**:
- Enhanced NL interface with conversation context
- Multi-turn dialogue support
- Agent coordination for complex queries
- Natural response generation

## Quick Start Steps

### Step 1: Understand the Vision

Read `README.md` to understand:
- Phase goals and vision
- Metaverse architecture
- Current state assessment

### Step 2: Review the Plan

Read `METAVERSE_CONSTRUCTION_PLAN.md` to see:
- 5-phase implementation roadmap
- Component architecture
- Timeline and deliverables

### Step 3: Start with Natural Language Interface

Read `NATURAL_LANGUAGE_INTERFACE_PLAN.md` for:
- Detailed implementation plan
- Code examples
- Week-by-week tasks

### Step 4: Begin Implementation

**Week 1 Tasks**:
1. Create `conversation-context-manager.ts`
2. Implement conversation tracking
3. Add context management
4. Write unit tests

**Code Template**:
```typescript
// conversation-context-manager.ts
interface ConversationContext {
  conversationId: string;
  userId: string;
  turns: ConversationTurn[];
  entities: Map<string, Entity>;
  currentIntent: QueryIntent | null;
}

class ConversationContextManager {
  createConversation(userId: string): ConversationContext {
    // Implementation
  }
  
  addTurn(conversationId: string, turn: ConversationTurn): void {
    // Implementation
  }
  
  getContext(conversationId: string): ConversationContext {
    // Implementation
  }
}
```

## Key Files to Create

### Week 1
- `src/conversation/conversation-context-manager.ts`
- `src/conversation/types.ts`
- `tests/conversation-context-manager.test.ts`

### Week 2
- `src/nl/enhanced-intent-parser.ts`
- `src/nl/dialogue-handler.ts`
- `tests/nl/*.test.ts`

### Week 3-4
- `src/agents/agent-router.ts`
- `src/agents/agent-coordinator.ts`
- `src/response/response-generator.ts`

## Testing

```bash
# Run tests
npm test

# Run specific test
npm test -- conversation-context-manager

# Watch mode
npm test -- --watch
```

## Next Steps

1. ✅ Read `README.md` - Understand phase goals
2. ✅ Read `METAVERSE_CONSTRUCTION_PLAN.md` - See full roadmap
3. ✅ Read `NATURAL_LANGUAGE_INTERFACE_PLAN.md` - Start implementation
4. 🔄 Implement conversation context manager
5. 🔄 Enhance intent parser
6. 🔄 Build dialogue handler

## Resources

- **Knowledge Extraction**: `evolutions/document-knowledge-extractor/`
- **NL Query Engine**: `evolutions/natural-language-query/`
- **Multi-Agent System**: `AGENTS.md`
- **Previous Phase**: `docs/15-Automaton-Evolution-Testing-Optimizing/`

## Questions?

- Check `STATUS.md` for current progress
- Review `PHASE_SUMMARY.md` for overview
- See `METAVERSE_CONSTRUCTION_PLAN.md` for detailed plan
