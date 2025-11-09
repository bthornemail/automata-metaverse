/**
 * Automaton Controller
 * 
 * Handles automaton control functions (start, stop, execute actions, etc.)
 */

import { AdvancedSelfReferencingAutomaton } from '../../evolutions/advanced-automaton/advanced-automaton';
import { Server as SocketIOServer } from 'socket.io';

export interface AutomatonState {
  automaton: AdvancedSelfReferencingAutomaton;
  isRunning: boolean;
  intervalId: NodeJS.Timeout | null;
}

export class AutomatonController {
  private state: AutomatonState;
  private io: SocketIOServer;

  constructor(automaton: AdvancedSelfReferencingAutomaton, io: SocketIOServer) {
    this.state = {
      automaton,
      isRunning: false,
      intervalId: null,
    };
    this.io = io;
  }

  /**
   * Start automaton execution
   */
  start(intervalMs: number, maxIterations: number): void {
    if (this.state.isRunning) return;

    this.state.isRunning = true;
    let iterationCount = 0;

    console.log(`🚀 Starting automaton with ${intervalMs}ms interval`);

    this.state.intervalId = setInterval(() => {
      if (iterationCount >= maxIterations) {
        this.stop();
        return;
      }

      // Get smart action based on current state
      const currentDimension = (this.state.automaton as any).currentDimension;
      const action = this.getSmartAction(currentDimension, iterationCount);
      
      this.executeAction(action);
      
      // Emit status update
      this.io.emit('status', {
        isRunning: true,
        currentDimension: (this.state.automaton as any).currentDimension,
        iterationCount: (this.state.automaton as any).executionHistory.length,
        selfModificationCount: (this.state.automaton as any).selfModificationCount,
        totalObjects: (this.state.automaton as any).objects.length,
        executionMode: 'builtin',
        status: 'running',
        lastAction: action,
      });

      iterationCount++;
    }, intervalMs);
  }

  /**
   * Stop automaton execution
   */
  stop(): void {
    if (!this.state.isRunning) return;

    this.state.isRunning = false;
    
    if (this.state.intervalId) {
      clearInterval(this.state.intervalId);
      this.state.intervalId = null;
    }

    console.log('🛑 Automaton stopped');

    // Emit status update
    this.io.emit('status', {
      isRunning: false,
      currentDimension: (this.state.automaton as any).currentDimension,
      iterationCount: (this.state.automaton as any).executionHistory.length,
      selfModificationCount: (this.state.automaton as any).selfModificationCount,
      totalObjects: (this.state.automaton as any).objects.length,
      executionMode: 'builtin',
      status: 'idle',
    });
  }

  /**
   * Execute a single action
   */
  executeAction(action: string): void {
    try {
      console.log(`🎯 Executing: ${action}`);
      
      const currentDim = (this.state.automaton as any).currentDimension;
      const iterationCount = (this.state.automaton as any).executionHistory?.length || 0;
      let fromDim = currentDim;
      let toDim = currentDim;

      switch (action) {
        case 'evolve':
          (this.state.automaton as any).executeEvolution();
          this.progressDimension();
          toDim = (this.state.automaton as any).currentDimension;
          break;
        case 'self-reference':
          (this.state.automaton as any).executeSelfReference();
          break;
        case 'self-modify':
          (this.state.automaton as any).executeSelfModification();
          this.io.emit('modification', { type: 'self-modify', timestamp: Date.now() });
          break;
        case 'self-io':
          (this.state.automaton as any).executeSelfIO();
          break;
        case 'validate-self':
          (this.state.automaton as any).executeSelfValidation();
          break;
        case 'self-train':
          (this.state.automaton as any).executeSelfTraining();
          break;
        case 'self-observe':
          (this.state.automaton as any).executeSelfObservation();
          break;
        case 'compose':
          (this.state.automaton as any).executeComposition();
          break;
      }

      // Add to execution history
      const historyEntry = {
        iteration: typeof iterationCount === 'number' ? iterationCount : 0,
        action: typeof action === 'string' ? action : 'unknown',
        from: typeof fromDim === 'number' ? `${fromDim}D` : 'unknown',
        to: typeof toDim === 'number' ? `${toDim}D` : 'unknown',
        timestamp: Date.now()
      };
      
      if (historyEntry && typeof historyEntry === 'object' && !Array.isArray(historyEntry)) {
        if (!(this.state.automaton as any).executionHistory) {
          (this.state.automaton as any).executionHistory = [];
        }
        (this.state.automaton as any).executionHistory.push(historyEntry);
      }

      // Emit action execution
      const actionData = {
        action: typeof action === 'string' ? action : 'unknown',
        result: 'success',
        timestamp: Date.now(),
        from: typeof fromDim === 'number' ? `${fromDim}D` : 'unknown',
        to: typeof toDim === 'number' ? `${toDim}D` : 'unknown',
        iteration: typeof iterationCount === 'number' ? iterationCount : 0
      };
      
      if (actionData && typeof actionData === 'object' && !Array.isArray(actionData)) {
        this.io.emit('action', actionData);
      }

    } catch (error) {
      console.error(`❌ Failed to execute action ${action}:`, error);
      let errorMessage: string;
      try {
        errorMessage = error instanceof Error ? error.message : String(error);
      } catch (e) {
        errorMessage = 'Unknown error occurred';
      }
      this.io.emit('error', { action: action, error: errorMessage });
    }
  }

  /**
   * Progress to next dimension
   */
  private progressDimension(): void {
    const currentDim = (this.state.automaton as any).currentDimension;
    const nextDim = (currentDim + 1) % 8;
    (this.state.automaton as any).currentDimension = nextDim;
    
    this.io.emit('dimension', { dimension: nextDim });
  }

  /**
   * Get smart action based on current state
   */
  private getSmartAction(currentDimension: number, iterationCount: number): string {
    // Intelligent action selection based on context
    if (iterationCount % 20 === 0) {
      return 'self-modify';
    }
    
    if (iterationCount % 15 === 0) {
      return 'self-io';
    }
    
    if (iterationCount % 10 === 0) {
      return 'validate-self';
    }
    
    if (iterationCount % 8 === 0) {
      return 'self-train';
    }

    // Dimension-specific actions
    switch (currentDimension) {
      case 0:
        return Math.random() > 0.7 ? 'self-reference' : 'evolve';
      case 2:
        return Math.random() > 0.6 ? 'self-modify' : 'evolve';
      case 4:
        return Math.random() > 0.5 ? 'self-io' : 'evolve';
      case 6:
        return Math.random() > 0.4 ? 'self-train' : 'evolve';
      case 7:
        return Math.random() > 0.3 ? 'self-observe' : 'evolve';
      default:
        return 'evolve';
    }
  }

  /**
   * Get current state
   */
  getState(): AutomatonState {
    return { ...this.state };
  }

  /**
   * Get automaton instance
   */
  getAutomaton(): AdvancedSelfReferencingAutomaton {
    return this.state.automaton;
  }

  /**
   * Reset automaton
   */
  reset(filePath: string = './automaton.jsonl'): void {
    this.stop();
    try {
      this.state.automaton = new AdvancedSelfReferencingAutomaton(filePath);
      console.log('✅ Automaton reset successfully');
    } catch (error) {
      console.error('❌ Failed to reset automaton:', error);
      throw error;
    }
  }
}
