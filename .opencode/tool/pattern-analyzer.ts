import { tool } from "@opencode-ai/plugin"
import * as fs from "fs"

export default tool({
  description: "🧠 Analyze patterns and extract deep insights from the computational topology. Discover Church encoding patterns, self-reference recursion, dimensional relationships, and topological structures.",
  args: {
    analysis: tool.schema.enum(["patterns", "dimensions", "evolution", "church-encoding", "self-reference", "topology"]).describe("🔬 Analysis type: 'patterns' for recurring motifs, 'dimensions' for level analysis, 'evolution' for progression tracking, 'church-encoding' for lambda calculus patterns, 'self-reference' for recursion analysis, 'topology' for structural analysis"),
    scope: tool.schema.enum(["grok-files", "automaton", "both"]).describe("📊 Data source: 'grok-files' analyzes the 59-file canvas, 'automaton' analyzes JSONL state, 'both' combines both sources (default: both)"),
    detail: tool.schema.enum(["summary", "detailed", "full"]).describe("📈 Analysis depth: 'summary' for key insights, 'detailed' for comprehensive analysis, 'full' for exhaustive breakdown (default: summary)"),
    dimension: tool.schema.number().optional().describe("🌐 Filter analysis by specific dimension (0-7) to focus on particular computational level")
  },
  async execute(args, context) {
    const { agent, sessionID } = context
    
    try {
      const scope = args.scope || "both"
      const detail = args.detail || "summary"
      
      let grokData = null
      let automatonData = null
      
      // Collect data based on scope
      if (scope === "grok-files" || scope === "both") {
        grokData = await analyzeGrokFiles(args.dimension)
      }
      
      if (scope === "automaton" || scope === "both") {
        automatonData = await analyzeAutomaton(args.dimension)
      }
      
      // Perform specific analysis
      switch (args.analysis) {
        case "patterns":
          return analyzePatterns(grokData, automatonData, detail)
          
        case "dimensions":
          return analyzeDimensions(grokData, automatonData, detail)
          
        case "evolution":
          return analyzeEvolution(grokData, automatonData, detail)
          
        case "church-encoding":
          return analyzeChurchEncoding(grokData, automatonData, detail)
          
        case "self-reference":
          return analyzeSelfReference(grokData, automatonData, detail)
          
        case "topology":
          return analyzeTopology(grokData, automatonData, detail)
          
        default:
          return "❌ Unknown analysis type"
      }
      
    } catch (error) {
      return `❌ Analysis error: ${error instanceof Error ? error.message : String(error)}`
    }
  }
})

async function analyzeGrokFiles(dimensionFilter?: number) {
  const grokDir = "./grok_files"
  if (!fs.existsSync(grokDir)) {
    return null
  }
  
  const files = fs.readdirSync(grokDir).filter(f => f.endsWith(".md"))
  const data = []
  
  for (const file of files) {
    const num = parseInt(file.split("-")[0])
    const dimension = Math.floor((num - 1) / 8)
    
    if (dimensionFilter !== undefined && dimension !== dimensionFilter) {
      continue
    }
    
    const content = fs.readFileSync(path.join(grokDir, file), "utf8")
    data.push({
      file,
      number: num,
      dimension,
      content: content.toLowerCase(),
      lines: content.split("\n").length
    })
  }
  
  return data
}

async function analyzeAutomaton(dimensionFilter?: number) {
  const automatonFile = "./automaton.jsonl"
  if (!fs.existsSync(automatonFile)) {
    return null
  }
  
  const content = fs.readFileSync(automatonFile, "utf8")
  const lines = content.split("\n").filter(line => line.trim())
  
  const objects = lines.map((line, index) => {
    try {
      return { line: index + 1, data: JSON.parse(line) }
    } catch {
      return null
    }
  }).filter(Boolean)
  
  return { objects, totalLines: lines.length }
}

function analyzePatterns(grokData: any, automatonData: any, detail: string) {
  const patterns = {
    recurring: [],
    structural: [],
    mathematical: []
  }
  
  if (grokData) {
    // Find recurring patterns in Grok files
    const allContent = grokData.map((f: any) => f.content).join(" ")
    
    const commonTerms = ["church", "lambda", "successor", "pair", "algebra", "network", "consensus", "intelligence", "quantum"]
    patterns.recurring = commonTerms.map(term => ({
      term,
      count: (allContent.match(new RegExp(term, "gi")) || []).length
    })).filter((p: any) => p.count > 0)
    
    // Structural patterns
    patterns.structural = [
      { type: "Self-reference", count: (allContent.match(/self.?reference/gi) || []).length },
      { type: "Dimension progression", count: grokData.length },
      { type: "Church encoding", count: (allContent.match(/church.?encoding/gi) || []).length }
    ]
  }
  
  if (automatonData && detail !== "summary") {
    // Mathematical patterns in automaton
    patterns.mathematical = [
      { type: "JSON objects", count: automatonData.objects.length },
      { type: "Self-modifications", count: (allContent.match(/self.?modify/gi) || []).length }
    ]
  }
  
  return {
    analysis: "patterns",
    patterns,
    detail,
    agent: context.agent,
    sessionID: context.sessionID
  }
}

