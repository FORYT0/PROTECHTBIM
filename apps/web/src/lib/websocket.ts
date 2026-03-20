import { io, Socket } from 'socket.io-client';

const WS_URL = import.meta.env.VITE_WS_URL || 'http://localhost:3000';

class WebSocketClient {
  private socket: Socket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;

  connect(token: string): void {
    if (this.socket?.connected) {
      console.log('[WebSocket] Already connected');
      return;
    }

    console.log('[WebSocket] Connecting to', WS_URL);

    this.socket = io(WS_URL, {
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: this.reconnectDelay,
      reconnectionAttempts: this.maxReconnectAttempts,
    });

    this.socket.on('connect', () => {
      console.log('[WebSocket] Connected:', this.socket?.id);
      this.reconnectAttempts = 0;
    });

    this.socket.on('disconnect', (reason) => {
      console.log('[WebSocket] Disconnected:', reason);
    });

    this.socket.on('connect_error', (error) => {
      console.error('[WebSocket] Connection error:', error.message);
      this.reconnectAttempts++;

      if (this.reconnectAttempts >= this.maxReconnectAttempts) {
        console.error('[WebSocket] Max reconnection attempts reached');
        this.disconnect();
      }
    });

    this.socket.on('error', (error) => {
      console.error('[WebSocket] Error:', error);
    });
  }

  disconnect(): void {
    if (this.socket) {
      console.log('[WebSocket] Disconnecting');
      this.socket.disconnect();
      this.socket = null;
    }
  }

  joinProject(projectId: string): void {
    if (this.socket?.connected) {
      console.log('[WebSocket] Joining project:', projectId);
      this.socket.emit('join_project', projectId);
    }
  }

  leaveProject(projectId: string): void {
    if (this.socket?.connected) {
      console.log('[WebSocket] Leaving project:', projectId);
      this.socket.emit('leave_project', projectId);
    }
  }

  on(event: string, callback: (...args: any[]) => void): void {
    if (this.socket) {
      this.socket.on(event, callback);
    }
  }

  off(event: string, callback?: (...args: any[]) => void): void {
    if (this.socket) {
      this.socket.off(event, callback);
    }
  }

  isConnected(): boolean {
    return this.socket?.connected || false;
  }
}

// Export singleton instance
export const wsClient = new WebSocketClient();

// Real-time event types (must match backend)
export enum RealtimeEventType {
  // Project events
  PROJECT_CREATED = 'project:created',
  PROJECT_UPDATED = 'project:updated',
  PROJECT_DELETED = 'project:deleted',

  // Budget events
  BUDGET_CREATED = 'budget:created',
  BUDGET_UPDATED = 'budget:updated',
  BUDGET_DELETED = 'budget:deleted',

  // Cost events
  COST_ENTRY_CREATED = 'cost_entry:created',
  COST_ENTRY_UPDATED = 'cost_entry:updated',
  COST_ENTRY_DELETED = 'cost_entry:deleted',
  COST_ENTRY_APPROVED = 'cost_entry:approved',

  // Time events
  TIME_ENTRY_CREATED = 'time_entry:created',
  TIME_ENTRY_UPDATED = 'time_entry:updated',
  TIME_ENTRY_DELETED = 'time_entry:deleted',

  // Work package events
  WORK_PACKAGE_CREATED = 'work_package:created',
  WORK_PACKAGE_UPDATED = 'work_package:updated',
  WORK_PACKAGE_DELETED = 'work_package:deleted',

  // Financial summary events (triggers dashboard refresh)
  FINANCIAL_SUMMARY_UPDATED = 'financial_summary:updated',

  // Activity events
  ACTIVITY_CREATED = 'activity:created',

  // Comment events
  COMMENT_CREATED = 'comment:created',
  COMMENT_UPDATED = 'comment:updated',
  COMMENT_DELETED = 'comment:deleted',

  // Change Order events
  CHANGE_ORDER_CREATED = 'change_order:created',
  CHANGE_ORDER_UPDATED = 'change_order:updated',
  CHANGE_ORDER_APPROVED = 'change_order:approved',
  CHANGE_ORDER_REJECTED = 'change_order:rejected',

  // Daily Report events
  DAILY_REPORT_CREATED = 'daily_report:created',
  DAILY_REPORT_UPDATED = 'daily_report:updated',

  // Snag events
  SNAG_CREATED = 'snag:created',
  SNAG_UPDATED = 'snag:updated',
  SNAG_RESOLVED = 'snag:resolved',

  // Contract events
  CONTRACT_CREATED = 'contract:created',
  CONTRACT_UPDATED = 'contract:updated',
  CONTRACT_DELETED = 'contract:deleted',
}
