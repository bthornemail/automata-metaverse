/**
 * JSONL Canvas Service
 * Parses JSONL into trie structure, builds graph representation, validates entries
 */

export interface JSONLNode {
  id: string;
  type: string;
  x?: number;
  y?: number;
  text?: string;
  file?: string;
  [key: string]: any;
}

export interface JSONLEdge {
  id: string;
  type: 'vertical' | 'horizontal' | 'transition' | 'self-ref';
  from?: string;
  to?: string;
  fromNode?: string;
  toNode?: string;
  label?: string;
  [key: string]: any;
}

export interface CanvasGraph {
  nodes: Map<string, JSONLNode>;
  edges: Map<string, JSONLEdge>;
  nodeList: JSONLNode[];
  edgeList: JSONLEdge[];
}

export interface JSONLCanvasService {
  parseJSONL(content: string): CanvasGraph;
  buildGraph(entries: any[]): CanvasGraph;
  validateEntry(entry: any): { valid: boolean; errors: string[] };
  mergeEntries(existing: any[], updates: any[]): any[];
  exportToJSONL(graph: CanvasGraph): string;
  findNodeById(graph: CanvasGraph, id: string): JSONLNode | null;
  findEdgesByNode(graph: CanvasGraph, nodeId: string): JSONLEdge[];
  addNode(graph: CanvasGraph, node: JSONLNode): CanvasGraph;
  updateNode(graph: CanvasGraph, nodeId: string, updates: Partial<JSONLNode>): CanvasGraph;
  deleteNode(graph: CanvasGraph, nodeId: string): CanvasGraph;
  addEdge(graph: CanvasGraph, edge: JSONLEdge): CanvasGraph;
  deleteEdge(graph: CanvasGraph, edgeId: string): CanvasGraph;
}

class JSONLCanvasServiceImpl implements JSONLCanvasService {
  /**
   * Parse JSONL content into graph structure
   */
  parseJSONL(content: string): CanvasGraph {
    const lines = content.split('\n').filter(l => l.trim());
    const entries: any[] = [];

    for (const line of lines) {
      try {
        const entry = JSON.parse(line);
        entries.push(entry);
      } catch (error) {
        console.warn('Failed to parse JSONL line:', line.substring(0, 100));
      }
    }

    return this.buildGraph(entries);
  }

  /**
   * Build graph from entries
   */
  buildGraph(entries: any[]): CanvasGraph {
    const nodes = new Map<string, JSONLNode>();
    const edges = new Map<string, JSONLEdge>();

    for (const entry of entries) {
      // Validate entry
      const validation = this.validateEntry(entry);
      if (!validation.valid) {
        console.warn('Invalid entry:', validation.errors, entry);
        continue;
      }

      // Determine if it's a node or edge
      if (this.isNode(entry)) {
        const node: JSONLNode = {
          id: entry.id,
          type: entry.type,
          x: entry.x,
          y: entry.y,
          text: entry.text,
          file: entry.file,
          ...entry
        };
        nodes.set(entry.id, node);
      } else if (this.isEdge(entry)) {
        const edge: JSONLEdge = {
          id: entry.id,
          type: entry.type as 'vertical' | 'horizontal' | 'transition' | 'self-ref',
          from: entry.from || entry.fromNode,
          to: entry.to || entry.toNode,
          fromNode: entry.fromNode || entry.from,
          toNode: entry.toNode || entry.to,
          label: entry.label,
          ...entry
        };
        edges.set(entry.id, edge);
      }
    }

    return {
      nodes,
      edges,
      nodeList: Array.from(nodes.values()),
      edgeList: Array.from(edges.values())
    };
  }

  /**
   * Check if entry is a node
   */
  private isNode(entry: any): boolean {
    return entry.id && (
      entry.type === 'text' ||
      entry.type === 'file' ||
      entry.type === 'node' ||
      entry.type === 'automaton' ||
      entry.type === 'shacl' ||
      entry.type === 'rfc2119' ||
      entry.type === 'asp' ||
      (!entry.from && !entry.to && !entry.fromNode && !entry.toNode)
    );
  }

  /**
   * Check if entry is an edge
   */
  private isEdge(entry: any): boolean {
    return entry.id && (
      entry.type === 'vertical' ||
      entry.type === 'horizontal' ||
      entry.type === 'transition' ||
      entry.type === 'self-ref' ||
      (entry.from || entry.to || entry.fromNode || entry.toNode)
    );
  }

