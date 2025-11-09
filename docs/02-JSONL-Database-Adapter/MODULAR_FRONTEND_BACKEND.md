---
id: modular-frontend-backend
title: "Modular Frontend & Backend Architecture"
level: foundational
type: documentation
tags: [frontend-backend, modular-architecture, react-hooks, api-integration]
keywords: [frontend-backend, modular-architecture, react-hooks, api-integration, database-service]
prerequisites: [modular-database-architecture]
enables: []
related: [jsonl-database-adapter-rfc2119-spec, jsonl-database-adapter-readme]
readingTime: 40
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

# Modular Frontend & Backend Architecture

## Overview

A fully modular architecture that separates frontend and backend concerns while supporting custom databases and JSONL-encoded R5RS functions.

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Frontend (React)                         │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │   Components │  │    Hooks     │  │   Services   │     │
│  │  (UI Layer)  │  │ (Data Layer) │  │ (API Layer) │     │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘     │
│         │                  │                  │             │
│         └──────────────────┴──────────────────┘             │
│                            │                                │
│                    Database Service                          │
│              (Database-Agnostic Interface)                   │
└────────────────────────────┼────────────────────────────────┘
                             │ HTTP/WebSocket
┌────────────────────────────▼────────────────────────────────┐
│                  Modular Backend API                        │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │   Routes     │  │  Middleware  │  │   WebSocket  │     │
│  │  (Express)   │  │   (Auth/CORS) │  │   (Real-time)│     │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘     │
│         │                  │                  │             │
│         └──────────────────┴──────────────────┘             │
│                            │                                │
│                    Database Adapter                          │
│              (Database Abstraction Layer)                    │
└────────────────────────────┼────────────────────────────────┘
                             │
┌────────────────────────────▼────────────────────────────────┐
│              Database Implementations                       │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐       │
│  │  JSONL   │ │  Redis  │ │ Postgres │ │ MongoDB  │       │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘       │
└─────────────────────────────────────────────────────────────┘
```

## Key Features

### 1. Database Abstraction
- **Unified Interface**: All databases implement the same interface
- **Easy Switching**: Change database type via configuration
- **Multiple Databases**: Use different databases for different purposes

### 2. R5RS Function Support
- **JSONL Storage**: Functions stored in `r5rs-functions-trie.jsonl`
- **Dynamic Invocation**: Invoke R5RS functions via API
- **Function Registry**: Centralized function management

### 3. Modular Frontend
- **Database-Agnostic**: Frontend doesn't know which database is used
- **Custom Hooks**: `useDatabase`, `useJSONL`, `useR5RSFunction`
- **Service Layer**: Abstracted API calls

### 4. Modular Backend
- **Adapter Pattern**: Pluggable database adapters
- **RESTful API**: Standard HTTP endpoints
- **WebSocket Support**: Real-time updates

## Usage Examples

### Frontend Component

```tsx
import { useJSONL, useR5RSFunction } from '@/hooks/useDatabase';

function AutomatonViewer() {
  const { data: automaton, loading, append } = useJSONL('automaton.jsonl');
  const { func, invoke } = useR5RSFunction('r5rs:church-zero');

  const handleInvoke = async () => {
    const result = await invoke([], { context: 'test' });
    console.log('Result:', result);
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div>
      <h1>Automaton Data</h1>
      <pre>{JSON.stringify(automaton, null, 2)}</pre>
      <button onClick={handleInvoke}>Invoke R5RS Function</button>
    </div>
  );
}
```

### Backend Setup

```typescript
import { ModularBackend } from './src/api/modular-backend';
import { DatabaseFactory } from './src/database/factory';

// Use JSONL database
const db = DatabaseFactory.create({
  type: 'jsonl',
  options: { basePath: './data' }
});

const backend = new ModularBackend(db);
await backend.initialize();
backend.getApp().listen(5555);
```

### Custom Database Adapter

```typescript
import { DatabaseAdapter } from './src/database/interface';

class MyCustomAdapter implements DatabaseAdapter {
  async connect() { /* ... */ }
  async readJSONL(file: string) { /* ... */ }
  async getR5RSFunction(name: string) { /* ... */ }
  // ... implement all interface methods
}

const db = DatabaseFactory.create({
  type: 'custom',
  adapter: new MyCustomAdapter()
});
```

## Configuration

### Environment Variables

```bash
# Backend
DB_TYPE=jsonl                    # jsonl, redis, postgres, mongodb, custom
DB_PATH=./data                   # For JSONL adapter
DB_CONNECTION_STRING=...          # For other adapters

# Frontend
VITE_API_URL=http://localhost:5555/api
VITE_WS_URL=ws://localhost:9001
```

## Benefits

1. **Modularity**: Frontend and backend are completely decoupled
2. **Flexibility**: Switch databases without code changes
3. **Testability**: Easy to mock and test
4. **Scalability**: Add new database adapters easily
5. **R5RS Integration**: Native support for JSONL-encoded functions
6. **Type Safety**: Full TypeScript support

## Migration Guide

### From Monolithic to Modular

1. **Backend**: Replace direct file access with database adapter
2. **Frontend**: Replace direct API calls with database service
3. **Configuration**: Set `DB_TYPE` environment variable
4. **Testing**: Use JSONL adapter for development, switch to production DB later

### Adding New Database

1. Implement `DatabaseAdapter` interface
2. Add to `DatabaseFactory`
3. Update configuration
4. No frontend changes needed!
