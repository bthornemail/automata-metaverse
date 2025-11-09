#!/usr/bin/env tsx
/**
 * Pattern Tracker
 * 
 * Tracks execution patterns, modification patterns, and success rates
 * for learning and adaptation
 */

export interface ModificationPattern {
  id: string;
  dimension: number;
  patternType: 'add' | 'modify' | 'remove' | 'transform';
  pattern: string; // Description or code template
  successCount: number;
  failureCount: number;
  averageMemoryDelta: number; // MB
  averageExecutionTime: number; // ms
  lastUsed: string;
  createdAt: string;
}

export interface ExecutionPattern {
  id: string;
  dimension: number;
  actionSequence: string[]; // Sequence of actions taken
  outcome: 'success' | 'failure' | 'partial';
  memoryUsage: number; // MB
  executionTime: number; // ms
  timestamp: string;
  metadata: Record<string, any>;
}

export interface LearnedPattern {
  pattern: ModificationPattern;
  confidence: number; // 0-1
  usageCount: number;
  lastSuccessRate: number; // 0-1
  recommendations: string[];
}

/**
 * Pattern Tracker
 */
export class PatternTracker {
  private modificationPatterns: Map<string, ModificationPattern> = new Map();
  private executionHistory: ExecutionPattern[] = [];
  private learnedPatterns: LearnedPattern[] = [];

  /**
   * Track a modification pattern
   */
  trackModification(
    dimension: number,
    patternType: ModificationPattern['patternType'],
    pattern: string,
    success: boolean,
    memoryDelta: number,
    executionTime: number
  ): void {
    const patternId = `${dimension}D-${patternType}-${this.hashPattern(pattern)}`;
    
    let modPattern = this.modificationPatterns.get(patternId);
    
    if (!modPattern) {
      modPattern = {
        id: patternId,
        dimension,
        patternType,
        pattern,
        successCount: 0,
        failureCount: 0,
        averageMemoryDelta: 0,
        averageExecutionTime: 0,
        lastUsed: new Date().toISOString(),
        createdAt: new Date().toISOString()
      };
      this.modificationPatterns.set(patternId, modPattern);
    }
    
    // Update statistics
    if (success) {
      modPattern.successCount++;
    } else {
      modPattern.failureCount++;
    }
    
    // Update averages
    const totalCount = modPattern.successCount + modPattern.failureCount;
    modPattern.averageMemoryDelta = 
      (modPattern.averageMemoryDelta * (totalCount - 1) + memoryDelta) / totalCount;
    modPattern.averageExecutionTime = 
      (modPattern.averageExecutionTime * (totalCount - 1) + executionTime) / totalCount;
    
    modPattern.lastUsed = new Date().toISOString();
    
    // Update learned patterns
    this.updateLearnedPatterns();
  }

