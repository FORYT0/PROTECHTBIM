/**
 * UNIFIED AGGREGATION SERVICE
 * 
 * Real-time calculations across all modules.
 * Financial reconciliation, resource utilization, schedule variance.
 * No isolated logic - everything feeds into unified metrics.
 */

import { AppDataSource } from '../config/data-source';
import { Budget } from '../entities/Budget';
import { TimeEntry } from '../entities/TimeEntry';
import { CostEntry } from '../entities/CostEntry';
import { ChangeOrder } from '../entities/ChangeOrder';
import { Contract } from '../entities/Contract';
import { WorkPackage } from '../entities/WorkPackage';
import { ActivityLog } from '../entities/ActivityLog';

export interface FinancialReconciliation {
  projectId: string;
  
  // Contract Level
  contractOriginalValue: number;
  contractRevisedValue: number;
  contractVariations: number;
  
  // Budget Level
  budgetAllocated: number;
  budgetSpent: number;
  budgetRemaining: number;
  budgetVariance: number;
  budgetUtilization: number;
  
  // Actual Costs
  laborCost: number;
  materialCost: number;
  equipmentCost: number;
  otherCost: number;
  totalActualCost: number;
  
  // Change Orders
  pendingChangeOrders: number;
  pendingChangeOrderValue: number;
  approvedChangeOrders: number;
  approvedChangeOrderValue: number;
  
  // Profitability
  grossProfit: number;
  profitMargin: number;
  projectedProfit: number;
  
  // Status
  isBudgetExceeded: boolean;
  isContractExceeded: boolean;
  financialHealth: 'CRITICAL' | 'WARNING' | 'HEALTHY';
  lastUpdated: Date;
}

export interface ResourceUtilization {
  projectId: string;
  
  totalResourcesAllocated: number;
  totalHoursPlanned: number;
  totalHoursUsed: number;
  utilizationPercent: number;
  
  resourceBreakdown: {
    resourceId: string;
    resourceName: string;
    hoursPlanned: number;
    hoursUsed: number;
    utilizationPercent: number;
    isOverallocated: boolean;
    costSoFar: number;
  }[];
  
  overallocatedResources: number;
  underutilizedResources: number;
  averageUtilization: number;
  
  lastUpdated: Date;
}

export interface ScheduleAnalysis {
  projectId: string;
  
  startDate: Date;
  endDate: Date;
  totalDurationDays: number;
  elapsedDays: number;
  remainingDays: number;
  
  plannedProgressPercent: number;
  actualProgressPercent: number;
  scheduleVariance: number;
  scheduleVariancePercent: number;
  
  isOnSchedule: boolean;
  projectedCompletionDate: Date;
  daysAhead: number;
  daysBehind: number;
  
  workPackageStatus: {
    notStarted: number;
    inProgress: number;
    completed: number;
  };
  
  lastUpdated: Date;
}

export interface QualityMetrics {
  projectId: string;
  
  totalChangeRequests: number;
  openChangeRequests: number;
  closeChangeRequests: number;
  changeRequestRate: number; // per month
  
  avgTimeToResolveChangeRequest: number; // days
  
  costImpactOfChanges: number;
  scheduleImpactOfChanges: number;
  
  lastUpdated: Date;
}

