# GPU.js Installation Guide

## Overview

`gpu.js` is an optional dependency for GPU acceleration in the scalable automaton. It's configured as an `optionalDependency` in `package.json`, which means:

- ✅ The automaton will work **without** GPU acceleration (uses CPU-based parallelization)
- ⚠️ GPU acceleration requires native build tools to compile

## Current Status

The automaton will automatically detect if `gpu.js` is available and use it if present. If not available, it will gracefully fall back to CPU-based parallelization.

## Installing GPU.js (Optional)

If you want GPU acceleration, you need to install native build tools first:

### On Ubuntu/Debian:
```bash
sudo apt-get update
sudo apt-get install build-essential python3
```

### On macOS:
```bash
xcode-select --install
```

### Then install gpu.js:
```bash
npm install gpu.js
```

## Verification

After installation, the automaton will show:
```
✅ GPU.js detected and working - GPU acceleration available
```

If not installed, you'll see:
```
⚠️  GPU.js is in package.json but not installed (may require native build tools)
   Continuing without GPU acceleration
```

## Performance Impact

- **With GPU**: Faster parallel computations for large batches
- **Without GPU**: Uses CPU-based Promise parallelization (still very fast for most workloads)

The automaton is fully functional either way!
