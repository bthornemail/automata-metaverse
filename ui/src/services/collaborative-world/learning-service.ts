/**
 * Learning and Back Propagation Service
 * Handles learning from interactions and back propagation of knowledge
 */

import { InteractionEvent, KnowledgeNode, CollaborativeWorldConfig, Agent } from './types';
import { databaseService } from '../database-service';

export interface LearningService {
  learnFromInteraction(interaction: InteractionEvent): Promise<void>;
  backPropagate(errorSignal: number, learningRate: number): Promise<void>;
  storePattern(pattern: string, weight: number, relationships: string[]): Promise<void>;
  getKnowledgeGraph(): KnowledgeNode[];
  getMetrics(): LearningMetrics;
}

export interface LearningMetrics {
  totalLearningEvents: number;
  averageLearningWeight: number;
  knowledgeGraphSize: number;
  backpropCount: number;
  timestamp: number;
}

class LearningServiceImpl implements LearningService {
  private knowledgeGraph: KnowledgeNode[] = [];
  private config: CollaborativeWorldConfig;
  private neuralNetwork: NeuralNetwork;
  private metrics: LearningMetrics = {
    totalLearningEvents: 0,
    averageLearningWeight: 0,
    knowledgeGraphSize: 0,
    backpropCount: 0,
    timestamp: Date.now()
  };
  private listeners: Map<string, Set<(data: any) => void>> = new Map();

  constructor(config: CollaborativeWorldConfig) {
    this.config = config;
    this.neuralNetwork = new NeuralNetwork(config.learningRate);
  }

  // Learn from interaction
  async learnFromInteraction(interaction: InteractionEvent): Promise<void> {
    // Extract features from interaction
    const features = this.extractFeatures(interaction);

    // Forward pass through neural network
    const output = await this.neuralNetwork.forward(features);

    // Calculate expected output
    const expected = this.getExpectedOutput(interaction);

    // Calculate error
    const error = this.calculateError(output, expected);

    // Backward pass
    const gradients = await this.neuralNetwork.backward(error);

    // Update weights using gradient descent
    await this.updateWeights(gradients);

    // Store pattern in knowledge graph
    const pattern = this.extractPattern(interaction);
    await this.storePattern(pattern, interaction.learningWeight, this.findRelationships(pattern));

    // Update metrics
    this.updateMetrics(interaction);

    // Emit event
    this.emit('learning:interaction', { interaction, output, error });
  }

  // Back propagate learning signal
  async backPropagate(errorSignal: number, learningRate: number): Promise<void> {
    // Get backprop weight
    const backpropWeight = this.calculateBackpropWeight();

    // Calculate learning signal using R5RS church-mult
    const learningSignal = await this.r5rsMult(errorSignal, backpropWeight);

    // Propagate through network
    await this.propagateLearningSignal(learningSignal, learningRate);

    // Update metrics
    this.metrics.backpropCount++;
    this.metrics.timestamp = Date.now();

    // Emit event
    this.emit('learning:backprop', { errorSignal, learningSignal });
  }

  // Store pattern in knowledge graph
  async storePattern(
    pattern: string,
    weight: number,
    relationships: string[]
  ): Promise<void> {
    // Use R5RS church-add to add pattern to knowledge graph
    const newNode: KnowledgeNode = {
      id: `pattern-${Date.now()}-${Math.random()}`,
      pattern,
      weight,
      relationships,
      learnedAt: Date.now()
    };

    // Add to knowledge graph
    this.knowledgeGraph.push(newNode);

    // Update relationships
    relationships.forEach(relId => {
      const relNode = this.knowledgeGraph.find(n => n.id === relId);
      if (relNode) {
        relNode.relationships.push(newNode.id);
      }
    });

    // Update metrics
    this.metrics.knowledgeGraphSize = this.knowledgeGraph.length;
    this.metrics.timestamp = Date.now();

    // Emit event
    this.emit('learning:pattern-stored', newNode);
  }

  // Get knowledge graph
  getKnowledgeGraph(): KnowledgeNode[] {
    return [...this.knowledgeGraph];
  }

  // Get metrics
  getMetrics(): LearningMetrics {
    return { ...this.metrics };
  }

  // Helper methods
  private extractFeatures(interaction: InteractionEvent): number[] {
    return [
      interaction.learningWeight,
      interaction.propagationLevels.length,
      interaction.timestamp / 1000000, // Normalize timestamp
      interaction.type === 'touch' ? 1 : 0,
      interaction.type === 'communicate' ? 1 : 0,
      interaction.type === 'collaborate' ? 1 : 0,
      interaction.type === 'learn' ? 1 : 0
    ];
  }

  private getExpectedOutput(interaction: InteractionEvent): number[] {
    // Expected output based on interaction type
    const baseOutput = [0, 0, 0, 0];
    switch (interaction.type) {
      case 'touch':
        baseOutput[0] = 1;
        break;
      case 'communicate':
        baseOutput[1] = 1;
        break;
      case 'collaborate':
        baseOutput[2] = 1;
        break;
      case 'learn':
        baseOutput[3] = 1;
        break;
    }
    return baseOutput;
  }

  private calculateError(output: number[], expected: number[]): number {
    let error = 0;
    for (let i = 0; i < output.length; i++) {
      error += Math.pow(output[i] - expected[i], 2);
    }
    return error / output.length;
  }

  private extractPattern(interaction: InteractionEvent): string {
    return `${interaction.type}-${interaction.propagationLevels.join('-')}-${interaction.source}`;
  }

