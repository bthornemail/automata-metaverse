/**
 * Mock Agent API Client
 * 
 * Implements the AgentAPI interface with mock data for testing.
 */

import { Agent, AgentRequest, AgentResponse, AgentAPI, AgentStatus } from './types';

export class MockAgentAPIClient implements AgentAPI {
  private agents: Agent[] = [
    {
      id: '0D-Topology-Agent',
      name: '0D Topology Agent',
      dimension: '0D',
      status: 'active',
      capabilities: ['topology', 'identity', 'church-encoding'],
      description: 'Maintains quantum vacuum topology and identity processes',
      dependencies: []
    },
    {
      id: '1D-Temporal-Agent',
      name: '1D Temporal Agent',
      dimension: '1D',
      status: 'active',
      capabilities: ['temporal', 'evolution', 'successor'],
      description: 'Handles temporal evolution and Church successor operations',
      dependencies: ['0D-Topology-Agent']
    },
    {
      id: '2D-Structural-Agent',
      name: '2D Structural Agent',
      dimension: '2D',
      status: 'active',
      capabilities: ['structural', 'pattern-encoding', 'pairs'],
      description: 'Manages spatial structure and pattern encoding',
      dependencies: ['1D-Temporal-Agent']
    },
    {
      id: '3D-Algebraic-Agent',
      name: '3D Algebraic Agent',
      dimension: '3D',
      status: 'active',
      capabilities: ['algebra', 'addition', 'multiplication', 'exponentiation'],
      description: 'Performs Church algebra operations',
      dependencies: ['2D-Structural-Agent']
    },
    {
      id: '4D-Network-Agent',
      name: '4D Network Agent',
      dimension: '4D',
      status: 'active',
      capabilities: ['network', 'ipv4', 'ipv6', 'deployment', 'ci-cd'],
      description: 'Manages spacetime and network operations',
      dependencies: ['3D-Algebraic-Agent']
    },
    {
      id: '5D-Consensus-Agent',
      name: '5D Consensus Agent',
      dimension: '5D',
      status: 'active',
      capabilities: ['consensus', 'blockchain', 'approval', 'voting'],
      description: 'Implements distributed consensus and blockchain operations',
      dependencies: ['4D-Network-Agent']
    },
    {
      id: '6D-Intelligence-Agent',
      name: '6D Intelligence Agent',
      dimension: '6D',
      status: 'active',
      capabilities: ['ai', 'neural-networks', 'analysis', 'optimization'],
      description: 'Handles emergent AI and neural network operations',
      dependencies: ['5D-Consensus-Agent']
    },
    {
      id: '7D-Quantum-Agent',
      name: '7D Quantum Agent',
      dimension: '7D',
      status: 'active',
      capabilities: ['quantum', 'superposition', 'entanglement', 'qubits'],
      description: 'Manages quantum superposition and entanglement',
      dependencies: ['6D-Intelligence-Agent']
    },
    {
      id: 'Query-Interface-Agent',
      name: 'Query Interface Agent',
      dimension: null,
      status: 'active',
      capabilities: ['sparql', 'repl', 'query'],
      description: 'Provides SPARQL/REPL access to the system',
      dependencies: []
    },
    {
      id: 'Visualization-Agent',
      name: 'Visualization Agent',
      dimension: null,
      status: 'active',
      capabilities: ['visualization', 'webgl', 'threejs'],
      description: 'Handles WebGL-based 3D visualization',
      dependencies: []
    }
  ];

  /**
   * Simulate network delay
   */
  private async delay(ms: number = 100): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * List all available agents
   */
  async listAgents(): Promise<Agent[]> {
    await this.delay(50);
    return Promise.resolve([...this.agents]);
  }

  /**
   * Get specific agent by ID
   */
  async getAgent(agentId: string): Promise<Agent> {
    await this.delay(30);
    const agent = this.agents.find(a => a.id === agentId);
    if (!agent) {
      throw new Error(`Agent not found: ${agentId}`);
    }
    return Promise.resolve({ ...agent });
  }

  /**
   * Execute an operation on an agent
   */
  async execute(request: AgentRequest): Promise<AgentResponse> {
    await this.delay(200); // Simulate processing time

    const agent = this.agents.find(a => a.id === request.agentId);
    if (!agent) {
      return {
        success: false,
        error: `Agent not found: ${request.agentId}`,
        agentId: request.agentId,
        operation: request.operation
      };
    }

    // Simulate different responses based on operation
    let result: any;
    let success = true;
    let error: string | undefined;

    switch (request.operation) {
      case 'query':
        result = {
          query: request.parameters?.query || '',
          results: [
            { id: 'result1', value: 'Sample result' },
            { id: 'result2', value: 'Another result' }
          ]
        };
        break;

      case 'analyze':
        result = {
          analysis: {
            totalItems: 100,
            processed: 100,
            successRate: 0.95
          }
        };
        break;

      case 'execute':
        result = {
          executed: true,
          parameters: request.parameters,
          timestamp: new Date().toISOString()
        };
        break;

      default:
        result = {
          operation: request.operation,
          parameters: request.parameters,
          executed: true,
          agent: agent.name
        };
    }

    // Simulate occasional errors
    if (Math.random() < 0.1) {
      success = false;
      error = 'Simulated error for testing';
    }

    return {
      success,
      result,
      error,
      agentId: request.agentId,
      operation: request.operation,
      duration: 150 + Math.random() * 100
    };
  }

  /**
   * Get agent status
   */
  async getAgentStatus(agentId: string): Promise<AgentStatus> {
    const agent = await this.getAgent(agentId);
    return agent.status;
  }

  /**
   * Health check
   */
  async healthCheck(): Promise<boolean> {
    await this.delay(20);
    return Promise.resolve(true);
  }
}
