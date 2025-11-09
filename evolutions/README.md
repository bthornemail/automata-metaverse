# Automaton Evolutions

This folder contains different evolution variants of the automaton system, each organized in its own directory with models and documentation.

## Structure

Each automaton evolution has its own folder with:
- **Main TypeScript file**: The automaton implementation
- **`models/`**: Model files and configurations
- **`docs/`**: Documentation specific to that evolution

## Available Evolutions

### 1. `advanced-automaton/`
**Base automaton with provenance-aware deduplication**

Core implementation with:
- Provenance-aware deduplication (federated provenance compliance)
- Self-reference tracking
- Execution history management
- Memory optimization

### 2. `automaton-runner/`
**Basic automaton runner**

Simple runner for demonstrations and testing.

### 3. `automaton-memory-optimized/`
**Memory-optimized variant**

Extends `advanced-automaton` with:
- GC triggers
- Object trimming
- Execution history limits
- Memory pressure monitoring

### 4. `automaton-evolved/`
**Evolved variant with dimension progression**

Extends `automaton-memory-optimized` with:
- Dimension progression (no 0D lock)
- Increased modification frequency
- Phase 4 growth monitoring

### 5. `automaton-scalable/`
**Scalable variant with multi-core support**

Extends `automaton-memory-optimized` with:
- GPU acceleration support
- Multi-core parallelization
- Dynamic scaling based on resources

### 6. `continuous-automaton/`
**Continuous execution runner**

Uses `advanced-automaton` for:
- Continuous execution loops
- Smart action selection
- Status monitoring

### 7. `ollama-automaton/`
**AI-powered automaton with Ollama**

Uses `advanced-automaton` with:
- Ollama integration for AI decisions
- OpenAI-compatible API support
- Model selection and fallback

## Obsidian Frontmatter Knowledge Model

**`obsidian-frontmatter-knowledge-model.ts`**

Evaluates document frontmatter to build knowledge graphs:
- Analyzes document structure (id, title, level, type)
- Tracks relationships (prerequisites, enables, related)
- Evaluates metadata quality
- Checks relationship integrity
- Generates knowledge reports

### Usage

```bash
tsx evolutions/obsidian-frontmatter-knowledge-model.ts /path/to/vault
```

This will:
1. Scan all markdown files in the vault
2. Parse frontmatter from each document
3. Build a knowledge graph of relationships
4. Evaluate understanding and completeness
5. Generate a report and export JSON

## Common Features

All automatons share:
- ✅ Provenance-aware deduplication
- ✅ Self-reference tracking
- ✅ Memory leak fixes
- ✅ Federated provenance compliance

## Related Documentation

- `PROVENANCE_DEDUPLICATION_ALL_AUTOMATONS.md`: Provenance implementation details
- `DEDUPLICATION_PROVENANCE_EVALUATION.md`: Evaluation of deduplication approaches
- `docs/13-Federated-Provenance-Meta-Log/`: Federated provenance specification
- `AGENTS.md`: Multi-agent system documentation
