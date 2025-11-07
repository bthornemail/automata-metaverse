#!/usr/bin/env node

/**
 * OpenCode Integration Test Suite
 * Tests the integration between opencode commands and automaton system
 */

import OpenCodeIntegration from './opencode-integration';
import { existsSync, unlinkSync } from 'fs';

async function runTests() {
  console.log('🧪 Starting OpenCode Integration Tests...\n');
  
  const integration = new OpenCodeIntegration({
    canvasPath: './test-automaton.jsonl',
    enableRouting: true,
    enableCanvasUpdate: true,
    logLevel: 'debug'
  });
  
  let testsPassed = 0;
  let testsTotal = 0;
  
  function test(name: string, fn: () => Promise<void>) {
    testsTotal++;
    console.log(`📋 Test: ${name}`);
    
    return fn()
      .then(() => {
        console.log(`✅ PASSED: ${name}\n`);
        testsPassed++;
      })
      .catch((error: any) => {
        console.log(`❌ FAILED: ${name}`);
        console.log(`   Error: ${error.message}\n`);
      });
  }
  
  // Test 1: Basic command execution
  await test('Basic command execution', async () => {
    const result = await integration.executeCommand({
      tool: 'echo',
      args: ['Hello from OpenCode Integration'],
      priority: 'high'
    });
    
    if (!result || typeof result !== 'object') {
      throw new Error('Command did not return a valid result object');
    }
  });
  
  // Test 2: Batch execution
  await test('Batch command execution', async () => {
    const commands = [
      { tool: 'echo', args: ['First'], priority: 'high' as const },
      { tool: 'echo', args: ['Second'], priority: 'medium' as const },
      { tool: 'echo', args: ['Third'], priority: 'low' as const }
    ];
    
    const results = await integration.batchExecute(commands);
    
    if (results.length !== 3) {
      throw new Error('Expected 3 results, got ' + results.length);
    }
    
    const failedCount = results.filter(r => !r.success).length;
    if (failedCount > 0) {
      throw new Error(`${failedCount} commands failed`);
    }
  });
  
  // Test 3: Pipeline execution
  await test('Pipeline command execution', async () => {
    const commands = [
      { tool: 'echo', args: ['Step 1'] },
      { tool: 'echo', args: ['Step 2'] }
    ];
    
    const result = await integration.pipeline(commands);
    
    if (!result || typeof result !== 'object') {
      throw new Error('Pipeline did not return a valid result');
    }
  });
  
  // Test 4: Topology state
  await test('Topology state retrieval', async () => {
    const state = await integration.getTopologyState();
    
    if (!state || typeof state !== 'object') {
      throw new Error('Invalid topology state');
    }
  });
  
  // Test 5: Integration report
  await test('Integration report generation', async () => {
    const report = await integration.createReport();
    
    if (!report.timestamp || !report.config || !report.topology) {
      throw new Error('Invalid integration report');
    }
  });
  
  // Test 6: Error handling
  await test('Error handling', async () => {
    const result = await integration.executeCommand({
      tool: 'nonexistent-command-12345',
      args: []
    });
    
    if (!result || typeof result !== 'object') {
      throw new Error('Error handling did not return a valid result');
    }
  });
  
  // Cleanup
  if (existsSync('./test-automaton.jsonl')) {
    unlinkSync('./test-automaton.jsonl');
  }
  
  // Results
  console.log('📊 Test Results:');
  console.log(`   Passed: ${testsPassed}/${testsTotal}`);
  console.log(`   Success Rate: ${((testsPassed / testsTotal) * 100).toFixed(1)}%`);
  
  if (testsPassed === testsTotal) {
    console.log('\n🎉 All tests passed! OpenCode integration is working correctly.');
    process.exit(0);
  } else {
    console.log('\n⚠️  Some tests failed. Please check the integration.');
    process.exit(1);
  }
}

// Run tests if called directly
if (require.main === module) {
  runTests().catch((error) => {
    console.error('Test suite failed:', error);
    process.exit(1);
  });
}

export default runTests;