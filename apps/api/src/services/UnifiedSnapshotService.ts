/**
 * UNIFIED SNAPSHOT SERVICE
 * 
 * Single source of truth for all project data.
 * Real-time calculations, aggregations, and reconciliations.
 * Every page pulls from this snapshot - no stale data.
 * 
 * ARCHITECTURE:
 * - Database is the persistent source
 * - This service calculates derived data on-demand
 * - Events trigger cache invalidation
 * - Redis caches expensive calculations (TTL: 5 mins)
 */

import { AppDataSource } from '../config/data-source';
import { RedisService } from './RedisService';
import { Budget } from '../entities/Budget';
import { BudgetLine } from '../entities/BudgetLine';
import { TimeEntry } from '../entities/TimeEntry';
import { CostEntry, CostCategory } from '../entities/CostEntry';
import { ChangeOrder, ChangeOrderStatus } from '../entities/ChangeOrder';
import { Contract } from '../entities/Contract';
import { WorkPackage } from '../entities/WorkPackage';

export interface ProjectSnapshot {
  projectId: string;
  
  // Core financial data
  financial: {
    // Contract Level
    contract: {
      originalValue: number;
      revisedValue: number;
      variations: number;
      status: string;
    };
    
    // Budget allocations
    budget: {
      allocated: number;
      spent: number;
      committed: number;
      remaining: number;
      utilization: number; // percentage
      variance: number;
      status: 'UNDER_BUDGET' | 'AT_RISK' | 'OVER_BUDGET';
    };
    
    // Actual costs breakdown
    costs: {
      labor: number;
      material: number;
      equipment: number;
      subcontractor: number;
      other: number;
      total: number;
    };
    
    // Change orders
    changeOrders: {
      pending: {
        count: number;
        value: number;
      };
      approved: {
        count: number;
        value: number;
      };
      rejected: {
        count: number;
        value: number;
      };
    };
    
    // Profitability
    profitability: {
      grossProfit: number;
      profitMargin: number; // percentage
      projectedProfit: number;
      health: 'CRITICAL' | 'WARNING' | 'HEALTHY';
    };
  };
  
  // Resource utilization
  resources: {
    allocated: number;
    totalHoursPlanned: number;
    totalHoursUsed: number;
    averageUtilization: number; // percentage
    overallocated: number;
    underutilized: number;
  };
  
  // Schedule status
  schedule: {
    startDate: Date | null;
    endDate: Date | null;
    totalDays: number;
    elapsedDays: number;
    remainingDays: number;
    plannedProgress: number; // percentage
    actualProgress: number; // percentage
    variance: number; // percentage
    status: 'ON_TRACK' | 'AT_RISK' | 'BEHIND';
    projectedCompletion: Date;
  };
  
  // Work packages
  workPackages: {
    total: number;
    notStarted: number;
    inProgress: number;
    completed: number;
    onHold: number;
  };
  
  // Quality metrics
  quality: {
    totalChangeRequests: number;
    openChangeRequests: number;
    changeRequestRate: number;
    avgResolutionDays: number;
  };
  
  // Timestamp for cache validation
  lastUpdated: Date;
  cacheExpiresAt: Date;
}

class UnifiedSnapshotService {
  private redisService: RedisService;
  private CACHE_TTL = 300; // 5 minutes in seconds

  constructor(redisService?: RedisService) {
    this.redisService = redisService || new RedisService();
  }

  /**
   * Get unified project snapshot
   * Attempts to use cache first, falls back to calculation
   */
  async getProjectSnapshot(projectId: string): Promise<ProjectSnapshot> {
    // Try cache first
    const cached = await this.redisService.get<ProjectSnapshot>(
      this.getCacheKey(projectId)
    );
    
    if (cached) {
      console.log(`✅ [Snapshot] Cache hit for project ${projectId}`);
      return cached;
    }

    console.log(`🔄 [Snapshot] Computing fresh snapshot for project ${projectId}`);

    // Calculate fresh snapshot
    const snapshot = await this.computeSnapshot(projectId);

    // Cache it
    await this.redisService.set(
      this.getCacheKey(projectId),
      snapshot,
      this.CACHE_TTL
    );

    return snapshot;
  }

