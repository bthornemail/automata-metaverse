# OpenCode Plugin for Continuous Automaton

This plugin provides comprehensive tools and commands to interact with the continuous self-referencing automaton system and computational topology canvas built on Church encoding foundations.

## 🛠️ Available Tools

### 1. `automaton` - 🤖 Control the continuous automaton
**Purpose**: Start, stop, monitor, and analyze the Church encoding-based computational topology system in real-time.

**Actions**: `start`, `stop`, `status`, `analyze`
**Key Parameters**:
- `interval`: ⏱️ Time between iterations (ms, default: 2000)
- `maxIterations`: 🔄 Maximum iterations (default: unlimited)
- `useOllama`: 🧠 Enable AI-powered decision making (default: false)
- `model`: 🤖 Ollama model for AI actions (default: llama3.2)
- `automatonFile`: 📁 Path to JSONL data file (default: ./automaton.jsonl)

### 2. `automaton-query` - 🔍 Query automaton state
**Purpose**: Query and analyze the automaton's internal state, self-reference patterns, dimensional progression, and execution history.

**Queries**: `state`, `self-reference`, `dimension`, `modifications`, `history`
**Key Parameters**:
- `automatonFile`: 📁 Path to JSONL data file (default: ./automaton.jsonl)

### 3. `automaton-execute` - ⚡ Execute specific operations
**Purpose**: Trigger individual Church encoding operations, self-modifications, or dimensional transitions on demand.

**Operations**: `evolve`, `self-reference`, `self-modify`, `self-io`, `validate`, `train`, `observe`, `compose`
**Key Parameters**:
- `automatonFile`: 📁 Path to JSONL data file (default: ./automaton.jsonl)
- `saveAfter`: 💾 Persist state changes (default: true)

### 4. `grok-explorer` - 🗺️ Explore Grok files
**Purpose**: Navigate the 59 Grok files that form the computational topology canvas from 0D point topology to 7D quantum superposition.

**Actions**: `list`, `read`, `search`, `analyze`
**Key Parameters**:
- `fileNumber`: 📄 Specific file to read (1-59)
- `searchTerm`: 🔍 Term to search for (e.g., 'church', 'lambda', 'quantum')
- `dimension`: 🌐 Filter by dimension (0D-7D)

### 5. `canvas-visualizer` - 🎨 Visualize the topology canvas
**Purpose**: Create ASCII art, JSON structures, and evolution graphs from the Church encoding system.

**Types**: `canvas`, `dimension`, `self-reference`, `evolution`
**Key Parameters**:
- `format`: 📋 Output format: `text`, `json`, `ascii` (default: text)
- `dimension`: 🌐 Specific dimension to visualize (0-7)
- `automatonFile`: 📁 Path to JSONL file for self-reference analysis

### 6. `pattern-analyzer` - 🧠 Analyze patterns and extract insights
**Purpose**: Discover Church encoding patterns, self-reference recursion, dimensional relationships, and topological structures.

**Analysis types**: `patterns`, `dimensions`, `evolution`, `church-encoding`, `self-reference`, `topology`
**Key Parameters**:
- `scope`: 📊 Data source: `grok-files`, `automaton`, or `both` (default: both)
- `detail`: 📈 Analysis depth: `summary`, `detailed`, `full` (default: summary)
- `dimension`: 🌐 Filter by specific dimension (0-7)

### 7. `report-generator` - 📊 Generate comprehensive reports
**Purpose**: Create state snapshots, performance analyses, evolution timelines, and full system documentation.

**Report types**: `state`, `performance`, `evolution`, `analysis`, `full`
**Key Parameters**:
- `format`: 📄 Output format: `text`, `json`, `markdown` (default: markdown)
- `include`: 🎯 Sections to include (default: all)
- `outputFile`: 💾 Save report to file
- `timeRange`: ⏰ Time range for analysis

### 8. `config-manager` - ⚙️ Manage automaton configurations
**Purpose**: Save, load, compare, and reset experimental setups for different parameters and behaviors.

