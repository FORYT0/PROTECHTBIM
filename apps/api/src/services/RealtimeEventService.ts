import { socketManager } from '../websocket/socket-manager';

/**
 * Real-time Event Service
 * 
 * This service is responsible for emitting real-time events to connected clients.
 * It wraps the WebSocket manager and provides a clean interface for services to emit events.
 */

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

export interface RealtimeEvent {
  type: RealtimeEventType;
  projectId?: string;
  userId?: string;
  entityId: string;
  entityType: string;
  data: any;
  timestamp: Date;
}

export class RealtimeEventService {
  /**
   * Emit generic project event (legacy/fallback)
   */
  emitProjectEvent(type: RealtimeEventType, projectId: string, data: any): void {
    this.emitToProject(projectId, {
      type,
      projectId,
      entityId: projectId,
      entityType: 'Project',
      data,
      timestamp: new Date(),
    });
  }

  /**
   * Emit event to all users in a project room
   */
  emitToProject(projectId: string, event: RealtimeEvent): void {
    try {
      socketManager.notifyProject(projectId, event.type, {
        ...event,
        timestamp: new Date(),
      });
      console.log(`[Realtime] Emitted ${event.type} to project ${projectId}`);
    } catch (error) {
      console.error(`[Realtime] Failed to emit event to project ${projectId}:`, error);
    }
  }

  /**
   * Emit event to a specific user
   */
  emitToUser(userId: string, event: RealtimeEvent): void {
    try {
      socketManager.notifyUser(userId, event.type, {
        ...event,
        timestamp: new Date(),
      });
      console.log(`[Realtime] Emitted ${event.type} to user ${userId}`);
    } catch (error) {
      console.error(`[Realtime] Failed to emit event to user ${userId}:`, error);
    }
  }

  /**
   * Emit financial summary update event
   */
  emitFinancialUpdate(projectId: string, data: any): void {
    this.emitToProject(projectId, {
      type: RealtimeEventType.FINANCIAL_SUMMARY_UPDATED,
      projectId,
      entityId: projectId,
      entityType: 'Project',
      data,
      timestamp: new Date(),
    });
  }

  /**
   * Emit budget event
   */
  emitBudgetEvent(
    type: RealtimeEventType.BUDGET_CREATED | RealtimeEventType.BUDGET_UPDATED | RealtimeEventType.BUDGET_DELETED,
    projectId: string,
    budgetId: string,
    data: any
  ): void {
    this.emitToProject(projectId, {
      type,
      projectId,
      entityId: budgetId,
      entityType: 'Budget',
      data,
      timestamp: new Date(),
    });

    this.emitFinancialUpdate(projectId, { budgetId, ...data });
  }

  /**
   * Emit cost entry event
   */
  emitCostEntryEvent(
    type: RealtimeEventType.COST_ENTRY_CREATED | RealtimeEventType.COST_ENTRY_UPDATED | RealtimeEventType.COST_ENTRY_DELETED | RealtimeEventType.COST_ENTRY_APPROVED,
    projectId: string,
    costEntryId: string,
    data: any
  ): void {
    this.emitToProject(projectId, {
      type,
      projectId,
      entityId: costEntryId,
      entityType: 'CostEntry',
      data,
      timestamp: new Date(),
    });

    this.emitFinancialUpdate(projectId, { costEntryId, ...data });
  }

  /**
   * Emit time entry event
   */
  emitTimeEntryEvent(
    type: RealtimeEventType.TIME_ENTRY_CREATED | RealtimeEventType.TIME_ENTRY_UPDATED | RealtimeEventType.TIME_ENTRY_DELETED,
    projectId: string,
    timeEntryId: string,
    data: any
  ): void {
    this.emitToProject(projectId, {
      type,
      projectId,
      entityId: timeEntryId,
      entityType: 'TimeEntry',
      data,
      timestamp: new Date(),
    });

    this.emitFinancialUpdate(projectId, { timeEntryId, ...data });
  }

