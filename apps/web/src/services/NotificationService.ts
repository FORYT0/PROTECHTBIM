import { io, Socket } from 'socket.io-client';

export enum NotificationType {
  ACTIVITY = 'activity',
  COMMENT = 'comment',
  MENTION = 'mention',
  ASSIGNMENT = 'assignment',
  ATTACHMENT = 'attachment',
  SYSTEM = 'system',
}

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  data?: Record<string, any>;
  read: boolean;
  createdAt: string;
}

class NotificationService {
  private socket: Socket | null = null;
  private listeners: Map<string, Function[]> = new Map();
  private notifications: Notification[] = [];

  /**
   * Connect to WebSocket server
   */
  public connect(token: string): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';
        // Strip /api/v1 if present for socket connection
        const socketUrl = apiUrl.replace(/\/api\/v1\/?$/, '');
        this.socket = io(socketUrl, {
          auth: { token },
          reconnection: true,
          reconnectionDelay: 1000,
          reconnectionDelayMax: 5000,
          reconnectionAttempts: 5,
        });

        this.socket.on('connect', () => {
          console.log('Connected to WebSocket server');
          this.emit('connected', {});
          resolve();
        });

        this.socket.on('disconnect', () => {
          console.log('Disconnected from WebSocket server');
          this.emit('disconnected', {});
        });

        this.socket.on('notification', (notification: Notification) => {
          this.notifications.unshift(notification);
          this.emit('notification', notification);
        });

        this.socket.on('error', (error: any) => {
          console.error('WebSocket error:', error);
          this.emit('error', error);
          reject(error);
        });
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Disconnect from WebSocket server
   */
  public disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  /**
   * Join project room for notifications
   */
  public joinProject(projectId: string): void {
    if (this.socket) {
      this.socket.emit('join_project', projectId);
    }
  }

  /**
   * Leave project room
   */
  public leaveProject(projectId: string): void {
    if (this.socket) {
      this.socket.emit('leave_project', projectId);
    }
  }

  /**
   * Get all notifications
   */
  public getNotifications(): Notification[] {
    return [...this.notifications];
  }

  /**
   * Get unread notifications count
   */
  public getUnreadCount(): number {
    return this.notifications.filter(n => !n.read).length;
  }

  /**
   * Mark notification as read
   */
  public markAsRead(notificationId: string): void {
    const notification = this.notifications.find(n => n.id === notificationId);
    if (notification) {
      notification.read = true;
      this.emit('notificationRead', notification);
    }
  }

  /**
   * Mark all as read
   */
  public markAllAsRead(): void {
    this.notifications.forEach(n => (n.read = true));
    this.emit('allRead', {});
  }

  /**
   * Clear all notifications
   */
  public clearAll(): void {
    this.notifications = [];
    this.emit('cleared', {});
  }

  /**
   * Subscribe to events
   */
  public on(event: string, callback: Function): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event)!.push(callback);
  }

  /**
   * Unsubscribe from events
   */
  public off(event: string, callback: Function): void {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      const index = callbacks.indexOf(callback);
      if (index > -1) {
        callbacks.splice(index, 1);
      }
    }
  }

  /**
   * Emit event
   */
  private emit(event: string, data: any): void {
    const callbacks = this.listeners.get(event) || [];
    callbacks.forEach(callback => {
      try {
        callback(data);
      } catch (error) {
        console.error(`Error in ${event} listener:`, error);
      }
    });
  }

  /**
   * Get connection status
   */
  public isConnected(): boolean {
    return this.socket?.connected ?? false;
  }
}

// Export singleton instance
const notificationService = new NotificationService();
export { notificationService };
export default notificationService;
