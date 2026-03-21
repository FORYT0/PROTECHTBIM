/**
 * PROJECT SNAPSHOT SERVICE
 * 
 * Maintains real-time snapshots of project state.
 * Single source of truth for all project metrics.
 * Automatic cache invalidation on events.
 */

import { AppDataSource } from '../config/data-source';
import { Project } from '../entities/Project';
import { Budget } from '../entities/Budget';
import { TimeEntry } from '../entities/TimeEntry';
import { CostEntry } from '../entities/CostEntry';
import { ChangeOrder } from '../entities/ChangeOrder';
import { Contract } from '../entities/Contract';
import { WorkPackage } from '../entities/WorkPackage';
import { eventBus, SystemEvent } from './EventBus';
import { v4 as uuidv4 } from 'uuid';

export interface ProjectSnapshot {
  projectId: string;
  projectName: string;
  projectStatus: string;
  
  // Financial Summary
  financial: {
    originalContractValue: number;
    contractVariations: number;
    revisedContractValue: number;
    budgetedCost: number;
    actualCost: number;
    costVariance: number;
    costVariancePercent: number;
    budgetedRevenue: number;
    actualRevenue: number;
    revenueVariance: number;
    projectedProfit: number;
    pendingChangeOrders: number;
    approvedChangeOrders: number;
  };

  // Schedule Summary
  schedule: {
    plannedDurationDays: number;
    actualElapsedDays: number;
    remainingDays: number;
    percentComplete: number;
    isOnSchedule: boolean;
    scheduleVariance: number;
  };

  // Resource Summary
  resources: {
    allocatedCount: number;
    activeCount: number;
    totalHoursPlanned: number;
    totalHoursUsed: number;
    utilizationPercent: number;
    overallocatedCount: number;
  };

  // Work Package Summary
  workPackages: {
    totalCount: number;
    completedCount: number;
    inProgressCount: number;
    notStartedCount: number;
    completionPercent: number;
  };

  // Quality & Risk
  quality: {
    snagCount: number;
    snagSeverity: 'LOW' | 'MEDIUM' | 'HIGH';
    riskCount: number;
    changeRequestCount: number;
  };

  // Timestamp
  generatedAt: Date;
  validUntil: Date;
  _ttl: number; // TTL in seconds
}

class ProjectSnapshotService {
  private snapshots: Map<string, ProjectSnapshot> = new Map();
  private snapshotTTL = 60; // 1 minute cache
  private invalidationListeners: Map<string, Set<() => void>> = new Map();

  constructor() {
    // Listen for all events and invalidate cache
    eventBus.onAll(async (event: SystemEvent) => {
      await this.invalidateSnapshot(event.projectId);
    });
  }

  /**
   * Get or generate project snapshot
   */
  async getSnapshot(projectId: string, force: boolean = false): Promise<ProjectSnapshot> {
    // Check cache
    const cached = this.snapshots.get(projectId);
    if (cached && !force && new Date() < cached.validUntil) {
      return cached;
    }

    console.log(`📸 [Snapshot] Generating snapshot for project ${projectId}`);

    // Generate new snapshot
    const snapshot = await this.generateSnapshot(projectId);
    this.snapshots.set(projectId, snapshot);

    return snapshot;
  }

