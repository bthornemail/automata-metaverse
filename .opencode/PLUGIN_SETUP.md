# OpenCode Meta-Log Plugin Setup

This guide explains how to set up the Meta-Log plugin to work with OpenCode.

## Quick Setup

Run the setup script:

```bash
./setup-opencode-plugin.sh
```

This will:
1. Build and link `meta-log-db` (if available)
2. Build `meta-log-plugin`
3. Link the plugin to `.opencode/` directory
4. Verify the installation

## Manual Setup

If you prefer to set up manually:

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

### 3. Build meta-log-plugin

```bash
cd plugin/meta-log-plugin
npm install
npm run build
npm link
cd ../..
```

### 4. Link plugin to OpenCode

```bash
cd .opencode
npm link meta-log-plugin
cd ..
```

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
// Query with ProLog
{
  queryType: "prolog",
  query: "inherits(X, Z) :- vertical(Y, X), inherits(Y, Z).",
  canvasPath: "./automaton-kernel.jsonl" // optional
}
```

### DataLog Query

```typescript
// Query with DataLog
{
  queryType: "datalog",
  query: "node(Id, Type, X, Y, Text)?",
  canvasPath: "./automaton-kernel.jsonl", // optional
  program: "{\"facts\": [...]}" // optional DataLog program
}
```

### SPARQL Query

```typescript
// Query with SPARQL
{
  queryType: "sparql",
  query: "SELECT ?id ?target WHERE { ?id rdf:type metaverse:Reference }",
  canvasPath: "./automaton-kernel.jsonl" // optional
}
```

### Load Canvas

```typescript
// Load a canvas file
{
  queryType: "load",
  canvasPath: "./automaton-kernel.jsonl"
}
```

## Troubleshooting

### Plugin Not Found

If you get "Meta-Log plugin not available" error:

1. Check if plugin is built:
   ```bash
   ls plugin/meta-log-plugin/dist/adapters/opencode.js
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

2. **TypeScript Errors**: Some Obsidian-specific code may have errors. The OpenCode adapter should still work if `meta-log-db` is available.

3. **Missing Dependencies**: Install dependencies:
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
   node -e "console.log(Object.keys(require('./plugin/meta-log-plugin/dist/index.js')))"
   ```

## Architecture

The integration works as follows:

```
OpenCode (.opencode/)
    ↓
meta-log tool (.opencode/tool/meta-log.ts)
    ↓
meta-log-plugin (plugin/meta-log-plugin/)
    ↓
meta-log-db (meta-log-db/)
    ↓
Canvas files (automaton-kernel.jsonl, etc.)
```

## Related Documentation

- **Plugin Documentation**: `plugin/meta-log-plugin/README.md`
- **Linking Setup**: `plugin/meta-log-plugin/LINKING_SETUP.md`
- **OpenCode Tools**: `.opencode/README.md`
- **Meta-Log Spec**: `docs/05-Meta-Log/MULTIVERSE-CANVAS-RFC2119-SPEC.md`
