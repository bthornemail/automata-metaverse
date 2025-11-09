# Obsidian Frontmatter Knowledge Model

Evaluates document frontmatter to build knowledge graphs and understanding based on the Meta-Log Plugin's frontmatter structure.

## Overview

This model analyzes Obsidian markdown documents with frontmatter to:
- Build knowledge graphs of document relationships
- Evaluate document completeness and metadata quality
- Check relationship integrity (prerequisites, enables, related)
- Generate reports on knowledge structure

## Frontmatter Structure

Based on the Meta-Log Plugin, documents should have:

```yaml
---
id: unique-identifier
title: "Document Title"
level: gateway | foundational | practical | applied
type: navigation | concept | implementation | guide | specification | documentation
tags: [categorization]
keywords: [indexing]
prerequisites: [node-ids-needed-first]
enables: [node-ids-this-unlocks]
related: [related-node-ids]
readingTime: 10
difficulty: 1-5
blackboard:
  status: active | processing | completed
  assignedAgent: null | "agent-name"
  lastUpdate: timestamp
  dependencies: []
  watchers: []
---
```

## Features

### 1. Knowledge Graph Building

- Parses all markdown files in a vault
- Extracts frontmatter metadata
- Builds relationship graphs (prerequisites, enables, related)
- Tracks document structure and metadata

### 2. Understanding Evaluation

For each document, evaluates:
- **Completeness**: Presence of required fields (id, title, level, type)
- **Metadata Quality**: Presence of recommended fields (tags, keywords, etc.)
- **Relationship Integrity**: Whether referenced documents exist
- **Missing Fields**: List of required fields that are missing
- **Broken Links**: References to non-existent documents

### 3. Statistics Generation

Generates statistics on:
- Total documents
- Distribution by level and type
- Completeness distribution
- Relationship integrity score
- Documents needing attention

## Usage

### Command Line

```bash
tsx evolutions/obsidian-frontmatter-knowledge-model.ts /path/to/vault
```

### Programmatic

```typescript
import { ObsidianFrontmatterKnowledgeModel } from './obsidian-frontmatter-knowledge-model';

const model = new ObsidianFrontmatterKnowledgeModel('/path/to/vault');
const graph = await model.buildKnowledgeGraph();

// Generate report
console.log(model.generateReport());

// Export JSON
const json = model.exportJSON();
fs.writeFileSync('knowledge-graph.json', json);
```

## Output

### Console Report

Generates a markdown report showing:
- Overview statistics
- Documents by level and type
- Completeness distribution
- Documents needing attention (incomplete or broken links)
- Relationship graph summary

### JSON Export

Exports complete knowledge graph as JSON:
- All nodes with full metadata
- All edges (relationships)
- Statistics
- Timestamp

## Example Output

```
# Obsidian Frontmatter Knowledge Model Report

Generated: 2025-01-07T12:00:00.000Z

## Overview

- **Total Documents**: 150
- **Average Completeness**: 78.5%
- **Relationship Integrity**: 92.3%
- **Broken Links**: 12 / 156

## Documents by Level

- **foundational**: 45
- **practical**: 60
- **applied**: 30
- **gateway**: 15

## Documents Needing Attention

### Missing Prerequisites (doc-id-123)
- **Completeness**: 45.0%
- **Missing Fields**: id, level
- **Broken Prerequisites**: non-existent-doc-1, non-existent-doc-2
...
```

## Integration with Meta-Log Plugin

This model is designed to work with:
- `plugin/meta-log-plugin`: Obsidian plugin for Meta-Log
- `docs/06-Meta-Log-Adapters/02-Meta-Log-Plugin/`: Plugin documentation
- Obsidian Bases parser for structured data

## Related Documentation

- `docs/06-Meta-Log-Adapters/02-Meta-Log-Plugin/OBSIDIAN_BASES.md`: Obsidian Bases integration
- `docs/06-Meta-Log-Adapters/02-Meta-Log-Plugin/OBSIDIAN_FUNCTIONS.md`: Obsidian functions
- `plugin/meta-log-plugin/src/views/bases-parser.ts`: Bases parser implementation
