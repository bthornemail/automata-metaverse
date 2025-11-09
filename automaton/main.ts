import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

interface CanvasNode {
  id: string;
  type: string;
  x: number;
  y: number;
  text: string;
}

interface CanvasEdge {
  id: string;
  type: string;
  from: string;
  to: string;
  label: string;
}

interface CanvasGraph {
  id: string;
  type: string;
  iri: string;
  triples: [string, string, string][];
}

interface CanvasSHACL {
  id: string;
  type: string;
  target: string;
  constraints: Array<{
    "sh:path": string;
    "sh:hasValue"?: string;
    "sh:in"?: string[];
  }>;
}

interface CanvasSPARQLUpdate {
  id: string;
  type: string;
  command: string;
}

type CanvasObject = CanvasNode | CanvasEdge | CanvasGraph | CanvasSHACL | CanvasSPARQLUpdate;

class GrokCanvasParser {
  private files: Map<string, CanvasObject[]> = new Map();
  private fileOrder: string[] = [];

  constructor() {
    // Define file order based on the sequence provided
    this.fileOrder = [
      "01-Grok.md",
      "02-Grok.md", 
      "03-Grok.md",
      "04-Grok.md",
      "05-Grok.md",
      "06-Grok.md",
      "07-Grok.md",
      "08-Grok.md",
      "09-Grok.md",
      "10-Grok.md",
      "11-Grok.md",
      "12-Grok.md", 
      "13-Grok.md",
      "14-Grok.md",
      "15-Grok.md",
      "16-Grok.md",
      "17-Grok.md",
      "18-Grok.md",
      "19-Grok.md",
      "20-Grok.md",
      "21-Grok.md",
      "22-Grok.md", 
      "23-Grok.md",
      "24-Grok.md",
      "25-Grok.md",
      "26-Grok.md",
      "27-Grok.md",
      "28-Grok.md",
      "29-Grok.md",
      "30-Grok.md",
      "31-Grok.md",
      "32-Grok.md", 
      "33-Grok.md",
      "34-Grok.md",
      "35-Grok.md",
      "36-Grok.md",
      "37-Grok.md",
      "38-Grok.md",
      "39-Grok.md",
      "40-Grok.md",
      "41-Grok.md",
      "42-Grok.md", 
      "43-Grok.md",
      "44-Grok.md",
      "45-Grok.md",
      "46-Grok.md",
      "47-Grok.md",
      "48-Grok.md",
      "49-Grok.md",
      "50-Grok.md",
      "51-Grok.md",
      "52-Grok.md", 
      "53-Grok.md",
      "54-Grok.md",
      "55-Grok.md",
      "56-Grok.md",
      "57-Grok.md",
      "58-Grok.md",
      "59-Grok.md"
    ];
  }

  parseJSONL(content: string): CanvasObject[] {
    const lines = content.trim().split('\n');
    const objects: CanvasObject[] = [];

    for (const line of lines) {
      if (line.trim().startsWith('{') && line.trim().endsWith('}')) {
        try {
          const obj = JSON.parse(line.trim());
          objects.push(obj);
        } catch (error) {
          console.warn('Failed to parse JSONL line:', line);
        }
      }
    }

    return objects;
  }

  extractJSONLFromMarkdown(markdownContent: string): string {
    // Extract content between ```jsonl and ``` markers
    const jsonlBlockRegex = /```jsonl\n([\s\S]*?)\n```/;
    const match = markdownContent.match(jsonlBlockRegex);
    
    if (match && match[1]) {
      return match[1];
    }
    
    // Alternative: look for lines that are valid JSON objects
    const lines = markdownContent.split('\n');
    const jsonlLines = lines.filter(line => {
      const trimmed = line.trim();
      return trimmed.startsWith('{') && trimmed.endsWith('}');
    });
    
    return jsonlLines.join('\n');
  }

  addFile(filename: string, content: string): void {
    const jsonlContent = this.extractJSONLFromMarkdown(content);
    const objects = this.parseJSONL(jsonlContent);
    this.files.set(filename, objects);
  }

