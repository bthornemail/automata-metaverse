/**
 * Automaton Analysis Unit Tests
 */

import {
  calculateActionFrequency,
  calculateDimensionalProgression,
  calculatePerformanceMetrics,
  analyzeSelfReferences,
  analyzePatterns,
} from '../../../src/server/automaton-analysis';

// Mock automaton
const createMockAutomaton = (overrides: any = {}) => {
  return {
    currentDimension: 0,
    executionHistory: [],
    selfModificationCount: 0,
    objects: [],
    ...overrides,
  } as any;
};

describe('Automaton Analysis', () => {
  describe('calculateActionFrequency', () => {
    it('should calculate frequency of actions', () => {
      const automaton = createMockAutomaton({
        executionHistory: [
          { action: 'evolve', timestamp: Date.now() },
          { action: 'evolve', timestamp: Date.now() },
          { action: 'self-modify', timestamp: Date.now() },
        ],
      });

      const frequency = calculateActionFrequency(automaton as any);

      expect(frequency).toBeDefined();
      expect(frequency.length).toBeGreaterThan(0);
      expect(frequency.find((f) => f.action === 'evolve')?.count).toBe(2);
      expect(frequency.find((f) => f.action === 'self-modify')?.count).toBe(1);
    });

    it('should handle empty history', () => {
      const automaton = createMockAutomaton();
      const frequency = calculateActionFrequency(automaton as any);

      expect(frequency).toEqual([]);
    });

    it('should calculate percentages', () => {
      const automaton = createMockAutomaton({
        executionHistory: [
          { action: 'evolve', timestamp: Date.now() },
          { action: 'evolve', timestamp: Date.now() },
          { action: 'self-modify', timestamp: Date.now() },
        ],
      });

      const frequency = calculateActionFrequency(automaton as any);
      const evolveFreq = frequency.find((f) => f.action === 'evolve');

      expect(evolveFreq?.percentage).toBeCloseTo(66.67, 1);
    });
  });

  describe('calculateDimensionalProgression', () => {
    it('should calculate dimensional progression', () => {
      const automaton = createMockAutomaton({
        executionHistory: [
          { from: '0D', to: '1D', timestamp: Date.now() },
          { from: '1D', to: '2D', timestamp: Date.now() },
          { from: '2D', to: '2D', timestamp: Date.now() },
        ],
      });

      const progression = calculateDimensionalProgression(automaton as any);

      expect(progression).toBeDefined();
      expect(progression.length).toBeGreaterThan(0);
    });

    it('should count transitions', () => {
      const automaton = createMockAutomaton({
        executionHistory: [
          { from: '0D', to: '1D', timestamp: Date.now() },
          { from: '1D', to: '2D', timestamp: Date.now() },
        ],
      });

      const progression = calculateDimensionalProgression(automaton as any);
      const dim1 = progression.find((p) => p.dimension === 1);

      expect(dim1?.transitions).toBeGreaterThan(0);
    });
  });

  describe('calculatePerformanceMetrics', () => {
    it('should calculate performance metrics', () => {
      const automaton = createMockAutomaton({
        executionHistory: [
          { timestamp: Date.now() - 2000 },
          { timestamp: Date.now() - 1000 },
          { timestamp: Date.now() },
        ],
        selfModificationCount: 5,
      });

      const metrics = calculatePerformanceMetrics(automaton as any);

      expect(metrics).toBeDefined();
      expect(metrics.totalIterations).toBe(3);
      expect(metrics.selfModifications).toBe(5);
    });

    it('should handle empty history', () => {
      const automaton = createMockAutomaton();
      const metrics = calculatePerformanceMetrics(automaton as any);

      expect(metrics.totalIterations).toBe(0);
      expect(metrics.averageIterationTime).toBe(0);
    });
  });

  describe('analyzeSelfReferences', () => {
    it('should find self-reference objects', () => {
      const automaton = createMockAutomaton({
        objects: [
          { id: 'self-ref', type: 'self-ref' },
          { id: 'normal', type: 'node' },
          { id: 'self-ref-2', metadata: { selfReference: true } },
        ],
      });

      const analysis = analyzeSelfReferences(automaton as any);

      expect(analysis.count).toBe(2);
      expect(analysis.references.length).toBe(2);
    });

    it('should return empty for no self-references', () => {
      const automaton = createMockAutomaton({
        objects: [{ id: 'normal', type: 'node' }],
      });

      const analysis = analyzeSelfReferences(automaton as any);

      expect(analysis.count).toBe(0);
    });
  });

  describe('analyzePatterns', () => {
    it('should detect action cycles', () => {
      const automaton = createMockAutomaton({
        executionHistory: [
          { action: 'evolve', timestamp: Date.now() },
          { action: 'self-modify', timestamp: Date.now() },
          { action: 'evolve', timestamp: Date.now() },
          { action: 'self-modify', timestamp: Date.now() },
        ],
      });

      const patterns = analyzePatterns(automaton as any);

      expect(patterns).toBeDefined();
      expect(patterns.patterns).toBeDefined();
      expect(patterns.cycles).toBeDefined();
    });

    it('should calculate action diversity', () => {
      const automaton = createMockAutomaton({
        executionHistory: [
          { action: 'evolve', timestamp: Date.now() },
          { action: 'self-modify', timestamp: Date.now() },
          { action: 'evolve', timestamp: Date.now() },
        ],
      });

      const patterns = analyzePatterns(automaton as any);

      expect(patterns.patterns.actionDiversity).toBe(2);
    });
  });
});
