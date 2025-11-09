/**
 * Data Synchronization Utilities
 * Synchronizes data between code and canvas representations
 */

import { CanvasGraph, JSONLNode, JSONLEdge } from '../../../services/jsonl-canvas-service';
import { jsonlCanvasService } from '../../../services/jsonl-canvas-service';

/**
 * Convert code string to canvas graph
 */
export function syncCodeToCanvas(code: string): CanvasGraph {
  try {
    return jsonlCanvasService.parseJSONL(code);
  } catch (error) {
    console.error('Failed to sync code to canvas:', error);
    return {
      nodes: new Map(),
      edges: new Map(),
      nodeList: [],
      edgeList: []
    };
  }
}

/**
 * Convert canvas graph to code string
 */
export function syncCanvasToCode(graph: CanvasGraph, format: 'jsonl' | 'canvasl' = 'jsonl'): string {
  try {
    const jsonlContent = jsonlCanvasService.exportToJSONL(graph);
    
    // For CanvasL format, we could add directives here
    if (format === 'canvasl') {
      // Add CanvasL directives if needed
      return jsonlContent;
    }
    
    return jsonlContent;
  } catch (error) {
    console.error('Failed to sync canvas to code:', error);
    return '';
  }
}

/**
 * Validate synchronization between code and graph
 */
export function validateSync(code: string, graph: CanvasGraph): boolean {
  try {
    // Parse code to graph
    const parsedGraph = syncCodeToCanvas(code);
    
    // Compare node counts
    if (parsedGraph.nodeList.length !== graph.nodeList.length) {
      return false;
    }
    
    // Compare edge counts
    if (parsedGraph.edgeList.length !== graph.edgeList.length) {
      return false;
    }
    
    // Check if all nodes exist
    for (const node of graph.nodeList) {
      if (!parsedGraph.nodes.has(node.id)) {
        return false;
      }
    }
    
    // Check if all edges exist
    for (const edge of graph.edgeList) {
      if (!parsedGraph.edges.has(edge.id)) {
        return false;
      }
    }
    
    return true;
  } catch (error) {
    console.error('Sync validation failed:', error);
    return false;
  }
}

/**
 * Merge code changes into graph
 */
export function mergeCodeIntoGraph(code: string, graph: CanvasGraph): CanvasGraph {
  try {
    const parsedGraph = syncCodeToCanvas(code);
    
    // Merge nodes
    const mergedNodes = new Map(graph.nodes);
    for (const node of parsedGraph.nodeList) {
      mergedNodes.set(node.id, node);
    }
    
    // Merge edges
    const mergedEdges = new Map(graph.edges);
    for (const edge of parsedGraph.edgeList) {
      mergedEdges.set(edge.id, edge);
    }
    
    return {
      nodes: mergedNodes,
      edges: mergedEdges,
      nodeList: Array.from(mergedNodes.values()),
      edgeList: Array.from(mergedEdges.values())
    };
  } catch (error) {
    console.error('Failed to merge code into graph:', error);
    return graph;
  }
}

/**
 * Merge graph changes into code
 */
export function mergeGraphIntoCode(graph: CanvasGraph, code: string, format: 'jsonl' | 'canvasl' = 'jsonl'): string {
  try {
    // Get current graph from code
    const currentGraph = syncCodeToCanvas(code);
    
    // Merge graphs
    const mergedNodes = new Map(currentGraph.nodes);
    for (const node of graph.nodeList) {
      mergedNodes.set(node.id, node);
    }
    
    const mergedEdges = new Map(currentGraph.edges);
    for (const edge of graph.edgeList) {
      mergedEdges.set(edge.id, edge);
    }
    
    const mergedGraph: CanvasGraph = {
      nodes: mergedNodes,
      edges: mergedEdges,
      nodeList: Array.from(mergedNodes.values()),
      edgeList: Array.from(mergedEdges.values())
    };
    
    // Convert back to code
    return syncCanvasToCode(mergedGraph, format);
  } catch (error) {
    console.error('Failed to merge graph into code:', error);
    return code;
  }
}
