# React DevTools Guide for Metaverse Portal

## Setup

1. **Install React Developer Tools**:
   - Chrome/Edge: [Chrome Web Store](https://chrome.google.com/webstore/detail/react-developer-tools/fmkadmapgofadopljbjfkapdkoienihi)
   - Firefox: [Firefox Add-ons](https://addons.mozilla.org/en-US/firefox/addon/react-devtools/)
   - Or visit: https://react.dev/learn/react-developer-tools

2. **Open DevTools**:
   - Press `F12` or `Ctrl+Shift+I` (Windows/Linux)
   - Press `Cmd+Option+I` (Mac)
   - Look for the "⚛️ Components" tab

## Inspecting Avatars

### Finding Avatar Components

1. Open React DevTools Components tab
2. Search for: `EnhancedGLTFAvatar`
3. You'll see components like:
   - `EnhancedGLTFAvatar(0D-Topology-Agent)`
   - `EnhancedGLTFAvatar(1D-Temporal-Agent)`
   - etc.

### Checking Avatar Props

In React DevTools, select an avatar component and check:

- **`config`** object:
  - `id`: Avatar ID
  - `name`: Avatar name
  - `position`: Current position `[x, y, z]`
  - `dimension`: Dimension string (e.g., "0D", "1D")
  - `gltfUrl`: GLTF model URL (if set)
  - `hasGLTF`: Whether GLTF URL is provided
  - `enableAI`: Whether AI is enabled
  - `scale`: Avatar scale (should be 1.5)

### Debugging Avatar Visibility

1. **Check if avatars are rendering**:
   - Look for `EnhancedGLTFAvatar` components in the component tree
   - Check console for `[React DevTools] Rendering avatars:` logs

2. **Check avatar positions**:
   - In Components tab, select an avatar
   - Check `config.position` in props
   - Should be spread in a circle around center

3. **Check GLTF loading**:
   - Look for `gltfUrl` in props
   - If missing, avatars use default fallback geometry
   - Check console for `[React DevTools] EnhancedGLTFAvatar rendered:` logs

## Inspecting CollaborativeWorldIntegration

1. Search for: `CollaborativeWorldIntegration`
2. Check props:
   - `config`: Configuration object
   - `selectedSymbol`: Currently selected symbol
   - `onSymbolSelect`: Selection callback

3. Check state (hooks):
   - `agents`: Array of agent objects
   - `selectedAgentId`: Currently selected agent ID
   - `isInitialized`: Whether world is initialized

## Console Debugging

All components log debug info prefixed with `[React DevTools]`:

- `[React DevTools] CollaborativeWorldIntegration rendered with config:`
- `[React DevTools] Creating avatar config for agent:`
- `[React DevTools] Rendering avatars:`
- `[React DevTools] EnhancedGLTFAvatar rendered:`

## Common Issues

### Avatars Not Visible

1. Check `avatarConfigs` array in `CollaborativeWorldIntegration`
2. Verify `agents` state has data
3. Check avatar `position` values (should be spread in circle)
4. Check `scale` (should be 1.5)

### GLTF Models Not Loading

1. Check `config.gltfUrl` in avatar props
2. If `gltfUrl` is undefined, avatars use default geometry
3. To add GLTF models, set `gltfUrl` in avatar config

### Bridge Connections Overlay

- Check `showBridgeVisualization` state in `MetaversePortal`
- Should be `false` by default
- Overlay moved to bottom-right when shown

## Tips

- Use React DevTools Profiler to check render performance
- Use "Highlight updates" to see which components re-render
- Check component state changes in the timeline
- Use "Suspend" to pause component updates for inspection
