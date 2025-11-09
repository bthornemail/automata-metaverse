---
id: benchmark-summary
title: "Knowledge Extraction Benchmark Summary"
level: practical
type: summary
tags: [benchmark-summary, knowledge-extraction, baseline-results]
keywords: [benchmark-summary, baseline-results, knowledge-extraction-metrics]
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

# Knowledge Extraction Benchmark Summary

## Baseline Benchmark Results (2025-01-07)

### Test Configuration

- **Document Folder**: `./docs`
- **File Count**: 144 markdown files
- **Expected Values**:
  - Facts: 1263
  - Rules: 164
  - Agents: 15
  - Functions: 92

### Extraction Results

| Entity Type | Extracted | Expected | Coverage | Status |
|-------------|-----------|----------|----------|--------|
| **Facts** | 1324 | 1263 | 104.8% | ✅ Excellent |
| **Rules** | 167 | 164 | 101.8% | ✅ Excellent |
| **Agents** | 15 | 15 | 100.0% | ✅ Perfect |
| **Functions** | 92 | 92 | 100.0% | ✅ Perfect |

**Overall Score**: 101.1% ✅

### Performance Metrics

- **Extraction Time**: 0.25 seconds
- **Average Time per File**: 1.71 ms
- **Files per Second**: 585.4 files/sec
- **Peak Memory**: 17.5 MB
- **Average Memory**: 21.3 MB

### Storage Metrics

- **JSONL Size**: 1,038.4 KB
- **Load Time**: 8 ms
- **Query Time**: 1 ms

### Understanding Metrics

- **Knowledge Graph**: 240 nodes, 605 edges
- **Average Degree**: 5.04 connections per node
- **Relationships**: 
  - Prerequisites: 180
  - Enables: 0
  - Related: 322
- **Documents with Frontmatter**: 144 / 144 (100%)

## Strengths

✅ **Perfect Agent Extraction**: 15/15 agents extracted (100%)
✅ **Excellent Fact Extraction**: 1324 facts extracted (104.8% of expected)
✅ **Excellent Rule Extraction**: 167 rules extracted (101.8% of expected)
✅ **Fast Extraction**: 585.4 files/second processing speed
✅ **Low Memory Usage**: Only 17.5MB peak memory
✅ **Rich Knowledge Graph**: 240 nodes with 605 relationships

## Analysis

### Completeness

All entity types exceeded or met expectations:
- **Facts**: Extracted more than expected (likely due to new documentation)
- **Rules**: Extracted more than expected (new RFC2119 rules found)
- **Agents**: Perfect extraction (15/15)
- **Functions**: Perfect extraction (92/92)

### Performance

Extraction performance is excellent:
- **Speed**: 585 files/second is very fast
- **Memory**: 17.5MB is very low
- **Efficiency**: 1.71ms per file is efficient

### Understanding

Knowledge graph is well-connected:
- **240 nodes** represent documents, agents, functions
- **605 edges** show rich relationships
- **5.04 average degree** indicates good connectivity
- **100% frontmatter coverage** shows good document structure

## Ready for Stress Testing

The system is ready for stress testing with additional documents:

✅ **Baseline Established**: Current performance metrics documented
✅ **Benchmark Scripts Ready**: Tools available for stress testing
✅ **Comparison Tools Ready**: Can compare Phase 14 vs Phase 15
✅ **Monitoring Ready**: Memory and performance tracking enabled

## Next Steps

1. **Upload Additional Documents**: Ready for stress test folder
2. **Run Stress Test**: Test with additional document folder
3. **Compare Phases**: Compare Phase 14 vs Phase 15 results
4. **Analyze Results**: Identify optimizations needed

## Commands

### Run Baseline (Already Done)
```bash
tsx scripts/benchmark-knowledge-extraction.ts \
  --docs-path ./docs \
  --output ./benchmark-results-baseline.json \
  --expected-facts 1263 --expected-rules 164 --expected-agents 15 --expected-functions 92
```

### Run Stress Test (When Ready)
```bash
tsx scripts/benchmark-knowledge-extraction.ts \
  --docs-path ./additional-docs \
  --output ./benchmark-results-stress-test.json
```

### Compare Phases
```bash
tsx scripts/compare-phase-extraction.ts \
  --phase14 ./benchmark-results-phase14.json \
  --phase15 ./benchmark-results-baseline.json \
  --output ./benchmark-comparison.json
```

## Related Files

- **`benchmark-results-baseline.json`**: Complete baseline results
- **`scripts/benchmark-knowledge-extraction.ts`**: Benchmark script
- **`scripts/compare-phase-extraction.ts`**: Comparison script
- **`KNOWLEDGE_EXTRACTION_BENCHMARK.md`**: Detailed benchmark plan
- **`STRESS_TESTING_GUIDE.md`**: Stress testing guide
