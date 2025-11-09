/**
 * Coordination Engine Tests
 */

import { describe, test, expect, beforeEach, vi } from 'vitest';
import { CoordinationEngine, CoordinationTask } from '../coordination-engine';
import { AgentAPI, AgentResponse } from '../types';

describe('CoordinationEngine', () => {
  let mockClient: {
    listAgents: ReturnType<typeof vi.fn>;
    getAgent: ReturnType<typeof vi.fn>;
    execute: ReturnType<typeof vi.fn>;
    getAgentStatus: ReturnType<typeof vi.fn>;
    healthCheck: ReturnType<typeof vi.fn>;
  };
  let coordinator: CoordinationEngine;

  beforeEach(() => {
    mockClient = {
      listAgents: vi.fn(),
      getAgent: vi.fn(),
      execute: vi.fn(),
      getAgentStatus: vi.fn(),
      healthCheck: vi.fn()
    };

    coordinator = new CoordinationEngine(mockClient);
  });

  describe('Parallel Coordination', () => {
    test('coordinates agents in parallel', async () => {
      mockClient.execute
        .mockResolvedValue({
          success: true,
          result: { done: true },
          agentId: 'agent1',
          operation: 'op1'
        });

      const task: CoordinationTask = {
        id: 'task1',
        agents: ['agent1', 'agent2'],
        operation: 'op1',
        strategy: 'parallel'
      };

      const result = await coordinator.coordinate(task);

      expect(result.success).toBe(true);
      expect(result.results.size).toBe(2);
      expect(mockClient.execute).toHaveBeenCalledTimes(2);
    });
  });

  describe('Sequential Coordination', () => {
    test('coordinates agents sequentially', async () => {
      mockClient.execute
        .mockResolvedValue({
          success: true,
          result: { done: true },
          agentId: 'agent1',
          operation: 'op1'
        });

      const task: CoordinationTask = {
        id: 'task1',
        agents: ['agent1', 'agent2'],
        operation: 'op1',
        strategy: 'sequential'
      };

      const result = await coordinator.coordinate(task);

      expect(result.success).toBe(true);
      expect(result.results.size).toBe(2);
      expect(mockClient.execute).toHaveBeenCalledTimes(2);
    });
  });

  describe('Result Merging', () => {
    test('merges results from multiple agents', async () => {
      mockClient.execute
        .mockResolvedValue({
          success: true,
          result: { data: 'result1' },
          agentId: 'agent1',
          operation: 'op1'
        });

      const task: CoordinationTask = {
        id: 'task1',
        agents: ['agent1', 'agent2'],
        operation: 'op1',
        strategy: 'parallel'
      };

      const result = await coordinator.coordinate(task);

      expect(result.mergedResult).toBeDefined();
      expect(result.mergedResult.merged).toBe(true);
      expect(result.mergedResult.count).toBe(2);
    });
  });
});
