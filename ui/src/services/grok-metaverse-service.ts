/**
 * Grok Metaverse Service
 * Parses grok_files to build metaverse with custom avatars for dimensional agents
 */

import { databaseService } from './database-service';
import { jsonlCanvasService } from './jsonl-canvas-service';

export interface DimensionalAgent {
  id: string;
  dimension: number;
  name: string;
  type: 'topology' | 'system';
  churchEncoding?: string;
  purpose: string;
  dependencies: string[];
  position: [number, number, number];
  color: string;
  shape: 'sphere' | 'cube' | 'torus' | 'octahedron' | 'tetrahedron' | 'icosahedron';
  size: number;
  metadata: {
    grokFile?: string;
    agentType?: string;
    capabilities?: string[];
  };
}

export interface MetaverseStructure {
  agents: Map<string, DimensionalAgent>;
  agentList: DimensionalAgent[];
  connections: Array<{
    from: string;
    to: string;
    type: 'vertical' | 'horizontal';
    label?: string;
  }>;
  bounds: {
    min: [number, number, number];
    max: [number, number, number];
    center: [number, number, number];
  };
}

export interface GrokMetaverseService {
  loadGrokMetaverse(): Promise<MetaverseStructure>;
  parseGrokFiles(): Promise<DimensionalAgent[]>;
  generateAvatarForAgent(agent: DimensionalAgent): any;
  buildMetaverseLayout(agents: DimensionalAgent[]): MetaverseStructure;
}

class GrokMetaverseServiceImpl implements GrokMetaverseService {
  /**
   * Load metaverse structure from grok_files
   */
  async loadGrokMetaverse(): Promise<MetaverseStructure> {
    const agents = await this.parseGrokFiles();
    return this.buildMetaverseLayout(agents);
  }

  /**
   * Parse grok_files to extract dimensional agents
   */
  async parseGrokFiles(): Promise<DimensionalAgent[]> {
    const agents: DimensionalAgent[] = [];

    // Parse AGENTS.md for agent definitions
    try {
      // Load from CanvasL files that reference grok_files
      const files = [
        'automaton-kernel.canvasl',
        'generate.metaverse.jsonl',
        'automaton.canvas.space.jsonl'
      ];

      for (const filename of files) {
        try {
          const entries = await databaseService.readJSONL(filename);
          const graph = jsonlCanvasService.parseJSONL(
            entries.map(e => JSON.stringify(e)).join('\n')
          );

          // Extract dimensional agents from nodes
          for (const node of graph.nodeList) {
            const dimension = this.extractDimension(node);
            if (dimension !== null) {
              const agent = this.nodeToAgent(node, dimension);
              if (agent) {
                agents.push(agent);
              }
            }
          }
        } catch (err) {
          console.warn(`Failed to parse ${filename}:`, err);
        }
      }
    } catch (error) {
      console.error('Failed to parse grok files:', error);
    }

    // Add default dimensional agents if none found
    if (agents.length === 0) {
      agents.push(...this.getDefaultDimensionalAgents());
    }

    return agents;
  }

  /**
   * Convert node to dimensional agent
   */
  private nodeToAgent(node: any, dimension: number): DimensionalAgent | null {
    const id = node.id || `agent-${dimension}D`;
    const text = node.text || id;
    const isTopology = text.toLowerCase().includes('topology');
    const isSystem = text.toLowerCase().includes('system');

    if (!isTopology && !isSystem) {
      return null;
    }

    const type = isTopology ? 'topology' : 'system';
    const name = text.split('\n')[0] || id;
    const churchEncoding = this.extractChurchEncoding(node, dimension);

    return {
      id,
      dimension,
      name,
      type,
      churchEncoding,
      purpose: this.getPurposeForDimension(dimension, type),
      dependencies: this.getDependenciesForDimension(dimension),
      position: [0, 0, 0], // Will be set by layout
      color: this.getColorForDimension(dimension),
      shape: this.getShapeForDimension(dimension, type),
      size: this.getSizeForDimension(dimension),
      metadata: {
        grokFile: `grok_files/${String(dimension).padStart(2, '0')}-Grok.md`,
        agentType: type,
        capabilities: this.getCapabilitiesForDimension(dimension, type)
      }
    };
  }

