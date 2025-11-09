import { tool } from "@opencode-ai/plugin"
import path from "path"

/**
 * Meta-Log Plugin Tool
 * 
 * Provides ProLog, DataLog, and SPARQL query capabilities for the Meta-Log system.
 * This tool integrates with the meta-log-plugin from the /plugin directory.
 * 
 * Related Commands:
 * - Can be used by any command that needs to query the Meta-Log database
 * 
 * This tool integrates with:
 * - plugin/meta-log-plugin - The Meta-Log plugin package
 * - meta-log-db - The Meta-Log database engine
 */
export default tool({
  description: "I'm your Meta-Log query interface - I provide ProLog, DataLog, and SPARQL query capabilities for the computational topology canvas. I can query the self-referential JSONL database using logic programming languages, extract facts, and perform semantic reasoning. Think of me as your database query expert for the Church encoding-based system.",
  args: {
    queryType: tool.schema.enum(["prolog", "datalog", "sparql", "load"]).describe("🔍 Type of query: 'prolog' for ProLog queries, 'datalog' for DataLog queries, 'sparql' for SPARQL queries, 'load' to load a canvas file"),
    query: tool.schema.string().optional().describe("📝 The query string to execute (required for prolog, datalog, sparql; not used for load)"),
    canvasPath: tool.schema.string().optional().describe("📁 Path to JSONL/CanvasL canvas file (required for load, optional for queries to specify which canvas to query)"),
    program: tool.schema.string().optional().describe("📋 DataLog program as JSON string (optional, only for datalog queries)")
  },
  async execute(args, context) {
    const { agent, sessionID, messageID } = context
    
    try {
      // Dynamically import the meta-log-plugin
      // Try to load from the plugin directory (OpenCode-specific build)
      const pluginPath = path.resolve(process.cwd(), "plugin/meta-log-plugin/dist/opencode.js")
      
      let OpenCodeMetaLogPlugin: any
      try {
        const pluginModule = await import(pluginPath)
        OpenCodeMetaLogPlugin = pluginModule.OpenCodeMetaLogPlugin
      } catch (importError) {
        // Fallback 1: try OpenCode adapter directly
        try {
          const adapterPath = path.resolve(process.cwd(), "plugin/meta-log-plugin/dist/adapters/opencode.js")
          const adapterModule = await import(adapterPath)
          OpenCodeMetaLogPlugin = adapterModule.OpenCodeMetaLogPlugin
        } catch (adapterError) {
          // Fallback 2: try to import from node_modules if linked
          try {
            const pluginModule = await import("meta-log-plugin/opencode")
            OpenCodeMetaLogPlugin = pluginModule.OpenCodeMetaLogPlugin
          } catch (fallbackError) {
            // Fallback 3: try main export
            try {
              const pluginModule = await import("meta-log-plugin")
              OpenCodeMetaLogPlugin = pluginModule.OpenCodeMetaLogPlugin
            } catch (finalError) {
              return {
                error: "Meta-Log plugin not available",
                details: "The meta-log-plugin package needs to be built and linked. Run: cd plugin/meta-log-plugin && npm run build:opencode && npm link && cd ../../.opencode && npm link meta-log-plugin",
                importError: importError instanceof Error ? importError.message : String(importError),
                adapterError: adapterError instanceof Error ? adapterError.message : String(adapterError),
                fallbackError: fallbackError instanceof Error ? fallbackError.message : String(fallbackError),
                finalError: finalError instanceof Error ? finalError.message : String(finalError)
              }
            }
          }
        }
      }
      
      // Initialize plugin with canvas path
      const canvasPath = args.canvasPath || "./automaton-kernel.jsonl"
      const plugin = new OpenCodeMetaLogPlugin({
        canvasPath: canvasPath,
        enableProlog: true,
        enableDatalog: true,
        enableSparql: true
      })
      
      await plugin.onLoad()
      
      switch (args.queryType) {
        case "load":
          if (!args.canvasPath) {
            return { error: "canvasPath is required for load operation" }
          }
          await plugin.loadCanvas(args.canvasPath)
          return {
            success: true,
            message: `Canvas loaded successfully: ${args.canvasPath}`,
            path: args.canvasPath
          }
          
        case "prolog":
          // Query is required for prolog
          if (!args.query || typeof args.query !== 'string') {
            return { error: "query is required for ProLog queries and must be a string" }
          }
          // Remove ProLog prompt if present (e.g., "?- " prefix)
          const prologQuery = args.query.replace(/^\?\s*-\s*/, '').trim()
          const prologResults = await plugin.db.prologQuery(prologQuery)
          return {
            success: true,
            query: prologQuery,
            originalQuery: args.query,
            results: prologResults,
            count: Array.isArray(prologResults) ? prologResults.length : 1
          }
          
        case "datalog":
          if (!args.query || typeof args.query !== 'string') {
            return { error: "query is required for DataLog queries and must be a string" }
          }
          const datalogProgram = args.program ? JSON.parse(args.program) : undefined
          const datalogResults = await plugin.db.datalogQuery(args.query, datalogProgram)
          return {
            success: true,
            query: args.query,
            program: datalogProgram,
            results: datalogResults,
            count: Array.isArray(datalogResults) ? datalogResults.length : 1
          }
          
        case "sparql":
          if (!args.query || typeof args.query !== 'string') {
            return { error: "query is required for SPARQL queries and must be a string" }
          }
          const sparqlResults = await plugin.db.sparqlQuery(args.query)
          return {
            success: true,
            query: args.query,
            results: sparqlResults,
            count: Array.isArray(sparqlResults) ? sparqlResults.length : 1
          }
          
        default:
          return { error: `Unknown query type: ${args.queryType}` }
      }
    } catch (error) {
      return {
        error: "Meta-Log query failed",
        details: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined
      }
    }
  }
})
