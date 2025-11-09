import { FullConfig } from '@playwright/test';
import { initializeCI } from './ci-integration';

async function globalSetup(_config: FullConfig) {
  console.log('🚀 Starting Playwright global setup...');
  
  // Initialize CI/CD integration if environment variables are available
  await initializeCI();
  
  // Set up any global test data or state here
  // For example: create test database, seed data, etc.
  
  console.log('✅ Global setup complete');
}

export default globalSetup;