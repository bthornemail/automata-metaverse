/**
 * Agent Workflow Engine
 * 
 * Executes complex workflows involving multiple agent operations
 */

import { AgentRequest, AgentResponse, Agent } from './types';
import { AgentAPI } from './types';

export type WorkflowType = 'sequential' | 'parallel' | 'conditional' | 'loop';

export interface WorkflowStep {
  id: string;
  agentId: string;
  operation: string;
  parameters?: Record<string, any>;
  condition?: (previousResults: any[]) => boolean;
  onSuccess?: string; // Next step ID
  onFailure?: string; // Next step ID
}

export interface Workflow {
  id: string;
  name: string;
  type: WorkflowType;
  steps: WorkflowStep[];
  onComplete?: (results: WorkflowResult[]) => void;
  onError?: (error: Error) => void;
}

export interface WorkflowResult {
  stepId: string;
  agentId: string;
  operation: string;
  success: boolean;
  result?: any;
  error?: string;
  duration: number;
}

export class WorkflowEngine {
  private client: AgentAPI;

  constructor(client: AgentAPI) {
    this.client = client;
  }

  /**
   * Execute a workflow
   */
  async execute(workflow: Workflow): Promise<WorkflowResult[]> {
    const results: WorkflowResult[] = [];

    try {
      switch (workflow.type) {
        case 'sequential':
          return await this.executeSequential(workflow, results);
        case 'parallel':
          return await this.executeParallel(workflow, results);
        case 'conditional':
          return await this.executeConditional(workflow, results);
        case 'loop':
          return await this.executeLoop(workflow, results);
        default:
          throw new Error(`Unknown workflow type: ${workflow.type}`);
      }
    } catch (error) {
      if (workflow.onError) {
        workflow.onError(error instanceof Error ? error : new Error('Workflow execution failed'));
      }
      throw error;
    }
  }

  /**
   * Execute steps sequentially
   */
  private async executeSequential(workflow: Workflow, results: WorkflowResult[]): Promise<WorkflowResult[]> {
    let currentStep: WorkflowStep | undefined = workflow.steps[0];
    const executedSteps = new Set<string>();

    while (currentStep && !executedSteps.has(currentStep.id)) {
      executedSteps.add(currentStep.id);

      const result = await this.executeStep(currentStep, results);
      results.push(result);

      if (!result.success && currentStep.onFailure) {
        currentStep = workflow.steps.find(s => s.id === currentStep!.onFailure);
      } else if (result.success && currentStep.onSuccess) {
        currentStep = workflow.steps.find(s => s.id === currentStep!.onSuccess);
      } else {
        // Move to next step in sequence
        const currentIndex = workflow.steps.findIndex(s => s.id === currentStep!.id);
        currentStep = workflow.steps[currentIndex + 1];
      }
    }

    if (workflow.onComplete) {
      workflow.onComplete(results);
    }

    return results;
  }

  /**
   * Execute steps in parallel
   */
  private async executeParallel(workflow: Workflow, results: WorkflowResult[]): Promise<WorkflowResult[]> {
    const promises = workflow.steps.map(step => this.executeStep(step, results));
    const stepResults = await Promise.all(promises);
    results.push(...stepResults);

    if (workflow.onComplete) {
      workflow.onComplete(results);
    }

    return results;
  }

  /**
   * Execute conditional workflow
   */
  private async executeConditional(workflow: Workflow, results: WorkflowResult[]): Promise<WorkflowResult[]> {
    for (const step of workflow.steps) {
      // Check condition if present
      if (step.condition && !step.condition(results.map(r => r.result))) {
        continue;
      }

      const result = await this.executeStep(step, results);
      results.push(result);

      if (!result.success && step.onFailure) {
        const failureStep = workflow.steps.find(s => s.id === step.onFailure);
        if (failureStep) {
          const failureResult = await this.executeStep(failureStep, results);
          results.push(failureResult);
        }
        break;
      }
    }

    if (workflow.onComplete) {
      workflow.onComplete(results);
    }

    return results;
  }

  /**
   * Execute loop workflow
   */
  private async executeLoop(workflow: Workflow, results: WorkflowResult[]): Promise<WorkflowResult[]> {
    const loopStep = workflow.steps[0];
    if (!loopStep) {
      throw new Error('Loop workflow requires at least one step');
    }

    let iteration = 0;
    const maxIterations = 100; // Safety limit

    while (iteration < maxIterations) {
      const result = await this.executeStep(loopStep, results);
      results.push(result);

      // Check if we should continue looping
      if (loopStep.condition && !loopStep.condition(results.map(r => r.result))) {
        break;
      }

      iteration++;
    }

    if (workflow.onComplete) {
      workflow.onComplete(results);
    }

    return results;
  }

  /**
   * Execute a single workflow step
   */
  private async executeStep(step: WorkflowStep, previousResults: WorkflowResult[]): Promise<WorkflowResult> {
    const startTime = Date.now();

    try {
      const request: AgentRequest = {
        agentId: step.agentId,
        operation: step.operation,
        parameters: {
          ...step.parameters,
          previousResults: previousResults.map(r => r.result)
        }
      };

      const response = await this.client.execute(request);

      return {
        stepId: step.id,
        agentId: step.agentId,
        operation: step.operation,
        success: response.success,
        result: response.result,
        error: response.error,
        duration: Date.now() - startTime
      };
    } catch (error) {
      return {
        stepId: step.id,
        agentId: step.agentId,
        operation: step.operation,
        success: false,
        error: error instanceof Error ? error.message : 'Step execution failed',
        duration: Date.now() - startTime
      };
    }
  }
}

/**
 * Workflow Builder for creating workflows programmatically
 */
export class WorkflowBuilder {
  private workflow: Partial<Workflow> = {
    steps: []
  };

  setId(id: string): this {
    this.workflow.id = id;
    return this;
  }

  setName(name: string): this {
    this.workflow.name = name;
    return this;
  }

  setType(type: WorkflowType): this {
    this.workflow.type = type;
    return this;
  }

  addStep(step: WorkflowStep): this {
    if (!this.workflow.steps) {
      this.workflow.steps = [];
    }
    this.workflow.steps.push(step);
    return this;
  }

  onComplete(callback: (results: WorkflowResult[]) => void): this {
    this.workflow.onComplete = callback;
    return this;
  }

  onError(callback: (error: Error) => void): this {
    this.workflow.onError = callback;
    return this;
  }

  build(): Workflow {
    if (!this.workflow.id || !this.workflow.name || !this.workflow.type || !this.workflow.steps) {
      throw new Error('Workflow must have id, name, type, and at least one step');
    }
    return this.workflow as Workflow;
  }
}
