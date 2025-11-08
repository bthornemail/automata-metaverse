---
id: opencode-integration-map
title: "Tool-Command Integration Map"
level: practical
type: guide
tags: [opencode, integration, tools, commands, automaton, blackboard-architecture]
keywords: [opencode-plugin, tool-integration, command-mapping, automaton-tools, blackboard-architecture, r5rs-canvas-engine, automaton-self-building]
prerequisites: [opencode-readme, plugin-guide]
enables: [opencode-tool-development, command-creation]
related: [opencode-readme, plugin-guide, blackboard-architecture-guide]
readingTime: 15
difficulty: 2
blackboard:
  status: active
  assignedAgent: null
  lastUpdate: null
  dependencies: []
  watchers: []
  r5rsEngine: "r5rs-canvas-engine.scm"
  selfBuilding:
    enabled: true
    source: "r5rs-canvas-engine.scm"
    pattern: "blackboard-architecture"
    regeneration:
      function: "r5rs:parse-jsonl-canvas"
      args: ["automaton-kernel.jsonl"]
      context:
        module: "opencode-integration"
        functions: ["r5rs:extract-facts", "r5rs:query-facts"]
---

# Tool-Command Integration Map

This document shows how the OpenCode tools are integrated with the command files.

## 🔗 Integration Overview

Each tool file includes JSDoc comments linking to the command files that use it. This ensures discoverability and maintains clear relationships between tools and commands.

## 📋 Tool-to-Command Mapping

### 1. `automaton-execute.ts`
**Purpose**: Execute specific automaton operations on demand

**Used by Commands**:
- ✅ `/execute-operations` (`execute-operations.md`) - Primary command for operation execution
- ✅ `/run-experiments` (`run-experiments.md`) - Part of comprehensive experiment suite

**Integration Points**:
- Operation execution sequence in `execute-operations.md`
- Phase 2 operation testing in `run-experiments.md`

---

### 2. `automaton-query.ts`
**Purpose**: Query and analyze automaton internal state

**Used by Commands**:
- ✅ `/start-automaton` (`start-automaton.md`) - Initial state check after starting
- ✅ `/monitor-performance` (`monitor-performance.md`) - Real-time state monitoring
- ✅ `/execute-operations` (`execute-operations.md`) - State verification after operations
- ✅ `/start-ai-automaton` (`start-ai-automaton.md`) - History tracking for AI decisions

**Integration Points**:
- State query after automaton start
- Performance monitoring queries
- Operation result verification
- AI decision pattern tracking

---

### 3. `automaton.ts`
**Purpose**: Control continuous automaton execution lifecycle

**Used by Commands**:
- ✅ `/start-automaton` (`start-automaton.md`) - Primary command for starting automaton
- ✅ `/start-ai-automaton` (`start-ai-automaton.md`) - AI-powered automaton startup
- ✅ `/monitor-performance` (`monitor-performance.md`) - Status checks during monitoring

**Integration Points**:
- Start action with default settings
- Start action with Ollama AI integration
- Status checks during performance monitoring

---

### 4. `canvas-visualizer.ts`
**Purpose**: Visualize computational topology canvas

**Used by Commands**:
- ✅ `/visualize-system` (`visualize-system.md`) - Primary command for system visualization
- ✅ `/explore-canvas` (`explore-canvas.md`) - Visual representation of canvas structure
- ✅ `/run-experiments` (`run-experiments.md`) - Visualization phase of experiments

**Integration Points**:
- Comprehensive visualization sequence
- Canvas structure visualization
- Experiment visualization phase

---

### 5. `config-manager.ts`
**Purpose**: Manage automaton configurations

**Used by Commands**:
- ✅ `/manage-configs` (`manage-configs.md`) - Primary command for configuration management
- ✅ `/run-experiments` (`run-experiments.md`) - Configuration testing phase

**Integration Points**:
- Configuration creation and comparison
- Experiment configuration setup

---

### 6. `grok-explorer.ts`
**Purpose**: Explore 59-file Grok computational topology

**Used by Commands**:
- ✅ `/explore-canvas` (`explore-canvas.md`) - Primary command for canvas exploration
- ✅ `/analyze-church` (`analyze-church.md`) - Searching for Church encoding patterns
- ✅ `/run-experiments` (`run-experiments.md`) - Baseline establishment phase

**Integration Points**:
- Comprehensive canvas exploration sequence
- Church encoding pattern searches
- Baseline analysis establishment

---

### 7. `pattern-analyzer.ts`
**Purpose**: Analyze patterns and extract insights

**Used by Commands**:
- ✅ `/analyze-church` (`analyze-church.md`) - Primary command for Church encoding analysis
- ✅ `/full-analysis` (`full-analysis.md`) - Comprehensive pattern analysis
- ✅ `/run-experiments` (`run-experiments.md`) - Pattern discovery phase

**Integration Points**:
- Church encoding pattern analysis
- Comprehensive system pattern analysis
- Pattern discovery in experiments

---

### 8. `report-generator.ts`
**Purpose**: Generate comprehensive reports

**Used by Commands**:
- ✅ `/monitor-performance` (`monitor-performance.md`) - Performance monitoring and reporting
- ✅ `/full-analysis` (`full-analysis.md`) - Complete system analysis report
- ✅ `/run-experiments` (`run-experiments.md`) - Experiment results documentation

**Integration Points**:
- Performance report generation
- Comprehensive analysis reports
- Experiment result documentation

---

## 🔄 Command Workflow Integration

### Quick Start Workflow
```
/start-automaton
  → automaton.ts (start)
  → automaton-query.ts (state check)
```

### Analysis Workflow
```
/analyze-church
  → pattern-analyzer.ts (church-encoding analysis)
  → grok-explorer.ts (pattern search)
```

### Comprehensive Analysis Workflow
```
/full-analysis
  → pattern-analyzer.ts (multiple analysis types)
  → report-generator.ts (full report)
```

### Experiment Suite Workflow
```
/run-experiments
  → grok-explorer.ts (baseline)
  → automaton-execute.ts (operations)
  → pattern-analyzer.ts (patterns)
  → canvas-visualizer.ts (visualization)
  → config-manager.ts (configuration)
  → report-generator.ts (reporting)
```

### Performance Monitoring Workflow
```
/monitor-performance
  → report-generator.ts (performance report)
  → automaton-query.ts (state queries)
  → automaton.ts (status checks)
```

## ✅ Integration Verification

All tools are properly integrated with their respective command files:

- ✅ **8 Tools** - All have integration comments
- ✅ **10 Commands** - All reference correct tools
- ✅ **Tool Names** - Consistent across commands and tools
- ✅ **Parameters** - Match between command usage and tool schemas
- ✅ **Workflows** - Complete integration chains verified

## 📝 Maintenance Notes

When adding new tools:
1. Add JSDoc integration comments linking to command files
2. Update this integration map
3. Create or update command files that use the tool
4. Verify tool names match command references

When adding new commands:
1. Reference tools using exact tool names
2. Update tool JSDoc comments to include new command
3. Add command to this integration map
4. Verify parameter compatibility

---

**Last Updated**: 2025-01-07  
**Integration Status**: ✅ Complete
