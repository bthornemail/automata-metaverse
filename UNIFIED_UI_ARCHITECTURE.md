---
id: unified-ui-architecture
title: "Unified UI Architecture - Implementation Summary"
level: practical
type: implementation
tags: [ui-architecture, unified-ui, zustand, state-management, api-service]
keywords: [unified-ui-architecture, ui-architecture, zustand, state-management, r5rs-canvas-engine, blackboard-architecture, automaton-self-building]
prerequisites: [readme-main]
enables: [code-editor-integration-complete]
related: [r5rs-canvas-engine, blackboard-architecture-guide, readme-main]
readingTime: 40
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
  architecture:
    stateManagement: "Zustand store with persistent state"
    apiService: "Unified API service with caching and deduplication"
    crossComponent: "Cross-component communication system"
---

# Unified UI Architecture - Implementation Summary

## Overview

The UI has been successfully unified from disparate components into a cohesive system with shared state management, unified APIs, and cross-component communication.

## ✅ Completed Components

### Phase 1: Core Infrastructure ✅

1. **Unified State Management** (`ui/src/store/automatonStore.ts`)
   - Zustand store with persistent state
   - Centralized automaton state (dimension, running status, history)
   - UI state (active tab, theme, notifications)
   - Component-specific states (quantum, opencode, agents)
   - Loading and error state management

2. **Unified API Service** (`ui/src/services/unifiedApi.ts`)
   - Request caching with TTL
   - Request deduplication
   - Unified error handling
   - Cache invalidation strategies
   - All existing API endpoints consolidated

3. **Unified WebSocket Manager** (`ui/src/services/unifiedWebSocket.ts`)
   - Single WebSocket connection for entire app
   - Event bus pattern for component communication
   - Automatic reconnection with exponential backoff
   - Message queuing for offline scenarios
   - Type-safe event system

4. **AutomatonContext Provider** (`ui/src/contexts/AutomatonContext.tsx`)
   - Wraps entire app
   - Initializes WebSocket connection
   - Subscribes to real-time updates
   - Loads initial state
   - Handles cleanup

### Phase 2: Shared Components & Layout ✅

1. **Shared Component Library** (`ui/src/components/shared/`)
   - `Button.tsx` - Unified button with variants and sizes
   - `Card.tsx` - Consistent card styling
   - `Modal.tsx` - Shared modal system with animations
   - `Toast.tsx` - Unified notification system
   - `LoadingSpinner.tsx` - Consistent loading states
   - `ErrorBoundary.tsx` - Error handling component
   - `index.ts` - Centralized exports

2. **Unified Design System** (`ui/src/styles/design-system.css`)
   - CSS variables for colors, spacing, typography
   - Dimension colors (0D-7D)
   - Status colors
   - Theme support (dark/light/quantum)
   - Utility classes

### Phase 3: Unified Hooks ✅

1. **State Hooks** (`ui/src/hooks/useUnifiedState.ts`)
   - `useUnifiedState()` - Access full store
   - `useStatus()` - Status selector (optimized)
   - `useDimension()` - Dimension selector
   - `useExecutionHistory()` - History selector
   - `useSelfReference()` - Self-reference selector

2. **Action Hooks** (`ui/src/hooks/useAutomatonActions.ts`)
   - `useAutomatonActions()` - Unified action dispatcher
   - Handles loading/error states
   - Shows notifications
   - All automaton control functions

3. **Real-time Hooks** (`ui/src/hooks/useRealtimeUpdates.ts`)
   - `useRealtimeUpdates()` - Subscribe to WebSocket updates
   - `useEvent()` - Subscribe to specific events
   - Automatic state synchronization

4. **API Hooks** (`ui/src/hooks/useApi.ts`)
   - `useApi()` - Make API calls with loading/error states
   - `useUnifiedApi()` - Direct access to API service

5. **Cross-Component Hooks** (`ui/src/hooks/useCrossComponent.ts`)
   - `useCrossComponent()` - Component communication
   - `useDimensionChange()` - Dimension change listener
   - `useActionExecution()` - Action execution listener

### Phase 4: Component Refactoring ✅

1. **App.tsx** ✅ - Updated to use:
   - `AutomatonProvider` wrapper
   - `ErrorBoundary` for error handling
   - `ToastContainer` for notifications
   - Unified state for active tab

