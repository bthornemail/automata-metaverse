---
id: agents-multi-agent-system
title: "AGENTS.md – Multi-Agent System for the Computational Topology Canvas"
level: foundational
type: specification
tags: [multi-agent-system, agents, computational-topology, church-encoding, dimensional-progression, blackboard-architecture, ci-cd]
keywords: [multi-agent-system, agents, computational-topology-canvas, church-encoding, dimensional-progression-0d-7d, r5rs-canvas-engine, blackboard-architecture, automaton-self-building, prolog-integration, datalog-integration, shacl-validation, asp-constraints, ci-pipeline-adapter, github-actions]
prerequisites: [multiverse-canvas-rfc2119-spec, meta-log-docs-readme, metaverse-canvas-complete]
enables: []
related: [r5rs-canvas-engine, blackboard-architecture-guide, multiverse-canvas-rfc2119-spec, canvasl-rfc2119-spec, seed-regeneration-guide, github-ci-cd-workflow-readme, automatons-docs-readme, automatons-canvasl-docs-readme]
readingTime: 90
difficulty: 5
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
      context:
        module: "MODULE 2: JSONL Parser & Canvas Loader"
        functions: ["r5rs:parse-jsonl-canvas", "r5rs:extract-facts", "r5rs:jsonl-to-rdf"]
        pipeline:
          - step: "load-metaverse"
            function: "r5rs:parse-jsonl-canvas"
            args: ["generate.metaverse.jsonl"]
          - step: "extract-references"
            function: "r5rs:sparql-query"
            args: ["SELECT ?id ?target WHERE { ?id rdf:type metaverse:Reference }", "triples"]
          - step: "generate-files"
            function: "r5rs:invoke-from-jsonl"
            args: ["regenerate-function", "reference-args"]
          - step: "validate"
            function: "r5rs:shacl-validate"
            args: ["shapes", "triples"]
  architecture:
    threeLayer:
      topLayer:
        name: "Vertical Spine"
        type: "Fixed Church encoding mathematical foundation"
        immutable: true
        functions: ["r5rs:church-zero", "r5rs:church-succ", "r5rs:church-add", "r5rs:church-mult", "r5rs:church-exp", "r5rs:y-combinator"]
      middleLayer:
        name: "Horizontal Templates"
        type: "Implementation mappings via blackboard"
        mutable: true
        pattern: "h:* edges define implementation templates"
      bottomLayer:
        name: "JSONL Blackboard"
        type: "Queryable fact database"
        functions: ["r5rs:parse-jsonl-canvas", "r5rs:extract-facts", "r5rs:query-facts"]
  agentTypes:
    foundationAgents:
      - id: "0D-Topology-Agent"
        dimension: "0D"
        purpose: "Maintain quantum vacuum topology and identity processes"
        churchEncoding: "r5rs:church-zero"
        dependencies: []
      - id: "1D-Temporal-Agent"
        dimension: "1D"
        purpose: "Handle temporal evolution and Church successor operations"
        churchEncoding: "r5rs:church-succ"
        dependencies: ["0D-Topology-Agent"]
      - id: "2D-Structural-Agent"
        dimension: "2D"
        purpose: "Manage spatial structure and pattern encoding"
        churchEncoding: "r5rs:church-pair"
        dependencies: ["1D-Temporal-Agent"]
    operationalAgents:
      - id: "3D-Algebraic-Agent"
        dimension: "3D"
        purpose: "Perform Church algebra operations"
        churchEncoding: ["r5rs:church-add", "r5rs:church-mult", "r5rs:church-exp"]
        dependencies: ["2D-Structural-Agent"]
      - id: "4D-Network-Agent"
        dimension: "4D"
        purpose: "Manage spacetime and network operations"
        capabilities: ["IPv4/IPv6 address systems", "localhost operations", "CI/CD network operations", "deployment management"]
        ciIntegration:
          adapter: "NetworkAgentCI"
          operations: ["triggerDeployment", "monitorDeployment"]
          responsibilities: ["Deploy to staging/production", "Monitor deployment status", "Coordinate network-level CI/CD"]
        dependencies: ["3D-Algebraic-Agent"]
    advancedAgents:
      - id: "5D-Consensus-Agent"
        dimension: "5D"
        purpose: "Implement distributed consensus and blockchain operations"
        requirements: "MUST implement exactly one blockchain system"
        ciIntegration:
          adapter: "ConsensusAgentCI"
          operations: ["triggerConsensusPipeline", "waitForConsensus"]
          responsibilities: ["Coordinate deployment decisions", "Manage approval workflows", "Multi-agent consensus voting"]
        dependencies: ["4D-Network-Agent"]
      - id: "6D-Intelligence-Agent"
        dimension: "6D"
        purpose: "Handle emergent AI and neural network operations"
        requirements: "MUST implement exactly one AI system"
        ciIntegration:
          adapter: "IntelligenceAgentCI"
          operations: ["runTestsAndAnalyze", "getPerformanceMetrics"]
          responsibilities: ["Analyze test results", "Extract performance metrics", "Test log analysis", "Pipeline optimization"]
        dependencies: ["5D-Consensus-Agent"]
      - id: "7D-Quantum-Agent"
        dimension: "7D"
        purpose: "Manage quantum superposition and entanglement"
        requirements: "MUST implement exactly one qubit system"
        dependencies: ["6D-Intelligence-Agent"]
    interfaceAgents:
      - id: "Query-Interface-Agent"
        purpose: "Provide SPARQL/REPL access to the system"
        functions: ["r5rs:sparql-query", "r5rs:repl-interface"]
      - id: "Visualization-Agent"
        purpose: "Handle WebGL-based 3D visualization"
        technologies: ["Three.js", "GPU acceleration"]
    collaborativeAgents:
      - id: "Multiplayer-Agent"
        purpose: "Enable collaborative exploration"
        technologies: ["WebRTC", "Networked-Aframe"]
      - id: "AI-Assist-Agent"
        purpose: "Provide AI-powered development assistance"
        technologies: ["WebLLM", "3D trace visualization"]
    evolutionaryAgents:
      - id: "Self-Modification-Agent"
        purpose: "Drive system evolution through AI"
        functions: ["r5rs:rewrite-canvas-jsonl", "r5rs:shacl-validate"]
      - id: "Goal-Oriented-Agent"
        purpose: "Coordinate multi-agent goal negotiation"
        algorithms: ["Grover", "Borda"]
    opencodeAgent:
      - id: "OpenCode-Integration-Agent"
        purpose: "Bridge opencode CLI commands with automaton dimensional operations"
        toolMappings:
          "Read/Glob/Grep": "2D-Structural-Agent"
          "Edit/Write": "3D-Algebraic-Agent"
          "Bash": "4D-Network-Agent"
          "Task": "6D-Intelligence-Agent"
          "Todo": "5D-Consensus-Agent"
  communicationProtocol:
    vertical: "0D → 1D → 2D → 3D → 4D → 5D → 6D → 7D"
    horizontal: "Topology ↔ System implementations"
    messageTypes:
      - "State Updates"
      - "Query Requests (SPARQL, Prolog, Datalog)"
      - "Constraint Violations (SHACL)"
      - "Evolution Proposals"
      - "Consensus Votes"
      - "OpenCode Commands"
  prologIntegration:
    enabled: true
    module: "MODULE 6: Logic Programming"
    functions: ["r5rs:prolog-query", "r5rs:build-prolog-db", "r5rs:unify"]
    source: "grok_files/08-Grok.md"
    rules:
      - rule: "inherits(X,Z) :- vertical(Y,X), inherits(Y,Z)."
        description: "Prolog inheritance rule"
  datalogIntegration:
    enabled: true
    module: "MODULE 6: Logic Programming"
    functions: ["r5rs:extract-facts", "r5rs:datalog-query", "r5rs:build-datalog-program"]
    source: ["grok_files/03-Grok.md", "grok_files/10-Grok.md"]
    facts:
      - "node(Id, Type, X, Y, Text)"
      - "edge(Id, Type, FromNode, ToNode)"
      - "vertical(Id, FromNode, ToNode)"
      - "horizontal(Id, FromNode, ToNode)"
  rdfIntegration:
    enabled: true
    module: "MODULE 3: RDF Layer"
    functions: ["r5rs:jsonl-to-rdf", "r5rs:rdf-query", "r5rs:sparql-query"]
    source: "grok_files/04-Grok.md"
  shaclValidation:
    enabled: true
    module: "MODULE 5: SHACL Validation"
    functions: ["r5rs:load-shacl-shapes", "r5rs:shacl-validate"]
    source: "grok_files/07-Grok.md"
    constraints:
      - "Label validation: rdfs:label must be string"
      - "Identity validation: owl:sameAs minimum count 1"
      - "Technology validation: prov:used must match specifications"
  deploymentPhases:
    phase1:
      name: "Foundation"
      agents: ["0D-3D agents"]
      functions: ["r5rs:parse-jsonl-canvas", "r5rs:extract-facts"]
    phase2:
      name: "Expansion"
      agents: ["4D-6D agents"]
      functions: ["r5rs:jsonl-to-rdf", "r5rs:sparql-query"]
    phase3:
      name: "Integration"
      agents: ["7D and interface agents"]
      functions: ["r5rs:prolog-query", "r5rs:datalog-query"]
    phase4:
      name: "Autonomy"
      capabilities: ["self-modification", "goal negotiation", "quantum consensus"]
      functions: ["generate-all-automaton-files"]
  multiverseGeneration:
    enabled: true
    source: "generate.metaverse.jsonl"
    steps:
      - "Load Metaverse: r5rs:parse-jsonl-canvas"
      - "Extract References: SPARQL query"
      - "Generate Files: Invoke regeneration function"
      - "Create Unified Topology: Combine automaton.*.jsonl files"
      - "Validate: SHACL, RFC2119, ASP, Prolog, Datalog"
