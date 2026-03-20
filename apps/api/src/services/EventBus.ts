/**
 * UNIFIED EVENT BUS
 * 
 * Central event dispatcher for ALL state changes across the system.
 * Ensures single source of truth and consistent data propagation.
 */

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

  // Change Order Events
  CHANGE_ORDER_CREATED = 'change:order_created',
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
}

export interface EventListener {
  (event: SystemEvent): Promise<void>;
}

class EventBus {
  private listeners: Map<SystemEventType, EventListener[]> = new Map();
  private eventHistory: SystemEvent[] = [];
  private maxHistorySize = 10000;

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
   */
  async emit(event: SystemEvent): Promise<void> {
    // Store in history
    this.eventHistory.push(event);
    if (this.eventHistory.length > this.maxHistorySize) {
      this.eventHistory.shift();
    }

    // Execute all listeners for this event type
    const listeners = this.listeners.get(event.type) || [];
    
    console.log(`🎯 [EventBus] Event: ${event.type} | Project: ${event.projectId} | Listeners: ${listeners.length}`);

    // Execute listeners in parallel
    await Promise.all(listeners.map(listener => 
      listener(event).catch(err => {
        console.error(`❌ [EventBus] Error in listener for ${event.type}:`, err);
      })
    ));
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
}

export const eventBus = new EventBus();