  /**
   * Compute fresh snapshot from database
   */
  private async computeSnapshot(projectId: string): Promise<ProjectSnapshot> {
    const contractRepo = AppDataSource.getRepository(Contract);
    const budgetRepo = AppDataSource.getRepository(Budget);
    const costRepo = AppDataSource.getRepository(CostEntry);
    const changeOrderRepo = AppDataSource.getRepository(ChangeOrder);
    const timeRepo = AppDataSource.getRepository(TimeEntry);
    const workPackageRepo = AppDataSource.getRepository(WorkPackage);

    // Fetch all data in parallel
    const [contract, budgets, costs, changeOrders, timeEntries, workPackages] = 
      await Promise.all([
        contractRepo.findOne({ where: { projectId } }),
        budgetRepo.find({ where: { projectId }, relations: ['budgetLines'] }),
        costRepo.find({ where: { projectId }, relations: ['costCode'] }),
        changeOrderRepo.find({ where: { projectId } }),
        timeRepo.find({ where: { workPackage: { projectId } }, relations: ['workPackage', 'user'] }),
        workPackageRepo.find({ where: { projectId } }),
      ]);

    // Financial calculations
    const financialData = this.calculateFinancial(
      contract,
      budgets,
      costs,
      changeOrders
    );

    // Resource calculations
    const resourceData = this.calculateResources(timeEntries);

    // Schedule calculations
    const scheduleData = this.calculateSchedule(workPackages);

    // Work package counts
    const workPackageData = this.calculateWorkPackages(workPackages);

    // Quality metrics (placeholder for now)
    const qualityData = this.calculateQuality(changeOrders);

    const now = new Date();
    const expiresAt = new Date(now.getTime() + this.CACHE_TTL * 1000);

    return {
      projectId,
      financial: financialData,
      resources: resourceData,
      schedule: scheduleData,
      workPackages: workPackageData,
      quality: qualityData,
      lastUpdated: now,
      cacheExpiresAt: expiresAt,
    };
  }