  loadFilesFromDirectory(directoryPath: string): void {
    console.log(`Loading files from directory: ${directoryPath}`);
    
    for (const filename of this.fileOrder) {
      const filePath = join(directoryPath, filename);
      
      if (existsSync(filePath)) {
        try {
          const content = readFileSync(filePath, 'utf-8');
          this.addFile(filename, content);
          console.log(`✓ Loaded: ${filename}`);
        } catch (error) {
          console.error(`✗ Error reading ${filename}:`, error);
        }
      } else {
        console.warn(`⚠ File not found: ${filename}`);
      }
    }
  }

  loadSpecificFiles(filePaths: string[]): void {
    console.log('Loading specific files...');
    
    for (const filePath of filePaths) {
      if (existsSync(filePath)) {
        try {
          const content = readFileSync(filePath, 'utf-8');
          const filename = filePath.split(/[\\/]/).pop() || filePath;
          this.addFile(filename, content);
          console.log(`✓ Loaded: ${filename}`);
        } catch (error) {
          console.error(`✗ Error reading ${filePath}:`, error);
        }
      } else {
        console.warn(`⚠ File not found: ${filePath}`);
      }
    }
  }

  getAllObjects(): CanvasObject[] {
    const allObjects: CanvasObject[] = [];
    
    for (const filename of this.fileOrder) {
      const objects = this.files.get(filename);
      if (objects) {
        allObjects.push(...objects);
      }
    }
    
    return allObjects;
  }

  getObjectsByType<T extends CanvasObject>(type: string): T[] {
    return this.getAllObjects().filter(obj => obj.type === type) as T[];
  }

  getNodes(): CanvasNode[] {
    return this.getObjectsByType<CanvasNode>('node');
  }

  getEdges(): CanvasEdge[] {
    return this.getObjectsByType<CanvasEdge>('horizontal');
  }

  getGraphs(): CanvasGraph[] {
    return this.getObjectsByType<CanvasGraph>('graph');
  }

  getSHACLConstraints(): CanvasSHACL[] {
    return this.getObjectsByType<CanvasSHACL>('shacl');
  }

  getSPARQLUpdates(): CanvasSPARQLUpdate[] {
    return this.getObjectsByType<CanvasSPARQLUpdate>('update');
  }

  getObjectsByFile(filename: string): CanvasObject[] {
    return this.files.get(filename) || [];
  }

  getEvolutionTimeline(): Map<string, CanvasObject[]> {
    const timeline = new Map<string, CanvasObject[]>();
    
    for (const filename of this.fileOrder) {
      const objects = this.files.get(filename);
      if (objects) {
        timeline.set(filename, objects);
      }
    }
    
    return timeline;
  }

  findObjectById(id: string): CanvasObject | null {
    for (const objects of this.files.values()) {
      const found = objects.find(obj => obj.id === id);
      if (found) return found;
    }
    return null;
  }

  getConnectedNodes(nodeId: string): { incoming: CanvasEdge[], outgoing: CanvasEdge[] } {
    const allEdges = this.getEdges();
    return {
      incoming: allEdges.filter(edge => edge.to === nodeId),
      outgoing: allEdges.filter(edge => edge.from === nodeId)
    };
  }