class AggregationService {
  /**
   * Comprehensive financial reconciliation
   */
  async getFinancialReconciliation(projectId: string): Promise<FinancialReconciliation> {
    const contractRepo = AppDataSource.getRepository(Contract);
    const budgetRepo = AppDataSource.getRepository(Budget);
    const costRepo = AppDataSource.getRepository(CostEntry);
    const changeOrderRepo = AppDataSource.getRepository(ChangeOrder);

    const [contract, budgets, costs, changeOrders] = await Promise.all([
      contractRepo.findOne({ where: { projectId } }),
      budgetRepo.find({ where: { projectId } }),
      costRepo.find({ where: { projectId } }),
      changeOrderRepo.find({ where: { projectId } }),
    ]);

    if (!contract) {
      throw new Error(`No contract found for project ${projectId}`);
    }

    // Calculate totals
    const budgetAllocated = budgets.reduce((sum, b) => sum + (b.allocatedBudget || 0), 0);
    const budgetSpent = budgets.reduce((sum, b) => sum + (b.spentBudget || 0), 0);

    const laborCost = costs
      .filter(c => c.costCode?.type === 'LABOR')
      .reduce((sum, c) => sum + (c.amount || 0), 0);
    const materialCost = costs
      .filter(c => c.costCode?.type === 'MATERIAL')
      .reduce((sum, c) => sum + (c.amount || 0), 0);
    const equipmentCost = costs
      .filter(c => c.costCode?.type === 'EQUIPMENT')
      .reduce((sum, c) => sum + (c.amount || 0), 0);
    const otherCost = costs
      .filter(c => !['LABOR', 'MATERIAL', 'EQUIPMENT'].includes(c.costCode?.type || ''))
      .reduce((sum, c) => sum + (c.amount || 0), 0);

    const totalActualCost = laborCost + materialCost + equipmentCost + otherCost;

    const approvedVariations = changeOrders
      .filter(co => co.status === 'APPROVED')
      .reduce((sum, co) => sum + (co.variationAmount || 0), 0);
    const pendingVariations = changeOrders
      .filter(co => co.status === 'PENDING')
      .reduce((sum, co) => sum + (co.variationAmount || 0), 0);

    const contractRevisedValue = contract.originalContractValue + approvedVariations;
    const grossProfit = contractRevisedValue - totalActualCost;
    const profitMargin = contractRevisedValue > 0 ? (grossProfit / contractRevisedValue) * 100 : 0;

    // Determine financial health
    let financialHealth: 'CRITICAL' | 'WARNING' | 'HEALTHY' = 'HEALTHY';
    if (totalActualCost > contractRevisedValue) financialHealth = 'CRITICAL';
    else if (totalActualCost > contractRevisedValue * 0.9) financialHealth = 'WARNING';

    return {
      projectId,
      contractOriginalValue: contract.originalContractValue,
      contractRevisedValue,
      contractVariations: approvedVariations,
      budgetAllocated,
      budgetSpent,
      budgetRemaining: budgetAllocated - budgetSpent,
      budgetVariance: budgetAllocated - budgetSpent,
      budgetUtilization: budgetAllocated > 0 ? (budgetSpent / budgetAllocated) * 100 : 0,
      laborCost,
      materialCost,
      equipmentCost,
      otherCost,
      totalActualCost,
      pendingChangeOrders: changeOrders.filter(co => co.status === 'PENDING').length,
      pendingChangeOrderValue: pendingVariations,
      approvedChangeOrders: changeOrders.filter(co => co.status === 'APPROVED').length,
      approvedChangeOrderValue: approvedVariations,
      grossProfit,
      profitMargin,
      projectedProfit: contractRevisedValue + pendingVariations - totalActualCost,
      isBudgetExceeded: budgetSpent > budgetAllocated,
      isContractExceeded: totalActualCost > contractRevisedValue,
      financialHealth,
      lastUpdated: new Date(),
    };
  }

  /**
   * Resource utilization analysis
   */
  async getResourceUtilization(projectId: string): Promise<ResourceUtilization> {
    const timeRepo = AppDataSource.getRepository(TimeEntry);
    const timeEntries = await timeRepo.find({
      where: { projectId },
      relations: ['resource'],
    });

    const resourceMap = new Map<string, {
      resourceId: string;
      resourceName: string;
      hoursPlanned: number;
      hoursUsed: number;
      costSoFar: number;
    }>();

    let totalHoursPlanned = 0;
    let totalHoursUsed = 0;

    timeEntries.forEach(entry => {
      const resourceId = entry.resource?.id || 'unknown';
      const resourceName = entry.resource?.name || 'Unknown';

      if (!resourceMap.has(resourceId)) {
        resourceMap.set(resourceId, {
          resourceId,
          resourceName,
          hoursPlanned: 0,
          hoursUsed: 0,
          costSoFar: 0,
        });
      }

      const resource = resourceMap.get(resourceId)!;
      resource.hoursPlanned += entry.plannedHours || 0;
      resource.hoursUsed += entry.actualHours || 0;
      resource.costSoFar += entry.costAmount || 0;

      totalHoursPlanned += entry.plannedHours || 0;
      totalHoursUsed += entry.actualHours || 0;
    });

    const resourceBreakdown = Array.from(resourceMap.values()).map(r => ({
      ...r,
      utilizationPercent: r.hoursPlanned > 0 ? (r.hoursUsed / r.hoursPlanned) * 100 : 0,
      isOverallocated: r.hoursUsed > r.hoursPlanned,
    }));

    const overallocatedCount = resourceBreakdown.filter(r => r.isOverallocated).length;
    const underutilizedCount = resourceBreakdown.filter(r => r.utilizationPercent < 50).length;

    return {
      projectId,
      totalResourcesAllocated: resourceMap.size,
      totalHoursPlanned,
      totalHoursUsed,
      utilizationPercent: totalHoursPlanned > 0 ? (totalHoursUsed / totalHoursPlanned) * 100 : 0,
      resourceBreakdown,
      overallocatedResources: overallocatedCount,
      underutilizedResources: underutilizedCount,
      averageUtilization: resourceBreakdown.length > 0
        ? resourceBreakdown.reduce((sum, r) => sum + r.utilizationPercent, 0) / resourceBreakdown.length
        : 0,
      lastUpdated: new Date(),
    };
  }

