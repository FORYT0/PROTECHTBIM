import { Repository } from 'typeorm';
import { AppDataSource } from '../config/data-source';
import { CostCode } from '../entities/CostCode';

export interface CostCodeFilters {
  parentCodeId?: string | null;
  level?: number;
  isActive?: boolean;
  search?: string;
  page?: number;
  perPage?: number;
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC';
}

export interface CostCodeListResult {
  costCodes: CostCode[];
  total: number;
  page: number;
  perPage: number;
}

export class CostCodeRepository {
  private repository: Repository<CostCode>;

  constructor() {
    this.repository = AppDataSource.getRepository(CostCode);
  }

  async create(costCodeData: Partial<CostCode>): Promise<CostCode> {
    // Validate code format
    if (costCodeData.code && !/^(\d{2}|\d{2}\.\d{2}|\d{2}\.\d{2}\.\d{3})$/.test(costCodeData.code)) {
      throw new Error('Invalid cost code format. Expected: 01, 01.01, or 01.01.001');
    }

    // Check for duplicate code
    if (costCodeData.code) {
      const existing = await this.repository.findOne({
        where: { code: costCodeData.code },
      });
      if (existing) {
        throw new Error(`Cost code ${costCodeData.code} already exists`);
      }
    }

    const costCode = this.repository.create(costCodeData);
    return await this.repository.save(costCode);
  }

  async findById(id: string): Promise<CostCode | null> {
    return await this.repository.findOne({
      where: { id },
      relations: ['parentCode'],
    });
  }

  async findByCode(code: string): Promise<CostCode | null> {
    return await this.repository.findOne({
      where: { code },
      relations: ['parentCode'],
    });
  }

  async findAll(filters: CostCodeFilters = {}): Promise<CostCodeListResult> {
    const {
      parentCodeId,
      level,
      isActive,
      search,
      page = 1,
      perPage = 50,
      sortBy = 'code',
      sortOrder = 'ASC',
    } = filters;

    const queryBuilder = this.repository
      .createQueryBuilder('cost_code')
      .leftJoinAndSelect('cost_code.parentCode', 'parentCode');

    // Apply filters
    if (parentCodeId !== undefined) {
      if (parentCodeId === null) {
        queryBuilder.andWhere('cost_code.parentCodeId IS NULL');
      } else {
        queryBuilder.andWhere('cost_code.parentCodeId = :parentCodeId', { parentCodeId });
      }
    }

    if (level !== undefined) {
      queryBuilder.andWhere('cost_code.level = :level', { level });
    }

    if (isActive !== undefined) {
      queryBuilder.andWhere('cost_code.isActive = :isActive', { isActive });
    }

    if (search) {
      queryBuilder.andWhere(
        '(cost_code.code ILIKE :search OR cost_code.name ILIKE :search OR cost_code.description ILIKE :search)',
        { search: `%${search}%` }
      );
    }

    // Apply sorting
    const sortField = `cost_code.${sortBy}`;
    queryBuilder.orderBy(sortField, sortOrder);

    // Apply pagination
    const skip = (page - 1) * perPage;
    queryBuilder.skip(skip).take(perPage);

    const [costCodes, total] = await queryBuilder.getManyAndCount();

    return {
      costCodes,
      total,
      page,
      perPage,
    };
  }

  /**
   * Get hierarchical cost code structure
   */
  async getHierarchy(): Promise<CostCode[]> {
    // Get all level 1 codes
    const level1Codes = await this.repository.find({
      where: { level: 1, isActive: true },
      order: { code: 'ASC' },
    });

    // For each level 1, get level 2 children
    const hierarchy: CostCode[] = [];
    for (const level1 of level1Codes) {
      const level2Codes = await this.repository.find({
        where: { parentCodeId: level1.id, isActive: true },
        order: { code: 'ASC' },
      });

      hierarchy.push({
        ...level1,
        children: level2Codes,
      } as any);
    }

    return hierarchy;
  }

  /**
   * Get all child codes for a parent code
   */
  async getChildren(parentCodeId: string): Promise<CostCode[]> {
    return await this.repository.find({
      where: { parentCodeId },
      order: { code: 'ASC' },
    });
  }

  async update(id: string, costCodeData: Partial<CostCode>): Promise<CostCode | null> {
    // Validate code format if being updated
    if (costCodeData.code && !/^(\d{2}|\d{2}\.\d{2}|\d{2}\.\d{2}\.\d{3})$/.test(costCodeData.code)) {
      throw new Error('Invalid cost code format. Expected: 01, 01.01, or 01.01.001');
    }

    // Check for duplicate code if being updated
    if (costCodeData.code) {
      const existing = await this.repository.findOne({
        where: { code: costCodeData.code },
      });
      if (existing && existing.id !== id) {
        throw new Error(`Cost code ${costCodeData.code} already exists`);
      }
    }

    await this.repository.update(id, costCodeData);
    return await this.findById(id);
  }

  async delete(id: string): Promise<boolean> {
    // Check if cost code has children
    const children = await this.getChildren(id);
    if (children.length > 0) {
      throw new Error('Cannot delete cost code with child codes');
    }

    const result = await this.repository.delete(id);
    return (result.affected ?? 0) > 0;
  }

  async exists(id: string): Promise<boolean> {
    const count = await this.repository.count({ where: { id } });
    return count > 0;
  }

  async existsByCode(code: string): Promise<boolean> {
    const count = await this.repository.count({ where: { code } });
    return count > 0;
  }
}

export const createCostCodeRepository = (): CostCodeRepository => {
  return new CostCodeRepository();
};
