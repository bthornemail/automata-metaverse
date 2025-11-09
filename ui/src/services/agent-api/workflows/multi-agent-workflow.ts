/**
 * Multi-Agent Workflow
 * 
 * Distribute task across multiple agents and merge results
 */

import { WorkflowBuilder, Workflow } from '../workflow-engine';

export function createMultiAgentWorkflow(agentIds: string[], operation: string, parameters?: Record<string, any>): Workflow {
  const builder = new WorkflowBuilder()
    .setId('multi-agent-workflow')
    .setName('Multi-Agent Coordination Workflow')
    .setType('parallel');

  // Add parallel steps for each agent
  agentIds.forEach((agentId, index) => {
    builder.addStep({
      id: `agent-${index}`,
      agentId,
      operation,
      parameters: {
        ...parameters,
        taskId: index,
        totalTasks: agentIds.length
      }
    });
  });

  return builder.build();
}
