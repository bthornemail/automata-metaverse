# MCP Server Patterns Reference

This document provides reference patterns for creating MCP (Model Context Protocol) servers, extracted from the Obsidian plugin integration.

## Basic MCP Server Structure

```typescript
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { CallToolRequestSchema, ErrorCode, ListToolsRequestSchema, McpError } from '@modelcontextprotocol/sdk/types.js';

class MyMCPServer {
  private server: Server;

  constructor() {
    this.server = new Server({
      name: 'my-mcp-server',
      version: '1.0.0',
    }, {
      capabilities: { tools: {} },
    });
    this.setupToolHandlers();
  }

  private setupToolHandlers(): void {
    // List tools handler
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      return {
        tools: [
          {
            name: 'my_tool',
            description: 'Tool description',
            inputSchema: {
              type: 'object',
              properties: {
                param: { type: 'string', description: 'Parameter description' }
              },
              required: ['param']
            }
          }
        ]
      };
    });

    // Call tool handler
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;
      if (!args) {
        throw new McpError(ErrorCode.InvalidParams, "Arguments are required");
      }

      try {
        switch (name) {
          case 'my_tool':
            return { content: [{ type: 'text', text: 'Result' }] };
          default:
            throw new McpError(ErrorCode.MethodNotFound, `Unknown tool: ${name}`);
        }
      } catch (error) {
        if (error instanceof Error) {
          throw new McpError(ErrorCode.InternalError, error.message);
        }
        throw new McpError(ErrorCode.InternalError, "An unknown error occurred");
      }
    });
  }

  public async run(): Promise<void> {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error('MCP server running on stdio');
  }
}

// Run the server
const server = new MyMCPServer();
server.run().catch(console.error);
```

## Initialization Pattern

For servers that require initialization:

```typescript
class InitializedMCPServer {
  private config?: MyConfig;

  private async handleInitialize(args: any): Promise<any> {
    const { requiredParam } = args;
    
    this.config = {
      requiredParam,
      // ... other config
    };

    // Initialize services
    // this.service = new Service(this.config);

    return {
      content: [{
        type: 'text',
        text: `Server initialized with: ${requiredParam}`
      }]
    };
  }

  private ensureInitialized(): void {
    if (!this.config) {
      throw new Error('Server not initialized. Call initialize_tool first.');
    }
  }

  // In tool handlers, check initialization:
  case 'some_tool':
    this.ensureInitialized();
    // ... use this.config
}
```

## Error Handling Pattern

```typescript
try {
  // Operation
  return { content: [{ type: 'text', text: 'Success' }] };
} catch (error) {
  if (error instanceof Error) {
    throw new McpError(ErrorCode.InternalError, error.message);
  }
  throw new McpError(ErrorCode.InternalError, "An unknown error occurred");
}
```

## Tool Response Patterns

### Simple Text Response
```typescript
return {
  content: [{ type: 'text', text: 'Simple response' }]
};
```

### JSON Response
```typescript
return {
  content: [{
    type: 'text',
    text: JSON.stringify(data, null, 2)
  }]
};
```

### Multi-line Response
```typescript
return {
  content: [{
    type: 'text',
    text: `Line 1\nLine 2\n\n${JSON.stringify(data, null, 2)}`
  }]
};
```

## Common Tool Patterns

### File Operations
```typescript
case 'read_file':
  const { filePath } = args;
  const content = fs.readFileSync(filePath, 'utf-8');
  return { content: [{ type: 'text', text: content }] };
```

### Async Operations
```typescript
case 'async_operation':
  const result = await someAsyncFunction(args);
  return { content: [{ type: 'text', text: JSON.stringify(result) }] };
```

### Validation Pattern
```typescript
case 'validate':
  if (!args.requiredField) {
    throw new McpError(ErrorCode.InvalidParams, "requiredField is required");
  }
  // ... validation logic
```

## Integration with Automaton System

MCP servers can integrate with automaton services:

```typescript
import { ManifestGenerator } from '../services/manifest-generator.js';
import { MetadataTracker } from '../services/metadata-tracker.js';
import { CanvasManager } from '../services/canvas-manager.js';

class AutomatonMCPServer {
  private manifestGenerator?: ManifestGenerator;
  private metadataTracker?: MetadataTracker;
  private canvasManager?: CanvasManager;

  // Initialize with automaton services
  private async handleInitialize(args: any) {
    this.manifestGenerator = new ManifestGenerator(args.vaultPath, args.mnemonic);
    this.metadataTracker = new MetadataTracker(args.vaultPath);
    this.canvasManager = new CanvasManager(args.vaultPath, args.mnemonic);
  }
}
```

## Best Practices

1. **Always validate arguments** before processing
2. **Use ensureInitialized()** pattern for servers requiring setup
3. **Provide clear error messages** using McpError
4. **Handle async operations** properly with await
5. **Return structured responses** with proper content types
6. **Log errors** to stderr (console.error) for debugging
7. **Use descriptive tool names** and parameter descriptions
8. **Document input schemas** clearly in tool definitions

---

**Reference**: Patterns extracted from Obsidian plugin MCP servers  
**Last Updated**: 2025-01-07
