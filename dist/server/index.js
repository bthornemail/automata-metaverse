/**
 * Automata Metaverse - Server Entry Point
 *
 * Server-side components (includes Socket.IO integration)
 */
// Server-side components
export { AutomatonController } from './automaton-controller.js';
export { calculateActionFrequency } from './automaton-analysis.js';
// Core execution engines (server-compatible)
export { AdvancedSelfReferencingAutomaton } from '../engines/advanced-automaton.js';
export { ContinuousAutomatonRunner } from '../engines/continuous-automaton.js';
export { OllamaAutomatonRunner } from '../engines/ollama-automaton.js';
export { MemoryOptimizedAutomaton } from '../engines/automaton-memory-optimized.js';
export { OptimizedBootstrap } from '../engines/bootstrap-automaton.js';
// Vector clock systems
export { VectorClock } from '../vector-clock/vector-clock.js';
export { VectorClockAutomaton } from '../vector-clock/vector-clock-automaton.js';
export { MLVectorClockAutomaton } from '../vector-clock/ml-vector-clock-automaton.js';
// Memory management (server-compatible)
export { ObjectPool } from '../memory/object-pool.js';
export { getMemoryState, assessMemoryPressure, forceGarbageCollection, formatMemory, MEMORY_THRESHOLDS } from '../memory/memory-utils.js';
//# sourceMappingURL=index.js.map