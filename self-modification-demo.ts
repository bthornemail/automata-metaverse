import { AdvancedSelfReferencingAutomaton } from './evolutions/advanced-automaton/advanced-automaton';

async function demonstrateSelfModification() {
  console.log('=== Self-Modification Demonstration ===');
  
  const automaton = new AdvancedSelfReferencingAutomaton('./automaton.jsonl');
  
  // Run with specific steps to trigger self-modification
  console.log('\n--- Phase 1: Initial State ---');
  automaton.printState();
  
  console.log('\n--- Phase 2: Running with Self-Modification ---');
  // Manually trigger self-modification at different dimensions
  const dimensions = [0, 2, 4, 6]; // Dimensions where we'll force self-modification
  
  for (let i = 0; i < dimensions.length; i++) {
    const targetDimension = dimensions[i];
    console.log(`\n*** Forcing transition to dimension ${targetDimension} ***`);
    
    // Set current dimension
    (automaton as any).currentDimension = targetDimension;
    
    // Trigger self-modification
    console.log('Triggering self-modification...');
    (automaton as any).executeSelfModification();
    
    // Run a few steps
    for (let j = 0; j < 3; j++) {
      console.log(`\n--- Step ${i * 3 + j + 1} ---`);
      (automaton as any).step(i * 3 + j);
    }
  }
  
  console.log('\n--- Phase 3: Final State Analysis ---');
  automaton.printState();
  automaton.analyzeSelfReference();
  
  // Save the modified automaton
  console.log('\n--- Phase 4: Saving Modified Automaton ---');
  (automaton as any).save();
  
  // Verify the modifications
  console.log('\n--- Phase 5: Verification ---');
  const modifiedAutomaton = new AdvancedSelfReferencingAutomaton('./automaton.jsonl');
  modifiedAutomaton.analyzeSelfReference();
}

// Run the demonstration
if (require.main === module) {
  demonstrateSelfModification().catch(console.error);
}

export { demonstrateSelfModification };