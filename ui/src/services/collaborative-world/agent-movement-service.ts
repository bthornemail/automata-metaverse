/**
 * Agent Movement Service
 * Handles agent movement, physics, and collision detection
 */

import { Agent, MovementPattern, CollaborativeWorldConfig } from './types';
import { databaseService } from '../database-service';

export interface AgentMovementService {
  moveAgent(agentId: string, direction: 'forward' | 'backward' | 'left' | 'right'): Promise<void>;
  moveAgentTo(agentId: string, targetPosition: [number, number, number]): Promise<void>;
  rotateAgent(agentId: string, angle: number): Promise<void>;
  applyMovementPattern(agentId: string, pattern: MovementPattern): Promise<void>;
  calculateVelocity(agentId: string, acceleration: [number, number, number]): Promise<[number, number, number]>;
  calculatePosition(agentId: string, velocity: [number, number, number]): Promise<[number, number, number]>;
  checkCollision(agentId: string, objectPosition: [number, number, number], radius: number): Promise<boolean>;
}

class AgentMovementServiceImpl implements AgentMovementService {
  private agents: Map<string, Agent> = new Map();
  private config: CollaborativeWorldConfig;
  private updateInterval: number | null = null;

  constructor(config: CollaborativeWorldConfig) {
    this.config = config;
    this.setupUpdateLoop();
  }

  // Initialize agents from CanvasL script
  async initializeAgents(agents: Agent[]): Promise<void> {
    agents.forEach(agent => {
      this.agents.set(agent.id, { ...agent });
    });
  }

  // Movement operations
  async moveAgent(agentId: string, direction: 'forward' | 'backward' | 'left' | 'right'): Promise<void> {
    const agent = this.agents.get(agentId);
    if (!agent) {
      throw new Error(`Agent ${agentId} not found`);
    }

    const forwardVector = this.calculateForwardVector(agent.rotation);
    let movementVector: [number, number, number];

    switch (direction) {
      case 'forward':
        movementVector = forwardVector;
        break;
      case 'backward':
        movementVector = [-forwardVector[0], -forwardVector[1], -forwardVector[2]];
        break;
      case 'left':
        movementVector = this.rotateVector90(forwardVector, 'left');
        break;
      case 'right':
        movementVector = this.rotateVector90(forwardVector, 'right');
        break;
    }

    // Use R5RS church-add for position calculation
    const newPosition = await this.r5rsAdd(agent.position, movementVector);
    
    // Check collision before moving
    const collision = await this.checkCollision(agentId, newPosition, 1.0);
    if (collision) {
      return; // Don't move if collision detected
    }

    agent.position = newPosition;
    agent.isMoving = true;
    agent.animationState = 'walking';
  }

  async moveAgentTo(agentId: string, targetPosition: [number, number, number]): Promise<void> {
    const agent = this.agents.get(agentId);
    if (!agent) {
      throw new Error(`Agent ${agentId} not found`);
    }

    agent.targetPosition = targetPosition;
    agent.isMoving = true;
    agent.animationState = 'walking';

    // Calculate direction to target
    const direction = this.calculateDirection(agent.position, targetPosition);
    const distance = this.calculateDistance(agent.position, targetPosition);

    if (distance < 0.1) {
      agent.isMoving = false;
      agent.animationState = 'idle';
      agent.targetPosition = undefined;
      return;
    }

    // Move towards target
    const movementVector: [number, number, number] = [
      direction[0] * 0.1,
      direction[1] * 0.1,
      direction[2] * 0.1
    ];

    const newPosition = await this.r5rsAdd(agent.position, movementVector);
    agent.position = newPosition;
  }

  async rotateAgent(agentId: string, angle: number): Promise<void> {
    const agent = this.agents.get(agentId);
    if (!agent) {
      throw new Error(`Agent ${agentId} not found`);
    }

    // Use R5RS church-mult for rotation
    const newRotation = await this.r5rsMult(agent.rotation, [angle, angle, angle]);
    agent.rotation = newRotation;
  }

