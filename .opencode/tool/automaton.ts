import { tool } from "@opencode-ai/plugin"
import { ContinuousAutomatonRunner } from "../../evolutions/continuous-automaton/continuous-automaton"

// Global runner instance to maintain state across tool calls
let runner: ContinuousAutomatonRunner | null = null

/**
 * Automaton Control Tool
 * 
 * Related Commands:
 * - /start-automaton - Quick start with optimal defaults
 * - /start-ai-automaton - Start with Ollama AI integration
 * - /monitor-performance - Status checking during monitoring
 * 
 * This tool is used by:
 * - start-automaton.md - Primary command for starting automaton
 * - start-ai-automaton.md - AI-powered automaton startup
 * - monitor-performance.md - Status checks during performance monitoring
 */
export default tool({
  description: "I'm your automaton controller - I handle starting, stopping, and monitoring the continuous self-referencing automaton. Think of me as your system operator who manages the Church encoding-based computational topology in real-time. I can start it up, check its status, stop it when needed, and trigger deep analysis. I'm your go-to for lifecycle management.",
  args: {
    action: tool.schema.enum(["start", "stop", "status", "analyze"]).describe("🎯 Action to perform: 'start' begins continuous execution, 'stop' halts the runner, 'status' shows current state, 'analyze' triggers deep analysis"),
    interval: tool.schema.number().optional().describe("⏱️ Time interval between automaton iterations in milliseconds (default: 2000ms). Lower values = faster evolution but higher CPU usage"),
    maxIterations: tool.schema.number().optional().describe("🔄 Maximum number of iterations before automatic stop (default: unlimited). Use to prevent infinite loops"),
    useOllama: tool.schema.boolean().optional().describe("🧠 Enable AI-powered decision making via Ollama for intelligent action selection (default: false uses built-in logic)"),
    model: tool.schema.string().optional().describe("🤖 Ollama model name for AI-powered actions (default: llama3.2). Requires Ollama server running"),
    automatonFile: tool.schema.string().optional().describe("📁 Path to the automaton's self-referential JSONL data file (default: ./automaton.jsonl)")
  },
  async execute(args, context) {
    const { agent, sessionID, messageID } = context
    
    try {
      switch (args.action) {
        case "start":
          if (runner && runner.isRunning) {
            return "⚠️ Automaton is already running"
          }
          
          runner = new ContinuousAutomatonRunner(
            args.automatonFile || "./automaton.jsonl",
            args.useOllama || false,
            args.model || "llama3.2"
          )
          
          // Start in background without blocking
          runner.startContinuous(
            args.interval || 2000,
            args.maxIterations
          ).catch(error => {
            console.error("Automaton error:", error)
          })
          
          return `🚀 Automaton started (Session: ${sessionID})`
          
        case "stop":
          if (!runner) {
            return "⚠️ No automaton is currently running"
          }
          
          runner.stop()
          runner = null
          return "🛑 Automaton stopped"
          
        case "status":
          if (!runner) {
            return "📊 Automaton: Not running"
          }
          
          return `📊 Automaton: Running (Agent: ${agent}, Session: ${sessionID})`
          
        case "analyze":
          if (!runner) {
            return "⚠️ No automaton running to analyze"
          }
          
          // This would trigger analysis - for now return placeholder
          return "📈 Analysis triggered - check console output"
          
        default:
          return "❌ Unknown action. Use: start, stop, status, or analyze"
      }
    } catch (error) {
      return `❌ Error: ${error instanceof Error ? error.message : String(error)}`
    }
  }
})