import { Repository } from 'typeorm';
import { AppDataSource } from '../config/data-source';
import { ResourceRate } from '../entities/ResourceRate';
import { CostCategory } from '../entities/CostEntry';

export interface ResourceRateFilters {
  userId?: string;
  role?: string;
  costCategory?: CostCategory;
  isActive?: boolean;
  effectiveDate?: Date;
  page?: number;
  perPage?: number;
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC';
}

export interface ResourceRateListResult {
  resourceRates: ResourceRate[];
  total: number;
  page: number;
  perPage: number;
}

export class ResourceRateRepository {
  private repository: Repository<ResourceRate>;

  constructor() {
    this.repository = AppDataSource.getRepository(ResourceRate);
  }

  async create(rateData: Partial<ResourceRate>): Promise<ResourceRate> {
    // Validate required fields
    if (!rateData.userId) {
      throw new Error('User ID is required');
    }

    if (!rateData.role || rateData.role.trim().length === 0) {
      throw new Error('Role is required');
    }

    if (!rateData.hourlyRate || rateData.hourlyRate <= 0) {
      throw new Error('Hourly rate must be greater than 0');
    }

    if (!rateData.effectiveFrom) {
      throw new Error('Effective from date is required');
    }

    // Validate overtime rate if provided
    if (rateData.overtimeRate !== undefined && rateData.overtimeRate !== null) {
      if (rateData.overtimeRate <= 0) {
        throw new Error('Overtime rate must be greater than 0');
      }
    }

    // Validate overtime multiplier if provided
    if (rateData.overtimeMultiplier !== undefined && rateData.overtimeMultiplier !== null) {
      if (rateData.overtimeMultiplier <= 0) {
        throw new Error('Overtime multiplier must be greater than 0');
      }
    }

    // Validate date range
    if (rateData.effectiveTo) {
      const from = new Date(rateData.effectiveFrom);
      const to = new Date(rateData.effectiveTo);
      if (from >= to) {
        throw new Error('Effective from date must be before effective to date');
      }
    }

    // Check for overlapping rates for the same user
    const overlapping = await this.findOverlappingRates(
      rateData.userId,
      rateData.effectiveFrom,
      rateData.effectiveTo || null
    );

    if (overlapping.length > 0) {
      throw new Error('Rate period overlaps with existing rate for this user');
    }

    const rate = this.repository.create(rateData);
    return await this.repository.save(rate);
  }

  async findById(id: string): Promise<ResourceRate | null> {
    return await this.repository.findOne({
      where: { id },
      relations: ['user', 'costCode'],
    });
  }

  async findAll(filters: ResourceRateFilters = {}): Promise<ResourceRateListResult> {
    const {
      userId,
      role,
      costCategory,
      isActive,
      effectiveDate,
      page = 1,
      perPage = 20,
      sortBy = 'effectiveFrom',
      sortOrder = 'DESC',
    } = filters;

    const queryBuilder = this.repository
      .createQueryBuilder('resource_rate')
      .leftJoinAndSelect('resource_rate.user', 'user')
      .leftJoinAndSelect('resource_rate.costCode', 'costCode');

    // Apply filters
    if (userId) {
      queryBuilder.andWhere('resource_rate.userId = :userId', { userId });
    }

    if (role) {
      queryBuilder.andWhere('resource_rate.role ILIKE :role', { role: `%${role}%` });
    }

    if (costCategory) {
      queryBuilder.andWhere('resource_rate.costCategory = :costCategory', { costCategory });
    }

    if (isActive !== undefined) {
      queryBuilder.andWhere('resource_rate.isActive = :isActive', { isActive });
    }

    if (effectiveDate) {
      queryBuilder.andWhere('resource_rate.effectiveFrom <= :effectiveDate', { effectiveDate });
      queryBuilder.andWhere(
        '(resource_rate.effectiveTo IS NULL OR resource_rate.effectiveTo >= :effectiveDate)',
        { effectiveDate }
      );
    }

    // Apply sorting
    const sortField = `resource_rate.${sortBy}`;
    queryBuilder.orderBy(sortField, sortOrder);

    // Apply pagination
    const skip = (page - 1) * perPage;
    queryBuilder.skip(skip).take(perPage);

    const [resourceRates, total] = await queryBuilder.getManyAndCount();

    return {
      resourceRates,
      total,
      page,
      perPage,
    };
  }

