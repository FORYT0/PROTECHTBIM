/**
 * COST ENTRY SERVICE - ENHANCED
 * 
 * Emits events for all cost mutations:
 * - Cost entry creation
 * - Updates
 * - Approvals
 * - Payment status changes
 * 
 * All events automatically trigger financial dashboard refresh.
 */

import { CostEntry, CostCategory, PaymentStatus, EntrySource } from '../entities/CostEntry';
import {
  CostEntryRepository,
  CostEntryFilters,
  CostEntryListResult,
  CostSummary,
  createCostEntryRepository,
} from '../repositories/CostEntryRepository';
import { ResourceRateService, createResourceRateService } from './ResourceRateService';
import { ActivityLogRepository, createActivityLogRepository } from '../repositories/ActivityLogRepository';
import { ActivityActionType, ActivityEntityType } from '../entities/ActivityLog';
import { enhancedEventBus, SystemEventType, createSystemEvent } from './EnhancedEventBus';

export interface CreateCostEntryDTO {
  projectId: string;
  workPackageId?: string;
  costCodeId: string;
  costCategory: CostCategory;
  vendorId?: string;
  description: string;
  quantity?: number;
  unit?: string;
  unitCost?: number;
  totalCost: number;
  invoiceNumber?: string;
  invoiceDate?: Date;
  paymentStatus?: PaymentStatus;
  isBillable?: boolean;
  isCommitted?: boolean;
  commitmentId?: string;
  entryDate: Date;
  entrySource?: EntrySource;
  createdBy: string;
  attachmentIds?: string[];
}

export interface UpdateCostEntryDTO {
  workPackageId?: string;
  costCodeId?: string;
  costCategory?: CostCategory;
  vendorId?: string;
  description?: string;
  quantity?: number;
  unit?: string;
  unitCost?: number;
  totalCost?: number;
  invoiceNumber?: string;
  invoiceDate?: Date;
  paymentStatus?: PaymentStatus;
  isBillable?: boolean;
  isCommitted?: boolean;
  commitmentId?: string;
  entryDate?: Date;
  attachmentIds?: string[];
}

export class CostEntryService {
  private costEntryRepository: CostEntryRepository;
  private resourceRateService: ResourceRateService;
  private activityLogRepository: ActivityLogRepository;

  constructor(
    costEntryRepository?: CostEntryRepository,
    resourceRateService?: ResourceRateService,
    activityLogRepository?: ActivityLogRepository
  ) {
    this.costEntryRepository = costEntryRepository || createCostEntryRepository();
    this.resourceRateService = resourceRateService || createResourceRateService();
    this.activityLogRepository = activityLogRepository || createActivityLogRepository();
  }

  async createCostEntry(data: CreateCostEntryDTO, userId: string): Promise<CostEntry> {
    const costEntryData: Partial<CostEntry> = {
      projectId: data.projectId,
      workPackageId: data.workPackageId,
      costCodeId: data.costCodeId,
      costCategory: data.costCategory,
      vendorId: data.vendorId,
      description: data.description.trim(),
      quantity: data.quantity,
      unit: data.unit?.trim(),
      unitCost: data.unitCost,
      totalCost: data.totalCost,
      invoiceNumber: data.invoiceNumber?.trim(),
      invoiceDate: data.invoiceDate,
      paymentStatus: data.paymentStatus || PaymentStatus.UNPAID,
      isBillable: data.isBillable !== undefined ? data.isBillable : true,
      isCommitted: data.isCommitted !== undefined ? data.isCommitted : false,
      commitmentId: data.commitmentId,
      entryDate: data.entryDate,
      entrySource: data.entrySource || EntrySource.MANUAL,
      createdBy: data.createdBy,
      attachmentIds: data.attachmentIds,
    };

    const costEntry = await this.costEntryRepository.create(costEntryData);

    // Log activity
    await this.activityLogRepository.create({
      projectId: costEntry.projectId,
      userId,
      actionType: ActivityActionType.CREATED,
      entityType: ActivityEntityType.COST_ENTRY,
      entityId: costEntry.id,
      description: `created cost entry: ${costEntry.entryNumber}`,
      metadata: {
        entryNumber: costEntry.entryNumber,
        totalCost: costEntry.totalCost,
        costCategory: costEntry.costCategory,
      },
    });

    // ✅ EMIT ENHANCED EVENT - triggers snapshot invalidation and dashboard refresh
    await enhancedEventBus.emit(
      createSystemEvent(
        SystemEventType.COST_ENTRY_CREATED,
        costEntry.projectId,
        userId,
        costEntry.id,
        'CostEntry',
        {
          entryNumber: costEntry.entryNumber,
          totalCost: costEntry.totalCost,
          costCategory: costEntry.costCategory,
          paymentStatus: costEntry.paymentStatus,
        }
      )
    );

    return costEntry;
  }

