/**
 * Collaborative World Types
 * Type definitions for AI Portal Collaborative World Creation Environment
 */

export type PropagationLevel = 'global' | 'local' | 'personal' | 'peer' | 'agentic';

export type InteractionType = 'touch' | 'communicate' | 'collaborate' | 'learn';

export type MovementPattern = 'random' | 'follow' | 'avoid' | 'flock';

export interface Agent {
  id: string;
  dimension: '0D' | '1D' | '2D' | '3D' | '4D' | '5D' | '6D' | '7D';
  name: string;
  position: [number, number, number];
  velocity: [number, number, number];
  rotation: [number, number, number];
  interactionRange: PropagationLevel;
  learningEnabled: boolean;
  movementPattern?: MovementPattern;
  targetPosition?: [number, number, number];
  isMoving: boolean;
  animationState: 'idle' | 'walking' | 'running' | 'jumping' | 'sitting' | 'dancing';
}

export interface InteractionEvent {
  id: string;
  type: InteractionType;
  source: string; // Agent ID
  target?: string; // Agent ID (optional for global interactions)
  timestamp: number;
  data: Record<string, any>;
  propagationLevels: PropagationLevel[];
  learningWeight: number;
}

export interface MovementSystem {
  id: string;
  name: string;
  components: {
    movementController: Component;
    physicsEngine: Component;
    collisionDetector: Component;
  };
}

export interface InteractionPropagationSystem {
  id: string;
  name: string;
  components: {
    propagationRouter: Component;
    interactionQueue: Component;
    learningBackprop: Component;
  };
}

export interface LearningSystem {
  id: string;
  name: string;
  components: {
    neuralNetwork: Component;
    gradientDescent: Component;
    knowledgeGraph: Component;
  };
}

export interface Component {
  id: string;
  name: string;
  system: string;
  r5rsFunctions: string[];
  description: string;
}

export interface R5RSCall {
  id: string;
  type: 'r5rs-call';
  function: string;
  args: any[];
  description: string;
  component?: string;
}

export interface MovementPatternDef {
  id: string;
  type: 'movement-pattern';
  name: string;
  r5rsExpression: string;
  description: string;
}

export interface InteractionTypeDef {
  id: string;
  type: 'interaction-type';
  name: string;
  propagationLevels: PropagationLevel[];
  learningWeight: number;
  description: string;
}

export interface LearningRule {
  id: string;
  type: 'learning-rule';
  name: string;
  r5rsExpression: string;
  description: string;
}

export interface CollaborativeWorldConfig {
  worldSize: number;
  agentCount: number;
  interactionRadius: number;
  learningRate: number;
  backpropDepth: number;
  propagationDelay: number;
}

export interface CollaborativeWorldState {
  agents: Map<string, Agent>;
  interactions: InteractionEvent[];
  knowledgeGraph: KnowledgeNode[];
  metrics: WorldMetrics;
}

export interface KnowledgeNode {
  id: string;
  pattern: string;
  weight: number;
  relationships: string[];
  learnedAt: number;
}

export interface WorldMetrics {
  totalInteractions: number;
  totalLearningEvents: number;
  averageLearningWeight: number;
  knowledgeGraphSize: number;
  activeAgents: number;
  timestamp: number;
}

export interface CanvasLWorldScript {
  version: string;
  schema: string;
  r5rsEngine: string;
  dimension: string;
  phase: string;
  systems: {
    movement: MovementSystem;
    propagation: InteractionPropagationSystem;
    learning: LearningSystem;
  };
  agents: Agent[];
  r5rsCalls: R5RSCall[];
  movementPatterns: MovementPatternDef[];
  interactionTypes: InteractionTypeDef[];
  learningRules: LearningRule[];
  config: CollaborativeWorldConfig;
}
