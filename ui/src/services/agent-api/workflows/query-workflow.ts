/**
 * Query Workflow
 * 
 * Common workflow: Query → Analyze → Visualize
 */

import { WorkflowBuilder, Workflow } from '../workflow-engine';

export function createQueryWorkflow(): Workflow {
  return new WorkflowBuilder()
    .setId('query-workflow')
    .setName('Query Analysis Workflow')
    .setType('sequential')
    .addStep({
      id: 'query',
      agentId: 'Query-Interface-Agent',
      operation: 'query',
      parameters: {},
      onSuccess: 'analyze',
      onFailure: 'error'
    })
    .addStep({
      id: 'analyze',
      agentId: '6D-Intelligence-Agent',
      operation: 'analyze',
      parameters: {},
      onSuccess: 'visualize',
      onFailure: 'error'
    })
    .addStep({
      id: 'visualize',
      agentId: 'Visualization-Agent',
      operation: 'visualize',
      parameters: {}
    })
    .build();
}