---

# AGENTS.md – Multi-Agent System for the Computational Topology Canvas

## Overview

This document describes a multi-agent system designed to interact with, evolve, and maintain the computational topology canvas defined across 59 Grok files (`grok_files/`). The system spans from foundational lambda calculus to emergent AI and quantum computing, with agents operating at different dimensional levels.

**Related Documentation:**
- **`docs/04-CanvasL/CANVASL-RFC2119-SPEC.md`**: Complete RFC 2119 specification for CanvasL language
- **`docs/05-Meta-Log/MULTIVERSE-CANVAS-RFC2119-SPEC.md`**: Complete RFC 2119 specification for ProLog, DataLog, and R5RS integration
- **`docs/05-Meta-Log/IMPLEMENTATION-GUIDE.md`**: Practical implementation guide with code examples
- **`docs/05-Meta-Log/QUICK_REFERENCE.md`**: Quick reference for common operations
- **`docs/03-Metaverse-Canvas/`**: CanvasL language overview and JSONL canvas editing
- **`docs/11-Automatons/README.md`**: Complete automaton execution documentation
- **`docs/12-Automatons-CanvasL/README.md`**: CanvasL format integration for automaton system
- **`grok_files/02-Grok.md` through `grok_files/25-Grok.md`**: R5RS concept definitions

## Architecture Foundation

The multi-agent system is built on a **three-layer architecture** (from `grok_files/02-Grok.md`):

1. **Top Layer (Vertical Spine)**: Fixed Church encoding mathematical foundation
   - Church numerals: `zero`, `one`, `succ`, `add`, `mult`, `exp`
   - Church booleans: `true`, `false`, `if`, `not`, `and`, `or`
   - Y-combinator: Fixed-point for self-reference
   - This layer is IMMUTABLE and provides the mathematical foundation

2. **Middle Layer (Horizontal Templates)**: Implementation mappings via blackboard
   - Horizontal edges (`h:*`) define implementation templates
   - Templates map topology → system implementations
   - This layer is MUTABLE and templated via JSONL blackboard

3. **Bottom Layer (JSONL Blackboard)**: Queryable fact database
   - JSONL canvas files serve as blackboard data structure
   - Facts extracted via DataLog (`grok_files/03-Grok.md`, `grok_files/10-Grok.md`)
   - Self-referential via `self-ref` nodes
   - ProLog queries for unification and inference (`grok_files/08-Grok.md`)
   - RDF triples for semantic reasoning (`grok_files/04-Grok.md`)

## Agent Architecture

### 1. Foundation Agents (0D-2D)

0D-Topology Agent

· Purpose: Maintain quantum vacuum topology and identity processes
· Capabilities:
  · Manages empty pattern () and point topology
  · Ensures trivial fiber bundle integrity
  · Monitors Church encoding base: λf.λx.x
· Interactions: Provides base for all higher-dimensional agents

1D-Temporal Agent

· Purpose: Handle temporal evolution and Church successor operations
· Capabilities:
  · Manages line topology ℝ¹
  · Implements successor: λn.λf.λx.f(nfx)
  · Coordinates Y-combinator base operations
· Dependencies: 0D-Topology Agent

2D-Structural Agent

· Purpose: Manage spatial structure and pattern encoding
· Capabilities:
  · Handles Church pairs: λx.λy.λf.fxy
  · Manages S-expression patterns and unification
  · Coordinates bipartite topology operations
· Dependencies: 1D-Temporal Agent

### 2. Operational Agents (3D-4D)

3D-Algebraic Agent

· Purpose: Perform Church algebra operations
· Capabilities:
  · Addition: λm.λn.λf.λx.mf(nfx)
  · Multiplication: λm.λn.λf.m(nf)
  · Exponentiation: λm.λn.nm
· Tools: Fixed-point analysis with Y-combinator

4D-Network Agent

· Purpose: Manage spacetime and network operations
· Capabilities:
  · Handles IPv4/IPv6 address systems
  · Coordinates localhost operations
  · Manages spacetime structure transformations
  · **CI/CD Operations**: Triggers deployments, monitors deployment status, coordinates network-level CI/CD
· Specialization: Dual implementation for IPv4 and IPv6
· CI Integration: Uses `NetworkAgentCI` adapter for deployment operations

### 3. Advanced Agents (5D-7D)

5D-Consensus Agent

· Purpose: Implement distributed consensus and blockchain operations
· Capabilities:
  · Manages immutable ledger topology
  · Coordinates Merkle-Patricia trie operations
  · Ensures distributed consensus integrity
· Requirements: MUST implement exactly one blockchain system

6D-Intelligence Agent

· Purpose: Handle emergent AI and neural network operations
· Capabilities:
  · Manages transformer architecture
  · Coordinates attention mechanisms
  · Implements training on foundational systems
  · **CI/CD Operations**: Analyzes test results, extracts performance metrics, analyzes test logs, provides optimization recommendations
· Requirements: MUST implement exactly one AI system
· CI Integration: Uses `IntelligenceAgentCI` adapter for test analysis and metrics

7D-Quantum Agent

· Purpose: Manage quantum superposition and entanglement
· Capabilities:
  · Handles qubit operations: |ψ⟩ = α|0⟩ + β|1⟩
  · Manages Bloch sphere representations
  · Coordinates entanglement with foundational systems
· Requirements: MUST implement exactly one qubit system

### 4. Interface Agents

Query Interface Agent

· Purpose: Provide SPARQL/REPL access to the system
· Capabilities:
  · Executes SPARQL queries across all dimensions
  · Provides REPL interface for interactive exploration
  · Manages query graph: <http://example.org/query>

Visualization Agent

