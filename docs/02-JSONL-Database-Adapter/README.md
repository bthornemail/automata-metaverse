---
id: jsonl-database-adapter-readme
title: "JSONL Database Adapter Documentation"
level: foundational
type: documentation
tags: [jsonl-database-adapter, database-architecture, modular-design, r5rs-functions]
keywords: [jsonl-database-adapter, database-architecture, modular-design, database-abstraction, jsonl-support, r5rs-functions, frontend-backend-integration]
prerequisites: [r5rs-expressions-readme]
enables: [jsonl-database-adapter-rfc2119-spec]
related: [r5rs-canvas-engine, meta-log-docs-readme]
readingTime: 30
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

# JSONL Database Adapter Documentation

This folder contains documentation for the modular database architecture that supports JSONL-encoded R5RS functions and custom database backends.

## Documentation Files

- **[MODULAR_DATABASE_ARCHITECTURE.md](./MODULAR_DATABASE_ARCHITECTURE.md)** - Complete database abstraction layer documentation
  - Database adapter interface
  - Supported database types (JSONL, Redis, PostgreSQL, MongoDB, SQLite)
  - Configuration and usage examples
  - R5RS function storage and invocation

- **[MODULAR_FRONTEND_BACKEND.md](./MODULAR_FRONTEND_BACKEND.md)** - Frontend and backend integration guide
  - Architecture overview
  - Frontend hooks and services
  - Backend API setup
  - Usage examples
  - Migration guide

## Quick Links

### Code Files

- **Backend Interface**: `src/database/interface.ts`
- **JSONL Adapter**: `src/database/adapters/jsonl-adapter.ts`
- **Database Factory**: `src/database/factory.ts`
- **Modular Backend**: `src/api/modular-backend.ts`

- **Frontend Service**: `ui/src/services/database-service.ts`
- **React Hooks**: `ui/src/hooks/useDatabase.ts`

## Key Features

1. **Database Abstraction**: Unified interface for all database types
2. **JSONL Support**: Native support for JSONL-encoded R5RS functions
3. **Modular Design**: Easy to switch databases via configuration
4. **Type Safety**: Full TypeScript support
5. **Frontend Integration**: React hooks for database operations

## Quick Start

```typescript
// Backend
import { DatabaseFactory } from './src/database/factory';
import { ModularBackend } from './src/api/modular-backend';

const db = DatabaseFactory.create({ type: 'jsonl', options: { basePath: './data' } });
const backend = new ModularBackend(db);
await backend.initialize();

// Frontend
import { useJSONL, useR5RSFunction } from '@/hooks/useDatabase';

const { data } = useJSONL('automaton.jsonl');
const { invoke } = useR5RSFunction('r5rs:church-zero');
```

## Configuration

Set environment variables:
```bash
DB_TYPE=jsonl                    # jsonl, redis, postgres, mongodb, custom
DB_PATH=./data                   # For JSONL adapter
DB_CONNECTION_STRING=...          # For other adapters
```

## Related Documentation

- See `docs/01-R5RS-Expressions/` for R5RS function documentation
- See `docs/00-Inbox/` for JSONL format specifications
