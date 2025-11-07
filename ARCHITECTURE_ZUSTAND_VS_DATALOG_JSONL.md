# Architecture: Zustand vs Prolog/Datalog/JSONL

## Question: Why do we need Zustand if we have Prolog Datalog and JSONL?

This is an excellent architectural question! The answer is that **each technology serves a different purpose** in different layers of the application.

## Layer Separation

### 1. **JSONL** - Persistent Data Storage Layer
**Purpose**: File-based persistent storage
- Stores the actual automaton data (states, transitions, self-references)
- Persists across application restarts
- Read/written by the backend server
- Format: Line-delimited JSON objects

**Example**:
```jsonl
{"id":"0D-topology","type":"text","x":0,"y":0}
{"id":"1D-temporal","type":"node","x":100,"y":100}
```

**When to use**: 
- Long-term data persistence
- Data that survives server restarts
- Source of truth for automaton structure

---

### 2. **Prolog/Datalog** - Logic/Query Layer (Server-Side)
**Purpose**: Rule-based inference, complex queries, constraint validation
- Runs on the **server** (backend)
- Handles complex logic, rules, and inference
- Validates SHACL constraints
- Performs complex queries across the data

**Example**:
```prolog
% Server-side Prolog/Datalog
shacl-violation(N) :- shacl-shape(N,C), not satisfies(N,C).
missing_attention(N) :- implements(N,Y), rdf:type(Y,'ai'), 
                       not prov:used(Y,'attention-mechanism').
```

**When to use**:
- Server-side logic and inference
- Complex queries that need rule-based reasoning
- Constraint validation (SHACL)
- Backend processing

---

### 3. **Zustand** - Client-Side React State Management (UI Layer)
**Purpose**: React component state, UI state, real-time updates
- Runs in the **browser** (client-side)
- Manages React component state
- Handles UI state (active tab, theme, notifications)
- Coordinates real-time WebSocket updates
- Optimizes React re-renders

**Example**:
```typescript
// Client-side Zustand store
const useAutomatonStore = create((set) => ({
  status: { isRunning: false, currentDimension: 0 },
  activeTab: 'overview',
  theme: 'dark',
  notifications: [],
  // ... UI state
}));
```

**When to use**:
- React component state management
- UI state (tabs, modals, loading states)
- Real-time WebSocket updates
- Client-side caching and optimization
- User interaction state

---

## Why We Need All Three

### The Data Flow:

```
┌─────────────────────────────────────────────────────────┐
│                    CLIENT (Browser)                      │
│                                                           │
│  ┌──────────────┐      ┌──────────────┐                │
│  │   Zustand    │◄────►│   React UI   │                │
│  │  (UI State)  │      │  Components  │                │
│  └──────┬───────┘      └──────┬───────┘                │
│         │                     │                          │
│         │ WebSocket           │ HTTP API                 │
│         ▼                     ▼                          │
└─────────┼─────────────────────┼──────────────────────────┘
          │                     │
          │                     │
┌─────────┼─────────────────────┼──────────────────────────┐
│         │                     │                            │
│         ▼                     ▼                            │
│  ┌──────────────┐      ┌──────────────┐                 │
│  │   WebSocket  │      │   REST API   │                 │
│  │   Server     │      │   Server     │                 │
│  └──────┬───────┘      └──────┬───────┘                 │
│         │                      │                           │
│         │                      │                           │
│         ▼                      ▼                           │
│  ┌──────────────┐      ┌──────────────┐                 │
│  │  Prolog/     │      │   JSONL      │                 │
│  │  Datalog     │      │   Files      │                 │
│  │  (Logic)     │      │  (Storage)   │                 │
│  └──────────────┘      └──────────────┘                 │
│                                                           │
│                    SERVER (Backend)                       │
└───────────────────────────────────────────────────────────┘
```

---

## Specific Use Cases

### Zustand (Client-Side) Handles:
1. **UI State**: Which tab is active? What theme is selected?
2. **Component State**: Is a modal open? What's the loading state?
3. **Real-time Updates**: WebSocket messages update UI immediately
4. **Optimization**: Prevents unnecessary re-renders
5. **User Interactions**: Button clicks, form inputs, navigation

