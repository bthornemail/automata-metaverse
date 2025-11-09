---
id: automaton-evolution-variant-specifications
title: "Evolution Variant Specifications"
level: practical
type: specification
tags: [automaton-evolution, variant-specifications, optimization-targets, llama-optimization, gpt-optimization]
keywords: [automaton-evolution, variant-specifications, llama3.2-variant, gpt-oss-variant, native-variant, fast-variant, optimization-targets]
prerequisites: [automaton-evolution-logging-readme]
enables: [automaton-evolution-testing-optimizing]
related: [automaton-evolution-architecture, automaton-evolution-workflow, canvasl-rfc2119-spec]
readingTime: 60
difficulty: 4
blackboard:
  status: active
  assignedAgent: "6D-Intelligence-Agent"
  lastUpdate: 2025-01-07
  dependencies: [automaton-evolution-logging, variant-generation]
  watchers: ["4D-Network-Agent"]
---

# Evolution Variant Specifications

## Overview

This document specifies the requirements and optimizations for each automaton evolution variant.

## Variant Types

### 1. automaton.llama3.2:latest.canvasl

**Target Environment:** Llama 3.2 inference

**Purpose:** Optimized for LLM-based execution via Llama 3.2 models

**Specifications:**

- **Object Limit:** Maximum 1000 objects
- **History Limit:** Maximum 200 execution history entries
- **Token Optimization:** Enabled
  - Truncate long text fields (max 200 characters)
  - Simplify object structure
  - Remove unnecessary metadata
- **Batch Processing:** Enabled
  - Group objects for batch inference
  - Optimize for parallel processing
- **Simplified Patterns:** Enabled
  - Remove complex nested structures
  - Focus on essential relationships

**Use Cases:**
- LLM-based automaton execution
- Token-efficient inference
- Batch processing workflows

**Performance Targets:**
- Token count: < 10,000 tokens per inference
- Processing time: < 5 seconds per batch
- Memory usage: < 500MB

### 2. automaton.gpt-oss:20b.canvasl

**Target Environment:** GPT-OSS 20B model

**Purpose:** Optimized for GPT-OSS 20B model execution

**Specifications:**

- **Object Limit:** Maximum 2000 objects
- **History Limit:** Maximum 500 execution history entries
- **Context Optimization:** Enabled
  - Optimize for context window limits
  - Structure for multi-turn conversations
  - Maintain conversation context
- **Function Calling:** Enabled
  - Support for function calling API
  - Structured function definitions
  - Parameter optimization

**Use Cases:**
- GPT-OSS 20B model execution
- Multi-turn conversations
- Function calling workflows

**Performance Targets:**
- Context window: < 32K tokens
- Response time: < 10 seconds
- Memory usage: < 1GB

### 3. automaton.native.canvasl

**Target Environment:** Native execution without LLM dependencies

**Purpose:** Full-featured automaton execution without LLM overhead

**Specifications:**

- **Object Limit:** No limit (Infinity)
- **History Limit:** No limit (Infinity)
- **R5RS Optimization:** Enabled
  - Direct R5RS function calls
  - Full Church encoding support
  - Complete execution history
- **No LLM Optimizations:** Disabled
  - No token optimization
  - No context optimization
  - Full object structure preserved

**Use Cases:**
- Direct automaton execution
- Full feature testing
- Complete evolution tracking

**Performance Targets:**
- Execution speed: Maximum performance
- Memory usage: Optimized but unlimited
- Feature completeness: 100%

### 4. automaton.fast.canvasl

**Target Environment:** Fast execution with reduced complexity

**Purpose:** Quick testing and development with minimal overhead

**Specifications:**

- **Object Limit:** Maximum 500 objects
- **History Limit:** Maximum 100 execution history entries
- **Simplified Patterns:** Enabled
  - Remove complex patterns
  - Focus on essential functionality
- **Reduced Validation:** Enabled
  - Skip non-critical validations
  - Fast execution path
  - Minimal error checking

**Use Cases:**
- Quick testing
- Development workflows
- Rapid iteration

**Performance Targets:**
- Execution time: < 1 second
- Memory usage: < 100MB
- Startup time: < 500ms

## Optimization Rules

### Token Optimization (LLM Variants)

1. **Text Truncation:**
   - Truncate text fields to 200 characters
   - Remove verbose descriptions
   - Simplify labels

2. **Structure Simplification:**
   - Remove nested objects
   - Flatten hierarchies
   - Remove metadata fields

3. **Batch Grouping:**
   - Group related objects
   - Optimize for batch processing
   - Reduce redundant data

### Context Optimization (GPT Variants)

1. **Context Window Management:**
   - Structure for context limits
   - Optimize conversation flow
   - Maintain essential context

2. **Multi-turn Support:**
   - Preserve conversation state
   - Optimize turn transitions
   - Maintain context continuity

3. **Function Calling:**
   - Structured function definitions
   - Parameter optimization
   - Response format optimization

### Performance Optimization (Native/Fast)

1. **Direct Execution:**
   - Direct R5RS function calls
   - No LLM overhead
   - Maximum performance

2. **Complexity Reduction (Fast):**
   - Remove complex patterns
   - Simplify execution paths
   - Minimize validation

## Validation Rules

### All Variants

- ✅ Valid CanvasL format
- ✅ Valid JSONL entries
- ✅ Required directives present
- ✅ No duplicate IDs (within variant)

### LLM Variants

- ✅ Token count within limits
- ✅ Batch processing compatible
- ✅ Simplified structure

### GPT Variants

- ✅ Context window compatible
- ✅ Function calling compatible
- ✅ Multi-turn compatible

### Native Variant

- ✅ Full feature set preserved
- ✅ R5RS compatibility
- ✅ Complete execution history

### Fast Variant

- ✅ Reduced complexity
- ✅ Fast execution path
- ✅ Minimal validation

## Generation Process

### 1. Load Base Automaton

```typescript
const canvas = await db.parseCanvasL('automaton.jsonl');
```

### 2. Apply Variant-Specific Optimizations

```typescript
const optimized = applyOptimizations(canvas, variantConfig);
```

### 3. Validate Variant

```typescript
await validateVariant(optimized, variantConfig);
```

### 4. Generate CanvasL File

```typescript
await generateCanvasL(optimized, `automaton.${variant.name}.canvasl`);
```

## Testing

### Unit Tests

- Test object limit enforcement
- Test history limit enforcement
- Test optimization application
- Test validation rules

### Integration Tests

- Test variant generation
- Test variant execution
- Test variant compatibility
- Test performance targets

### Performance Tests

- Measure token counts (LLM variants)
- Measure execution time (all variants)
- Measure memory usage (all variants)
- Measure startup time (fast variant)

## Maintenance

### Versioning

Variants are versioned with the base automaton:
- `automaton.llama3.2:latest.canvasl` - Always latest
- `automaton.gpt-oss:20b.canvasl` - Model-specific version
- `automaton.native.canvasl` - Native version
- `automaton.fast.canvasl` - Fast version

### Updates

Variants are regenerated:
- On evolution branch push
- On manual workflow trigger
- On variant specification changes

### Compatibility

Variants maintain compatibility with:
- Base automaton format
- Meta-Log-Db parser
- CanvasL specification
- R5RS engine

## Related Documentation

- **`README.md`** - Evolution logging overview
- **`ARCHITECTURE.md`** - System architecture
- **`WORKFLOW_GUIDE.md`** - Workflow usage guide
- **`docs/04-CanvasL/`** - CanvasL specification
- **`docs/07-Meta-Log-Db/`** - Meta-Log-Db documentation
