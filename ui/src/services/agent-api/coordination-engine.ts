/**
 * Multi-Agent Coordination Engine
 * 
 * Coordinates tasks across multiple agents
 */

import { AgentRequest, AgentResponse, Agent } from './types';
import { AgentAPI } from './types';
import { WorkflowEngine, WorkflowResult } from './workflow-engine';
import { createMultiAgentWorkflow } from './workflows/multi-agent-workflow';

export interface CoordinationTask {
  id: string;
  agents: string[];
  operation: string;
  parameters?: Record<string, any>;
  strategy: 'parallel' | 'sequential' | 'hierarchical';
}

export interface CoordinationResult {
  taskId: string;
  success: boolean;
  results: Map<string, AgentResponse>;
  mergedResult?: any;
  errors: Map<string, string>;
  duration: number;
}

export class CoordinationEngine {
  private client: AgentAPI;
  private workflowEngine: WorkflowEngine;

  constructor(client: AgentAPI) {
    this.client = client;
    this.workflowEngine = new WorkflowEngine(client);
  }

  /**
   * Coordinate a task across multiple agents
   */
  async coordinate(task: CoordinationTask): Promise<CoordinationResult> {
    const startTime = Date.now();
    const results = new Map<string, AgentResponse>();
    const errors = new Map<string, string>();

    try {
      switch (task.strategy) {
        case 'parallel':
          return await this.coordinateParallel(task, results, errors, startTime);
        case 'sequential':
          return await this.coordinateSequential(task, results, errors, startTime);
        case 'hierarchical':
          return await this.coordinateHierarchical(task, results, errors, startTime);
        default:
          throw new Error(`Unknown coordination strategy: ${task.strategy}`);
      }
    } catch (error) {
      return {
        taskId: task.id,
        success: false,
        results,
        errors,
        duration: Date.now() - startTime
      };
    }
  }

  /**
   * Coordinate agents in parallel
   */
  private async coordinateParallel(
    task: CoordinationTask,
    results: Map<string, AgentResponse>,
    errors: Map<string, string>,
    startTime: number
  ): Promise<CoordinationResult> {
    const workflow = createMultiAgentWorkflow(task.agents, task.operation, task.parameters);
    const workflowResults = await this.workflowEngine.execute(workflow);

    workflowResults.forEach(result => {
      if (result.success) {
        results.set(result.agentId, {
          success: true,
          result: result.result,
          agentId: result.agentId,
          operation: result.operation,
          duration: result.duration
        });
      } else {
        errors.set(result.agentId, result.error || 'Unknown error');
      }
    });

    const mergedResult = this.mergeResults(Array.from(results.values()));

    return {
      taskId: task.id,
      success: errors.size === 0,
      results,
      mergedResult,
      errors,
      duration: Date.now() - startTime
    };
  }

  /**
   * Coordinate agents sequentially
   */
  private async coordinateSequential(
    task: CoordinationTask,
    results: Map<string, AgentResponse>,
    errors: Map<string, string>,
    startTime: number
  ): Promise<CoordinationResult> {
    for (const agentId of task.agents) {
      try {
        const request: AgentRequest = {
          agentId,
          operation: task.operation,
          parameters: {
            ...task.parameters,
            previousResults: Array.from(results.values()).map(r => r.result)
          }
        };

        const response = await this.client.execute(request);
        results.set(agentId, response);

        if (!response.success) {
          errors.set(agentId, response.error || 'Execution failed');
          break; // Stop on first error
        }
      } catch (error) {
        errors.set(agentId, error instanceof Error ? error.message : 'Unknown error');
        break;
      }
    }

    const mergedResult = this.mergeResults(Array.from(results.values()));

    return {
      taskId: task.id,
      success: errors.size === 0,
      results,
      mergedResult,
      errors,
      duration: Date.now() - startTime
    };
  }

  /**
   * Coordinate agents hierarchically (parent-child relationships)
   */
  private async coordinateHierarchical(
    task: CoordinationTask,
    results: Map<string, AgentResponse>,
    errors: Map<string, string>,
    startTime: number
  ): Promise<CoordinationResult> {
    // First agent is the coordinator
    const coordinatorId = task.agents[0];
    const workerIds = task.agents.slice(1);

    // Execute coordinator first
    try {
      const coordinatorRequest: AgentRequest = {
        agentId: coordinatorId,
        operation: task.operation,
        parameters: {
          ...task.parameters,
          workers: workerIds
        }
      };

      const coordinatorResponse = await this.client.execute(coordinatorRequest);
      results.set(coordinatorId, coordinatorResponse);

      if (!coordinatorResponse.success) {
        errors.set(coordinatorId, coordinatorResponse.error || 'Coordinator failed');
        return {
          taskId: task.id,
          success: false,
          results,
          errors,
          duration: Date.now() - startTime
        };
      }
    } catch (error) {
      errors.set(coordinatorId, error instanceof Error ? error.message : 'Coordinator error');
      return {
        taskId: task.id,
        success: false,
        results,
        errors,
        duration: Date.now() - startTime
      };
    }

    // Execute workers in parallel
    const workerPromises = workerIds.map(async (workerId) => {
      try {
        const workerRequest: AgentRequest = {
          agentId: workerId,
          operation: task.operation,
          parameters: {
            ...task.parameters,
            coordinatorResult: results.get(coordinatorId)?.result
          }
        };

        const workerResponse = await this.client.execute(workerRequest);
        results.set(workerId, workerResponse);

        if (!workerResponse.success) {
          errors.set(workerId, workerResponse.error || 'Worker failed');
        }
      } catch (error) {
        errors.set(workerId, error instanceof Error ? error.message : 'Worker error');
      }
    });

    await Promise.all(workerPromises);

    const mergedResult = this.mergeResults(Array.from(results.values()));

    return {
      taskId: task.id,
      success: errors.size === 0,
      results,
      mergedResult,
      errors,
      duration: Date.now() - startTime
    };
  }

  /**
   * Merge results from multiple agents
   */
  private mergeResults(responses: AgentResponse[]): any {
    if (responses.length === 0) {
      return null;
    }

    if (responses.length === 1) {
      return responses[0].result;
    }

    // Merge strategy: combine all results into an array
    return {
      merged: true,
      count: responses.length,
      results: responses.map(r => ({
        agentId: r.agentId,
        result: r.result
      })),
      timestamp: new Date().toISOString()
    };
  }
}
