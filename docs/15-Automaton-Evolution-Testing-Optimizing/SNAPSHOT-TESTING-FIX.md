---
id: snapshot-testing-fix
title: "Snapshot Testing Fix - Module Import Resolution"
level: practical
type: fix
tags: [snapshot-testing, module-import, tsx, commonjs, es-modules]
keywords: [snapshot-testing, module-import, tsx, commonjs-es-modules, import-resolution]
prerequisites: [snapshot-all-evolutions]
enables: []
related: [evolution-testing-guide]
readingTime: 10
difficulty: 2
blackboard:
  status: fixed
  assignedAgent: "6D-Intelligence-Agent"
  lastUpdate: 2025-01-07
  dependencies: [tsx, snapshot-system]
  watchers: []
---

# Snapshot Testing Fix - Module Import Resolution

**Date**: 2025-01-07  
**Status**: ✅ **FIXED**

## Issue

The `snapshot-all-evolutions.ts` script was failing with:
```
❌ Error: Cannot use import statement outside a module
```

## Root Cause

1. **Module Format**: TypeScript files are compiled to CommonJS (`"module": "commonjs"` in `tsconfig.json`)
2. **tsx Import Behavior**: When tsx imports CommonJS modules, it wraps them in `module.exports`
3. **Export Access**: Exports are accessed via `variant['module.exports'].ClassName`, not `variant.ClassName`

## Solution

Updated the test script to:
1. Use `tsx` instead of `node` for running TypeScript files
2. Check `variant['module.exports']` first for CommonJS exports
3. Fall back to direct property access for ES module compatibility
4. Handle all export names correctly

## Fixed Code

```typescript
// Check for CommonJS exports first (tsx wraps CommonJS in 'module.exports')
const moduleExports = variant['module.exports'] || variant;
const AutomatonClass = moduleExports.AdvancedSelfReferencingAutomaton || 
                       moduleExports.SelfReferencingAutomaton || 
                       // ... other class names
                       variant.default;
```

## Testing

Run the fixed script:
```bash
./snapshot-all-evolutions.ts
```

Expected: All variants should load successfully and generate snapshots.

---

**Last Updated**: 2025-01-07  
**Status**: ✅ Fixed
