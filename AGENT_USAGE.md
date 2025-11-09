---
id: agent-usage
title: "Natural Language Interface Agents for Continuous Automaton"
level: practical
type: guide
tags: [agent-usage, natural-language-interface, agents, continuous-automaton]
keywords: [agent-usage, natural-language-interface, automaton-interface, r5rs-canvas-engine, blackboard-architecture, automaton-self-building]
prerequisites: [agents-multi-agent-system]
enables: []
related: [r5rs-canvas-engine, blackboard-architecture-guide, agents-multi-agent-system]
readingTime: 20
difficulty: 2
blackboard:
  status: active
  assignedAgent: null
  lastUpdate: null
  dependencies: [r5rs-canvas-engine]
  watchers: []
  r5rsEngine: "r5rs-canvas-engine.scm"
  selfBuilding:
    enabled: true
    source: "r5rs-canvas-engine.scm"
    pattern: "blackboard-architecture"
    regeneration:
      function: "r5rs:parse-jsonl-canvas"
      args: ["generate.metaverse.jsonl"]
  agents:
    primary: "automaton-interface"
    subagents:
      - "automaton-control"
      - "automaton-analyzer"
      - "dimensional-guide"
      - "church-encoding-expert"
      - "automaton-visualizer"
---

# Natural Language Interface Agents for Continuous Automaton

This directory contains specialized agents for natural language interaction with your continuous self-referencing automaton system.

## Available Agents

### Primary Agent
- **automaton-interface** - Main interface that coordinates all other agents

### Subagents (use with @ mention)
- **@automaton-control** - Direct control and execution commands
- **@automaton-analyzer** - Pattern analysis and behavioral insights  
- **@dimensional-guide** - 0D-7D dimensional progression expertise
- **@church-encoding-expert** - Lambda calculus and Church encoding explanations
- **@automaton-visualizer** - Visual representations and diagrams

## Usage Examples

### Basic Control
```
Start the automaton with 2 second intervals
Stop the automaton
Switch to Ollama mode with llama3.2 model
```

### Analysis and Insights
```
@automaton-analyzer Analyze the self-modification patterns
@automaton-analyzer Show me dimensional progression trajectory
@automaton-analyzer Identify frequent action sequences
```

### Dimensional Guidance
```
@dimensional-guide What dimension are we currently in?
@dimensional-guide Explain 6D intelligence systems
@dimensional-guide How do we progress from 4D to 5D?
```

### Church Encoding
```
@church-encoding-expert Explain the successor function
@church-encoding-expert How does addition work with Church numerals?
@church-encoding-expert Explain the Y-combinator's role
```

### Visualization
```
@automaton-visualizer Create an ASCII map of dimensional topology
@automaton-visualizer Show me the evolution timeline
@automaton-visualizer Generate action frequency charts
```

### Complex Workflows
```
Start the automaton, then @automaton-analyzer analyze the patterns
@dimensional-guide explain current dimension, then @automaton-visualizer create a map
@church-encoding-expert explain the base encoding, then @automaton-control trigger evolution
```

## Agent Coordination

The primary **automaton-interface** agent can:
- Monitor overall system health
- Coordinate multi-agent workflows
- Provide high-level oversight
- Automatically delegate to appropriate subagents

## Configuration

All agents are configured with:
- Appropriate tool permissions for their tasks
- Temperature settings optimized for their function
- Specific models for their expertise areas
- Clear behavioral guidelines

## Getting Started

1. Use Tab to switch to the automaton-interface agent
2. Start with simple commands like "Show current status"
3. Explore subagents using @ mentions
4. Build complex workflows by combining agents

The agents work together to provide comprehensive natural language control over your continuous automaton system, from basic execution to deep mathematical analysis.