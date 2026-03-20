/**
 * BUDGET SERVICE - ENHANCED
 * 
 * Now emits enhanced events that automatically trigger:
 * - Snapshot cache invalidation
 * - WebSocket broadcast to all connected clients
 * - Financial dashboard refresh across all pages
 * 
 * Every budget mutation causes global synchronization.
 */

import { Budget } from '../entities/Budget';
import { BudgetLine } from '../entities/BudgetLine';
import { BudgetRepository, createBudgetRepository } from '../repositories/BudgetRepository';
import { ActivityLogRepository, createActivityLogRepository } from '../repositories/ActivityLogRepository';
import { ActivityActionType, ActivityEntityType } from '../entities/ActivityLog';
import { RealtimeEventService, RealtimeEventType, createRealtimeEventService } from './RealtimeEventService';
import { enhancedEventBus, SystemEventType, createSystemEvent } from './EnhancedEventBus';

export interface CreateBudgetDTO {
  projectId: string;
  name?: string;
  totalBudget: number;
  contingencyPercentage?: number;
  contingencyAmount?: number;
  currency?: string;
  startDate?: Date;
  endDate?: Date;
  description?: string;
  budgetLines: Array<{
    costCodeId: string;
    budgetedAmount: number;
    notes?: string;
  }>;
}

export interface UpdateBudgetDTO {
  name?: string;
  totalBudget?: number;
  contingencyPercentage?: number;
  contingencyAmount?: number;
  startDate?: Date;
  endDate?: Date;
  description?: string;
  isActive?: boolean;
}

export interface UpdateBudgetLineDTO {
  budgetedAmount?: number;
  actualCost?: number;
  committedCost?: number;
  notes?: string;
}

export class BudgetService {
  private budgetRepository: BudgetRepository;
  private activityLogRepository: ActivityLogRepository;
  private realtimeEventService: RealtimeEventService;

  constructor(
    budgetRepository?: BudgetRepository,
    activityLogRepository?: ActivityLogRepository,
    realtimeEventService?: RealtimeEventService
  ) {
    this.budgetRepository = budgetRepository || createBudgetRepository();
    this.activityLogRepository = activityLogRepository || createActivityLogRepository();
    this.realtimeEventService = realtimeEventService || createRealtimeEventService();
  }

  async createBudget(data: CreateBudgetDTO, userId: string): Promise<Budget> {
    // Validation
    if (!data.projectId) {
      throw new Error('Project ID is required');
    }

    if (!data.totalBudget || data.totalBudget <= 0) {
      throw new Error('Total budget must be greater than 0');
    }

    if (!data.budgetLines || data.budgetLines.length === 0) {
      throw new Error('At least one budget line is required');
    }

    // Check if project already has an active budget
    const existingBudget = await this.budgetRepository.findByProjectId(data.projectId);
    if (existingBudget) {
      // Deactivate existing budget
      await this.budgetRepository.update(existingBudget.id, { isActive: false });
    }

    // Create budget
    const budgetData: Partial<Budget> = {
      projectId: data.projectId,
      name: data.name || 'Project Budget',
      totalBudget: data.totalBudget,
      contingencyPercentage: data.contingencyPercentage || 0,
      contingencyAmount: data.contingencyAmount || 0,
      currency: data.currency || 'USD',
      startDate: data.startDate || null,
      endDate: data.endDate || null,
      description: data.description || null,
      isActive: true,
    };

    const budget = await this.budgetRepository.create(budgetData);

    // Create budget lines
    for (const line of data.budgetLines) {
      await this.budgetRepository.createBudgetLine({
        budgetId: budget.id,
        costCodeId: line.costCodeId,
        budgetedAmount: line.budgetedAmount,
        notes: line.notes || null,
        actualCost: 0,
        committedCost: 0,
      });
    }

    // Log activity
    await this.activityLogRepository.create({
      projectId: budget.projectId,
      userId,
      actionType: ActivityActionType.CREATED,
      entityType: ActivityEntityType.BUDGET,
      entityId: budget.id,
      description: `created budget: ${budget.name}`,
      metadata: {
        totalBudget: budget.totalBudget,
        budgetLinesCount: data.budgetLines.length,
      },
    });

    // Emit real-time event
    this.realtimeEventService.emitBudgetEvent(
      RealtimeEventType.BUDGET_CREATED,
      budget.projectId,
      budget.id,
      {
        budgetId: budget.id,
        totalBudget: budget.totalBudget,
        budgetLinesCount: data.budgetLines.length,
      }
    );

    // ✅ EMIT ENHANCED EVENT - automatically triggers snapshot invalidation & WebSocket broadcast
    await enhancedEventBus.emit(
      createSystemEvent(
        SystemEventType.BUDGET_CREATED,
        budget.projectId,
        userId,
        budget.id,
        'Budget',
        {
          budgetId: budget.id,
          name: budget.name,
          totalBudget: budget.totalBudget,
          contingencyPercentage: budget.contingencyPercentage,
          budgetLinesCount: data.budgetLines.length,
        }
      )
    );

    // Reload with relations
    const createdBudget = await this.budgetRepository.findById(budget.id);
    if (!createdBudget) {
      throw new Error('Failed to create budget');
    }

    return createdBudget;
  }

  async getBudgetById(id: string): Promise<Budget | null> {
    if (!id) {
      throw new Error('Budget ID is required');
    }

    return await this.budgetRepository.findById(id);
  }

