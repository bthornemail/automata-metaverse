/**
 * Workflow Engine Tests
 */

import { describe, test, expect, beforeEach, vi } from 'vitest';
import { WorkflowEngine, WorkflowBuilder } from '../workflow-engine';
import { AgentAPI, AgentRequest, AgentResponse } from '../types';

describe('WorkflowEngine', () => {
  let mockClient: {
    listAgents: ReturnType<typeof vi.fn>;
    getAgent: ReturnType<typeof vi.fn>;
    execute: ReturnType<typeof vi.fn>;
    getAgentStatus: ReturnType<typeof vi.fn>;
    healthCheck: ReturnType<typeof vi.fn>;
  };
  let engine: WorkflowEngine;

  beforeEach(() => {
    mockClient = {
      listAgents: vi.fn(),
      getAgent: vi.fn(),
      execute: vi.fn(),
      getAgentStatus: vi.fn(),
      healthCheck: vi.fn()
    };

    engine = new WorkflowEngine(mockClient as any);
  });

  describe('Sequential Workflow', () => {
    test('executes steps sequentially', async () => {
      mockClient.execute
        .mockResolvedValueOnce({
          success: true,
          result: { step1: 'done' },
          agentId: 'agent1',
          operation: 'op1'
        })
        .mockResolvedValueOnce({
          success: true,
          result: { step2: 'done' },
          agentId: 'agent2',
          operation: 'op2'
        });

      const workflow = new WorkflowBuilder()
        .setId('test')
        .setName('Test')
        .setType('sequential')
        .addStep({
          id: 'step1',
          agentId: 'agent1',
          operation: 'op1'
        })
        .addStep({
          id: 'step2',
          agentId: 'agent2',
          operation: 'op2'
        })
        .build();

      const results = await engine.execute(workflow);

      expect(results).toHaveLength(2);
      expect(mockClient.execute).toHaveBeenCalledTimes(2);
    });
  });

  describe('Parallel Workflow', () => {
    test('executes steps in parallel', async () => {
      mockClient.execute
        .mockResolvedValue({
          success: true,
          result: { done: true },
          agentId: 'agent1',
          operation: 'op1'
        });

      const workflow = new WorkflowBuilder()
        .setId('test')
        .setName('Test')
        .setType('parallel')
        .addStep({
          id: 'step1',
          agentId: 'agent1',
          operation: 'op1'
        })
        .addStep({
          id: 'step2',
          agentId: 'agent2',
          operation: 'op2'
        })
        .build();

      const results = await engine.execute(workflow);

      expect(results).toHaveLength(2);
      expect(mockClient.execute).toHaveBeenCalledTimes(2);
    });
  });
});
