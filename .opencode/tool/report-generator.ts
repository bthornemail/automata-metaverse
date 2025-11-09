import { tool } from "@opencode-ai/plugin"
import * as fs from "fs"
import * as path from "path"

/**
 * Report Generator Tool
 * 
 * Related Commands:
 * - /monitor-performance - Performance report generation
 * - /full-analysis - Comprehensive analysis report
 * - /run-experiments - Report generation for experiment results
 * 
 * This tool is used by:
 * - monitor-performance.md - Performance monitoring and reporting
 * - full-analysis.md - Complete system analysis report
 * - run-experiments.md - Experiment results documentation
 */
export default tool({
  description: "I'm your report writer - I create comprehensive documentation about the automaton system. Need a state snapshot? Performance analysis? Evolution timeline? Full system documentation? I can generate reports in text, JSON, or markdown formats. Think of me as your technical writer who turns system data into clear, useful reports. Perfect for understanding what's happening, tracking progress, or documenting the system.",
  args: {
    reportType: tool.schema.enum(["state", "performance", "evolution", "analysis", "full"]).describe("📋 Report type: 'state' for current snapshot, 'performance' for metrics, 'evolution' for progression analysis, 'analysis' for insights, 'full' for complete documentation"),
    format: tool.schema.enum(["text", "json", "markdown"]).describe("📄 Output format: 'text' for plain text, 'json' for structured data, 'markdown' for documentation (default: markdown)"),
    include: tool.schema.array(tool.schema.string()).optional().describe("🎯 Sections to include in report (default: all). Options: 'state', 'performance', 'evolution', 'analysis'"),
    outputFile: tool.schema.string().optional().describe("💾 File path to save the report. If not provided, returns content in response"),
    timeRange: tool.schema.string().optional().describe("⏰ Time range for temporal analysis (e.g., 'last-hour', 'today', 'all'). Affects evolution and performance reports")
  },
  async execute(args, context) {
    const { agent, sessionID } = context
    const format = args.format || "markdown"
    
    try {
      const reportData = await collectReportData(args.reportType, args.timeRange)
      const report = generateReport(args.reportType, reportData, format, args.include, agent, sessionID)
      
      if (args.outputFile) {
        fs.writeFileSync(args.outputFile, report)
        return `📄 Report saved to ${args.outputFile}`
      }
      
      return {
        report,
        type: args.reportType,
        format,
        timestamp: new Date().toISOString(),
        agent,
        sessionID
      }
      
    } catch (error) {
      return `❌ Report generation failed: ${error instanceof Error ? error.message : String(error)}`
    }
  }
})

async function collectReportData(reportType: string, timeRange?: string) {
  const data = {
    timestamp: new Date().toISOString(),
    automaton: null,
    grok: null,
    system: null
  }
  
  // Collect automaton data
  if (fs.existsSync("./automaton.jsonl")) {
    const content = fs.readFileSync("./automaton.jsonl", "utf8")
    const lines = content.split("\n").filter(line => line.trim())
    
    data.automaton = {
      totalLines: lines.length,
      objects: lines.map((line, index) => {
        try {
          return { line: index + 1, data: JSON.parse(line) }
        } catch {
          return null
        }
      }).filter(Boolean),
      lastModified: fs.statSync("./automaton.jsonl").mtime.toISOString()
    }
  }
  
  // Collect Grok files data
  if (fs.existsSync("./grok_files")) {
    const files = fs.readdirSync("./grok_files").filter(f => f.endsWith(".md"))
    data.grok = {
      totalFiles: files.length,
      files: files.map(file => {
        const filePath = path.join("./grok_files", file)
        const content = fs.readFileSync(filePath, "utf8")
        return {
          name: file,
          size: content.length,
          lines: content.split("\n").length,
          modified: fs.statSync(filePath).mtime.toISOString()
        }
      })
    }
  }
  
  // System data
  data.system = {
    nodeVersion: process.version,
    platform: process.platform,
    memory: process.memoryUsage(),
    uptime: process.uptime()
  }
  
  return data
}

