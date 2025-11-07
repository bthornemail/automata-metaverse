import { FullConfig } from '@playwright/test';

async function globalSetup(_config: FullConfig) {
  console.log('🚀 Starting Playwright global setup...');
  
  // Set up any global test data or state here
  // For example: create test database, seed data, etc.
  
  console.log('✅ Global setup complete');
}

export default globalSetup;