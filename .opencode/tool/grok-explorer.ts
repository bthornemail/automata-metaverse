import { tool } from "@opencode-ai/plugin"
import * as fs from "fs"
import * as path from "path"

/**
 * Grok Explorer Tool
 * 
 * Related Commands:
 * - /explore-canvas - Comprehensive exploration of 59-file Grok topology
 * - /analyze-church - Church encoding pattern search across Grok files
 * - /run-experiments - Baseline analysis using Grok explorer
 * 
 * This tool is used by:
 * - explore-canvas.md - Primary command for canvas exploration
 * - analyze-church.md - Searching for Church encoding patterns
 * - run-experiments.md - Baseline establishment phase
 */
export default tool({
  description: "I'm your Grok files explorer - I know my way around all 59 files that make up the computational topology canvas. From 0D point topology to 7D quantum superposition, I can help you navigate, search, read, and analyze these files. Think of me as your librarian who knows exactly where everything is in this Church encoding progression. Want to find something specific? I'll help you discover it.",
  args: {
    action: tool.schema.enum(["list", "read", "search", "analyze"]).describe("🎯 Action: 'list' shows all 59 files, 'read' displays specific file content, 'search' finds terms across canvas, 'analyze' provides statistical insights"),
    fileNumber: tool.schema.number().optional().describe("📄 Specific Grok file number to read (1-59). Each file represents a step in the Church encoding progression"),
    searchTerm: tool.schema.string().optional().describe("🔍 Term to search for across all Grok files (e.g., 'church', 'lambda', 'quantum', 'topology')"),
    dimension: tool.schema.number().optional().describe("🌐 Filter results by computational dimension (0D-7D): 0=Topology, 1=Temporal, 2=Structural, 3=Algebraic, 4=Network, 5=Consensus, 6=Intelligence, 7=Quantum")
  },
  async execute(args, context) {
    const { agent, sessionID } = context
    const grokDir = "./grok_files"
    
    try {
      switch (args.action) {
        case "list":
          const files = fs.readdirSync(grokDir)
            .filter(f => f.endsWith(".md"))
            .sort()
          
          const fileList = files.map((file, index) => {
            const num = parseInt(file.split("-")[0])
            const dimension = Math.floor((num - 1) / 8) // Approximate dimension mapping
            return `${file} (Dim ${dimension})`
          })
          
          return {
            totalFiles: files.length,
            files: fileList,
            agent,
            sessionID
          }
          
        case "read":
          if (!args.fileNumber) {
            return "❌ File number required for read action"
          }
          
          const fileName = `${args.fileNumber.toString().padStart(2, "0")}-Grok.md`
          const filePath = path.join(grokDir, fileName)
          
          if (!fs.existsSync(filePath)) {
            return `❌ File ${fileName} not found`
          }
          
          const content = fs.readFileSync(filePath, "utf8")
          const lines = content.split("\n")
          
          return {
            file: fileName,
            totalLines: lines.length,
            content: content.slice(0, 2000), // Limit content size
            agent,
            sessionID
          }
          
        case "search":
          if (!args.searchTerm) {
            return "❌ Search term required"
          }
          
          const searchFiles = fs.readdirSync(grokDir)
            .filter(f => f.endsWith(".md"))
          
          const results = []
          
          for (const file of searchFiles) {
            const filePath = path.join(grokDir, file)
            const content = fs.readFileSync(filePath, "utf8")
            
            if (content.toLowerCase().includes(args.searchTerm!.toLowerCase())) {
              const lines = content.split("\n")
              const matches = lines
                .map((line, index) => ({ line: index + 1, content: line }))
                .filter(item => item.content.toLowerCase().includes(args.searchTerm!.toLowerCase()))
                .slice(0, 5) // Limit matches
              
              if (matches.length > 0) {
                results.push({ file, matches })
              }
            }
          }
          
          return {
            searchTerm: args.searchTerm,
            results,
            totalMatches: results.length,
            agent,
            sessionID
          }
          
        case "analyze":
          const analyzeFiles = fs.readdirSync(grokDir)
            .filter(f => f.endsWith(".md"))
          
          const dimensionCounts = new Array(8).fill(0)
          let totalContent = ""
          
          for (const file of analyzeFiles) {
            const num = parseInt(file.split("-")[0])
            const dimension = Math.floor((num - 1) / 8)
            if (dimension >= 0 && dimension < 8) {
              dimensionCounts[dimension]++
            }
            
            const content = fs.readFileSync(path.join(grokDir, file), "utf8")
            totalContent += content + " "
          }
          
          // Simple keyword analysis
          const keywords = ["church", "lambda", "quantum", "topology", "dimension", "self-reference"]
          const keywordCounts = {}
          
          for (const keyword of keywords) {
            const regex = new RegExp(keyword.toLowerCase(), "gi")
            const matches = totalContent.match(regex)
            keywordCounts[keyword] = matches ? matches.length : 0
          }
          
          return {
            totalFiles: analyzeFiles.length,
            dimensionDistribution: dimensionCounts.map((count, dim) => ({
              dimension: dim,
              count,
              name: getDimensionName(dim)
            })),
            keywordAnalysis: keywordCounts,
            agent,
            sessionID
          }
          
        default:
          return "❌ Unknown action. Use: list, read, search, analyze"
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