  /**
   * Create cost entry from time entry (Time → Cost automation)
   */
  async createCostEntryFromTimeEntry(
    userId: string,
    workPackageId: string,
    projectId: string,
    costCodeId: string,
    hours: number,
    date: Date,
    description: string,
    isOvertime: boolean = false
  ): Promise<CostEntry | null> {
    // Calculate labor cost
    const laborCostCalc = await this.resourceRateService.calculateLaborCost(
      userId,
      hours,
      date,
      isOvertime
    );

    if (!laborCostCalc) {
      // No rate found for user, cannot auto-generate cost entry
      return null;
    }

    const costEntryData: CreateCostEntryDTO = {
      projectId,
      workPackageId,
      costCodeId,
      costCategory: CostCategory.LABOR,
      description: description || `Labor cost for ${hours} hours`,
      quantity: hours,
      unit: 'hours',
      unitCost: laborCostCalc.rate,
      totalCost: laborCostCalc.cost,
      entryDate: date,
      entrySource: EntrySource.TIME_ENTRY,
      createdBy: userId,
      isBillable: true,
    };

    return await this.createCostEntry(costEntryData, userId);
  }

  async getCostEntryById(id: string): Promise<CostEntry | null> {
    if (!id) {
      throw new Error('Cost entry ID is required');
    }

    return await this.costEntryRepository.findById(id);
  }

  async getCostEntryByEntryNumber(entryNumber: string): Promise<CostEntry | null> {
    if (!entryNumber) {
      throw new Error('Entry number is required');
    }

    return await this.costEntryRepository.findByEntryNumber(entryNumber);
  }

  async listCostEntries(filters: CostEntryFilters): Promise<CostEntryListResult> {
    if (filters.page && filters.page < 1) {
      throw new Error('Page must be greater than 0');
    }

    if (filters.perPage && (filters.perPage < 1 || filters.perPage > 1000)) {
      throw new Error('Per page must be between 1 and 1000');
    }

    return await this.costEntryRepository.findAll(filters);
  }

  /**
   * Get cost summary for a project
   */
  async getCostSummary(
    projectId: string,
    filters?: { dateFrom?: Date; dateTo?: Date }
  ): Promise<CostSummary> {
    if (!projectId) {
      throw new Error('Project ID is required');
    }

    return await this.costEntryRepository.getCostSummary(projectId, filters);
  }

  /**
   * Get total cost by cost code for a project
   */
  async getCostByCostCode(projectId: string): Promise<Array<{ costCodeId: string; costCode: string; totalCost: number }>> {
    if (!projectId) {
      throw new Error('Project ID is required');
    }

    return await this.costEntryRepository.getCostByCostCode(projectId);
  }

  async updateCostEntry(id: string, data: UpdateCostEntryDTO, userId: string): Promise<CostEntry> {
    if (!id) {
      throw new Error('Cost entry ID is required');
    }

    const existingCostEntry = await this.costEntryRepository.findById(id);
    if (!existingCostEntry) {
      throw new Error('Cost entry not found');
    }

    // Store old values for tracking
    const oldValues = {
      totalCost: existingCostEntry.totalCost,
      paymentStatus: existingCostEntry.paymentStatus,
    };

    const updateData: Partial<CostEntry> = {};

    if (data.workPackageId !== undefined) updateData.workPackageId = data.workPackageId;
    if (data.costCodeId !== undefined) updateData.costCodeId = data.costCodeId;
    if (data.costCategory !== undefined) updateData.costCategory = data.costCategory;
    if (data.vendorId !== undefined) updateData.vendorId = data.vendorId;
    if (data.description !== undefined) updateData.description = data.description.trim();
    if (data.quantity !== undefined) updateData.quantity = data.quantity;
    if (data.unit !== undefined) updateData.unit = data.unit?.trim();
    if (data.unitCost !== undefined) updateData.unitCost = data.unitCost;
    if (data.totalCost !== undefined) updateData.totalCost = data.totalCost;
    if (data.invoiceNumber !== undefined) updateData.invoiceNumber = data.invoiceNumber?.trim();
    if (data.invoiceDate !== undefined) updateData.invoiceDate = data.invoiceDate;
    if (data.paymentStatus !== undefined) updateData.paymentStatus = data.paymentStatus;
    if (data.isBillable !== undefined) updateData.isBillable = data.isBillable;
    if (data.isCommitted !== undefined) updateData.isCommitted = data.isCommitted;
    if (data.commitmentId !== undefined) updateData.commitmentId = data.commitmentId;
    if (data.entryDate !== undefined) updateData.entryDate = data.entryDate;
    if (data.attachmentIds !== undefined) updateData.attachmentIds = data.attachmentIds;

    const updatedCostEntry = await this.costEntryRepository.update(id, updateData);

    if (!updatedCostEntry) {
      throw new Error('Failed to update cost entry');
    }

    // Log activity
    await this.activityLogRepository.create({
      projectId: updatedCostEntry.projectId,
      userId,
      actionType: ActivityActionType.UPDATED,
      entityType: ActivityEntityType.COST_ENTRY,
      entityId: updatedCostEntry.id,
      description: `updated cost entry: ${updatedCostEntry.entryNumber}`,
      metadata: {
        changes: data,
      },
    });

    // ✅ EMIT ENHANCED EVENT
    await enhancedEventBus.emit(
      createSystemEvent(
        SystemEventType.COST_ENTRY_UPDATED,
        updatedCostEntry.projectId,
        userId,
        updatedCostEntry.id,
        'CostEntry',
        {
          entryNumber: updatedCostEntry.entryNumber,
          totalCost: updatedCostEntry.totalCost,
          paymentStatus: updatedCostEntry.paymentStatus,
        },
        oldValues
      )
    );

    return updatedCostEntry;
  }

