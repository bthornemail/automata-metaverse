/**
 * Agent API Type Definitions
 * 
 * Defines the types and interfaces for the Agent API client.
 */

/**
 * Agent status
 */
export type AgentStatus = 'active' | 'inactive' | 'busy' | 'error';

/**
 * Agent dimension (0D-7D)
 */
export type AgentDimension = '0D' | '1D' | '2D' | '3D' | '4D' | '5D' | '6D' | '7D' | null;

/**
 * Agent definition
 */
export interface Agent {
  id: string;
  name: string;
  dimension?: AgentDimension;
  status: AgentStatus;
  capabilities: string[];
  description?: string;
  dependencies?: string[];
}

/**
 * Agent operation request
 */
export interface AgentRequest {
  agentId: string;
  operation: string;
  parameters?: Record<string, any>;
  timeout?: number;
}

/**
 * Agent operation response
 */
export interface AgentResponse {
  success: boolean;
  result?: any;
  error?: string;
  agentId: string;
  operation: string;
  duration?: number;
}

/**
 * Agent API interface
 */
export interface AgentAPI {
  // Discovery
  listAgents(): Promise<Agent[]>;
  getAgent(agentId: string): Promise<Agent>;
  
  // Execution
  execute(request: AgentRequest): Promise<AgentResponse>;
  
  // Status
  getAgentStatus(agentId: string): Promise<AgentStatus>;
  
  // Health
  healthCheck(): Promise<boolean>;
}

/**
 * Agent API configuration
 */
export interface AgentAPIConfig {
  baseURL: string;
  apiKey?: string;
  timeout?: number;
  useMock?: boolean;
}

/**
 * Agent execution result
 */
export interface AgentExecutionResult {
  agent: Agent;
  response: AgentResponse;
  timestamp: Date;
}
