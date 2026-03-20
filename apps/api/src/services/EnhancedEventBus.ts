/**
 * ENHANCED EVENT BUS WITH CACHE INVALIDATION
 * 
 * Central nervous system for all data mutations.
 * Every event automatically triggers:
 * 1. Snapshot cache invalidation
 * 2. WebSocket broadcast to connected clients
 * 3. Activity logging
 * 4. Cross-module reconciliation
 * 
 * KEY PRINCIPLE: One mutation = One event = Global synchronization
 */

import { unifiedSnapshotService } from './UnifiedSnapshotService';
import { RealtimeEventService, RealtimeEventType } from './RealtimeEventService';

export enum SystemEventType {
  // Budget Events
  BUDGET_CREATED = 'budget:created',
  BUDGET_UPDATED = 'budget:updated',
  BUDGET_DELETED = 'budget:deleted',
  BUDGET_LINE_ADDED = 'budget:line_added',
  BUDGET_LINE_UPDATED = 'budget:line_updated',

  // Resource Events
  RESOURCE_ALLOCATED = 'resource:allocated',
  RESOURCE_DEALLOCATED = 'resource:deallocated',
  RESOURCE_RATE_CHANGED = 'resource:rate_changed',

  // Time Entry Events
  TIME_ENTRY_CREATED = 'time:entry_created',
  TIME_ENTRY_UPDATED = 'time:entry_updated',
  TIME_ENTRY_DELETED = 'time:entry_deleted',

  // Cost Entry Events
  COST_ENTRY_CREATED = 'cost:entry_created',
  COST_ENTRY_UPDATED = 'cost:entry_updated',
  COST_ENTRY_DELETED = 'cost:entry_deleted',
  COST_ENTRY_APPROVED = 'cost:entry_approved',

  // Change Order Events
  CHANGE_ORDER_CREATED = 'change:order_created',
  CHANGE_ORDER_UPDATED = 'change:order_updated',
  CHANGE_ORDER_APPROVED = 'change:order_approved',
  CHANGE_ORDER_REJECTED = 'change:order_rejected',

  // Contract Events
  CONTRACT_CREATED = 'contract:created',
  CONTRACT_UPDATED = 'contract:updated',
  CONTRACT_VALUE_CHANGED = 'contract:value_changed',

  // Work Package Events
  WORK_PACKAGE_CREATED = 'work:package_created',
  WORK_PACKAGE_UPDATED = 'work:package_updated',
  WORK_PACKAGE_COMPLETED = 'work:package_completed',

  // Project Events
  PROJECT_UPDATED = 'project:updated',
  PROJECT_SNAPSHOT_INVALIDATED = 'project:snapshot_invalidated',

  // Reconciliation Events
  FINANCIAL_RECONCILIATION_STARTED = 'reconcile:started',
  FINANCIAL_RECONCILIATION_COMPLETED = 'reconcile:completed',

  // Dashboard Events
  DASHBOARD_DATA_INVALIDATED = 'dashboard:data_invalidated',
}

export interface SystemEvent {
  id: string;
  type: SystemEventType;
  projectId: string;
  timestamp: Date;
  userId: string;
  entityId: string;
  entityType: string;
  oldValues?: Record<string, any>;
  newValues: Record<string, any>;
  metadata?: Record<string, any>;
  source: 'API' | 'IMPORT' | 'SYNC' | 'SYSTEM';
}

export interface EventListener {
  (event: SystemEvent): Promise<void>;
}

// Events that trigger financial reconciliation
const FINANCIAL_EVENTS = [
  SystemEventType.BUDGET_CREATED,
  SystemEventType.BUDGET_UPDATED,
  SystemEventType.COST_ENTRY_CREATED,
  SystemEventType.COST_ENTRY_UPDATED,
  SystemEventType.COST_ENTRY_DELETED,
  SystemEventType.TIME_ENTRY_CREATED,
  SystemEventType.TIME_ENTRY_UPDATED,
  SystemEventType.TIME_ENTRY_DELETED,
  SystemEventType.CHANGE_ORDER_CREATED,
  SystemEventType.CHANGE_ORDER_APPROVED,
  SystemEventType.CHANGE_ORDER_REJECTED,
  SystemEventType.CONTRACT_UPDATED,
  SystemEventType.CONTRACT_VALUE_CHANGED,
];

class EnhancedEventBus {
  private listeners: Map<SystemEventType, EventListener[]> = new Map();
  private eventHistory: SystemEvent[] = [];
  private maxHistorySize = 10000;
  private realtimeEventService: RealtimeEventService;

