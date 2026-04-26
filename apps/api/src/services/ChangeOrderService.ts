/**
 * CHANGE ORDER SERVICE - ENHANCED
 * 
 * Now emits comprehensive events for:
 * - Change order creation
 * - Approval (triggers financial recalculation)
 * - Rejection
 * 
 * All events automatically trigger:
 * - Snapshot cache invalidation
 * - WebSocket broadcast
 * - Financial dashboard refresh
 */

import { AppDataSource } from '../config/data-source';
import { ChangeOrder, ChangeOrderStatus, ChangeOrderReason, ChangeOrderPriority } from '../entities/ChangeOrder';
import { ChangeOrderCostLine } from '../entities/ChangeOrderCostLine';
import { Contract } from '../entities/Contract';
import { BudgetLine } from '../entities/BudgetLine';
import { Budget } from '../entities/Budget';
import { ActivityLog, ActivityActionType, ActivityEntityType } from '../entities/ActivityLog';
import { ContractService } from './ContractService';
import { enhancedEventBus, SystemEventType, createSystemEvent } from './EnhancedEventBus';

export interface CreateChangeOrderDTO {
  projectId: string;
  contractId: string;
  title: string;
  description: string;
  reason: ChangeOrderReason;
  costImpact: number;
  scheduleImpactDays?: number;
  priority?: ChangeOrderPriority;
  notes?: string;
  costLines: Array<{
    costCodeId: string;
    description: string;
    quantity: number;
    unit: string;
    rate: number;
    amount: number;
    notes?: string;
  }>;
}

export interface UpdateChangeOrderDTO {
  title?: string;
  description?: string;
  reason?: ChangeOrderReason;
  costImpact?: number;
  scheduleImpactDays?: number;
  priority?: ChangeOrderPriority;
  notes?: string;
}

export class ChangeOrderService {
  private contractService: ContractService;

  constructor() {
    this.contractService = new ContractService();
  }

  private get changeOrderRepository() {
    return AppDataSource.getRepository(ChangeOrder);
  }

  private get costLineRepository() {
    return AppDataSource.getRepository(ChangeOrderCostLine);
  }

  private get contractRepository() {
    return AppDataSource.getRepository(Contract);
  }

  private get budgetRepository() {
    return AppDataSource.getRepository(Budget);
  }

  private get budgetLineRepository() {
    return AppDataSource.getRepository(BudgetLine);
  }

  private get activityLogRepository() {
    return AppDataSource.getRepository(ActivityLog);
  }

  async getAllChangeOrders(): Promise<ChangeOrder[]> {
    return await this.changeOrderRepository.find({
      order: { createdAt: 'DESC' },
    });
  }

