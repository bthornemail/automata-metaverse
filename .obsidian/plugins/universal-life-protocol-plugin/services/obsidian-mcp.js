#!/usr/bin/env node

// Simple transpilation wrapper for obsidian-mcp.ts
import { createRequire } from 'module';

const require = createRequire(import.meta.url);

// Use tsx to run TypeScript directly
try {
  require('tsx/esm');
  await import('../src/obsidian-mcp.ts');
} catch (error) {
  console.error('Failed to start obsidian-mcp:', error);
  console.error('Make sure tsx is installed: npm install tsx');
  process.exit(1);
}