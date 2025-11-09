import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

interface FunctionInfo {
  name: string;
  module: number;
  moduleName: string;
  category: string;
  args: string[];
  description: string;
  isPure: boolean;
}

interface JSONLNode {
  id: string;
  type: string;
  x: number;
  y: number;
  width: number;
  height: number;
  color: string;
  text: string;
  function?: string;
  args?: string[];
  metadata?: any;
}

interface JSONLEdge {
  id: string;
  fromNode: string;
  toNode: string;
  fromSide?: string;
  toSide?: string;
  label: string;
  function?: string;
  args?: string[];
}

// Module mapping to dimensions and domains
const moduleMapping: Record<number, { dimension: number; domain: string; category: string }> = {
  1: { dimension: 0, domain: 'foundation', category: 'primitives' },
  2: { dimension: 1, domain: 'jsonl', category: 'parser' },
  3: { dimension: 2, domain: 'rdf', category: 'semantic' },
  4: { dimension: 3, domain: 'owl', category: 'reasoning' },
  5: { dimension: 3, domain: 'shacl', category: 'validation' },
  6: { dimension: 4, domain: 'logic', category: 'programming' },
  7: { dimension: 4, domain: 'sparql', category: 'query' },
  8: { dimension: 2, domain: 'nlp', category: 'transformation' },
  9: { dimension: 6, domain: 'quantum-ai', category: 'computation' },
  10: { dimension: 5, domain: 'repl', category: 'interactive' },
  11: { dimension: 7, domain: 'api', category: 'registry' },
};

// Domain to trie suffix mapping
const domainToSuffix: Record<string, string> = {
  'foundation': 'system-r5rs',
  'jsonl': 'system-r5rs',
  'rdf': 'topology-r5rs',
  'owl': 'topology-r5rs',
  'shacl': 'topology-r5rs',
  'logic': 'system-r5rs',
  'sparql': 'system-r5rs',
  'nlp': 'topology-system',
  'quantum-ai': 'system-r5rs',
  'repl': 'system-r5rs',
  'api': 'topology-system',
};

function parseSchemeFile(filePath: string): FunctionInfo[] {
  const content = readFileSync(filePath, 'utf-8');
  const functions: FunctionInfo[] = [];
  
  // Extract module boundaries
  const moduleRegex = /MODULE (\d+):\s*([^\n]+)/g;
  const modules: Array<{ num: number; name: string; start: number }> = [];
  let match;
  
  while ((match = moduleRegex.exec(content)) !== null) {
    modules.push({
      num: parseInt(match[1]!),
      name: match[2]!.trim(),
      start: match.index,
    });
  }
  
  // Extract function definitions - improved regex
  const functionRegex = /\(define\s+(\(([^\s)]+)(?:\s+([^)]+))?\)|([^\s(]+))\s*/g;
  let currentModule = 1;
  
  while ((match = functionRegex.exec(content)) !== null) {
    let funcName = '';
    let args: string[] = [];
    
    if (match[2]) {
      // Function definition: (define (func-name arg1 arg2 ...) ...)
      funcName = match[2]!.trim();
      if (match[3]) {
        args = match[3]!.trim().split(/\s+/).filter(a => a.trim() && !a.startsWith('.'));
      }
    } else if (match[4]) {
      // Variable definition: (define var ...)
      funcName = match[4]!.trim();
    }
    
    if (!funcName || funcName.startsWith('*') || funcName === 'Y' || funcName === 'true' || funcName === 'false') {
      continue;
    }
    
    // Determine which module this function belongs to
    const funcPos = match.index;
    for (let i = modules.length - 1; i >= 0; i--) {
      if (modules[i]!.start <= funcPos) {
        currentModule = modules[i]!.num;
        break;
      }
    }
    
    const moduleInfo = moduleMapping[currentModule] || { dimension: 0, domain: 'unknown', category: 'unknown' };
    const isPure = !funcName.endsWith('!');
    
    functions.push({
      name: funcName,
      module: currentModule,
      moduleName: modules.find(m => m.num === currentModule)?.name || `Module ${currentModule}`,
      category: moduleInfo.category,
      args,
      description: `Function from ${moduleInfo.domain}`,
      isPure,
    });
  }
  
  return functions;
}

function generateTrieID(dimension: number, domain: string, funcName: string, index: number): string {
  const suffix = domainToSuffix[domain] || 'system-r5rs';
  const cleanName = funcName.replace(/[^a-zA-Z0-9-]/g, '-').toLowerCase();
  const shortName = cleanName.length > 20 ? cleanName.substring(0, 20) : cleanName;
  return `${dimension}D-${suffix}-${shortName}-${index}`;
}

