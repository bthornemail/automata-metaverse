---
id: r5rs-expressions-readme
title: "R5RS Expressions Documentation"
level: foundational
type: navigation
tags: [r5rs-expressions, church-encoding, lambda-calculus, computational-manifold, webgl]
keywords: [r5rs-expressions, church-encoding, lambda-calculus, computational-manifold, webgl, m-expressions, evaluation-encoding, polynomial-canvas]
prerequisites: []
enables: [r5rs-expressions-rfc2119-spec]
related: [r5rs-canvas-engine, blackboard-architecture-guide]
readingTime: 20
difficulty: 4
blackboard:
  status: active
  assignedAgent: "0D-Topology-Agent"
  lastUpdate: 2025-01-07
  dependencies: [r5rs-canvas-engine]
  watchers: []
  r5rsEngine: "r5rs-canvas-engine.scm"
  selfBuilding:
    enabled: true
    source: "r5rs-canvas-engine.scm"
    pattern: "church-encoding"
---

# R5RS Expressions Documentation

This folder contains documentation for R5RS expression foundations, Church encoding, and computational manifold architecture.

## Overview

R5RS expressions form the mathematical foundation of the automaton system, providing:
- Church encoding for natural numbers and booleans
- Lambda calculus foundations
- Computational manifold architecture
- WebGL integration for visualization
- M-expressions and evaluation encoding

## Key Documents

- **Architecture IS The Computational Manifold.md**: Computational manifold architecture
- **M-EXPRESSIONS AS EVALUATION ENCODING.md**: M-expression evaluation encoding
- **Polynomial Canvas with Evaluation Encoding.md**: Polynomial canvas implementation
- **WebGL Computational Manifold Architecture.md**: WebGL visualization architecture

## Related Documentation

- **`docs/05-Meta-Log/`**: Meta-Log integration with R5RS
- **`r5rs-canvas-engine.scm`**: Unified R5RS function implementations
- **`grok_files/02-Grok.md` through `grok_files/25-Grok.md`**: R5RS concept definitions
