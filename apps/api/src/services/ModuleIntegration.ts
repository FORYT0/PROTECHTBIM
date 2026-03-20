/**
 * MODULE INTEGRATION LAYER
 * 
 * Enforces cross-module consistency.
 * All state changes flow through unified event system.
 * No module acts in isolation.
 */

import { eventBus, SystemEvent, SystemEventType } from './EventBus';
import { projectSnapshotService } from './ProjectSnapshotService';
import { v4 as uuidv4 } from 'uuid';

/**
 * Budget Module Integration
 */
export class BudgetModuleIntegration {
  static async notifyBudgetCreated(data: {
    projectId: string;
    budgetId: string;
    allocatedBudget: number;
    userId: string;
  }) {
    const event: SystemEvent = {
      id: uuidv4(),
      type: SystemEventType.BUDGET_CREATED,
      projectId: data.projectId,
      timestamp: new Date(),
      userId: data.userId,
      entityId: data.budgetId,
      entityType: 'Budget',
      newValues: {
        allocatedBudget: data.allocatedBudget,
      },
    };
    await eventBus.emit(event);
  }

  static async notifyBudgetUpdated(data: {
    projectId: string;
    budgetId: string;
    oldBudget: number;
    newBudget: number;
    userId: string;
  }) {
    const event: SystemEvent = {
      id: uuidv4(),
      type: SystemEventType.BUDGET_UPDATED,
      projectId: data.projectId,
      timestamp: new Date(),
      userId: data.userId,
      entityId: data.budgetId,
      entityType: 'Budget',
      oldValues: { allocatedBudget: data.oldBudget },
      newValues: { allocatedBudget: data.newBudget },
    };
    await eventBus.emit(event);
  }
}

/**
 * Time Entry Module Integration
 */
export class TimeEntryModuleIntegration {
  static async notifyTimeEntryCreated(data: {
    projectId: string;
    timeEntryId: string;
    actualHours: number;
    costAmount: number;
    userId: string;
  }) {
    const event: SystemEvent = {
      id: uuidv4(),
      type: SystemEventType.TIME_ENTRY_CREATED,
      projectId: data.projectId,
      timestamp: new Date(),
      userId: data.userId,
      entityId: data.timeEntryId,
      entityType: 'TimeEntry',
      newValues: {
        actualHours: data.actualHours,
        costAmount: data.costAmount,
      },
    };
    await eventBus.emit(event);
  }

  static async notifyTimeEntryUpdated(data: {
    projectId: string;
    timeEntryId: string;
    oldHours: number;
    newHours: number;
    oldCost: number;
    newCost: number;
    userId: string;
  }) {
    const event: SystemEvent = {
      id: uuidv4(),
      type: SystemEventType.TIME_ENTRY_UPDATED,
      projectId: data.projectId,
      timestamp: new Date(),
      userId: data.userId,
      entityId: data.timeEntryId,
      entityType: 'TimeEntry',
      oldValues: {
        actualHours: data.oldHours,
        costAmount: data.oldCost,
      },
      newValues: {
        actualHours: data.newHours,
        costAmount: data.newCost,
      },
    };
    await eventBus.emit(event);
  }
}

/**
 * Cost Entry Module Integration
 */
export class CostEntryModuleIntegration {
  static async notifyCostEntryCreated(data: {
    projectId: string;
    costEntryId: string;
    amount: number;
    costType: string;
    userId: string;
  }) {
    const event: SystemEvent = {
      id: uuidv4(),
      type: SystemEventType.COST_ENTRY_CREATED,
      projectId: data.projectId,
      timestamp: new Date(),
      userId: data.userId,
      entityId: data.costEntryId,
      entityType: 'CostEntry',
      newValues: {
        amount: data.amount,
        costType: data.costType,
      },
    };
    await eventBus.emit(event);
  }

  static async notifyCostEntryUpdated(data: {
    projectId: string;
    costEntryId: string;
    oldAmount: number;
    newAmount: number;
    userId: string;
  }) {
    const event: SystemEvent = {
      id: uuidv4(),
      type: SystemEventType.COST_ENTRY_UPDATED,
      projectId: data.projectId,
      timestamp: new Date(),
      userId: data.userId,
      entityId: data.costEntryId,
      entityType: 'CostEntry',
      oldValues: { amount: data.oldAmount },
      newValues: { amount: data.newAmount },
    };
    await eventBus.emit(event);
  }
}

/**
 * Change Order Module Integration
 */
