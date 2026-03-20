import { ResourceRate } from '../entities/ResourceRate';
import { CostCategory } from '../entities/CostEntry';
import {
  ResourceRateRepository,
  ResourceRateFilters,
  ResourceRateListResult,
  createResourceRateRepository,
} from '../repositories/ResourceRateRepository';

export interface CreateResourceRateDTO {
  userId: string;
  role: string;
  hourlyRate: number;
  overtimeRate?: number;
  overtimeMultiplier?: number;
  costCategory?: CostCategory;
  costCodeId?: string;
  effectiveFrom: Date;
  effectiveTo?: Date;
  isActive?: boolean;
}

export interface UpdateResourceRateDTO {
  role?: string;
  hourlyRate?: number;
  overtimeRate?: number;
  overtimeMultiplier?: number;
  costCategory?: CostCategory;
  costCodeId?: string;
  effectiveFrom?: Date;
  effectiveTo?: Date;
  isActive?: boolean;
}

export class ResourceRateService {
  private resourceRateRepository: ResourceRateRepository;

  constructor(resourceRateRepository?: ResourceRateRepository) {
    this.resourceRateRepository = resourceRateRepository || createResourceRateRepository();
  }

  async createResourceRate(data: CreateResourceRateDTO): Promise<ResourceRate> {
    const rateData: Partial<ResourceRate> = {
      userId: data.userId,
      role: data.role.trim(),
      hourlyRate: data.hourlyRate,
      overtimeRate: data.overtimeRate,
      overtimeMultiplier: data.overtimeMultiplier,
      costCategory: data.costCategory || CostCategory.LABOR,
      costCodeId: data.costCodeId,
      effectiveFrom: data.effectiveFrom,
      effectiveTo: data.effectiveTo,
      isActive: data.isActive !== undefined ? data.isActive : true,
    };

    return await this.resourceRateRepository.create(rateData);
  }

  async getResourceRateById(id: string): Promise<ResourceRate | null> {
    if (!id) {
      throw new Error('Resource rate ID is required');
    }

    return await this.resourceRateRepository.findById(id);
  }

  async listResourceRates(filters: ResourceRateFilters): Promise<ResourceRateListResult> {
    if (filters.page && filters.page < 1) {
      throw new Error('Page must be greater than 0');
    }

    if (filters.perPage && (filters.perPage < 1 || filters.perPage > 100)) {
      throw new Error('Per page must be between 1 and 100');
    }

    return await this.resourceRateRepository.findAll(filters);
  }

  /**
   * Get current active rate for a user
   */
  async getCurrentRate(userId: string, date?: Date): Promise<ResourceRate | null> {
    if (!userId) {
      throw new Error('User ID is required');
    }

    return await this.resourceRateRepository.getCurrentRate(userId, date);
  }

  /**
   * Get rate history for a user
   */
  async getRateHistory(userId: string): Promise<ResourceRate[]> {
    if (!userId) {
      throw new Error('User ID is required');
    }

    return await this.resourceRateRepository.getRateHistory(userId);
  }

  /**
   * Calculate labor cost for time entry
   */
  async calculateLaborCost(
    userId: string,
    hours: number,
    date: Date,
    isOvertime: boolean = false
  ): Promise<{ rate: number; cost: number; rateId: string } | null> {
    if (!userId) {
      throw new Error('User ID is required');
    }

    if (hours <= 0) {
      throw new Error('Hours must be greater than 0');
    }

    const rate = await this.getCurrentRate(userId, date);
    if (!rate) {
      return null;
    }

    let hourlyRate = rate.hourlyRate;

    if (isOvertime) {
      if (rate.overtimeRate) {
        hourlyRate = rate.overtimeRate;
      } else if (rate.overtimeMultiplier) {
        hourlyRate = rate.hourlyRate * rate.overtimeMultiplier;
      }
    }

    const cost = hours * hourlyRate;

    return {
      rate: hourlyRate,
      cost,
      rateId: rate.id,
    };
  }

  async updateResourceRate(id: string, data: UpdateResourceRateDTO): Promise<ResourceRate> {
    if (!id) {
      throw new Error('Resource rate ID is required');
    }

    const existingRate = await this.resourceRateRepository.findById(id);
    if (!existingRate) {
      throw new Error('Resource rate not found');
    }

    const updateData: Partial<ResourceRate> = {};

    if (data.role !== undefined) updateData.role = data.role.trim();
    if (data.hourlyRate !== undefined) updateData.hourlyRate = data.hourlyRate;
    if (data.overtimeRate !== undefined) updateData.overtimeRate = data.overtimeRate;
    if (data.overtimeMultiplier !== undefined) updateData.overtimeMultiplier = data.overtimeMultiplier;
    if (data.costCategory !== undefined) updateData.costCategory = data.costCategory;
    if (data.costCodeId !== undefined) updateData.costCodeId = data.costCodeId;
    if (data.effectiveFrom !== undefined) updateData.effectiveFrom = data.effectiveFrom;
    if (data.effectiveTo !== undefined) updateData.effectiveTo = data.effectiveTo;
    if (data.isActive !== undefined) updateData.isActive = data.isActive;

    const updatedRate = await this.resourceRateRepository.update(id, updateData);

    if (!updatedRate) {
      throw new Error('Failed to update resource rate');
    }

    return updatedRate;
  }

  async deleteResourceRate(id: string): Promise<boolean> {
    if (!id) {
      throw new Error('Resource rate ID is required');
    }

    const exists = await this.resourceRateRepository.exists(id);
    if (!exists) {
      throw new Error('Resource rate not found');
    }

    return await this.resourceRateRepository.delete(id);
  }

  async deactivateResourceRate(id: string): Promise<ResourceRate | null> {
    if (!id) {
      throw new Error('Resource rate ID is required');
    }

    return await this.resourceRateRepository.deactivate(id);
  }

  async activateResourceRate(id: string): Promise<ResourceRate | null> {
    if (!id) {
      throw new Error('Resource rate ID is required');
    }

    return await this.resourceRateRepository.activate(id);
  }
}

export const createResourceRateService = (): ResourceRateService => {
  return new ResourceRateService();
};
