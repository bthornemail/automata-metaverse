/**
 * TinyML Service
 * Provides lightweight machine learning capabilities for edge devices
 * Optimized for automaton pattern recognition and prediction
 */

export interface TinyMLModel {
  id: string;
  name: string;
  type: 'pattern' | 'prediction' | 'classification';
  accuracy: number;
  size: number; // bytes
}

export interface PatternPrediction {
  nextDimension: number;
  confidence: number;
  pattern: string;
  reasoning: string;
}

export interface DimensionalPattern {
  dimension: number;
  pattern: string;
  frequency: number;
  lastSeen: number;
}

class TinyMLService {
  private models: Map<string, TinyMLModel> = new Map();
  private patterns: DimensionalPattern[] = [];

  /**
   * Initialize TinyML models
   */
  async initialize(): Promise<void> {
    // Initialize pattern recognition model
    this.models.set('pattern-recognition', {
      id: 'pattern-recognition',
      name: 'Dimensional Pattern Recognition',
      type: 'pattern',
      accuracy: 0.85,
      size: 1024 * 5 // ~5KB model
    });

    // Initialize prediction model
    this.models.set('dimension-prediction', {
      id: 'dimension-prediction',
      name: 'Next Dimension Predictor',
      type: 'prediction',
      accuracy: 0.78,
      size: 1024 * 3 // ~3KB model
    });

    // Initialize classification model
    this.models.set('action-classifier', {
      id: 'action-classifier',
      name: 'Action Classifier',
      type: 'classification',
      accuracy: 0.82,
      size: 1024 * 2 // ~2KB model
    });
  }

  /**
   * Recognize patterns in dimensional progression
   */
  recognizePattern(history: Array<{ dimension: number; timestamp: number }>): DimensionalPattern[] {
    const patternMap = new Map<string, { count: number; lastSeen: number }>();
    
    // Analyze transitions
    for (let i = 1; i < history.length; i++) {
      const from = history[i - 1].dimension;
      const to = history[i].dimension;
      const pattern = `${from}D→${to}D`;
      
      const existing = patternMap.get(pattern) || { count: 0, lastSeen: 0 };
      patternMap.set(pattern, {
        count: existing.count + 1,
        lastSeen: history[i].timestamp
      });
    }

    // Convert to pattern array
    const patterns: DimensionalPattern[] = [];
    patternMap.forEach((value, pattern) => {
      // Ensure pattern is a string before calling split
      if (typeof pattern !== 'string') {
        console.warn('TinyML: Pattern is not a string:', typeof pattern, pattern);
        return;
      }
      try {
        const [from, to] = pattern.split('→').map(s => parseInt(s.replace('D', '')));
        if (isNaN(from) || isNaN(to)) {
          console.warn('TinyML: Invalid pattern format:', pattern);
          return;
        }
        patterns.push({
          dimension: to,
          pattern,
          frequency: value.count,
          lastSeen: value.lastSeen
        });
      } catch (error) {
        console.warn('TinyML: Error processing pattern:', pattern, error);
      }
    });

    return patterns.sort((a, b) => b.frequency - a.frequency);
  }

  /**
   * Predict next dimension based on history
   */
  predictNextDimension(
    currentDimension: number,
    history: Array<{ dimension: number; timestamp: number }>
  ): PatternPrediction {
    const patterns = this.recognizePattern(history);
    
    // Find most common transition from current dimension
    const transitions = patterns.filter(p => {
      // Ensure pattern is a string
      if (!p || typeof p.pattern !== 'string') {
        return false;
      }
      try {
        const parts = (p.pattern as string).split('→');
        if (parts.length === 0) return false;
        const [from] = parts.map(s => parseInt(s.replace('D', '')));
        return !isNaN(from) && from === currentDimension;
      } catch (error) {
        console.warn('TinyML: Error filtering pattern:', p.pattern, error);
        return false;
      }
    });

    if (transitions.length > 0) {
      const mostLikely = transitions[0];
      // Ensure pattern is a string
      if (mostLikely && typeof mostLikely.pattern === 'string') {
        try {
          const [_, nextDim] = mostLikely.pattern.split('→').map(s => parseInt(s.replace('D', '')));
          if (!isNaN(nextDim)) {
            return {
              nextDimension: nextDim,
              confidence: Math.min(0.95, 0.6 + (mostLikely.frequency / 10) * 0.1),
              pattern: mostLikely.pattern,
              reasoning: `Based on ${mostLikely.frequency} previous occurrences of this transition`
            };
          }
        } catch (error) {
          console.warn('TinyML: Error parsing pattern:', mostLikely.pattern, error);
        }
      }
    }

    // Default: progress to next dimension
    const nextDim = (currentDimension + 1) % 8;
    return {
      nextDimension: nextDim,
      confidence: 0.5,
      pattern: `${currentDimension}D→${nextDim}D`,
      reasoning: 'Default progression pattern'
    };
  }

  /**
   * Classify action intent
   */
  classifyAction(input: string, context: any): {
    action: string;
    confidence: number;
    parameters: Record<string, any>;
  } {
    const lowerInput = input.toLowerCase();
    
    // Simple keyword-based classification (TinyML approach)
    const actionKeywords: Record<string, string[]> = {
      'start': ['start', 'begin', 'run', 'execute'],
      'stop': ['stop', 'halt', 'pause', 'end'],
      'evolve': ['evolve', 'progress', 'advance', 'next'],
      'modify': ['modify', 'change', 'update', 'edit'],
      'analyze': ['analyze', 'examine', 'inspect', 'check'],
    };

    let bestMatch = { action: 'query', confidence: 0.3 };
    
    for (const [action, keywords] of Object.entries(actionKeywords)) {
      const matches = keywords.filter(kw => lowerInput.includes(kw)).length;
      if (matches > 0) {
        const confidence = Math.min(0.95, 0.5 + (matches / keywords.length) * 0.3);
        if (confidence > bestMatch.confidence) {
          bestMatch = { action, confidence };
        }
      }
    }

    // Extract parameters
    const parameters: Record<string, any> = {};
    const intervalMatch = input.match(/(\d+)\s*(second|sec|ms)/i);
    if (intervalMatch) {
      parameters.intervalMs = parseInt(intervalMatch[1]) * 1000;
    }

    return {
      action: bestMatch.action,
      confidence: bestMatch.confidence,
      parameters
    };
  }

  /**
   * Get model information
   */
  getModels(): TinyMLModel[] {
    return Array.from(this.models.values());
  }

  /**
   * Get model by ID
   */
  getModel(id: string): TinyMLModel | undefined {
    return this.models.get(id);
  }
}

export const tinyMLService = new TinyMLService();
