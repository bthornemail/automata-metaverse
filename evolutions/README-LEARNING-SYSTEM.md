# Learning Patterns, Document Knowledge Extraction, and Natural Language Conversation System

This document describes the complete learning system that enables automaton variants to learn from execution patterns, extract knowledge from documentation, and answer natural language questions.

## Overview

The learning system consists of four main components:

1. **Document Knowledge Extractor**: Extracts facts, rules, agents, and functions from markdown documentation
2. **Knowledge Base Storage**: Stores and queries extracted knowledge
3. **Learning Automaton**: Tracks execution patterns and learns from history
4. **Natural Language Query Engine**: Converts NL questions to structured queries

## Components

### 1. Document Knowledge Extractor

**Location**: `evolutions/document-knowledge-extractor/`

Extracts knowledge from markdown documentation files:

- **Facts**: Definitions, requirements, capabilities
- **Rules**: RFC2119 keywords (MUST, SHOULD, MAY) as rules
- **Agents**: Agent definitions from AGENTS.md
- **Functions**: Function signatures and R5RS calls
- **Code Examples**: Code blocks from documentation

**Usage**:
```bash
# Extract knowledge from docs directory
tsx evolutions/document-knowledge-extractor/extract-docs.ts ./docs ./knowledge-base.jsonl
```

**Files**:
- `document-knowledge-extractor.ts`: Main extractor class
- `knowledge-base.ts`: Storage and query interface
- `extract-docs.ts`: CLI script

### 2. Knowledge Base Storage

**Location**: `evolutions/document-knowledge-extractor/knowledge-base.ts`

Stores extracted knowledge in queryable format:

- Loads/saves from JSONL files
- Queries by type, source, keyword, dimension, RFC2119 keyword
- Provides statistics and aggregations

**Usage**:
```typescript
import { KnowledgeBaseStorage } from './evolutions/document-knowledge-extractor/knowledge-base';

const kb = KnowledgeBaseStorage.loadFromFile('knowledge-base.jsonl');

// Query agents
const agents = kb.query({ type: ['agent'], dimension: '5D' });

// Query rules
const mustRules = kb.query({ type: ['rule'], rfc2119Keyword: 'MUST' });

// Get statistics
const stats = kb.getStatistics();
```

### 3. Learning Automaton

**Location**: `evolutions/learning-automaton/`

Extends `MemoryOptimizedAutomaton` with learning capabilities:

- Tracks execution patterns and frequencies
- Learns which modifications lead to better outcomes
- Adapts modification patterns based on history
- Stores learned patterns in `learned-patterns.jsonl`

**Usage**:
```typescript
import { LearningAutomaton } from './evolutions/learning-automaton/learning-automaton';

const automaton = new LearningAutomaton('automaton.canvasl', {
  enableLearning: true,
  patternFile: 'learned-patterns.jsonl',
  minPatternConfidence: 0.5
});

// Run automaton - patterns are tracked automatically
automaton.run(20);

// Get learning statistics
const stats = automaton.getLearningStats();

// Save learned patterns
automaton.saveLearnedPatterns();
```

**Files**:
- `learning-automaton.ts`: Learning automaton implementation
- `pattern-tracker.ts`: Pattern tracking and learning logic

### 4. Natural Language Query Engine

**Location**: `evolutions/natural-language-query/`

Converts natural language questions to structured queries:

- Parses NL questions to detect intent (agent, function, rule, fact, example)
- Queries knowledge base
- Formats answers in natural language
- Provides follow-up suggestions

**Usage**:
```typescript
import { NLQueryEngine } from './evolutions/natural-language-query/nl-query-engine';
import { KnowledgeBaseStorage } from './evolutions/document-knowledge-extractor/knowledge-base';

const kb = KnowledgeBaseStorage.loadFromFile('knowledge-base.jsonl');
const queryEngine = new NLQueryEngine(kb);

// Query using natural language
const response = await queryEngine.query('What agents are available?');
console.log(response.answer);
console.log(response.sources);
```

**Interactive Interface**:
```bash
# Start interactive NL query interface
tsx evolutions/natural-language-query/conversation-interface.ts knowledge-base.jsonl
```

**Files**:
- `nl-query-engine.ts`: NL query parsing and execution
- `conversation-interface.ts`: Interactive chat interface

## Variant-Specific Automaton Files

**Location**: `generate-variant-automaton-files.ts`

Generates unique `automaton.canvasl` files for each variant:

- Starts with base template (`automaton.fast.canvasl`)
- Adds variant-specific modifications
- Includes learned patterns for that variant
- Adds variant-specific facts/rules from knowledge base

