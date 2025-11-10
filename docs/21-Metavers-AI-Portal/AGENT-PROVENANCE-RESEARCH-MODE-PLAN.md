# Agent Provenance Research Mode: Complete Implementation Plan

## Executive Summary

This plan outlines the implementation of a **Research Mode** system that enables users to explore agent evolution histories, document/code consumption/production, and provenance chains through an **Offscreen Canvas** visualization integrated with the unified collaborative world. The system leverages CanvasL, Prolog/Datalog queries, and federated provenance tracking to create a comprehensive agent knowledge exploration interface.

## Table of Contents

1. [Architecture Overview](#1-architecture-overview)
2. [Offscreen Canvas Integration](#2-offscreen-canvas-integration)
3. [Provenance Chain Tracking](#3-provenance-chain-tracking)
4. [Agent History Logging](#4-agent-history-logging)
5. [Research Mode UI](#5-research-mode-ui)
6. [Query System Integration](#6-query-system-integration)
7. [Federated Logging Model](#7-federated-logging-model)
8. [Implementation Phases](#8-implementation-phases)
9. [Technical Specifications](#9-technical-specifications)
10. [API Design](#10-api-design)

---

## 1. Architecture Overview

### 1.1 System Components

```
┌─────────────────────────────────────────────────────────────┐
│         Unified Collaborative World (Main Canvas)          │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Agent Avatars (GLTF) + Abstract View Elements       │  │
│  │  - Particles, Qubits, Dimension Nodes               │  │
│  │  - Movement Controls                                 │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                          │
                          │ Toggle Research Mode
                          ▼
┌─────────────────────────────────────────────────────────────┐
│         Offscreen Canvas (Provenance Visualization)        │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  CanvasL 3D Provenance Chain                         │  │
│  │  - Agent Evolution Timeline                          │  │
│  │  - Document/Code Consumption/Production            │  │
│  │  - Cross-Agent References                            │  │
│  │  - Meta-Log Query Results                            │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                          │
                          │ Query via Prolog/Datalog/SPARQL
                          ▼
┌─────────────────────────────────────────────────────────────┐
│         Federated Logging System                           │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Agent History Database                              │  │
│  │  - CanvasL Logs (per agent)                          │  │
│  │  - Document Consumption Logs                        │  │
│  │  - Code Production Logs                              │  │
│  │  - Interaction Logs                                  │  │
│  │  - Evolution Snapshots                               │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

### 1.2 Data Flow

1. **Agent Actions** → Logged to federated CanvasL files
2. **Provenance Tracking** → Embedded in CanvasL entries via `selfReference`
3. **Query System** → Prolog/Datalog queries extract relationships
4. **Offscreen Canvas** → Renders provenance chain in 3D
5. **Research Mode UI** → Provides search/filter/explore interface

---

## 2. Offscreen Canvas Integration

### 2.1 Offscreen Canvas Architecture

**Purpose**: Render CanvasL 3D provenance visualization without blocking main canvas

**Technology**: 
- WebGL OffscreenCanvas API
- Three.js OffscreenCanvasRenderer
- Shared ArrayBuffer for data transfer

**Location**: `ui/src/components/UnifiedMetaverseView/components/ProvenanceOffscreenCanvas.tsx`

### 2.2 Implementation Details

```typescript
interface ProvenanceOffscreenCanvasProps {
  agentId: string;
  canvasLFile: string;
  query?: {
    type: 'prolog' | 'datalog' | 'sparql';
    query: string;
  };
  filters?: {
    timeRange?: [number, number];
    documentTypes?: string[];
    codeTypes?: string[];
    interactionTypes?: string[];
  };
  onNodeSelect?: (node: ProvenanceNode) => void;
  onEdgeSelect?: (edge: ProvenanceEdge) => void;
}

interface ProvenanceNode {
  id: string;
  type: 'agent' | 'document' | 'code' | 'interaction' | 'evolution';
  position: [number, number, number];
  metadata: {
    timestamp: number;
    file: string;
    line: number;
    agentId: string;
    dimension: string;
    churchEncoding?: string;
  };
  data: any; // Document content, code snippet, etc.
}

interface ProvenanceEdge {
  id: string;
  type: 'consumes' | 'produces' | 'references' | 'evolves' | 'interacts';
  from: string;
  to: string;
  metadata: {
    timestamp: number;
    weight: number; // Interaction strength
    context: string;
  };
}
```

### 2.3 Offscreen Canvas Worker

**Location**: `ui/src/workers/provenance-canvas-worker.ts`

**Responsibilities**:
- Load CanvasL files
- Execute Prolog/Datalog queries
- Build provenance graph
- Render 3D visualization
- Handle user interactions (clicks, hovers)

**Communication**: Message passing with main thread

```typescript
// Worker messages
interface WorkerMessage {
  type: 'load' | 'query' | 'render' | 'interact';
  payload: any;
}

// Main thread → Worker
postMessage({
  type: 'load',
  payload: { agentId: 'agent-6D', canvasLFile: 'agent-6D-history.canvasl' }
});

// Worker → Main thread
onmessage = (event) => {
  const { type, payload } = event.data;
  if (type === 'provenance-graph') {
    // Update UI with provenance graph
  }
};
```

---

## 3. Provenance Chain Tracking

### 3.1 Provenance Data Structure

Each agent action logs provenance information:

```json
{
  "id": "agent-6D-action-12345",
  "type": "document-consumption",
  "agentId": "agent-6D",
  "timestamp": 1704672000000,
  "action": "read",
  "target": {
    "type": "document",
    "file": "docs/05-Meta-Log/MULTIVERSE-CANVAS-RFC2119-SPEC.md",
    "line": 150,
    "section": "Section 5.2: R5RS Integration"
  },
  "provenance": {
    "selfReference": {
      "file": "agent-6D-history.canvasl",
      "line": 12345,
      "pattern": "document-consumption"
    },
    "wasDerivedFrom": [
      {
        "file": "docs/05-Meta-Log/MULTIVERSE-CANVAS-RFC2119-SPEC.md",
        "line": 150,
        "agent": "agent-6D",
        "timestamp": 1704672000000
      }
    ],
    "produced": [
      {
        "type": "knowledge",
        "fact": "r5rs:church-add is used for Church addition",
        "confidence": 0.95
      }
    ]
  },
  "metadata": {
    "dimension": "6D",
    "churchEncoding": "λm.λn.λf.λx.mf(nfx)",
    "interactionRange": "agentic"
  }
}
```

### 3.2 Provenance Chain Types

1. **Document Consumption Chain**
   - Agent reads document → Extracts facts → Stores in knowledge base
   - Chain: `agent → reads → document → extracts → fact → stores → knowledge-base`

2. **Code Production Chain**
   - Agent generates code → Validates → Commits → References
   - Chain: `agent → generates → code → validates → commits → references → other-agents`

3. **Evolution Chain**
   - Agent evolves → Changes dimension → Updates state → Logs snapshot
   - Chain: `agent → evolves → dimension-change → state-update → snapshot → history`

4. **Interaction Chain**
   - Agent A interacts with Agent B → Shares knowledge → Updates both states
   - Chain: `agent-A → interacts → agent-B → shares → knowledge → updates → both-states`

### 3.3 Provenance Query Patterns

**Prolog Queries**:
```prolog
% Find all documents consumed by agent
consumes(Agent, Document, Timestamp) :-
  agent_action(Agent, 'document-consumption', Document, Timestamp).

% Find evolution chain
evolves(Agent, FromDim, ToDim, Timestamp) :-
  agent_action(Agent, 'evolution', Evolution, Timestamp),
  evolution_from(Evolution, FromDim),
  evolution_to(Evolution, ToDim).

% Find code production chain
produces_code(Agent, Code, Timestamp) :-
  agent_action(Agent, 'code-production', Code, Timestamp).
```

**DataLog Queries**:
```prolog
% Document consumption facts
consumes(Agent, Document, Timestamp).

% Code production facts
produces(Agent, Code, Timestamp).

% Evolution facts
evolves(Agent, FromDim, ToDim, Timestamp).

% Interaction facts
interacts(Agent1, Agent2, Type, Timestamp).
```

**SPARQL Queries**:
```sparql
# Find all provenance chains for agent
PREFIX prov: <http://www.w3.org/ns/prov#>
PREFIX agent: <http://example.org/agent#>

SELECT ?action ?target ?timestamp
WHERE {
  ?action prov:wasPerformedBy agent:agent-6D .
  ?action prov:used ?target .
  ?action prov:atTime ?timestamp .
}
ORDER BY ?timestamp
```

---

## 4. Agent History Logging

### 4.1 Federated CanvasL Logging System

**Structure**: Each agent has its own CanvasL history file

**Location Pattern**: `logs/agents/{agentId}/history.canvasl`

**Example**: `logs/agents/agent-6D/history.canvasl`

### 4.2 Log Entry Types

#### 4.2.1 Document Consumption Log

```json
{
  "id": "log-6D-doc-001",
  "type": "document-consumption",
  "timestamp": 1704672000000,
  "agentId": "agent-6D",
  "action": "read",
  "target": {
    "type": "document",
    "file": "docs/05-Meta-Log/MULTIVERSE-CANVAS-RFC2119-SPEC.md",
    "line": 150,
    "section": "Section 5.2"
  },
  "extracted": {
    "facts": ["r5rs:church-add is used for Church addition"],
    "rules": ["MUST use R5RS functions for computations"],
    "functions": ["r5rs:church-add", "r5rs:church-mult"]
  },
  "provenance": {
    "selfReference": {
      "file": "logs/agents/agent-6D/history.canvasl",
      "line": 1
    }
  }
}
```

#### 4.2.2 Code Production Log

```json
{
  "id": "log-6D-code-001",
  "type": "code-production",
  "timestamp": 1704672100000,
  "agentId": "agent-6D",
  "action": "generate",
  "code": {
    "type": "typescript",
    "file": "ui/src/services/agent-intelligence.ts",
    "snippet": "export function churchAdd(m: number, n: number): number { ... }",
    "line": 45
  },
  "references": [
    {
      "type": "document",
      "file": "docs/05-Meta-Log/MULTIVERSE-CANVAS-RFC2119-SPEC.md",
      "line": 150
    }
  ],
  "provenance": {
    "selfReference": {
      "file": "logs/agents/agent-6D/history.canvasl",
      "line": 2
    },
    "wasDerivedFrom": ["log-6D-doc-001"]
  }
}
```

#### 4.2.3 Evolution Log

```json
{
  "id": "log-6D-evolution-001",
  "type": "evolution",
  "timestamp": 1704672200000,
  "agentId": "agent-6D",
  "action": "evolve",
  "evolution": {
    "fromDimension": "5D",
    "toDimension": "6D",
    "changes": {
      "capabilities": ["AI operations", "Neural networks"],
      "churchEncoding": "λf.(λx.f(xx))(λx.f(xx))"
    }
  },
  "snapshot": {
    "state": { /* agent state snapshot */ },
    "memory": 70.08,
    "objects": 418
  },
  "provenance": {
    "selfReference": {
      "file": "logs/agents/agent-6D/history.canvasl",
      "line": 3
    }
  }
}
```

#### 4.2.4 Interaction Log

```json
{
  "id": "log-6D-interaction-001",
  "type": "interaction",
  "timestamp": 1704672300000,
  "agentId": "agent-6D",
  "action": "collaborate",
  "targetAgent": "agent-5D",
  "interaction": {
    "type": "collaborate",
    "shared": {
      "knowledge": ["consensus patterns", "blockchain operations"],
      "code": ["consensus-algorithm.ts"]
    }
  },
  "provenance": {
    "selfReference": {
      "file": "logs/agents/agent-6D/history.canvasl",
      "line": 4
    }
  }
}
```

### 4.3 Logging Service

**Location**: `ui/src/services/agent-history-logging-service.ts`

**Responsibilities**:
- Log agent actions to CanvasL files
- Maintain federated log structure
- Query log history
- Build provenance chains

```typescript
interface AgentHistoryLoggingService {
  logDocumentConsumption(
    agentId: string,
    document: DocumentReference,
    extracted: ExtractedKnowledge
  ): Promise<void>;
  
  logCodeProduction(
    agentId: string,
    code: CodeReference,
    references: Reference[]
  ): Promise<void>;
  
  logEvolution(
    agentId: string,
    evolution: EvolutionData,
    snapshot: AgentSnapshot
  ): Promise<void>;
  
  logInteraction(
    agentId: string,
    targetAgent: string,
    interaction: InteractionData
  ): Promise<void>;
  
  queryHistory(
    agentId: string,
    query: PrologQuery | DatalogQuery | SparqlQuery
  ): Promise<ProvenanceChain>;
  
  getProvenanceChain(
    agentId: string,
    entryId: string
  ): Promise<ProvenanceChain>;
}
```

---

## 5. Research Mode UI

### 5.1 Research Mode Toggle

**Location**: Agent interaction panel in `CollaborativeWorldIntegration.tsx`

**UI Element**: Toggle button when agent is selected

```typescript
{selectedAgentId && (
  <div className="absolute top-4 left-4 bg-gray-900/80 p-4 rounded-lg">
    {/* Existing agent info */}
    
    {/* Research Mode Toggle */}
    <button
      onClick={() => setResearchMode(!researchMode)}
      className="px-3 py-2 bg-purple-600 hover:bg-purple-700 rounded text-sm flex items-center gap-2"
    >
      <Search className="w-4 h-4" />
      {researchMode ? 'Exit Research' : 'Enter Research Mode'}
    </button>
  </div>
)}
```

### 5.2 Research Mode Panel

**Location**: `ui/src/components/UnifiedMetaverseView/components/ResearchModePanel.tsx`

**Features**:
- **Search Bar**: Search through agent history
- **Time Range Filter**: Filter by timestamp
- **Type Filters**: Document, Code, Evolution, Interaction
- **Query Builder**: Build Prolog/Datalog/SPARQL queries
- **Provenance Chain Visualization**: Offscreen canvas display
- **Detail View**: Show selected entry details

```typescript
interface ResearchModePanelProps {
  agentId: string;
  onClose: () => void;
}

const ResearchModePanel: React.FC<ResearchModePanelProps> = ({ agentId, onClose }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [timeRange, setTimeRange] = useState<[number, number] | null>(null);
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const [queryType, setQueryType] = useState<'prolog' | 'datalog' | 'sparql'>('prolog');
  const [customQuery, setCustomQuery] = useState('');
  const [provenanceChain, setProvenanceChain] = useState<ProvenanceChain | null>(null);
  
  return (
    <div className="absolute inset-0 bg-gray-900/95 z-50 flex">
      {/* Left Panel: Search & Filters */}
      <div className="w-80 bg-gray-800 border-r border-gray-700 p-4">
        <h2 className="text-xl font-bold mb-4">Research Mode: {agentId}</h2>
        
        {/* Search */}
        <input
          type="text"
          placeholder="Search agent history..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full px-3 py-2 bg-gray-700 rounded mb-4"
        />
        
        {/* Time Range */}
        <TimeRangeFilter value={timeRange} onChange={setTimeRange} />
        
        {/* Type Filters */}
        <TypeFilters
          selected={selectedTypes}
          onChange={setSelectedTypes}
          types={['document', 'code', 'evolution', 'interaction']}
        />
        
        {/* Query Builder */}
        <QueryBuilder
          queryType={queryType}
          query={customQuery}
          onQueryTypeChange={setQueryType}
          onQueryChange={setCustomQuery}
          onExecute={handleExecuteQuery}
        />
      </div>
      
      {/* Right Panel: Provenance Visualization */}
      <div className="flex-1 relative">
        <ProvenanceOffscreenCanvas
          agentId={agentId}
          canvasLFile={`logs/agents/${agentId}/history.canvasl`}
          query={customQuery ? { type: queryType, query: customQuery } : undefined}
          filters={{
            timeRange,
            documentTypes: selectedTypes.includes('document') ? ['*'] : [],
            codeTypes: selectedTypes.includes('code') ? ['*'] : [],
            interactionTypes: selectedTypes.includes('interaction') ? ['*'] : []
          }}
          onNodeSelect={handleNodeSelect}
          onEdgeSelect={handleEdgeSelect}
        />
        
        {/* Detail View Overlay */}
        {selectedNode && (
          <DetailViewOverlay
            node={selectedNode}
            onClose={() => setSelectedNode(null)}
          />
        )}
      </div>
    </div>
  );
};
```

### 5.3 Detail View Overlay

**Shows**:
- Entry metadata (timestamp, file, line)
- Full content (document section, code snippet)
- Provenance chain (upstream/downstream)
- Related entries
- Query results

---

## 6. Query System Integration

### 6.1 Meta-Log Database Integration

**Location**: `ui/src/services/agent-provenance-query-service.ts`

**Uses**: `meta-log-db` package for Prolog/Datalog/SPARQL queries

```typescript
import { MetaLogDb } from '@meta-log/db';

class AgentProvenanceQueryService {
  private db: MetaLogDb;
  
  constructor() {
    this.db = new MetaLogDb({
      enableProlog: true,
      enableDatalog: true,
      enableRdf: true
    });
  }
  
  async loadAgentHistory(agentId: string): Promise<void> {
    const canvasLFile = `logs/agents/${agentId}/history.canvasl`;
    await this.db.loadCanvas(canvasLFile);
  }
  
  async queryProlog(agentId: string, query: string): Promise<any> {
    await this.loadAgentHistory(agentId);
    return await this.db.prologQuery(query);
  }
  
  async queryDatalog(agentId: string, query: string, program?: any): Promise<any> {
    await this.loadAgentHistory(agentId);
    return await this.db.datalogQuery(query, program);
  }
  
  async querySparql(agentId: string, query: string): Promise<any> {
    await this.loadAgentHistory(agentId);
    return await this.db.sparqlQuery(query);
  }
}
```

### 6.2 Query Templates

**Pre-built queries for common research tasks**:

```typescript
const QUERY_TEMPLATES = {
  // Find all documents consumed by agent
  documentsConsumed: (agentId: string) => `
    consumes(${agentId}, Document, Timestamp).
  `,
  
  // Find all code produced by agent
  codeProduced: (agentId: string) => `
    produces(${agentId}, Code, Timestamp).
  `,
  
  // Find evolution chain
  evolutionChain: (agentId: string) => `
    evolves(${agentId}, FromDim, ToDim, Timestamp).
  `,
  
  // Find interactions with other agents
  interactions: (agentId: string) => `
    interacts(${agentId}, OtherAgent, Type, Timestamp).
  `,
  
  // Find provenance chain for specific entry
  provenanceChain: (entryId: string) => `
    wasDerivedFrom(Entry, Source, Timestamp) :-
      entry(Entry, entryId, ${entryId}),
      provenance(Entry, Source, Timestamp).
  `
};
```

---

## 7. Federated Logging Model

### 7.1 Decentralized Structure

**Each agent maintains its own log file**:
- `logs/agents/agent-0D/history.canvasl`
- `logs/agents/agent-1D/history.canvasl`
- ...
- `logs/agents/agent-7D/history.canvasl`

### 7.2 Cross-Agent References

**When agents interact, they reference each other's logs**:

```json
{
  "id": "log-6D-interaction-001",
  "type": "interaction",
  "targetAgent": "agent-5D",
  "references": [
    {
      "type": "agent-log",
      "file": "logs/agents/agent-5D/history.canvasl",
      "entryId": "log-5D-consensus-001"
    }
  ]
}
```

### 7.3 Unified Query Interface

**Query across all agent logs**:

```typescript
// Query all agents
const allAgents = await queryAllAgents({
  query: 'consumes(Agent, Document, Timestamp).',
  timeRange: [startTime, endTime]
});

// Query specific agent
const agent6D = await queryAgent('agent-6D', {
  query: 'produces(Agent, Code, Timestamp).'
});
```

### 7.4 Collaborative World Integration

**Agent logs are part of the collaborative world**:
- Agents can query each other's histories
- Knowledge propagates through interaction logs
- Evolution patterns emerge from cross-agent analysis

---

## 8. Implementation Phases

### Phase 1: Foundation (Week 1-2)
- [ ] Create agent history logging service
- [ ] Implement CanvasL log file structure
- [ ] Set up federated log directory structure
- [ ] Integrate with Meta-Log database

### Phase 2: Offscreen Canvas (Week 2-3)
- [ ] Create OffscreenCanvas worker
- [ ] Implement 3D provenance visualization
- [ ] Build node/edge rendering system
- [ ] Add interaction handlers

### Phase 3: Research Mode UI (Week 3-4)
- [ ] Create ResearchModePanel component
- [ ] Implement search and filters
- [ ] Build query builder interface
- [ ] Add detail view overlay

### Phase 4: Query Integration (Week 4-5)
- [ ] Integrate Prolog queries
- [ ] Integrate Datalog queries
- [ ] Integrate SPARQL queries
- [ ] Create query templates

### Phase 5: Provenance Chain Building (Week 5-6)
- [ ] Implement provenance chain extraction
- [ ] Build upstream/downstream traversal
- [ ] Visualize chain in 3D
- [ ] Add chain navigation

### Phase 6: Integration & Testing (Week 6-7)
- [ ] Integrate with CollaborativeWorldIntegration
- [ ] Test with real agent histories
- [ ] Performance optimization
- [ ] Documentation

---

## 9. Technical Specifications

### 9.1 File Structure

```
ui/src/
├── components/
│   └── UnifiedMetaverseView/
│       └── components/
│           ├── ProvenanceOffscreenCanvas.tsx
│           ├── ResearchModePanel.tsx
│           └── DetailViewOverlay.tsx
├── services/
│   ├── agent-history-logging-service.ts
│   └── agent-provenance-query-service.ts
└── workers/
    └── provenance-canvas-worker.ts

logs/
└── agents/
    ├── agent-0D/
    │   └── history.canvasl
    ├── agent-1D/
    │   └── history.canvasl
    └── ...
```

### 9.2 Dependencies

- `@react-three/fiber`: 3D rendering
- `@react-three/drei`: 3D helpers
- `three`: WebGL library
- `@meta-log/db`: Meta-Log database
- `canvasl-parser`: CanvasL parsing

### 9.3 Performance Considerations

- **Offscreen Canvas**: Prevents blocking main thread
- **Lazy Loading**: Load agent histories on demand
- **Query Caching**: Cache query results
- **Virtual Scrolling**: For large history lists
- **Level of Detail**: Reduce detail for distant nodes

---

## 10. API Design

### 10.1 Agent History Logging Service API

```typescript
interface AgentHistoryLoggingService {
  // Logging methods
  logDocumentConsumption(
    agentId: string,
    document: DocumentReference,
    extracted: ExtractedKnowledge
  ): Promise<void>;
  
  logCodeProduction(
    agentId: string,
    code: CodeReference,
    references: Reference[]
  ): Promise<void>;
  
  logEvolution(
    agentId: string,
    evolution: EvolutionData,
    snapshot: AgentSnapshot
  ): Promise<void>;
  
  logInteraction(
    agentId: string,
    targetAgent: string,
    interaction: InteractionData
  ): Promise<void>;
  
  // Query methods
  queryHistory(
    agentId: string,
    query: Query,
    options?: QueryOptions
  ): Promise<QueryResult>;
  
  getProvenanceChain(
    agentId: string,
    entryId: string,
    direction?: 'upstream' | 'downstream' | 'both'
  ): Promise<ProvenanceChain>;
  
  // Utility methods
  getAgentLogFile(agentId: string): string;
  getAllAgentIds(): Promise<string[]>;
}
```

### 10.2 Provenance Query Service API

```typescript
interface AgentProvenanceQueryService {
  // Query execution
  queryProlog(agentId: string, query: string): Promise<PrologResult>;
  queryDatalog(agentId: string, query: string, program?: any): Promise<DatalogResult>;
  querySparql(agentId: string, query: string): Promise<SparqlResult>;
  
  // Query building
  buildQuery(template: QueryTemplate, params: Record<string, any>): string;
  
  // History loading
  loadAgentHistory(agentId: string): Promise<void>;
  loadAllAgentHistories(): Promise<void>;
}
```

### 10.3 Offscreen Canvas API

```typescript
interface ProvenanceOffscreenCanvas {
  // Initialization
  initialize(canvas: OffscreenCanvas, options: CanvasOptions): void;
  
  // Data loading
  loadProvenanceChain(chain: ProvenanceChain): void;
  loadQueryResults(results: QueryResult): void;
  
  // Rendering
  render(): void;
  updateCamera(position: Vector3, target: Vector3): void;
  
  // Interaction
  handleClick(x: number, y: number): Node | null;
  handleHover(x: number, y: number): Node | null;
  
  // Cleanup
  dispose(): void;
}
```

---

## Conclusion

This plan provides a comprehensive roadmap for implementing the Agent Provenance Research Mode system. The system will enable users to explore agent evolution histories, document/code consumption/production, and provenance chains through an integrated Offscreen Canvas visualization with full Prolog/Datalog/SPARQL query support.

The federated logging model ensures that each agent maintains its own history while enabling cross-agent queries and knowledge sharing, creating a truly collaborative and decentralized knowledge exploration system.
