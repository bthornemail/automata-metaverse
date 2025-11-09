/**
 * Agent Message Handler
 * 
 * Handles agent chat messages and interactions
 */

import { AutomatonController } from './automaton-controller';

/**
 * Handle agent message
 */
export async function handleAgentMessage(
  agent: string,
  message: string,
  automatonController: AutomatonController
): Promise<string> {
  const automaton = automatonController.getAutomaton();
  const state = automatonController.getState();

  // Simple agent responses based on agent type
  switch (agent) {
    case 'automaton-interface':
      return `Automaton status: ${state.isRunning ? 'running' : 'idle'}. Current dimension: ${(automaton as any).currentDimension}D.`;
    
    case 'automaton-control':
      if (message.toLowerCase().includes('start')) {
        if (!state.isRunning) {
          automatonController.start(2000, Infinity);
          return 'Automaton started successfully.';
        }
        return 'Automaton is already running.';
      } else if (message.toLowerCase().includes('stop')) {
        if (state.isRunning) {
          automatonController.stop();
          return 'Automaton stopped successfully.';
        }
        return 'Automaton is not running.';
      }
      return 'I can help you start or stop the automaton.';
    
    case 'automaton-analyzer':
      const history = (automaton as any).executionHistory || [];
      return `Automaton has executed ${history.length} iterations. Current dimension: ${(automaton as any).currentDimension}D.`;
    
    case 'dimensional-guide':
      const currentDim = (automaton as any).currentDimension;
      return `Current dimension: ${currentDim}D. Dimensions range from 0D (topology) to 7D (quantum).`;
    
    case 'church-encoding-expert':
      return 'Church encoding provides the mathematical foundation for dimensional progression.';
    
    case 'automaton-visualizer':
      return 'Visualization data available. Use the visualization components to view the automaton state.';
    
    default:
      return `I'm ${agent}. How can I help you with the automaton?`;
  }
}