  constructor(realtimeEventService?: RealtimeEventService) {
    this.realtimeEventService = realtimeEventService || new RealtimeEventService();
  }

  /**
   * Subscribe to a specific event type
   */
  on(eventType: SystemEventType, listener: EventListener): () => void {
    if (!this.listeners.has(eventType)) {
      this.listeners.set(eventType, []);
    }
    this.listeners.get(eventType)!.push(listener);

    // Return unsubscribe function
    return () => {
      const list = this.listeners.get(eventType);
      if (list) {
        const index = list.indexOf(listener);
        if (index > -1) list.splice(index, 1);
      }
    };
  }

  /**
   * Subscribe to all events
   */
  onAll(listener: EventListener): () => void {
    const unsubscribers: Array<() => void> = [];
    for (const eventType of Object.values(SystemEventType)) {
      unsubscribers.push(this.on(eventType as SystemEventType, listener));
    }
    return () => unsubscribers.forEach(u => u());
  }

  /**
   * Emit an event to all listeners
   * Automatically triggers:
   * 1. Cache invalidation
   * 2. WebSocket broadcast
   * 3. Real-time event emission
   */
  async emit(event: SystemEvent): Promise<void> {
    // Store in history
    this.eventHistory.push(event);
    if (this.eventHistory.length > this.maxHistorySize) {
      this.eventHistory.shift();
    }

    const eventName = event.type;
    const listeners = this.listeners.get(event.type) || [];

    console.log(
      `🎯 [EventBus] Event: ${eventName} | Project: ${event.projectId} | Entity: ${event.entityId} | Listeners: ${listeners.length}`
    );

    // Execute listeners in parallel
    await Promise.all(listeners.map(listener =>
      listener(event).catch(err => {
        console.error(`❌ [EventBus] Error in listener for ${eventName}:`, err);
      })
    ));

    // AUTOMATIC: Invalidate snapshot cache
    await unifiedSnapshotService.invalidateProjectSnapshot(event.projectId);

    // AUTOMATIC: Emit real-time event to WebSocket clients
    this.broadcastRealtimeEvent(event);

    // AUTOMATIC: Trigger financial reconciliation if needed
    if (FINANCIAL_EVENTS.includes(event.type)) {
      this.triggerFinancialReconciliation(event);
    }
  }

  /**
   * Broadcast event to WebSocket clients
   */
  private broadcastRealtimeEvent(event: SystemEvent): void {
    try {
      // Map system events to realtime events
      const realtimeType = this.mapToRealtimeType(event.type);

      if (realtimeType) {
        this.realtimeEventService.emitToProject(event.projectId, {
          type: realtimeType,
          projectId: event.projectId,
          userId: event.userId,
          entityId: event.entityId,
          entityType: event.entityType,
          data: event.newValues,
          timestamp: event.timestamp,
        });

        // For financial events, also emit a comprehensive financial update
        if (FINANCIAL_EVENTS.includes(event.type)) {
          this.realtimeEventService.emitFinancialUpdate(event.projectId, {
            eventType: event.type,
            entityId: event.entityId,
            timestamp: event.timestamp,
          });
        }
      }
    } catch (error) {
      console.error(`[EventBus] Failed to broadcast realtime event:`, error);
    }
  }

