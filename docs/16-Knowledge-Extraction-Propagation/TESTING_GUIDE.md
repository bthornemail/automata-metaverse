---
id: testing-guide
title: "Natural Language Interface Testing Guide"
level: practical
type: guide
tags: [testing, natural-language-interface, test-guide]
keywords: [testing, test-guide, unit-tests, integration-tests, natural-language-interface]
prerequisites: [nl-interface-implementation]
enables: []
related: []
readingTime: 15
difficulty: 3
blackboard:
  status: active
  assignedAgent: "6D-Intelligence-Agent"
  lastUpdate: 2025-01-07
  dependencies: [natural-language-query]
  watchers: []
---

# Natural Language Interface Testing Guide

## Overview

Comprehensive test suite for the Natural Language Interface system, covering all components with unit tests and integration tests.

## Test Structure

```
evolutions/natural-language-query/
├── __tests__/
│   ├── conversation-context-manager.test.ts
│   ├── enhanced-intent-parser.test.ts
│   ├── dialogue-handler.test.ts
│   ├── agent-router.test.ts
│   ├── enhanced-conversation-interface.test.ts
│   └── run-tests.ts
├── jest.config.js
└── package.json
```

## Running Tests

### Prerequisites

Install dependencies:
```bash
cd evolutions/natural-language-query
npm install
```

### Run All Tests

```bash
npm test
```

### Run Tests in Watch Mode

```bash
npm run test:watch
```

### Run Tests with Coverage

```bash
npm run test:coverage
```

### Run Specific Test File

```bash
npx jest conversation-context-manager.test.ts
```

## Test Coverage

### 1. Conversation Context Manager Tests

**File**: `conversation-context-manager.test.ts`

**Coverage**:
- ✅ Conversation creation
- ✅ Adding turns
- ✅ Entity tracking
- ✅ Reference resolution ("it", "that agent")
- ✅ History management
- ✅ Context export/import

**Key Tests**:
- Creates conversation with correct structure
- Adds turns and updates context
- Resolves entity references correctly
- Trims history when exceeding max size
- Exports and imports context correctly

### 2. Enhanced Intent Parser Tests

**File**: `enhanced-intent-parser.test.ts`

**Coverage**:
- ✅ Intent parsing
- ✅ Agent name extraction
- ✅ Reference resolution
- ✅ Context-aware refinement
- ✅ Query expansion
- ✅ Clarification detection

**Key Tests**:
- Parses agent queries correctly
- Extracts agent names from questions
- Resolves references in follow-ups
- Refines intent with context
- Expands queries appropriately

### 3. Dialogue Handler Tests

**File**: `dialogue-handler.test.ts`

**Coverage**:
- ✅ Turn handling
- ✅ Follow-up detection
- ✅ Clarification questions
- ✅ Context switching
- ✅ Follow-up suggestions

**Key Tests**:
- Handles simple questions
- Detects follow-up questions
- Asks for clarification when needed
- Generates follow-up suggestions
- Detects context switches

### 4. Agent Router Tests

**File**: `agent-router.test.ts`

**Coverage**:
- ✅ Query routing
- ✅ Agent matching
- ✅ Dimension-based routing
- ✅ Response coordination
- ✅ Response merging

**Key Tests**:
- Routes agent queries correctly
- Routes by dimension
- Routes function queries
- Coordinates multi-agent responses
- Falls back appropriately

### 5. Enhanced Conversation Interface Tests

**File**: `enhanced-conversation-interface.test.ts`

**Coverage**:
- ✅ End-to-end conversations
- ✅ Follow-up questions
- ✅ Citations
- ✅ Follow-up suggestions
- ✅ Conversation management
- ✅ Context awareness

**Key Tests**:
- Answers agent questions
- Handles follow-up questions
- Includes citations
- Generates follow-up suggestions
- Maintains conversation history
- Resolves entity references

## Test Data

Tests use mock data from `KnowledgeBaseManager` with:
- Test agents (4D-Network-Agent, 5D-Consensus-Agent, etc.)
- Test facts
- Test rules
- Test functions

## Writing New Tests

### Example Test Structure

```typescript
describe('ComponentName', () => {
  let component: Component;

  beforeEach(() => {
    // Setup
    component = new Component();
  });

  describe('methodName', () => {
    it('should do something', () => {
      // Arrange
      const input = 'test';
      
      // Act
      const result = component.methodName(input);
      
      // Assert
      expect(result).toBeDefined();
      expect(result).toBe('expected');
    });
  });
});
```

### Best Practices

1. **Isolation**: Each test should be independent
2. **Setup/Teardown**: Use `beforeEach` and `afterEach`
3. **Descriptive Names**: Test names should describe what they test
4. **Arrange-Act-Assert**: Follow AAA pattern
5. **Mock External Dependencies**: Mock knowledge base, file system, etc.

## Continuous Integration

### GitHub Actions Example

```yaml
name: Test Natural Language Interface

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: cd evolutions/natural-language-query && npm install
      - run: cd evolutions/natural-language-query && npm test
      - run: cd evolutions/natural-language-query && npm run test:coverage
```

## Coverage Goals

- **Unit Tests**: > 80% coverage
- **Integration Tests**: > 70% coverage
- **Critical Paths**: 100% coverage

## Troubleshooting

### Tests Failing

1. **Check Knowledge Base**: Ensure test data is loaded
2. **Check Dependencies**: Ensure all dependencies are installed
3. **Check TypeScript**: Ensure TypeScript compiles correctly
4. **Check Mock Data**: Verify mock data matches expected structure

### Common Issues

1. **Import Errors**: Check module paths
2. **Type Errors**: Ensure types match
3. **Async Errors**: Use `async/await` correctly
4. **Mock Errors**: Verify mocks are set up correctly

## Next Steps

1. ✅ **Tests Created**: All test files created
2. 🔄 **Run Tests**: Execute tests to verify functionality
3. 📋 **Add More Tests**: Add edge case tests
4. 📋 **CI Integration**: Add to CI/CD pipeline
5. 📋 **Coverage Reports**: Generate and review coverage

## Related Documentation

- `NL_INTERFACE_IMPLEMENTATION.md`: Implementation details
- `NATURAL_LANGUAGE_INTERFACE_PLAN.md`: Original plan
- `README.md`: Natural Language Query overview