2. **Dashboard.tsx** ✅ - Fully refactored to use:
   - Unified state hooks (`useStatus`, `useWsConnected`)
   - Unified actions (`useAutomatonActions`)
   - Real-time updates (`useRealtimeUpdates`)
   - Shared components (`Button`, `Card`, `LoadingSpinner`)

3. **DimensionalCanvas.tsx** ✅ - Fully refactored to use:
   - Unified state hooks (`useStatus`)
   - Cross-component communication (`useDimensionChange`)
   - Shared components (`Card`, `Button`)
   - Real-time dimension updates via event bus

4. **ControlPanel.tsx** ✅ - Fully refactored to use:
   - Unified state hooks (`useStatus`)
   - Unified actions (`useAutomatonActions`)
   - Shared components (`Card`, `Button`)
   - Consistent UI with unified system

## Architecture Benefits

### 1. Unified State ✅
- Single source of truth for all components
- No duplicate state management
- Consistent state updates across components
- Optimized selectors reduce unnecessary re-renders

### 2. Cross-Component Communication ✅
- Event bus for component-to-component messaging
- Real-time synchronization (e.g., dimension change updates canvas + quantum)
- Type-safe event system
- Example: DimensionalCanvas automatically updates when dimension changes

### 3. Performance Improvements ✅
- Request caching reduces duplicate API calls
- Request deduplication prevents redundant requests
- Optimized selectors reduce unnecessary re-renders
- Single WebSocket connection instead of multiple

### 4. Developer Experience ✅
- Shared components reduce code duplication
- Unified hooks simplify component logic
- Consistent error handling and loading states
- Easier to add new components
- Type-safe APIs throughout

### 5. User Experience ✅
- Consistent UI/UX across all tabs
- Real-time updates across components
- Unified notification system
- Better error handling
- Smooth transitions and animations

## File Structure

```
ui/src/
├── contexts/
│   └── AutomatonContext.tsx          ✅ Unified context provider
├── store/
│   └── automatonStore.ts             ✅ Zustand store
├── services/
│   ├── unifiedApi.ts                 ✅ Unified API service
│   ├── unifiedWebSocket.ts           ✅ Unified WebSocket
│   ├── api.ts                        (legacy - can be deprecated)
│   └── websocket.ts                  (legacy - can be deprecated)
├── hooks/
│   ├── useUnifiedState.ts            ✅ Unified state hook
│   ├── useAutomatonActions.ts        ✅ Actions hook
│   ├── useRealtimeUpdates.ts         ✅ WebSocket hook
│   ├── useApi.ts                     ✅ API hook
│   ├── useCrossComponent.ts          ✅ Cross-component hook
│   ├── useAutomatonState.ts          (legacy - can be deprecated)
│   └── useExecutionHistory.ts       (legacy - can be deprecated)
├── components/
│   ├── shared/                       ✅ Shared components
│   │   ├── Button.tsx
│   │   ├── Card.tsx
│   │   ├── Modal.tsx
│   │   ├── Toast.tsx
│   │   ├── LoadingSpinner.tsx
│   │   ├── ErrorBoundary.tsx
│   │   └── index.ts
│   ├── Dashboard/
│   │   └── Dashboard.tsx             ✅ Refactored
│   ├── DimensionalCanvas/
│   │   └── DimensionalCanvas.tsx      ✅ Refactored
│   ├── ControlPanel/
│   │   └── ControlPanel.tsx          ✅ Refactored
│   └── [other components]            ⏳ Can follow same pattern
├── styles/
│   └── design-system.css             ✅ Unified design system
└── App.tsx                            ✅ Updated with context
```

## Usage Examples

### Using Unified State

```typescript
import { useStatus, useDimension } from '@/hooks/useUnifiedState';

const MyComponent = () => {
  const status = useStatus();
  const dimension = useDimension();
  // ...
};
```

### Using Unified Actions

```typescript
import { useAutomatonActions } from '@/hooks/useAutomatonActions';

const MyComponent = () => {
  const { startAutomaton, stopAutomaton, setDimension } = useAutomatonActions();
  // ...
};
```

### Using Cross-Component Communication

