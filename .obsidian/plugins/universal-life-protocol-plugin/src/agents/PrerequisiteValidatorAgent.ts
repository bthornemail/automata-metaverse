/**
 * Prerequisite Validator Agent - Validates learning path integrity
 */

import { BaseAgent } from './BaseAgent';
import { EpistemicNode, IBlackboard, AgentResult } from '../blackboard/types';

export class PrerequisiteValidatorAgent extends BaseAgent {
  constructor() {
    super("PrerequisiteValidatorAgent", 20);
  }

  canProcess(node: EpistemicNode): boolean {
    // Process nodes that have prerequisites defined
    return node.frontmatter.prerequisites &&
           node.frontmatter.prerequisites.length > 0;
  }

  async process(node: EpistemicNode, blackboard: IBlackboard): Promise<AgentResult> {
    const issues: string[] = [];

    this.log(`Validating prerequisites for ${node.id}`);

    for (const prereqId of node.frontmatter.prerequisites) {
      // Check if prerequisite exists
      const prereqNode = await blackboard.getNode(prereqId);

      if (!prereqNode) {
        issues.push(`Missing prerequisite: ${prereqId}`);
        this.log(`✗ Missing prerequisite: ${prereqId}`);
        continue;
      }

      // Validate difficulty progression
      if (prereqNode.frontmatter.difficulty > node.frontmatter.difficulty) {
        issues.push(
          `Prerequisite ${prereqId} has higher difficulty ` +
          `(${prereqNode.frontmatter.difficulty} > ${node.frontmatter.difficulty})`
        );
        this.log(`✗ Invalid difficulty progression: ${prereqId}`);
      }

      // Validate level progression
      const levelOrder = ['gateway', 'foundational', 'practical', 'applied'];
      const nodeLevel = levelOrder.indexOf(node.frontmatter.level);
      const prereqLevel = levelOrder.indexOf(prereqNode.frontmatter.level);

      if (prereqLevel > nodeLevel) {
        issues.push(
          `Prerequisite ${prereqId} has higher level ` +
          `(${prereqNode.frontmatter.level} > ${node.frontmatter.level})`
        );
        this.log(`✗ Invalid level progression: ${prereqId}`);
      }

      // Check for circular dependencies
      if (await this.hasCircularDependency(node, prereqNode, blackboard)) {
        issues.push(`Circular dependency detected with ${prereqId}`);
        this.log(`✗ Circular dependency: ${prereqId}`);
      }
    }

    // Update node with validation results
    await blackboard.updateNode(node.id, {
      blackboard: {
        ...node.frontmatter.blackboard,
        validationIssues: issues.length > 0 ? issues : undefined,
        lastUpdate: Date.now(),
        assignedAgent: this.name
      }
    });

    if (issues.length > 0) {
      this.log(`Found ${issues.length} validation issues for ${node.id}`);
      return {
        success: false,
        issues
      };
    }

    this.log(`✓ Prerequisites valid for ${node.id}`);
    return { success: true };
  }

  private async hasCircularDependency(
    node: EpistemicNode,
    prereq: EpistemicNode,
    blackboard: IBlackboard,
    visited: Set<string> = new Set()
  ): Promise<boolean> {
    // Check if we've come full circle
    if (prereq.id === node.id) {
      return true;
    }

    // Check if we've visited this node before (infinite loop protection)
    if (visited.has(prereq.id)) {
      return false;
    }

    visited.add(prereq.id);

    // Check prerequisites of the prerequisite
    if (!prereq.frontmatter.prerequisites) {
      return false;
    }

    for (const subPrereqId of prereq.frontmatter.prerequisites) {
      const subPrereq = await blackboard.getNode(subPrereqId);
      if (!subPrereq) continue;

      if (await this.hasCircularDependency(node, subPrereq, blackboard, visited)) {
        return true;
      }
    }

    return false;
  }
}
