/**
 * Agent Service Tests
 */

import { AgentService } from '../agent-service';

describe('AgentService', () => {
  let service: AgentService;

  beforeEach(() => {
    service = new AgentService();
  });

  test('lists all agents', async () => {
    const agents = await service.listAgents();
    expect(agents.length).toBeGreaterThan(0);
    expect(agents[0]).toHaveProperty('id');
    expect(agents[0]).toHaveProperty('name');
    expect(agents[0]).toHaveProperty('status');
  });

  test('gets specific agent', async () => {
    const agent = await service.getAgent('0D-Topology-Agent');
    expect(agent.id).toBe('0D-Topology-Agent');
    expect(agent.name).toBe('0D Topology Agent');
  });

  test('throws error for non-existent agent', async () => {
    await expect(service.getAgent('NonExistent-Agent')).rejects.toThrow();
  });

  test('executes operation', async () => {
    const response = await service.execute({
      agentId: '0D-Topology-Agent',
      operation: 'query',
      parameters: { query: 'test' }
    });

    expect(response.success).toBe(true);
    expect(response.agentId).toBe('0D-Topology-Agent');
    expect(response.result).toBeDefined();
  });

  test('returns error for non-existent agent execution', async () => {
    const response = await service.execute({
      agentId: 'NonExistent-Agent',
      operation: 'query'
    });

    expect(response.success).toBe(false);
    expect(response.error).toBeDefined();
  });

  test('health check returns true', async () => {
    const healthy = await service.healthCheck();
    expect(healthy).toBe(true);
  });

  test('gets agent count', async () => {
    const count = await service.getAgentCount();
    expect(count).toBeGreaterThan(0);
  });

  test('gets healthy agent count', async () => {
    const healthyCount = await service.getHealthyAgentCount();
    expect(healthyCount).toBeGreaterThan(0);
  });
});
