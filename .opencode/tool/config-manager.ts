import { tool } from "@opencode-ai/plugin"
import * as fs from "fs"
import * as path from "path"

export default tool({
  description: "⚙️ Manage and experiment with different automaton configurations. Save, load, compare, and reset experimental setups for the Church encoding system with different parameters and behaviors.",
  args: {
    action: tool.schema.enum(["create", "load", "save", "list", "compare", "reset"]).describe("🎯 Configuration action: 'create' new config, 'load' existing, 'save' current state, 'list' all configs, 'compare' two configs, 'reset' to defaults"),
    name: tool.schema.string().optional().describe("🏷️ Configuration name for identification. Used in file system and for loading/saving specific setups"),
    config: tool.schema.object({
      interval: tool.schema.number().optional().describe("⏱️ Iteration interval in milliseconds"),
      maxIterations: tool.schema.number().optional().describe("🔄 Maximum iterations before stop"),
      useOllama: tool.schema.boolean().optional().describe("🧠 Enable Ollama AI integration"),
      model: tool.schema.string().optional().describe("🤖 Ollama model name"),
      automatonFile: tool.schema.string().optional().describe("📁 Path to JSONL data file"),
      dimensions: tool.schema.array(tool.schema.number()).optional().describe("🌐 Active dimensions (0-7)"),
      operations: tool.schema.array(tool.schema.string()).optional().describe("⚡ Available operations")
    }).optional().describe("⚙️ Configuration object with automaton parameters and settings"),
    compareWith: tool.schema.string().optional().describe("🔄 Configuration name to compare with when using 'compare' action")
  },
  async execute(args, context) {
    const { agent, sessionID } = context
    const configDir = "./automaton-configs"
    
    try {
      // Ensure config directory exists
      if (!fs.existsSync(configDir)) {
        fs.mkdirSync(configDir, { recursive: true })
      }
      
      switch (args.action) {
        case "create":
          return createConfiguration(configDir, args.name, args.config, agent, sessionID)
          
        case "load":
          return loadConfiguration(configDir, args.name, agent, sessionID)
          
        case "save":
          return saveCurrentConfiguration(configDir, args.name, agent, sessionID)
          
        case "list":
          return listConfigurations(configDir, agent, sessionID)
          
        case "compare":
          return compareConfigurations(configDir, args.name, args.compareWith, agent, sessionID)
          
        case "reset":
          return resetConfiguration(args.name, agent, sessionID)
          
        default:
          return "❌ Unknown configuration action"
      }
      
    } catch (error) {
      return `❌ Configuration error: ${error instanceof Error ? error.message : String(error)}`
    }
  }
})

function createConfiguration(configDir: string, name?: string, config?: any, agent?: string, sessionID?: string) {
  const configName = name || `config-${Date.now()}`
  const configFile = path.join(configDir, `${configName}.json`)
  
  const defaultConfig = {
    interval: 2000,
    maxIterations: Infinity,
    useOllama: false,
    model: "llama3.2",
    automatonFile: "./automaton.jsonl",
    dimensions: [0, 1, 2, 3, 4, 5, 6, 7],
    operations: ["evolve", "self-reference", "self-modify", "self-io"],
    created: new Date().toISOString(),
    agent,
    sessionID
  }
  
  const finalConfig = { ...defaultConfig, ...config }
  
  fs.writeFileSync(configFile, JSON.stringify(finalConfig, null, 2))
  
  return {
    action: "created",
    name: configName,
    config: finalConfig,
    file: configFile,
    agent,
    sessionID
  }
}

function loadConfiguration(configDir: string, name?: string, agent?: string, sessionID?: string) {
  if (!name) {
    return "❌ Configuration name required for load action"
  }
  
  const configFile = path.join(configDir, `${name}.json`)
  
  if (!fs.existsSync(configFile)) {
    return `❌ Configuration '${name}' not found`
  }
  
  const config = JSON.parse(fs.readFileSync(configFile, "utf8"))
  
  return {
    action: "loaded",
    name,
    config,
    file: configFile,
    agent,
    sessionID
  }
}