  /**
   * Get current active rate for a user
   */
  async getCurrentRate(userId: string, date: Date = new Date()): Promise<ResourceRate | null> {
    return await this.repository
      .createQueryBuilder('resource_rate')
      .leftJoinAndSelect('resource_rate.user', 'user')
      .leftJoinAndSelect('resource_rate.costCode', 'costCode')
      .where('resource_rate.userId = :userId', { userId })
      .andWhere('resource_rate.isActive = :isActive', { isActive: true })
      .andWhere('resource_rate.effectiveFrom <= :date', { date })
      .andWhere('(resource_rate.effectiveTo IS NULL OR resource_rate.effectiveTo >= :date)', {
        date,
      })
      .orderBy('resource_rate.effectiveFrom', 'DESC')
      .getOne();
  }

  /**
   * Get rate history for a user
   */
  async getRateHistory(userId: string): Promise<ResourceRate[]> {
    return await this.repository.find({
      where: { userId },
      relations: ['user', 'costCode'],
      order: { effectiveFrom: 'DESC' },
    });
  }

  /**
   * Find overlapping rates for a user
   */
  async findOverlappingRates(
    userId: string,
    effectiveFrom: Date,
    effectiveTo: Date | null,
    excludeId?: string
  ): Promise<ResourceRate[]> {
    const queryBuilder = this.repository
      .createQueryBuilder('resource_rate')
      .where('resource_rate.userId = :userId', { userId })
      .andWhere('resource_rate.isActive = :isActive', { isActive: true });

    if (excludeId) {
      queryBuilder.andWhere('resource_rate.id != :excludeId', { excludeId });
    }

    // Check for overlap
    if (effectiveTo) {
      queryBuilder.andWhere(
        '((resource_rate.effectiveFrom <= :effectiveTo AND (resource_rate.effectiveTo IS NULL OR resource_rate.effectiveTo >= :effectiveFrom)))',
        { effectiveFrom, effectiveTo }
      );
    } else {
      queryBuilder.andWhere(
        '((resource_rate.effectiveTo IS NULL OR resource_rate.effectiveTo >= :effectiveFrom))',
        { effectiveFrom }
      );
    }

    return await queryBuilder.getMany();
  }

  async update(id: string, rateData: Partial<ResourceRate>): Promise<ResourceRate | null> {
    // Validate hourly rate if being updated
    if (rateData.hourlyRate !== undefined && rateData.hourlyRate <= 0) {
      throw new Error('Hourly rate must be greater than 0');
    }

    // Validate overtime rate if being updated
    if (rateData.overtimeRate !== undefined && rateData.overtimeRate !== null) {
      if (rateData.overtimeRate <= 0) {
        throw new Error('Overtime rate must be greater than 0');
      }
    }

    // Validate overtime multiplier if being updated
    if (rateData.overtimeMultiplier !== undefined && rateData.overtimeMultiplier !== null) {
      if (rateData.overtimeMultiplier <= 0) {
        throw new Error('Overtime multiplier must be greater than 0');
      }
    }

    // Validate date range if being updated
    if (rateData.effectiveFrom || rateData.effectiveTo) {
      const existing = await this.findById(id);
      if (!existing) {
        throw new Error('Resource rate not found');
      }

      const from = rateData.effectiveFrom
        ? new Date(rateData.effectiveFrom)
        : existing.effectiveFrom;
      const to = rateData.effectiveTo ? new Date(rateData.effectiveTo) : existing.effectiveTo;

      if (to && from >= to) {
        throw new Error('Effective from date must be before effective to date');
      }

      // Check for overlapping rates
      const overlapping = await this.findOverlappingRates(
        existing.userId,
        from,
        to,
        id
      );

      if (overlapping.length > 0) {
        throw new Error('Rate period overlaps with existing rate for this user');
      }
    }

    await this.repository.update(id, rateData);
    return await this.findById(id);
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.repository.delete(id);
    return (result.affected ?? 0) > 0;
  }

  async exists(id: string): Promise<boolean> {
    const count = await this.repository.count({ where: { id } });
    return count > 0;
  }

  /**
   * Deactivate a rate (soft delete)
   */
  async deactivate(id: string): Promise<ResourceRate | null> {
    await this.repository.update(id, { isActive: false });
    return await this.findById(id);
  }

  /**
   * Activate a rate
   */
  async activate(id: string): Promise<ResourceRate | null> {
    await this.repository.update(id, { isActive: true });
    return await this.findById(id);
  }
}

export const createResourceRateRepository = (): ResourceRateRepository => {
  return new ResourceRateRepository();
};
