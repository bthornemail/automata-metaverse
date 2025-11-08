# Migration Analysis: Obsidian Plugin Files

## Overview
This document identifies critical functionality from Obsidian plugin files that should be incorporated into the main automaton system before deletion.

---

## 🔐 Core Cryptographic & Identity Systems

### 1. **HD Wallet Derivation & Deterministic Addressing** 
**Files**: `identity-mcp.ts`, `shared-secrets.ts`, `manifest-generator.ts`

**Critical Functionality**:
- ✅ BIP32/BIP39 HD wallet derivation with custom paths
- ✅ Deterministic address generation from harmonic vectors
- ✅ Standard derivation path patterns (`m/0'`, `m/1'`, `m/2'`, `m/3'`)
- ✅ Vector-to-path normalization for deterministic addressing

**Preserve As**:
- Core utility functions in `src/shared/crypto/` or `src/services/identity.ts`
- Standard derivation paths should be documented in `AGENTS.md` or architecture docs

**Key Code Patterns**:
```typescript
// Deterministic address from harmonic vector
normalizeVectorToPath(harmonicVector: number[], childIndex: number): number[]
deriveWallet(derivationPath: string): HDNodeWallet
getStandardPaths() // Returns standard HD derivation paths
```

---

### 2. **ECDH Shared Secret Management**
**Files**: `shared-secrets.ts`

**Critical Functionality**:
- ✅ ECDH shared secret computation using ethers SigningKey
- ✅ HKDF key derivation for symmetric encryption
- ✅ AES-GCM encryption/decryption with proper IV and auth tags
- ✅ Bridge address generation for shared subgraphs
- ✅ Shared context creation for collaborative editing

**Preserve As**:
- `src/services/shared-secrets.ts` or `src/shared/crypto/shared-secrets.ts`
- Used by manifest encryption and peer-to-peer sharing

**Key Methods**:
```typescript
computeSharedSecret(authorPrivateKey, peerPublicKey, context)
encryptManifest(manifestStr, peerPublicKey, derivationPath)
decryptManifest(encryptedManifest, peerPrivateKey)
generateBridgeAddress(peerPublicKey, subgraphId, derivationPath)
createSharedContext(peers, contextId, derivationPath)
```

---

## 📋 Merkle-Trie & Manifest System

### 3. **Merkle-Trie Manifest Generation**
**Files**: `manifest-generator.ts`, `merkle-trie-mcp.ts`

**Critical Functionality**:
- ✅ Keccak256 hashing for file content
- ✅ Merkle root computation from hex leaves
- ✅ Manifest catalog generation with file hashes
- ✅ Manifest signing with HD wallet
- ✅ Manifest verification
- ✅ Rumsfeld scores metadata system (KK/KU/UK/UU)

**Preserve As**:
- `src/services/manifest-generator.ts`
- Core functionality for blackboard architecture and epistemic nodes
- Rumsfeld scores align with blackboard metadata tracking

**Key Methods**:
```typescript
buildManifest(subgraphPath?, notes?)
verifyManifest(manifestStr, signature, authorAddress)
generateMetadataTemplate(filePath, title?, author?)
updateRumsfeldScores(metadata, interaction)
```

**Integration Points**:
- Blackboard architecture frontmatter system
- Epistemic node metadata tracking
- Canvas subgraph export

---

### 4. **Metadata Tracking & Analytics**
**Files**: `metadata-tracker.ts`, `obsidian-plugin-integration.ts`

**Critical Functionality**:
- ✅ Node metadata indexing with content hashing
- ✅ Rumsfeld score tracking (Known Knowns, Known Unknowns, Unknown Knowns, Unknown Unknowns)
- ✅ Interaction history tracking
- ✅ Score aggregation from subcomponents
- ✅ Node search by various criteria
- ✅ Analytics report generation

**Preserve As**:
- `src/services/metadata-tracker.ts`
- Integrates with blackboard architecture for epistemic node tracking
- Supports Rumsfeld square interaction model

**Key Methods**:
```typescript
createOrUpdateMetadata(filePath, options)
processInteraction(nodeId, interaction, userId?, comment?)
aggregateScores(nodeId)
searchNodes(criteria)
generateAnalyticsReport()
```

**Integration Points**:
- Blackboard epistemic nodes
- Canvas heatmap visualization
- Knowledge graph analytics

---

## 🎨 Canvas & Subgraph Management

### 5. **Canvas Parsing & Subgraph Export**
**Files**: `obsidian-plugin-integration.ts`, `axiom-canvas-mcp.ts`

**Critical Functionality**:
- ✅ Obsidian canvas JSON parsing
- ✅ File reference extraction from canvas nodes
- ✅ Subgraph export with referenced files
- ✅ Canvas heatmap data generation based on Rumsfeld scores
- ✅ Hypergraph canvas builder (axiom visualization)

**Preserve As**:
- `src/services/canvas-manager.ts` or `src/shared/canvas/`
- Core functionality for Metaverse Canvas integration
- Supports JSONL canvas format used in automaton system

**Key Methods**:
```typescript
parseCanvasFile(canvasPath)
exportCanvasSubgraph(canvasPath, options)
generateCanvasHeatmapData(canvasPath)
aggregateCanvasScores(canvasPath)
```

**Integration Points**:
- `automaton.canvas.space.jsonl` processing
- Metaverse canvas visualization
- CanvasL format support

---

## 🔌 MCP Server Patterns

### 6. **MCP Server Architecture Patterns**
**Files**: `merkle-trie-mcp.ts`, `obsidian-mcp.ts`, `axiom-canvas-mcp.ts`, `identity-mcp.ts`

