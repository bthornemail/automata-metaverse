/**
 * Agent API Service
 * 
 * Main export point for Agent API functionality.
 */

export * from './types';
export * from './client';
export * from './mock-client';

// Factory function to create appropriate client
import { AgentAPI, AgentAPIConfig } from './types';
import { AgentAPIClient } from './client';
import { MockAgentAPIClient } from './mock-client';

export function createAgentAPIClient(config: AgentAPIConfig): AgentAPI {
  if (config.useMock) {
    return new MockAgentAPIClient();
  }
  return new AgentAPIClient(config);
}
