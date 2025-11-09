import { PerformanceMonitor } from '../utils/performance.js';

describe('PerformanceMonitor', () => {
  let monitor: PerformanceMonitor;

  beforeEach(() => {
    monitor = new PerformanceMonitor();
  });

  describe('Timing', () => {
    test('should time operations', async () => {
      const stopTiming = monitor.startTiming('test-operation');

      await new Promise(resolve => setTimeout(resolve, 10));
      stopTiming();

      const stats = monitor.getStats();
      const metrics = monitor.getMetricsByName('test-operation');

      expect(metrics.length).toBe(1);
      expect(metrics[0].duration).toBeDefined();
      expect(metrics[0].duration).toBeGreaterThan(0);
    });

    test('should record query performance', async () => {
      const result = await monitor.recordQuery('test-query', async () => {
        await new Promise(resolve => setTimeout(resolve, 10));
        return { data: 'result' };
      });

      expect(result).toEqual({ data: 'result' });

      const stats = monitor.getStats();
      expect(stats.totalQueries).toBe(1);
      expect(stats.averageQueryTime).toBeGreaterThan(0);
    });

    test('should record operation performance', async () => {
      const result = await monitor.recordOperation('test-op', async () => {
        await new Promise(resolve => setTimeout(resolve, 10));
        return 'done';
      });

      expect(result).toBe('done');

      const stats = monitor.getStats();
      expect(stats.totalOperations).toBe(1);
      expect(stats.averageOperationTime).toBeGreaterThan(0);
    });
  });

  describe('Metrics', () => {
    test('should record metrics', () => {
      monitor.recordMetric({
        name: 'custom-metric',
        type: 'custom',
        timestamp: new Date(),
        duration: 100
      });

      const metrics = monitor.getMetricsByName('custom-metric');
      expect(metrics.length).toBe(1);
    });

    test('should filter metrics by type', () => {
      monitor.recordMetric({
        name: 'query1',
        type: 'query',
        timestamp: new Date()
      });

      monitor.recordMetric({
        name: 'op1',
        type: 'operation',
        timestamp: new Date()
      });

      const queryMetrics = monitor.getMetricsByType('query');
      expect(queryMetrics.length).toBe(1);
      expect(queryMetrics[0].name).toBe('query1');
    });

    test('should limit metrics', () => {
      // Add more than max metrics
      for (let i = 0; i < 1500; i++) {
        monitor.recordMetric({
          name: `metric-${i}`,
          type: 'custom',
          timestamp: new Date()
        });
      }

      const stats = monitor.getStats();
      expect(stats.metrics.length).toBeLessThanOrEqual(1000);
    });
  });

  describe('Statistics', () => {
    test('should calculate statistics', async () => {
      await monitor.recordQuery('q1', async () => {
        await new Promise(resolve => setTimeout(resolve, 10));
        return {};
      });

      await monitor.recordQuery('q2', async () => {
        await new Promise(resolve => setTimeout(resolve, 20));
        return {};
      });

      const stats = monitor.getStats();

      expect(stats.totalQueries).toBe(2);
      expect(stats.averageQueryTime).toBeGreaterThan(0);
      expect(stats.totalOperations).toBe(0);
    });

    test('should track memory usage', () => {
      monitor.recordMemorySnapshot('snapshot1');

      const stats = monitor.getStats();
      expect(stats.currentMemoryUsage).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Export', () => {
    test('should export metrics as JSON', () => {
      monitor.recordMetric({
        name: 'test',
        type: 'custom',
        timestamp: new Date()
      });

      const json = monitor.exportMetrics();
      const parsed = JSON.parse(json);

      expect(parsed.stats).toBeDefined();
      expect(parsed.metrics).toBeDefined();
    });
  });

  describe('Clear', () => {
    test('should clear metrics', () => {
      monitor.recordMetric({
        name: 'test',
        type: 'custom',
        timestamp: new Date()
      });

      expect(monitor.getStats().metrics.length).toBe(1);

      monitor.clear();
      expect(monitor.getStats().metrics.length).toBe(0);
    });
  });

  describe('Recent metrics', () => {
    test('should get recent metrics', () => {
      for (let i = 0; i < 50; i++) {
        monitor.recordMetric({
          name: `metric-${i}`,
          type: 'custom',
          timestamp: new Date()
        });
      }

      const recent = monitor.getRecentMetrics(10);
      expect(recent.length).toBe(10);
      expect(recent[0].name).toBe('metric-40'); // Last 10
    });
  });
});