**Critical Functionality**:
- ✅ MCP server setup with stdio transport
- ✅ Tool registration and request handling patterns
- ✅ Error handling with McpError
- ✅ Initialization patterns for complex services

**Preserve As**:
- Reference patterns in `docs/` or `src/services/mcp/`
- Can be used for future MCP integrations
- Pattern library for OpenCode tool development

**Key Patterns**:
```typescript
// Server initialization
const server = new Server({ name, version }, { capabilities: { tools: {} } })
const transport = new StdioServerTransport()
await server.connect(transport)

// Tool registration
server.setRequestHandler(ListToolsRequestSchema, async () => { ... })
server.setRequestHandler(CallToolRequestSchema, async (request) => { ... })
```

---

## 🧮 Computational & Geometric Systems

### 7. **Harmonic Vector Generation**
**Files**: `axiom-canvas-mcp.ts`

**Critical Functionality**:
- ✅ Harmonic vector generation from data (hypotenuse, sin, cos, tan)
- ✅ Vector normalization for path derivation
- ✅ Computational quantum engine (vector binding)

**Preserve As**:
- `src/shared/math/harmonic-vectors.ts` or utility functions
- Used for deterministic addressing and geometric computations

**Key Methods**:
```typescript
generateHarmonicVector(data: any): number[]
normalizeVectorToPath(harmonicVector: number[], childIndex: number): number[]
harmonize(input: any): number
```

---

### 8. **Patricia Trie for Axiom Storage**
**Files**: `axiom-canvas-mcp.ts`

**Critical Functionality**:
- ✅ Simple Patricia trie implementation for axiom storage
- ✅ Language-based axiom lookup
- ✅ Path-based insertion and retrieval

**Preserve As**:
- `src/shared/data-structures/patricia-trie.ts`
- Can be used for efficient axiom/function lookup in R5RS engine

**Key Methods**:
```typescript
insert(path: string, axiomNode: any)
findByLanguage(language: string): any[]
```

---

## ⚠️ Lower Priority / Can Be Recreated

### 9. **WebAuthn Authentication** 
**Files**: `auth.ts`, `self.auth.ts`, `pipe.ts`

**Status**: ⚠️ Lower Priority
- WebAuthn credential management
- MQTT-based challenge/response
- 3D force graph visualization
- Browser-specific DOM manipulation

**Recommendation**: 
- Keep as reference if WebAuthn integration needed
- Most functionality is browser-specific and not core to automaton system
- MQTT patterns can be recreated if needed

---

### 10. **Express/Net Socket Piping**
**Files**: `pipe.ts`, `transform.server copy.ts`

**Status**: ⚠️ Lower Priority
- Express server with ngrok tunneling
- Net socket data piping
- WebAuthn endpoints

**Recommendation**:
- Can be recreated if needed
- Not core to automaton functionality
- Keep as reference for future networking needs

---

## 📦 Recommended Migration Structure

```
src/
├── shared/
│   ├── crypto/
│   │   ├── hd-wallet.ts          # HD wallet derivation
│   │   ├── shared-secrets.ts     # ECDH + AES-GCM encryption
│   │   └── deterministic-address.ts  # Vector-based addressing
│   ├── math/
│   │   └── harmonic-vectors.ts   # Harmonic vector generation
│   └── data-structures/
│       └── patricia-trie.ts      # Patricia trie for axioms
├── services/
│   ├── manifest-generator.ts     # Merkle-trie manifest system
│   ├── metadata-tracker.ts       # Rumsfeld scores & analytics
│   ├── canvas-manager.ts         # Canvas parsing & export
│   └── identity.ts               # Identity management
└── docs/
    └── MCP_PATTERNS.md           # MCP server reference patterns
```

---

## ✅ Immediate Action Items

1. **Extract Core Cryptographic Functions**
   - [ ] HD wallet derivation utilities
   - [ ] Shared secret management
   - [ ] Deterministic addressing

2. **Migrate Manifest System**
   - [ ] Merkle-trie manifest generation
   - [ ] Manifest signing/verification
   - [ ] Rumsfeld scores integration

3. **Preserve Metadata Tracking**
   - [ ] Metadata tracker with Rumsfeld scores
   - [ ] Analytics report generation
   - [ ] Integration with blackboard architecture

4. **Canvas Management**
   - [ ] Canvas parsing utilities
   - [ ] Subgraph export functionality
   - [ ] Heatmap generation

5. **Document MCP Patterns**
   - [ ] Create reference documentation
   - [ ] Extract reusable patterns

---

## 🔗 Integration with Existing Systems

### Blackboard Architecture
- **Manifest Generator** → Epistemic node metadata
- **Metadata Tracker** → Blackboard status tracking
- **Rumsfeld Scores** → Knowledge state tracking

### R5RS Canvas Engine
- **Patricia Trie** → Function/axiom lookup
- **Harmonic Vectors** → Deterministic function addressing
- **Canvas Parsing** → JSONL canvas processing

### Automaton System
- **HD Wallets** → Deterministic node addressing
- **Shared Secrets** → Peer-to-peer automaton sharing
- **Manifest System** → Automaton state verification

---

## 📝 Notes

- Most WebAuthn/MQTT functionality is browser-specific and not needed for core automaton
- Express/net socket patterns can be recreated if networking features needed
- Focus on cryptographic primitives, manifest system, and metadata tracking
- MCP patterns are valuable for future tool development but not immediately critical

---

**Last Updated**: 2025-01-07  
**Status**: Ready for migration planning