function analyzeDimensions(grokData: any, automatonData: any, detail: string) {
  const dimensions = []
  
  if (grokData) {
    const dimCounts = new Array(8).fill(0)
    const dimContent = new Array(8).fill("")
    
    grokData.forEach((file: any) => {
      dimCounts[file.dimension]++
      dimContent[file.dimension] += file.content + " "
    })
    
    for (let i = 0; i < 8; i++) {
      if (dimCounts[i] > 0) {
        const dimNames = ["Topology", "Temporal", "Structural", "Algebraic", "Network", "Consensus", "Intelligence", "Quantum"]
        dimensions.push({
          dimension: i,
          name: dimNames[i],
          fileCount: dimCounts[i],
          keywords: extractKeywords(dimContent[i], detail === "full" ? 10 : 5)
        })
      }
    }
  }
  
  return {
    analysis: "dimensions",
    dimensions,
    totalDimensions: dimensions.length,
    detail,
    agent: context.agent,
    sessionID: context.sessionID
  }
}

function analyzeEvolution(grokData: any, automatonData: any, detail: string) {
  const evolution = {
    path: ["0D → 1D → 2D → 3D → 4D → 5D → 6D → 7D"],
    mechanisms: [],
    complexity: "increasing"
  }
  
  if (grokData) {
    // Track evolution through file sequence
    const sequence = grokData.map((f: any) => ({
      file: f.file,
      dimension: f.dimension,
      complexity: f.lines
    }))
    
    evolution.mechanisms = [
      "Church successor operations",
      "Pattern composition", 
      "Self-reference recursion",
      "Dimensional transcendence"
    ]
    
    if (detail === "full") {
      evolution.sequence = sequence
    }
  }
  
  return {
    analysis: "evolution",
    evolution,
    detail,
    agent: context.agent,
    sessionID: context.sessionID
  }
}

function analyzeChurchEncoding(grokData: any, automatonData: any, detail: string) {
  const church = {
    basics: ["λf.λx.x", "λn.λf.λx.f(nfx)", "λx.λy.λf.fxy"],
    operations: ["addition", "multiplication", "exponentiation"],
    implementations: []
  }
  
  if (grokData) {
    const allContent = grokData.map((f: any) => f.content).join(" ")
    
    church.implementations = [
      { concept: "Identity", found: allContent.includes("identity") },
      { concept: "Successor", found: allContent.includes("successor") },
      { concept: "Pairs", found: allContent.includes("pair") },
      { concept: "Algebra", found: allContent.includes("algebra") }
    ]
  }
  
  return {
    analysis: "church-encoding",
    church,
    detail,
    agent: context.agent,
    sessionID: context.sessionID
  }
}

function analyzeSelfReference(grokData: any, automatonData: any, detail: string) {
  const selfRef = {
    mechanisms: ["recursive", "meta-circular", "self-modifying"],
    instances: 0,
    patterns: []
  }
  
  if (grokData) {
    const allContent = grokData.map((f: any) => f.content).join(" ")
    
    selfRef.instances = (allContent.match(/self.?reference/gi) || []).length
    selfRef.patterns = [
      { type: "Direct self-reference", count: (allContent.match(/self/gi) || []).length },
      { type: "Meta-circular", count: (allContent.match(/meta/gi) || []).length },
      { type: "Recursive", count: (allContent.match(/recursive/gi) || []).length }
    ]
  }
  
  if (automatonData) {
    selfRef.patterns.push({
      type: "JSON self-reference",
      count: automatonData.objects.filter((obj: any) => 
        obj.data && obj.data.file && obj.data.file.includes("automaton")
      ).length
    })
  }
  
  return {
    analysis: "self-reference",
    selfRef,
    detail,
    agent: context.agent,
    sessionID: context.sessionID
  }
}

function analyzeTopology(grokData: any, automatonData: any, detail: string) {
  const topology = {
    types: ["point", "line", "surface", "volume", "spacetime"],
    properties: ["connected", "simply-connected", "manifold"],
    structures: []
  }
  
  if (grokData) {
    const allContent = grokData.map((f: any) => f.content).join(" ")
    
    topology.structures = [
      { type: "Fiber bundle", mentioned: allContent.includes("fiber") },
      { type: "Manifold", mentioned: allContent.includes("manifold") },
      { type: "Homotopy", mentioned: allContent.includes("homotopy") },
      { type: "Category", mentioned: allContent.includes("category") }
    ]
  }
  
  return {
    analysis: "topology",
    topology,
    detail,
    agent: context.agent,
    sessionID: context.sessionID
  }
}

function extractKeywords(content: string, limit: number = 5) {
  const words = content.split(/\s+/).filter((w: string) => w.length > 3)
  const counts = {}
  
  words.forEach((word: string) => {
    const clean = word.toLowerCase().replace(/[^\w]/g, "")
    if (clean) {
      counts[clean] = (counts[clean] || 0) + 1
    }
  })
  
  return Object.entries(counts)
    .sort(([,a], [,b]) => (b as number) - (a as number))
    .slice(0, limit)
    .map(([word, count]) => ({ word, count }))
}