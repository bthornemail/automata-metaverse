---
id: meta-log-plugin-opencode-integration
title: "Meta-Log Plugin OpenCode Integration"
level: practical
type: guide
tags: [meta-log-plugin, opencode, integration, setup, build]
keywords: [meta-log-plugin-opencode, opencode-integration, plugin-setup, build-configuration]
prerequisites: [meta-log-plugin-progress-readme]
enables: [opencode-plugin-usage]
related: [meta-log-plugin-progress-readme, opencode-readme]
readingTime: 15
difficulty: 3
blackboard:
  status: active
  assignedAgent: null
  lastUpdate: 2025-11-09
  dependencies: [meta-log-db]
  watchers: []
---

# Meta-Log Plugin OpenCode Integration

**Last Updated**: 2025-11-09  
**Status**: ✅ Complete

This guide explains how to integrate the Meta-Log plugin with OpenCode.

## Quick Setup

Run the automated setup script:

```bash
./setup-opencode-plugin.sh
```

This will:
1. ✅ Build and link `meta-log-db` (if available)
2. ✅ Build `meta-log-plugin` (OpenCode-specific build)
3. ✅ Link plugin to `.opencode/` directory
4. ✅ Verify installation

## Manual Setup

### 1. Build meta-log-db (if available)

```bash
cd meta-log-db
npm install
npm run build
npm link
cd ..
```

### 2. Link meta-log-db to plugin

```bash
cd plugin/meta-log-plugin
npm link meta-log-db
cd ../..
```

### 3. Build meta-log-plugin (OpenCode build)

```bash
cd plugin/meta-log-plugin
npm install
npm run build:opencode  # OpenCode-specific build
npm link
cd ../..
```

### 4. Link plugin to OpenCode

```bash
cd .opencode
npm link meta-log-plugin
cd ..
```

## Build Configuration

### OpenCode-Specific Build

The plugin supports an OpenCode-specific build that excludes Obsidian-specific code:

```bash
npm run build:opencode  # OpenCode-only build
npm run build          # Full build (includes Obsidian)
npm run build:all      # Build both configurations
```

**Why OpenCode-Specific Build?**
- ✅ Faster build times
- ✅ Avoids Obsidian-specific TypeScript errors
- ✅ Smaller bundle size
- ✅ Cleaner separation of concerns

**Output Files**:
- `dist/opencode.js` - OpenCode entry point
- `dist/adapters/opencode.js` - OpenCode adapter
- `dist/index.js` - Full plugin (includes Obsidian)

## Configuration

The plugin is configured in `opencode.jsonc`:

```jsonc
{
  "plugins": {
    "meta-log-plugin": {
      "path": "./plugin/meta-log-plugin",
      "enabled": true,
      "config": {
        "canvasPath": "./automaton-kernel.jsonl",
        "enableProlog": true,
        "enableDatalog": true,
        "enableSparql": true
      }
    }
  }
}
```

## Usage

The Meta-Log plugin is available through the `meta-log` tool in `.opencode/tool/meta-log.ts`.

### ProLog Query

```typescript
{
  queryType: "prolog",
  query: "inherits(X, Z) :- vertical(Y, X), inherits(Y, Z).",
  canvasPath: "./automaton-kernel.jsonl" // optional
}
```

### DataLog Query

```typescript
{
  queryType: "datalog",
  query: "node(Id, Type, X, Y, Text)?",
  canvasPath: "./automaton-kernel.jsonl", // optional
  program: "{\"facts\": [...]}" // optional DataLog program
}
```

### SPARQL Query

```typescript
{
  queryType: "sparql",
  query: "SELECT ?id ?target WHERE { ?id rdf:type metaverse:Reference }",
  canvasPath: "./automaton-kernel.jsonl" // optional
}
```

### Load Canvas

```typescript
{
  queryType: "load",
  canvasPath: "./automaton-kernel.jsonl"
}
```

## Architecture

```
OpenCode (.opencode/)
    │
    ├── tool/
    │   └── meta-log.ts  ← Meta-Log tool
    │
    └── node_modules/
        └── meta-log-plugin → symlink to plugin/meta-log-plugin
            │
            └── dist/
                ├── opencode.js  ← OpenCode entry point
                └── adapters/
                    └── opencode.js  ← OpenCode adapter
                        │
                        └── Uses meta-log-db
                            │
                            └── Queries canvas files
```

## Troubleshooting

### Plugin Not Found

If you get "Meta-Log plugin not available" error:

1. Check if plugin is built:
   ```bash
   ls plugin/meta-log-plugin/dist/opencode.js
   ```

2. Check if plugin is linked:
   ```bash
   cd .opencode
   npm list meta-log-plugin
   ```

3. Re-link if needed:
   ```bash
   cd plugin/meta-log-plugin
   npm link
   cd ../../.opencode
   npm link meta-log-plugin
   ```

### Build Errors

If the plugin build fails:

1. **Missing meta-log-db**: Ensure `meta-log-db` is built and linked
   ```bash
   cd meta-log-db
   npm run build
   npm link
   cd ../plugin/meta-log-plugin
   npm link meta-log-db
   ```

2. **TypeScript Errors**: Use OpenCode-specific build
   ```bash
   npm run build:opencode  # Avoids Obsidian-specific errors
   ```

3. **Missing Dependencies**: Install dependencies
   ```bash
   cd plugin/meta-log-plugin
   npm install
   ```

### Import Errors

If you get import errors:

1. Check that `meta-log-db` is linked:
   ```bash
   cd plugin/meta-log-plugin
   npm list meta-log-db
   ```

2. Check that the plugin exports are correct:
   ```bash
   node -e "console.log(Object.keys(require('./plugin/meta-log-plugin/dist/opencode.js')))"
   ```

## Files Created

### Plugin Files
- ✅ `src/opencode.ts` - OpenCode entry point
- ✅ `tsconfig.opencode.json` - OpenCode build configuration
- ✅ `src/types/obsidian-dom.d.ts` - Obsidian DOM type definitions

### OpenCode Integration Files
- ✅ `.opencode/tool/meta-log.ts` - Meta-Log tool for OpenCode
- ✅ `setup-opencode-plugin.sh` - Automated setup script
- ✅ `.opencode/PLUGIN_SETUP.md` - Setup documentation
- ✅ `OPENCODE_PLUGIN_INTEGRATION.md` - Integration guide

## Related Documentation

- **Plugin Setup**: `.opencode/PLUGIN_SETUP.md`
- **Plugin README**: `plugin/meta-log-plugin/README.md`
- **Linking Guide**: `plugin/meta-log-plugin/LINKING_SETUP.md`
- **OpenCode Tools**: `.opencode/README.md`
- **Meta-Log Spec**: `docs/05-Meta-Log/MULTIVERSE-CANVAS-RFC2119-SPEC.md`

---

**Status**: ✅ Integration Complete - Plugin ready for use in OpenCode
