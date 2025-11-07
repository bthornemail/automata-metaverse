---
description: ⚙️ Create and manage automaton configurations
agent: default
subtask: false
---

Demonstrate configuration management for different experimental setups.

Execute this configuration sequence:

1. Use config-manager with action "create", name "fast-exploration", config {"interval": 500, "maxIterations": 200, "useOllama": false}
2. Use config-manager with action "create", name "ai-research", config {"interval": 3000, "maxIterations": 50, "useOllama": true, "model": "llama3.2"}
3. Use config-manager with action "create", name "deep-analysis", config {"interval": 1000, "maxIterations": 1000, "useOllama": false}
4. Use config-manager with action "list" to show all configurations
5. Use config-manager with action "compare", name "fast-exploration", compareWith "ai-research"

Then provide configuration analysis:

- **Configuration Profiles**: Purpose and optimal use cases for each setup
- **Performance Trade-offs**: Speed vs depth vs intelligence analysis
- **Comparison Insights**: Key differences and when to use each
- **Recommendations**: Best configurations for different goals
- **Customization Options**: How to adapt configs for specific experiments
- **Management Strategy**: How to effectively use configuration system

This enables systematic experimentation with different automaton behaviors and analysis approaches.