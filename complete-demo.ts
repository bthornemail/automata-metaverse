#!/usr/bin/env node

import { AdvancedSelfReferencingAutomaton } from './advanced-automaton';
import { readFileSync } from 'fs';

console.log('🔄 Self-Referencing JSONL Automaton - Complete Demonstration');
console.log('=' .repeat(60));

// Show the self-referential structure
console.log('\n📋 Self-Reference Structure:');
const content = readFileSync('./automaton.jsonl', 'utf-8');
const lines = content.split('\n').filter(line => line.trim());

console.log(`Total lines in automaton.jsonl: ${lines.length}`);

// Find self-referential objects
const selfRefObjects = lines.filter(line => {
  try {
    const obj = JSON.parse(line);
    return obj.file === './automaton.jsonl' || obj.file === 'automaton.jsonl';
  } catch {
    return false;
  }
});

console.log(`Self-referential objects: ${selfRefObjects.length}`);

// Create and run the automaton
async function runCompleteDemo() {
  const automaton = new AdvancedSelfReferencingAutomaton('./automaton.jsonl');
  
  console.log('\n🎯 Initial State:');
  automaton.printState();
  
  console.log('\n🚀 Running Complete Self-Reference Cycle...');
  
  // Run through all dimensions
  for (let cycle = 0; cycle < 2; cycle++) {
    console.log(`\n--- Cycle ${cycle + 1} ---`);
    
    for (let dimension = 0; dimension <= 7; dimension++) {
      console.log(`\n📍 Dimension ${dimension}:`);
      (automaton as any).currentDimension = dimension;
      
      const currentAutomaton = automaton.getCurrentAutomaton();
      if (currentAutomaton) {
        console.log(`  State: ${currentAutomaton.currentState}`);
        console.log(`  Self-reference: line ${currentAutomaton.selfReference.line}`);
        console.log(`  Pattern: ${currentAutomaton.selfReference.pattern}`);
        
        // Execute dimension-specific action
        switch (dimension) {
          case 0:
            (automaton as any).executeSelfReference();
            break;
          case 2:
            (automaton as any).executeSelfModification();
            break;
          case 4:
            (automaton as any).executeSelfIO();
            break;
          case 6:
            (automaton as any).executeSelfTraining();
            break;
          case 7:
            (automaton as any).executeSelfObservation();
            break;
          default:
            (automaton as any).executeEvolution();
        }
      }
      
      // Progress to next dimension
      if (dimension < 7) {
        (automaton as any).currentDimension = dimension + 1;
      }
    }
  }
  
  console.log('\n📊 Final Analysis:');
  automaton.analyzeSelfReference();
  
  console.log('\n💾 Saving Self-Modified Automaton...');
  (automaton as any).save();
  
  // Verify the self-reference integrity
  console.log('\n🔍 Self-Reference Integrity Check:');
  const finalContent = readFileSync('./automaton.jsonl', 'utf-8');
  const finalLines = finalContent.split('\n').filter(line => line.trim());
  const finalSelfRefs = finalLines.filter(line => {
    try {
      const obj = JSON.parse(line);
      return obj.file === './automaton.jsonl' || obj.file === 'automaton.jsonl';
    } catch {
      return false;
    }
  });
  
  console.log(`Original self-references: ${selfRefObjects.length}`);
  console.log(`Final self-references: ${finalSelfRefs.length}`);
  console.log(`New self-references created: ${finalSelfRefs.length - selfRefObjects.length}`);
  
  console.log('\n✨ Self-Referencing JSONL Automaton Demo Complete!');
  console.log('\nKey Features Demonstrated:');
  console.log('  ✅ Self-reference to specific lines');
  console.log('  ✅ Dimensional progression (0D→7D)');
  console.log('  ✅ Self-modification of JSONL file');
  console.log('  ✅ Dynamic object creation');
  console.log('  ✅ Meta-circular evaluation');
  console.log('  ✅ Church encoding foundation');
  console.log('  ✅ Quantum observation collapse');
  
  return automaton;
}

// Run the demonstration
runCompleteDemo().catch(console.error);