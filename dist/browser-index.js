/**
 * Automata Metaverse - Browser Entry Point
 *
 * Browser-compatible exports (excludes type-only exports for Rollup compatibility)
 */
// Core execution engines
export { AdvancedSelfReferencingAutomaton } from './engines/advanced-automaton.js';
export { ContinuousAutomatonRunner } from './engines/continuous-automaton.js';
export { OllamaAutomatonRunner } from './engines/ollama-automaton.js';
export { MemoryOptimizedAutomaton } from './engines/automaton-memory-optimized.js';
export { EvolvedAutomaton } from './engines/automaton-evolved.js';
export { ScalableAutomaton } from './engines/automaton-scalable.js';
export { LearningAutomaton } from './engines/learning-automaton.js';
export { OptimizedBootstrap } from './engines/bootstrap-automaton.js';
// Vector clock systems
export { VectorClock } from './vector-clock/vector-clock.js';
export { VectorClockAutomaton } from './vector-clock/vector-clock-automaton.js';
export { MLVectorClockAutomaton } from './vector-clock/ml-vector-clock-automaton.js';
export { A0_TopologyAutomaton } from './vector-clock/dimension-automata/0d-topology-automaton.js';
// Memory management
export { ObjectPool } from './memory/object-pool.js';
export { getMemoryState, assessMemoryPressure, forceGarbageCollection, formatMemory, MEMORY_THRESHOLDS } from './memory/memory-utils.js';
//# sourceMappingURL=browser-index.js.map