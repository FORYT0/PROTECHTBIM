import { AppDataSource } from '../config/data-source';
import { Contract, ContractType, ContractStatus } from '../entities/Contract';
import { ActivityLog, ActivityActionType, ActivityEntityType } from '../entities/ActivityLog';
import { enhancedEventBus, createSystemEvent, SystemEventType } from './EnhancedEventBus';

export interface CreateContractDTO {
  projectId: string;
  contractNumber: string;
  contractType: ContractType;
  clientName: string;
  originalContractValue: number;
  originalDurationDays: number;
  startDate: Date;
  completionDate: Date;
  retentionPercentage?: number;
  advancePaymentAmount?: number;
  performanceBondValue?: number;
  currency?: string;
  description?: string;
  terms?: string;
}

export interface UpdateContractDTO {
  contractType?: ContractType;
  clientName?: string;
  retentionPercentage?: number;
  advancePaymentAmount?: number;
  performanceBondValue?: number;
  status?: ContractStatus;
  description?: string;
  terms?: string;
}

export class ContractService {
  private get contractRepository() {
    return AppDataSource.getRepository(Contract);
  }

  private get activityLogRepository() {
    return AppDataSource.getRepository(ActivityLog);
  }

  async createContract(data: CreateContractDTO, userId: string): Promise<Contract> {
    // Validation
    if (!data.projectId) {
      throw new Error('Project ID is required');
    }

    if (!data.contractNumber) {
      throw new Error('Contract number is required');
    }

    if (!data.originalContractValue || data.originalContractValue <= 0) {
      throw new Error('Original contract value must be greater than 0');
    }

    // Check if contract number already exists
    const existing = await this.contractRepository.findOne({
      where: { contractNumber: data.contractNumber },
    });

    if (existing) {
      throw new Error(`Contract number ${data.contractNumber} already exists`);
    }

    // Create contract
    const contract = this.contractRepository.create({
      projectId: data.projectId,
      contractNumber: data.contractNumber,
      contractType: data.contractType,
      clientName: data.clientName,
      originalContractValue: data.originalContractValue,
      revisedContractValue: data.originalContractValue, // Initially same as original
      totalApprovedVariations: 0,
      totalPendingVariations: 0,
      originalDurationDays: data.originalDurationDays,
      startDate: data.startDate,
      completionDate: data.completionDate,
      retentionPercentage: data.retentionPercentage || 0,
      advancePaymentAmount: data.advancePaymentAmount || 0,
      performanceBondValue: data.performanceBondValue || 0,
      currency: data.currency || 'USD',
      status: ContractStatus.DRAFT,
      description: data.description || null,
      terms: data.terms || null,
      createdBy: userId,
    });

    const savedContract = await this.contractRepository.save(contract);

    // Log activity
    await this.activityLogRepository.save({
      projectId: savedContract.projectId,
      userId,
      actionType: ActivityActionType.CREATED,
      entityType: ActivityEntityType.PROJECT, // Using PROJECT as we don't have CONTRACT in enum yet
      entityId: savedContract.id,
      description: `created contract: ${savedContract.contractNumber}`,
      metadata: {
        contractNumber: savedContract.contractNumber,
        contractValue: savedContract.originalContractValue,
        clientName: savedContract.clientName,
      },
    });

    // Emit system event
    await enhancedEventBus.emit(
      createSystemEvent(
        SystemEventType.CONTRACT_CREATED,
        savedContract.projectId,
        userId,
        savedContract.id,
        'Contract',
        {
          contractId: savedContract.id,
          contractNumber: savedContract.contractNumber,
          action: 'contract_created',
        }
      )
    );

    return savedContract;
  }

  async getAllContracts(): Promise<Contract[]> {
    return await this.contractRepository.find({
      order: { createdAt: 'DESC' },
    });
  }

  async getContractById(id: string): Promise<Contract | null> {
    return await this.contractRepository.findOne({
      where: { id },
      });
  }

  async getContractByProjectId(projectId: string): Promise<Contract | null> {
    return await this.contractRepository.findOne({
      where: { projectId },
      order: { createdAt: 'DESC' },
    });
  }

  async getContractsByProjectId(projectId: string): Promise<Contract[]> {
    return await this.contractRepository.find({
      where: { projectId },
      order: { createdAt: 'DESC' },
    });
  }

