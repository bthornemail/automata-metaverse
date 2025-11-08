# Automaton Evolution Logging

This folder documents the automaton evolution logging system, which tracks self-modification patterns, memory usage, and generates optimized automaton variants using Meta-Log-Db.

## Overview

The automaton evolution logging system captures snapshots of automaton state during self-modification, analyzes memory patterns, and generates optimized variants for different execution environments:

- **`automaton.llama3.2:latest.canvasl`** - Optimized for Llama 3.2 inference
- **`automaton.gpt-oss:20b.canvasl`** - Optimized for GPT-OSS 20B models
- **`automaton.native.canvasl`** - Native execution without LLM dependencies
- **`automaton.fast.canvasl`** - Fast execution mode with reduced complexity

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│         Automaton Evolution Pipeline                     │
└─────────────────────────────────────────────────────────┘
                         │
        ┌────────────────┼────────────────┐
        │                │                │
┌───────▼──────┐  ┌──────▼──────┐  ┌──────▼──────┐
│  Snapshot    │  │  Memory     │  │  Meta-Log   │
│  System      │  │  Monitor    │  │  Database   │
└───────┬──────┘  └──────┬──────┘  └──────┬──────┘
        │                │                │
        └────────────────┼────────────────┘
                         │
        ┌────────────────▼────────────────┐
        │    Evolution Analyzer           │
        │  - Pattern Detection            │
        │  - Memory Optimization          │
        │  - Variant Generation           │
        └────────────────┬────────────────┘
                         │
        ┌────────────────▼────────────────┐
        │    Variant Builders             │
        │  - llama3.2:latest              │
        │  - gpt-oss:20b                  │
        │  - native                       │
        │  - fast                         │
        └──────────────────────────────────┘
```

## Components

### 1. Snapshot System

**Files:**
- `snapshot-automaton.ts` - Standard snapshot capture (5s intervals)
- `snapshot-automaton-memory.ts` - Memory-aware snapshots (1ms intervals)
- `analyze-snapshots.ts` - Snapshot analysis
- `analyze-memory-snapshots.ts` - Memory pattern analysis

**Features:**
- Captures automaton state at configurable intervals
- Tracks object count, modifications, dimensions
- Records memory usage and pressure
- Stores reasoning quality metrics

### 2. Memory Monitoring

**Files:**
- `memory-leak-investigator.ts` - Leak detection
- `automaton-memory-optimized.ts` - Optimized automaton class
- `automaton-memory-spawner.ts` - Memory-aware process spawner

**Features:**
- Memory pressure assessment (LOW/MEDIUM/HIGH/CRITICAL)
- Automatic garbage collection triggers
- Object trimming and execution history limits
- Process spawning for high memory pressure

### 3. Meta-Log-Db Integration

**Files:**
- `meta-log-db/src/database.ts` - Core database engine
- `meta-log-db/src/jsonl/parser.ts` - JSONL/CanvasL parser

**Features:**
- Stores snapshots as RDF triples
- ProLog/DataLog query support
- SHACL validation
- CanvasL format support

### 4. Evolution Analyzer

**Purpose:** Analyzes evolution patterns and generates optimized variants

**Process:**
1. Load snapshots from Meta-Log-Db
2. Analyze evolution patterns (object growth, modifications, dimensions)
3. Identify optimization opportunities
4. Generate variant-specific optimizations
5. Build CanvasL files with optimizations applied

## Variant Specifications

### automaton.llama3.2:latest.canvasl

**Target:** Llama 3.2 inference optimization

**Optimizations:**
- Reduced object count (max 1000 objects)
- Simplified execution history (max 200 entries)
- LLM-friendly JSONL structure
- Token-efficient encoding
- Batch processing support

**Use Case:** LLM-based automaton execution via Llama 3.2

### automaton.gpt-oss:20b.canvasl

**Target:** GPT-OSS 20B model optimization

**Optimizations:**
- Medium object count (max 2000 objects)
- Structured prompt generation
- Context window optimization
- Multi-turn conversation support
- Function calling integration

**Use Case:** GPT-OSS 20B model execution

### automaton.native.canvasl

**Target:** Native execution without LLM dependencies

**Optimizations:**
- Full object set (no limits)
- Complete execution history
- Direct R5RS function calls
- No LLM-specific optimizations
- Maximum performance

**Use Case:** Direct automaton execution without LLM

### automaton.fast.canvasl

**Target:** Fast execution with reduced complexity

**Optimizations:**
- Minimal object set (max 500 objects)
- Truncated execution history (max 100 entries)
- Simplified patterns
- Reduced validation
- Aggressive trimming

**Use Case:** Quick testing and development

## GitHub Workflow

The evolution workflow (`evolution.yml`) runs on the `evolution` branch and:

1. **Captures Snapshots:** Runs automaton with memory monitoring
2. **Analyzes Evolution:** Processes snapshots through Meta-Log-Db
3. **Generates Variants:** Builds optimized CanvasL files
4. **Validates:** Ensures variants meet specifications
5. **Commits:** Saves variants to repository

**Trigger:** Push to `evolution` branch

**Outputs:**
- `automaton.llama3.2:latest.canvasl`
- `automaton.gpt-oss:20b.canvasl`
- `automaton.native.canvasl`
- `automaton.fast.canvasl`

## Usage

### Local Evolution

```bash
# Start memory-aware snapshot system
tsx snapshot-automaton-memory.ts