  async createChangeOrder(data: CreateChangeOrderDTO, userId: string): Promise<ChangeOrder> {
    // Validation
    if (!data.projectId || !data.contractId) {
      throw new Error('Project ID and Contract ID are required');
    }

    if (!data.title || !data.description) {
      throw new Error('Title and description are required');
    }

    // costLines is optional
    const costLines = data.costLines || [];

    // Verify contract exists
    const contract = await this.contractRepository.findOne({
      where: { id: data.contractId },
    });

    if (!contract) {
      throw new Error('Contract not found');
    }

    // Generate change number
    const count = await this.changeOrderRepository.count({
      where: { projectId: data.projectId },
    });
    const changeNumber = `CO-${String(count + 1).padStart(3, '0')}`;

    // Create change order
    const changeOrder = this.changeOrderRepository.create({
      projectId: data.projectId,
      contractId: data.contractId,
      changeNumber,
      title: data.title,
      description: data.description,
      reason: data.reason,
      costImpact: data.costImpact,
      scheduleImpactDays: data.scheduleImpactDays || 0,
      priority: data.priority || ChangeOrderPriority.MEDIUM,
      status: ChangeOrderStatus.DRAFT,
      submittedBy: userId,
      notes: data.notes || null,
    });

    const savedChangeOrder = await this.changeOrderRepository.save(changeOrder);

    // Create cost lines
    for (const line of costLines) {
      const costLine = this.costLineRepository.create({
        changeOrderId: savedChangeOrder.id,
        costCodeId: line.costCodeId,
        description: line.description,
        quantity: line.quantity,
        unit: line.unit,
        rate: line.rate,
        amount: line.amount,
        notes: line.notes || null,
      });
      await this.costLineRepository.save(costLine);
    }

    // Log activity
    await this.activityLogRepository.save({
      projectId: savedChangeOrder.projectId,
      userId,
      actionType: ActivityActionType.CREATED,
      entityType: ActivityEntityType.PROJECT,
      entityId: savedChangeOrder.id,
      description: `created change order: ${savedChangeOrder.changeNumber}`,
      metadata: {
        changeNumber: savedChangeOrder.changeNumber,
        costImpact: savedChangeOrder.costImpact,
        scheduleImpactDays: savedChangeOrder.scheduleImpactDays,
      },
    });

    // ✅ EMIT ENHANCED EVENT - automatically triggers snapshot invalidation & WebSocket broadcast
    await enhancedEventBus.emit(
      createSystemEvent(
        SystemEventType.CHANGE_ORDER_CREATED,
        savedChangeOrder.projectId,
        userId,
        savedChangeOrder.id,
        'ChangeOrder',
        {
          changeNumber: savedChangeOrder.changeNumber,
          title: savedChangeOrder.title,
          costImpact: savedChangeOrder.costImpact,
          scheduleImpactDays: savedChangeOrder.scheduleImpactDays,
          status: savedChangeOrder.status,
        }
      )
    );

    return savedChangeOrder;
  }

  async submitChangeOrder(id: string, userId: string): Promise<ChangeOrder> {
    const changeOrder = await this.getChangeOrderById(id);

    if (!changeOrder) {
      throw new Error('Change order not found');
    }

    if (changeOrder.status !== ChangeOrderStatus.DRAFT) {
      throw new Error('Only draft change orders can be submitted');
    }

    const oldStatus = changeOrder.status;
    changeOrder.status = ChangeOrderStatus.SUBMITTED;
    changeOrder.submittedAt = new Date();

    const updated = await this.changeOrderRepository.save(changeOrder);

    // Update contract pending variations
    await this.updateContractPendingVariations(changeOrder.contractId);

    // Log activity
    await this.activityLogRepository.save({
      projectId: updated.projectId,
      userId,
      actionType: ActivityActionType.UPDATED,
      entityType: ActivityEntityType.PROJECT,
      entityId: updated.id,
      description: `submitted change order: ${updated.changeNumber}`,
      metadata: {
        changeNumber: updated.changeNumber,
        costImpact: updated.costImpact,
      },
    });

    // ✅ EMIT ENHANCED EVENT
    await enhancedEventBus.emit(
      createSystemEvent(
        SystemEventType.CHANGE_ORDER_UPDATED,
        updated.projectId,
        userId,
        updated.id,
        'ChangeOrder',
        {
          changeNumber: updated.changeNumber,
          status: updated.status,
          costImpact: updated.costImpact,
        },
        { status: oldStatus }
      )
    );

    return updated;
  }