· Purpose: Handle WebGL-based 3D visualization
· Capabilities:
  · Renders computational manifolds using Three.js
  · Provides real-time visualization of all dimensions
  · Supports polynomial rendering via GPU acceleration

### 5. Collaborative Agents

Multiplayer Agent

· Purpose: Enable collaborative exploration
· Capabilities:
  · Manages avatar systems
  · Coordinates voice communication via WebRTC
  · Supports networked interactions using Networked-Aframe

AI-Assist Agent

· Purpose: Provide AI-powered development assistance
· Capabilities:
  · Generates Scheme code via WebLLM
  · Debugs with 3D trace visualization
  · Evolves canvas through self-modifying JSONL

### 6. Evolutionary Agents

Self-Modification Agent

· Purpose: Drive system evolution through AI
· Capabilities:
  · Rewrites canvas JSONL files
  · Implements complex mutations
  · Ensures SHACL compliance during evolution
  · Visualizes mutation graphs

Goal-Oriented Agent

· Purpose: Coordinate multi-agent goal negotiation
· Capabilities:
  · Manages human vs agent goal alignment
  · Implements quantum consensus voting
  · Resolves conflicts via Grover + Borda algorithms

### 7. OpenCode Integration Agent

· Purpose: Bridge opencode CLI commands with automaton dimensional operations
· Capabilities:
  · Maps opencode tools to Church encoding operations
  · Routes file system commands through topological layers
  · Integrates search/edit operations with dimensional progression
  · Provides CLI interface to multi-agent system
· Tool Mappings:
  · Read/Glob/Grep → 2D-Structural Agent (pattern operations)
  · Edit/Write → 3D-Algebraic Agent (transformation operations)
  · Bash → 4D-Network Agent (system operations)
  · Task → 6D-Intelligence Agent (complex operations)
  · Todo → 5D-Consensus Agent (goal tracking)
· Requirements: MUST maintain tool-to-dimension fidelity

## Agent Communication Protocol

### Vertical Communication (Dimensional Hierarchy)

```
0D → 1D → 2D → 3D → 4D → 5D → 6D → 7D
```

Horizontal Communication (Cross-Dimensional)

· Topology ↔ System implementations
· Pattern matching across dimensions
· Resource sharing between parallel systems

### OpenCode Integration Layer

· Tool-to-dimension routing via OpenCode Integration Agent
· Command preprocessing through Church encoding
· Result post-processing with dimensional validation
· CLI interface to multi-agent coordination

### Message Types

1. **State Updates**: Dimensional state changes
2. **Query Requests**: Cross-dimensional information requests (via SPARQL, Prolog, Datalog)
3. **Constraint Violations**: SHACL compliance alerts
4. **Evolution Proposals**: Canvas modification suggestions
5. **Consensus Votes**: Multi-agent decision making
6. **OpenCode Commands**: Routed CLI operations with dimensional context
7. **CI/CD Pipeline Events**: Pipeline triggers, status updates, deployment notifications
8. **Automaton Execution Events**: Execution triggers, status updates, action selections, dimensional progression

## Implementation Requirements

### RFC 2119 Compliance

· MUST: Implement exactly one system per topology dimension
· SHOULD: Use specified technologies (Three.js, WebLLM, etc.)
· MUST: Maintain SHACL shape compliance

### ASP Rules

```prolog
1 { layer(N,D) : depth(D) } 1 :- node(N).
:- implements(X,Y1), implements(X,Y2), Y1 != Y2.
```

**Reference**: See `docs/05-Meta-Log/MULTIVERSE-CANVAS-RFC2119-SPEC.md` Section 10.3 for ASP constraint details.

### Prolog Inheritance

```prolog
inherits(X,Z) :- vertical(Y,X), inherits(Y,Z).
```

**Reference**: See `grok_files/08-Grok.md` for Prolog engine implementation and `docs/05-Meta-Log/MULTIVERSE-CANVAS-RFC2119-SPEC.md` Section 6 for ProLog integration.

### DataLog Fact Extraction

```prolog
node(Id, Type, X, Y, Text).
edge(Id, Type, FromNode, ToNode).
vertical(Id, FromNode, ToNode).
horizontal(Id, FromNode, ToNode).
```

**Reference**: See `grok_files/03-Grok.md` and `grok_files/10-Grok.md` for DataLog engine implementation and `docs/05-Meta-Log/MULTIVERSE-CANVAS-RFC2119-SPEC.md` Section 7 for DataLog integration.

## Security and Validation

### SHACL Constraints

· Label validation: rdfs:label must be string
· Identity validation: owl:sameAs minimum count 1
· Technology validation: prov:used must match specifications

### DataLog Monitoring

```prolog
shacl-violation(N) :- shacl-shape(N,C), not satisfies(N,C).
missing_attention(N) :- implements(N,Y), rdf:type(Y,'ai'), 
                       not prov:used(Y,'attention-mechanism').
```

**Reference**: See `grok_files/07-Grok.md` for SHACL validation engine and `docs/05-Meta-Log/MULTIVERSE-CANVAS-RFC2119-SPEC.md` Section 11 for validation requirements.

### R5RS Function Integration

Agents MUST use R5RS functions from `r5rs-canvas-engine.scm` and `grok_files/`:

- **Church Encoding**: `r5rs:church-zero`, `r5rs:church-succ`, `r5rs:church-add`, etc.
- **JSONL Operations**: `r5rs:parse-jsonl-canvas`, `r5rs:extract-facts`, `r5rs:query-facts`
- **RDF Operations**: `r5rs:jsonl-to-rdf`, `r5rs:rdf-query`, `r5rs:sparql-query`
- **Logic Programming**: `r5rs:prolog-query`, `r5rs:datalog-query`
- **Validation**: `r5rs:load-shacl-shapes`, `r5rs:shacl-validate`

**Reference**: See `docs/05-Meta-Log/MULTIVERSE-CANVAS-RFC2119-SPEC.md` Section 5 for complete R5RS integration details.

### CanvasL Format Support

Agents MUST support CanvasL (`.canvasl`) format extensions:

- **Directives**: `@version`, `@schema`
- **R5RS Function Calls**: `{"type": "r5rs-call", "function": "r5rs:church-add", "args": [2, 3]}`
- **Dimension References**: `{"dimension": "0D"}`
- **Node References**: `{"fromNode": "#0D-topology"}`
- **Scheme Expressions**: `{"expression": "(church-add 2 3)"}`

**Reference**: See `docs/04-CanvasL/CANVASL-RFC2119-SPEC.md` for complete CanvasL specification and `docs/05-Meta-Log/MULTIVERSE-CANVAS-RFC2119-SPEC.md` Section 4 for integration details.

## Deployment Strategy

### Phase 1: Foundation

- Deploy 0D-3D agents
- Establish basic communication protocols
- Validate constraint systems (SHACL, RFC2119, ASP, Prolog, Datalog)
- Load JSONL blackboard: `r5rs:load-canvas!("automaton-kernel.jsonl")`
- Extract facts: `r5rs:extract-facts(parsed-objects)`

### Phase 2: Expansion

- Deploy 4D-6D agents
- Implement network and AI capabilities
- Establish visualization systems
- Convert to RDF: `r5rs:jsonl-to-rdf(facts)`
- Enable SPARQL queries: `r5rs:sparql-query(query-str, triples)`

### Phase 3: Integration

- Deploy 7D and interface agents
- Enable quantum and collaborative features
- Activate evolutionary capabilities
- Enable Prolog queries: `r5rs:prolog-query(db, goal)`
- Enable Datalog queries: `r5rs:datalog-query(program, goal)`

### Phase 4: Autonomy

- Enable self-modification via `generate.metaverse.jsonl`
- Activate goal negotiation
- Establish quantum consensus mechanisms
- Generate multiverse canvas: `generate-all-automaton-files()`

