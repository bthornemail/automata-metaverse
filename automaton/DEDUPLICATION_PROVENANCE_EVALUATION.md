# Deduplication Logic Evaluation: Federated Provenance Compliance

## Summary

This document evaluates the current object deduplication logic in `advanced-automaton.ts` against the Federated Provenance Meta-Log specification (`docs/13-Federated-Provenance-Meta-Log/`).

## Current Implementation

### Deduplication Logic in `load()`

```typescript
// Current implementation (lines 83-95)
if (obj.id && seenIds.has(obj.id)) {
  // Remove previous occurrence and add this one
  const existingIndex = this.objects.findIndex(o => o.id === obj.id);
  if (existingIndex >= 0) {
    this.objects.splice(existingIndex, 1);
    duplicateCount++;
  }
}
if (obj.id) {
  seenIds.add(obj.id);
}
this.objects.push(obj);
```

**Behavior**: 
- Removes duplicates by ID only
- Keeps the last occurrence (loses earlier provenance)
- Does not consider provenance when deduplicating

## Federated Provenance Requirements

### From `FEDERATED-PROVENANCE-RFC2119-SPEC.md`:

#### Section 7.4: Preservation Requirements

> - **MUST** preserve provenance through all transformations
> - **MUST** maintain file and line accuracy
> - **SHOULD** preserve pattern information
> - **MUST** handle missing provenance gracefully (warn, don't fail)

#### Section 4.1: Self-Reference Metadata Structure

Each JSONL entry MUST include a `selfReference` field:
```json
{
  "id": "0D-automaton",
  "selfReference": {
    "file": "automaton-kernel.jsonl",
    "line": 14,
    "pattern": "identity"
  }
}
```

#### Section 7.2: Fact Extraction Requirements

The system MUST create provenance facts:
```prolog
provenance(Id, File, Line, Pattern) :-
    node(Id, Type, ...),
    selfReference(Id, File, Line, Pattern).
```

## Analysis of Actual Duplicates

From `memory-leak-investigator.ts` output:
- **1122 duplicate IDs** found in `automaton.jsonl` (out of 2000 lines)
- Example duplicates:
  - `modification-1762634818911` appears on lines 2 and 3
  - Both have `selfReference.file = "./automaton.jsonl"`
  - But different `selfReference.line` values (2103 vs 2104)

### Key Observations

1. **Same File, Different Lines**: Duplicates are within the same file but have different line numbers
2. **Provenance Loss**: Current deduplication removes earlier provenance information
3. **Memory Leak**: These duplicates are causing file bloat (1502.51KB file)

## Issues with Current Implementation

### ❌ Issue 1: Provenance Loss

**Problem**: When removing duplicates, the earlier `selfReference` metadata is lost.

**Example**:
```typescript
// Object 1 (line 2)
{
  "id": "modification-1762634818911",
  "selfReference": { "file": "./automaton.jsonl", "line": 2103, "pattern": "..." }
}

// Object 2 (line 3) - duplicate ID
{
  "id": "modification-1762634818911",
  "selfReference": { "file": "./automaton.jsonl", "line": 2104, "pattern": "..." }
}

// Current behavior: Keeps Object 2, loses Object 1's provenance
// Violates: "MUST preserve provenance through all transformations"
```

### ❌ Issue 2: No Provenance Consideration

**Problem**: Deduplication doesn't consider provenance when deciding which object to keep.

**According to spec**: Objects with the same ID but different provenance might represent:
- Different versions of the same entity
- Different states in the evolution chain
- Different derivations from different sources

**Current behavior**: Blindly keeps the last occurrence, ignoring provenance.

### ❌ Issue 3: Cross-File Provenance Not Handled

**Problem**: The current deduplication only works within a single file. According to the federated provenance spec, objects with the same ID might appear in multiple files with different provenance, and that's valuable information.

**From spec Section 9.1**: "The system MUST track cross-file relationships"

**Current behavior**: Only deduplicates within the same file.

## Recommended Approach

### Option 1: Provenance-Aware Deduplication (Recommended)

**Strategy**: Consider provenance when deduplicating, preserve provenance information.

```typescript
private load(): void {
  // ... existing code ...
  
  const seenIds = new Map<string, { obj: CanvasObject; provenance: string[] }>();
  
  for (let i = 0; i < lines.length; i++) {
    const obj = JSON.parse(line);
    
    if (obj.id && seenIds.has(obj.id)) {
      const existing = seenIds.get(obj.id)!;
      
      // Check if provenance is different
      const currentProvenance = obj.selfReference 
        ? `${obj.selfReference.file}:${obj.selfReference.line}`
        : 'unknown';
      
      const existingProvenance = existing.obj.selfReference
        ? `${existing.obj.selfReference.file}:${existing.obj.selfReference.line}`
        : 'unknown';
      
      if (currentProvenance !== existingProvenance) {
        // Different provenance - preserve both or merge
        existing.provenance.push(currentProvenance);
        // Option: Merge provenance into existing object
        if (!existing.obj.provenanceHistory) {
          existing.obj.provenanceHistory = [];
        }
        existing.obj.provenanceHistory.push({
          file: obj.selfReference?.file,
          line: obj.selfReference?.line,
          pattern: obj.selfReference?.pattern
        });
      }
      
      // For same-file duplicates, keep the last occurrence (memory leak fix)
      if (obj.selfReference?.file === existing.obj.selfReference?.file) {
        // Same file duplicate - replace to fix memory leak
        const existingIndex = this.objects.findIndex(o => o.id === obj.id);
        if (existingIndex >= 0) {
          this.objects.splice(existingIndex, 1);
        }
        seenIds.set(obj.id, { obj, provenance: [currentProvenance] });
        this.objects.push(obj);
      } else {
        // Different file - preserve both (federated provenance)
        this.objects.push(obj);
      }
    } else {
      if (obj.id) {
        const provenance = obj.selfReference 
          ? `${obj.selfReference.file}:${obj.selfReference.line}`
          : 'unknown';
        seenIds.set(obj.id, { obj, provenance: [provenance] });
      }
      this.objects.push(obj);
    }
  }
}
```

**Benefits**:
- ✅ Preserves provenance information
- ✅ Handles same-file duplicates (memory leak fix)
- ✅ Preserves cross-file provenance (federated provenance)
- ✅ Complies with spec requirements

### Option 2: Simple Same-File Deduplication (Current + Provenance Warning)

**Strategy**: Keep current behavior but add provenance warnings.

```typescript
if (obj.id && seenIds.has(obj.id)) {
  const existingIndex = this.objects.findIndex(o => o.id === obj.id);
  if (existingIndex >= 0) {
    const existing = this.objects[existingIndex];
    
    // Check if provenance differs
    const existingProvenance = existing.selfReference 
      ? `${existing.selfReference.file}:${existing.selfReference.line}`
      : 'unknown';
    const currentProvenance = obj.selfReference
      ? `${obj.selfReference.file}:${obj.selfReference.line}`
      : 'unknown';
    
    if (existingProvenance !== currentProvenance) {
      console.warn(
        `⚠️  Deduplicating ID "${obj.id}" with different provenance: ` +
        `${existingProvenance} → ${currentProvenance} (provenance lost)`
      );
    }
    
    this.objects.splice(existingIndex, 1);
    duplicateCount++;
  }
}
```

**Benefits**:
- ✅ Fixes memory leak (removes duplicates)
- ✅ Warns about provenance loss
- ⚠️  Still loses provenance information

### Option 3: Provenance History Merging

**Strategy**: Merge provenance into a history array.

```typescript
if (obj.id && seenIds.has(obj.id)) {
  const existingIndex = this.objects.findIndex(o => o.id === obj.id);
  if (existingIndex >= 0) {
    const existing = this.objects[existingIndex];
    
    // Merge provenance history
    if (!existing.provenanceHistory) {
      existing.provenanceHistory = [];
      if (existing.selfReference) {
        existing.provenanceHistory.push(existing.selfReference);
      }
    }
    
    if (obj.selfReference) {
      existing.provenanceHistory.push(obj.selfReference);
    }
    
    // Update to latest version but preserve history
    Object.assign(existing, obj);
    existing.provenanceHistory = existing.provenanceHistory || [];
    
    this.objects.splice(existingIndex, 1);
    this.objects.push(existing);
  }
}
```

**Benefits**:
- ✅ Preserves all provenance information
- ✅ Fixes memory leak (removes duplicates)
- ✅ Complies with spec requirements

## Recommendation

**Recommended**: **Option 1 (Provenance-Aware Deduplication)** with fallback to **Option 3 (Provenance History Merging)** for same-file duplicates.

### Implementation Strategy

1. **Same-File Duplicates**: Use Option 3 (merge provenance history, keep latest)
2. **Cross-File Duplicates**: Preserve both objects (federated provenance)
3. **Missing Provenance**: Handle gracefully (warn, don't fail)

### Compliance Checklist

- ✅ **MUST preserve provenance through all transformations**: Option 1 & 3
- ✅ **MUST maintain file and line accuracy**: Option 1 & 3
- ✅ **SHOULD preserve pattern information**: Option 1 & 3
- ✅ **MUST handle missing provenance gracefully**: All options
- ✅ **Fixes memory leak**: All options

## Conclusion

The current deduplication logic **violates the federated provenance specification** by:
1. Losing provenance information when removing duplicates
2. Not considering provenance when deduplicating
3. Not handling cross-file provenance relationships

**Recommended fix**: Implement Option 1 (Provenance-Aware Deduplication) to comply with the federated provenance spec while fixing the memory leak.

## Related Documentation

- `docs/13-Federated-Provenance-Meta-Log/FEDERATED-PROVENANCE-RFC2119-SPEC.md`: Complete specification
- `docs/13-Federated-Provenance-Meta-Log/FEDERATED-PROVENANCE-SOLUTION.md`: Solution explanation
- `docs/05-Meta-Log/MULTIVERSE-CANVAS-RFC2119-SPEC.md`: Multiverse canvas spec (Section 7.4, 8.2, 8.3)
