/**
 * Export/Import Utilities
 * Handles format conversion between different file formats
 */

import { CanvasGraph } from '../../../services/jsonl-canvas-service';
import { syncCanvasToCode, syncCodeToCanvas } from './data-sync';

export type ExportFormat = 'jsonl' | 'canvasl' | 'json' | 'code';
export type ImportFormat = 'jsonl' | 'canvasl' | 'json' | 'code';

/**
 * Export content to specified format
 */
export function exportToFormat(content: string, format: ExportFormat, graph?: CanvasGraph): string {
  try {
    switch (format) {
      case 'jsonl':
        if (graph) {
          return syncCanvasToCode(graph, 'jsonl');
        }
        return content;
        
      case 'canvasl':
        if (graph) {
          return syncCanvasToCode(graph, 'canvasl');
        }
        return content;
        
      case 'json':
        if (graph) {
          const nodes = Array.from(graph.nodes.values());
          const edges = Array.from(graph.edges.values());
          return JSON.stringify({ nodes, edges }, null, 2);
        }
        // Try to parse as JSONL and convert to JSON
        try {
          const parsedGraph = syncCodeToCanvas(content);
          const nodes = Array.from(parsedGraph.nodes.values());
          const edges = Array.from(parsedGraph.edges.values());
          return JSON.stringify({ nodes, edges }, null, 2);
        } catch {
          return content;
        }
        
      case 'code':
        return content;
        
      default:
        return content;
    }
  } catch (error) {
    console.error('Export failed:', error);
    return content;
  }
}

/**
 * Import content from specified format
 */
export function importFromFormat(content: string, format: ImportFormat): { code: string; graph?: CanvasGraph } {
  try {
    switch (format) {
      case 'jsonl':
      case 'canvasl':
        const graph = syncCodeToCanvas(content);
        return { code: content, graph };
        
      case 'json':
        try {
          const parsed = JSON.parse(content);
          if (parsed.nodes && parsed.edges) {
            // Convert JSON to JSONL
            const lines: string[] = [];
            for (const node of parsed.nodes) {
              lines.push(JSON.stringify(node));
            }
            for (const edge of parsed.edges) {
              lines.push(JSON.stringify(edge));
            }
            const jsonlContent = lines.join('\n');
            const graph = syncCodeToCanvas(jsonlContent);
            return { code: jsonlContent, graph };
          }
        } catch {
          // Not valid JSON, return as-is
        }
        return { code: content };
        
      case 'code':
        return { code: content };
        
      default:
        return { code: content };
    }
  } catch (error) {
    console.error('Import failed:', error);
    return { code: content };
  }
}

/**
 * Convert content between formats
 */
export function convertBetweenFormats(
  content: string,
  from: ImportFormat,
  to: ExportFormat,
  graph?: CanvasGraph
): string {
  const imported = importFromFormat(content, from);
  const finalGraph = graph || imported.graph;
  
  if (finalGraph && to !== 'code') {
    return exportToFormat('', to, finalGraph);
  }
  
  return exportToFormat(imported.code, to, finalGraph);
}
