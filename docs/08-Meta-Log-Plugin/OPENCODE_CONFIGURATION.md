# OpenCode Configuration for Meta-Log Plugin

## Overview

The Meta-Log plugin is **not** configured through the `opencode.jsonc` file. Instead, it's loaded dynamically through the tool system.

## Configuration Method

### Option 1: Default Configuration (Recommended)

The plugin uses default configuration when initialized. Defaults:
- `canvasPath`: `./automaton-kernel.jsonl`
- `enableProlog`: `true`
- `enableDatalog`: `true`
- `enableRdf`: `true`

### Option 2: Tool Arguments

Configuration can be passed through tool arguments in `.opencode/tool/meta-log.ts`:

```typescript
const plugin = new OpenCodeMetaLogPlugin({
  canvasPath: args.canvasPath || "./automaton-kernel.jsonl",
  enableProlog: true,
  enableDatalog: true,
  enableRdf: true
});
```

### Option 3: Environment Variables

You can set environment variables:
- `META_LOG_CANVAS_PATH` - Path to canvas file
- `META_LOG_ENABLE_PROLOG` - Enable ProLog (true/false)
- `META_LOG_ENABLE_DATALOG` - Enable DataLog (true/false)
- `META_LOG_ENABLE_RDF` - Enable RDF/SPARQL (true/false)

### Option 4: Config File

The plugin can read from `plugin/meta-log-plugin/meta-log-config.json`:

```json
{
  "canvasPath": "./automaton-kernel.jsonl",
  "enableProlog": true,
  "enableDatalog": true,
  "enableRdf": true
}
```

## Why Not in opencode.jsonc?

OpenCode's schema doesn't support a top-level `plugins` key. Plugins are loaded through the tool system in `.opencode/tool/` directory.

## Tool Integration

The Meta-Log plugin is available through:
- **Tool**: `.opencode/tool/meta-log.ts`
- **Usage**: Automatically loaded when tools are executed
- **Configuration**: Handled by the tool itself

## Migration from plugins Key

If you had `plugins` in `opencode.jsonc`, remove it:

```jsonc
// ❌ Don't use this
{
  "plugins": {
    "meta-log-plugin": { ... }
  }
}

// ✅ Correct - no plugins key needed
{
  "agent": { ... },
  "provider": { ... }
}
```

The plugin will work without the `plugins` key because it's loaded through the tool system.
