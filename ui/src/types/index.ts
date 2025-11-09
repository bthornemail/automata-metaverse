// Automaton State Types
export interface AutomatonState {
  id: string;
  type: string;
  currentState: string;
  dimensionalLevel: number;
  selfReference: {
    file: string;
    line: number;
    pattern: string;
  };
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  color?: string;
  text?: string;
}

export interface Transition {
  id: string;
  type: string;
  from: string;
  to: string;
  condition: string;
  action: string;
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  color?: string;
  text?: string;
}

export interface VerticalTransition {
  id: string;
  type: string;
  fromNode: string;
  toNode: string;
  label: string;
}

export type CanvasObject = AutomatonState | Transition | VerticalTransition | any;

// Dashboard State
export interface DashboardState {
  isRunning: boolean;
  currentDimension: number;
  iterationCount: number;
  selfModificationCount: number;
  totalObjects: number;
  executionMode: 'builtin' | 'ollama';
  ollamaModel?: string;
  lastAction?: string;
  status: 'idle' | 'running' | 'error';
}

// Dimension Information
export interface Dimension {
  level: number;
  name: string;
  churchEncoding: string;
  currentState: string;
  selfReference: { line: number; pattern: string };
  color: string;
  position: { x: number; y: number };
  description: string;
}

// Action Controls
export interface ActionControls {
  availableActions: string[];
  selectedAction: string;
  executionHistory: string[];
  intervalMs: number;
  maxIterations: number;
}

// Self-Reference Data
export interface SelfReferenceData {
  selfRefObjects: Array<{ id: string; line: number; text: string }>;
  automata: Array<{ id: string; dimension: number; pattern: string }>;
  modifications: Array<{ timestamp: number; type: string; details: string }>;
  integrity: { valid: boolean; issues: string[] };
}

// Execution Data
export interface ExecutionData {
  history: Array<{ iteration: number; action: string; from: string; to: string; timestamp: number }>;
  actionFrequency: Map<string, number>;
  dimensionalProgression: Array<{ dimension: number; timestamp: number; duration: number }>;
  performanceMetrics: { avgExecutionTime: number; successRate: number };
}

// Agent Chat Message
export interface ChatMessage {
  role: 'user' | 'agent';
  content: string;
  timestamp: number;
  citations?: Array<{
    source: string;
    type: 'document' | 'agent' | 'function' | 'rule';
    title?: string;
    lineNumber?: number;
    url?: string;
  }>;
  confidence?: number;
  followUpSuggestions?: string[];
  relatedEntities?: Array<{
    id: string;
    type: string;
    name: string;
  }>;
  performanceMetrics?: {
    responseTime: number;
    queryTime: number;
    processingTime: number;
  };
}

// Agent Chat
export interface AgentChat {
  messages: ChatMessage[];
  availableAgents: string[];
  activeAgent: string;
  suggestions: string[];
}

// Quantum State
export interface QuantumState {
  qubits: Array<{ id: number; state: Complex[]; probability: number }>;
  entanglements: Array<{ qubits: number[]; strength: number }>;
  measurements: Array<{ qubit: number; result: 0 | 1; timestamp: number }>;
}

// Complex Number for Quantum States
export interface Complex {
  real: number;
  imag: number;
}

// System Configuration
export interface SystemConfig {
  automatonFile: string;
  useOllama: boolean;
  ollamaModel: string;
  defaultInterval: number;
  autoSave: boolean;
  loggingLevel: 'debug' | 'info' | 'warn' | 'error';
  visualizationSettings: {
    showTransitions: boolean;
    animateProgression: boolean;
    colorScheme: 'default' | 'dark' | 'quantum';
  };
}

// API Response Types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  timestamp: number;
}

// WebSocket Message Types
export interface WebSocketMessage {
  type: 'status' | 'dimension' | 'action' | 'modification' | 'error';
  payload: any;
  timestamp: number;
}

// Real-time Update Handlers
export interface RealtimeUpdates {
  onStatusUpdate: (status: DashboardState) => void;
  onDimensionChange: (dimension: number) => void;
  onActionExecuted: (action: string, result: any) => void;
  onSelfModification: (modification: any) => void;
  onError: (error: string) => void;
}