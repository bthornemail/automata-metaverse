import { FullConfig } from '@playwright/test';
import { cleanupCI } from './ci-integration';

async function globalTeardown(_config: FullConfig) {
  console.log('🧹 Starting Playwright global teardown...');
  
  // Cleanup CI/CD connection
  await cleanupCI();
  
  console.log('✅ Global teardown complete');
}

export default globalTeardown;
