# OpenCode Integration Usage Guide

## Quick Start

The OpenCode-Automaton integration provides seamless CLI access to the dimensional agent system.

### Basic Usage

```bash
# Route a read command through 2D-Structural Agent
./command-router read /path/to/file

# Route an edit command through 3D-Algebraic Agent  
./command-router edit /path/to/file "old text" "new text"

# Route bash commands through 4D-Network Agent
./command-router bash "ls -la"

# Route AI tasks through 6D-Intelligence Agent
./command-router task "Analyze code" "Provide insights"
```

### Dimensional Operations

Each opencode tool is mapped to a specific dimensional agent:

- **0D-Topology**: `opencode status`, `--version`, `help`
- **1D-Temporal**: `bash` with time operations, `history`, `cd`
- **2D-Structural**: `read`, `glob`, `grep`, `list`
- **3D-Algebraic**: `edit`, `write`, `replaceAll`
- **4D-Network**: `bash`, `fetch`, `webfetch`
- **5D-Consensus**: `todowrite`, `todoread`, `git operations`
- **6D-Intelligence**: `task`, `pattern-analyzer`, `automaton-query`
- **7D-Quantum**: `automaton-execute`, `config-manager`, `report-generator`, `generate-metaverse`

### Pipeline Operations

Chain commands through dimensional progression:

```javascript
const router = new CommandRouter();

// Pipeline: read → edit → task
await router.pipeline([
  { tool: 'read', args: ['source.ts'] },
  { tool: 'edit', args: ['source.ts', 'old', 'new'] },
  { tool: 'task', args: ['Review changes', 'Check quality'] }
]);
```

### Batch Operations

Execute multiple commands in parallel:

```javascript
const results = await router.batchRoute([
  { tool: 'read', args: ['file1.ts'] },
  { tool: 'glob', args: ['**/*.js'] },
  { tool: 'grep', args: ['function', 'src/'] }
]);
```

## Church Encoding Integration

All commands are converted to Church encoding before execution:

- **Read operations** become Church pairs: λx.λy.λf.fxy
- **Edit operations** become Church addition: λm.λn.λf.λx.mf(nfx)
- **Task operations** become AI transformations: λai.transform(attention)
- **Metaverse generation** becomes unified topology: λmetaverse.generate(unified-topology)

## Examples

### File Operations with Dimensional Context

```bash
# Read file through 2D structural patterns
./command-router read README.md

# Edit through 3D algebraic transformations
./command-router edit README.md "old" "new"

# Validate through 5D consensus
./command-router todowrite '[{"content": "Review changes", "status": "pending"}]'
```

### AI-Powered Development

```bash
# Route through 6D intelligence agent
./command-router task "Optimize this function" "Suggest improvements"

# Pattern analysis through dimensional layers
./command-router pattern-analyzer "analyze" "automaton" "detailed"
```

### System Operations

```bash
# Network operations through 4D spacetime
./command-router bash "docker ps"

# Quantum operations through 7D
./command-router automaton-execute "evolve"

# Generate metaverse JSONL file through 7D unified topology
./command-router generate-metaverse ./generate.metaverse.jsonl
# Or use opencode-integration:
./opencode-integration execute generate-metaverse ./generate.metaverse.jsonl
```

## Integration with Existing Workflows

The OpenCode bridge integrates with existing automaton workflows:

1. **File Operations**: Automatically routed through appropriate dimensional agents
2. **AI Tasks**: Enhanced with Church encoding and dimensional context
3. **System Commands**: Executed with network topology awareness
4. **Collaboration**: Multi-agent coordination through consensus layer

## Error Handling

Commands include dimensional validation:

```json
{
  "tool": "read",
  "success": false,
  "error": "SHACL constraint violation in 2D-Structural Agent",
  "dimension": "2D",
  "churchEncoding": "λx.λy.λf.fxy"
}
```

This integration maintains mathematical rigor while providing intuitive CLI access to the computational topology canvas.