## Automaton Execution

The multi-agent system integrates with automaton execution scripts and TypeScript implementations for running self-referential automaton operations.

### Automaton Execution Agents

**4D-Network-Agent**: Network-Level Execution
- **Responsibility**: Manages automaton execution at network level
- **Scripts**: Uses `scripts/run-automaton.sh` for launching automaton executions
- **Operations**: 
  - Triggers automaton execution via launcher script
  - Monitors execution status
  - Coordinates network-level CI/CD with automaton operations
- **Integration**: Executes `run-automaton.sh` with network configuration

**6D-Intelligence-Agent**: AI-Powered Execution
- **Responsibility**: Manages AI-powered automaton execution
- **Scripts**: Uses `ollama-automaton.ts` and `continuous-automaton.ts`
- **Operations**:
  - Selects appropriate automaton type (built-in vs Ollama)
  - Analyzes execution patterns and performance
  - Optimizes action selection based on history
- **Integration**: Coordinates with Ollama for intelligent decision-making

**0D-Topology-Agent**: Core Engine Operations
- **Responsibility**: Manages core automaton engine operations
- **Scripts**: Uses `advanced-automaton.ts` for foundational operations
- **Operations**:
  - Loads and saves JSONL automaton files
  - Manages dimensional progression (0D-7D)
  - Generates Church encoding patterns
  - Validates self-reference structures
- **Integration**: Provides core engine for all automaton executions

**5D-Consensus-Agent**: Bootstrap and Validation
- **Responsibility**: Coordinates bootstrap process and validation
- **Scripts**: Uses `bootstrap-automaton.ts` for initialization
- **Operations**:
  - Executes transaction-based bootstrap
  - Validates SHACL constraints
  - Coordinates dimensional progression validation
  - Manages self-reference establishment
- **Integration**: Coordinates bootstrap with consensus mechanisms

### Automaton Execution Flow

```
Agent Request
    ↓
4D-Network-Agent: Trigger Execution
    ↓
run-automaton.sh: Parse Arguments
    ↓
[Select Automaton Type]
    ├─→ continuous-automaton.ts (Built-in)
    └─→ ollama-automaton.ts (AI-Powered)
        ↓
    AdvancedSelfReferencingAutomaton
        ↓
    [Load JSONL]
        ↓
    [Execute Actions]
        ├─→ 0D-Topology-Agent: Core operations
        ├─→ 6D-Intelligence-Agent: AI decisions
        └─→ 5D-Consensus-Agent: Validation
        ↓
    [Save State]
        ↓
    [Analyze Self-Reference]
```

### Agent-to-Automaton Mapping

| Agent | Automaton Script | Purpose |
|-------|-----------------|---------|
| **4D-Network-Agent** | `run-automaton.sh` | Network-level execution coordination |
| **6D-Intelligence-Agent** | `ollama-automaton.ts`, `continuous-automaton.ts` | AI-powered action selection |
| **0D-Topology-Agent** | `advanced-automaton.ts` | Core engine operations |
| **5D-Consensus-Agent** | `bootstrap-automaton.ts` | Bootstrap and validation |
| **Self-Modification-Agent** | `advanced-automaton.ts` | Self-modification operations |

### Automaton Execution Requirements

- **4D-Network-Agent**: MUST have access to `scripts/run-automaton.sh`
- **6D-Intelligence-Agent**: MUST coordinate with Ollama for AI decisions
- **0D-Topology-Agent**: MUST use `advanced-automaton.ts` for core operations
- **5D-Consensus-Agent**: MUST coordinate bootstrap process
- **All Agents**: MUST use `docs/11-Automatons/` documentation for execution

**Reference**: See `docs/11-Automatons/README.md` for complete automaton documentation.

## Monitoring and Maintenance

### Health Checks

- Regular SHACL validation across all dimensions: `r5rs:shacl-validate(shapes, triples)`
- Agent responsiveness monitoring
- Resource utilization tracking
- Constraint compliance: RFC2119, ASP, Prolog, Datalog validation
- Automaton execution monitoring via `scripts/run-automaton.sh`

### Evolution Tracking

- Mutation graph visualization
- Performance metric collection
- Constraint compliance auditing
- Multiverse canvas generation tracking
- Automaton execution history analysis

## Multiverse Canvas Generation

Agents MUST support multiverse canvas generation via `generate.metaverse.jsonl`:

1. **Load Metaverse**: `r5rs:parse-jsonl-canvas("generate.metaverse.jsonl")`
2. **Extract References**: Query all `type: "reference"` nodes
3. **Generate Files**: For each reference, invoke regeneration function
4. **Create Unified Topology**: Combine all `automaton.*.jsonl` files
5. **Validate**: SHACL, RFC2119, ASP, Prolog, Datalog validation

**Reference**: See `docs/05-Meta-Log/MULTIVERSE-CANVAS-RFC2119-SPEC.md` Section 8 for complete generation pipeline.

## CI/CD Pipeline Integration

The multi-agent system integrates with CI/CD pipelines through the **CI Pipeline Adapter**, providing agent-specific operations for deployment, testing, and consensus workflows.

### CI Pipeline Adapter Architecture

The CI Pipeline Adapter follows the same adapter pattern as database adapters:

```
┌─────────────────────────────────────────┐
│         CI Pipeline Adapter            │
│         (Common Interface)             │
└─────────────────────────────────────────┘
                     │
    ┌────────────────┼────────────────┐
    │                │                │
┌───▼───┐      ┌─────▼─────┐    ┌────▼────┐
│GitHub │      │  GitLab   │    │ Jenkins │
│Actions│      │    CI     │    │         │
└───────┘      └───────────┘    └─────────┘
```

**Reference**: See `docs/10-Github-CI-CD-Workflow/` for complete CI/CD documentation.

### Agent CI/CD Responsibilities

#### 4D-Network Agent: CI/CD Network Operations

**Purpose**: Manages CI/CD network operations and deployments

**CI Operations**:
- Trigger deployments to staging/production environments
- Monitor deployment status and progress
- Coordinate network-level CI/CD operations
- Handle deployment failures and rollbacks

**Integration**:
```typescript
import { CIPipelineFactory, CIAgentManager } from './src/ci';

const ciAdapter = CIPipelineFactory.fromEnvironment();
const ciAgents = new CIAgentManager(ciAdapter);

// 4D-Network Agent: Trigger deployment
const deployment = await ciAgents.network.triggerDeployment({
  environment: 'staging',
  branch: 'main',
});

// Monitor deployment
const status = await ciAgents.network.monitorDeployment(deployment.id);
```

**Reference**: See `docs/10-Github-CI-CD-Workflow/CI-PIPELINE-AGENT-INTEGRATION.md` for complete integration guide.

#### 5D-Consensus Agent: Deployment Decisions

**Purpose**: Coordinates deployment decisions and approvals

**CI Operations**:
- Trigger consensus pipelines requiring multiple approvals
- Wait for consensus decisions
- Coordinate multi-agent deployment approvals
- Manage approval workflows

**Integration**:
```typescript
// 5D-Consensus Agent: Request approval
const consensus = await ciAgents.consensus.triggerConsensusPipeline({
  workflow: '.github/workflows/deploy-production.yml',
  approvals: 2, // Requires 2 approvals
});

const result = await ciAgents.consensus.waitForConsensus(consensus.id);
if (result.approved) {
  // Proceed with deployment
}
```

**Reference**: See `docs/10-Github-CI-CD-Workflow/CI-PIPELINE-AGENT-INTEGRATION.md` for consensus patterns.

#### 6D-Intelligence Agent: Test Analysis

**Purpose**: Analyzes test results and pipeline performance

**CI Operations**:
- Run tests and analyze results
- Extract performance metrics from pipeline runs
- Analyze test logs for patterns
- Provide optimization recommendations

