/**
 * Refactored UI Server
 * 
 * Main entry point - now uses modular server architecture
 */

import { startServer } from './src/server';

// Start the server
startServer().catch((error) => {
  console.error('❌ Failed to start server:', error);
  process.exit(1);
});
