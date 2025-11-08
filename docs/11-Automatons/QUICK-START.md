---
id: automatons-quick-start
title: "Automatons Quick Start Guide"
level: practical
type: quick-reference
tags: [automatons-quick-start, quick-reference, common-commands, script-locations]
keywords: [automatons-quick-start, quick-reference, common-commands, script-locations, documentation-index]
prerequisites: [automatons-docs-readme]
enables: []
related: [run-automaton-script-docs, continuous-automaton-docs, ollama-automaton-docs]
readingTime: 5
difficulty: 1
blackboard:
  status: active
  assignedAgent: null
  lastUpdate: null
  dependencies: []
  watchers: []
---

# Automatons Quick Start Guide

## Quick Reference

### Running Automatons

```bash
# Built-in intelligence (recommended for beginners)
./scripts/run-automaton.sh

# AI-powered with Ollama
./scripts/run-automaton.sh --ollama

# Bootstrap from kernel
npx tsx bootstrap-automaton.ts
```

### Common Commands

```bash
# Quick test run (10 iterations, 1s interval)
./scripts/run-automaton.sh --interval 1000 --max 10

# AI-powered limited run
./scripts/run-automaton.sh --ollama --model llama3.2 --max 20

# Custom Ollama model
./scripts/run-automaton.sh --ollama --model qwen2.5:3b --interval 3000

# Custom automaton file
./scripts/run-automaton.sh --file ./automaton-kernel.jsonl --ollama

# Full configuration with custom file
./scripts/run-automaton.sh --file ./custom-automaton.jsonl --ollama --model llama3.2:latest --interval 5000 --max 50
```

## Script Locations

All scripts are located in `/home/main/automaton/scripts/`:

- **`run-automaton.sh`**: Main launcher script (moved from root)

## TypeScript Automatons

Located in `/home/main/automaton/`:

- **`continuous-automaton.ts`**: Built-in intelligence runner
- **`ollama-automaton.ts`**: Ollama AI runner
- **`advanced-automaton.ts`**: Core engine
- **`bootstrap-automaton.ts`**: Bootstrap process
- **`automaton-runner.ts`**: Basic runner

## Documentation

All documentation is in `/home/main/automaton/docs/11-Automatons/`:

- **`README.md`**: Complete overview
- **`RUN-AUTOMATON-SCRIPT.md`**: Launcher script details
- **`CONTINUOUS-AUTOMATON.md`**: Built-in intelligence
- **`OLLAMA-AUTOMATON.md`**: Ollama AI integration
- **`ADVANCED-AUTOMATON.md`**: Core engine
- **`BOOTSTRAP-AUTOMATON.md`**: Bootstrap process
- **`AUTOMATON-RUNNER.md`**: Basic runner
- **`QUICK-START.md`**: This file

## See Also

- **`docs/11-Automatons/README.md`**: Full documentation
- **`AGENTS.md`**: Multi-agent system architecture