  /**
   * Build metaverse layout with 3D positioning
   */
  buildMetaverseLayout(agents: DimensionalAgent[]): MetaverseStructure {
    const agentsMap = new Map<string, DimensionalAgent>();
    const connections: Array<{ from: string; to: string; type: 'vertical' | 'horizontal'; label?: string }> = [];

    // Arrange agents in 3D spiral/helix pattern
    const topologyAgents = agents.filter(a => a.type === 'topology').sort((a, b) => a.dimension - b.dimension);
    const systemAgents = agents.filter(a => a.type === 'system').sort((a, b) => a.dimension - b.dimension);

    // Position topology agents vertically (spine)
    topologyAgents.forEach((agent, index) => {
      const angle = (index / topologyAgents.length) * Math.PI * 2;
      const radius = 3 + agent.dimension * 0.5;
      agent.position = [
        Math.cos(angle) * radius,
        agent.dimension * 2, // Stack vertically
        Math.sin(angle) * radius
      ];
      agentsMap.set(agent.id, agent);

      // Vertical connections
      if (index > 0) {
        connections.push({
          from: topologyAgents[index - 1].id,
          to: agent.id,
          type: 'vertical'
        });
      }
    });

    // Position system agents horizontally from topology
    systemAgents.forEach((agent) => {
      const topologyAgent = topologyAgents.find(a => a.dimension === agent.dimension);
      if (topologyAgent) {
        agent.position = [
          topologyAgent.position[0] + 2,
          topologyAgent.position[1],
          topologyAgent.position[2]
        ];
        agentsMap.set(agent.id, agent);

        // Horizontal connection
        connections.push({
          from: topologyAgent.id,
          to: agent.id,
          type: 'horizontal',
          label: `topology→${agent.name.toLowerCase()}`
        });
      }
    });

    // Calculate bounds
    const positions = Array.from(agentsMap.values()).map(a => a.position);
    const min: [number, number, number] = [
      Math.min(...positions.map(p => p[0])),
      Math.min(...positions.map(p => p[1])),
      Math.min(...positions.map(p => p[2]))
    ];
    const max: [number, number, number] = [
      Math.max(...positions.map(p => p[0])),
      Math.max(...positions.map(p => p[1])),
      Math.max(...positions.map(p => p[2]))
    ];
    const center: [number, number, number] = [
      (min[0] + max[0]) / 2,
      (min[1] + max[1]) / 2,
      (min[2] + max[2]) / 2
    ];

    return {
      agents: agentsMap,
      agentList: Array.from(agentsMap.values()),
      connections,
      bounds: { min, max, center }
    };
  }

  /**
   * Generate 3D avatar representation for agent
   */
  generateAvatarForAgent(agent: DimensionalAgent): any {
    return {
      id: agent.id,
      name: agent.name,
      position: agent.position,
      shape: agent.shape,
      color: agent.color,
      size: agent.size,
      dimension: agent.dimension,
      churchEncoding: agent.churchEncoding,
      metadata: agent.metadata
    };
  }

