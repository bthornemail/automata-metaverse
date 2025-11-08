/**
 * Canvas Sync Agent - Synchronizes epistemic nodes with canvas visualization
 */

import { BaseAgent } from './BaseAgent';
import { EpistemicNode, IBlackboard, AgentResult, CanvasNode } from '../blackboard/types';

export class CanvasSyncAgent extends BaseAgent {
  constructor() {
    super("CanvasSyncAgent", 10);
  }

  canProcess(node: EpistemicNode): boolean {
    // Process nodes that need canvas synchronization
    return !node.frontmatter.blackboard?.canvasSynced;
  }

  async process(node: EpistemicNode, blackboard: IBlackboard): Promise<AgentResult> {
    try {
      this.log(`Processing node ${node.id} for canvas sync`);

      // Check if node already exists in canvas
      const existingCanvasNode = await blackboard.findCanvasNode(node.id);

      if (!existingCanvasNode) {
        // Create new canvas node
        const canvasNode = this.createCanvasNode(node);
        await blackboard.createCanvasNode(canvasNode);
        this.log(`Created canvas node for ${node.id}`);
      } else {
        // Update existing canvas node
        await blackboard.updateCanvasNode(node.id, {
          metadata: {
            ...existingCanvasNode.metadata,
            lastSync: Date.now(),
            level: node.frontmatter.level,
            difficulty: node.frontmatter.difficulty
          }
        });
        this.log(`Updated canvas node for ${node.id}`);
      }

      // Mark as synced
      await blackboard.updateNode(node.id, {
        blackboard: {
          ...node.frontmatter.blackboard,
          canvasSynced: true,
          lastUpdate: Date.now(),
          assignedAgent: this.name
        }
      });

      return {
        success: true,
        data: { action: existingCanvasNode ? 'updated' : 'created' }
      };
    } catch (error) {
      this.logError('Error processing node', error);
      return {
        success: false,
        issues: [error.message]
      };
    }
  }

  private createCanvasNode(node: EpistemicNode): CanvasNode {
    // Use harmonic positioning based on difficulty and level
    const position = this.calculatePosition(node);
    const color = this.getColorByLevel(node.frontmatter.level);

    return {
      id: node.id,
      type: 'file',
      file: node.path,
      x: position.x,
      y: position.y,
      width: 400,
      height: 300,
      color,
      metadata: {
        epistemicNodeId: node.id,
        level: node.frontmatter.level,
        difficulty: node.frontmatter.difficulty,
        blackboardState: {
          processed: false,
          agentNotes: []
        }
      }
    };
  }

  private calculatePosition(node: EpistemicNode): { x: number, y: number } {
    // Position based on level and difficulty
    const levelMap: Record<string, number> = {
      gateway: 0,
      foundational: 1,
      practical: 2,
      applied: 3
    };

    const levelIndex = levelMap[node.frontmatter.level] || 0;
    const difficulty = node.frontmatter.difficulty || 1;

    // Create a grid-like layout
    const x = levelIndex * 500;
    const y = difficulty * 400;

    // Add some variation to avoid exact overlaps
    const jitter = (Math.abs(this.hashCode(node.id)) % 100) - 50;

    return {
      x: x + jitter,
      y: y + jitter
    };
  }

  private getColorByLevel(level: string): string {
    const colors: Record<string, string> = {
      gateway: '#4ecdc4',
      foundational: '#45b7d1',
      practical: '#96ceb4',
      applied: '#feca57'
    };

    return colors[level] || '#95a5a6';
  }

  private hashCode(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return hash;
  }
}
