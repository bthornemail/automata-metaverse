/**
 * Performance Monitoring for Meta-Log Plugin
 * Provides query timing, memory usage tracking, and operation metrics
 */

export interface PerformanceMetric {
  name: string;
  type: 'query' | 'operation' | 'memory' | 'custom';
  duration?: number;
  memoryDelta?: number;
  timestamp: Date;
  metadata?: Record<string, any>;
}

export interface PerformanceStats {
  totalQueries: number;
  averageQueryTime: number;
  totalOperations: number;
  averageOperationTime: number;
  peakMemoryUsage: number;
  currentMemoryUsage: number;
  metrics: PerformanceMetric[];
}

/**
 * Performance Monitor
 */
export class PerformanceMonitor {
  private metrics: PerformanceMetric[] = [];
  private maxMetrics: number = 1000;
  private startMemory?: NodeJS.MemoryUsage;

  constructor() {
    if (typeof process !== 'undefined' && process.memoryUsage) {
      this.startMemory = process.memoryUsage();
    }
  }

  /**
   * Start timing an operation
   */
  startTiming(name: string, type: 'query' | 'operation' | 'memory' | 'custom' = 'operation'): () => void {
    const startTime = Date.now();
    const startMem = this.getMemoryUsage();

    return () => {
      const duration = Date.now() - startTime;
      const endMem = this.getMemoryUsage();
      const memoryDelta = endMem ? endMem.heapUsed - (startMem?.heapUsed || 0) : undefined;

      this.recordMetric({
        name,
        type,
        duration,
        memoryDelta,
        timestamp: new Date()
      });
    };
  }

  /**
   * Record a performance metric
   */
  recordMetric(metric: PerformanceMetric): void {
    this.metrics.push(metric);

    // Keep only recent metrics
    if (this.metrics.length > this.maxMetrics) {
      this.metrics.shift();
    }
  }

  /**
   * Record query execution time
   */
  async recordQuery<T>(name: string, queryFn: () => Promise<T>): Promise<T> {
    const stopTiming = this.startTiming(name, 'query');
    try {
      const result = await queryFn();
      stopTiming();
      return result;
    } catch (error) {
      stopTiming();
      this.recordMetric({
        name: `${name} (error)`,
        type: 'query',
        timestamp: new Date(),
        metadata: { error: error instanceof Error ? error.message : String(error) }
      });
      throw error;
    }
  }

  /**
   * Record operation execution time
   */
  async recordOperation<T>(name: string, operationFn: () => Promise<T>): Promise<T> {
    const stopTiming = this.startTiming(name, 'operation');
    try {
      const result = await operationFn();
      stopTiming();
      return result;
    } catch (error) {
      stopTiming();
      this.recordMetric({
        name: `${name} (error)`,
        type: 'operation',
        timestamp: new Date(),
        metadata: { error: error instanceof Error ? error.message : String(error) }
      });
      throw error;
    }
  }

  /**
   * Get performance statistics
   */
  getStats(): PerformanceStats {
    const queryMetrics = this.metrics.filter(m => m.type === 'query');
    const operationMetrics = this.metrics.filter(m => m.type === 'operation');
    const memoryMetrics = this.metrics.filter(m => m.type === 'memory');

    const queryTimes = queryMetrics
      .filter(m => m.duration !== undefined)
      .map(m => m.duration!);
    const operationTimes = operationMetrics
      .filter(m => m.duration !== undefined)
      .map(m => m.duration!);

    const currentMem = this.getMemoryUsage();

    return {
      totalQueries: queryMetrics.length,
      averageQueryTime: queryTimes.length > 0
        ? queryTimes.reduce((a, b) => a + b, 0) / queryTimes.length
        : 0,
      totalOperations: operationMetrics.length,
      averageOperationTime: operationTimes.length > 0
        ? operationTimes.reduce((a, b) => a + b, 0) / operationTimes.length
        : 0,
      peakMemoryUsage: memoryMetrics.length > 0
        ? Math.max(...memoryMetrics
            .filter(m => m.memoryDelta !== undefined)
            .map(m => m.memoryDelta!)
          )
        : 0,
      currentMemoryUsage: currentMem?.heapUsed || 0,
      metrics: [...this.metrics]
    };
  }

  /**
   * Get metrics by name
   */
  getMetricsByName(name: string): PerformanceMetric[] {
    return this.metrics.filter(m => m.name === name);
  }

  /**
   * Get metrics by type
   */
  getMetricsByType(type: PerformanceMetric['type']): PerformanceMetric[] {
    return this.metrics.filter(m => m.type === type);
  }

  /**
   * Get memory usage
   */
  private getMemoryUsage(): NodeJS.MemoryUsage | undefined {
    if (typeof process !== 'undefined' && process.memoryUsage) {
      return process.memoryUsage();
    }
    return undefined;
  }

  /**
   * Record memory snapshot
   */
  recordMemorySnapshot(name: string): void {
    const mem = this.getMemoryUsage();
    if (mem) {
      this.recordMetric({
        name,
        type: 'memory',
        timestamp: new Date(),
        metadata: {
          heapUsed: mem.heapUsed,
          heapTotal: mem.heapTotal,
          rss: mem.rss,
          external: mem.external
        }
      });
    }
  }

  /**
   * Clear all metrics
   */
  clear(): void {
    this.metrics = [];
  }

  /**
   * Get recent metrics (last N)
   */
  getRecentMetrics(count: number = 100): PerformanceMetric[] {
    return this.metrics.slice(-count);
  }

  /**
   * Export metrics as JSON
   */
  exportMetrics(): string {
    return JSON.stringify({
      stats: this.getStats(),
      metrics: this.metrics
    }, null, 2);
  }
}
