/**
 * NLP Service
 * Processes human natural language input and converts it to automaton commands
 */

export interface NLPAnalysis {
  intent: string;
  entities: Record<string, any>;
  confidence: number;
  automatonCommand?: string;
  dimension?: number;
  action?: string;
  parameters?: Record<string, any>;
}

class NLPService {
  /**
   * Parse natural language input and extract intent and entities
   */
  async parseInput(input: string): Promise<NLPAnalysis> {
    const lowerInput = input.toLowerCase();
    
    // Intent detection patterns
    const intents = {
      start: /start|begin|run|execute/i,
      stop: /stop|halt|pause|end/i,
      evolve: /evolve|progress|advance|next dimension/i,
      analyze: /analyze|examine|inspect|check/i,
      modify: /modify|change|update|edit/i,
      query: /what|show|display|tell|explain/i,
      control: /control|set|configure|adjust/i,
    };

    // Dimension detection
    const dimensionPattern = /(\d+)d|dimension\s+(\d+)/i;
    const dimensionMatch = input.match(dimensionPattern);
    const dimension = dimensionMatch 
      ? parseInt(dimensionMatch[1] || dimensionMatch[2]) 
      : undefined;

    // Action detection
    let intent = 'query';
    let action: string | undefined;
    let confidence = 0.7;

    for (const [intentName, pattern] of Object.entries(intents)) {
      if (pattern.test(input)) {
        intent = intentName;
        confidence = 0.9;
        break;
      }
    }

    // Extract specific actions
    if (lowerInput.includes('self-modify') || lowerInput.includes('self modify')) {
      action = 'self-modify';
      intent = 'modify';
    } else if (lowerInput.includes('self-reference') || lowerInput.includes('self reference')) {
      action = 'self-reference';
      intent = 'evolve';
    } else if (lowerInput.includes('church encoding') || lowerInput.includes('lambda')) {
      action = 'church-encoding';
      intent = 'query';
    }

    // Extract parameters
    const parameters: Record<string, any> = {};
    
    // Interval detection
    const intervalMatch = input.match(/(\d+)\s*(second|sec|ms|millisecond)/i);
    if (intervalMatch) {
      parameters.intervalMs = parseInt(intervalMatch[1]) * (intervalMatch[2].toLowerCase().includes('ms') ? 1 : 1000);
    }

    // Iteration detection
    const iterationMatch = input.match(/(\d+)\s*(iteration|iter|cycle)/i);
    if (iterationMatch) {
      parameters.maxIterations = parseInt(iterationMatch[1]);
    }

    // Generate automaton command
    let automatonCommand: string | undefined;
    if (intent === 'start') {
      automatonCommand = `start${parameters.intervalMs ? ` --interval ${parameters.intervalMs}` : ''}${parameters.maxIterations ? ` --max-iterations ${parameters.maxIterations}` : ''}`;
    } else if (intent === 'stop') {
      automatonCommand = 'stop';
    } else if (intent === 'evolve' && dimension !== undefined) {
      automatonCommand = `evolve --dimension ${dimension}`;
    } else if (action) {
      automatonCommand = action;
    }

    return {
      intent,
      entities: {
        dimension,
        ...parameters
      },
      confidence,
      automatonCommand,
      dimension,
      action,
      parameters
    };
  }

  /**
   * Convert automaton state to natural language description
   */
  formatStateToNL(state: any): string {
    const parts: string[] = [];
    
    if (state.currentDimension !== undefined) {
      parts.push(`Currently in ${state.currentDimension}D dimension`);
    }
    
    if (state.isRunning) {
      parts.push('Automaton is running');
    } else {
      parts.push('Automaton is idle');
    }
    
    if (state.iterationCount) {
      parts.push(`Completed ${state.iterationCount} iterations`);
    }
    
    if (state.selfModificationCount) {
      parts.push(`Performed ${state.selfModificationCount} self-modifications`);
    }
    
    return parts.join('. ') || 'No state information available';
  }
}

export const nlpService = new NLPService();