  /**
   * Validate JSONL entry
   */
  validateEntry(entry: any): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!entry || typeof entry !== 'object') {
      errors.push('Entry must be an object');
      return { valid: false, errors };
    }

    if (!entry.id || typeof entry.id !== 'string') {
      errors.push('Entry must have a string id');
    }

    if (!entry.type || typeof entry.type !== 'string') {
      errors.push('Entry must have a string type');
    }

    // Node-specific validation
    if (this.isNode(entry)) {
      if (entry.x !== undefined && typeof entry.x !== 'number') {
        errors.push('Node x must be a number');
      }
      if (entry.y !== undefined && typeof entry.y !== 'number') {
        errors.push('Node y must be a number');
      }
    }

    // Edge-specific validation
    if (this.isEdge(entry)) {
      const from = entry.from || entry.fromNode;
      const to = entry.to || entry.toNode;
      
      if (!from && !to) {
        errors.push('Edge must have from/to or fromNode/toNode');
      }
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * Merge entries (update existing, add new)
   */
  mergeEntries(existing: any[], updates: any[]): any[] {
    const existingMap = new Map<string, any>();
    
    // Index existing entries by id
    for (const entry of existing) {
      if (entry.id) {
        existingMap.set(entry.id, entry);
      }
    }

    // Merge updates
    for (const update of updates) {
      if (update.id) {
        if (existingMap.has(update.id)) {
          // Merge with existing
          existingMap.set(update.id, { ...existingMap.get(update.id), ...update });
        } else {
          // Add new entry
          existingMap.set(update.id, update);
        }
      }
    }

    return Array.from(existingMap.values());
  }

  /**
   * Export graph to JSONL format
   */
  exportToJSONL(graph: CanvasGraph): string {
    const lines: string[] = [];
    
    // Export nodes first
    for (const node of graph.nodeList) {
      lines.push(JSON.stringify(node));
    }
    
    // Export edges
    for (const edge of graph.edgeList) {
      lines.push(JSON.stringify(edge));
    }
    
    return lines.join('\n');
  }

  /**
   * Find node by ID
   */
  findNodeById(graph: CanvasGraph, id: string): JSONLNode | null {
    return graph.nodes.get(id) || null;
  }

  /**
   * Find edges connected to a node
   */
  findEdgesByNode(graph: CanvasGraph, nodeId: string): JSONLEdge[] {
    return graph.edgeList.filter(edge => 
      edge.from === nodeId || 
      edge.to === nodeId || 
      edge.fromNode === nodeId || 
      edge.toNode === nodeId
    );
  }

  /**
   * Add node to graph
   */
  addNode(graph: CanvasGraph, node: JSONLNode): CanvasGraph {
    const newNodes = new Map(graph.nodes);
    newNodes.set(node.id, node);
    
    return {
      ...graph,
      nodes: newNodes,
      nodeList: Array.from(newNodes.values())
    };
  }

  /**
   * Update node in graph
   */
  updateNode(graph: CanvasGraph, nodeId: string, updates: Partial<JSONLNode>): CanvasGraph {
    const existing = graph.nodes.get(nodeId);
    if (!existing) {
      return graph;
    }

    const updated = { ...existing, ...updates };
    const newNodes = new Map(graph.nodes);
    newNodes.set(nodeId, updated);
    
    return {
      ...graph,
      nodes: newNodes,
      nodeList: Array.from(newNodes.values())
    };
  }

  /**
   * Delete node from graph
   */
  deleteNode(graph: CanvasGraph, nodeId: string): CanvasGraph {
    const newNodes = new Map(graph.nodes);
    newNodes.delete(nodeId);
    
    // Also remove connected edges
    const newEdges = new Map(graph.edges);
    const edgesToRemove: string[] = [];
    
    for (const [edgeId, edge] of newEdges.entries()) {
      if (edge.from === nodeId || edge.to === nodeId || 
          edge.fromNode === nodeId || edge.toNode === nodeId) {
        edgesToRemove.push(edgeId);
      }
    }
    
    for (const edgeId of edgesToRemove) {
      newEdges.delete(edgeId);
    }
    
    return {
      ...graph,
      nodes: newNodes,
      edges: newEdges,
      nodeList: Array.from(newNodes.values()),
      edgeList: Array.from(newEdges.values())
    };
  }

  /**
   * Add edge to graph
   */
  addEdge(graph: CanvasGraph, edge: JSONLEdge): CanvasGraph {
    const newEdges = new Map(graph.edges);
    newEdges.set(edge.id, edge);
    
    return {
      ...graph,
      edges: newEdges,
      edgeList: Array.from(newEdges.values())
    };
  }

  /**
   * Delete edge from graph
   */
  deleteEdge(graph: CanvasGraph, edgeId: string): CanvasGraph {
    const newEdges = new Map(graph.edges);
    newEdges.delete(edgeId);
    
    return {
      ...graph,
      edges: newEdges,
      edgeList: Array.from(newEdges.values())
    };
  }
}

export const jsonlCanvasService: JSONLCanvasService = new JSONLCanvasServiceImpl();
