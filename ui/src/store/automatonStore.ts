import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import type { DashboardState, SelfReferenceData, ExecutionData, AgentChat, QuantumState, SystemConfig } from '@/types';

// Unified Automaton State Interface
export interface UnifiedAutomatonState {
  // Core state
  status: DashboardState;
  currentDimension: number;
  executionHistory: ExecutionData | null;
  selfReference: SelfReferenceData | null;
  
  // UI state
  activeTab: string;
  theme: 'dark' | 'light' | 'quantum';
  notifications: Notification[];
  
  // Component states
  quantum: QuantumState | null;
  opencode: {
    connected: boolean;
    sessionId: string | null;
    suggestions: string[];
  };
  agents: AgentChat | null;
  
  // Configuration
  config: SystemConfig | null;
  
  // Loading and error states
  loading: {
    [key: string]: boolean;
  };
  errors: {
    [key: string]: string | null;
  };
  
  // WebSocket connection state
  wsConnected: boolean;
}

// Notification type
export interface Notification {
  id: string;
  type: 'info' | 'success' | 'warning' | 'error';
  message: string;
  timestamp: number;
  duration?: number;
}

// Actions interface
export interface AutomatonActions {
  // Status actions
  setStatus: (status: Partial<DashboardState>) => void;
  setDimension: (dimension: number) => void;
  
  // History actions
  setExecutionHistory: (history: ExecutionData) => void;
  addExecutionEntry: (entry: ExecutionData['history'][0]) => void;
  
  // Self-reference actions
  setSelfReference: (data: SelfReferenceData) => void;
  
  // UI actions
  setActiveTab: (tab: string) => void;
  setTheme: (theme: 'dark' | 'light' | 'quantum') => void;
  addNotification: (notification: Omit<Notification, 'id' | 'timestamp'>) => void;
  removeNotification: (id: string) => void;
  clearNotifications: () => void;
  
  // Component state actions
  setQuantumState: (state: QuantumState) => void;
  setOpenCodeState: (state: Partial<UnifiedAutomatonState['opencode']>) => void;
  setAgentChat: (chat: AgentChat) => void;
  addAgentMessage: (message: AgentChat['messages'][0]) => void;
  
  // Configuration actions
  setConfig: (config: SystemConfig) => void;
  updateConfig: (updates: Partial<SystemConfig>) => void;
  
  // Loading and error actions
  setLoading: (key: string, loading: boolean) => void;
  setError: (key: string, error: string | null) => void;
  clearError: (key: string) => void;
  
  // WebSocket actions
  setWsConnected: (connected: boolean) => void;
  
  // Reset actions
  reset: () => void;
}

// Initial state
const initialState: UnifiedAutomatonState = {
  status: {
    isRunning: false,
    currentDimension: 0,
    iterationCount: 0,
    selfModificationCount: 0,
    totalObjects: 0,
    executionMode: 'builtin',
    status: 'idle',
  },
  currentDimension: 0,
  executionHistory: null,
  selfReference: null,
  activeTab: 'overview',
  theme: 'dark',
  notifications: [],
  quantum: null,
  opencode: {
    connected: false,
    sessionId: null,
    suggestions: [],
  },
  agents: null,
  config: null,
  loading: {},
  errors: {},
  wsConnected: false,
};

