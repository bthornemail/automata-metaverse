import { tool } from "@opencode-ai/plugin"
import { AdvancedSelfReferencingAutomaton } from "../../advanced-automaton"

export default tool({
  description: "🔍 Query and analyze the automaton's internal state, self-reference patterns, dimensional progression, and execution history. Provides deep insights into the Church encoding system's current configuration.",
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