  /**
   * Schedule analysis
   */
  async getScheduleAnalysis(projectId: string): Promise<ScheduleAnalysis> {
    const workPackageRepo = AppDataSource.getRepository(WorkPackage);
    const workPackages = await workPackageRepo.find({ where: { projectId } });

    // Get project dates from first work package or use today
    const startDate = workPackages[0]?.startDate || new Date();
    const endDate = workPackages[0]?.completionDate || new Date();

    const now = new Date();
    const totalDurationMs = endDate.getTime() - startDate.getTime();
    const elapsedMs = now.getTime() - startDate.getTime();
    const totalDurationDays = Math.ceil(totalDurationMs / (1000 * 60 * 60 * 24));
    const elapsedDays = Math.ceil(elapsedMs / (1000 * 60 * 60 * 24));

    const plannedProgressPercent = (elapsedDays / totalDurationDays) * 100;
    const completedCount = workPackages.filter(wp => wp.status === 'COMPLETED').length;
    const actualProgressPercent = workPackages.length > 0 ? (completedCount / workPackages.length) * 100 : 0;

    const scheduleVariance = actualProgressPercent - plannedProgressPercent;
    const scheduleVariancePercent = plannedProgressPercent > 0 ? (scheduleVariance / plannedProgressPercent) * 100 : 0;

    // Project completion
    const daysAhead = Math.max(0, elapsedDays - (totalDurationDays * (actualProgressPercent / 100)));
    const daysBehind = Math.max(0, (totalDurationDays * (plannedProgressPercent / 100)) - elapsedDays);

    const projectedDays = actualProgressPercent > 0 ? (totalDurationDays / actualProgressPercent) * 100 : totalDurationDays;
    const projectedCompletionDate = new Date(startDate.getTime() + (projectedDays * 24 * 60 * 60 * 1000));

    return {
      projectId,
      startDate,
      endDate,
      totalDurationDays,
      elapsedDays,
      remainingDays: Math.max(0, totalDurationDays - elapsedDays),
      plannedProgressPercent: Math.min(100, plannedProgressPercent),
      actualProgressPercent,
      scheduleVariance,
      scheduleVariancePercent,
      isOnSchedule: scheduleVariance >= 0,
      projectedCompletionDate,
      daysAhead,
      daysBehind,
      workPackageStatus: {
        notStarted: workPackages.filter(wp => wp.status === 'NOT_STARTED').length,
        inProgress: workPackages.filter(wp => wp.status === 'IN_PROGRESS').length,
        completed: completedCount,
      },
      lastUpdated: new Date(),
    };
  }

  /**
   * Quality metrics
   */
  async getQualityMetrics(projectId: string): Promise<QualityMetrics> {
    const changeOrderRepo = AppDataSource.getRepository(ChangeOrder);
    const activityRepo = AppDataSource.getRepository(ActivityLog);

    const changeOrders = await changeOrderRepo.find({ where: { projectId } });
    const activities = await activityRepo.find({ where: { projectId } });

    const openChangeOrders = changeOrders.filter(co => co.status === 'PENDING').length;
    const closedChangeOrders = changeOrders.filter(co => ['APPROVED', 'REJECTED'].includes(co.status)).length;

    const costImpact = changeOrders.reduce((sum, co) => sum + (co.variationAmount || 0), 0);

    return {
      projectId,
      totalChangeRequests: changeOrders.length,
      openChangeRequests: openChangeOrders,
      closeChangeRequests: closedChangeOrders,
      changeRequestRate: (changeOrders.length / 1) * 30, // Assume 30-day month
      avgTimeToResolveChangeRequest: 0, // TODO: Calculate from activities
      costImpactOfChanges: costImpact,
      scheduleImpactOfChanges: 0, // TODO: Calculate
      lastUpdated: new Date(),
    };
  }

  /**
   * Get all metrics for a project
   */
  async getComprehensiveMetrics(projectId: string) {
    const [financial, resources, schedule, quality] = await Promise.all([
      this.getFinancialReconciliation(projectId),
      this.getResourceUtilization(projectId),
      this.getScheduleAnalysis(projectId),
      this.getQualityMetrics(projectId),
    ]);

    return { financial, resources, schedule, quality };
  }
}

export const aggregationService = new AggregationService();