**Actions**: `create`, `load`, `save`, `list`, `compare`, `reset`
**Key Parameters**:
- `name`: 🏷️ Configuration name for identification
- `config`: ⚙️ Configuration object with automaton parameters
- `compareWith`: 🔄 Configuration name to compare with

## 🚀 Custom Commands

The plugin includes 10 custom commands for quick access to common workflows:

### Quick Start Commands
- `/start-automaton` - 🚀 Quick start with optimal defaults
- `/start-ai-automaton` - 🧠 Start with Ollama AI integration
- `/explore-canvas` - 🗺️ Comprehensive Grok file exploration
- `/visualize-system` - 🎨 Generate system visualizations

### Analysis Commands
- `/full-analysis` - 📊 Complete system analysis report
- `/analyze-church` - 🔍 Deep Church encoding pattern analysis
- `/monitor-performance` - 📈 Real-time performance monitoring

### Experimentation Commands
- `/execute-operations` - ⚡ Test specific automaton operations
- `/manage-configs` - ⚙️ Configuration management demo
- `/run-experiments` - 🧪 Comprehensive experiment suite

### Usage Examples

#### Quick Start
```
/start-automaton
```

#### AI-Powered Exploration
```
/start-ai-automaton
```

#### Deep Analysis
```
/full-analysis
```

#### Church Encoding Study
```
/analyze-church
```

#### Canvas Exploration
```
/explore-canvas
```

#### System Visualization
```
/visualize-system
```

#### Performance Monitoring
```
/monitor-performance
```

#### Operation Testing
```
/execute-operations
```

#### Configuration Management
```
/manage-configs
```

#### Full Experiment Suite
```
/run-experiments
```

### Tool Usage Examples

#### Start the automaton
```
Use the automaton tool with action "start", interval 1000, maxIterations 50
```

#### Execute specific operation
```
Use the automaton-execute tool with operation "self-modify", saveAfter true
```

#### Check current state
```
Use the automaton-query tool with query "state"
```

#### Analyze patterns
```
Use the pattern-analyzer tool with analysis "patterns", scope "both", detail "full"
```

#### Generate performance report
```
Use the report-generator tool with reportType "performance", format "markdown", outputFile "performance.md"
```

#### Create configuration
```
Use the config-manager tool with action "create", name "fast-config", config {"interval": 500, "useOllama": true}
```

#### Explore Grok files
```
Use the grok-explorer tool with action "list"
```

#### Visualize the canvas
```
Use the canvas-visualizer tool with type "canvas", format "ascii"
```

#### Read a specific Grok file
```
Use the grok-explorer tool with action "read", fileNumber 17
```

#### Search for concepts
```
Use the grok-explorer tool with action "search", searchTerm "church"
```

#### Compare configurations
```
Use the config-manager tool with action "compare", name "config1", compareWith "config2"
```

## 📦 Installation

The tools and commands are automatically available when OpenCode scans the `.opencode/` directory. No additional installation required.

**Directory Structure**:
```
.opencode/
├── tool/                    # Custom tools (8 files)
│   ├── automaton.ts
│   ├── automaton-query.ts
│   ├── automaton-execute.ts
│   ├── grok-explorer.ts
│   ├── canvas-visualizer.ts
│   ├── pattern-analyzer.ts
│   ├── report-generator.ts
│   └── config-manager.ts
├── command/                 # Custom commands (10 files)
│   ├── start-automaton.md
│   ├── start-ai-automaton.md
│   ├── explore-canvas.md
│   ├── visualize-system.md
│   ├── full-analysis.md
│   ├── analyze-church.md
│   ├── monitor-performance.md
│   ├── execute-operations.md
│   ├── manage-configs.md
│   └── run-experiments.md
├── README.md               # This file
├── PLUGIN_GUIDE.md        # Detailed usage guide
└── package.json           # Plugin metadata
```