  /**
   * Emit work package event
   */
  emitWorkPackageEvent(
    type: RealtimeEventType.WORK_PACKAGE_CREATED | RealtimeEventType.WORK_PACKAGE_UPDATED | RealtimeEventType.WORK_PACKAGE_DELETED,
    projectId: string,
    workPackageId: string,
    data: any
  ): void {
    this.emitToProject(projectId, {
      type,
      projectId,
      entityId: workPackageId,
      entityType: 'WorkPackage',
      data,
      timestamp: new Date(),
    });
  }

  /**
   * Emit activity event
   */
  emitActivityEvent(projectId: string, activityId: string, data: any): void {
    this.emitToProject(projectId, {
      type: RealtimeEventType.ACTIVITY_CREATED,
      projectId,
      entityId: activityId,
      entityType: 'Activity',
      data,
      timestamp: new Date(),
    });
  }

  /**
   * Emit comment event
   */
  emitCommentEvent(
    type: RealtimeEventType.COMMENT_CREATED | RealtimeEventType.COMMENT_UPDATED | RealtimeEventType.COMMENT_DELETED,
    projectId: string,
    commentId: string,
    data: any
  ): void {
    this.emitToProject(projectId, {
      type,
      projectId,
      entityId: commentId,
      entityType: 'Comment',
      data,
      timestamp: new Date(),
    });
  }

  /**
   * Emit Change Order event
   */
  emitChangeOrderEvent(
    type: RealtimeEventType.CHANGE_ORDER_CREATED | RealtimeEventType.CHANGE_ORDER_UPDATED | RealtimeEventType.CHANGE_ORDER_APPROVED | RealtimeEventType.CHANGE_ORDER_REJECTED,
    projectId: string,
    changeOrderId: string,
    data: any
  ): void {
    this.emitToProject(projectId, {
      type,
      projectId,
      entityId: changeOrderId,
      entityType: 'ChangeOrder',
      data,
      timestamp: new Date(),
    });

    if (type !== RealtimeEventType.CHANGE_ORDER_REJECTED) {
      this.emitFinancialUpdate(projectId, { changeOrderId, ...data });
    }
  }

  /**
   * Emit Daily Report event
   */
  emitDailyReportEvent(
    type: RealtimeEventType.DAILY_REPORT_CREATED | RealtimeEventType.DAILY_REPORT_UPDATED,
    projectId: string,
    dailyReportId: string,
    data: any
  ): void {
    this.emitToProject(projectId, {
      type,
      projectId,
      entityId: dailyReportId,
      entityType: 'DailyReport',
      data,
      timestamp: new Date(),
    });
  }

  /**
   * Emit Snag event
   */
  emitSnagEvent(
    type: RealtimeEventType.SNAG_CREATED | RealtimeEventType.SNAG_UPDATED | RealtimeEventType.SNAG_RESOLVED,
    projectId: string,
    snagId: string,
    data: any
  ): void {
    this.emitToProject(projectId, {
      type,
      projectId,
      entityId: snagId,
      entityType: 'Snag',
      data,
      timestamp: new Date(),
    });
  }

  /**
   * Emit Contract event
   */
  emitContractEvent(
    type: RealtimeEventType.CONTRACT_CREATED | RealtimeEventType.CONTRACT_UPDATED | RealtimeEventType.CONTRACT_DELETED,
    projectId: string,
    contractId: string,
    data: any
  ): void {
    this.emitToProject(projectId, {
      type,
      projectId,
      entityId: contractId,
      entityType: 'Contract',
      data,
      timestamp: new Date(),
    });

    // Contract changes almost always trigger financial updates
    this.emitFinancialUpdate(projectId, { contractId, ...data });
  }
}

export const createRealtimeEventService = (): RealtimeEventService => {
  return new RealtimeEventService();
};