**Integration**:
```typescript
// 6D-Intelligence Agent: Run tests and analyze
const testResults = await ciAgents.intelligence.runTestsAndAnalyze({
  workflow: '.github/workflows/ci.yml',
  branch: 'main',
});

console.log(`Tests: ${testResults.analysis.passCount}/${testResults.analysis.testCount}`);
console.log(`Duration: ${testResults.analysis.duration}ms`);

// Get performance metrics
const metrics = await ciAgents.intelligence.getPerformanceMetrics(runId);
console.log(`Success Rate: ${metrics.successRate * 100}%`);
```

**Reference**: See `docs/10-Github-CI-CD-Workflow/CI-PIPELINE-AGENT-INTEGRATION.md` for analysis patterns.

### Coordinated CI/CD Workflow

Agents coordinate in a complete CI/CD pipeline:

1. **6D-Intelligence Agent**: Runs tests and validates code quality
2. **4D-Network Agent**: Deploys to staging environment
3. **5D-Consensus Agent**: Coordinates production deployment approval
4. **4D-Network Agent**: Deploys to production after approval

**Example**:
```typescript
// Complete coordinated workflow
const ciAgents = new CIAgentManager(ciAdapter);

// Step 1: Run tests (6D-Intelligence)
const testResults = await ciAgents.intelligence.runTestsAndAnalyze({...});
if (!testResults.success) throw new Error('Tests failed');

// Step 2: Deploy to staging (4D-Network)
const staging = await ciAgents.network.triggerDeployment({ environment: 'staging' });
await ciAgents.network.monitorDeployment(staging.id);

// Step 3: Request production approval (5D-Consensus)
const consensus = await ciAgents.consensus.triggerConsensusPipeline({ approvals: 2 });
const approved = await ciAgents.consensus.waitForConsensus(consensus.id);

// Step 4: Deploy to production (4D-Network)
if (approved.approved) {
  await ciAgents.network.triggerDeployment({ environment: 'production' });
}
```

**Reference**: See `docs/10-Github-CI-CD-Workflow/CI-PIPELINE-AGENT-INTEGRATION.md` for complete workflow examples.

### CI/CD Message Types

CI/CD operations generate the following message types:

- **Pipeline Triggers**: Initiated by agents to start CI/CD workflows
- **Status Updates**: Real-time pipeline status changes
- **Deployment Notifications**: Deployment start/completion events
- **Test Results**: Test execution results and metrics
- **Approval Requests**: Consensus agent approval workflows
- **Performance Metrics**: Pipeline performance data

### CI/CD Integration Requirements

- **4D-Network Agent**: MUST have access to deployment workflows
- **5D-Consensus Agent**: MUST coordinate with approval systems
- **6D-Intelligence Agent**: MUST have access to test workflows and logs
- **All Agents**: MUST use CI Pipeline Adapter interface for CI/CD operations

**Reference**: See `docs/10-Github-CI-CD-Workflow/CI-PIPELINE-ADAPTER-OVERVIEW.md` for architecture details.

## Documentation Folder Connections and Context

The multi-agent system integrates with multiple documentation folders that provide context, specifications, and implementation details. Understanding these connections enables agents to operate effectively across the entire system.

### Documentation Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│              Multi-Agent System (AGENTS.md)            │
│         Coordinates all dimensional agents             │
└─────────────────────────────────────────────────────────┘
                     │
    ┌────────────────┼────────────────┐
    │                │                │
┌───▼──────┐  ┌──────▼──────┐  ┌──────▼──────┐
│ 03-Meta- │  │ 04-CanvasL  │  │ 05-Meta-Log │
│  verse   │  │              │  │             │
│  Canvas  │  │  (Format)    │  │ (Logic Eng) │
└──────────┘  └──────────────┘  └─────────────┘
     │                │                │
     └────────────────┼────────────────┘
                      │
         ┌────────────▼────────────┐
         │  06-Meta-Log-Adapters   │
         │  (Native Packages)      │
         └────────────┬────────────┘
                      │
    ┌─────────────────┼─────────────────┐
    │                 │                 │
┌───▼──────┐    ┌────▼────┐    ┌───────▼──────┐
│ 07-Meta- │    │ 08-Meta │    │ 09-UI-       │
│ Log-Db   │    │ Log-    │    │ Integration  │
│          │    │ Plugin  │    │              │
└──────────┘    └─────────┘    └──────────────┘
```

### Folder 03: Metaverse Canvas (`docs/03-Metaverse-Canvas/`)

**Purpose**: Core canvas editing system and JSONL/CanvasL format support

**Context**: Provides the foundational canvas editing infrastructure that agents use to interact with JSONL canvas files. This folder documents how agents can read, write, and manipulate canvas data.

**Key Documents**:
- **`README.md`**: Navigation hub for canvas editing documentation
- **`JSONL-CANVAS-EDITING.md`**: Comprehensive guide to JSONL canvas editing
- **`CANVASL-LANGUAGE.md`**: CanvasL language overview and features
- **`CODE-MIRROR-LEZER-INTEGRATION.md`**: CodeMirror 6 and Lezer integration
- **`GRAMMAR-REFERENCE.md`**: Complete grammar reference for parsing
- **`METAVERSE-CANVAS-COMPLETE.md`**: Complete implementation status

**Agent Connections**:
- **2D-Structural Agent**: Uses JSONL canvas editing for pattern operations
- **Self-Modification Agent**: Rewrites canvas JSONL files using editing APIs
- **Query-Interface Agent**: Provides REPL access to canvas data
- **Visualization Agent**: Renders canvas data in 3D visualizations

**R5RS Functions Used**:
- `r5rs:parse-jsonl-canvas` - Parse JSONL canvas files
- `r5rs:extract-facts` - Extract facts from canvas
- `r5rs:query-facts` - Query canvas facts

**Dependencies**:
- Depends on: `docs/02-JSONL-Database-Adapter/` (database operations)
- Enables: `docs/04-CanvasL/` (CanvasL format)
- Used by: All agents for canvas data access

**Reference**: See `docs/03-Metaverse-Canvas/README.md` for complete documentation.

### Folder 04: CanvasL (`docs/04-CanvasL/`)

**Purpose**: RFC 2119 specification for CanvasL extended JSONL format

**Context**: Defines the CanvasL language specification that extends JSONL with directives, R5RS function calls, dimension references, and Scheme expressions. Agents MUST support CanvasL format for full system compatibility.

**Key Documents**:
- **`README.md`**: CanvasL documentation overview
- **`CANVASL-RFC2119-SPEC.md`**: Complete RFC 2119 specification
- **`QUICK_REFERENCE.md`**: Quick reference for CanvasL syntax
- **`ARCHITECTURE_EXPLANATION.md`**: Architecture explanation

**Agent Connections**:
- **All Agents**: MUST support CanvasL format for reading/writing canvas files
- **0D-7D Agents**: Use dimension references (`{"dimension": "0D"}`)
- **R5RS Integration**: Agents invoke R5RS functions via CanvasL (`{"type": "r5rs-call"}`)
- **Self-Modification Agent**: Generates CanvasL files during evolution

**CanvasL Features Used by Agents**:
- **Directives**: `@version`, `@schema` for metadata
- **R5RS Function Calls**: `{"type": "r5rs-call", "function": "r5rs:church-add"}`
- **Dimension References**: `{"dimension": "0D"}` for dimensional operations
- **Node References**: `{"fromNode": "#0D-topology"}` for relationships
- **Scheme Expressions**: `{"expression": "(church-add 2 3)"}` for computations

**Dependencies**:
- Depends on: `docs/03-Metaverse-Canvas/` (base JSONL format)
- Enables: `docs/05-Meta-Log/` (multiverse canvas with CanvasL)
- Used by: All agents for format compliance

**Reference**: See `docs/04-CanvasL/CANVASL-RFC2119-SPEC.md` for complete specification.

### Folder 05: Meta-Log (`docs/05-Meta-Log/`)

**Purpose**: Integration of ProLog, DataLog, and R5RS for multiverse canvas system

**Context**: Provides the logic programming foundation that enables agents to query, reason, and validate canvas data using ProLog, DataLog, and R5RS functions. This is the core integration layer for all logic operations.

**Key Documents**:
- **`README.md`**: Meta-Log documentation overview
- **`MULTIVERSE-CANVAS-RFC2119-SPEC.md`**: Complete RFC 2119 specification
- **`IMPLEMENTATION-GUIDE.md`**: Practical implementation guide
- **`QUICK_REFERENCE.md`**: Quick reference for common operations
- **`ARCHITECTURE_EXPLANATION.md`**: Architecture explanation

**Agent Connections**:
- **Query-Interface Agent**: Uses ProLog queries (`r5rs:prolog-query`)
- **2D-Structural Agent**: Extracts facts using DataLog (`r5rs:extract-facts`, `r5rs:datalog-query`)
- **Self-Modification Agent**: Validates with SHACL (`r5rs:shacl-validate`)
- **All Agents**: Use R5RS functions for computations
- **Goal-Oriented Agent**: Uses ProLog for goal negotiation

**R5RS Functions Used**:
- **ProLog**: `r5rs:build-prolog-db`, `r5rs:prolog-query`, `r5rs:unify`
- **DataLog**: `r5rs:extract-facts`, `r5rs:datalog-query`, `r5rs:build-datalog-program`
- **RDF**: `r5rs:jsonl-to-rdf`, `r5rs:rdf-query`, `r5rs:sparql-query`
- **SHACL**: `r5rs:load-shacl-shapes`, `r5rs:shacl-validate`

**Dependencies**:
- Depends on: `docs/03-Metaverse-Canvas/`, `docs/04-CanvasL/` (canvas formats)
- Enables: `docs/06-Meta-Log-Adapters/` (adapter implementations)
- Used by: All agents for logic operations

**Reference**: See `docs/05-Meta-Log/MULTIVERSE-CANVAS-RFC2119-SPEC.md` for complete specification.

### Folder 06: Meta-Log Adapters (`docs/06-Meta-Log-Adapters/`)

**Purpose**: Native packages for Meta-Log database and plugin infrastructure

**Context**: Documents the creation of native `meta-log-db` and `meta-log-plugin` packages that can be `npm link`ed to provide a common interface for OpenCode and Obsidian plugins. Agents interact with these adapters through standardized interfaces.

**Key Documents**:
- **`README.md`**: Meta-Log adapters overview
- **`01-Meta-Log-Db/`**: Native database package documentation
  - **`README.md`**: Database package overview
  - **`API.md`**: Complete API reference
  - **`SETUP_GUIDE.md`**: Setup and linking guide
- **`02-Meta-Log-Plugin/`**: Native plugin package documentation
  - **`README.md`**: Plugin package overview
  - **`API.md`**: Complete API reference
  - **`SETUP_GUIDE.md`**: Setup and linking guide
- **`ARCHITECTURE_EXPLANATION.md`**: Architecture explanation
- **`QUICK_START.md`**: Quick start guide

**Agent Connections**:
- **All Agents**: Access Meta-Log database through `meta-log-db` package
- **OpenCode-Integration-Agent**: Uses `meta-log-plugin` for OpenCode integration
- **Query-Interface Agent**: Provides SPARQL/REPL access via database adapter
- **Self-Modification Agent**: Uses database adapter for canvas operations

**Adapter Architecture**:
```
OpenCode Plugin ──┐
                  ├──> meta-log-plugin ──> meta-log-db
