/**
 * WEBSOCKET SYNCHRONIZATION SERVICE
 * 
 * Real-time push of snapshot changes to all connected clients.
 * Eliminates stale UI and ensures consistency.
 */

import { Server as SocketIOServer } from 'socket.io';
import { eventBus, SystemEvent, SystemEventType } from './EventBus';
import { projectSnapshotService } from './ProjectSnapshotService';
import { aggregationService } from './AggregationService';

export class WebSocketSyncService {
  private io: SocketIOServer;
  private projectSubscriptions: Map<string, Set<string>> = new Map(); // projectId -> socketIds

  constructor(io: SocketIOServer) {
    this.io = io;
    this.setupEventListeners();
  }

  /**
   * Register socket for a project
   */
  subscribeToProject(socketId: string, projectId: string) {
    if (!this.projectSubscriptions.has(projectId)) {
      this.projectSubscriptions.set(projectId, new Set());
    }
    this.projectSubscriptions.get(projectId)!.add(socketId);

    console.log(`🔌 [WebSocket] Socket ${socketId} subscribed to project ${projectId}`);
  }

  /**
   * Unregister socket
   */
  unsubscribeFromProject(socketId: string, projectId: string) {
    this.projectSubscriptions.get(projectId)?.delete(socketId);
  }

  /**
   * Setup event bus listeners for real-time sync
   */
  private setupEventListeners() {
    // Listen for critical financial events
    eventBus.on(SystemEventType.BUDGET_UPDATED, async (event) => {
      await this.broadcastProjectUpdate(event.projectId, 'budget_updated', event);
    });

    eventBus.on(SystemEventType.TIME_ENTRY_CREATED, async (event) => {
      await this.broadcastProjectUpdate(event.projectId, 'time_entry_created', event);
    });

    eventBus.on(SystemEventType.COST_ENTRY_CREATED, async (event) => {
      await this.broadcastProjectUpdate(event.projectId, 'cost_entry_created', event);
    });

    eventBus.on(SystemEventType.CHANGE_ORDER_APPROVED, async (event) => {
      await this.broadcastProjectUpdate(event.projectId, 'change_order_approved', event);
    });

    eventBus.on(SystemEventType.CONTRACT_VALUE_CHANGED, async (event) => {
      await this.broadcastProjectUpdate(event.projectId, 'contract_value_changed', event);
    });

    // Broadcast snapshot updates on any financial change
    const financialEvents = [
      SystemEventType.BUDGET_UPDATED,
      SystemEventType.TIME_ENTRY_CREATED,
      SystemEventType.TIME_ENTRY_UPDATED,
      SystemEventType.COST_ENTRY_CREATED,
      SystemEventType.COST_ENTRY_UPDATED,
      SystemEventType.CHANGE_ORDER_APPROVED,
      SystemEventType.CONTRACT_VALUE_CHANGED,
    ];

    financialEvents.forEach(eventType => {
      eventBus.on(eventType, async (event) => {
        await this.broadcastSnapshot(event.projectId);
      });
    });

    console.log('✅ WebSocket sync event listeners initialized');
  }

  /**
   * Broadcast snapshot to all clients viewing project
   */
  private async broadcastSnapshot(projectId: string) {
    try {
      const snapshot = await projectSnapshotService.getSnapshot(projectId, true); // Force refresh
      await this.broadcast(projectId, 'snapshot_update', {
        projectId,
        snapshot,
        timestamp: new Date(),
      });
    } catch (err) {
      console.error(`❌ [WebSocket] Failed to broadcast snapshot for ${projectId}:`, err);
    }
  }

  /**
   * Broadcast project update to all connected clients
   */
  private async broadcastProjectUpdate(projectId: string, eventType: string, event: SystemEvent) {
    await this.broadcast(projectId, eventType, {
      projectId,
      event,
      timestamp: new Date(),
    });
  }

  /**
   * Broadcast metrics update
   */
  async broadcastMetricsUpdate(projectId: string) {
    try {
      const metrics = await aggregationService.getComprehensiveMetrics(projectId);
      await this.broadcast(projectId, 'metrics_update', {
        projectId,
        metrics,
        timestamp: new Date(),
      });
    } catch (err) {
      console.error(`❌ [WebSocket] Failed to broadcast metrics for ${projectId}:`, err);
    }
  }

  /**
   * Send message to all clients subscribed to a project
   */
  private async broadcast(projectId: string, eventType: string, data: any) {
    const sockets = this.projectSubscriptions.get(projectId);
    if (!sockets || sockets.size === 0) return;

    const room = `project:${projectId}`;
    this.io.to(room).emit(eventType, data);

    console.log(`📤 [WebSocket] Broadcast ${eventType} to ${sockets.size} clients for project ${projectId}`);
  }

  /**
   * Get subscription status
   */
  getSubscriptionStatus(projectId: string): { projectId: string; subscribedClients: number } {
    return {
      projectId,
      subscribedClients: this.projectSubscriptions.get(projectId)?.size || 0,
    };
  }
}

/**
 * Setup WebSocket handlers
 */
export function setupWebSocketSync(io: SocketIOServer) {
  const syncService = new WebSocketSyncService(io);

  io.on('connection', (socket) => {
    console.log(`✅ [WebSocket] Client connected: ${socket.id}`);

    // Client subscribes to project
    socket.on('subscribe_project', (projectId: string) => {
      socket.join(`project:${projectId}`);
      syncService.subscribeToProject(socket.id, projectId);
      
      // Send current snapshot
      projectSnapshotService.getSnapshot(projectId).then(snapshot => {
        socket.emit('initial_snapshot', { projectId, snapshot });
      });
    });

    // Client unsubscribes from project
    socket.on('unsubscribe_project', (projectId: string) => {
      socket.leave(`project:${projectId}`);
      syncService.unsubscribeFromProject(socket.id, projectId);
    });

    // Disconnect handler
    socket.on('disconnect', () => {
      console.log(`❌ [WebSocket] Client disconnected: ${socket.id}`);
    });

    // Health check
    socket.on('ping', () => {
      socket.emit('pong', { timestamp: new Date() });
    });
  });

  return syncService;
}
