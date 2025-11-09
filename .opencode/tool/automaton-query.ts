import { tool } from "@opencode-ai/plugin"
import { AdvancedSelfReferencingAutomaton } from "../../evolutions/advanced-automaton/advanced-automaton"

/**
 * Automaton Query Tool
 * 
 * Related Commands:
 * - /start-automaton - Checks initial state after starting
 * - /monitor-performance - Queries state for performance monitoring
 * - /execute-operations - Queries state after operations
 * - /start-ai-automaton - Monitors AI decision patterns
 * 
 * This tool is used by:
 * - start-automaton.md - Initial state check
 * - monitor-performance.md - Real-time state monitoring
 * - execute-operations.md - State verification after operations
 * - start-ai-automaton.md - History tracking for AI decisions
 */
export default tool({
  description: "I'm your information specialist - I can query and analyze what's happening inside the automaton right now. Want to know the current state? Self-reference patterns? How far we've progressed through dimensions? I'll dig into the system and give you clear insights about the Church encoding configuration. Think of me as your system inspector.",
  args: {
    query: tool.schema.enum(["state", "self-reference", "dimension", "modifications", "history"]).describe("📊 Query type: 'state' for current configuration, 'self-reference' for recursive patterns, 'dimension' for dimensional analysis, 'modifications' for mutation count, 'history' for execution timeline"),
    automatonFile: tool.schema.string().optional().describe("📁 Path to the automaton's self-referential JSONL data file (default: ./automaton.jsonl)")
  },
  async execute(args, context) {
    const { agent, sessionID } = context
    
    try {
      const automaton = new AdvancedSelfReferencingAutomaton(
        args.automatonFile || "./automaton.jsonl"
      )
      
      switch (args.query) {
        case "state":
          const currentAutomaton = automaton.getCurrentAutomaton()
          const currentDimension = (automaton as any).currentDimension
          const totalObjects = (automaton as any).objects.length
          
          return {
            currentDimension,
            currentState: currentAutomaton?.currentState,
            selfReference: currentAutomaton?.selfReference,
            totalObjects,
            agent,
            sessionID
          }
          
        case "self-reference":
          const analysis = automaton.analyzeSelfReference()
          return {
            analysis,
            agent,
            sessionID
          }
          
        case "dimension":
          const dimension = (automaton as any).currentDimension
          const dimensionInfo = {
            current: dimension,
            name: getDimensionName(dimension),
            description: getDimensionDescription(dimension)
          }
          return dimensionInfo
          
        case "modifications":
          const modCount = (automaton as any).selfModificationCount
          return {
            selfModifications: modCount,
            lastModified: new Date().toISOString()
          }
          
        case "history":
          const history = (automaton as any).executionHistory || []
          return {
            recentHistory: history.slice(-10),
            totalHistoryItems: history.length
          }
          
        default:
          return "❌ Unknown query type. Use: state, self-reference, dimension, modifications, history"
      }
    } catch (error) {
      return `❌ Error: ${error instanceof Error ? error.message : String(error)}`
    }
  }
})

function getDimensionName(dimension: number): string {
  const names = ["0D-Topology", "1D-Temporal", "2D-Structural", "3D-Algebraic", 
                 "4D-Network", "5D-Consensus", "6D-Intelligence", "7D-Quantum"]
  return names[dimension] || `Dimension ${dimension}`
}

function getDimensionDescription(dimension: number): string {
  const descriptions = [
    "Quantum vacuum topology and identity processes",
    "Temporal evolution and Church successor operations", 
    "Spatial structure and pattern encoding",
    "Church algebra operations",
    "Spacetime and network operations",
    "Distributed consensus and blockchain operations",
    "Emergent AI and neural network operations",
    "Quantum superposition and entanglement"
  ]
  return descriptions[dimension] || `Dimension ${dimension} operations`
}