  async approveChangeOrder(id: string, userId: string): Promise<ChangeOrder> {
    const changeOrder = await this.getChangeOrderById(id);

    if (!changeOrder) {
      throw new Error('Change order not found');
    }

    if (changeOrder.status !== ChangeOrderStatus.UNDER_REVIEW) {
      throw new Error('Only change orders under review can be approved');
    }

    // Start transaction
    const queryRunner = AppDataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Update change order status
      const oldStatus = changeOrder.status;
      changeOrder.status = ChangeOrderStatus.APPROVED;
      changeOrder.approvedBy = userId;
      changeOrder.approvedAt = new Date();

      const updated = await queryRunner.manager.save(changeOrder);

      // 1. Update contract value
      await this.contractService.updateContractValue(
        changeOrder.contractId,
        changeOrder.costImpact,
        userId
      );

      // 2. Update budget lines
      await this.updateBudgetFromChangeOrder(changeOrder, queryRunner);

      // 3. Update contract pending variations
      await this.updateContractPendingVariations(changeOrder.contractId);

      // Commit transaction
      await queryRunner.commitTransaction();

      // Log activity
      await this.activityLogRepository.save({
        projectId: updated.projectId,
        userId,
        actionType: ActivityActionType.APPROVED,
        entityType: ActivityEntityType.PROJECT,
        entityId: updated.id,
        description: `approved change order: ${updated.changeNumber}`,
        metadata: {
          changeNumber: updated.changeNumber,
          costImpact: updated.costImpact,
          scheduleImpactDays: updated.scheduleImpactDays,
        },
      });

      // ✅ EMIT ENHANCED EVENT - triggers financial dashboard refresh
      await enhancedEventBus.emit(
        createSystemEvent(
          SystemEventType.CHANGE_ORDER_APPROVED,
          updated.projectId,
          userId,
          updated.id,
          'ChangeOrder',
          {
            changeNumber: updated.changeNumber,
            status: updated.status,
            costImpact: updated.costImpact,
            scheduleImpactDays: updated.scheduleImpactDays,
          },
          { status: oldStatus }
        )
      );

      return updated;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async rejectChangeOrder(id: string, userId: string, reason: string): Promise<ChangeOrder> {
    const changeOrder = await this.getChangeOrderById(id);

    if (!changeOrder) {
      throw new Error('Change order not found');
    }

    if (changeOrder.status !== ChangeOrderStatus.UNDER_REVIEW) {
      throw new Error('Only change orders under review can be rejected');
    }

    const oldStatus = changeOrder.status;
    changeOrder.status = ChangeOrderStatus.REJECTED;
    changeOrder.reviewedBy = userId;
    changeOrder.reviewedAt = new Date();
    changeOrder.rejectionReason = reason;

    const updated = await this.changeOrderRepository.save(changeOrder);

    // Update contract pending variations
    await this.updateContractPendingVariations(changeOrder.contractId);

    // Log activity
    await this.activityLogRepository.save({
      projectId: updated.projectId,
      userId,
      actionType: ActivityActionType.UPDATED,
      entityType: ActivityEntityType.PROJECT,
      entityId: updated.id,
      description: `rejected change order: ${updated.changeNumber}`,
      metadata: {
        changeNumber: updated.changeNumber,
        rejectionReason: reason,
      },
    });

    // ✅ EMIT ENHANCED EVENT
    await enhancedEventBus.emit(
      createSystemEvent(
        SystemEventType.CHANGE_ORDER_REJECTED,
        updated.projectId,
        userId,
        updated.id,
        'ChangeOrder',
        {
          changeNumber: updated.changeNumber,
          status: updated.status,
          rejectionReason: reason,
        },
        { status: oldStatus }
      )
    );

    return updated;
  }

  private async updateBudgetFromChangeOrder(changeOrder: ChangeOrder, queryRunner: any): Promise<void> {
    // Get cost lines
    const costLines = await this.costLineRepository.find({
      where: { changeOrderId: changeOrder.id },
    });

    // Get project budget
    const budget = await this.budgetRepository.findOne({
      where: { projectId: changeOrder.projectId, isActive: true },
    });

    if (!budget) {
      console.warn('No active budget found for project. Skipping budget update.');
      return;
    }

    // Update budget total
    budget.totalBudget += changeOrder.costImpact;
    await queryRunner.manager.save(budget);

    // Update or create budget lines for each cost code
    for (const costLine of costLines) {
      const existingBudgetLine = await this.budgetLineRepository.findOne({
        where: {
          budgetId: budget.id,
          costCodeId: costLine.costCodeId,
        },
      });

      if (existingBudgetLine) {
        // Update existing budget line
        existingBudgetLine.budgetedAmount += costLine.amount;
        await queryRunner.manager.save(existingBudgetLine);
      } else {
        // Create new budget line
        const newBudgetLine = this.budgetLineRepository.create({
          budgetId: budget.id,
          costCodeId: costLine.costCodeId,
          budgetedAmount: costLine.amount,
          actualCost: 0,
          committedCost: 0,
          notes: `Added from change order ${changeOrder.changeNumber}`,
        });
        await queryRunner.manager.save(newBudgetLine);
      }
    }
  }

  private async updateContractPendingVariations(contractId: string): Promise<void> {
    // Calculate total pending variations
    const result = await this.changeOrderRepository
      .createQueryBuilder('co')
      .select('SUM(co.costImpact)', 'total')
      .where('co.contractId = :contractId', { contractId })
      .andWhere('co.status IN (:...statuses)', {
        statuses: [ChangeOrderStatus.SUBMITTED, ChangeOrderStatus.UNDER_REVIEW],
      })
      .getRawOne();

    const pendingAmount = parseFloat(result?.total || '0');

    await this.contractService.updatePendingVariations(contractId, pendingAmount);
  }

  async getChangeOrderById(id: string): Promise<ChangeOrder | null> {
    return await this.changeOrderRepository.findOne({
      where: { id },
      relations: ['project', 'contract', 'submitter', 'reviewer', 'approver'],
    });
  }

  async getChangeOrdersByProject(projectId: string): Promise<ChangeOrder[]> {
    return await this.changeOrderRepository.find({
      where: { projectId },
      order: { createdAt: 'DESC' },
    });
  }

  async getChangeOrdersByContract(contractId: string): Promise<ChangeOrder[]> {
    return await this.changeOrderRepository.find({
      where: { contractId },
      order: { createdAt: 'DESC' },
    });
  }

  async getCostLines(changeOrderId: string): Promise<ChangeOrderCostLine[]> {
    return await this.costLineRepository.find({
      where: { changeOrderId },
      relations: ['costCode'],
      order: { createdAt: 'ASC' },
    });
  }

  async getChangeOrderMetrics(projectId: string) {
    const changeOrders = await this.getChangeOrdersByProject(projectId);

    const metrics = {
      total: changeOrders.length,
      draft: 0,
      submitted: 0,
      underReview: 0,
      approved: 0,
      rejected: 0,
      voided: 0,
      totalCostImpact: 0,
      approvedCostImpact: 0,
      pendingCostImpact: 0,
      totalScheduleImpact: 0,
      approvedScheduleImpact: 0,
    };

    changeOrders.forEach((co) => {
      metrics.totalCostImpact += co.costImpact;
      metrics.totalScheduleImpact += co.scheduleImpactDays;

      switch (co.status) {
        case ChangeOrderStatus.DRAFT:
          metrics.draft++;
          break;
        case ChangeOrderStatus.SUBMITTED:
          metrics.submitted++;
          metrics.pendingCostImpact += co.costImpact;
          break;
        case ChangeOrderStatus.UNDER_REVIEW:
          metrics.underReview++;
          metrics.pendingCostImpact += co.costImpact;
          break;
        case ChangeOrderStatus.APPROVED:
          metrics.approved++;
          metrics.approvedCostImpact += co.costImpact;
          metrics.approvedScheduleImpact += co.scheduleImpactDays;
          break;
        case ChangeOrderStatus.REJECTED:
          metrics.rejected++;
          break;
        case ChangeOrderStatus.VOIDED:
          metrics.voided++;
          break;
      }
    });

    return metrics;
  }
}

export const createChangeOrderService = (): ChangeOrderService => {
  return new ChangeOrderService();
};
