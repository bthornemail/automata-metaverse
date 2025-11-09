---
description: 📈 Monitor real-time automaton performance
agent: default
subtask: false
---

Real-time performance monitoring and analysis of the continuous automaton system.

Execute this monitoring sequence:

1. Use report-generator with reportType "performance", format "json"
2. Use report-generator with reportType "state", format "json"
3. Use automaton-query with query "history" to get execution timeline
4. Use automaton-query with query "modifications" to track changes
5. If automaton is running, use automaton with action "status" for current state

Then provide performance analysis:

- **Execution Metrics**: Iteration speed, operation frequency, success rates
- **Memory Usage**: Object growth, memory efficiency, garbage collection
- **Dimensional Progression**: Speed of advancement through levels
- **Modification Patterns**: Frequency and impact of self-modifications
- **State Consistency**: System stability and integrity metrics
- **Performance Bottlenecks**: Identified constraints and optimization opportunities
- **Resource Utilization**: CPU, memory, and I/O usage patterns
- **Scaling Analysis**: How performance changes with system complexity

Provide actionable recommendations for optimizing automaton performance and identifying potential issues before they become problems.