import { CostCode } from '../entities/CostCode';
import {
  CostCodeRepository,
  CostCodeFilters,
  CostCodeListResult,
  createCostCodeRepository,
} from '../repositories/CostCodeRepository';

export interface CreateCostCodeDTO {
  code: string;
  name: string;
  description?: string;
  parentCodeId?: string;
  level: number;
  isActive?: boolean;
}

export interface UpdateCostCodeDTO {
  code?: string;
  name?: string;
  description?: string;
  parentCodeId?: string;
  level?: number;
  isActive?: boolean;
}

export class CostCodeService {
  private costCodeRepository: CostCodeRepository;

  constructor(costCodeRepository?: CostCodeRepository) {
    this.costCodeRepository = costCodeRepository || createCostCodeRepository();
  }

  async createCostCode(data: CreateCostCodeDTO): Promise<CostCode> {
    // Validate required fields
    if (!data.code || data.code.trim().length === 0) {
      throw new Error('Cost code is required');
    }

    if (!data.name || data.name.trim().length === 0) {
      throw new Error('Cost code name is required');
    }

    if (!data.level || data.level < 1 || data.level > 3) {
      throw new Error('Level must be between 1 and 3');
    }

    // Validate parent code if level > 1
    if (data.level > 1 && !data.parentCodeId) {
      throw new Error('Parent code is required for level 2 and 3 codes');
    }

    // Validate parent code exists if provided
    if (data.parentCodeId) {
      const parentExists = await this.costCodeRepository.exists(data.parentCodeId);
      if (!parentExists) {
        throw new Error('Parent cost code not found');
      }
    }

    const costCodeData: Partial<CostCode> = {
      code: data.code.trim(),
      name: data.name.trim(),
      description: data.description?.trim(),
      parentCodeId: data.parentCodeId,
      level: data.level,
      isActive: data.isActive !== undefined ? data.isActive : true,
    };

    return await this.costCodeRepository.create(costCodeData);
  }

  async getCostCodeById(id: string): Promise<CostCode | null> {
    if (!id) {
      throw new Error('Cost code ID is required');
    }

    return await this.costCodeRepository.findById(id);
  }

  async getCostCodeByCode(code: string): Promise<CostCode | null> {
    if (!code) {
      throw new Error('Cost code is required');
    }

    return await this.costCodeRepository.findByCode(code);
  }

  async listCostCodes(filters: CostCodeFilters): Promise<CostCodeListResult> {
    // Validate pagination parameters
    if (filters.page && filters.page < 1) {
      throw new Error('Page must be greater than 0');
    }

    if (filters.perPage && (filters.perPage < 1 || filters.perPage > 100)) {
      throw new Error('Per page must be between 1 and 100');
    }

    return await this.costCodeRepository.findAll(filters);
  }

  /**
   * Get hierarchical cost code structure
   */
  async getHierarchy(): Promise<CostCode[]> {
    return await this.costCodeRepository.getHierarchy();
  }

  /**
   * Get all child codes for a parent code
   */
  async getChildren(parentCodeId: string): Promise<CostCode[]> {
    if (!parentCodeId) {
      throw new Error('Parent code ID is required');
    }

    return await this.costCodeRepository.getChildren(parentCodeId);
  }

  async updateCostCode(id: string, data: UpdateCostCodeDTO): Promise<CostCode> {
    if (!id) {
      throw new Error('Cost code ID is required');
    }

    // Check if cost code exists
    const existingCostCode = await this.costCodeRepository.findById(id);
    if (!existingCostCode) {
      throw new Error('Cost code not found');
    }

    // Validate name if provided
    if (data.name !== undefined && data.name.trim().length === 0) {
      throw new Error('Cost code name cannot be empty');
    }

    // Validate level if provided
    if (data.level !== undefined && (data.level < 1 || data.level > 3)) {
      throw new Error('Level must be between 1 and 3');
    }

    // Validate parent code if provided
    if (data.parentCodeId !== undefined) {
      if (data.parentCodeId) {
        const parentExists = await this.costCodeRepository.exists(data.parentCodeId);
        if (!parentExists) {
          throw new Error('Parent cost code not found');
        }

        // Prevent circular reference
        if (data.parentCodeId === id) {
          throw new Error('Cost code cannot be its own parent');
        }
      }
    }

    const updateData: Partial<CostCode> = {};

    if (data.code !== undefined) {
      updateData.code = data.code.trim();
    }

    if (data.name !== undefined) {
      updateData.name = data.name.trim();
    }

    if (data.description !== undefined) {
      updateData.description = data.description?.trim();
    }

    if (data.parentCodeId !== undefined) {
      updateData.parentCodeId = data.parentCodeId;
    }

    if (data.level !== undefined) {
      updateData.level = data.level;
    }

    if (data.isActive !== undefined) {
      updateData.isActive = data.isActive;
    }

    const updatedCostCode = await this.costCodeRepository.update(id, updateData);

    if (!updatedCostCode) {
      throw new Error('Failed to update cost code');
    }

    return updatedCostCode;
  }

  async deleteCostCode(id: string): Promise<boolean> {
    if (!id) {
      throw new Error('Cost code ID is required');
    }

    // Check if cost code exists
    const exists = await this.costCodeRepository.exists(id);
    if (!exists) {
      throw new Error('Cost code not found');
    }

    return await this.costCodeRepository.delete(id);
  }

  /**
   * Deactivate a cost code (soft delete)
   */
  async deactivateCostCode(id: string): Promise<CostCode> {
    if (!id) {
      throw new Error('Cost code ID is required');
    }

    const costCode = await this.updateCostCode(id, { isActive: false });
    return costCode;
  }

  /**
   * Activate a cost code
   */
  async activateCostCode(id: string): Promise<CostCode> {
    if (!id) {
      throw new Error('Cost code ID is required');
    }

    const costCode = await this.updateCostCode(id, { isActive: true });
    return costCode;
  }
}

export const createCostCodeService = (): CostCodeService => {
  return new CostCodeService();
};