function generateReport(reportType: string, data: any, format: string, include?: string[], agent?: string, sessionID?: string) {
  switch (reportType) {
    case "state":
      return generateStateReport(data, format, include)
    case "performance":
      return generatePerformanceReport(data, format, include)
    case "evolution":
      return generateEvolutionReport(data, format, include)
    case "analysis":
      return generateAnalysisReport(data, format, include)
    case "full":
      return generateFullReport(data, format, include, agent, sessionID)
    default:
      return "Unknown report type"
  }
}

function generateStateReport(data: any, format: string, include?: string[]) {
  if (format === "json") {
    return {
      type: "state",
      timestamp: data.timestamp,
      automaton: data.automaton,
      grok: data.grok
    }
  }
  
  if (format === "text") {
    return `
AUTOMATON STATE REPORT
Generated: ${data.timestamp}

AUTOMATON STATUS:
- Total objects: ${data.automaton?.totalLines || 0}
- Last modified: ${data.automaton?.lastModified || 'N/A'}

GROK FILES STATUS:
- Total files: ${data.grok?.totalFiles || 0}
- Total lines: ${data.grok?.files?.reduce((sum: number, f: any) => sum + f.lines, 0) || 0}
    `.trim()
  }
  
  // Markdown format
  return `# Automaton State Report

**Generated:** ${data.timestamp}

## Automaton Status
- **Total objects:** ${data.automaton?.totalLines || 0}
- **Last modified:** ${data.automaton?.lastModified || 'N/A'}

## Grok Files Status  
- **Total files:** ${data.grok?.totalFiles || 0}
- **Total lines:** ${data.grok?.files?.reduce((sum: number, f: any) => sum + f.lines, 0) || 0}

## System Information
- **Node.js:** ${data.system.nodeVersion}
- **Platform:** ${data.system.platform}
- **Memory usage:** ${Math.round(data.system.memory.heapUsed / 1024 / 1024)}MB
`
}

function generatePerformanceReport(data: any, format: string, include?: string[]) {
  const performance = {
    automatonSize: data.automaton?.totalLines || 0,
    grokSize: data.grok?.files?.reduce((sum: number, f: any) => sum + f.size, 0) || 0,
    memoryUsage: data.system.memory,
    uptime: data.system.uptime
  }
  
  if (format === "json") {
    return { type: "performance", ...performance }
  }
  
  if (format === "text") {
    return `
PERFORMANCE REPORT
Generated: ${data.timestamp}

AUTOMATON:
- Objects: ${performance.automatonSize}
- Size efficiency: ${performance.automatonSize > 0 ? 'Good' : 'Minimal'}

GROK FILES:
- Total size: ${Math.round(performance.grokSize / 1024)}KB
- Average file size: ${data.grok?.totalFiles ? Math.round(performance.grokSize / data.grok.totalFiles) : 0}B

SYSTEM:
- Memory used: ${Math.round(performance.memoryUsage.heapUsed / 1024 / 1024)}MB
- Uptime: ${Math.round(performance.uptime)}s
    `.trim()
  }
  
  return `# Performance Report

**Generated:** ${data.timestamp}

## Automaton Performance
- **Objects:** ${performance.automatonSize}
- **Size efficiency:** ${performance.automatonSize > 0 ? 'Good' : 'Minimal'}

## Grok Files Performance
- **Total size:** ${Math.round(performance.grokSize / 1024)}KB
- **Average file size:** ${data.grok?.totalFiles ? Math.round(performance.grokSize / data.grok.totalFiles) : 0}B

## System Performance
- **Memory used:** ${Math.round(performance.memoryUsage.heapUsed / 1024 / 1024)}MB
- **Uptime:** ${Math.round(performance.uptime)}s
`
}