  async applyMovementPattern(agentId: string, pattern: MovementPattern): Promise<void> {
    const agent = this.agents.get(agentId);
    if (!agent) {
      throw new Error(`Agent ${agentId} not found`);
    }

    let movementVector: [number, number, number];

    switch (pattern) {
      case 'random':
        movementVector = [
          (Math.random() - 0.5) * 0.2,
          0,
          (Math.random() - 0.5) * 0.2
        ];
        break;

      case 'follow':
        // Find nearest agent
        const nearestAgent = this.findNearestAgent(agentId);
        if (nearestAgent) {
          const direction = this.calculateDirection(agent.position, nearestAgent.position);
          movementVector = [
            direction[0] * 0.1,
            direction[1] * 0.1,
            direction[2] * 0.1
          ];
        } else {
          movementVector = [0, 0, 0];
        }
        break;

      case 'avoid':
        // Find nearest obstacle
        const obstacle = this.findNearestObstacle(agent.position);
        if (obstacle) {
          const direction = this.calculateDirection(obstacle, agent.position);
          movementVector = [
            direction[0] * 0.15,
            direction[1] * 0.15,
            direction[2] * 0.15
          ];
        } else {
          movementVector = [0, 0, 0];
        }
        break;

      case 'flock':
        // Calculate flock center
        const flockCenter = this.calculateFlockCenter(agentId);
        const direction = this.calculateDirection(agent.position, flockCenter);
        movementVector = [
          direction[0] * 0.05,
          direction[1] * 0.05,
          direction[2] * 0.05
        ];
        break;
    }

    const newPosition = await this.r5rsAdd(agent.position, movementVector);
    agent.position = newPosition;
    agent.movementPattern = pattern;
  }

  async calculateVelocity(
    agentId: string,
    acceleration: [number, number, number]
  ): Promise<[number, number, number]> {
    const agent = this.agents.get(agentId);
    if (!agent) {
      throw new Error(`Agent ${agentId} not found`);
    }

    // Use R5RS church-add for velocity calculation
    const newVelocity = await this.r5rsAdd(agent.velocity, acceleration);
    
    // Apply damping
    const dampedVelocity: [number, number, number] = [
      newVelocity[0] * 0.9,
      newVelocity[1] * 0.9,
      newVelocity[2] * 0.9
    ];

    agent.velocity = dampedVelocity;
    return dampedVelocity;
  }

  async calculatePosition(
    agentId: string,
    velocity: [number, number, number]
  ): Promise<[number, number, number]> {
    const agent = this.agents.get(agentId);
    if (!agent) {
      throw new Error(`Agent ${agentId} not found`);
    }

    // Use R5RS church-add for position calculation
    const newPosition = await this.r5rsAdd(agent.position, velocity);
    agent.position = newPosition;
    return newPosition;
  }

  async checkCollision(
    agentId: string,
    objectPosition: [number, number, number],
    radius: number
  ): Promise<boolean> {
    const agent = this.agents.get(agentId);
    if (!agent) {
      return false;
    }

    // Calculate distance using R5RS church-add
    const distance = this.calculateDistance(agent.position, objectPosition);
    return distance < radius;
  }

  // Helper methods
  private calculateForwardVector(rotation: [number, number, number]): [number, number, number] {
    const yaw = rotation[1];
    return [
      Math.sin(yaw),
      0,
      Math.cos(yaw)
    ];
  }

  private rotateVector90(vector: [number, number, number], direction: 'left' | 'right'): [number, number, number] {
    const angle = direction === 'left' ? Math.PI / 2 : -Math.PI / 2;
    return [
      vector[0] * Math.cos(angle) - vector[2] * Math.sin(angle),
      vector[1],
      vector[0] * Math.sin(angle) + vector[2] * Math.cos(angle)
    ];
  }

  private calculateDirection(
    from: [number, number, number],
    to: [number, number, number]
  ): [number, number, number] {
    const dx = to[0] - from[0];
    const dy = to[1] - from[1];
    const dz = to[2] - from[2];
    const length = Math.sqrt(dx * dx + dy * dy + dz * dz);
    if (length === 0) return [0, 0, 0];
    return [dx / length, dy / length, dz / length];
  }

  private calculateDistance(
    a: [number, number, number],
    b: [number, number, number]
  ): number {
    const dx = b[0] - a[0];
    const dy = b[1] - a[1];
    const dz = b[2] - a[2];
    return Math.sqrt(dx * dx + dy * dy + dz * dz);
  }

  private findNearestAgent(agentId: string): Agent | null {
    const agent = this.agents.get(agentId);
    if (!agent) return null;

    let nearest: Agent | null = null;
    let minDistance = Infinity;

    this.agents.forEach((otherAgent) => {
      if (otherAgent.id === agentId) return;
      const distance = this.calculateDistance(agent.position, otherAgent.position);
      if (distance < minDistance) {
        minDistance = distance;
        nearest = otherAgent;
      }
    });

    return nearest;
  }