### Prolog/Datalog (Server-Side) Handles:
1. **Logic Rules**: "If dimension is 6D, then AI system must have attention mechanism"
2. **Constraint Validation**: SHACL shape validation
3. **Complex Queries**: "Find all nodes that violate constraints"
4. **Inference**: Derive new facts from existing data
5. **Backend Processing**: Server-side logic that doesn't belong in UI

### JSONL (Storage) Handles:
1. **Persistence**: Data survives server restarts
2. **Source of Truth**: The actual automaton structure
3. **File I/O**: Reading/writing automaton data
4. **Backup/Restore**: Can be version controlled, backed up

---

## Example: Dimension Change Flow

When a user changes dimension:

1. **UI Layer (Zustand)**:
   ```typescript
   // User clicks dimension button
   setDimension(5) // Updates Zustand store
   // UI immediately updates (optimistic update)
   ```

2. **API Call**:
   ```typescript
   // Zustand action calls API
   await unifiedApi.setDimension(5)
   ```

3. **Server Processing (Prolog/Datalog)**:
   ```prolog
   % Server validates dimension change
   valid_dimension(5) :- dimension_range(0,7), 5 >= 0, 5 =< 7.
   % Server checks constraints
   check_constraints(5).
   ```

4. **Storage (JSONL)**:
   ```typescript
   // Server updates JSONL file
   // Updates current dimension in persistent storage
   ```

5. **WebSocket Update**:
   ```typescript
   // Server broadcasts change
   socket.emit('dimension', { dimension: 5 })
   ```

6. **UI Update (Zustand)**:
   ```typescript
   // Zustand receives WebSocket update
   // Updates store, triggers React re-render
   // All components using dimension automatically update
   ```

---

## Could We Remove Zustand?

**Technically possible, but not recommended** because:

### Without Zustand, we'd need:
1. **React Context API** - More boilerplate, less performant
2. **useState everywhere** - Duplicate state, no shared state
3. **Props drilling** - Pass state through many component layers
4. **No optimization** - Every component re-renders on any state change
5. **No persistence** - Lose UI preferences on page refresh
6. **No caching** - Every API call hits the server

### With Zustand, we get:
1. ✅ **Single source of truth** - All components share state
2. ✅ **Optimized re-renders** - Only components using changed state re-render
3. ✅ **Persistence** - UI preferences saved to localStorage
4. ✅ **Caching** - API responses cached client-side
5. ✅ **Type safety** - Full TypeScript support
6. ✅ **DevTools** - Redux DevTools integration
7. ✅ **Small bundle** - Only 1KB gzipped

---

## Summary

| Technology | Layer | Purpose | When to Use |
|------------|-------|---------|-------------|
| **JSONL** | Storage | Persistent data | Long-term storage, file I/O |
| **Prolog/Datalog** | Server Logic | Rules, queries, inference | Backend logic, validation, complex queries |
| **Zustand** | Client UI | React state management | UI state, component coordination, real-time updates |

**They complement each other** - each serves a different purpose in a different layer:
- **JSONL** = What data exists (persistence)
- **Prolog/Datalog** = How to process data (server logic)
- **Zustand** = How UI reacts to data (client state)

---

## Alternative: Could We Use Prolog/Datalog for UI State?

**No**, because:
1. Prolog/Datalog runs on the **server**, not in the browser
2. React needs **JavaScript/TypeScript** for component state
3. Prolog/Datalog is for **logic/queries**, not UI state management
4. Browser can't execute Prolog/Datalog directly
5. Would require constant server round-trips for every UI interaction

**However**, we could:
- Use Prolog/Datalog to **validate** UI actions before executing
- Use Prolog/Datalog to **query** data for the UI
- Use Prolog/Datalog to **infer** what UI should show

But the actual UI state management must be client-side (Zustand/React).

---

## Conclusion

**Zustand is essential** for:
- React component state management
- UI responsiveness and optimization
- Real-time WebSocket coordination
- Client-side caching and performance

**Prolog/Datalog is essential** for:
- Server-side logic and rules
- Complex queries and inference
- Constraint validation

**JSONL is essential** for:
- Persistent data storage
- Source of truth for automaton structure

**All three work together** to create a complete, performant, and maintainable system!
