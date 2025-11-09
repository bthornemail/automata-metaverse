# Universal Life Vault

A comprehensive MCP (Model Context Protocol) server suite integrated with Obsidian for axiomatic programming, identity management, and geometric visualization. This project implements the Universal Life Protocol's principles of axiomatic verification and harmonic vector systems.

## 🚀 Features

### MCP Servers

- **🗂️ Obsidian MCP**: Obsidian URI integration for opening vaults, creating notes, searching, and rendering canvas files
- **🎨 Axiom Canvas MCP**: Geometric axiom canvas system for visual programming with hypergraph structures
- **🔐 Identity MCP**: BIP32-based deterministic wallet and address generation from harmonic vectors

### Obsidian Plugin Integration

- **📊 Universal Life Protocol Dashboard**: Real-time monitoring of MCP servers, MQTT brokers, and RSS feeds
- **🕸️ Hypergraph Visualization**: Interactive canvas generation for P2P networks and Hilbert's axioms
- **⚡ DevOps Integration**: Project management and system monitoring within Obsidian

### Core Technologies

- **Axioms as Nodes**: Each function/lambda is an axiom with unique Ethereum address
- **Harmonic Vectors**: 5-tuple `[h, sin, cos, tan, length]` for data fingerprinting
- **Patricia Trie**: Efficient storage by language/category/name path
- **JSON Canvas**: Compatible with Obsidian Canvas and JSON Canvas spec
- **Proof of Execution**: Cryptographic proofs of function execution paths

## 🛠️ Installation

### Prerequisites

- Node.js 18+ with npm
- TypeScript 5.9+
- Obsidian (for plugin functionality)

### Quick Setup

```bash
# Clone and setup
git clone <repository-url>
cd universal-life-vault
npm run setup
```

This will:
1. Install dependencies
2. Build TypeScript MCP servers
3. Build the Obsidian plugin

## MCP Tools

### `create_axiom`
Create a new axiom node in a canvas.

```json
{
  "canvasId": "my-canvas",
  "x": 100,
  "y": 100, 
  "language": "js",
  "sexp": "(x) => x * 2",
  "args": ["x"]
}
```

### `connect_axioms`
Connect two axiom nodes with an edge.

```json
{
  "canvasId": "my-canvas",
  "fromNodeId": "axiom-123",
  "toNodeId": "axiom-456"
}
```

### `execute_axiom`
Execute an axiom with input data and generate proof.

```json
{
  "canvasId": "my-canvas",
  "nodeId": "axiom-123",
  "inputData": 42
}
```

### `save_canvas` / `load_canvas`
Persist canvas state to/from files.

```json
{
  "canvasId": "my-canvas"
}
```

### `find_axioms_by_language`
Find all axioms for a specific programming language.

```json
{
  "language": "js"
}
```

## Usage Examples

### Basic Axiom Creation

```javascript
// Create a doubling function axiom
const axiom = await mcp.callTool('create_axiom', {
  canvasId: 'math-canvas',
  x: 100, y: 100,
  language: 'js',
  sexp: '(x) => x * 2',
  args: ['x']
});
// Returns: { id, ethAddress, harmonicVector, axiomFunction }
```

### Canvas Composition

```javascript
// Create multiple connected axioms
const add = await mcp.callTool('create_axiom', {
  canvasId: 'pipeline', x: 0, y: 0,
  language: 'js', sexp: '(x) => x + 10'
});

const multiply = await mcp.callTool('create_axiom', {
  canvasId: 'pipeline', x: 300, y: 0,
  language: 'js', sexp: '(x) => x * 2'
});

// Connect them
await mcp.callTool('connect_axioms', {
  canvasId: 'pipeline',
  fromNodeId: add.id,
  toNodeId: multiply.id
});
```

### Execution with Proof

```javascript
// Execute with cryptographic proof
const result = await mcp.callTool('execute_axiom', {
  canvasId: 'pipeline',
  nodeId: add.id,
  inputData: 5
});

console.log(result);
// {
//   result: 15,
//   trace: [12345, 67890], 
//   proof: "abc123def456...",
//   traversalPath: ["axiom-123"]
// }
```

### Language Support

```javascript
// JavaScript
{ language: 'js', sexp: '(x, y) => x + y' }

// Lisp  
{ language: 'lisp', sexp: '(+ x y)' }

// Python (planned)
{ language: 'py', sexp: 'lambda x, y: x + y' }

// Haskell (planned)
{ language: 'haskell', sexp: '\\x y -> x + y' }
```

## Data Structures

### Axiom Node (JSON Canvas Compatible)

```typescript
interface AxiomNode {
  id: string;              // Canvas node ID
  type: 'axiom';           // Canvas node type
  x: number; y: number;    // Position
  width: number; height: number;
  
  ethAddress: EthAddress;       // Identity binding
  harmonicVector: HarmonicTuple;// [h, sin, cos, tan, length]
  axiomFunction: AxiomFunction; // [language, sexp, args]
  
  text?: string;           // Display text
  color?: string;          // Visual color
}
```

### Harmonic Binding

```typescript
interface HarmonicBinding {
  identity: HarmonicTuple;   // From eth address
  data: HarmonicTuple;       // From axiom data  
  bound: number[];           // CQE bind result
  quantum: string;           // Quantum state ID
}
```

## Patricia Trie Paths

Axioms are stored using hierarchical paths:

```
js/math/add          → JavaScript addition function
js/string/reverse    → JavaScript string reversal
lisp/math/factorial  → Lisp factorial function
py/data/filter       → Python filter function
```

## Testing

```bash
npm test
# Runs comprehensive test suite demonstrating all features
```

## Architecture

The system simplifies complex samples into essential components:

1. **Core Functions**: Harmonic vectors, quantum binding, patricia trie
2. **Canvas Manager**: JSON Canvas compatible node/edge management
3. **MCP Server**: Tool interface for external integration
4. **Execution Engine**: Multi-language function execution with proofs

## Integration

Use with:
- **Obsidian Canvas**: Visual function composition
- **Claude Code**: MCP tool integration  
- **Ethereum**: Address-based identity system
- **Quantum Systems**: Harmonic data binding and recovery

---

Built on simplified abstractions from Universal Life Vault samples, focusing on essential functionality over complex interfaces.