// Create store with Zustand
export const useAutomatonStore = create<UnifiedAutomatonState & AutomatonActions>()(
  devtools(
    persist(
      (set, get) => ({
        ...initialState,
        
        // Status actions - only update if actually changed
        setStatus: (status) => set((state) => {
          // Check if status actually changed to prevent unnecessary updates
          const newStatus = { ...state.status, ...status };
          // Simple shallow comparison for common fields
          const statusChanged = 
            state.status.isRunning !== newStatus.isRunning ||
            state.status.currentDimension !== newStatus.currentDimension ||
            state.status.iterationCount !== newStatus.iterationCount ||
            state.status.selfModificationCount !== newStatus.selfModificationCount ||
            state.status.totalObjects !== newStatus.totalObjects ||
            state.status.executionMode !== newStatus.executionMode ||
            state.status.status !== newStatus.status ||
            state.status.lastAction !== newStatus.lastAction ||
            state.status.ollamaModel !== newStatus.ollamaModel;
          if (!statusChanged) return state;
          return { status: newStatus };
        }),
        
        setDimension: (dimension) => set((state) => {
          // Only update if dimension actually changed
          if (state.currentDimension === dimension) return state;
          return {
            currentDimension: dimension,
            status: { ...state.status, currentDimension: dimension },
          };
        }),
        
        // History actions
        setExecutionHistory: (history) => set({ executionHistory: history }),
        
        addExecutionEntry: (entry) => set((state) => ({
          executionHistory: state.executionHistory
            ? {
                ...state.executionHistory,
                history: [...state.executionHistory.history, entry],
              }
            : {
                history: [entry],
                actionFrequency: new Map(),
                dimensionalProgression: [],
                performanceMetrics: { avgExecutionTime: 0, successRate: 0 },
              },
        })),
        
        // Self-reference actions
        setSelfReference: (data) => set({ selfReference: data }),
        
        // UI actions
        setActiveTab: (tab) => set({ activeTab: tab }),
        
        setTheme: (theme) => set({ theme }),
        
        addNotification: (notification) => {
          const id = `notification-${Date.now()}-${Math.random()}`;
          const newNotification: Notification = {
            ...notification,
            id,
            timestamp: Date.now(),
          };
          set((state) => ({
            notifications: [...state.notifications, newNotification],
          }));
          
          // Auto-remove after duration
          if (notification.duration !== undefined) {
            setTimeout(() => {
              get().removeNotification(id);
            }, notification.duration);
          }
        },
        
        removeNotification: (id) => set((state) => ({
          notifications: state.notifications.filter((n) => n.id !== id),
        })),
        
        clearNotifications: () => set({ notifications: [] }),
        
        // Component state actions
        setQuantumState: (state) => set({ quantum: state }),
        
        setOpenCodeState: (state) => set((current) => ({
          opencode: { ...current.opencode, ...state },
        })),
        
        setAgentChat: (chat) => set({ agents: chat }),
        
        addAgentMessage: (message) => set((state) => ({
          agents: state.agents
            ? {
                ...state.agents,
                messages: [...state.agents.messages, message],
              }
            : {
                messages: [message],
                availableAgents: [],
                activeAgent: '',
                suggestions: [],
              },
        })),
        
        // Configuration actions
        setConfig: (config) => set({ config }),
        
        updateConfig: (updates) => set((state) => ({
          config: state.config ? { ...state.config, ...updates } : null,
        })),
        
        // Loading and error actions
        setLoading: (key, loading) => set((state) => ({
          loading: { ...state.loading, [key]: loading },
        })),
        
        setError: (key, error) => set((state) => ({
          errors: { ...state.errors, [key]: error },
        })),
        
        clearError: (key) => set((state) => {
          const newErrors = { ...state.errors };
          delete newErrors[key];
          return { errors: newErrors };
        }),
        
        // WebSocket actions
        setWsConnected: (connected) => set({ wsConnected: connected }),
        
        // Reset action
        reset: () => set(initialState),
      }),
      {
        name: 'automaton-store',
        partialize: (state) => ({
          theme: state.theme,
          config: state.config,
          activeTab: state.activeTab,
        }),
      }
    ),
    { name: 'AutomatonStore' }
  )
);

// Selectors for optimized access
export const useStatus = () => useAutomatonStore((state) => state.status);
export const useDimension = () => useAutomatonStore((state) => state.currentDimension);
export const useExecutionHistory = () => useAutomatonStore((state) => state.executionHistory);
export const useSelfReference = () => useAutomatonStore((state) => state.selfReference);
export const useActiveTab = () => useAutomatonStore((state) => state.activeTab);
export const useTheme = () => useAutomatonStore((state) => state.theme);
export const useNotifications = () => useAutomatonStore((state) => state.notifications);
export const useWsConnected = () => useAutomatonStore((state) => state.wsConnected);