  /**
   * Calculate financial metrics
   */
  private calculateFinancial(
    contract: Contract | null,
    budgets: Budget[],
    costs: CostEntry[],
    changeOrders: ChangeOrder[]
  ) {
    if (!contract) {
      return {
        contract: { originalValue: 0, revisedValue: 0, variations: 0, status: 'NONE' },
        budget: { allocated: 0, spent: 0, committed: 0, remaining: 0, utilization: 0, variance: 0, status: 'UNDER_BUDGET' as const },
        costs: { labor: 0, material: 0, equipment: 0, subcontractor: 0, other: 0, total: 0 },
        changeOrders: {
          pending: { count: 0, value: 0 },
          approved: { count: 0, value: 0 },
          rejected: { count: 0, value: 0 },
        },
        profitability: { grossProfit: 0, profitMargin: 0, projectedProfit: 0, health: 'HEALTHY' as const },
      };
    }

    // Budget calculations
    const budgetAllocated = budgets.reduce((sum, b) => sum + (b.totalBudget || 0), 0);
    const budgetSpent = budgets.reduce((sum, b) => {
      if (!b.budgetLines) return sum;
      const spentFromLines = b.budgetLines.reduce((lineSum: number, line: BudgetLine) => {
        return lineSum + (line.actualCost || 0);
      }, 0);
      return sum + spentFromLines;
    }, 0);

    const budgetCommitted = budgets.reduce((sum, b) => {
      if (!b.budgetLines) return sum;
      const committedFromLines = b.budgetLines.reduce((lineSum: number, line: BudgetLine) => {
        return lineSum + (line.committedCost || 0);
      }, 0);
      return sum + committedFromLines;
    }, 0);

    // Cost breakdown by category (using costCategory enum)
    const laborCost = costs
      .filter(c => c.costCategory === CostCategory.LABOR)
      .reduce((sum, c) => sum + (c.totalCost || 0), 0);
    const materialCost = costs
      .filter(c => c.costCategory === CostCategory.MATERIAL)
      .reduce((sum, c) => sum + (c.totalCost || 0), 0);
    const equipmentCost = costs
      .filter(c => c.costCategory === CostCategory.EQUIPMENT)
      .reduce((sum, c) => sum + (c.totalCost || 0), 0);
    const subcontractorCost = costs
      .filter(c => c.costCategory === CostCategory.SUBCONTRACTOR)
      .reduce((sum, c) => sum + (c.totalCost || 0), 0);
    const otherCost = costs
      .filter(c => !['LABOR', 'MATERIAL', 'EQUIPMENT', 'SUBCONTRACTOR'].includes(c.costCategory || ''))
      .reduce((sum, c) => sum + (c.totalCost || 0), 0);

    const totalActualCost = laborCost + materialCost + equipmentCost + subcontractorCost + otherCost;

    // Change orders
    const approvedVariations = changeOrders
      .filter(co => co.status === ChangeOrderStatus.APPROVED)
      .reduce((sum, co) => sum + (co.costImpact || 0), 0);
    const pendingVariations = changeOrders
      .filter(co => co.status === ChangeOrderStatus.SUBMITTED || co.status === ChangeOrderStatus.UNDER_REVIEW)
      .reduce((sum, co) => sum + (co.costImpact || 0), 0);
    const rejectedVariations = changeOrders
      .filter(co => co.status === ChangeOrderStatus.REJECTED)
      .reduce((sum, co) => sum + (co.costImpact || 0), 0);

    const contractRevisedValue = contract.originalContractValue + approvedVariations;
    const grossProfit = contractRevisedValue - totalActualCost;
    const profitMargin = contractRevisedValue > 0 ? (grossProfit / contractRevisedValue) * 100 : 0;
    const projectedProfit = contractRevisedValue + pendingVariations - totalActualCost;

    // Determine health
    let financialHealth: 'CRITICAL' | 'WARNING' | 'HEALTHY' = 'HEALTHY';
    if (totalActualCost > contractRevisedValue) financialHealth = 'CRITICAL';
    else if (totalActualCost > contractRevisedValue * 0.9) financialHealth = 'WARNING';

    // Budget status
    let budgetStatus: 'UNDER_BUDGET' | 'AT_RISK' | 'OVER_BUDGET' = 'UNDER_BUDGET';
    if (budgetSpent > budgetAllocated) budgetStatus = 'OVER_BUDGET';
    else if (budgetSpent > budgetAllocated * 0.8) budgetStatus = 'AT_RISK';

    return {
      contract: {
        originalValue: contract.originalContractValue,
        revisedValue: contractRevisedValue,
        variations: approvedVariations,
        status: contract.status || 'ACTIVE',
      },
      budget: {
        allocated: budgetAllocated,
        spent: budgetSpent,
        committed: budgetCommitted,
        remaining: Math.max(0, budgetAllocated - budgetSpent),
        utilization: budgetAllocated > 0 ? (budgetSpent / budgetAllocated) * 100 : 0,
        variance: budgetAllocated - budgetSpent,
        status: budgetStatus,
      },
      costs: {
        labor: laborCost,
        material: materialCost,
        equipment: equipmentCost,
        subcontractor: subcontractorCost,
        other: otherCost,
        total: totalActualCost,
      },
      changeOrders: {
        pending: {
          count: changeOrders.filter(co => co.status === ChangeOrderStatus.SUBMITTED || co.status === ChangeOrderStatus.UNDER_REVIEW).length,
          value: pendingVariations,
        },
        approved: {
          count: changeOrders.filter(co => co.status === ChangeOrderStatus.APPROVED).length,
          value: approvedVariations,
        },
        rejected: {
          count: changeOrders.filter(co => co.status === ChangeOrderStatus.REJECTED).length,
          value: rejectedVariations,
        },
      },
      profitability: {
        grossProfit,
        profitMargin,
        projectedProfit,
        health: financialHealth,
      },
    };
  }

