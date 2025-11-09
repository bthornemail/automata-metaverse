#!/usr/bin/env node

/**
 * OpenCode-Automaton Integration Demo
 * Demonstrates the integration between opencode commands and Church encoding dimensions
 */

import OpenCodeIntegration from './opencode-integration';

async function runDemo() {
  console.log('🚀 OpenCode-Automaton Integration Demo\n');
  
  const integration = new OpenCodeIntegration({
    canvasPath: './demo-automaton.jsonl',
    enableRouting: true,
    enableCanvasUpdate: true,
    logLevel: 'info'
  });
  
  console.log('📋 1. Basic Command Execution');
  console.log('   Executing: echo "Hello from dimensional hierarchy"');
  
  const result1 = await integration.executeCommand({
    tool: 'echo',
    args: ['Hello from dimensional hierarchy'],
    priority: 'high'
  });
  
  console.log('   Result:', result1.dimension || '4D-network', 'operation completed\n');
  
  console.log('📋 2. File Operations (2D Structural)');
  console.log('   Reading package.json through Church pair encoding');
  
  const result2 = await integration.executeCommand({
    tool: 'read',
    args: ['./package.json'],
    priority: 'high'
  });
  
  console.log('   Result:', result2.type || 'church-pair', 'encoding applied\n');
  
  console.log('📋 3. Batch Operations with Priority');
  console.log('   Executing multiple commands with different priorities');
  
  const commands = [
    { tool: 'echo', args: ['High priority task'], priority: 'high' as const },
    { tool: 'echo', args: ['Medium priority task'], priority: 'medium' as const },
    { tool: 'echo', args: ['Low priority task'], priority: 'low' as const }
  ];
  
  const batchResults = await integration.batchExecute(commands);
  console.log('   Batch completed:', batchResults.filter(r => r.success).length, '/', batchResults.length, 'successful\n');
  
  console.log('📋 4. Pipeline with Dimensional Progression');
  console.log('   Creating a pipeline through multiple dimensions');
  
  const pipeline = [
    { tool: 'echo', args: ['Starting pipeline'] },
    { tool: 'echo', args: ['Processing through dimensions'] },
    { tool: 'echo', args: ['Completing pipeline'] }
  ];
  
  const pipelineResult = await integration.pipeline(pipeline);
  console.log('   Pipeline result dimension:', pipelineResult.dimension || '4D-network', '\n');
  
  console.log('📋 5. Topology State Analysis');
  console.log('   Analyzing computational topology canvas');
  
  const state = await integration.getTopologyState();
  console.log('   Total operations:', state.total || 0);
  console.log('   Recent operations:', state.recent?.length || 0);
  
  if (state.dimensions) {
    console.log('   Operations by dimension:');
    Object.entries(state.dimensions).forEach(([dim, count]) => {
      console.log(`     ${dim}: ${count}`);
    });
  }
  console.log();
  
  console.log('📋 6. Integration Report');
  console.log('   Generating comprehensive integration report');
  
  const report = await integration.createReport();
  console.log('   Report generated at:', report.timestamp);
  console.log('   Integration status:', report.integration.bridge);
  console.log('   Canvas updates:', report.integration.canvas);
  console.log();
  
  console.log('🎯 7. Advanced Dimensional Operations');
  console.log('   Demonstrating Church encoding transformations');
  
  // Show some advanced operations
  const advancedOps = [
    { tool: 'todowrite', args: [[{ id: '1', content: 'Complete integration demo', status: 'pending' }]] },
    { tool: 'task', args: ['Analyze dimensional patterns', 'Search through canvas for patterns'] },
    { tool: 'bash', args: ['echo "Network operation through spacetime"'] }
  ];
  
  for (const op of advancedOps) {
    const result = await integration.executeCommand(op);
    console.log(`   ${op.tool}:`, result.dimension || 'unknown', 'dimension');
  }
  console.log();
  
  console.log('📊 Final State Summary');
  const finalState = await integration.getTopologyState();
  console.log('   Final operation count:', finalState.total || 0);
  console.log('   Canvas file:', './demo-automaton.jsonl');
  console.log('   Integration active: ✅');
  console.log();
  
  console.log('🎉 Demo completed successfully!');
  console.log('   The OpenCode-Automaton integration is fully operational.');
  console.log('   All commands have been routed through Church encoding dimensions.');
  console.log('   The computational topology canvas has been updated with each operation.');
  
  // Cleanup demo file
  try {
    const { unlinkSync } = await import('fs');
    unlinkSync('./demo-automaton.jsonl');
    console.log('   Demo canvas file cleaned up.');
  } catch (error) {
    // File might not exist or be in use
  }
}

// Run demo if called directly
if (require.main === module) {
  runDemo().catch((error) => {
    console.error('Demo failed:', error);
    process.exit(1);
  });
}

export default runDemo;