  printSummary(): void {
    console.log('=== Grok Canvas Evolution Summary ===\n');
    
    for (const filename of this.fileOrder) {
      const objects = this.files.get(filename);
      if (objects) {
        console.log(`${filename}:`);
        console.log(`  - Total objects: ${objects.length}`);
        
        const nodes = objects.filter(obj => obj.type === 'node').length;
        const edges = objects.filter(obj => obj.type === 'horizontal').length;
        const graphs = objects.filter(obj => obj.type === 'graph').length;
        const shacl = objects.filter(obj => obj.type === 'shacl').length;
        const updates = objects.filter(obj => obj.type === 'update').length;
        
        if (nodes > 0) console.log(`    Nodes: ${nodes}`);
        if (edges > 0) console.log(`    Edges: ${edges}`);
        if (graphs > 0) console.log(`    Graphs: ${graphs}`);
        if (shacl > 0) console.log(`    SHACL: ${shacl}`);
        if (updates > 0) console.log(`    SPARQL Updates: ${updates}`);
        
        // Print node texts for context
        const nodeTexts = objects
          .filter(obj => obj.type === 'node')
          .map(obj => (obj as CanvasNode).text)
          .slice(0, 2); // Show first 2 nodes
        
        if (nodeTexts.length > 0) {
          console.log(`    Key Nodes: ${nodeTexts.join(', ')}`);
        }
      }
      console.log();
    }

    console.log('=== Overall Statistics ===');
    console.log(`Total files processed: ${this.files.size}`);
    console.log(`Total objects: ${this.getAllObjects().length}`);
    console.log(`Total nodes: ${this.getNodes().length}`);
    console.log(`Total edges: ${this.getEdges().length}`);
    console.log(`Total graphs: ${this.getGraphs().length}`);
    console.log(`Total SHACL constraints: ${this.getSHACLConstraints().length}`);
    console.log(`Total SPARQL updates: ${this.getSPARQLUpdates().length}`);
  }

  exportToJSON(filename: string): void {
    const data = {
      summary: {
        totalFiles: this.files.size,
        totalObjects: this.getAllObjects().length,
        files: Array.from(this.files.entries()).map(([file, objects]) => ({
          file,
          objectCount: objects.length,
          nodes: objects.filter(obj => obj.type === 'node').length,
          edges: objects.filter(obj => obj.type === 'horizontal').length,
          graphs: objects.filter(obj => obj.type === 'graph').length,
          shacl: objects.filter(obj => obj.type === 'shacl').length,
          updates: objects.filter(obj => obj.type === 'update').length
        }))
      },
      timeline: Object.fromEntries(this.getEvolutionTimeline()),
      allObjects: this.getAllObjects()
    };

    try {
      const fs = require('fs');
      fs.writeFileSync(filename, JSON.stringify(data, null, 2));
      console.log(`✓ Exported data to ${filename}`);
    } catch (error) {
      console.error(`✗ Error exporting to ${filename}:`, error);
    }
  }
}

// Example usage
async function main() {
  const parser = new GrokCanvasParser();
  
  // Option 1: Load all files from a directory
  const directoryPath = './grok_files'; // Change this to your directory path
  parser.loadFilesFromDirectory(directoryPath);
  
  // Option 2: Load specific files
  // const specificFiles = [
  //   './50-Grok.md',
  //   './51-Grok.md',
  //   './52-Grok.md'
  // ];
  // parser.loadSpecificFiles(specificFiles);
  
  // Print summary
  parser.printSummary();
  
  // Access specific data
  console.log('\n=== Detailed Analysis ===');
  
  const allNodes = parser.getNodes();
  console.log(`\nAll Nodes (${allNodes.length}):`);
  allNodes.forEach(node => {
    console.log(`  - ${node.text} (${node.id}) at (${node.x}, ${node.y})`);
  });
  
  const allEdges = parser.getEdges();
  console.log(`\nAll Edges (${allEdges.length}):`);
  allEdges.forEach(edge => {
    console.log(`  - ${edge.from} → ${edge.to} : "${edge.label}"`);
  });
  
  // Show evolution timeline
  console.log('\n=== Evolution Timeline ===');
  const timeline = parser.getEvolutionTimeline();
  for (const [filename, objects] of timeline) {
    const nodes = objects.filter(obj => obj.type === 'node') as CanvasNode[];
    if (nodes.length > 0) {
      console.log(`\n${filename}:`);
      nodes.forEach(node => {
        const connections = parser.getConnectedNodes(node.id);
        console.log(`  - ${node.text}`);
        console.log(`    Incoming: ${connections.incoming.length}, Outgoing: ${connections.outgoing.length}`);
      });
    }
  }
  
  // Export to JSON file
  parser.exportToJSON('grok-canvas-analysis.json');
}

// Run the parser
if (require.main === module) {
  main().catch(console.error);
}

export { GrokCanvasParser };
export type { CanvasNode, CanvasEdge, CanvasGraph, CanvasSHACL, CanvasSPARQLUpdate, CanvasObject };