```typescript
import { useDimensionChange } from '@/hooks/useCrossComponent';

const MyComponent = () => {
  useDimensionChange((dimension) => {
    // React to dimension changes
    console.log('Dimension changed to:', dimension);
  });
  // ...
};
```

### Using Shared Components

```typescript
import { Button, Card, LoadingSpinner } from '@/components/shared';

const MyComponent = () => {
  return (
    <Card title="My Card">
      <Button variant="primary" onClick={handleClick}>
        Click Me
      </Button>
    </Card>
  );
};
```

## Real-World Example: DimensionalCanvas

The DimensionalCanvas component demonstrates the power of the unified system:

1. **Unified State**: Uses `useStatus()` to get current dimension
2. **Cross-Component Communication**: Uses `useDimensionChange()` to listen for dimension changes
3. **Real-time Updates**: Automatically updates when dimension changes via event bus
4. **Shared Components**: Uses `Card` and `Button` for consistent UI

```typescript
const DimensionalCanvas: React.FC = () => {
  const status = useStatus();
  const [currentDimension, setCurrentDimension] = useState(status.currentDimension);

  // Subscribe to dimension changes via event bus
  useDimensionChange((dimension) => {
    setCurrentDimension(dimension);
    // Canvas automatically updates!
  });

  // ... rest of component
};
```

## Next Steps

### Remaining Component Refactoring

The following components can follow the same refactoring pattern:

1. **SelfReferenceAnalyzer.tsx** - Update to use unified state and API
2. **ExecutionHistory.tsx** - Update to use unified state and API
3. **AgentInterface.tsx** - Update to use unified state and API
4. **QuantumVisualization.tsx** - Update to use unified state and subscribe to dimension changes
5. **OpenCodeInterface.tsx** - Update to use unified state and API
6. **Configuration.tsx** - Update to use unified state and API
7. **AdvancedAnimations components** - Update to use unified state

### Migration Pattern

For each component:

1. **Replace imports**:
   ```typescript
   // Old
   import { useAutomatonState } from '@/hooks/useAutomatonState';
   
   // New
   import { useStatus } from '@/hooks/useUnifiedState';
   import { useAutomatonActions } from '@/hooks/useAutomatonActions';
   ```

2. **Replace state access**:
   ```typescript
   // Old
   const { state, actions } = useAutomatonState();
   
   // New
   const status = useStatus();
   const { startAutomaton, stopAutomaton } = useAutomatonActions();
   ```

3. **Replace API calls**:
   ```typescript
   // Old
   import { apiService } from '@/services/api';
   const response = await apiService.getStatus();
   
   // New
   import { unifiedApi } from '@/services/unifiedApi';
   const response = await unifiedApi.getStatus();
   ```

4. **Use shared components**:
   ```typescript
   // Old
   <div className="p-6 bg-gray-800 rounded-xl">
   
   // New
   <Card title="My Component">
   ```

5. **Subscribe to events** (if needed):
   ```typescript
   import { useDimensionChange } from '@/hooks/useCrossComponent';
   
   useDimensionChange((dimension) => {
     // React to dimension changes
   });
   ```

## Success Metrics ✅

- ✅ All core components use unified state
- ✅ Single WebSocket connection
- ✅ Request caching and deduplication working
- ✅ Cross-component updates working (DimensionalCanvas updates when dimension changes)
- ✅ Consistent UI/UX across refactored components
- ✅ Shared components reduce duplication
- ✅ Easier to add new features/components
- ✅ Type-safe APIs throughout

## Notes

- Legacy hooks (`useAutomatonState`, `useExecutionHistory`) and services (`api.ts`, `websocket.ts`) are still available for backward compatibility
- They can be deprecated once all components are migrated
- The unified system is fully functional and ready for production use
- All refactored components (Dashboard, DimensionalCanvas, ControlPanel) are working with the unified system

## Testing Checklist

- [x] Unified state store works correctly
- [x] Unified API service caches and deduplicates requests
- [x] Unified WebSocket connects and emits events
- [x] Cross-component communication works (dimension changes update canvas)
- [x] Shared components render correctly
- [x] Dashboard component uses unified system
- [x] DimensionalCanvas component uses unified system
- [x] ControlPanel component uses unified system
- [x] Toast notifications work
- [x] Error boundary catches errors
- [x] Loading states work correctly