  /**
   * Generate fresh snapshot from database
   */
  private async generateSnapshot(projectId: string): Promise<ProjectSnapshot> {
    const projectRepo = AppDataSource.getRepository(Project);
    const budgetRepo = AppDataSource.getRepository(Budget);
    const timeRepo = AppDataSource.getRepository(TimeEntry);
    const costRepo = AppDataSource.getRepository(CostEntry);
    const changeOrderRepo = AppDataSource.getRepository(ChangeOrder);
    const contractRepo = AppDataSource.getRepository(Contract);
    const workPackageRepo = AppDataSource.getRepository(WorkPackage);

    // Fetch all related data in parallel
    const [project, budgets, timeEntries, costEntries, changeOrders, contracts, workPackages] = await Promise.all([
      projectRepo.findOne({ where: { id: projectId } }),
      budgetRepo.find({ where: { projectId } }),
      timeRepo.find({ relations: ['workPackage'], where: { workPackage: { projectId } } }),
      costRepo.find({ where: { projectId } }),
      changeOrderRepo.find({ where: { projectId } }),
      contractRepo.findOne({ where: { projectId } }),
      workPackageRepo.find({ where: { projectId } }),
    ]);

    if (!project) throw new Error(`Project ${projectId} not found`);

    // Financial: Budget.totalBudget is the allocated amount; compute spent from cost entries
    const budgetedCost = budgets.reduce((sum, b) => sum + (Number(b.totalBudget) || 0), 0);
    const actualCost = costEntries.reduce((sum, c) => sum + (Number(c.totalCost) || 0), 0);
    const costVariance = budgetedCost - actualCost;

    const contractValue = contracts ? Number(contracts.originalContractValue) : 0;
    const variations = changeOrders
      .filter(co => co.status === 'Approved')
      .reduce((sum, co) => sum + (Number(co.costImpact) || 0), 0);

    // Calculate schedule metrics
    const startDate = project.startDate ? new Date(project.startDate) : new Date();
    const endDate = project.endDate ? new Date(project.endDate) : new Date();
    const now = new Date();
    const totalDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    const elapsedDays = Math.ceil((now.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    const percentComplete = Math.min(100, Math.max(0, (elapsedDays / totalDays) * 100));

    // TimeEntry has no projectId: these were fetched scoped to work packages
    const totalHoursPlanned = timeEntries.reduce((sum, t) => sum + (Number(t.hours) || 0), 0);
    const totalHoursUsed = totalHoursPlanned; // same field, no separate planned

    // Work package metrics
    const completedCount = workPackages.filter(wp => wp.status === 'COMPLETED').length;
    const inProgressCount = workPackages.filter(wp => wp.status === 'IN_PROGRESS').length;

    const now_time = new Date();
    const validUntil = new Date(now_time.getTime() + this.snapshotTTL * 1000);

    return {
      projectId,
      projectName: project.name,
      projectStatus: project.status,

      financial: {
        originalContractValue: contractValue,
        contractVariations: variations,
        revisedContractValue: contractValue + variations,
        budgetedCost,
        actualCost,
        costVariance,
        costVariancePercent: budgetedCost > 0 ? (costVariance / budgetedCost) * 100 : 0,
        budgetedRevenue: contractValue,
        actualRevenue: actualCost,
        revenueVariance: contractValue - actualCost,
        projectedProfit: (contractValue + variations) - actualCost,
        pendingChangeOrders: changeOrders.filter(co => co.status === 'Submitted' || co.status === 'Under Review').length,
        approvedChangeOrders: changeOrders.filter(co => co.status === 'Approved').length,
      },

      schedule: {
        plannedDurationDays: totalDays,
        actualElapsedDays: elapsedDays,
        remainingDays: Math.max(0, totalDays - elapsedDays),
        percentComplete,
        isOnSchedule: percentComplete <= 100,
        scheduleVariance: elapsedDays - (totalDays * (percentComplete / 100)),
      },

      resources: {
        allocatedCount: timeEntries.length,
        activeCount: timeEntries.length,
        totalHoursPlanned,
        totalHoursUsed,
        utilizationPercent: totalHoursPlanned > 0 ? (totalHoursUsed / totalHoursPlanned) * 100 : 0,
        overallocatedCount: 0,
      },

      workPackages: {
        totalCount: workPackages.length,
        completedCount,
        inProgressCount,
        notStartedCount: workPackages.filter(wp => wp.status === 'NOT_STARTED').length,
        completionPercent: workPackages.length > 0 ? (completedCount / workPackages.length) * 100 : 0,
      },

      quality: {
        snagCount: 0, // TODO: Add snag count
        snagSeverity: 'LOW',
        riskCount: 0, // TODO: Add risk count
        changeRequestCount: changeOrders.length,
      },

      generatedAt: new Date(),
      validUntil,
      _ttl: this.snapshotTTL,
    };
  }

  /**
   * Invalidate snapshot cache
   */
  async invalidateSnapshot(projectId: string): Promise<void> {
    console.log(`🗑️ [Snapshot] Invalidating snapshot for project ${projectId}`);
    this.snapshots.delete(projectId);

    // Notify listeners
    const listeners = this.invalidationListeners.get(projectId);
    if (listeners) {
      listeners.forEach(listener => listener());
    }
  }

  /**
   * Watch for snapshot changes
   */
  onInvalidation(projectId: string, listener: () => void): () => void {
    if (!this.invalidationListeners.has(projectId)) {
      this.invalidationListeners.set(projectId, new Set());
    }
    this.invalidationListeners.get(projectId)!.add(listener);

    return () => {
      this.invalidationListeners.get(projectId)?.delete(listener);
    };
  }

  /**
   * Get snapshot for multiple projects
   */
  async getSnapshots(projectIds: string[]): Promise<Map<string, ProjectSnapshot>> {
    const snapshots = new Map<string, ProjectSnapshot>();
    await Promise.all(
      projectIds.map(async (id) => {
        const snapshot = await this.getSnapshot(id);
        snapshots.set(id, snapshot);
      })
    );
    return snapshots;
  }

  /**
   * Clear all snapshots
   */
  clearAll(): void {
    this.snapshots.clear();
    this.invalidationListeners.clear();
  }
}

export const projectSnapshotService = new ProjectSnapshotService();