  /**
   * Map system events to realtime event types
   */
  private mapToRealtimeType(systemEventType: SystemEventType): RealtimeEventType | null {
    const mapping: Record<SystemEventType, RealtimeEventType | null> = {
      [SystemEventType.BUDGET_CREATED]: RealtimeEventType.BUDGET_CREATED,
      [SystemEventType.BUDGET_UPDATED]: RealtimeEventType.BUDGET_UPDATED,
      [SystemEventType.BUDGET_DELETED]: RealtimeEventType.BUDGET_DELETED,
      [SystemEventType.BUDGET_LINE_ADDED]: null,
      [SystemEventType.BUDGET_LINE_UPDATED]: null,
      [SystemEventType.COST_ENTRY_CREATED]: RealtimeEventType.COST_ENTRY_CREATED,
      [SystemEventType.COST_ENTRY_UPDATED]: RealtimeEventType.COST_ENTRY_UPDATED,
      [SystemEventType.COST_ENTRY_DELETED]: RealtimeEventType.COST_ENTRY_DELETED,
      [SystemEventType.COST_ENTRY_APPROVED]: RealtimeEventType.COST_ENTRY_APPROVED,
      [SystemEventType.TIME_ENTRY_CREATED]: RealtimeEventType.TIME_ENTRY_CREATED,
      [SystemEventType.TIME_ENTRY_UPDATED]: RealtimeEventType.TIME_ENTRY_UPDATED,
      [SystemEventType.TIME_ENTRY_DELETED]: RealtimeEventType.TIME_ENTRY_DELETED,
      [SystemEventType.WORK_PACKAGE_CREATED]: RealtimeEventType.WORK_PACKAGE_CREATED,
      [SystemEventType.WORK_PACKAGE_UPDATED]: RealtimeEventType.WORK_PACKAGE_UPDATED,
      [SystemEventType.WORK_PACKAGE_COMPLETED]: null,
      [SystemEventType.CHANGE_ORDER_CREATED]: RealtimeEventType.CHANGE_ORDER_CREATED,
      [SystemEventType.CHANGE_ORDER_UPDATED]: RealtimeEventType.CHANGE_ORDER_UPDATED,
      [SystemEventType.CHANGE_ORDER_APPROVED]: RealtimeEventType.CHANGE_ORDER_APPROVED,
      [SystemEventType.CHANGE_ORDER_REJECTED]: RealtimeEventType.CHANGE_ORDER_REJECTED,
      [SystemEventType.CONTRACT_CREATED]: RealtimeEventType.CONTRACT_CREATED,
      [SystemEventType.CONTRACT_UPDATED]: RealtimeEventType.CONTRACT_UPDATED,
      [SystemEventType.CONTRACT_VALUE_CHANGED]: RealtimeEventType.CONTRACT_UPDATED,
      [SystemEventType.PROJECT_UPDATED]: RealtimeEventType.PROJECT_UPDATED,
      [SystemEventType.PROJECT_SNAPSHOT_INVALIDATED]: null,
      [SystemEventType.RESOURCE_ALLOCATED]: null,
      [SystemEventType.RESOURCE_DEALLOCATED]: null,
      [SystemEventType.RESOURCE_RATE_CHANGED]: null,
      [SystemEventType.FINANCIAL_RECONCILIATION_STARTED]: null,
      [SystemEventType.FINANCIAL_RECONCILIATION_COMPLETED]: null,
      [SystemEventType.DASHBOARD_DATA_INVALIDATED]: null,
    };

    return mapping[systemEventType] ?? null;
  }

  /**
   * Trigger financial reconciliation for financial events
   */
  private triggerFinancialReconciliation(event: SystemEvent): void {
    // Emit financial update signal
    // This tells clients to refresh financial dashboards
    this.realtimeEventService.emitFinancialUpdate(event.projectId, {
      reason: event.type,
      entityId: event.entityId,
      timestamp: event.timestamp,
      snapshot: 'pending', // Client will fetch fresh snapshot
    });

    console.log(
      `💰 [EventBus] Financial reconciliation triggered for project ${event.projectId} (${event.type})`
    );
  }

  /**
   * Get recent events for a project
   */
  getProjectEvents(projectId: string, limit: number = 100): SystemEvent[] {
    return this.eventHistory
      .filter(e => e.projectId === projectId)
      .slice(-limit);
  }

  /**
   * Clear history
   */
  clearHistory(): void {
    this.eventHistory = [];
  }

  /**
   * Get event statistics
   */
  getStats() {
    const eventCounts = new Map<SystemEventType, number>();

    this.eventHistory.forEach(event => {
      eventCounts.set(event.type, (eventCounts.get(event.type) ?? 0) + 1);
    });

    return {
      totalEvents: this.eventHistory.length,
      historySize: this.eventHistory.length,
      maxHistorySize: this.maxHistorySize,
      eventCounts: Object.fromEntries(eventCounts),
      uniqueProjects: new Set(this.eventHistory.map(e => e.projectId)).size,
    };
  }
}

export const enhancedEventBus = new EnhancedEventBus();

/**
 * Helper to create system events
 */
export const createSystemEvent = (
  type: SystemEventType,
  projectId: string,
  userId: string,
  entityId: string,
  entityType: string,
  newValues: Record<string, any>,
  oldValues?: Record<string, any>,
  source: 'API' | 'IMPORT' | 'SYNC' | 'SYSTEM' = 'API'
): SystemEvent => {
  return {
    id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    type,
    projectId,
    timestamp: new Date(),
    userId,
    entityId,
    entityType,
    newValues,
    oldValues,
    source,
  };
};