function generateEvolutionReport(data: any, format: string, include?: string[]) {
  // Analyze evolution patterns from the data
  const evolution = {
    stages: ["0D", "1D", "2D", "3D", "4D", "5D", "6D", "7D"],
    currentStage: "Unknown",
    progress: 0
  }
  
  if (data.automaton && data.automaton.objects.length > 0) {
    // Try to determine current stage from automaton data
    evolution.currentStage = "Active"
    evolution.progress = Math.min(100, (data.automaton.objects.length / 100) * 100)
  }
  
  if (format === "json") {
    return { type: "evolution", ...evolution }
  }
  
  if (format === "text") {
    return `
EVOLUTION REPORT
Generated: ${data.timestamp}

EVOLUTION PATH:
${evolution.stages.join(" → ")}

CURRENT STATUS:
- Stage: ${evolution.currentStage}
- Progress: ${Math.round(evolution.progress)}%

GROK FILES PROGRESSION:
- Files processed: ${data.grok?.totalFiles || 0}/59
- Coverage: ${Math.round((data.grok?.totalFiles || 0) / 59 * 100)}%
    `.trim()
  }
  
  return `# Evolution Report

**Generated:** ${data.timestamp}

## Evolution Path
${evolution.stages.join(" → ")}

## Current Status
- **Stage:** ${evolution.currentStage}
- **Progress:** ${Math.round(evolution.progress)}%

## Grok Files Progression
- **Files processed:** ${data.grok?.totalFiles || 0}/59
- **Coverage:** ${Math.round((data.grok?.totalFiles || 0) / 59 * 100)}%
`
}

function generateAnalysisReport(data: any, format: string, include?: string[]) {
  const analysis = {
    patterns: extractPatterns(data),
    insights: generateInsights(data),
    recommendations: generateRecommendations(data)
  }
  
  if (format === "json") {
    return { type: "analysis", ...analysis }
  }
  
  return `# Analysis Report

**Generated:** ${data.timestamp}

## Patterns Found
${analysis.patterns.map((p: string) => `- ${p}`).join('\n')}

## Key Insights
${analysis.insights.map((i: string) => `- ${i}`).join('\n')}

## Recommendations
${analysis.recommendations.map((r: string) => `- ${r}`).join('\n')}
`
}

function generateFullReport(data: any, format: string, include?: string[], agent?: string, sessionID?: string) {
  const sections = []
  
  if (!include || include.includes('state')) {
    sections.push(generateStateReport(data, 'markdown'))
  }
  
  if (!include || include.includes('performance')) {
    sections.push(generatePerformanceReport(data, 'markdown'))
  }
  
  if (!include || include.includes('evolution')) {
    sections.push(generateEvolutionReport(data, 'markdown'))
  }
  
  if (!include || include.includes('analysis')) {
    sections.push(generateAnalysisReport(data, 'markdown'))
  }
  
  return `# Full Automaton System Report

**Generated:** ${data.timestamp}
${agent ? `**Agent:** ${agent}` : ''}
${sessionID ? `**Session:** ${sessionID}` : ''}

---

${sections.join('\n\n---\n\n')}
`
}

function extractPatterns(data: any) {
  const patterns = []
  
  if (data.automaton && data.automaton.totalLines > 0) {
    patterns.push(`Automaton has ${data.automaton.totalLines} objects`)
  }
  
  if (data.grok && data.grok.totalFiles > 0) {
    patterns.push(`Grok canvas contains ${data.grok.totalFiles} files`)
    patterns.push(`Average ${Math.round(data.grok.files.reduce((sum: number, f: any) => sum + f.lines, 0) / data.grok.totalFiles)} lines per file`)
  }
  
  return patterns
}

function generateInsights(data: any) {
  const insights = []
  
  if (data.automaton && data.automaton.totalLines > 50) {
    insights.push("Automaton shows significant complexity")
  }
  
  if (data.grok && data.grok.totalFiles >= 59) {
    insights.push("Complete Grok canvas coverage achieved")
  } else if (data.grok && data.grok.totalFiles > 30) {
    insights.push("Substantial Grok canvas progress")
  }
  
  return insights
}

function generateRecommendations(data: any) {
  const recommendations = []
  
  if (!data.automaton || data.automaton.totalLines === 0) {
    recommendations.push("Initialize automaton with basic operations")
  }
  
  if (!data.grok || data.grok.totalFiles < 59) {
    recommendations.push("Continue exploring Grok files for complete coverage")
  }
  
  if (data.system.memory.heapUsed > 100 * 1024 * 1024) {
    recommendations.push("Monitor memory usage for large-scale operations")
  }
  
  return recommendations
}