  private findRelationships(pattern: string): string[] {
    // Find similar patterns in knowledge graph
    const relationships: string[] = [];
    this.knowledgeGraph.forEach(node => {
      if (node.pattern.includes(pattern.split('-')[0])) {
        relationships.push(node.id);
      }
    });
    return relationships;
  }

  private calculateBackpropWeight(): number {
    // Calculate backprop weight based on knowledge graph size
    const graphSize = this.knowledgeGraph.length;
    return Math.max(0.1, Math.min(1.0, graphSize / 100));
  }

  private async propagateLearningSignal(signal: number, learningRate: number): Promise<void> {
    // Propagate learning signal through neural network
    await this.neuralNetwork.updateWeights(signal * learningRate);
  }

  private async updateWeights(gradients: number[]): Promise<void> {
    // Update weights using gradient descent
    await this.neuralNetwork.updateWeightsFromGradients(gradients);
  }

  private updateMetrics(interaction: InteractionEvent): void {
    this.metrics.totalLearningEvents++;
    const totalWeight = this.metrics.averageLearningWeight * (this.metrics.totalLearningEvents - 1);
    this.metrics.averageLearningWeight = (totalWeight + interaction.learningWeight) / this.metrics.totalLearningEvents;
    this.metrics.timestamp = Date.now();
  }

  // R5RS function wrappers
  private async r5rsMult(a: number, b: number): Promise<number> {
    try {
      const result = await databaseService.invokeR5RSFunction('r5rs:church-mult', [a, b]);
      return result as number;
    } catch (error) {
      return a * b;
    }
  }

  private async r5rsAdd(a: any, b: any): Promise<any> {
    try {
      const result = await databaseService.invokeR5RSFunction('r5rs:church-add', [a, b]);
      return result;
    } catch (error) {
      return { ...a, ...b };
    }
  }

  // Event system
  on(event: string, callback: (data: any) => void): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(callback);
  }

  off(event: string, callback: (data: any) => void): void {
    this.listeners.get(event)?.delete(callback);
  }

  private emit(event: string, data: any): void {
    this.listeners.get(event)?.forEach(callback => {
      try {
        callback(data);
      } catch (error) {
        console.error(`Error in ${event} listener:`, error);
      }
    });
  }
}

// Simple Neural Network implementation
class NeuralNetwork {
  private weights: number[][] = [];
  private learningRate: number;

  constructor(learningRate: number) {
    this.learningRate = learningRate;
    // Initialize weights (simple 2-layer network)
    this.weights = [
      [0.5, 0.3, 0.2, 0.1, 0.4, 0.6, 0.7],
      [0.3, 0.5, 0.4, 0.2, 0.6, 0.3, 0.5],
      [0.2, 0.4, 0.5, 0.3, 0.3, 0.5, 0.4],
      [0.1, 0.2, 0.3, 0.5, 0.2, 0.4, 0.6]
    ];
  }

  async forward(input: number[]): Promise<number[]> {
    const output: number[] = [];
    for (let i = 0; i < this.weights.length; i++) {
      let sum = 0;
      for (let j = 0; j < input.length; j++) {
        sum += this.weights[i][j] * input[j];
      }
      output.push(this.sigmoid(sum));
    }
    return output;
  }

  async backward(error: number): Promise<number[]> {
    // Simple gradient calculation
    const gradients: number[] = [];
    for (let i = 0; i < this.weights.length; i++) {
      gradients.push(error * this.learningRate);
    }
    return gradients;
  }

  async updateWeights(delta: number): Promise<void> {
    for (let i = 0; i < this.weights.length; i++) {
      for (let j = 0; j < this.weights[i].length; j++) {
        this.weights[i][j] += delta * this.learningRate;
        // Clamp weights
        this.weights[i][j] = Math.max(-1, Math.min(1, this.weights[i][j]));
      }
    }
  }

  async updateWeightsFromGradients(gradients: number[]): Promise<void> {
    for (let i = 0; i < this.weights.length; i++) {
      for (let j = 0; j < this.weights[i].length; j++) {
        this.weights[i][j] -= gradients[i] * this.learningRate;
        // Clamp weights
        this.weights[i][j] = Math.max(-1, Math.min(1, this.weights[i][j]));
      }
    }
  }

  private sigmoid(x: number): number {
    return 1 / (1 + Math.exp(-x));
  }
}

// Singleton instance
let instance: LearningServiceImpl | null = null;

export const learningService: LearningService = {
  async learnFromInteraction(interaction: InteractionEvent) {
    if (!instance) throw new Error('LearningService not initialized');
    return instance.learnFromInteraction(interaction);
  },
  async backPropagate(errorSignal: number, learningRate: number) {
    if (!instance) throw new Error('LearningService not initialized');
    return instance.backPropagate(errorSignal, learningRate);
  },
  async storePattern(pattern: string, weight: number, relationships: string[]) {
    if (!instance) throw new Error('LearningService not initialized');
    return instance.storePattern(pattern, weight, relationships);
  },
  getKnowledgeGraph() {
    if (!instance) throw new Error('LearningService not initialized');
    return instance.getKnowledgeGraph();
  },
  getMetrics() {
    if (!instance) throw new Error('LearningService not initialized');
    return instance.getMetrics();
  }
};

export function initializeLearningService(config: CollaborativeWorldConfig): void {
  instance = new LearningServiceImpl(config);
}

export function getLearningService(): LearningServiceImpl | null {
  return instance;
}