# In another terminal, run automaton
tsx automaton-memory-optimized.ts

# Analyze results
tsx analyze-memory-snapshots.ts
tsx memory-leak-investigator.ts
```

### CI/CD Evolution

```bash
# Create evolution branch
git checkout -b evolution

# Push to trigger workflow
git push origin evolution
```

The workflow will:
1. Run automaton evolution
2. Capture snapshots
3. Generate variants
4. Commit results

### Manual Variant Generation

```bash
# Generate all variants
tsx scripts/generate-evolution-variants.ts

# Generate specific variant
tsx scripts/generate-evolution-variants.ts --variant llama3.2
```

## Snapshot Storage

Snapshots are stored in Meta-Log-Db as:

**RDF Triples:**
```turtle
:snapshot-001 rdf:type meta:Snapshot ;
  meta:timestamp "2025-11-08T20:01:59.432Z"^^xsd:dateTime ;
  meta:objectCount 613 ;
  meta:memoryHeapUsed 31768320 ;
  meta:memoryPressure "low" .
```

**ProLog Facts:**
```prolog
snapshot(snapshot-001, timestamp(1762632119432), objects(613), memory(31768320), pressure(low)).
```

**DataLog Facts:**
```prolog
snapshot(snapshot-001, 1762632119432, 613, 31768320, low).
```

## Evolution Metrics

### Object Growth
- **Rate:** Objects per second
- **Pattern:** Linear, exponential, or burst
- **Stability:** Consistent vs. volatile

### Memory Efficiency
- **Objects/MB:** Memory efficiency ratio
- **Growth Rate:** MB per second
- **Pressure Distribution:** LOW/MEDIUM/HIGH/CRITICAL

### Reasoning Quality
- **Score:** 0-100 quality assessment
- **Dimension Progression:** Dimensional advancement
- **Pattern Consistency:** Stable vs. evolving

### Performance
- **Snapshot Rate:** Snapshots per second
- **Processing Time:** Analysis duration
- **Variant Build Time:** Generation duration

## Related Documentation

- **`docs/05-Meta-Log/`** - Meta-Log specification
- **`docs/07-Meta-Log-Db/`** - Meta-Log-Db implementation
- **`docs/04-CanvasL/`** - CanvasL format specification
- **`MEMORY_OPTIMIZATION_GUIDE.md`** - Memory optimization guide

## File Structure

```
docs/14-Automaton-Evolution-Logging/
├── README.md                          # This file
├── ARCHITECTURE.md                    # Detailed architecture
├── VARIANT_SPECIFICATIONS.md          # Variant specifications
├── EVOLUTION_METRICS.md               # Metrics documentation
└── WORKFLOW_GUIDE.md                  # Workflow usage guide
```

## Next Steps

1. ✅ Document evolution logging system
2. ✅ Create GitHub workflow for evolution branch
3. 🔄 Implement variant generation scripts
4. 🔄 Add evolution metrics dashboard
5. 🔄 Create evolution analysis reports