  /**
   * Get default dimensional agents (0D-7D)
   */
  private getDefaultDimensionalAgents(): DimensionalAgent[] {
    return [
      // 0D
      {
        id: '0D-topology',
        dimension: 0,
        name: '0D Topology',
        type: 'topology',
        churchEncoding: 'λf.λx.x',
        purpose: 'Maintain quantum vacuum topology and identity processes',
        dependencies: [],
        position: [0, 0, 0],
        color: '#6366f1',
        shape: 'sphere',
        size: 0.5,
        metadata: { grokFile: 'grok_files/02-Grok.md', agentType: 'topology' }
      },
      {
        id: '0D-system',
        dimension: 0,
        name: '0D System',
        type: 'system',
        churchEncoding: 'λf.λx.x',
        purpose: 'Church Numeral Zero',
        dependencies: ['0D-topology'],
        position: [2, 0, 0],
        color: '#6366f1',
        shape: 'cube',
        size: 0.5,
        metadata: { grokFile: 'grok_files/02-Grok.md', agentType: 'system' }
      },
      // 1D
      {
        id: '1D-topology',
        dimension: 1,
        name: '1D Topology',
        type: 'topology',
        churchEncoding: 'λn.λf.λx.f(nfx)',
        purpose: 'Handle temporal evolution and Church successor operations',
        dependencies: ['0D-topology'],
        position: [0, 2, 0],
        color: '#8b5cf6',
        shape: 'torus',
        size: 0.6,
        metadata: { grokFile: 'grok_files/02-Grok.md', agentType: 'topology' }
      },
      {
        id: '1D-system',
        dimension: 1,
        name: '1D System',
        type: 'system',
        churchEncoding: 'λn.λf.λx.f(nfx)',
        purpose: 'Church Successor',
        dependencies: ['1D-topology'],
        position: [2, 2, 0],
        color: '#8b5cf6',
        shape: 'cube',
        size: 0.6,
        metadata: { grokFile: 'grok_files/02-Grok.md', agentType: 'system' }
      },
      // 2D
      {
        id: '2D-topology',
        dimension: 2,
        name: '2D Topology',
        type: 'topology',
        churchEncoding: 'λx.λy.λf.fxy',
        purpose: 'Manage spatial structure and pattern encoding',
        dependencies: ['1D-topology'],
        position: [0, 4, 0],
        color: '#ec4899',
        shape: 'octahedron',
        size: 0.7,
        metadata: { grokFile: 'grok_files/02-Grok.md', agentType: 'topology' }
      },
      {
        id: '2D-system',
        dimension: 2,
        name: '2D System',
        type: 'system',
        churchEncoding: 'λx.λy.λf.fxy',
        purpose: 'Church Pair',
        dependencies: ['2D-topology'],
        position: [2, 4, 0],
        color: '#ec4899',
        shape: 'cube',
        size: 0.7,
        metadata: { grokFile: 'grok_files/02-Grok.md', agentType: 'system' }
      },
      // 3D
      {
        id: '3D-topology',
        dimension: 3,
        name: '3D Topology',
        type: 'topology',
        churchEncoding: 'λm.λn.λf.λx.mf(nfx)',
        purpose: 'Perform Church algebra operations',
        dependencies: ['2D-topology'],
        position: [0, 6, 0],
        color: '#f43f5e',
        shape: 'tetrahedron',
        size: 0.8,
        metadata: { grokFile: 'grok_files/02-Grok.md', agentType: 'topology' }
      },
      {
        id: '3D-system',
        dimension: 3,
        name: '3D System',
        type: 'system',
        churchEncoding: 'λm.λn.λf.λx.mf(nfx)',
        purpose: 'Church Addition',
        dependencies: ['3D-topology'],
        position: [2, 6, 0],
        color: '#f43f5e',
        shape: 'cube',
        size: 0.8,
        metadata: { grokFile: 'grok_files/02-Grok.md', agentType: 'system' }
      },
      // 4D
      {
        id: '4D-topology',
        dimension: 4,
        name: '4D Topology',
        type: 'topology',
        churchEncoding: 'λm.λn.λf.m(nf)',
        purpose: 'Manage spacetime and network operations',
        dependencies: ['3D-topology'],
        position: [0, 8, 0],
        color: '#f97316',
        shape: 'icosahedron',
        size: 0.9,
        metadata: { grokFile: 'grok_files/02-Grok.md', agentType: 'topology' }
      },
      {
        id: '4D-system-ipv4',
        dimension: 4,
        name: '4D System IPv4',
        type: 'system',
        churchEncoding: 'λm.λn.λf.m(nf)',
        purpose: 'IPv4 Address System',
        dependencies: ['4D-topology'],
        position: [2, 8, 0],
        color: '#f97316',
        shape: 'cube',
        size: 0.9,
        metadata: { grokFile: 'grok_files/02-Grok.md', agentType: 'system' }
      },
      // 5D
      {
        id: '5D-topology',
        dimension: 5,
        name: '5D Topology',
        type: 'topology',
        churchEncoding: 'λm.λn.nm',
        purpose: 'Implement distributed consensus and blockchain operations',
        dependencies: ['4D-topology'],
        position: [0, 10, 0],
        color: '#eab308',
        shape: 'torus',
        size: 1.0,
        metadata: { grokFile: 'grok_files/02-Grok.md', agentType: 'topology' }
      },
      {
        id: '5D-system-blockchain',
        dimension: 5,
        name: '5D System Blockchain',
        type: 'system',
        churchEncoding: 'λm.λn.nm',
        purpose: 'Blockchain Consensus',
        dependencies: ['5D-topology'],
        position: [2, 10, 0],
        color: '#eab308',
        shape: 'cube',
        size: 1.0,
        metadata: { grokFile: 'grok_files/02-Grok.md', agentType: 'system' }
      },
      // 6D
      {
        id: '6D-topology',
        dimension: 6,
        name: '6D Topology',
        type: 'topology',
        churchEncoding: 'λf.(λx.f(xx))(λx.f(xx))',
        purpose: 'Handle emergent AI and neural network operations',
        dependencies: ['5D-topology'],
        position: [0, 12, 0],
        color: '#22c55e',
        shape: 'octahedron',
        size: 1.1,
        metadata: { grokFile: 'grok_files/02-Grok.md', agentType: 'topology' }
      },
      {
        id: '6D-system-ai',
        dimension: 6,
        name: '6D System AI',
        type: 'system',
        churchEncoding: 'λf.(λx.f(xx))(λx.f(xx))',
        purpose: 'Neural Network Transformer',
        dependencies: ['6D-topology'],
        position: [2, 12, 0],
        color: '#22c55e',
        shape: 'cube',
        size: 1.1,
        metadata: { grokFile: 'grok_files/02-Grok.md', agentType: 'system' }
      },
      // 7D
      {
        id: '7D-topology',
        dimension: 7,
        name: '7D Topology',
        type: 'topology',
        churchEncoding: '|ψ⟩ = α|0⟩ + β|1⟩',
        purpose: 'Manage quantum superposition and entanglement',
        dependencies: ['6D-topology'],
        position: [0, 14, 0],
        color: '#06b6d4',
        shape: 'icosahedron',
        size: 1.2,
        metadata: { grokFile: 'grok_files/02-Grok.md', agentType: 'topology' }
      },
      {
        id: '7D-system-qubit',
        dimension: 7,
        name: '7D System Qubit',
        type: 'system',
        churchEncoding: '|ψ⟩ = α|0⟩ + β|1⟩',
        purpose: 'Quantum Qubit System',
        dependencies: ['7D-topology'],
        position: [2, 14, 0],
        color: '#06b6d4',
        shape: 'cube',
        size: 1.2,
        metadata: { grokFile: 'grok_files/02-Grok.md', agentType: 'system' }
      }
    ];
  }