  async getBudgetByProjectId(projectId: string): Promise<Budget | null> {
    if (!projectId) {
      throw new Error('Project ID is required');
    }

    return await this.budgetRepository.findByProjectId(projectId);
  }

  async updateBudget(id: string, data: UpdateBudgetDTO, userId: string): Promise<Budget> {
    if (!id) {
      throw new Error('Budget ID is required');
    }

    const existingBudget = await this.budgetRepository.findById(id);
    if (!existingBudget) {
      throw new Error('Budget not found');
    }

    // Store old values for event tracking
    const oldValues = {
      name: existingBudget.name,
      totalBudget: existingBudget.totalBudget,
      contingencyPercentage: existingBudget.contingencyPercentage,
      contingencyAmount: existingBudget.contingencyAmount,
    };

    const updateData: Partial<Budget> = {};

    if (data.name !== undefined) updateData.name = data.name;
    if (data.totalBudget !== undefined) updateData.totalBudget = data.totalBudget;
    if (data.contingencyPercentage !== undefined) updateData.contingencyPercentage = data.contingencyPercentage;
    if (data.contingencyAmount !== undefined) updateData.contingencyAmount = data.contingencyAmount;
    if (data.startDate !== undefined) updateData.startDate = data.startDate;
    if (data.endDate !== undefined) updateData.endDate = data.endDate;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.isActive !== undefined) updateData.isActive = data.isActive;

    const updatedBudget = await this.budgetRepository.update(id, updateData);

    if (!updatedBudget) {
      throw new Error('Failed to update budget');
    }

    // Log activity
    await this.activityLogRepository.create({
      projectId: updatedBudget.projectId,
      userId,
      actionType: ActivityActionType.UPDATED,
      entityType: ActivityEntityType.BUDGET,
      entityId: updatedBudget.id,
      description: `updated budget: ${updatedBudget.name}`,
      metadata: {
        changes: data,
      },
    });

    // Emit real-time event
    this.realtimeEventService.emitBudgetEvent(
      RealtimeEventType.BUDGET_UPDATED,
      updatedBudget.projectId,
      updatedBudget.id,
      {
        budgetId: updatedBudget.id,
        changes: data,
      }
    );

    // ✅ EMIT ENHANCED EVENT - triggers snapshot invalidation and dashboard refresh
    await enhancedEventBus.emit(
      createSystemEvent(
        SystemEventType.BUDGET_UPDATED,
        updatedBudget.projectId,
        userId,
        updatedBudget.id,
        'Budget',
        {
          budgetId: updatedBudget.id,
          name: updatedBudget.name,
          totalBudget: updatedBudget.totalBudget,
          contingencyPercentage: updatedBudget.contingencyPercentage,
        },
        oldValues
      )
    );

    return updatedBudget;
  }

  async updateBudgetLine(
    budgetLineId: string,
    data: UpdateBudgetLineDTO,
    userId: string
  ): Promise<BudgetLine> {
    if (!budgetLineId) {
      throw new Error('Budget line ID is required');
    }

    const updateData: Partial<BudgetLine> = {};

    if (data.budgetedAmount !== undefined) updateData.budgetedAmount = data.budgetedAmount;
    if (data.actualCost !== undefined) updateData.actualCost = data.actualCost;
    if (data.committedCost !== undefined) updateData.committedCost = data.committedCost;
    if (data.notes !== undefined) updateData.notes = data.notes;

    const updatedBudgetLine = await this.budgetRepository.updateBudgetLine(budgetLineId, updateData);

    if (!updatedBudgetLine) {
      throw new Error('Failed to update budget line');
    }

    // ✅ EMIT ENHANCED EVENT
    if (updatedBudgetLine.budget) {
      await enhancedEventBus.emit(
        createSystemEvent(
          SystemEventType.BUDGET_LINE_UPDATED,
          updatedBudgetLine.budget.projectId,
          userId,
          updatedBudgetLine.id,
          'BudgetLine',
          {
            budgetLineId: updatedBudgetLine.id,
            actualCost: updatedBudgetLine.actualCost,
            committedCost: updatedBudgetLine.committedCost,
          }
        )
      );
    }

    return updatedBudgetLine;
  }

  async deleteBudget(id: string, userId: string): Promise<boolean> {
    if (!id) {
      throw new Error('Budget ID is required');
    }

    const budget = await this.budgetRepository.findById(id);
    if (!budget) {
      throw new Error('Budget not found');
    }

    const result = await this.budgetRepository.delete(id);

    if (result) {
      // Log activity
      await this.activityLogRepository.create({
        projectId: budget.projectId,
        userId,
        actionType: ActivityActionType.DELETED,
        entityType: ActivityEntityType.BUDGET,
        entityId: id,
        description: `deleted budget: ${budget.name}`,
        metadata: {
          totalBudget: budget.totalBudget,
        },
      });

      // Emit real-time event
      this.realtimeEventService.emitBudgetEvent(
        RealtimeEventType.BUDGET_DELETED,
        budget.projectId,
        id,
        {
          budgetId: id,
        }
      );

      // ✅ EMIT ENHANCED EVENT - triggers snapshot invalidation and dashboard refresh
      await enhancedEventBus.emit(
        createSystemEvent(
          SystemEventType.BUDGET_DELETED,
          budget.projectId,
          userId,
          id,
          'Budget',
          {
            budgetId: id,
            name: budget.name,
          }
        )
      );
    }

    return result;
  }
}

export const createBudgetService = (): BudgetService => {
  return new BudgetService();
};