  /**
   * Approve a cost entry
   */
  async approveCostEntry(id: string, approvedBy: string): Promise<CostEntry> {
    if (!id) {
      throw new Error('Cost entry ID is required');
    }

    if (!approvedBy) {
      throw new Error('Approver user ID is required');
    }

    const costEntry = await this.costEntryRepository.findById(id);
    if (!costEntry) {
      throw new Error('Cost entry not found');
    }

    const approvedCostEntry = await this.costEntryRepository.approve(id, approvedBy);

    if (!approvedCostEntry) {
      throw new Error('Failed to approve cost entry');
    }

    // Log activity
    await this.activityLogRepository.create({
      projectId: approvedCostEntry.projectId,
      userId: approvedBy,
      actionType: ActivityActionType.APPROVED,
      entityType: ActivityEntityType.COST_ENTRY,
      entityId: approvedCostEntry.id,
      description: `approved cost entry: ${approvedCostEntry.entryNumber}`,
      metadata: {
        entryNumber: approvedCostEntry.entryNumber,
      },
    });

    // ✅ EMIT ENHANCED EVENT
    await enhancedEventBus.emit(
      createSystemEvent(
        SystemEventType.COST_ENTRY_APPROVED,
        approvedCostEntry.projectId,
        approvedBy,
        approvedCostEntry.id,
        'CostEntry',
        {
          entryNumber: approvedCostEntry.entryNumber,
          totalCost: approvedCostEntry.totalCost,
          status: 'APPROVED',
        }
      )
    );

    return approvedCostEntry;
  }

  /**
   * Update payment status
   */
  async updatePaymentStatus(
    id: string,
    paymentStatus: PaymentStatus,
    userId: string
  ): Promise<CostEntry> {
    if (!id) {
      throw new Error('Cost entry ID is required');
    }

    const costEntry = await this.costEntryRepository.findById(id);
    if (!costEntry) {
      throw new Error('Cost entry not found');
    }

    const oldStatus = costEntry.paymentStatus;
    const updatedCostEntry = await this.costEntryRepository.updatePaymentStatus(id, paymentStatus);

    if (!updatedCostEntry) {
      throw new Error('Failed to update payment status');
    }

    // Log activity
    await this.activityLogRepository.create({
      projectId: updatedCostEntry.projectId,
      userId,
      actionType: ActivityActionType.UPDATED,
      entityType: ActivityEntityType.COST_ENTRY,
      entityId: updatedCostEntry.id,
      description: `updated payment status to ${paymentStatus} for cost entry: ${updatedCostEntry.entryNumber}`,
      metadata: {
        oldStatus,
        newStatus: paymentStatus,
      },
    });

    // ✅ EMIT ENHANCED EVENT
    await enhancedEventBus.emit(
      createSystemEvent(
        SystemEventType.COST_ENTRY_UPDATED,
        updatedCostEntry.projectId,
        userId,
        updatedCostEntry.id,
        'CostEntry',
        {
          entryNumber: updatedCostEntry.entryNumber,
          paymentStatus: paymentStatus,
        },
        { paymentStatus: oldStatus }
      )
    );

    return updatedCostEntry;
  }

  async deleteCostEntry(id: string, userId: string): Promise<boolean> {
    if (!id) {
      throw new Error('Cost entry ID is required');
    }

    const costEntry = await this.costEntryRepository.findById(id);
    if (!costEntry) {
      throw new Error('Cost entry not found');
    }

    const result = await this.costEntryRepository.delete(id);

    if (result) {
      // Log activity
      await this.activityLogRepository.create({
        projectId: costEntry.projectId,
        userId,
        actionType: ActivityActionType.DELETED,
        entityType: ActivityEntityType.COST_ENTRY,
        entityId: id,
        description: `deleted cost entry: ${costEntry.entryNumber}`,
        metadata: {
          entryNumber: costEntry.entryNumber,
          totalCost: costEntry.totalCost,
        },
      });

      // ✅ EMIT ENHANCED EVENT
      await enhancedEventBus.emit(
        createSystemEvent(
          SystemEventType.COST_ENTRY_DELETED,
          costEntry.projectId,
          userId,
          id,
          'CostEntry',
          {
            entryNumber: costEntry.entryNumber,
            totalCost: costEntry.totalCost,
          }
        )
      );
    }

    return result;
  }
}

export const createCostEntryService = (): CostEntryService => {
  return new CostEntryService();
};
