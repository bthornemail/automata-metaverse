# Learning Patterns, Document Knowledge Extraction, and Natural Language Conversation System

## Overview

This system implements three integrated components:

1. **Document Knowledge Extraction**: Extracts facts, rules, agents, and functions from documentation
2. **Learning Pattern System**: Tracks execution patterns and learns from automaton behavior
3. **Natural Language Query**: Enables natural language queries about system knowledge

## Components

### 1. Document Knowledge Extractor

**Location**: `evolutions/document-knowledge-extractor/`

**Purpose**: Extract structured knowledge from markdown documentation

**Features**:
- Parses markdown files with frontmatter
- Extracts RFC2119 rules (MUST, SHOULD, MAY statements)
- Extracts agent definitions from AGENTS.md
- Extracts function signatures and R5RS calls
- Extracts code examples
- Builds knowledge graph with relationships
- Stores in JSONL format (`knowledge-base.jsonl`)

**Usage**:
```bash
# Extract knowledge from docs
tsx evolutions/document-knowledge-extractor/extract-docs.ts ./docs ./knowledge-base.jsonl
```

**Files**:
- `document-knowledge-extractor.ts`: Main extractor class
- `knowledge-base.ts`: Knowledge base storage and querying
- `extract-docs.ts`: CLI script for extraction

### 2. Learning Automaton

**Location**: `evolutions/learning-automaton/`

**Purpose**: Track execution patterns and learn from automaton behavior

**Features**:
- Extends `MemoryOptimizedAutomaton` with learning capabilities
- Tracks modification patterns (success/failure rates, memory usage, execution time)
- Tracks execution patterns (action sequences, outcomes, performance)
- Learns which patterns work best for each dimension
- Stores learned patterns in `learned-patterns.jsonl`
- Uses learned patterns to guide future modifications

**Usage**:
```typescript
import { LearningAutomaton } from './evolutions/learning-automaton/learning-automaton';

const automaton = new LearningAutomaton('./automaton.jsonl', {
  enableLearning: true,
  patternFile: './learned-patterns.jsonl'
});

// Execute actions (learning happens automatically)
automaton.executeAction();

// Get learning statistics
const stats = automaton.getLearningStats();
automaton.saveLearnedPatterns();
```

**Files**:
- `learning-automaton.ts`: Learning automaton implementation
- `pattern-tracker.ts`: Pattern tracking and learning logic

### 3. Natural Language Query System

**Location**: `evolutions/natural-language-query/`

**Purpose**: Enable natural language queries about system knowledge

**Features**:
- Parses natural language questions
- Converts to structured queries (agent, function, rule, fact, example)
- Queries knowledge base
- Formats answers in natural language
- Provides follow-up question suggestions
- Interactive conversation interface

**Usage**:
```bash
# Interactive CLI mode
tsx evolutions/natural-language-query/conversation-interface.ts ./knowledge-base.jsonl
```

**Example Queries**:
- "What agents are available?"
- "How do I use r5rs:church-add?"
- "What are the MUST requirements?"
- "Show me an example"

**Files**:
- `nl-query-engine.ts`: Natural language query engine
- `conversation-interface.ts`: Interactive conversation interface

### 4. Variant-Specific File Generation

**Location**: `generate-variant-automaton-files.ts`

**Purpose**: Generate unique `automaton.canvasl` files for each variant

**Features**:
- Starts with base template (`automaton.fast.canvasl`)
- Applies variant-specific customizations
- Includes learned patterns for that variant
- Adds variant-specific facts/rules from knowledge base
- Generates unique files for each variant:
  - `advanced-automaton`
  - `automaton-runner`
  - `automaton-memory-optimized`
  - `automaton-evolved`
  - `automaton-scalable`
  - `continuous-automaton`
  - `ollama-automaton`

**Usage**:
```bash
# Generate variant files
tsx generate-variant-automaton-files.ts automaton.fast.canvasl ./knowledge-base.jsonl
```

## Workflow

### Step 1: Extract Documentation Knowledge

```bash
# Extract facts, rules, agents, functions from docs
tsx evolutions/document-knowledge-extractor/extract-docs.ts ./docs ./knowledge-base.jsonl
```

