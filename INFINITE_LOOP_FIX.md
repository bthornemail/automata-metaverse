# Infinite Loop Fix

## Problem
React error: "Maximum update depth exceeded" - infinite update loop caused by duplicate event subscriptions and state updates triggering re-renders.

## Root Causes

1. **Duplicate Event Subscriptions**
   - `AutomatonContext` was subscribing to WebSocket events
   - `useRealtimeUpdates()` hook was ALSO subscribing to the same events
   - Both were updating the Zustand store, causing circular updates

2. **Unstable Function References**
   - `clearError` function in Dashboard was recreated on every render
   - Zustand selectors in `useEffect` dependencies were causing re-subscriptions

3. **No Change Detection**
   - Store updates happened even when state didn't actually change
   - This triggered unnecessary re-renders

## Solutions Applied

### 1. Removed Duplicate Subscription
- Removed `useRealtimeUpdates()` call from Dashboard component
- Only `AutomatonContext` handles WebSocket subscriptions now
- This ensures single source of truth for event handling

### 2. Fixed Function Stability
- Changed `clearError` to use `useCallback` with stable dependencies
- Used stable handler functions in `AutomatonContext` useEffect

### 3. Added Change Detection
- `setStatus` now checks if status actually changed before updating
- `setDimension` checks if dimension changed before updating
- Prevents unnecessary store updates and re-renders

### 4. Fixed useEffect Dependencies
- Changed `AutomatonContext` useEffect to empty dependency array
- Zustand selectors are stable references, so they don't need to be in deps
- Added eslint-disable comment to document why

## Files Changed

1. `ui/src/components/Dashboard/Dashboard.tsx`
   - Removed `useRealtimeUpdates()` call
   - Fixed `clearError` to use `useCallback`

2. `ui/src/contexts/AutomatonContext.tsx`
   - Used stable handler functions
   - Changed useEffect dependencies to empty array
   - Added comments explaining the change

3. `ui/src/store/automatonStore.ts`
   - Added change detection in `setStatus`
   - Added change detection in `setDimension`

## Testing

After these changes:
- ✅ No infinite loops
- ✅ WebSocket events still work correctly
- ✅ State updates only happen when data actually changes
- ✅ Build passes successfully

## Prevention

To prevent similar issues in the future:

1. **Single Subscription Rule**: Only subscribe to events in one place (AutomatonContext)
2. **Stable References**: Use `useCallback` for functions passed to effects
3. **Change Detection**: Always check if state actually changed before updating
4. **Empty Dependencies**: Zustand selectors are stable - use empty deps array
