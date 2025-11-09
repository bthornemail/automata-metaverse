/**
 * Base Agent - Foundation for all blackboard agents
 */

import { EpistemicNode, IBlackboardAgent, IBlackboard, AgentResult } from '../blackboard/types';

export abstract class BaseAgent implements IBlackboardAgent {
  constructor(
    public name: string,
    public priority: number = 0
  ) {}

  abstract canProcess(node: EpistemicNode): boolean;
  abstract process(node: EpistemicNode, blackboard: IBlackboard): Promise<AgentResult>;

  protected log(message: string, ...args: any[]) {
    console.log(`[${this.name}] ${message}`, ...args);
  }

  protected logError(message: string, error: any) {
    console.error(`[${this.name}] ${message}`, error);
  }
}