This creates `knowledge-base.jsonl` with:
- Facts from documentation
- RFC2119 rules
- Agent definitions
- Function signatures
- Relationships

### Step 2: Run Learning Automaton

```typescript
// Run automaton with learning enabled
const automaton = new LearningAutomaton('./automaton.jsonl', {
  enableLearning: true,
  patternFile: './learned-patterns.jsonl'
});

// Execute actions (patterns are tracked automatically)
for (let i = 0; i < 1000; i++) {
  automaton.executeAction();
}

// Save learned patterns
automaton.saveLearnedPatterns();
```

This creates `learned-patterns.jsonl` with:
- Modification patterns (success rates, memory usage)
- Execution patterns (action sequences, outcomes)
- Learned patterns (high-confidence patterns)

### Step 3: Generate Variant-Specific Files

```bash
# Generate unique automaton.canvasl for each variant
tsx generate-variant-automaton-files.ts automaton.fast.canvasl ./knowledge-base.jsonl
```

This generates variant-specific `automaton.canvasl` files with:
- Variant-specific customizations
- Learned patterns for that variant
- Relevant facts/rules from knowledge base

### Step 4: Query Knowledge Base

```bash
# Interactive natural language queries
tsx evolutions/natural-language-query/conversation-interface.ts ./knowledge-base.jsonl
```

Ask questions like:
- "What agents are available?"
- "How do I use r5rs:church-add?"
- "What are the requirements for 5D-Consensus-Agent?"

## Integration Points

### With Existing Systems

1. **Obsidian Frontmatter Knowledge Model**: Document extractor extends this for enhanced extraction
2. **MemoryOptimizedAutomaton**: Learning automaton extends this for memory optimization
3. **Knowledge Base**: Used by NL query engine and variant generator
4. **Pattern Tracker**: Used by learning automaton and variant generator

### Data Flow

```
Documentation (Markdown)
    ↓
Document Knowledge Extractor
    ↓
Knowledge Base (knowledge-base.jsonl)
    ↓
    ├─→ Natural Language Query Engine
    │       ↓
    │   Conversation Interface
    │
    └─→ Variant File Generator
            ↓
        Variant-Specific automaton.canvasl

Automaton Execution
    ↓
Learning Automaton
    ↓
Pattern Tracker
    ↓
Learned Patterns (learned-patterns.jsonl)
    ↓
Variant File Generator
    ↓
Variant-Specific automaton.canvasl
```

## Success Criteria

✅ **Each variant loads unique `automaton.canvasl`** with variant-specific content  
✅ **Automaton learns from execution** and adapts modification patterns  
✅ **System can answer natural language questions** about documentation  
✅ **Knowledge base contains facts/rules** from all docs  
✅ **Learned patterns improve automaton performance** over time

## Next Steps

1. **Test Document Extraction**: Run extractor on docs directory
2. **Test Learning Automaton**: Run automaton with learning enabled
3. **Test Variant Generation**: Generate variant-specific files
4. **Test NL Queries**: Try natural language queries
5. **Integrate with Existing Tests**: Update snapshot tests to use variant-specific files

## Files Created

### Document Knowledge Extractor
- `evolutions/document-knowledge-extractor/document-knowledge-extractor.ts`
- `evolutions/document-knowledge-extractor/knowledge-base.ts`
- `evolutions/document-knowledge-extractor/extract-docs.ts`
- `evolutions/document-knowledge-extractor/README.md`

### Learning Automaton
- `evolutions/learning-automaton/learning-automaton.ts`
- `evolutions/learning-automaton/pattern-tracker.ts`
- `evolutions/learning-automaton/README.md`

### Natural Language Query
- `evolutions/natural-language-query/nl-query-engine.ts`
- `evolutions/natural-language-query/conversation-interface.ts`
- `evolutions/natural-language-query/README.md`

### Variant Generation
- `generate-variant-automaton-files.ts`

## Dependencies

- `js-yaml`: For parsing frontmatter (may need to add to package.json)
- `readline`: For interactive CLI (built-in Node.js)
- Existing: `obsidian-frontmatter-knowledge-model.ts`, `MemoryOptimizedAutomaton`