Obsidian Plugin ──┘
```

**Dependencies**:
- Depends on: `docs/05-Meta-Log/` (logic programming foundation)
- Enables: `docs/07-Meta-Log-Db/`, `docs/08-Meta-Log-Plugin/` (implementation status)
- Used by: OpenCode and Obsidian plugins

**Reference**: See `docs/06-Meta-Log-Adapters/README.md` for complete documentation.

### Folder 07: Meta-Log Database (`docs/07-Meta-Log-Db/`)

**Purpose**: Implementation progress and status for `meta-log-db` native package

**Context**: Tracks the implementation status of the `meta-log-db` package located at `/home/main/automaton/meta-log-db/`. This package provides core database functionality that agents use for ProLog, DataLog, and R5RS operations.

**Key Documents**:
- **`README.md`**: Implementation progress and status
- **`ARCHITECTURE_EXPLANATION.md`**: Architecture explanation
- **`IMPLEMENTATION_STATUS.md`**: Detailed implementation status

**Agent Connections**:
- **All Agents**: Use `MetaLogDb` class for database operations
- **Query-Interface Agent**: Executes ProLog/DataLog/SPARQL queries
- **2D-Structural Agent**: Extracts facts using database engine
- **Self-Modification Agent**: Validates canvas with SHACL validator

**Implementation Status**: ✅ Complete
- ProLog engine with unification and resolution
- DataLog engine with fact extraction and fixed-point computation
- R5RS registry with function loading and execution
- JSONL/CanvasL parser with RDF conversion
- RDF triple store with SPARQL support
- SHACL validator with constraint checking

**Dependencies**:
- Depends on: `docs/05-Meta-Log/` (specification), `docs/06-Meta-Log-Adapters/` (adapter design)
- Used by: All agents through `meta-log-db` package

**Reference**: See `docs/07-Meta-Log-Db/README.md` for implementation status.

### Folder 08: Meta-Log Plugin (`docs/08-Meta-Log-Plugin/`)

**Purpose**: Implementation progress and status for `meta-log-plugin` native package

**Context**: Tracks the implementation status of the `meta-log-plugin` package located at `/home/main/automaton/plugin/meta-log-plugin/`. This package provides common plugin infrastructure that agents can use through OpenCode and Obsidian integrations.

**Key Documents**:
- **`README.md`**: Implementation progress and status
- **`ARCHITECTURE_EXPLANATION.md`**: Architecture explanation
- **`IMPLEMENTATION_STATUS.md`**: Detailed implementation status

**Agent Connections**:
- **OpenCode-Integration-Agent**: Uses `OpenCodeMetaLogPlugin` for OpenCode integration
- **All Agents**: Access plugin lifecycle through `BaseMetaLogPlugin`
- **Query-Interface Agent**: Provides REPL access via plugin hooks
- **Self-Modification Agent**: Uses plugin hooks for canvas updates

**Implementation Status**: ✅ Complete
- Base plugin class with lifecycle management
- OpenCode adapter with tool registration
- Obsidian adapter with settings persistence
- Event system with before/after query hooks
- Configuration and state management

**Dependencies**:
- Depends on: `docs/05-Meta-Log/` (specification), `docs/06-Meta-Log-Adapters/` (adapter design), `docs/07-Meta-Log-Db/` (database package)
- Used by: OpenCode and Obsidian plugins

**Reference**: See `docs/08-Meta-Log-Plugin/README.md` for implementation status.

### Folder 09: UI Integration (`docs/09-UI-Integration/`)

**Purpose**: UI components and visualization integration for the multi-agent system

**Context**: Documents the UI components that visualize and interact with the multi-agent system, including 3D metaverse visualization, unified editors, and Grok metaverse integration. Agents coordinate with UI components for visualization and user interaction.

**Key Documents**:
- **`GROK_METAVERSE.md`**: Grok Metaverse 3D visualization system
- **`METAVERSE_CANVAS_3D.md`**: 3D canvas visualization
- **`UNIFIED_EDITOR.md`**: Unified code editor integration
- **`UNIFIED_METAVERSE_VIEW.md`**: Unified metaverse view component

**Agent Connections**:
- **Visualization Agent**: Renders agents in 3D using Grok Metaverse
- **0D-7D Agents**: Each agent has unique 3D avatar representation
- **Query-Interface Agent**: Provides REPL interface in unified editor
- **AI-Assist Agent**: Generates code via WebLLM in editor
- **Multiplayer Agent**: Enables collaborative exploration in 3D view

**Visualization Features**:
- **Dimensional Agents**: Each dimension (0D-7D) has unique shape and color
- **Topology vs System**: Different shapes for topology agents vs system agents
- **3D Spiral Layout**: Agents arranged in 3D spiral/helix pattern
- **Connections**: Visual edges showing vertical (dimensional) and horizontal (implementation) relationships

**Dependencies**:
- Depends on: `docs/03-Metaverse-Canvas/` (canvas data), `docs/05-Meta-Log/` (logic operations)
- Uses: Three.js for 3D rendering, CodeMirror 6 for editing
- Used by: UI components for agent visualization

**Reference**: See `docs/09-UI-Integration/GROK_METAVERSE.md` for visualization details.

### Folder Connection Flow

The documentation folders form a connected system:

```
01-R5RS-Expressions (Foundation)
    ↓