**Usage**:
```bash
# Generate all variant files
tsx generate-variant-automaton-files.ts

# Generate specific variant
tsx generate-variant-automaton-files.ts advanced-automaton
```

**Variants**:
- `advanced-automaton`: Church encoding patterns
- `automaton-runner`: Execution patterns
- `automaton-memory-optimized`: Memory-efficient patterns
- `automaton-evolved`: Evolution-specific learned patterns
- `automaton-scalable`: Scalability patterns
- `continuous-automaton`: Continuous execution patterns
- `ollama-automaton`: AI-powered patterns

## Integration

**Location**: `integrate-learning-system.ts`

Integrates all systems together:

1. Extracts knowledge from documentation
2. Generates variant-specific automaton files
3. Shows knowledge base statistics
4. Demonstrates NL queries

**Usage**:
```bash
# Run full integration
tsx integrate-learning-system.ts

# Start NL query interface
tsx integrate-learning-system.ts query
```

## Workflow

### Step 1: Extract Knowledge

```bash
# Extract knowledge from documentation
tsx evolutions/document-knowledge-extractor/extract-docs.ts ./docs ./knowledge-base.jsonl
```

This creates `knowledge-base.jsonl` with:
- Facts from all markdown files
- RFC2119 rules (MUST, SHOULD, MAY)
- Agent definitions from AGENTS.md
- Function signatures and R5RS calls
- Code examples

### Step 2: Generate Variant Files

```bash
# Generate variant-specific automaton files
tsx generate-variant-automaton-files.ts
```

This creates unique `automaton.canvasl` files for each variant in:
- `evolutions/advanced-automaton/automaton.canvasl`
- `evolutions/automaton-runner/automaton.canvasl`
- `evolutions/automaton-memory-optimized/automaton.canvasl`
- etc.

### Step 3: Run Learning Automaton

```typescript
import { LearningAutomaton } from './evolutions/learning-automaton/learning-automaton';

const automaton = new LearningAutomaton('evolutions/automaton-memory-optimized/automaton.canvasl');
automaton.run(100); // Run 100 steps, tracking patterns
automaton.saveLearnedPatterns(); // Save learned patterns
```

This creates `learned-patterns.jsonl` with:
- Execution patterns
- Success rates
- Memory usage patterns
- Modification patterns

### Step 4: Query Knowledge

```bash
# Interactive NL query interface
tsx integrate-learning-system.ts query
```

Or programmatically:
```typescript
const kb = KnowledgeBaseStorage.loadFromFile('knowledge-base.jsonl');
const queryEngine = new NLQueryEngine(kb);

const response = await queryEngine.query('What is the 5D-Consensus-Agent?');
console.log(response.answer);
```

## Example Queries

**Agents**:
- "What agents are available?"
- "What is the 5D-Consensus-Agent?"
- "What agents are in dimension 4D?"

**Functions**:
- "How do I use r5rs:church-add?"
- "What functions are available?"
- "Show me examples of r5rs functions"

**Rules**:
- "What are the requirements for SHACL validation?"
- "What MUST agents do?"
- "Show me all MUST rules"

**General**:
- "What is the multi-agent system?"
- "Explain Church encoding"
- "How does the blackboard architecture work?"

## File Structure

```
evolutions/
├── document-knowledge-extractor/
│   ├── document-knowledge-extractor.ts
│   ├── knowledge-base.ts
│   └── extract-docs.ts
├── learning-automaton/
│   ├── learning-automaton.ts
│   └── pattern-tracker.ts
├── natural-language-query/
│   ├── nl-query-engine.ts
│   └── conversation-interface.ts
└── README-LEARNING-SYSTEM.md

generate-variant-automaton-files.ts
integrate-learning-system.ts
knowledge-base.jsonl (generated)
learned-patterns.jsonl (generated per variant)
```

## Success Criteria

✅ **Each variant loads unique `automaton.canvasl`** with variant-specific content  
✅ **Automaton learns from execution** and adapts modification patterns  
✅ **System can answer natural language questions** about documentation  
✅ **Knowledge base contains facts/rules** from all docs  
✅ **Learned patterns improve automaton performance** over time

## Next Steps

1. Run variants with learning automaton to track patterns
2. Use NL query interface to explore knowledge base
3. Generate variant files with learned patterns
4. Integrate learning into automaton execution workflows
5. Enhance NL query engine with more sophisticated parsing

## References

- `AGENTS.md`: Multi-agent system specification
- `docs/`: Documentation files analyzed by knowledge extractor
- `evolutions/obsidian-frontmatter-knowledge-model/`: Frontmatter knowledge model
- `evolutions/advanced-automaton/`: Base automaton implementation