  async updateContract(id: string, data: UpdateContractDTO, userId: string): Promise<Contract> {
    const contract = await this.getContractById(id);

    if (!contract) {
      throw new Error('Contract not found');
    }

    // Update fields
    if (data.contractType !== undefined) contract.contractType = data.contractType;
    if (data.clientName !== undefined) contract.clientName = data.clientName;
    if (data.retentionPercentage !== undefined) contract.retentionPercentage = data.retentionPercentage;
    if (data.advancePaymentAmount !== undefined) contract.advancePaymentAmount = data.advancePaymentAmount;
    if (data.performanceBondValue !== undefined) contract.performanceBondValue = data.performanceBondValue;
    if (data.status !== undefined) contract.status = data.status;
    if (data.description !== undefined) contract.description = data.description;
    if (data.terms !== undefined) contract.terms = data.terms;

    const updatedContract = await this.contractRepository.save(contract);

    // Log activity
    await this.activityLogRepository.save({
      projectId: updatedContract.projectId,
      userId,
      actionType: ActivityActionType.UPDATED,
      entityType: ActivityEntityType.PROJECT,
      entityId: updatedContract.id,
      description: `updated contract: ${updatedContract.contractNumber}`,
      metadata: {
        changes: data,
      },
    });

    // Emit system event
    await enhancedEventBus.emit(
      createSystemEvent(
        SystemEventType.CONTRACT_UPDATED,
        updatedContract.projectId,
        userId,
        updatedContract.id,
        'Contract',
        {
          contractId: updatedContract.id,
          action: 'contract_updated',
          changes: data,
        }
      )
    );

    return updatedContract;
  }

  async updateContractValue(
    contractId: string,
    variationAmount: number,
    userId: string
  ): Promise<Contract> {
    const contract = await this.getContractById(contractId);

    if (!contract) {
      throw new Error('Contract not found');
    }

    // Update revised contract value
    contract.revisedContractValue = contract.originalContractValue + contract.totalApprovedVariations + variationAmount;
    contract.totalApprovedVariations += variationAmount;

    const updatedContract = await this.contractRepository.save(contract);

    // Log activity
    await this.activityLogRepository.save({
      projectId: updatedContract.projectId,
      userId,
      actionType: ActivityActionType.UPDATED,
      entityType: ActivityEntityType.PROJECT,
      entityId: updatedContract.id,
      description: `contract value updated: ${updatedContract.contractNumber}`,
      metadata: {
        variationAmount,
        newRevisedValue: updatedContract.revisedContractValue,
        totalApprovedVariations: updatedContract.totalApprovedVariations,
      },
    });

    // Emit system event
    await enhancedEventBus.emit(
      createSystemEvent(
        SystemEventType.CONTRACT_VALUE_CHANGED,
        updatedContract.projectId,
        userId,
        updatedContract.id,
        'Contract',
        {
          contractId: updatedContract.id,
          action: 'contract_value_updated',
          variationAmount,
          revisedContractValue: updatedContract.revisedContractValue,
        }
      )
    );

    return updatedContract;
  }

  async updatePendingVariations(
    contractId: string,
    pendingAmount: number
  ): Promise<Contract> {
    const contract = await this.getContractById(contractId);

    if (!contract) {
      throw new Error('Contract not found');
    }

    contract.totalPendingVariations = pendingAmount;
    return await this.contractRepository.save(contract);
  }

  async deleteContract(id: string, userId: string): Promise<boolean> {
    const contract = await this.getContractById(id);

    if (!contract) {
      throw new Error('Contract not found');
    }

    // Log activity before deletion
    await this.activityLogRepository.save({
      projectId: contract.projectId,
      userId,
      actionType: ActivityActionType.DELETED,
      entityType: ActivityEntityType.PROJECT,
      entityId: id,
      description: `deleted contract: ${contract.contractNumber}`,
      metadata: {
        contractNumber: contract.contractNumber,
        originalContractValue: contract.originalContractValue,
      },
    });

    const projectId = contract.projectId;
    await this.contractRepository.remove(contract);

    // Emit system event
    await enhancedEventBus.emit(
      createSystemEvent(
        SystemEventType.PROJECT_UPDATED, // Use Project Updated for deletion to trigger dashboard refresh
        projectId,
        userId,
        id,
        'Contract',
        {
          contractId: id,
          action: 'contract_deleted',
        }
      )
    );

    return true;
  }

  async getContractMetrics(contractId: string) {
    const contract = await this.getContractById(contractId);

    if (!contract) {
      throw new Error('Contract not found');
    }

    return {
      originalContractValue: contract.originalContractValue,
      revisedContractValue: contract.revisedContractValue,
      totalApprovedVariations: contract.totalApprovedVariations,
      totalPendingVariations: contract.totalPendingVariations,
      variationPercentage: (contract.totalApprovedVariations / contract.originalContractValue) * 100,
      potentialValue: contract.revisedContractValue + contract.totalPendingVariations,
      retentionPercentage: contract.retentionPercentage,
      advancePaymentAmount: contract.advancePaymentAmount,
      performanceBondValue: contract.performanceBondValue,
      currency: contract.currency,
    };
  }
}

export const createContractService = (): ContractService => {
  return new ContractService();
};
