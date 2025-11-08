# Document Knowledge Extractor

Extracts facts, rules, agents, functions, and relationships from markdown documentation to build a queryable knowledge base.

## Overview

The Document Knowledge Extractor system:
- Parses markdown files with frontmatter
- Extracts RFC2119 rules (MUST, SHOULD, MAY, etc.)
- Extracts agent definitions from AGENTS.md
- Extracts function signatures and R5RS calls
- Extracts code examples
- Builds knowledge graph with relationships
- Stores in JSONL format for querying

## Usage

### Extract Knowledge from Documentation

```bash
# Extract from docs directory, output to knowledge-base.jsonl
tsx evolutions/document-knowledge-extractor/extract-docs.ts ./docs ./knowledge-base.jsonl

# Use default paths (./docs -> ./knowledge-base.jsonl)
tsx evolutions/document-knowledge-extractor/extract-docs.ts
```

### Programmatic Usage

```typescript
import { DocumentKnowledgeExtractor } from './evolutions/document-knowledge-extractor/document-knowledge-extractor';

const extractor = new DocumentKnowledgeExtractor('./docs');
await extractor.extractAll();

const knowledgeBase = extractor.getKnowledgeBase();
const jsonl = knowledgeBase.exportToJSONL();
fs.writeFileSync('knowledge-base.jsonl', jsonl);
```

## Knowledge Base Structure

The knowledge base contains:

- **Facts**: Definitions, requirements, examples, capabilities
- **Rules**: RFC2119 rules (MUST, SHOULD, MAY statements)
- **Agents**: Agent definitions with capabilities and dependencies
- **Functions**: Function signatures and examples
- **Relationships**: Prerequisites, enables, related links

## Integration

- Extends `ObsidianFrontmatterKnowledgeModel` for frontmatter parsing
- Integrates with `KnowledgeBaseManager` for storage
- Used by `NLQueryEngine` for natural language queries
- Used by `generate-variant-automaton-files.ts` for variant customization
