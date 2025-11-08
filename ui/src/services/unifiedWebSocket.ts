import { io, Socket } from 'socket.io-client';
import type { DashboardState, WebSocketMessage } from '@/types';

// Event bus for component communication
type EventCallback = (...args: any[]) => void;
type EventType = string;

class ComponentEventBus {
  private listeners: Map<EventType, Set<EventCallback>> = new Map();

  on(event: EventType, callback: EventCallback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(callback);

    // Return unsubscribe function
    return () => {
      this.listeners.get(event)?.delete(callback);
    };
  }

  off(event: EventType, callback: EventCallback) {
    this.listeners.get(event)?.delete(callback);
  }

  emit(event: EventType, ...args: any[]) {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      callbacks.forEach((callback) => {
        try {
          callback(...args);
        } catch (error) {
          console.error(`Error in event listener for ${event}:`, error);
        }
      });
    }
  }

  once(event: EventType, callback: EventCallback) {
    const wrappedCallback = (...args: any[]) => {
      callback(...args);
      this.off(event, wrappedCallback);
    };
    this.on(event, wrappedCallback);
  }

  clear() {
    this.listeners.clear();
  }
}

// Unified WebSocket Service
class UnifiedWebSocketService {
  private socket: Socket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;
  private reconnectTimer: NodeJS.Timeout | null = null;
  private messageQueue: Array<{ event: string; data: any }> = [];
  private eventBus = new ComponentEventBus();
  private connectionHandlers: Set<(connected: boolean) => void> = new Set();

  connect(url: string = import.meta.env.VITE_WS_URL || import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:3000') {
    if (this.socket?.connected) {
      return;
    }

    try {
      this.socket = io(url, {
        transports: ['websocket', 'polling'],
        timeout: 20000,
        forceNew: true,
        reconnection: false, // Manual reconnection
      });

      this.socket.on('connect', () => {
        console.log('Socket.IO connected');
        this.reconnectAttempts = 0;
        this.notifyConnectionHandlers(true);
        this.flushMessageQueue();
        this.eventBus.emit('ws:connected');
      });

      this.socket.on('disconnect', () => {
        console.log('Socket.IO disconnected');
        this.notifyConnectionHandlers(false);
        this.eventBus.emit('ws:disconnected');
        this.attemptReconnect();
      });

      this.socket.on('connect_error', (error) => {
        console.error('Socket.IO connection error:', error);
        this.notifyConnectionHandlers(false);
        this.eventBus.emit('ws:error', error);
      });

      // Server events
      this.socket.on('status', (data: DashboardState) => {
        this.eventBus.emit('status:update', data);
        this.eventBus.emit('dimension:changed', data.currentDimension);
      });

      this.socket.on('dimension', (data: { dimension: number }) => {
        this.eventBus.emit('dimension:changed', data.dimension);
      });

      this.socket.on('action', (data: {
        action: string;
        result: string;
        timestamp: number;
        from?: string;
        to?: string;
        iteration?: number;
      }) => {
        this.eventBus.emit('action:executed', data);
      });

      this.socket.on('modification', (data: any) => {
        this.eventBus.emit('self-modification', data);
      });

      this.socket.on('error', (data: any) => {
        // Safely convert error to string
        let errorMessage: string;
        if (data && typeof data === 'object' && !Array.isArray(data)) {
          if (typeof data.error === 'string') {
            errorMessage = data.error;
          } else if (data.error instanceof Error) {
            errorMessage = data.error.message || String(data.error);
          } else {
            try {
              errorMessage = String(data.error || data);
            } catch (e) {
              errorMessage = 'An error occurred';
            }
          }
        } else if (typeof data === 'string') {
          errorMessage = data;
        } else {
          try {
            errorMessage = String(data);
          } catch (e) {
            errorMessage = 'An error occurred';
          }
        }
        this.eventBus.emit('error', errorMessage);
      });

    } catch (error) {
      console.error('Failed to create Socket.IO connection:', error);
      this.notifyConnectionHandlers(false);
      this.eventBus.emit('ws:error', error);
    }
  }

  private attemptReconnect() {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
    }

    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      console.log(`Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts})...`);

      this.reconnectTimer = setTimeout(() => {
        if (this.socket) {
          this.socket.connect();
        } else {
          this.connect();
        }
      }, this.reconnectDelay * this.reconnectAttempts);
    } else {
      console.error('Max reconnection attempts reached');
      this.eventBus.emit('ws:max-reconnect-reached');
    }
  }

  private flushMessageQueue() {
    while (this.messageQueue.length > 0 && this.socket?.connected) {
      const message = this.messageQueue.shift();
      if (message) {
        this.socket.emit(message.event, message.data);
      }
    }
  }

  private notifyConnectionHandlers(connected: boolean) {
    this.connectionHandlers.forEach((handler) => {
      try {
        handler(connected);
      } catch (error) {
        console.error('Error in connection handler:', error);
      }
    });
  }

  // Public API
  onConnectionChange(handler: (connected: boolean) => void) {
    this.connectionHandlers.add(handler);
    return () => {
      this.connectionHandlers.delete(handler);
    };
  }

  // Event bus access
  getEventBus() {
    return this.eventBus;
  }

  // Send messages
  sendAction(action: string, params?: any) {
    if (this.socket?.connected) {
      this.socket.emit('action', { action, params });
    } else {
      this.messageQueue.push({ event: 'action', data: { action, params } });
    }
  }

  sendCommand(command: string, params?: any) {
    if (this.socket?.connected) {
      this.socket.emit('command', { command, params });
    } else {
      this.messageQueue.push({ event: 'command', data: { command, params } });
    }
  }

  disconnect() {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }

    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }

    this.messageQueue = [];
    this.reconnectAttempts = 0;
    this.eventBus.clear();
    this.connectionHandlers.clear();
  }

  isConnected(): boolean {
    return this.socket?.connected || false;
  }

  reconnect() {
    this.reconnectAttempts = 0;
    if (this.socket) {
      this.socket.connect();
    } else {
      this.connect();
    }
  }
}

export const unifiedWebSocket = new UnifiedWebSocketService();
export const componentBus = unifiedWebSocket.getEventBus();
