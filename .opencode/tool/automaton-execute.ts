import { tool } from "@opencode-ai/plugin"
import * as fs from "fs"
import * as path from "path"

/**
 * Automaton Execute Tool
 * 
 * Related Commands:
 * - /execute-operations - Execute specific automaton operations for targeted experimentation
 * - /run-experiments - Comprehensive experiment suite including operation testing
 * 
 * This tool is used by:
 * - execute-operations.md - Primary command for operation execution
 * - run-experiments.md - Part of comprehensive experiment suite
 */
export default tool({
  description: "I'm your execution specialist - I know how to run specific automaton operations on demand. Think of me as your precision operator who can trigger individual Church encoding operations, self-modifications, or dimensional transitions without running the whole continuous loop. Perfect when you want to test something specific or execute a targeted operation.",
  args: {
    operation: tool.schema.enum(["evolve", "self-reference", "self-modify", "self-io", "validate", "train", "observe", "compose"]).describe("🎯 Operation type: 'evolve' advances dimensional progression, 'self-reference' triggers recursion, 'self-modify' mutates structure, 'self-io' performs I/O, 'validate' checks constraints, 'train' learns patterns, 'observe' analyzes state, 'compose' combines operations"),
    automatonFile: tool.schema.string().optional().describe("📁 Path to the automaton's self-referential JSONL data file (default: ./automaton.jsonl)"),
    saveAfter: tool.schema.boolean().optional().describe("💾 Persist state changes to disk after operation execution (default: true)")
  },
  async execute(args, context) {
    const { agent, sessionID } = context
    
    try {
      // Import the automaton dynamically to avoid circular dependencies
      const { AdvancedSelfReferencingAutomaton } = await import("../../advanced-automaton")
      const automaton = new AdvancedSelfReferencingAutomaton(
        args.automatonFile || "./automaton.jsonl"
      )
      
      const currentAutomaton = automaton.getCurrentAutomaton()
      if (!currentAutomaton) {
        return "❌ No current automaton state found"
      }
      
      let result = ""
      const beforeState = {
        dimension: (automaton as any).currentDimension,
        modifications: (automaton as any).selfModificationCount,
        state: currentAutomaton.currentState
      }
      
      switch (args.operation) {
        case "evolve":
          (automaton as any).executeEvolution()
          result = `🔄 Executed evolution from dimension ${beforeState.dimension}`
          break
          
        case "self-reference":
          (automaton as any).executeSelfReference()
          result = `🔗 Executed self-reference operation`
          break
          
        case "self-modify":
          (automaton as any).executeSelfModification()
          result = `🔧 Executed self-modification`
          break
          
        case "self-io":
          (automaton as any).executeSelfIO()
          result = `💾 Executed self-I/O operation`
          break
          
        case "validate":
          (automaton as any).executeSelfValidation()
          result = `✅ Executed self-validation`
          break
          
        case "train":
          (automaton as any).executeSelfTraining()
          result = `🧠 Executed self-training`
          break
          
        case "observe":
          (automaton as any).executeSelfObservation()
          result = `👁️ Executed self-observation`
          break
          
        case "compose":
          (automaton as any).executeComposition()
          result = `🎼 Executed composition`
          break
          
        default:
          return "❌ Unknown operation"
      }
      
      const afterState = {
        dimension: (automaton as any).currentDimension,
        modifications: (automaton as any).selfModificationCount,
        state: (automaton.getCurrentAutomaton())?.currentState
      }
      
      if (args.saveAfter !== false) {
        (automaton as any).save()
        result += " (💾 Saved)"
      }
      
      return {
        operation: args.operation,
        result,
        before: beforeState,
        after: afterState,
        changes: {
          dimensionChanged: beforeState.dimension !== afterState.dimension,
          modificationsAdded: afterState.modifications - beforeState.modifications,
          stateChanged: beforeState.state !== afterState.state
        },
        agent,
        sessionID
      }
      
    } catch (error) {
      return `❌ Error executing ${args.operation}: ${error instanceof Error ? error.message : String(error)}`
    }
  }
})