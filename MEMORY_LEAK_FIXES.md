# Memory Leak Fixes

## Summary

This document describes the memory leak fixes implemented based on the memory leak investigation results.

## Issues Identified

1. **Execution History Growth**: `executionHistory` array was growing unbounded without trimming
2. **Duplicate IDs**: 1122 duplicate IDs found in `automaton.jsonl` (out of 2000 lines)
3. **Snapshot Accumulation**: Snapshot system accumulating 0.131MB per snapshot without cleanup
4. **Memory Growth Without Object Growth**: 0.133MB per snapshot growth without corresponding object count increase

## Fixes Implemented

### 1. Execution History Trimming (`advanced-automaton.ts`)

**Problem**: `executionHistory` array was growing indefinitely, causing memory leaks.

**Solution**:
- Added `MAX_EXECUTION_HISTORY = 1000` constant to limit history size
- Added automatic trimming in `executeAction()` method:
  ```typescript
  if (this.executionHistory.length > this.MAX_EXECUTION_HISTORY) {
    this.executionHistory = this.executionHistory.slice(-this.MAX_EXECUTION_HISTORY);
  }
  ```

**Impact**: Prevents unbounded growth of execution history array.

### 2. Duplicate ID Detection and Deduplication

**Problem**: Objects with duplicate IDs were being added to `automaton.jsonl`, causing file bloat.

**Solution**:
- **In `load()` method**: Added deduplication logic that keeps only the last occurrence of each ID:
  ```typescript
  const seenIds = new Set<string>();
  // Remove previous occurrence and add this one
  if (obj.id && seenIds.has(obj.id)) {
    const existingIndex = this.objects.findIndex(o => o.id === obj.id);
    if (existingIndex >= 0) {
      this.objects.splice(existingIndex, 1);
      duplicateCount++;
    }
  }
  ```

- **In `save()` method**: Added deduplication before saving (keeps last occurrence):
  ```typescript
  // Process in reverse to keep last occurrence
  for (let i = this.objects.length - 1; i >= 0; i--) {
    const obj = this.objects[i]!;
    if (obj.id && seenIds.has(obj.id)) {
      duplicateCount++;
      continue; // Skip duplicate
    }
    // ... add to deduplicated array
  }
  ```

**Impact**: Prevents duplicate IDs from accumulating in the file, reducing file size and memory usage.

### 3. Snapshot Cleanup Mechanism (`snapshot-automaton-memory.ts`)

**Problem**: Snapshot files were accumulating indefinitely (0.131MB per snapshot).

**Solution**:
- Added `MAX_SNAPSHOTS = 1000` constant to limit snapshot retention
- Added `CLEANUP_INTERVAL = 60000` (60 seconds) for periodic cleanup
- Implemented `cleanupOldSnapshots()` function:
  ```typescript
  function cleanupOldSnapshots(): void {
    const files = fs.readdirSync(SNAPSHOT_DIR)
      .filter(f => f.startsWith('memory-snapshot-') && f.endsWith('.json'))
      .sort((a, b) => b.mtime - a.mtime); // Newest first
    
    if (files.length > MAX_SNAPSHOTS) {
      const toDelete = files.slice(MAX_SNAPSHOTS);
      // Delete old snapshots
    }
  }
  ```

- Added periodic cleanup:
  - Every 100 snapshots: automatic cleanup
  - Every 60 seconds: scheduled cleanup
  - On shutdown: final cleanup

**Impact**: Prevents snapshot directory from growing unbounded, reducing disk usage and memory pressure.

### 4. Periodic GC Triggers

**Problem**: Memory was growing without corresponding object growth, suggesting V8 heap fragmentation.

**Solution**:
- Added `global.gc` calls after major operations:
  - After `run()` completes
  - In `optimizeMemory()` method
  - In snapshot cleanup interval (every 60 seconds)

**Note**: Requires Node.js to be run with `--expose-gc` flag:
```bash
node --expose-gc snapshot-automaton-memory.ts
```

**Impact**: Helps V8 garbage collector reclaim fragmented memory more aggressively.

### 5. Memory Optimization Method

**Problem**: No centralized way to optimize memory when needed.

**Solution**:
- Added `optimizeMemory()` method to `AdvancedSelfReferencingAutomaton`:
  ```typescript
  optimizeMemory(): void {
    // Trim execution history
    // Deduplicate objects
    // Trigger GC if available
  }
  ```

**Impact**: Provides a way to manually trigger memory optimization when needed.

## Usage

### Running with GC Support

To enable garbage collection triggers, run Node.js with the `--expose-gc` flag:

```bash
node --expose-gc snapshot-automaton-memory.ts
```

Or for TypeScript:

```bash
tsx --expose-gc snapshot-automaton-memory.ts
```

### Manual Memory Optimization

Call `optimizeMemory()` on the automaton instance:

```typescript
const automaton = new AdvancedSelfReferencingAutomaton('./automaton.jsonl');
automaton.optimizeMemory();
```

## Expected Results

After implementing these fixes:

1. **Execution History**: Should stabilize at ~1000 entries instead of growing indefinitely
2. **Duplicate IDs**: Should be eliminated during load and save operations
3. **Snapshot Directory**: Should maintain only the last 1000 snapshots
4. **Memory Growth**: Should be reduced significantly, especially with GC triggers enabled

## Monitoring

Re-run the memory leak investigation to verify fixes:

```bash
./memory-leak-investigator.ts
```

Expected improvements:
- Reduced memory growth per snapshot
- Fewer or no duplicate IDs
- Stable snapshot directory size
- Reduced memory pressure

## Related Files

- `advanced-automaton.ts`: Core automaton implementation with memory fixes
- `snapshot-automaton-memory.ts`: Snapshot monitoring with cleanup
- `memory-leak-investigator.ts`: Investigation tool for analyzing memory leaks

## Next Steps

1. Run the automaton with fixes applied
2. Monitor memory usage over time
3. Verify duplicate IDs are eliminated
4. Check snapshot directory size remains stable
5. Re-run memory leak investigation to confirm improvements
