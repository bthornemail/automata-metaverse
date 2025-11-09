---
id: jsonl-database-adapter-quick-reference
title: "JSONL Database Adapter Quick Reference"
level: practical
type: quick-reference
tags: [quick-reference, database-adapter, jsonl, r5rs-functions]
keywords: [quick-reference, database-adapter, jsonl, r5rs-functions, usage-examples]
prerequisites: [jsonl-database-adapter-readme]
enables: []
related: [modular-database-architecture, modular-frontend-backend]
readingTime: 15
difficulty: 2
blackboard:
  status: active
  assignedAgent: "2D-Structural-Agent"
  lastUpdate: 2025-01-07
  dependencies: [r5rs-canvas-engine]
  watchers: []
  r5rsEngine: "r5rs-canvas-engine.scm"
  selfBuilding:
    enabled: true
    source: "r5rs-canvas-engine.scm"
    pattern: "database-architecture"
---

# Quick Reference Guide

## Database Adapter Quick Reference

### Backend Usage

```typescript
// 1. Import modules
import { DatabaseFactory } from './src/database/factory';
import { ModularBackend } from './src/api/modular-backend';

// 2. Create database adapter
const db = DatabaseFactory.create({
  type: 'jsonl',                    // jsonl | redis | postgres | mongodb | sqlite | custom
  options: { basePath: './data' }   // Adapter-specific options
});

// 3. Create backend
const backend = new ModularBackend(db);
await backend.initialize();
backend.getApp().listen(5555);
```

### Frontend Usage

```typescript
// 1. Import hooks
import { useJSONL, useR5RSFunction, useCollection } from '@/hooks/useDatabase';

// 2. Use in components
function MyComponent() {
  const { data, loading, append } = useJSONL('automaton.jsonl');
  const { func, invoke } = useR5RSFunction('r5rs:church-zero');
  const { items, create, update, delete: remove } = useCollection('nodes');
  
  // Use the data...
}
```

## API Endpoints

### JSONL Operations

```
GET    /api/jsonl/:file              # Read JSONL file
POST   /api/jsonl/:file              # Write JSONL file
POST   /api/jsonl/:file/append        # Append to JSONL file
```

### R5RS Functions

```
GET    /api/r5rs/functions           # List all functions
GET    /api/r5rs/functions/:name     # Get function definition
POST   /api/r5rs/functions/:name/invoke    # Invoke function
POST   /api/r5rs/functions/:name/register # Register function
```

### Generic CRUD

```
POST   /api/:collection              # Create item
GET    /api/:collection/:id          # Read item
PUT    /api/:collection/:id          # Update item
DELETE /api/:collection/:id          # Delete item
GET    /api/:collection               # Query collection
```

## Database Adapter Interface

```typescript
interface DatabaseAdapter {
  // Connection
  connect(): Promise<void>;
  disconnect(): Promise<void>;
  isConnected(): boolean;

  // JSONL
  readJSONL(filePath: string): Promise<any[]>;
  writeJSONL(filePath: string, data: any[]): Promise<void>;
  appendJSONL(filePath: string, data: any): Promise<void>;

  // R5RS Functions
  getR5RSFunction(name: string): Promise<any>;
  listR5RSFunctions(pattern?: string): Promise<string[]>;
  invokeR5RSFunction(name: string, args: any[], context?: any): Promise<any>;
  registerR5RSFunction(name: string, definition: any): Promise<void>;

  // CRUD
  create(collection: string, data: any): Promise<string>;
  read(collection: string, id: string): Promise<any>;
  update(collection: string, id: string, data: any): Promise<void>;
  delete(collection: string, id: string): Promise<void>;
  query(collection: string, filter: any, options?: QueryOptions): Promise<any[]>;
}
```

## Environment Variables

```bash
# Database Configuration
DB_TYPE=jsonl                      # Database type
DB_PATH=./data                     # Path for JSONL adapter
DB_CONNECTION_STRING=...            # Connection string for other adapters

# API Configuration
PORT=5555                          # Backend port
WS_PORT=9001                       # WebSocket port
```

## Common Patterns

### Reading automaton.jsonl

```typescript
// Backend
const automaton = await db.readJSONL('automaton.jsonl');

// Frontend
const { data: automaton } = useJSONL('automaton.jsonl');
```

### Invoking R5RS Function

```typescript
// Backend
const result = await db.invokeR5RSFunction('r5rs:church-zero', [], { context: 'test' });

// Frontend
const { invoke } = useR5RSFunction('r5rs:church-zero');
const result = await invoke([], { context: 'test' });
```

### Querying Collection

```typescript
// Backend
const nodes = await db.query('nodes', { type: 'text' }, { limit: 10 });

// Frontend
const { items: nodes } = useCollection('nodes', { type: 'text' }, { limit: 10 });
```

## File Structure

```
src/database/
├── interface.ts              # Database adapter interface
├── factory.ts                # Database factory
├── index.ts                  # Exports
└── adapters/
    └── jsonl-adapter.ts      # JSONL implementation

src/api/
└── modular-backend.ts        # Modular backend API

ui/src/
├── services/
│   └── database-service.ts   # Frontend database service
└── hooks/
    └── useDatabase.ts        # React hooks
```