  // Helper methods
  private extractDimension(node: any): number | null {
    const id = (node.id || '').toLowerCase();
    const text = (node.text || '').toLowerCase();
    
    for (let d = 0; d <= 7; d++) {
      if (id.includes(`${d}d`) || text.includes(`${d}d`)) {
        return d;
      }
    }
    return null;
  }

  private extractChurchEncoding(node: any, dimension: number): string {
    if (node.metadata?.churchEncoding) return node.metadata.churchEncoding;
    if (node.text?.includes('λ')) {
      const match = node.text.match(/λ[^λ\n]*/);
      if (match) return match[0];
    }
    
    // Default Church encodings by dimension
    const defaults: Record<number, string> = {
      0: 'λf.λx.x',
      1: 'λn.λf.λx.f(nfx)',
      2: 'λx.λy.λf.fxy',
      3: 'λm.λn.λf.λx.mf(nfx)',
      4: 'λm.λn.λf.m(nf)',
      5: 'λm.λn.nm',
      6: 'λf.(λx.f(xx))(λx.f(xx))',
      7: '|ψ⟩ = α|0⟩ + β|1⟩'
    };
    
    return defaults[dimension] || 'λf.λx.x';
  }

  private getPurposeForDimension(dimension: number, type: 'topology' | 'system'): string {
    const purposes: Record<number, { topology: string; system: string }> = {
      0: { topology: 'Maintain quantum vacuum topology', system: 'Church Numeral Zero' },
      1: { topology: 'Handle temporal evolution', system: 'Church Successor' },
      2: { topology: 'Manage spatial structure', system: 'Church Pair' },
      3: { topology: 'Perform Church algebra', system: 'Church Addition' },
      4: { topology: 'Manage spacetime operations', system: 'Network Operations' },
      5: { topology: 'Implement consensus', system: 'Blockchain System' },
      6: { topology: 'Handle emergent AI', system: 'Neural Network' },
      7: { topology: 'Manage quantum superposition', system: 'Qubit System' }
    };
    return purposes[dimension]?.[type] || 'Unknown purpose';
  }

