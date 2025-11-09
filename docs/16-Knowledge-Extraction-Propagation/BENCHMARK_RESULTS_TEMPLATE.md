---
id: benchmark-results-template
title: "Benchmark Results Template"
level: practical
type: template
tags: [benchmarking, results-template, knowledge-extraction]
keywords: [benchmark-results, template, knowledge-extraction-metrics]
prerequisites: [knowledge-extraction-benchmark]
enables: []
related: []
readingTime: 5
difficulty: 1
---

# Benchmark Results Template

## Benchmark Configuration

- **Date**: YYYY-MM-DD
- **Phase**: Phase 14 (Logging) / Phase 15 (Testing & Optimizing)
- **Document Folder**: `./docs` / `./additional-docs`
- **File Count**: XXX markdown files
- **Expected Values**:
  - Facts: XXX
  - Rules: XXX
  - Agents: 15
  - Functions: XXX

## Extraction Results

### Completeness

| Entity Type | Extracted | Expected | Coverage | Status |
|-------------|-----------|----------|----------|--------|
| Facts | XXX | XXX | XX.X% | ✅/⚠️/❌ |
| Rules | XXX | XXX | XX.X% | ✅/⚠️/❌ |
| Agents | XX | 15 | XX.X% | ✅/⚠️/❌ |
| Functions | XXX | XXX | XX.X% | ✅/⚠️/❌ |

### Missing Entities

**Missing Agents**:
- Agent name 1
- Agent name 2

**Missing Facts** (if applicable):
- Fact description 1
- Fact description 2

## Performance Metrics

### Extraction Performance

- **Total Time**: XX.XX seconds
- **Average Time per File**: XX.XX ms
- **Files per Second**: XX.X files/sec
- **Peak Memory**: XXX.X MB
- **Average Memory**: XXX.X MB

### Storage Performance

- **JSONL Size**: XXX.X KB
- **Load Time**: XX.XX ms
- **Query Time**: XX.XX ms

## Understanding Metrics

### Knowledge Graph

- **Nodes**: XXX
- **Edges**: XXX
- **Average Degree**: X.XX
- **Connected Components**: XX

### Relationships

- **Prerequisites**: XXX
- **Enables**: XXX
- **Related**: XXX
- **Broken Links**: XXX

### Document Completeness

- **Documents with Frontmatter**: XXX / XXX (XX.X%)
- **Documents with Relationships**: XXX / XXX (XX.X%)
- **Overall Completeness**: XX.X%

## Summary

### Overall Score: XX.X%

### Strengths

- ✅ Strength 1
- ✅ Strength 2

### Weaknesses

- ⚠️ Weakness 1
- ⚠️ Weakness 2

### Recommendations

- • Recommendation 1
- • Recommendation 2

## Comparison (if applicable)

### Phase 14 vs Phase 15

| Metric | Phase 14 | Phase 15 | Change |
|--------|----------|----------|--------|
| Facts | XXX | XXX | +/-XX |
| Rules | XXX | XXX | +/-XX |
| Agents | XX | XX | +/-X |
| Extraction Time | XX.Xs | XX.Xs | +/-X.Xs |
| Memory Usage | XXX MB | XXX MB | +/-XX MB |

## Notes

Additional observations and analysis...
