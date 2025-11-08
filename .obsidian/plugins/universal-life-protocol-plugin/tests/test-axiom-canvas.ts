#!/usr/bin/env node

/**
 * Test the Axiom Canvas MCP functionality (Upgraded for Hypergraph Engine)
 * Demonstrates creating axioms, connecting them, generating canvases, and executing.
 */

import { AxiomCanvasManager } from '../src/axiom-canvas-mcp';

// Test the new AxiomCanvasManager
function testCanvasManager() {
  console.log('🎨 Testing Upgraded AxiomCanvasManager...\n');
  
  const manager = new AxiomCanvasManager();
  
  // 1. Create a new canvas
  const canvasId = 'test-canvas';
  manager.getOrCreateCanvas(canvasId);
  
  // 2. Create an axiom node
  const axiom1 = manager.createAxiom(canvasId, 100, 100, 'js', '(x) => x * 2', ['x']);
  console.log('Created axiom node:');
  console.log(JSON.stringify(axiom1, null, 2));
  
  // Verify the node structure
  if (!axiom1.metadata || axiom1.metadata.vectorType !== 'axiom') {
    throw new Error('Axiom node does not have correct geometric metadata.');
  }
  console.log('\n✅ Axiom node has correct geometric structure.\n');

  // 3. Create another axiom
  const axiom2 = manager.createAxiom(canvasId, 400, 100, 'js', '(x) => x + 10', ['x']);

  // 4. Connect them
  const edge = manager.connectAxioms(canvasId, axiom1.id, axiom2.id, 'II.1');
  console.log('Connected axioms with edge:');
  console.log(JSON.stringify(edge, null, 2));

  if (!edge.metadata || edge.metadata.type !== 'axiomatic-connection') {
    throw new Error('Edge does not have correct axiomatic metadata.');
  }
  console.log('\n✅ Edge has correct axiomatic structure.\n');

  return { manager, canvasId };
}

// Test the new canvas generation tools
function testCanvasGeneration(manager: AxiomCanvasManager, canvasId: string) {
    console.log('🖼️ Testing Canvas Generation Tools...\n');

    // Test P2P Canvas Generation
    const p2pCanvas = manager.generateP2PCanvas('p2p-demo');
    console.log(`Generated P2P Canvas with ${p2pCanvas.nodes.length} nodes and ${p2pCanvas.edges.length} edges.`);
    if (p2pCanvas.nodes.length === 0 || p2pCanvas.edges.length === 0) {
        throw new Error('P2P Canvas generation failed.');
    }
    console.log('✅ P2P Canvas generated successfully.\n');

    // Test Axiom Visualization Canvas Generation
    const axiomCanvas = manager.generateAxiomCanvas('axiom-viz-demo');
    console.log(`Generated Axiom Visualization Canvas with ${axiomCanvas.nodes.length} nodes.`);
    if (axiomCanvas.nodes.length < 21) { // Should have at least 21 axioms
        throw new Error('Axiom Visualization Canvas generation failed.');
    }
    console.log('✅ Axiom Visualization Canvas generated successfully.\n');
}


// Main test runner
async function main() {
  console.log('🎼 AXIOM CANVAS MCP v2 - COMPREHENSIVE TEST\n');
  console.log('==========================================\n');
  
  try {
    const { manager, canvasId } = testCanvasManager();
    testCanvasGeneration(manager, canvasId);
    
    console.log('\n✅ All tests completed successfully!');
    console.log('\nKey Features Demonstrated:');
    console.log('• Upgraded AxiomCanvasManager with Hypergraph Engine');
    console.log('• Creation of geometrically-aware axiom nodes');
    console.log('• Creation of axiomatically-validated edges');
    console.log('• Generation of P2P Communication Canvas');
    console.log('• Generation of Hilbert\'s Axioms Visualization Canvas');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

// Run tests if this file is executed directly
main();