  private getDependenciesForDimension(dimension: number): string[] {
    if (dimension === 0) return [];
    return [`${dimension - 1}D-topology`];
  }

  private getColorForDimension(dimension: number): string {
    const colors = [
      '#6366f1', // 0D - indigo
      '#8b5cf6', // 1D - purple
      '#ec4899', // 2D - pink
      '#f43f5e', // 3D - rose
      '#f97316', // 4D - orange
      '#eab308', // 5D - yellow
      '#22c55e', // 6D - green
      '#06b6d4'  // 7D - cyan
    ];
    return colors[dimension] || '#9ca3af';
  }

  private getShapeForDimension(dimension: number, type: 'topology' | 'system'): 'sphere' | 'cube' | 'torus' | 'octahedron' | 'tetrahedron' | 'icosahedron' {
    if (type === 'system') return 'cube';
    
    const shapes: Array<'sphere' | 'torus' | 'octahedron' | 'tetrahedron' | 'icosahedron'> = [
      'sphere',      // 0D
      'torus',       // 1D
      'octahedron',  // 2D
      'tetrahedron', // 3D
      'icosahedron', // 4D
      'torus',       // 5D
      'octahedron',  // 6D
      'icosahedron'  // 7D
    ];
    return shapes[dimension] || 'sphere';
  }

  private getSizeForDimension(dimension: number): number {
    return 0.5 + (dimension * 0.1);
  }

  private getCapabilitiesForDimension(dimension: number, type: 'topology' | 'system'): string[] {
    const capabilities: Record<number, { topology: string[]; system: string[] }> = {
      0: { topology: ['Identity', 'Vacuum'], system: ['Church Zero', 'Base'] },
      1: { topology: ['Temporal', 'Evolution'], system: ['Successor', 'Increment'] },
      2: { topology: ['Spatial', 'Structure'], system: ['Pair', 'Cons'] },
      3: { topology: ['Algebraic', 'Operations'], system: ['Addition', 'Multiplication'] },
      4: { topology: ['Spacetime', 'Network'], system: ['IPv4', 'IPv6', 'Localhost'] },
      5: { topology: ['Consensus', 'Immutable'], system: ['Blockchain', 'Merkle-Patricia'] },
      6: { topology: ['Intelligence', 'Emergent'], system: ['Neural Network', 'Transformer'] },
      7: { topology: ['Quantum', 'Superposition'], system: ['Qubit', 'Bloch Sphere'] }
    };
    return capabilities[dimension]?.[type] || [];
  }
}

export const grokMetaverseService: GrokMetaverseService = new GrokMetaverseServiceImpl();
