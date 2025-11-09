---
id: modular-database-architecture
title: "Modular Database Architecture"
level: foundational
type: documentation
tags: [database-architecture, modular-design, database-adapter, jsonl, r5rs-functions]
keywords: [database-architecture, modular-design, database-adapter, jsonl-support, r5rs-functions, database-abstraction]
prerequisites: [jsonl-database-adapter-readme]
enables: [modular-frontend-backend]
related: [jsonl-database-adapter-rfc2119-spec, r5rs-canvas-engine]
readingTime: 45
difficulty: 3
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

# Modular Database Architecture

## Overview

This architecture provides a modular, database-agnostic system for storing and querying JSONL-encoded R5RS functions and automaton data.

## Architecture Layers

```
┌─────────────────────────────────────────────────────────┐
│                    Frontend (UI)                        │
│  - Database-agnostic React components                   │
│  - Custom hooks for data access                         │
│  - Service layer abstraction                            │
└────────────────────┬────────────────────────────────────┘
                     │ HTTP/WebSocket
┌────────────────────▼────────────────────────────────────┐
│              Modular Backend API                        │
│  - Express.js routes                                    │
│  - Database-agnostic endpoints                          │
│  - R5RS function invocation                             │
└────────────────────┬────────────────────────────────────┘
                     │ Database Adapter Interface
┌────────────────────▼────────────────────────────────────┐
│            Database Abstraction Layer                   │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ │
│  │ JSONL    │ │ Redis    │ │ Postgres │ │ MongoDB  │ │
│  │ Adapter  │ │ Adapter  │ │ Adapter  │ │ Adapter  │ │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘ │
└─────────────────────────────────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────────────┐
│              Storage Layer                              │
│  - JSONL files                                          │
│  - Redis cache                                          │
│  - SQL databases                                        │
│  - NoSQL databases                                      │
└─────────────────────────────────────────────────────────┘
```

## Database Adapter Interface

All database adapters implement the `DatabaseAdapter` interface:

```typescript
interface DatabaseAdapter {
  // Connection
  connect(): Promise<void>;
  disconnect(): Promise<void>;
  
  // JSONL operations
  readJSONL(filePath: string): Promise<any[]>;
  writeJSONL(filePath: string, data: any[]): Promise<void>;
  
  // R5RS Function operations
  getR5RSFunction(name: string): Promise<any>;
  invokeR5RSFunction(name: string, args: any[]): Promise<any>;
  
  // Generic CRUD
  create(collection: string, data: any): Promise<string>;
  read(collection: string, id: string): Promise<any>;
  query(collection: string, filter: any): Promise<any[]>;
}
```

## Supported Databases

### 1. JSONL Adapter (Default)
- **Use Case**: File-based storage, perfect for R5RS functions
- **Pros**: Simple, version-control friendly, no dependencies
- **Cons**: Not suitable for high-concurrency

### 2. Redis Adapter (Planned)
- **Use Case**: Caching, session storage, real-time data
- **Pros**: Fast, in-memory, pub/sub support
- **Cons**: Volatile (unless persistence enabled)

### 3. PostgreSQL Adapter (Planned)
- **Use Case**: Relational data, complex queries, ACID transactions
- **Pros**: Mature, powerful querying, JSON support
- **Cons**: Requires setup, more complex

### 4. MongoDB Adapter (Planned)
- **Use Case**: Document storage, flexible schemas
- **Pros**: Schema-less, good for JSONL-like data
- **Cons**: Different query language

## Configuration

### Environment Variables

```bash
# Database type: jsonl, redis, postgres, mongodb, sqlite, custom
DB_TYPE=jsonl

# Database path/connection string
DB_PATH=./data
DB_CONNECTION_STRING=postgresql://user:pass@localhost/db

# Custom adapter (if DB_TYPE=custom)
CUSTOM_DB_ADAPTER=./adapters/my-adapter
```

### Programmatic Configuration

```typescript
import { DatabaseFactory } from './src/database/factory';
import { JSONLAdapter } from './src/database/adapters/jsonl-adapter';

// Use JSONL adapter
const db = DatabaseFactory.create({
  type: 'jsonl',
  options: { basePath: './data' }
});

// Use custom adapter
const customDb = DatabaseFactory.create({
  type: 'custom',
  adapter: new MyCustomAdapter()
});
```

## Usage Examples

### Backend API

```typescript
import { ModularBackend } from './src/api/modular-backend';
import { DatabaseFactory } from './src/database/factory';

// Create backend with JSONL database
const db = DatabaseFactory.create({ type: 'jsonl', options: { basePath: './data' } });
const backend = new ModularBackend(db);

await backend.initialize();
backend.getApp().listen(5555);
```

### Frontend Integration

```typescript
// Frontend service (database-agnostic)
import { apiService } from './services/api';

// Read automaton.jsonl
const automaton = await apiService.get('/api/jsonl/automaton.jsonl');

// Get R5RS function
const func = await apiService.get('/api/r5rs/functions/r5rs:church-zero');

// Invoke R5RS function
const result = await apiService.post('/api/r5rs/functions/r5rs:church-zero/invoke', {
  args: [],
  context: {}
});

// Query collection
const nodes = await apiService.get('/api/nodes?filter={"type":"text"}&limit=10');
```

## R5RS Function Storage

R5RS functions are stored in `r5rs-functions-trie.jsonl`:

```jsonl
{"id":"0D-system-r5rs-church-zero-0","type":"node","function":"r5rs:church-zero","definition":"(define (church-zero) (lambda (f) (lambda (x) x)))"}
{"id":"0D-system-r5rs-church-one-1","type":"node","function":"r5rs:church-one","definition":"(define (church-one) (lambda (f) (lambda (x) (f x))))"}
```

Functions can be:
- **Registered**: `POST /api/r5rs/functions/:name/register`
- **Retrieved**: `GET /api/r5rs/functions/:name`
- **Invoked**: `POST /api/r5rs/functions/:name/invoke`
- **Listed**: `GET /api/r5rs/functions?pattern=church`

## Benefits

1. **Modularity**: Switch databases without changing application code
2. **Testability**: Easy to mock database for testing
3. **Flexibility**: Support multiple databases simultaneously
4. **R5RS Integration**: Native support for JSONL-encoded R5RS functions
5. **Type Safety**: TypeScript interfaces ensure consistency

## Migration Path

1. **Start with JSONL**: Use JSONL adapter for development
2. **Add Redis**: Add Redis for caching and sessions
3. **Scale to Postgres**: Migrate to PostgreSQL for production
4. **Custom Adapters**: Implement custom adapters as needed

## Next Steps

1. Implement Redis adapter
2. Implement PostgreSQL adapter
3. Add database migration tools
4. Add connection pooling
5. Add query optimization
6. Add transaction support across adapters
