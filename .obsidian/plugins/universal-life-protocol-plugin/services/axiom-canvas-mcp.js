#!/usr/bin/env node

// Simple transpilation wrapper for axiom-canvas-mcp.ts
import { createRequire } from 'module';

const require = createRequire(import.meta.url);

// Use tsx to run TypeScript directly
try {
  require('tsx/esm');
  await import('../src/axiom-canvas-mcp.ts');
} catch (error) {
  console.error('Failed to start axiom-canvas-mcp:', error);
  console.error('Make sure tsx is installed: npm install tsx');
  process.exit(1);
}