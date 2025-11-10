/**
 * CanvasL Parser for Collaborative World
 * Parses CanvasL scripts and initializes collaborative world systems
 */

import {
  CanvasLWorldScript,
  Agent,
  R5RSCall,
  MovementPatternDef,
  InteractionTypeDef,
  LearningRule,
  CollaborativeWorldConfig
} from './types';
import { databaseService } from '../database-service';

export interface CanvasLParser {
  parseScript(content: string): Promise<CanvasLWorldScript>;
  loadFromFile(filePath: string): Promise<CanvasLWorldScript>;
}

class CanvasLParserImpl implements CanvasLParser {
  async parseScript(content: string): Promise<CanvasLWorldScript> {
    const lines = content.split('\n');
    const directives: Record<string, string> = {};
    const objects: any[] = [];

    // Parse directives
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (line.startsWith('@')) {
        const [key, ...valueParts] = line.substring(1).split(':');
        const value = valueParts.join(':').trim().replace(/^["']|["']$/g, '');
        directives[key.trim()] = value;
      } else if (line.startsWith('{')) {
        // Parse JSON object
        try {
          const obj = JSON.parse(line);
          objects.push(obj);
        } catch (error) {
          console.warn(`Failed to parse line ${i + 1}:`, error);
        }
      }
    }

    // Extract components
    const agents: Agent[] = [];
    const r5rsCalls: R5RSCall[] = [];
    const movementPatterns: MovementPatternDef[] = [];
    const interactionTypes: InteractionTypeDef[] = [];
    const learningRules: LearningRule[] = [];
    let config: CollaborativeWorldConfig = {
      worldSize: 200,
      agentCount: 8,
      interactionRadius: 10,
      learningRate: 0.01,
      backpropDepth: 3,
      propagationDelay: 100
    };

    objects.forEach(obj => {
      if (obj.type === 'agent') {
        agents.push({
          id: obj.id,
          dimension: obj.dimension,
          name: obj.name,
          position: obj.position || [0, 0, 0],
          velocity: obj.velocity || [0, 0, 0],
          rotation: obj.rotation || [0, 0, 0],
          interactionRange: obj.interactionRange || 'personal',
          learningEnabled: obj.learningEnabled !== false,
          isMoving: false,
          animationState: 'idle'
        });
      } else if (obj.type === 'r5rs-call') {
        r5rsCalls.push({
          id: obj.id,
          type: 'r5rs-call',
          function: obj.function,
          args: obj.args || [],
          description: obj.description || '',
          component: obj.component
        });
      } else if (obj.type === 'movement-pattern') {
        movementPatterns.push({
          id: obj.id,
          type: 'movement-pattern',
          name: obj.name,
          r5rsExpression: obj.r5rsExpression || '',
          description: obj.description || ''
        });
      } else if (obj.type === 'interaction-type') {
        interactionTypes.push({
          id: obj.id,
          type: 'interaction-type',
          name: obj.name,
          propagationLevels: obj.propagationLevels || [],
          learningWeight: obj.learningWeight || 0.1,
          description: obj.description || ''
        });
      } else if (obj.type === 'learning-rule') {
        learningRules.push({
          id: obj.id,
          type: 'learning-rule',
          name: obj.name,
          r5rsExpression: obj.r5rsExpression || '',
          description: obj.description || ''
        });
      } else if (obj.type === 'config') {
        config = {
          ...config,
          ...obj
        };
      }
    });

    // Build systems structure
    const movementSystem = {
      id: 'agent-movement-system',
      name: 'Agent Movement System',
      components: {
        movementController: {
          id: 'movement-controller',
          name: 'Movement Controller',
          system: 'agent-movement-system',
          r5rsFunctions: ['r5rs:church-add', 'r5rs:church-mult'],
          description: 'Controls agent movement using Church encoding'
        },
        physicsEngine: {
          id: 'physics-engine',
          name: 'Physics Engine',
          system: 'agent-movement-system',
          r5rsFunctions: ['r5rs:church-add', 'r5rs:church-mult'],
          description: 'Handles physics simulation'
        },
        collisionDetector: {
          id: 'collision-detector',
          name: 'Collision Detector',
          system: 'agent-movement-system',
          r5rsFunctions: ['r5rs:church-add'],
          description: 'Detects collisions'
        }
      }
    };

    const propagationSystem = {
      id: 'interaction-propagation-system',
      name: 'Interaction Propagation System',
      components: {
        propagationRouter: {
          id: 'propagation-router',
          name: 'Propagation Router',
          system: 'interaction-propagation-system',
          r5rsFunctions: ['r5rs:church-add', 'r5rs:church-mult'],
          description: 'Routes interactions'
        },
        interactionQueue: {
          id: 'interaction-queue',
          name: 'Interaction Queue',
          system: 'interaction-propagation-system',
          r5rsFunctions: ['r5rs:church-add'],
          description: 'Manages interaction queue'
        },
        learningBackprop: {
          id: 'learning-backprop',
          name: 'Learning Back Propagation',
          system: 'interaction-propagation-system',
          r5rsFunctions: ['r5rs:church-mult', 'r5rs:church-exp'],
          description: 'Handles back propagation'
        }
      }
    };

    const learningSystem = {
      id: 'learning-system',
      name: 'Learning System',
      components: {
        neuralNetwork: {
          id: 'neural-network',
          name: 'Neural Network',
          system: 'learning-system',
          r5rsFunctions: ['r5rs:church-add', 'r5rs:church-mult', 'r5rs:church-exp'],
          description: 'Neural network for learning'
        },
        gradientDescent: {
          id: 'gradient-descent',
          name: 'Gradient Descent',
          system: 'learning-system',
          r5rsFunctions: ['r5rs:church-add', 'r5rs:church-mult'],
          description: 'Gradient descent optimizer'
        },
        knowledgeGraph: {
          id: 'knowledge-graph',
          name: 'Knowledge Graph',
          system: 'learning-system',
          r5rsFunctions: ['r5rs:church-add'],
          description: 'Knowledge graph storage'
        }
      }
    };

    return {
      version: directives.version || '1.0',
      schema: directives.schema || 'canvasl-v1',
      r5rsEngine: directives['r5rs-engine'] || 'r5rs-canvas-engine.scm',
      dimension: directives.dimension || '4D-6D',
      phase: directives.phase || 'ai-portal-collaborative-world',
      systems: {
        movement: movementSystem,
        propagation: propagationSystem,
        learning: learningSystem
      },
      agents,
      r5rsCalls,
      movementPatterns,
      interactionTypes,
      learningRules,
      config
    };
  }

  async loadFromFile(filePath: string): Promise<CanvasLWorldScript> {
    try {
      // Try to fetch as text file first (for public folder files)
      if (filePath.startsWith('/') || filePath.startsWith('http')) {
        try {
          const response = await fetch(filePath);
          if (response.ok) {
            const text = await response.text();
            return this.parseScript(text);
          } else {
            throw new Error(`Failed to fetch ${filePath}: ${response.status} ${response.statusText}`);
          }
        } catch (fetchError) {
          console.warn(`[CanvasLParser] Failed to fetch ${filePath}:`, fetchError);
          // Continue to try other methods
        }
      }

      // Try database service for JSONL files (only if databaseService is available)
      try {
        if (typeof databaseService !== 'undefined' && databaseService?.readJSONL) {
          const content = await databaseService.readJSONL(filePath);
          // If it's already parsed JSONL, convert to string and parse
          if (Array.isArray(content)) {
            const contentStr = content.map(obj => JSON.stringify(obj)).join('\n');
            return this.parseScript(contentStr);
          }
        }
      } catch (dbError) {
        // Database service failed or not available, try direct file read
        console.warn(`[CanvasLParser] Database service failed for ${filePath}:`, dbError);
      }

      // Fallback: try as relative path
      try {
        const response = await fetch(filePath);
        if (response.ok) {
          const text = await response.text();
          return this.parseScript(text);
        } else {
          throw new Error(`Failed to fetch ${filePath}: ${response.status} ${response.statusText}`);
        }
      } catch (fetchError) {
        console.warn(`[CanvasLParser] Fallback fetch failed for ${filePath}:`, fetchError);
        throw new Error(`Could not load CanvasL file from ${filePath}: ${fetchError instanceof Error ? fetchError.message : String(fetchError)}`);
      }
    } catch (error) {
      console.error(`[CanvasLParser] Failed to load CanvasL script from ${filePath}:`, {
        error,
        errorType: error?.constructor?.name,
        errorMessage: error?.message,
        errorStack: error?.stack
      });
      throw error;
    }
  }
}

export const canvaslParser: CanvasLParser = new CanvasLParserImpl();
