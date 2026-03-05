/**
 * Automata Metaverse - Main Entry Point
 *
 * Automaton execution engines for self-referential CanvasL/JSONL systems
 */
export { AdvancedSelfReferencingAutomaton } from './engines/advanced-automaton.js';
export { ContinuousAutomatonRunner } from './engines/continuous-automaton.js';
export { OllamaAutomatonRunner } from './engines/ollama-automaton.js';
export { MemoryOptimizedAutomaton } from './engines/automaton-memory-optimized.js';
export { EvolvedAutomaton } from './engines/automaton-evolved.js';
export { ScalableAutomaton } from './engines/automaton-scalable.js';
export { LearningAutomaton } from './engines/learning-automaton.js';
export { OptimizedBootstrap } from './engines/bootstrap-automaton.js';
export { AutomatonController } from './server/automaton-controller.js';
export type { AutomatonControllerConfig, AutomatonState as ControllerState } from './server/automaton-controller.js';
export { calculateActionFrequency } from './server/automaton-analysis.js';
export type { ActionFrequency } from './server/automaton-analysis.js';
export { VectorClock } from './vector-clock/vector-clock.js';
export { VectorClockAutomaton } from './vector-clock/vector-clock-automaton.js';
export type { MetaLog, AutomatonMessage, SwarmContext } from './vector-clock/vector-clock-automaton.js';
export type { AutomatonState as VectorClockAutomatonState } from './vector-clock/vector-clock-automaton.js';
export { MLVectorClockAutomaton } from './vector-clock/ml-vector-clock-automaton.js';
export { A0_TopologyAutomaton } from './vector-clock/dimension-automata/0d-topology-automaton.js';
export { ObjectPool } from './memory/object-pool.js';
export { getMemoryState, assessMemoryPressure, forceGarbageCollection, formatMemory, MEMORY_THRESHOLDS } from './memory/memory-utils.js';
export type { MemoryState, MemoryPressure } from './memory/memory-utils.js';
export type { AutomatonState, Transition, VerticalTransition, CanvasObject } from './types/automaton-state.js';
//# sourceMappingURL=index.d.ts.map