function saveCurrentConfiguration(configDir: string, name?: string, agent?: string, sessionID?: string) {
  const configName = name || `current-${Date.now()}`
  const configFile = path.join(configDir, `${configName}.json`)
  
  // Try to read current state from automaton
  let currentConfig = {
    interval: 2000,
    maxIterations: Infinity,
    useOllama: false,
    model: "llama3.2",
    automatonFile: "./automaton.jsonl"
  }
  
  if (fs.existsSync("./automaton.jsonl")) {
    // Extract some info from current automaton
    const content = fs.readFileSync("./automaton.jsonl", "utf8")
    const lines = content.split("\n").filter(line => line.trim())
    currentConfig.totalObjects = lines.length
  }
  
  currentConfig = {
    ...currentConfig,
    saved: new Date().toISOString(),
    agent,
    sessionID
  }
  
  fs.writeFileSync(configFile, JSON.stringify(currentConfig, null, 2))
  
  return {
    action: "saved",
    name: configName,
    config: currentConfig,
    file: configFile,
    agent,
    sessionID
  }
}

function listConfigurations(configDir: string, agent?: string, sessionID?: string) {
  if (!fs.existsSync(configDir)) {
    return { configurations: [], total: 0, agent, sessionID }
  }
  
  const files = fs.readdirSync(configDir).filter(f => f.endsWith(".json"))
  const configurations = []
  
  for (const file of files) {
    const filePath = path.join(configDir, file)
    const stats = fs.statSync(filePath)
    
    try {
      const config = JSON.parse(fs.readFileSync(filePath, "utf8"))
      configurations.push({
        name: file.replace(".json", ""),
        created: config.created || stats.birthtime.toISOString(),
        modified: stats.mtime.toISOString(),
        size: stats.size,
        interval: config.interval,
        useOllama: config.useOllama,
        model: config.model
      })
    } catch {
      // Skip invalid JSON files
    }
  }
  
  return {
    configurations: configurations.sort((a, b) => 
      new Date(b.created).getTime() - new Date(a.created).getTime()
    ),
    total: configurations.length,
    agent,
    sessionID
  }
}

function compareConfigurations(configDir: string, name1?: string, name2?: string, agent?: string, sessionID?: string) {
  if (!name1 || !name2) {
    return "❌ Two configuration names required for comparison"
  }
  
  const config1File = path.join(configDir, `${name1}.json`)
  const config2File = path.join(configDir, `${name2}.json`)
  
  if (!fs.existsSync(config1File)) {
    return `❌ Configuration '${name1}' not found`
  }
  
  if (!fs.existsSync(config2File)) {
    return `❌ Configuration '${name2}' not found`
  }
  
  const config1 = JSON.parse(fs.readFileSync(config1File, "utf8"))
  const config2 = JSON.parse(fs.readFileSync(config2File, "utf8"))
  
  const comparison = {
    name1,
    name2,
    differences: [],
    similarities: []
  }
  
  const keys = new Set([...Object.keys(config1), ...Object.keys(config2)])
  
  for (const key of keys) {
    const val1 = config1[key]
    const val2 = config2[key]
    
    if (val1 === val2) {
      comparison.similarities.push({ key, value: val1 })
    } else {
      comparison.differences.push({ key, value1: val1, value2: val2 })
    }
  }
  
  return {
    action: "compared",
    comparison,
    agent,
    sessionID
  }
}

function resetConfiguration(name?: string, agent?: string, sessionID?: string) {
  const configName = name || "default"
  
  // This would reset to default configuration
  const defaultConfig = {
    interval: 2000,
    maxIterations: Infinity,
    useOllama: false,
    model: "llama3.2",
    automatonFile: "./automaton.jsonl",
    dimensions: [0, 1, 2, 3, 4, 5, 6, 7],
    operations: ["evolve", "self-reference", "self-modify", "self-io"],
    reset: new Date().toISOString(),
    agent,
    sessionID
  }
  
  return {
    action: "reset",
    name: configName,
    config: defaultConfig,
    agent,
    sessionID
  }
}