function generateJSONL(functions: FunctionInfo[]): string {
  const nodes: JSONLNode[] = [];
  const edges: JSONLEdge[] = [];
  
  // Group functions by dimension and domain
  const grouped: Record<string, FunctionInfo[]> = {};
  
  functions.forEach(func => {
    const moduleInfo = moduleMapping[func.module] || { dimension: 0, domain: 'unknown', category: 'unknown' };
    const key = `${moduleInfo.dimension}D-${moduleInfo.domain}`;
    if (!grouped[key]) {
      grouped[key] = [];
    }
    grouped[key]!.push(func);
  });
  
  // Create nodes following trie structure
  let yOffset = 0;
  const dimensionNodes: Record<number, string[]> = {};
  
  Object.keys(grouped).sort().forEach(key => {
    const parts = key.split('-', 2);
    if (parts.length < 2) return;
    const dimStr = parts[0];
    const domain = parts[1] || 'unknown';
    if (!dimStr) return;
    const dimension = parseInt(dimStr.replace('D', ''));
    if (isNaN(dimension)) return;
    
    const funcs = grouped[key];
    if (!funcs || funcs.length === 0) return;
    const moduleInfo = moduleMapping[funcs[0]!.module] || { dimension: 0, domain: 'unknown', category: 'unknown' };
    
    if (!dimensionNodes[dimension]) {
      dimensionNodes[dimension] = [];
    }
    
    // Create parent node for this domain
    const domainSuffix = domainToSuffix[domain] || 'system-r5rs';
    const parentId = `${dimension}D-${domainSuffix}`;
    const parentExists = nodes.find(n => n.id === parentId);
    
    if (!parentExists) {
      nodes.push({
        id: parentId,
        type: 'text',
        x: dimension * 300,
        y: yOffset,
        width: 280,
        height: 120,
        color: String(dimension + 1),
        text: `# ${dimension}D-${domainSuffix}\n\n**${moduleInfo.category}**\n\nFunctions: ${funcs.length}`,
      });
      dimensionNodes[dimension]!.push(parentId);
    }
    
    // Create function nodes
    funcs.forEach((func, idx) => {
      const nodeId = generateTrieID(dimension, domain, func.name, idx);
      const registryName = `r5rs:${func.name}`;
      
      nodes.push({
        id: nodeId,
        type: 'text',
        x: dimension * 300 + (idx % 3) * 320,
        y: yOffset + 150 + Math.floor(idx / 3) * 180,
        width: 300,
        height: 160,
        color: String(dimension + 1),
        text: `# ${func.name}\n\n**${func.moduleName}**\n\n\`\`\`scheme\n(define (${func.name} ${func.args.join(' ')}) ...)\n\`\`\`\n\n**Registry**: \`${registryName}\`\n\n**Pure**: ${func.isPure ? 'Yes' : 'No'}`,
        function: registryName,
        args: func.args,
        metadata: {
          module: func.module,
          category: func.category,
          isPure: func.isPure,
        },
      });
      
      // Create edge from parent to function
      edges.push({
        id: `${parentId}→${nodeId}`,
        fromNode: parentId,
        toNode: nodeId,
        fromSide: 'bottom',
        toSide: 'top',
        label: func.category,
        function: registryName,
        args: func.args,
      });
    });
    
    yOffset += 150 + Math.ceil(funcs.length / 3) * 180;
  });
  
  // Create vertical edges between dimensions
  const sortedDims = Object.keys(dimensionNodes).sort((a, b) => parseInt(a) - parseInt(b));
  sortedDims.forEach((dimStr, idx) => {
    if (!dimStr) return;
    const dim = parseInt(dimStr);
    if (isNaN(dim)) return;
    
    const prevDimStr = idx > 0 ? sortedDims[idx - 1] : null;
    if (prevDimStr) {
      const prevDim = parseInt(prevDimStr);
      if (!isNaN(prevDim) && dimensionNodes[prevDim] && dimensionNodes[dim]) {
        const fromNode = dimensionNodes[prevDim]![0];
        const toNode = dimensionNodes[dim]![0];
        if (fromNode && toNode) {
          edges.push({
            id: `v:${fromNode}→${toNode}`,
            fromNode,
            toNode,
            fromSide: 'bottom',
            toSide: 'top',
            label: 'dimensional progression',
          });
        }
      }
    }
  });
  
  // Create horizontal edges for cross-domain connections
  Object.keys(grouped).forEach(key => {
    const parts = key.split('-', 2);
    if (parts.length < 2) return;
    const dimStr = parts[0];
    const domain = parts[1] || 'unknown';
    if (!dimStr) return;
    const dimension = parseInt(dimStr.replace('D', ''));
    if (isNaN(dimension)) return;
    
    const funcs = grouped[key];
    if (!funcs) return;
    
    // Connect related functions
    funcs.forEach((func, idx) => {
      if (idx < funcs.length - 1 && funcs[idx + 1]) {
        const nodeId1 = generateTrieID(dimension, domain, func.name, idx);
        const nodeId2 = generateTrieID(dimension, domain, funcs[idx + 1]!.name, idx + 1);
        
        edges.push({
          id: `h:${nodeId1}→${nodeId2}`,
          fromNode: nodeId1,
          toNode: nodeId2,
          fromSide: 'right',
          toSide: 'left',
          label: 'function sequence',
        });
      }
    });
  });
  
  // Combine nodes and edges into JSONL
  const jsonlLines: string[] = [];
  
  nodes.forEach(node => {
    jsonlLines.push(JSON.stringify(node));
  });
  
  edges.forEach(edge => {
    jsonlLines.push(JSON.stringify(edge));
  });
  
  return jsonlLines.join('\n') + '\n';
}

// Main execution
const scmFile = join(__dirname, 'r5rs-canvas-engine.scm');
const outputFile = join(__dirname, 'r5rs-functions-trie.jsonl');

console.log('Parsing R5RS Scheme file...');
const functions = parseSchemeFile(scmFile);

console.log(`Found ${functions.length} functions`);
console.log('Generating JSONL with trie structure...');

const jsonl = generateJSONL(functions);

writeFileSync(outputFile, jsonl, 'utf-8');

console.log(`Exported to ${outputFile}`);
console.log(`Created ${functions.length} function nodes`);

// Print summary
const byModule: Record<number, number> = {};
functions.forEach(f => {
  byModule[f.module] = (byModule[f.module] || 0) + 1;
});

console.log('\nFunctions by module:');
Object.keys(byModule).sort().forEach(m => {
  console.log(`  Module ${m}: ${byModule[parseInt(m)]} functions`);
});