  /**
   * Track execution pattern
   */
  trackExecution(
    dimension: number,
    actionSequence: string[],
    outcome: ExecutionPattern['outcome'],
    memoryUsage: number,
    executionTime: number,
    metadata: Record<string, any> = {}
  ): void {
    const execution: ExecutionPattern = {
      id: `exec-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      dimension,
      actionSequence,
      outcome,
      memoryUsage,
      executionTime,
      timestamp: new Date().toISOString(),
      metadata
    };
    
    this.executionHistory.push(execution);
    
    // Keep only last 1000 executions
    if (this.executionHistory.length > 1000) {
      this.executionHistory.shift();
    }
  }

  /**
   * Get best patterns for a dimension
   */
  getBestPatterns(dimension: number, limit: number = 5): LearnedPattern[] {
    return this.learnedPatterns
      .filter(lp => lp.pattern.dimension === dimension)
      .sort((a, b) => b.confidence - a.confidence)
      .slice(0, limit);
  }

  /**
   * Get recommended pattern for next modification
   */
  getRecommendedPattern(dimension: number): ModificationPattern | null {
    const bestPatterns = this.getBestPatterns(dimension, 1);
    if (bestPatterns.length === 0) return null;
    
    const best = bestPatterns[0];
    return best ? best.pattern : null;
  }

  /**
   * Get success rate for a dimension
   */
  getSuccessRate(dimension: number): number {
    const patterns = Array.from(this.modificationPatterns.values())
      .filter(p => p.dimension === dimension);
    
    if (patterns.length === 0) return 0;
    
    const totalSuccess = patterns.reduce((sum, p) => sum + p.successCount, 0);
    const totalFailure = patterns.reduce((sum, p) => sum + p.failureCount, 0);
    const total = totalSuccess + totalFailure;
    
    return total > 0 ? totalSuccess / total : 0;
  }

  /**
   * Get execution statistics for a dimension
   */
  getExecutionStats(dimension: number): {
    averageMemory: number;
    averageTime: number;
    successRate: number;
    totalExecutions: number;
  } {
    const executions = this.executionHistory.filter(e => e.dimension === dimension);
    
    if (executions.length === 0) {
      return {
        averageMemory: 0,
        averageTime: 0,
        successRate: 0,
        totalExecutions: 0
      };
    }
    
    const averageMemory = executions.reduce((sum, e) => sum + e.memoryUsage, 0) / executions.length;
    const averageTime = executions.reduce((sum, e) => sum + e.executionTime, 0) / executions.length;
    const successCount = executions.filter(e => e.outcome === 'success').length;
    const successRate = successCount / executions.length;
    
    return {
      averageMemory,
      averageTime,
      successRate,
      totalExecutions: executions.length
    };
  }

  /**
   * Update learned patterns based on tracked data
   */
  private updateLearnedPatterns(): void {
    this.learnedPatterns = Array.from(this.modificationPatterns.values()).map(pattern => {
      const totalAttempts = pattern.successCount + pattern.failureCount;
      const successRate = totalAttempts > 0 ? pattern.successCount / totalAttempts : 0;
      
      // Calculate confidence based on usage count and consistency
      const usageCount = totalAttempts;
      const consistency = this.calculateConsistency(pattern);
      const confidence = Math.min(1, (usageCount / 10) * 0.5 + consistency * 0.5);
      
      // Generate recommendations
      const recommendations = this.generateRecommendations(pattern, successRate);
      
      return {
        pattern,
        confidence,
        usageCount,
        lastSuccessRate: successRate,
        recommendations
      };
    });
    
    // Sort by confidence
    this.learnedPatterns.sort((a, b) => b.confidence - a.confidence);
  }

  /**
   * Calculate consistency of a pattern (how stable its results are)
   */
  private calculateConsistency(pattern: ModificationPattern): number {
    // For now, simple consistency based on success rate
    // Higher success rate = more consistent
    const totalAttempts = pattern.successCount + pattern.failureCount;
    if (totalAttempts === 0) return 0;
    
    const successRate = pattern.successCount / totalAttempts;
    
    // Consistency is higher when success rate is closer to 1.0 or 0.0
    // (consistent success or consistent failure)
    return 1 - Math.abs(successRate - 0.5) * 2;
  }

  /**
   * Generate recommendations for a pattern
   */
  private generateRecommendations(
    pattern: ModificationPattern,
    successRate: number
  ): string[] {
    const recommendations: string[] = [];
    
    if (successRate > 0.8) {
      recommendations.push('High success rate - consider using more frequently');
    } else if (successRate < 0.3) {
      recommendations.push('Low success rate - consider avoiding or modifying');
    }
    
    if (pattern.averageMemoryDelta > 50) {
      recommendations.push('High memory usage - consider optimization');
    }
    
    if (pattern.averageExecutionTime > 1000) {
      recommendations.push('Slow execution - consider optimization');
    }
    
    if (pattern.successCount + pattern.failureCount < 5) {
      recommendations.push('Insufficient data - need more executions to evaluate');
    }
    
    return recommendations;
  }

  /**
   * Hash pattern for ID generation
   */
  private hashPattern(pattern: string): string {
    // Simple hash function
    let hash = 0;
    for (let i = 0; i < pattern.length; i++) {
      const char = pattern.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(36);
  }

  /**
   * Export patterns to JSONL
   */
  exportToJSONL(): string {
    const lines: string[] = [];
    
    // Export modification patterns
    this.modificationPatterns.forEach(pattern => {
      lines.push(JSON.stringify({ type: 'modification-pattern', ...pattern }));
    });
    
    // Export learned patterns
    this.learnedPatterns.forEach(learned => {
      lines.push(JSON.stringify({ type: 'learned-pattern', ...learned }));
    });
    
    // Export recent execution history (last 100)
    this.executionHistory.slice(-100).forEach(execution => {
      lines.push(JSON.stringify({ type: 'execution-pattern', ...execution }));
    });
    
    return lines.join('\n');
  }

  /**
   * Load patterns from JSONL
   */
  loadFromJSONL(jsonl: string): void {
    const lines = jsonl.split('\n').filter(line => line.trim());
    
    lines.forEach(line => {
      try {
        const obj = JSON.parse(line);
        
        switch (obj.type) {
          case 'modification-pattern':
            this.modificationPatterns.set(obj.id, obj);
            break;
          case 'learned-pattern':
            this.learnedPatterns.push(obj);
            break;
          case 'execution-pattern':
            this.executionHistory.push(obj);
            break;
        }
      } catch (error) {
        console.warn(`Failed to parse JSONL line: ${line.substring(0, 100)}`);
      }
    });
    
    // Rebuild learned patterns
    this.updateLearnedPatterns();
  }
}
