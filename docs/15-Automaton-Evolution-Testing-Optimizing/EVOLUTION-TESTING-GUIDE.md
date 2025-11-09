---
id: evolution-testing-guide
title: "Evolution Testing Guide"
level: practical
type: guide
tags: [testing, evolution-variants, test-suite, snapshot-testing]
keywords: [testing, evolution-variants, test-suite, snapshot-testing, memory-pooling, optimization-coverage]
prerequisites: [optimization-implementation]
enables: []
related: [test-all-evolutions, test-evolution-variants, snapshot-all-evolutions]
readingTime: 20
difficulty: 3
blackboard:
  status: active
  assignedAgent: "6D-Intelligence-Agent"
  lastUpdate: 2025-01-07
  dependencies: [snapshot-system, test-suites]
  watchers: ["4D-Network-Agent", "5D-Consensus-Agent"]
---

# Evolution Testing Guide

**Date**: 2025-01-07  
**Status**: ✅ **COMPLETE**

## Overview

Three comprehensive test suites have been created to test all automaton evolution variants:

1. **`test-all-evolutions.ts`** - Basic validation and optimization coverage check
2. **`test-evolution-variants.ts`** - Individual variant testing with performance metrics
3. **`snapshot-all-evolutions.ts`** - Sequential snapshot testing for all variants

## Test Suites

### 1. Basic Validation (`test-all-evolutions.ts`)

**Purpose**: Quick validation of all evolution files and optimization coverage

**Usage**:
```bash
./test-all-evolutions.ts
```

**What it does**:
- ✅ Verifies all evolution files exist
- ✅ Checks import dependencies
- ✅ Validates optimization coverage
- ✅ Reports which variants benefit from optimizations

**Output**:
- Pass/fail status for each variant
- Optimization coverage report
- Import dependency validation

### 2. Variant Testing (`test-evolution-variants.ts`)

**Purpose**: Individual variant testing with performance metrics

**Usage**:
```bash
./test-evolution-variants.ts
```

**What it does**:
- ✅ Tests each variant individually
- ✅ Collects memory usage metrics
- ✅ Measures execution duration
- ✅ Validates file structure and imports

**Output**:
- Test results with timing
- Memory usage per variant
- Detailed coverage report

### 3. Snapshot Testing (`snapshot-all-evolutions.ts`)

**Purpose**: Sequential snapshot collection for all variants

**Usage**:
```bash
./snapshot-all-evolutions.ts
```

**What it does**:
- ✅ Tests each variant sequentially
- ✅ Collects snapshots during execution
- ✅ Saves variant-specific snapshots
- ✅ Generates summary reports

**Output**:
- Snapshots per variant in `snapshots-memory/<variant-name>/`
- Summary JSON files with metrics
- Test completion status

## Optimization Coverage

### ✅ Full Coverage (Memory Pooling)

All variants now have memory pooling:

1. **advanced-automaton**: ✅ Direct implementation
2. **automaton-runner**: ✅ Added memory pooling
3. **automaton-memory-optimized**: ✅ Inherits from advanced-automaton
4. **automaton-evolved**: ✅ Inherits from memory-optimized
5. **automaton-scalable**: ✅ Inherits from memory-optimized
6. **continuous-automaton**: ✅ Inherits from advanced-automaton
7. **ollama-automaton**: ✅ Inherits from advanced-automaton

### Memory Pooling Implementation

All variants now include:
- **ObjectPool class**: Reusable object pool
- **Pool size**: 200 objects max
- **GC triggers**: Periodic garbage collection
- **History limits**: MAX_EXECUTION_HISTORY = 1000

## Running Tests

### Quick Validation
```bash
./test-all-evolutions.ts
```

### Full Testing
```bash
# Run variant tests
./test-evolution-variants.ts

# Run snapshot tests (takes longer)
./snapshot-all-evolutions.ts
```

### Analyze Results
```bash
# Analyze all snapshots
./analyze-memory-snapshots.ts

# Analyze specific variant
ls snapshots-memory/<variant-name>/
cat snapshots-memory/<variant-name>/summary.json
```

## Expected Results

### Test All Evolutions
- ✅ All 7 variants should pass
- ✅ Optimization coverage should be 100%
- ✅ All imports should be valid

### Variant Testing
- ✅ All variants should complete successfully
- ✅ Memory usage should be reasonable
- ✅ No errors during execution

### Snapshot Testing
- ✅ Each variant should generate snapshots
- ✅ Snapshots saved to variant-specific directories
- ✅ Summary files generated with metrics

## Troubleshooting

### Common Issues

1. **File Not Found**
   - Ensure all evolution files exist in `evolutions/` directory
   - Check file paths are correct

2. **Import Errors**
   - Verify import paths are relative to project root
   - Check that base classes exist

3. **Timeout Errors**
   - Increase TEST_TIMEOUT if needed
   - Some variants may require longer execution time

4. **Memory Issues**
   - Ensure `--expose-gc` flag is set
   - Check available system memory

## Next Steps

1. **Run Tests**: Execute all three test suites
2. **Analyze Results**: Review test outputs and snapshots
3. **Optimize Further**: Based on test results, optimize as needed
4. **Continuous Testing**: Integrate into CI/CD pipeline

---

**Last Updated**: 2025-01-07  
**Status**: ✅ Complete
