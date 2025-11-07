import { DashboardState, WebSocketMessage, RealtimeUpdates } from '@/types';
import { io, Socket } from 'socket.io-client';

class WebSocketService {
  private socket: Socket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;
  private handlers: Partial<RealtimeUpdates> = {};

  connect(url: string = import.meta.env.VITE_WS_URL || import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:3000') {
    try {
      this.socket = io(url, {
        transports: ['websocket', 'polling'],
        timeout: 20000,
        forceNew: true
      });
      
      this.socket.on('connect', () => {
        console.log('Socket.IO connected');
        this.reconnectAttempts = 0;
      });

      this.socket.on('status', (data: DashboardState) => {
        this.handlers.onStatusUpdate?.(data);
      });

      this.socket.on('dimension', (data: { dimension: number }) => {
        this.handlers.onDimensionChange?.(data.dimension);
      });

      this.socket.on('action', (data: { action: string; result: string; timestamp: number; from?: string; to?: string; iteration?: number }) => {
        this.handlers.onActionExecuted?.(data.action, data);
      });

      this.socket.on('modification', (data: any) => {
        this.handlers.onSelfModification?.(data);
      });

      this.socket.on('error', (data: any) => {
        this.handlers.onError?.(data.error || data);
      });

      this.socket.on('disconnect', () => {
        console.log('Socket.IO disconnected');
        this.attemptReconnect();
      });

      this.socket.on('connect_error', (error) => {
        console.error('Socket.IO connection error:', error);
        this.handlers.onError?.('Socket.IO connection error');
      });

    } catch (error) {
      console.error('Failed to create Socket.IO connection:', error);
      this.handlers.onError?.('Failed to connect to Socket.IO');
    }
  }

  // Message handling is now done through individual event listeners above

  private attemptReconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      console.log(`Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts})...`);
      
      setTimeout(() => {
        this.connect();
      }, this.reconnectDelay * this.reconnectAttempts);
    } else {
      console.error('Max reconnection attempts reached');
      this.handlers.onError?.('Failed to reconnect to Socket.IO');
    }
  }

  // Register event handlers
  onUpdateHandlers(handlers: Partial<RealtimeUpdates>) {
    this.handlers = { ...this.handlers, ...handlers };
  }

  // Send messages to server
  sendAction(action: string, params?: any) {
    if (this.socket && this.socket.connected) {
      this.socket.emit('action', { action, params });
    }
  }

  sendCommand(command: string, params?: any) {
    if (this.socket && this.socket.connected) {
      this.socket.emit('command', { command, params });
    }
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  isConnected(): boolean {
    return this.socket?.connected || false;
  }
}

export const wsService = new WebSocketService();