export class ChangeOrderModuleIntegration {
  static async notifyChangeOrderCreated(data: {
    projectId: string;
    changeOrderId: string;
    variationAmount: number;
    userId: string;
  }) {
    const event: SystemEvent = {
      id: uuidv4(),
      type: SystemEventType.CHANGE_ORDER_CREATED,
      projectId: data.projectId,
      timestamp: new Date(),
      userId: data.userId,
      entityId: data.changeOrderId,
      entityType: 'ChangeOrder',
      newValues: {
        variationAmount: data.variationAmount,
        status: 'PENDING',
      },
    };
    await eventBus.emit(event);
  }

  static async notifyChangeOrderApproved(data: {
    projectId: string;
    changeOrderId: string;
    variationAmount: number;
    userId: string;
  }) {
    const event: SystemEvent = {
      id: uuidv4(),
      type: SystemEventType.CHANGE_ORDER_APPROVED,
      projectId: data.projectId,
      timestamp: new Date(),
      userId: data.userId,
      entityId: data.changeOrderId,
      entityType: 'ChangeOrder',
      newValues: {
        status: 'APPROVED',
        variationAmount: data.variationAmount,
      },
    };
    await eventBus.emit(event);
  }

  static async notifyChangeOrderRejected(data: {
    projectId: string;
    changeOrderId: string;
    userId: string;
  }) {
    const event: SystemEvent = {
      id: uuidv4(),
      type: SystemEventType.CHANGE_ORDER_REJECTED,
      projectId: data.projectId,
      timestamp: new Date(),
      userId: data.userId,
      entityId: data.changeOrderId,
      entityType: 'ChangeOrder',
      newValues: {
        status: 'REJECTED',
      },
    };
    await eventBus.emit(event);
  }
}

/**
 * Contract Module Integration
 */
export class ContractModuleIntegration {
  static async notifyContractValueChanged(data: {
    projectId: string;
    contractId: string;
    oldValue: number;
    newValue: number;
    variationAmount: number;
    userId: string;
  }) {
    const event: SystemEvent = {
      id: uuidv4(),
      type: SystemEventType.CONTRACT_VALUE_CHANGED,
      projectId: data.projectId,
      timestamp: new Date(),
      userId: data.userId,
      entityId: data.contractId,
      entityType: 'Contract',
      oldValues: {
        revisedContractValue: data.oldValue,
      },
      newValues: {
        revisedContractValue: data.newValue,
        totalApprovedVariations: data.variationAmount,
      },
    };
    await eventBus.emit(event);
  }
}

/**
 * Resource Module Integration
 */
export class ResourceModuleIntegration {
  static async notifyResourceAllocated(data: {
    projectId: string;
    resourceId: string;
    hoursAllocated: number;
    userId: string;
  }) {
    const event: SystemEvent = {
      id: uuidv4(),
      type: SystemEventType.RESOURCE_ALLOCATED,
      projectId: data.projectId,
      timestamp: new Date(),
      userId: data.userId,
      entityId: data.resourceId,
      entityType: 'Resource',
      newValues: {
        hoursAllocated: data.hoursAllocated,
      },
    };
    await eventBus.emit(event);
  }

  static async notifyResourceRateChanged(data: {
    projectId: string;
    resourceId: string;
    oldRate: number;
    newRate: number;
    userId: string;
  }) {
    const event: SystemEvent = {
      id: uuidv4(),
      type: SystemEventType.RESOURCE_RATE_CHANGED,
      projectId: data.projectId,
      timestamp: new Date(),
      userId: data.userId,
      entityId: data.resourceId,
      entityType: 'Resource',
      oldValues: { hourlyRate: data.oldRate },
      newValues: { hourlyRate: data.newRate },
    };
    await eventBus.emit(event);
  }
}

/**
 * Work Package Module Integration
 */
export class WorkPackageModuleIntegration {
  static async notifyWorkPackageCompleted(data: {
    projectId: string;
    workPackageId: string;
    userId: string;
  }) {
    const event: SystemEvent = {
      id: uuidv4(),
      type: SystemEventType.WORK_PACKAGE_COMPLETED,
      projectId: data.projectId,
      timestamp: new Date(),
      userId: data.userId,
      entityId: data.workPackageId,
      entityType: 'WorkPackage',
      newValues: {
        status: 'COMPLETED',
      },
    };
    await eventBus.emit(event);
  }
}

/**
 * Global event listener setup
 * Ensures all modules update snapshots on any change
 */
export function setupModuleIntegration() {
  // Listen for all state-changing events and invalidate snapshots
  eventBus.onAll(async (event: SystemEvent) => {
    // Invalidate project snapshot
    await projectSnapshotService.invalidateSnapshot(event.projectId);

    // Log all events for audit trail
    console.log(`📡 [Integration] Event: ${event.type} | Project: ${event.projectId} | Entity: ${event.entityId}`);
  });

  console.log('✅ Module integration layer initialized');
}