  private findNearestObstacle(position: [number, number, number]): [number, number, number] | null {
    // Simple obstacle detection - can be extended
    const worldSize = this.config.worldSize;
    const obstacles: [number, number, number][] = [
      [worldSize / 2, 0, worldSize / 2],
      [-worldSize / 2, 0, -worldSize / 2]
    ];

    let nearest: [number, number, number] | null = null;
    let minDistance = Infinity;

    obstacles.forEach(obstacle => {
      const distance = this.calculateDistance(position, obstacle);
      if (distance < minDistance && distance < 5) {
        minDistance = distance;
        nearest = obstacle;
      }
    });

    return nearest;
  }

  private calculateFlockCenter(agentId: string): [number, number, number] {
    const agent = this.agents.get(agentId);
    if (!agent) return [0, 0, 0];

    const neighbors: Agent[] = [];
    this.agents.forEach((otherAgent) => {
      if (otherAgent.id === agentId) return;
      const distance = this.calculateDistance(agent.position, otherAgent.position);
      if (distance < 10) {
        neighbors.push(otherAgent);
      }
    });

    if (neighbors.length === 0) return agent.position;

    const center: [number, number, number] = [0, 0, 0];
    neighbors.forEach(neighbor => {
      center[0] += neighbor.position[0];
      center[1] += neighbor.position[1];
      center[2] += neighbor.position[2];
    });

    center[0] /= neighbors.length;
    center[1] /= neighbors.length;
    center[2] /= neighbors.length;

    return center;
  }

  // R5RS function wrappers
  private async r5rsAdd(a: [number, number, number], b: [number, number, number]): Promise<[number, number, number]> {
    try {
      const result = await databaseService.invokeR5RSFunction('r5rs:church-add', [a, b]);
      return result as [number, number, number];
    } catch (error) {
      // Fallback to direct calculation
      return [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
    }
  }

  private async r5rsMult(a: [number, number, number], b: [number, number, number]): Promise<[number, number, number]> {
    try {
      const result = await databaseService.invokeR5RSFunction('r5rs:church-mult', [a, b]);
      return result as [number, number, number];
    } catch (error) {
      // Fallback to direct calculation
      return [a[0] * b[0], a[1] * b[1], a[2] * b[2]];
    }
  }

  // Update loop
  private setupUpdateLoop(): void {
    this.updateInterval = window.setInterval(() => {
      this.agents.forEach((agent) => {
        if (agent.isMoving && agent.targetPosition) {
          this.moveAgentTo(agent.id, agent.targetPosition).catch(console.error);
        } else if (agent.movementPattern) {
          this.applyMovementPattern(agent.id, agent.movementPattern).catch(console.error);
        }
      });
    }, 16); // ~60 FPS
  }

  // Public getters
  getAgent(agentId: string): Agent | undefined {
    return this.agents.get(agentId);
  }

  getAllAgents(): Agent[] {
    return Array.from(this.agents.values());
  }

  destroy(): void {
    if (this.updateInterval !== null) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
    }
  }
}

// Singleton instance
let instance: AgentMovementServiceImpl | null = null;

export const agentMovementService: AgentMovementService = {
  async moveAgent(agentId: string, direction: 'forward' | 'backward' | 'left' | 'right') {
    if (!instance) throw new Error('AgentMovementService not initialized');
    return instance.moveAgent(agentId, direction);
  },
  async moveAgentTo(agentId: string, targetPosition: [number, number, number]) {
    if (!instance) throw new Error('AgentMovementService not initialized');
    return instance.moveAgentTo(agentId, targetPosition);
  },
  async rotateAgent(agentId: string, angle: number) {
    if (!instance) throw new Error('AgentMovementService not initialized');
    return instance.rotateAgent(agentId, angle);
  },
  async applyMovementPattern(agentId: string, pattern: MovementPattern) {
    if (!instance) throw new Error('AgentMovementService not initialized');
    return instance.applyMovementPattern(agentId, pattern);
  },
  async calculateVelocity(agentId: string, acceleration: [number, number, number]) {
    if (!instance) throw new Error('AgentMovementService not initialized');
    return instance.calculateVelocity(agentId, acceleration);
  },
  async calculatePosition(agentId: string, velocity: [number, number, number]) {
    if (!instance) throw new Error('AgentMovementService not initialized');
    return instance.calculatePosition(agentId, velocity);
  },
  async checkCollision(agentId: string, objectPosition: [number, number, number], radius: number) {
    if (!instance) throw new Error('AgentMovementService not initialized');
    return instance.checkCollision(agentId, objectPosition, radius);
  }
};

export function initializeAgentMovementService(config: CollaborativeWorldConfig, agents: Agent[]): void {
  instance = new AgentMovementServiceImpl(config);
  instance.initializeAgents(agents).catch(console.error);
}

export function getAgentMovementService(): AgentMovementServiceImpl | null {
  return instance;
}
