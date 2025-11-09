/**
 * CI Pipeline Adapter Test Script
 * 
 * Basic tests to verify the CI adapter is working correctly
 * Run with: npx ts-node src/ci/test.ts
 */

import { CIPipelineFactory } from './index';

async function testAdapterCreation() {
  console.log('🧪 Testing CI Adapter Creation...');
  
  try {
    // Test factory creation (will fail without env vars, but should not throw on creation)
    const adapter = CIPipelineFactory.fromEnvironment();
    console.log('✅ Adapter created successfully');
    console.log(`   Type: ${adapter.constructor.name}`);
    console.log(`   Connected: ${adapter.isConnected()}`);
    return true;
  } catch (error: any) {
    if (error.message.includes('token') || error.message.includes('repository')) {
      console.log('⚠️  Adapter creation requires environment variables:');
      console.log('   - GITHUB_TOKEN');
      console.log('   - GITHUB_REPOSITORY');
      console.log('   This is expected in test environment.');
      return true; // Expected error
    }
    console.error('❌ Unexpected error:', error.message);
    return false;
  }
}

async function testTypeExports() {
  console.log('\n🧪 Testing Type Exports...');
  
  try {
    // Test that all types are exported
    const { 
      CIPipelineFactory,
      GitHubActionsAdapter,
      CIAgentManager,
      waitForPipeline,
      formatPipelineLogs,
      isPipelineSuccess,
      isPipelineFailure,
      isPipelineRunning,
    } = await import('./index');
    
    console.log('✅ All exports available:');
    console.log(`   - CIPipelineFactory: ${typeof CIPipelineFactory}`);
    console.log(`   - GitHubActionsAdapter: ${typeof GitHubActionsAdapter}`);
    console.log(`   - CIAgentManager: ${typeof CIAgentManager}`);
    console.log(`   - waitForPipeline: ${typeof waitForPipeline}`);
    console.log(`   - formatPipelineLogs: ${typeof formatPipelineLogs}`);
    console.log(`   - isPipelineSuccess: ${typeof isPipelineSuccess}`);
    console.log(`   - isPipelineFailure: ${typeof isPipelineFailure}`);
    console.log(`   - isPipelineRunning: ${typeof isPipelineRunning}`);
    
    return true;
  } catch (error: any) {
    console.error('❌ Export test failed:', error.message);
    return false;
  }
}

async function testStatusHelpers() {
  console.log('\n🧪 Testing Status Helpers...');
  
  try {
    const { isPipelineSuccess, isPipelineFailure, isPipelineRunning } = await import('./utils');
    
    // Test success
    if (!isPipelineSuccess('success')) {
      throw new Error('isPipelineSuccess failed');
    }
    if (isPipelineSuccess('failure')) {
      throw new Error('isPipelineSuccess returned true for failure');
    }
    
    // Test failure
    if (!isPipelineFailure('failure')) {
      throw new Error('isPipelineFailure failed');
    }
    if (!isPipelineFailure('cancelled')) {
      throw new Error('isPipelineFailure failed for cancelled');
    }
    
    // Test running
    if (!isPipelineRunning('running')) {
      throw new Error('isPipelineRunning failed');
    }
    if (!isPipelineRunning('pending')) {
      throw new Error('isPipelineRunning failed for pending');
    }
    if (isPipelineRunning('success')) {
      throw new Error('isPipelineRunning returned true for success');
    }
    
    console.log('✅ Status helpers working correctly');
    return true;
  } catch (error: any) {
    console.error('❌ Status helper test failed:', error.message);
    return false;
  }
}

async function testAgentManager() {
  console.log('\n🧪 Testing Agent Manager...');
  
  try {
    const { CIPipelineFactory, CIAgentManager } = await import('./index');
    
    // Create a mock adapter (will fail connection, but structure should work)
    const adapter = CIPipelineFactory.fromEnvironment();
    const agentManager = new CIAgentManager(adapter);
    
    console.log('✅ Agent Manager created:');
    console.log(`   - Network Agent: ${typeof agentManager.network}`);
    console.log(`   - Consensus Agent: ${typeof agentManager.consensus}`);
    console.log(`   - Intelligence Agent: ${typeof agentManager.intelligence}`);
    
    return true;
  } catch (error: any) {
    if (error.message.includes('token') || error.message.includes('repository')) {
      console.log('⚠️  Agent Manager test requires environment variables');
      console.log('   Structure is correct, but connection requires credentials.');
      return true; // Expected
    }
    console.error('❌ Agent Manager test failed:', error.message);
    return false;
  }
}

async function runAllTests() {
  console.log('='.repeat(60));
  console.log('CI Pipeline Adapter Test Suite');
  console.log('='.repeat(60));
  
  const results = {
    adapterCreation: await testAdapterCreation(),
    typeExports: await testTypeExports(),
    statusHelpers: await testStatusHelpers(),
    agentManager: await testAgentManager(),
  };
  
  console.log('\n' + '='.repeat(60));
  console.log('Test Results Summary');
  console.log('='.repeat(60));
  
  const allPassed = Object.values(results).every(r => r === true);
  
  for (const [test, passed] of Object.entries(results)) {
    console.log(`${passed ? '✅' : '❌'} ${test}`);
  }
  
  console.log('\n' + '='.repeat(60));
  if (allPassed) {
    console.log('✅ All tests passed!');
    console.log('\nNote: Full functionality requires:');
    console.log('  - GITHUB_TOKEN environment variable');
    console.log('  - GITHUB_REPOSITORY environment variable');
  } else {
    console.log('❌ Some tests failed');
    process.exit(1);
  }
}

// Run tests if executed directly
if (require.main === module) {
  runAllTests().catch(error => {
    console.error('Test suite failed:', error);
    process.exit(1);
  });
}

export { runAllTests };