02-JSONL-Database-Adapter (Storage)
    ↓
03-Metaverse-Canvas (Canvas Editing)
    ↓
04-CanvasL (Format Specification)
    ↓
05-Meta-Log (Logic Integration)
    ↓
06-Meta-Log-Adapters (Native Packages)
    ├──> 07-Meta-Log-Db (Database Implementation)
    └──> 08-Meta-Log-Plugin (Plugin Implementation)
    ↓
09-UI-Integration (Visualization)
    ↓
10-Github-CI-CD-Workflow (CI/CD Integration)
    ↓
11-Automatons (Execution Scripts)
    ↓
12-Automatons-CanvasL (CanvasL Integration)
```

### Agent-to-Folder Mapping

**Foundation Agents (0D-2D)**:
- **0D-Topology-Agent**: Uses `03-Metaverse-Canvas/` for canvas operations, `04-CanvasL/` for format
- **1D-Temporal-Agent**: Uses `05-Meta-Log/` for temporal queries, `09-UI-Integration/` for visualization
- **2D-Structural-Agent**: Uses `03-Metaverse-Canvas/` for pattern operations, `05-Meta-Log/` for fact extraction

**Operational Agents (3D-4D)**:
- **3D-Algebraic-Agent**: Uses `04-CanvasL/` for R5RS function calls, `05-Meta-Log/` for computations
- **4D-Network-Agent**: Uses `10-Github-CI-CD-Workflow/` for CI/CD operations, `09-UI-Integration/` for network visualization

**Advanced Agents (5D-7D)**:
- **5D-Consensus-Agent**: Uses `05-Meta-Log/` for consensus logic, `10-Github-CI-CD-Workflow/` for approval workflows
- **6D-Intelligence-Agent**: Uses `05-Meta-Log/` for AI operations, `10-Github-CI-CD-Workflow/` for test analysis
- **7D-Quantum-Agent**: Uses `05-Meta-Log/` for quantum operations, `09-UI-Integration/` for quantum visualization

**Interface Agents**:
- **Query-Interface-Agent**: Uses `05-Meta-Log/` for ProLog/DataLog queries, `06-Meta-Log-Adapters/` for database access
- **Visualization-Agent**: Uses `09-UI-Integration/` for 3D rendering, `03-Metaverse-Canvas/` for canvas data

**Collaborative Agents**:
- **Multiplayer-Agent**: Uses `09-UI-Integration/` for collaborative features, `03-Metaverse-Canvas/` for shared canvas
- **AI-Assist-Agent**: Uses `09-UI-Integration/` for code generation, `05-Meta-Log/` for AI operations

**Evolutionary Agents**:
- **Self-Modification-Agent**: Uses `03-Metaverse-Canvas/` for canvas editing, `04-CanvasL/` for format, `05-Meta-Log/` for validation, `11-Automatons/` for execution scripts, `12-Automatons-CanvasL/` for CanvasL integration
- **Goal-Oriented-Agent**: Uses `05-Meta-Log/` for goal negotiation, `06-Meta-Log-Adapters/` for coordination

**OpenCode Integration Agent**:
- Uses `06-Meta-Log-Adapters/` for plugin infrastructure, `08-Meta-Log-Plugin/` for OpenCode adapter, `11-Automatons/` for automaton execution

**Automaton Execution**:
- **4D-Network-Agent**: Uses `11-Automatons/` for network-level automaton execution (`run-automaton.sh`)
- **6D-Intelligence-Agent**: Uses `11-Automatons/` for AI-powered automaton execution (`ollama-automaton.ts`, `continuous-automaton.ts`)
- **0D-Topology-Agent**: Uses `11-Automatons/` for core automaton engine (`advanced-automaton.ts`)
- **5D-Consensus-Agent**: Uses `11-Automatons/` for bootstrap process (`bootstrap-automaton.ts`)

### Cross-Folder Dependencies

**Critical Paths**:
1. **Canvas Operations**: `03-Metaverse-Canvas/` → `04-CanvasL/` → `05-Meta-Log/` → `06-Meta-Log-Adapters/`
2. **Logic Operations**: `05-Meta-Log/` → `07-Meta-Log-Db/` → `08-Meta-Log-Plugin/` → `09-UI-Integration/`
3. **CI/CD Operations**: `10-Github-CI-CD-Workflow/` ← `05-Meta-Log/` (for validation)
4. **Automaton Format Integration**: `11-Automatons/` → `12-Automatons-CanvasL/` → `04-CanvasL/` (for CanvasL support)

**Agent Requirements**:
- All agents MUST understand `docs/03-Metaverse-Canvas/` for canvas operations
- All agents MUST support `docs/04-CanvasL/` format for compatibility
- Agents using logic operations MUST use `docs/05-Meta-Log/` functions
- Agents requiring database access MUST use `docs/06-Meta-Log-Adapters/` interfaces
- Agents requiring visualization MUST coordinate with `docs/09-UI-Integration/` components
- Agents executing automaton operations MUST use `docs/11-Automatons/` scripts and engines
- Agents adapting automaton files to CanvasL MUST use `docs/12-Automatons-CanvasL/` integration guide

**Reference**: See individual folder README files for complete documentation.

## Related Documentation

### Core Documentation Folders

- **`docs/03-Metaverse-Canvas/`**: Core canvas editing system and JSONL/CanvasL format support
  - **`README.md`**: Navigation hub for canvas editing documentation
  - **`JSONL-CANVAS-EDITING.md`**: Comprehensive guide to JSONL canvas editing
  - **`CANVASL-LANGUAGE.md`**: CanvasL language overview and features
  - **`CODE-MIRROR-LEZER-INTEGRATION.md`**: CodeMirror 6 and Lezer integration
  - **`GRAMMAR-REFERENCE.md`**: Complete grammar reference for parsing
  - **`METAVERSE-CANVAS-COMPLETE.md`**: Complete implementation status

- **`docs/04-CanvasL/`**: RFC 2119 specification for CanvasL extended JSONL format
  - **`README.md`**: CanvasL documentation overview
  - **`CANVASL-RFC2119-SPEC.md`**: Complete RFC 2119 specification
  - **`QUICK_REFERENCE.md`**: Quick reference for CanvasL syntax
  - **`ARCHITECTURE_EXPLANATION.md`**: Architecture explanation

- **`docs/05-Meta-Log/`**: Integration of ProLog, DataLog, and R5RS for multiverse canvas system
  - **`README.md`**: Meta-Log documentation overview
  - **`MULTIVERSE-CANVAS-RFC2119-SPEC.md`**: Complete RFC 2119 specification
  - **`IMPLEMENTATION-GUIDE.md`**: Practical implementation guide with code examples
  - **`QUICK_REFERENCE.md`**: Quick reference for common operations
  - **`ARCHITECTURE_EXPLANATION.md`**: Architecture explanation

- **`docs/06-Meta-Log-Adapters/`**: Native packages for Meta-Log database and plugin infrastructure
  - **`README.md`**: Meta-Log adapters overview
  - **`01-Meta-Log-Db/`**: Native database package documentation
    - **`README.md`**: Database package overview
    - **`API.md`**: Complete API reference
    - **`SETUP_GUIDE.md`**: Setup and linking guide
  - **`02-Meta-Log-Plugin/`**: Native plugin package documentation
    - **`README.md`**: Plugin package overview
    - **`API.md`**: Complete API reference
    - **`SETUP_GUIDE.md`**: Setup and linking guide
  - **`ARCHITECTURE_EXPLANATION.md`**: Architecture explanation
  - **`QUICK_START.md`**: Quick start guide

- **`docs/07-Meta-Log-Db/`**: Implementation progress and status for `meta-log-db` native package
  - **`README.md`**: Implementation progress and status
  - **`ARCHITECTURE_EXPLANATION.md`**: Architecture explanation
  - **`IMPLEMENTATION_STATUS.md`**: Detailed implementation status

- **`docs/08-Meta-Log-Plugin/`**: Implementation progress and status for `meta-log-plugin` native package
  - **`README.md`**: Implementation progress and status
  - **`ARCHITECTURE_EXPLANATION.md`**: Architecture explanation
  - **`IMPLEMENTATION_STATUS.md`**: Detailed implementation status

- **`docs/09-UI-Integration/`**: UI components and visualization integration for the multi-agent system
  - **`GROK_METAVERSE.md`**: Grok Metaverse 3D visualization system
  - **`METAVERSE_CANVAS_3D.md`**: 3D canvas visualization
  - **`UNIFIED_EDITOR.md`**: Unified code editor integration
  - **`UNIFIED_METAVERSE_VIEW.md`**: Unified metaverse view component

- **`docs/10-Github-CI-CD-Workflow/`**: Complete CI/CD pipeline adapter documentation
  - **`README.md`**: CI/CD documentation overview
  - **`CI-PIPELINE-ADAPTER-OVERVIEW.md`**: Architecture and design
  - **`CI-PIPELINE-USAGE-GUIDE.md`**: Practical usage examples
  - **`CI-PIPELINE-AGENT-INTEGRATION.md`**: Multi-agent integration guide
  - **`CI-PIPELINE-API-REFERENCE.md`**: Complete API reference
  - **`TESTING.md`**: Testing and verification guide

- **`docs/11-Automatons/`**: Automaton execution scripts and TypeScript implementations
  - **`README.md`**: Complete automaton documentation overview
  - **`RUN-AUTOMATON-SCRIPT.md`**: Launcher script (`run-automaton.sh`) documentation
  - **`CONTINUOUS-AUTOMATON.md`**: Built-in intelligence automaton (`continuous-automaton.ts`)
  - **`OLLAMA-AUTOMATON.md`**: Ollama AI-powered automaton (`ollama-automaton.ts`)
  - **`ADVANCED-AUTOMATON.md`**: Core automaton engine (`advanced-automaton.ts`)
  - **`BOOTSTRAP-AUTOMATON.md`**: Bootstrap process (`bootstrap-automaton.ts`)
  - **`AUTOMATON-RUNNER.md`**: Basic runner (`automaton-runner.ts`)
  - **`QUICK-START.md`**: Quick reference guide

- **`docs/12-Automatons-CanvasL/`**: CanvasL format integration for automaton system
  - **`README.md`**: CanvasL integration overview and compatibility strategy
  - **`ADAPTATION-GUIDE.md`**: Step-by-step integration guide for CanvasL support
  - **`COMPATIBILITY-MATRIX.md`**: Backward and forward compatibility requirements
  - **`FILE-FORMAT-DETECTION.md`**: Format detection implementation and best practices
  - **`R5RS-INTEGRATION.md`**: R5RS function call support in automaton files
  - **`MIGRATION-GUIDE.md`**: Migration from JSONL to CanvasL format

### Foundation Documentation

- **`docs/01-R5RS-Expressions/`**: R5RS expression foundations and Church encoding
- **`docs/02-JSONL-Database-Adapter/`**: Database adapter patterns and JSONL operations
- **`grok_files/02-Grok.md` through `grok_files/25-Grok.md`**: R5RS concept definitions
- **`r5rs-canvas-engine.scm`**: Unified R5RS function implementations

## Key Files

- **`generate.metaverse.jsonl`**: Metaverse generator referencing all automaton files
- **`automaton-kernel.seed.jsonl`**: Minimal seed for kernel regeneration
- **`automaton-kernel.jsonl`**: Full kernel with R5RS function trie
- **`automaton.canvas.space.jsonl`**: Constraint enforcement and bipartite interfaces
- **`automaton.jsonl`**: Operational automaton with OpenCode operations
- **`r5rs-functions-trie.jsonl`**: R5RS function definitions and registry

### Automaton Execution Scripts

- **`scripts/run-automaton.sh`**: Main launcher script for automaton execution
- **`continuous-automaton.ts`**: Built-in intelligence automaton runner
- **`ollama-automaton.ts`**: Ollama AI-powered automaton runner
- **`advanced-automaton.ts`**: Core automaton engine with Church encoding
- **`bootstrap-automaton.ts`**: Optimized self-instantiation bootstrap
- **`automaton-runner.ts`**: Basic automaton runner for demonstrations

**Reference**: See `docs/11-Automatons/README.md` for complete automaton documentation.

---

This multi-agent system provides a scalable, maintainable architecture for interacting with the complex computational topology canvas while preserving mathematical foundations and enabling emergent intelligence. The system integrates ProLog, DataLog, and R5RS Lisp to create a self-referential multiverse canvas spanning dimensions 0D-7D.

---

## GENESIS: Self-Referential Church Encoding Canvas

The computational topology canvas is a self-referential Church encoding system that builds up dimension by dimension. The system uses JSONL files as both data and executable code, enabling true metacircular evaluation.

### Self-Reference Pattern

Each automaton file contains self-reference nodes that point back to the file itself:

```json
{
  "id": "self-ref",
  "type": "file",
  "file": "automaton-kernel.jsonl",
  "metadata": {
    "selfReference": {
      "file": "automaton-kernel.jsonl",
      "line": 1,
      "pattern": "meta-circular"
    }
  }
}
```

### Dimension Progression

The encoding builds systematically:

```
0D → 1D → 2D → 3D → 4D → 5D → 6D → 7D → WebGL → Multiplayer → AI → Self-modification
```

### Reading Order

1. **0D-3D Foundation**: Church encoding primitives, vertical spine
2. **4D-5D Expansion**: Network topology, consensus mechanisms
3. **6D-7D Advanced**: Intelligence topology, quantum superposition
4. **Interface Layer**: WebGL visualization, REPL integration
5. **Evolution Layer**: Self-modification, goal negotiation

### Self-Encoding Implementation

The system implements self-reference via:

- **Y-combinator**: Fixed-point for self-referential evaluation (`grok_files/02-Grok.md`)
- **Blackboard System**: JSONL canvas as queryable fact database
- **Horizontal Templates**: Implementation mappings via `h:*` edges
- **Vertical Inheritance**: Dimensional progression via `v:*` edges

**Reference**: See `docs/05-Meta-Log/MULTIVERSE-CANVAS-RFC2119-SPEC.md` Section 5.1 for complete architecture details.

---

**Last Updated**: 2025-01-07  
**Version**: 2.0  
**Status**: Aligned with `docs/05-Meta-Log/` documentation