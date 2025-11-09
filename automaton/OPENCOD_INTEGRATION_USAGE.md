---
id: opencod-integration-usage
title: "OpenCode-Automaton Integration Usage Guide"
level: practical
type: guide
tags: [opencode-integration-usage, cli-integration, church-encoding, dimensional-operations]
keywords: [opencode-integration-usage, cli-integration, church-encoding, r5rs-canvas-engine, blackboard-architecture, automaton-self-building]
prerequisites: [opencode-integration, opencode-usage]
enables: []
related: [r5rs-canvas-engine, blackboard-architecture-guide, opencode-integration, opencode-usage]
readingTime: 30
difficulty: 3
blackboard:
  status: active
  assignedAgent: null
  lastUpdate: null
  dependencies: [r5rs-canvas-engine]
  watchers: []
  r5rsEngine: "r5rs-canvas-engine.scm"
  selfBuilding:
    enabled: true
    source: "r5rs-canvas-engine.scm"
    pattern: "blackboard-architecture"
    regeneration:
      function: "r5rs:parse-jsonl-canvas"
      args: ["generate.metaverse.jsonl"]
---

# OpenCode-Automaton Integration Usage Guide

This guide demonstrates how to use the OpenCode-Automaton integration system that bridges CLI commands with Church encoding dimensional operations.

## Quick Start

### 1. Basic Command Execution

```typescript
import OpenCodeIntegration from './opencode-integration';

const integration = new OpenCodeIntegration();

// Execute a simple command
await integration.executeCommand({
  tool: 'read',
  args: ['./package.json'],
  priority: 'high'
});
```

### 2. Batch Operations

```typescript
const commands = [
  { tool: 'read', args: ['./package.json'], priority: 'high' },
  { tool: 'bash', args: ['ls -la'], priority: 'medium' },
  { tool: 'glob', args: ['**/*.ts'], priority: 'low' }
];

const results = await integration.batchExecute(commands);
```

### 3. Pipeline Operations

```typescript
const pipeline = [
  { tool: 'read', args: ['./src/main.ts'] },
  { tool: 'grep', args: ['import'] },
  { tool: 'write', args: ['./imports.txt'] }
];

const finalResult = await integration.pipeline(pipeline);
```

## Dimensional Mapping

The integration maps opencode tools to Church encoding dimensions:

- **0D**: Identity operations (base topology)
- **1D**: Temporal operations (succession)
- **2D**: Structural operations (patterns, files)
- **3D**: Algebraic operations (transformations)
- **4D**: Network operations (system commands)
- **5D**: Consensus operations (todos, goals)
- **6D**: Intelligence operations (AI tasks)
- **7D**: Quantum operations (superposition)

### Tool-to-Dimension Mapping

| Tool | Dimension | Church Encoding |
|------|-----------|-----------------|
| read, glob, grep, list | 2D | λx.λy.λf.fxy |
| edit, write | 3D | λm.λn.λf.λx.mf(nfx) |
| bash, webfetch | 4D | λnetwork.execute(spacetime) |
| todowrite, todoread | 5D | λconsensus.validate(ledger) |
| task, pattern-analyzer | 6D | λai.attention(transform) |
| automaton-* tools | 7D | λquantum.superposition(ψ) |

## Configuration Options

```typescript
const integration = new OpenCodeIntegration({
  canvasPath: './automaton.jsonl',     // Path to canvas file
  enableRouting: true,                 // Enable dimensional routing
  enableCanvasUpdate: true,            // Update canvas with operations
  logLevel: 'debug'                   // Logging verbosity
});
```

## CLI Usage

### Direct Command Execution

```bash
# Execute a single command
./opencode-integration execute read ./package.json

# Execute system command
./opencode-integration execute bash "ls -la"

# Check topology state
./opencode-integration status

# Generate integration report
./opencode-integration report
```

### Using the Bridge Directly

```bash
# Route through dimensional hierarchy
./opencode-bridge read '{"filePath": "./package.json"}'

# Execute with Church encoding
./opencode-bridge edit '{"filePath": "./test.txt", "oldString": "old", "newString": "new"}'
```

### Command Router

```bash
# Route specific tools
./command-router read ./package.json
./command-router bash "echo 'Hello World'"
./command-router glob "**/*.ts"
```

## Advanced Usage

### Custom Dimensional Operations

```typescript
// Create custom operation with specific dimension
await integration.executeCommand({
  tool: 'custom-operation',
  args: ['param1', 'param2'],
  dimension: '6D',  // Force AI dimension
  priority: 'high'
});
```

### Canvas Integration

The integration automatically updates the computational topology canvas with each operation:

```json
{
  "id": "opencode-read-1699123456789",
  "type": "operation",
  "tool": "read",
  "params": {"filePath": "./package.json"},
  "dimension": "2D",
  "timestamp": "2024-01-01T12:00:00.000Z",
  "church": "λx.λy.λf.fxy",
  "x": 123.45,
  "y": 678.90
}
```

### Error Handling

```typescript
try {
  const result = await integration.executeCommand({
    tool: 'nonexistent',
    args: []
  });
} catch (error) {
  console.error('Command failed:', error.message);
  
  // Check if it's a routing error
  if (error.message.includes('Unknown tool')) {
    // Handle unknown tool
  }
}
```

## Testing

Run the integration test suite:

```bash
./test-integration
```

This will test:
- Basic command execution
- Batch operations
- Pipeline operations
- Topology state retrieval
- Integration report generation
- Error handling

## Monitoring

### Check System Status

```typescript
const state = await integration.getTopologyState();
console.log('Total operations:', state.total);
console.log('Operations by dimension:', state.dimensions);
console.log('Recent operations:', state.recent);
```

### Generate Reports

```typescript
const report = await integration.createReport();
console.log('Integration status:', report.integration);
console.log('Topology status:', report.topology);
```

## Best Practices

1. **Use appropriate priorities** for commands to ensure proper execution order
2. **Enable canvas updates** to maintain a complete operation history
3. **Use debug logging** during development to trace dimensional routing
4. **Handle errors gracefully** as operations may fail at any dimensional level
5. **Monitor topology state** to understand system evolution over time

## Troubleshooting

### Common Issues

1. **"Unknown tool" error**: Check if the tool is properly mapped in TOOL_DIMENSIONS
2. **Canvas update failures**: Ensure the canvas file is writable and properly formatted
3. **Routing failures**: Verify that all dimensional agents are properly implemented
4. **Pipeline failures**: Check that each step in the pipeline produces valid output for the next step

### Debug Mode

Enable debug logging to trace operations:

```typescript
const integration = new OpenCodeIntegration({
  logLevel: 'debug'
});
```

This will show detailed information about:
- Dimensional routing decisions
- Church encoding transformations
- Canvas update operations
- Error conditions

## Integration with Existing Systems

The OpenCode integration can be easily integrated with existing systems:

1. **CI/CD pipelines**: Use batch operations for automated testing and deployment
2. **Development workflows**: Use pipelines for complex multi-step operations
3. **Monitoring systems**: Use topology state and reports for system health monitoring
4. **AI systems**: Leverage 6D intelligence operations for advanced processing

## Future Enhancements

Planned enhancements include:
- Real-time canvas visualization
- Advanced dimensional analytics
- Custom agent implementations
- Multi-user collaboration features
- Quantum computing integration