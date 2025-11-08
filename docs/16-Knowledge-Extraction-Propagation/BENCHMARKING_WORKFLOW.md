---
id: benchmarking-workflow
title: "Knowledge Extraction Benchmarking Workflow"
level: practical
type: workflow
tags: [benchmarking, workflow, knowledge-extraction, phase-comparison]
keywords: [benchmarking-workflow, phase-comparison, stress-testing, performance-measurement]
prerequisites: [knowledge-extraction-benchmark]
enables: []
related: []
readingTime: 10
difficulty: 2
blackboard:
  status: active
  assignedAgent: "6D-Intelligence-Agent"
  lastUpdate: 2025-01-07
  dependencies: [document-knowledge-extractor]
  watchers: []
---

# Knowledge Extraction Benchmarking Workflow

## Overview

This workflow guides you through benchmarking knowledge extraction across Phase 14 (Logging) and Phase 15 (Testing & Optimizing), and stress testing with additional documents.

## Workflow Steps

### Step 1: Run Baseline Benchmark

**Purpose**: Establish baseline metrics for current `docs/` folder

```bash
# Run baseline benchmark
tsx scripts/benchmark-knowledge-extraction.ts \
  --docs-path ./docs \
  --output ./benchmark-results-phase15-baseline.json \
  --expected-facts 1263 \
  --expected-rules 164 \
  --expected-agents 15 \
  --expected-functions 92
```

**Expected Output**: `benchmark-results-phase15-baseline.json`

**Baseline Results** (from latest run):
- Facts: 1324 (104.8%)
- Rules: 167 (101.8%)
- Agents: 15/15 (100.0%)
- Functions: 92/92 (100.0%)
- Performance: 585.4 files/sec
- Memory: 17.5MB

### Step 2: Prepare Additional Document Folder

**Action**: Upload or prepare additional document folder for stress testing

**Location**: `/home/main/automaton/additional-docs/` (or custom path)

**Requirements**:
- Markdown files (`.md`)
- Can have frontmatter (optional)
- Can be nested in subdirectories
- No size limit (testing scalability)

### Step 3: Run Stress Test

**Purpose**: Test extraction with additional documents

```bash
# Run stress test
tsx scripts/benchmark-knowledge-extraction.ts \
  --docs-path ./additional-docs \
  --output ./benchmark-results-stress-test.json
```

**Metrics to Monitor**:
- Document count processed
- Performance degradation
- Memory growth
- Error rate
- Quality maintenance

### Step 4: Compare Phases (Optional)

**Purpose**: Compare Phase 14 vs Phase 15 extraction results

```bash
# Compare two benchmark results
tsx scripts/compare-phase-extraction.ts \
  --phase14 ./benchmark-results-phase14.json \
  --phase15 ./benchmark-results-phase15-baseline.json \
  --output ./benchmark-comparison.json
```

**Comparison Metrics**:
- Knowledge growth (new facts/rules)
- Quality improvement
- Performance changes
- Understanding progression

### Step 5: Analyze Results

**Review**:
- Benchmark summary output
- JSON results file
- Comparison results (if applicable)

**Key Questions**:
- Does extraction quality maintain at scale?
- Is performance acceptable?
- Are there bottlenecks?
- What optimizations are needed?

### Step 6: Document Findings

**Create**:
- Benchmark results document
- Analysis report
- Recommendations
- Optimization plan

## Quick Reference

### Benchmark Script Options

```bash
tsx scripts/benchmark-knowledge-extraction.ts [options]

Options:
  --docs-path <path>          Path to documents folder (default: ./docs)
  --output <path>             Output path for results (default: benchmark-results.json)
  --expected-facts <n>         Expected number of facts
  --expected-rules <n>         Expected number of rules
  --expected-agents <n>        Expected number of agents (default: 15)
  --expected-functions <n>     Expected number of functions
```

### Comparison Script Options

```bash
tsx scripts/compare-phase-extraction.ts [options]

Options:
  --phase14 <results.json>    Phase 14 benchmark results
  --phase15 <results.json>    Phase 15 benchmark results
  --output <path>             Output path for comparison (default: benchmark-comparison.json)
```

## Example Workflow

```bash
# 1. Baseline benchmark
tsx scripts/benchmark-knowledge-extraction.ts \
  --docs-path ./docs \
  --output ./results/baseline.json \
  --expected-facts 1263 --expected-rules 164 --expected-agents 15 --expected-functions 92

# 2. Stress test (when additional docs uploaded)
tsx scripts/benchmark-knowledge-extraction.ts \
  --docs-path ./additional-docs \
  --output ./results/stress-test.json

# 3. Compare results
tsx scripts/compare-phase-extraction.ts \
  --phase14 ./results/baseline.json \
  --phase15 ./results/stress-test.json \
  --output ./results/comparison.json

# 4. Review results
cat ./results/comparison.json | jq '.analysis'
```

## Success Criteria

### Baseline Benchmark

- ✅ Facts: > 95% coverage
- ✅ Rules: > 95% coverage
- ✅ Agents: 100% coverage (15/15)
- ✅ Functions: > 95% coverage
- ✅ Performance: > 100 files/sec
- ✅ Memory: < 500MB

### Stress Test

- ✅ Scalability: Handle 1000+ documents
- ✅ Performance: < 5 seconds per 100 documents
- ✅ Quality: Maintain > 85% at scale
- ✅ Errors: < 5% error rate

## Related Documentation

- **`KNOWLEDGE_EXTRACTION_BENCHMARK.md`**: Detailed benchmark plan
- **`STRESS_TESTING_GUIDE.md`**: Stress testing guide
- **`BENCHMARK_RESULTS_TEMPLATE.md`**: Results template