## 🏗️ Architecture

The plugin integrates with the automaton system at multiple levels:

**Core Integration**:
- `continuous-automaton.ts` - Main execution engine
- `advanced-automaton.ts` - Core automaton logic
- `grok_files/` - 59-file computational topology canvas
- `automaton.jsonl` - Self-referential data structure
- `automaton-configs/` - Configuration storage (auto-created)

**Tool Layer**:
- **Control Tools**: Automaton lifecycle management
- **Query Tools**: State inspection and monitoring
- **Analysis Tools**: Pattern discovery and insights
- **Visualization Tools**: ASCII art and structure graphs
- **Management Tools**: Configuration and reporting

**Command Layer**:
- **Quick Start**: Rapid initialization commands
- **Analysis**: Comprehensive analysis workflows
- **Experimentation**: Systematic testing procedures

## ✨ Features

### 🎯 Core Capabilities
- **Real-time Control**: Start/stop automaton with configurable parameters
- **State Monitoring**: Query dimensions, modifications, execution history
- **Operation Execution**: Run specific Church encoding operations on demand
- **Canvas Exploration**: Browse 59 Grok files forming computational topology
- **Pattern Analysis**: Deep analysis across dimensions and structures
- **Visualization**: ASCII art, JSON structures, evolution graphs
- **Reporting**: Multi-format comprehensive documentation
- **Configuration Management**: Save, load, compare experimental setups
- **Search**: Find patterns across computational canvas
- **Session Tracking**: All operations include agent and session context

### 🧠 Advanced Features
- **AI Integration**: Ollama-powered intelligent action selection
- **Church Encoding Analysis**: Lambda calculus pattern discovery
- **Self-Reference Analysis**: Meta-circular evaluator insights
- **Dimensional Progression**: 0D→7D computational complexity tracking
- **Performance Monitoring**: Resource usage and optimization analysis
- **Custom Commands**: One-click complex workflows
- **Batch Operations**: Execute multiple operations in sequence
- **Comparative Analysis**: Side-by-side configuration comparison

## 🔄 Workflow Examples

### 1. 🚀 Quick Start Workflow
```
/start-automaton → /monitor-performance → /visualize-system
```

### 2. 🧠 AI-Powered Exploration
```
/start-ai-automaton → /analyze-church → /full-analysis
```

### 3. 🗺️ Canvas Discovery
```
/explore-canvas → /visualize-system → /analyze-church
```

### 4. ⚙️ Experimental Research
```
/manage-configs → /run-experiments → /full-analysis
```

### 5. 📊 Performance Analysis
```
/monitor-performance → /execute-operations → /full-analysis
```

### 6. 🔍 Deep Pattern Study
```
/analyze-church → /explore-canvas → /visualize-system
```

## 🎛️ Advanced Usage

### Custom Tool Combinations
Create your own workflows by combining tools:
```bash
# Example: Evolution tracking
automaton start → automaton-query state → pattern-analyzer evolution → report-generator full
```

### Configuration Templates
Save experimental setups for reproducible research:
```bash
config-manager create "quantum-study" {"dimensions": [7], "operations": ["self-observe", "evolve"]}
```

### Batch Analysis
Process multiple dimensions in sequence:
```bash
for dim in {0..7}; do
  canvas-visualizer dimension $dim ascii
  pattern-analyzer dimensions summary $dim
done
```

## 📚 Best Practices

1. **Start Simple**: Use `/start-automaton` before advanced configurations
2. **Monitor Continuously**: Use `/monitor-performance` during long runs
3. **Save Configurations**: Preserve experimental setups with `/manage-configs`
4. **Document Results**: Generate reports with `/full-analysis`
5. **Explore Systematically**: Use `/explore-canvas` before deep analysis
6. **Validate Operations**: Use `/execute-operations` to test individual actions
7. **Compare Approaches**: Use configuration comparison for optimization
8. **Track Evolution**: Use visualization tools to understand progression