import { tool } from "@opencode-ai/plugin"
import * as fs from "fs"

/**
 * Canvas Visualizer Tool
 * 
 * Related Commands:
 * - /visualize-system - Comprehensive system visualization generation
 * - /explore-canvas - Visual exploration of Grok topology
 * - /run-experiments - Visualization as part of experiment suite
 * 
 * This tool is used by:
 * - visualize-system.md - Primary command for system visualization
 * - explore-canvas.md - Visual representation of canvas structure
 * - run-experiments.md - Visualization phase of experiments
 */
export default tool({
  description: "I'm your visualization artist - I turn the computational topology canvas into visual stories. I create ASCII art, JSON structures, and evolution graphs that help you see what's happening in the Church encoding system. Whether you want to see the full canvas, focus on a specific dimension, explore self-reference patterns, or track evolution - I'll make it visual and understandable.",
  args: {
    type: tool.schema.enum(["canvas", "dimension", "self-reference", "evolution"]).describe("🎨 Visualization type: 'canvas' shows full topology, 'dimension' focuses on specific level, 'self-reference' displays recursion patterns, 'evolution' shows progression timeline"),
    format: tool.schema.enum(["text", "json", "ascii"]).describe("📋 Output format: 'text' for readable descriptions, 'json' for structured data, 'ascii' for visual art (default: text)"),
    dimension: tool.schema.number().optional().describe("🌐 Specific dimension to visualize (0-7). Each represents a level of computational complexity from point to quantum"),
    automatonFile: tool.schema.string().optional().describe("📁 Path to automaton JSONL file for self-reference analysis")
  },
  async execute(args, context) {
    const { agent, sessionID } = context
    
    try {
      switch (args.type) {
        case "canvas":
          return generateCanvasVisualization(args.format || "text")
          
        case "dimension":
          if (args.dimension === undefined) {
            return "❌ Dimension number required for dimension visualization"
          }
          return generateDimensionVisualization(args.dimension, args.format || "text")
          
        case "self-reference":
          return generateSelfReferenceVisualization(args.automatonFile, args.format || "text")
          
        case "evolution":
          return generateEvolutionVisualization(args.automatonFile, args.format || "text")
          
        default:
          return "❌ Unknown visualization type. Use: canvas, dimension, self-reference, evolution"
      }
    } catch (error) {
      return `❌ Error: ${error instanceof Error ? error.message : String(error)}`
    }
  }
})

function generateCanvasVisualization(format: string) {
  const canvas = {
    dimensions: [
      { id: "0D", name: "Topology", description: "Quantum vacuum and identity" },
      { id: "1D", name: "Temporal", description: "Time evolution and succession" },
      { id: "2D", name: "Structural", description: "Spatial patterns and encoding" },
      { id: "3D", name: "Algebraic", description: "Church arithmetic operations" },
      { id: "4D", name: "Network", description: "Spacetime and connectivity" },
      { id: "5D", name: "Consensus", description: "Distributed agreement" },
      { id: "6D", name: "Intelligence", description: "Neural emergence" },
      { id: "7D", name: "Quantum", description: "Superposition states" }
    ],
    connections: [
      "0D→1D→2D→3D→4D→5D→6D→7D",
      "Vertical: Dimensional hierarchy",
      "Horizontal: Cross-dimensional patterns"
    ]
  }
  
  if (format === "json") {
    return canvas
  } else if (format === "ascii") {
    return `
╔══════════════════════════════════════╗
║     COMPUTATIONAL TOPOLOGY CANVAS     ║
╠══════════════════════════════════════╣
║ 0D ──► 1D ──► 2D ──► 3D ──► 4D        ║
║  ↓      ↓      ↓      ↓      ↓       ║
║ Topo   Temp   Struct Alg    Net      ║
║                                        ║║ 4D ──► 5D ──► 6D ──► 7D           ║
║  ↓      ↓      ↓      ↓              ║
║ Net    Cons   Intel  Quant           ║
╚══════════════════════════════════════╝
    `
  } else {
    return `Computational Topology Canvas:
${canvas.dimensions.map(d => `  ${d.id}: ${d.name} - ${d.description}`).join('\n')}
Progression: ${canvas.connections.join('\n')}`
  }
}

function generateDimensionVisualization(dimension: number, format: string) {
  const dimensionInfo = {
    0: { name: "Topology", symbol: "●", operations: ["identity", "empty", "point"] },
    1: { name: "Temporal", symbol: "─", operations: ["successor", "sequence", "evolution"] },
    2: { name: "Structural", symbol: "■", operations: ["pairs", "patterns", "unification"] },
    3: { name: "Algebraic", symbol: "◆", operations: ["add", "multiply", "exponentiate"] },
    4: { name: "Network", symbol: "⬡", operations: ["connect", "route", "coordinate"] },
    5: { name: "Consensus", symbol: "⬢", operations: ["agree", "validate", "distribute"] },
    6: { name: "Intelligence", symbol: "◉", operations: ["learn", "predict", "optimize"] },
    7: { name: "Quantum", symbol: "◈", operations: ["superpose", "entangle", "measure"] }
  }
  
  const info = dimensionInfo[dimension]
  if (!info) {
    return `❌ Invalid dimension: ${dimension}. Use 0-7.`
  }
  
  if (format === "json") {
    return { dimension, ...info }
  } else if (format === "ascii") {
    return `
Dimension ${dimension}: ${info.name}
Symbol: ${info.symbol}
Operations: ${info.operations.join(", ")}
    `
  } else {
    return `Dimension ${dimension}: ${info.name}
Symbol: ${info.symbol}
Core operations: ${info.operations.join(", ")}`
  }
}

function generateSelfReferenceVisualization(automatonFile?: string, format: string = "text") {
  const filePath = automatonFile || "./automaton.jsonl"
  
  try {
    if (!fs.existsSync(filePath)) {
      return `❌ Automaton file not found: ${filePath}`
    }
    
    const content = fs.readFileSync(filePath, "utf8")
    const lines = content.split("\n").filter(line => line.trim())
    
    const selfRefs = lines.filter(line => 
      line.includes("self-ref") || line.includes("self-reference")
    )
    
    const visualization = {
      totalLines: lines.length,
      selfReferences: selfRefs.length,
      pattern: "Recursive self-encoding structure",
      evolution: "0D → 1D → 2D → 3D → 4D → 5D → 6D → 7D → ..."
    }
    
    if (format === "json") {
      return visualization
    } else {
      return `Self-Reference Analysis:
Total lines: ${visualization.totalLines}
Self-references: ${visualization.selfReferences}
Pattern: ${visualization.pattern}
Evolution: ${visualization.evolution}`
    }
  } catch (error) {
    return `❌ Error analyzing self-reference: ${error}`
  }
}

function generateEvolutionVisualization(automatonFile?: string, format: string = "text") {
  return `Evolution Path:
0D (Point) → 1D (Line) → 2D (Surface) → 3D (Volume)
     ↓              ↓              ↓              ↓
   Identity       Time          Space          Math
     ↓              ↓              ↓              ↓
4D (Network) → 5D (Consensus) → 6D (Intelligence) → 7D (Quantum)
     ↓              ↓                   ↓              ↓
  Connectivity    Agreement          Learning     Superposition`
}