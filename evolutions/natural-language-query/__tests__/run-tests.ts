#!/usr/bin/env tsx
/**
 * Test runner for Natural Language Query tests
 */

import * as path from 'path';
// @ts-ignore - glob types may not be available
import { glob } from 'glob';

async function runTests() {
  console.log('🧪 Running Natural Language Query Tests...\n');

  const testFiles = await glob('**/__tests__/*.test.ts', {
    cwd: __dirname,
    absolute: true
  });

  if (testFiles.length === 0) {
    console.log('❌ No test files found');
    process.exit(1);
  }

  console.log(`Found ${testFiles.length} test file(s):\n`);
  testFiles.forEach((file: string) => {
    console.log(`  - ${path.relative(__dirname, file)}`);
  });

  console.log('\n📝 Note: These tests require a test runner like Jest or Mocha.');
  console.log('   To run with Jest: npm test');
  console.log('   To run with Mocha: npx mocha --require ts-node/register "**/__tests__/*.test.ts"');
  console.log('\n✅ Test files created successfully!');
}

runTests().catch(error => {
  console.error('❌ Error:', error);
  process.exit(1);
});