  /**
   * Calculate resource utilization
   */
  private calculateResources(timeEntries: TimeEntry[]) {
    const totalHoursPlanned = timeEntries.reduce((sum, te) => sum + (te.hours || 0), 0);
    const totalHoursUsed = timeEntries.reduce((sum, te) => sum + (te.hours || 0), 0);

    // For now, treat all as used (actual tracking would be different)
    let overallocated = 0;
    let underutilized = 0;

    // Simple heuristic: if > 40 hours/week, considered overallocated
    if (totalHoursUsed > 40) overallocated = 1;

    return {
      allocated: timeEntries.length,
      totalHoursPlanned,
      totalHoursUsed,
      averageUtilization: timeEntries.length > 0 ? (totalHoursUsed / totalHoursPlanned) * 100 : 0,
      overallocated,
      underutilized,
    };
  }

  /**
   * Calculate schedule status
   */
  private calculateSchedule(workPackages: WorkPackage[]) {
    if (workPackages.length === 0) {
      return {
        startDate: null,
        endDate: null,
        totalDays: 0,
        elapsedDays: 0,
        remainingDays: 0,
        plannedProgress: 0,
        actualProgress: 0,
        variance: 0,
        status: 'ON_TRACK' as const,
        projectedCompletion: new Date(),
      };
    }

    const startDate = workPackages[0]?.startDate || new Date();
    const endDate = workPackages[workPackages.length - 1]?.dueDate || new Date();

    const now = new Date();
    const totalMs = endDate.getTime() - startDate.getTime();
    const elapsedMs = Math.min(now.getTime() - startDate.getTime(), totalMs);
    
    const totalDays = Math.ceil(totalMs / (1000 * 60 * 60 * 24));
    const elapsedDays = Math.ceil(elapsedMs / (1000 * 60 * 60 * 24));

    const plannedProgress = totalDays > 0 ? (elapsedDays / totalDays) * 100 : 0;
    
    const completed = workPackages.filter(wp => wp.status === 'COMPLETED').length;
    const actualProgress = (completed / workPackages.length) * 100;

    const variance = actualProgress - plannedProgress;

    let status: 'ON_TRACK' | 'AT_RISK' | 'BEHIND' = 'ON_TRACK';
    if (variance < -10) status = 'BEHIND';
    else if (variance < 0) status = 'AT_RISK';

    const projectedDays = actualProgress > 0 ? (totalDays / actualProgress) * 100 : totalDays;
    const projectedCompletion = new Date(startDate.getTime() + (projectedDays * 24 * 60 * 60 * 1000));

    return {
      startDate,
      endDate,
      totalDays,
      elapsedDays: Math.max(0, elapsedDays),
      remainingDays: Math.max(0, totalDays - elapsedDays),
      plannedProgress: Math.min(100, plannedProgress),
      actualProgress: Math.min(100, actualProgress),
      variance,
      status,
      projectedCompletion,
    };
  }

  /**
   * Count work packages by status
   */
  private calculateWorkPackages(workPackages: WorkPackage[]) {
    return {
      total: workPackages.length,
      notStarted: workPackages.filter(wp => wp.status === 'NOT_STARTED').length,
      inProgress: workPackages.filter(wp => wp.status === 'IN_PROGRESS').length,
      completed: workPackages.filter(wp => wp.status === 'COMPLETED').length,
      onHold: workPackages.filter(wp => wp.status === 'ON_HOLD').length,
    };
  }

  /**
   * Calculate quality metrics
   */
  private calculateQuality(changeOrders: ChangeOrder[]) {
    return {
      totalChangeRequests: changeOrders.length,
      openChangeRequests: changeOrders.filter(co => co.status === ChangeOrderStatus.SUBMITTED || co.status === ChangeOrderStatus.UNDER_REVIEW).length,
      changeRequestRate: (changeOrders.length / 1) * 30, // per month
      avgResolutionDays: 0, // TODO: calculate from dates
    };
  }

  /**
   * Invalidate snapshot cache
   */
  async invalidateProjectSnapshot(projectId: string): Promise<void> {
    await this.redisService.delete(this.getCacheKey(projectId));
    console.log(`🗑️  [Snapshot] Cache invalidated for project ${projectId}`);
  }

  /**
   * Get cache key
   */
  private getCacheKey(projectId: string): string {
    return `snapshot:project:${projectId}`;
  }
}

export const createUnifiedSnapshotService = (): UnifiedSnapshotService => {
  return new UnifiedSnapshotService();
};

export const unifiedSnapshotService = new UnifiedSnapshotService();
