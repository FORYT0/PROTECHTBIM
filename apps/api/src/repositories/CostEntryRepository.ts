import { Repository } from 'typeorm';
import { AppDataSource } from '../config/data-source';
import { CostEntry, CostCategory, PaymentStatus, EntrySource } from '../entities/CostEntry';

export interface CostEntryFilters {
  projectId?: string;
  workPackageId?: string;
  costCodeId?: string;
  costCategory?: CostCategory;
  vendorId?: string;
  paymentStatus?: PaymentStatus;
  entrySource?: EntrySource;
  isBillable?: boolean;
  isCommitted?: boolean;
  dateFrom?: Date;
  dateTo?: Date;
  search?: string;
  page?: number;
  perPage?: number;
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC';
}

export interface CostEntryListResult {
  costEntries: CostEntry[];
  total: number;
  page: number;
  perPage: number;
}

export interface CostSummary {
  totalCost: number;
  billableCost: number;
  nonBillableCost: number;
  committedCost: number;
  byCostCategory: Record<CostCategory, number>;
  byPaymentStatus: Record<PaymentStatus, number>;
}

export class CostEntryRepository {
  private repository: Repository<CostEntry>;

  constructor() {
    this.repository = AppDataSource.getRepository(CostEntry);
  }

  /**
   * Generate next entry number (CE-2026-0001, CE-2026-0002, etc.)
   */
  private async generateEntryNumber(): Promise<string> {
    const currentYear = new Date().getFullYear();
    const prefix = `CE-${currentYear}-`;

    const lastEntry = await this.repository
      .createQueryBuilder('cost_entry')
      .where('cost_entry.entryNumber LIKE :prefix', { prefix: `${prefix}%` })
      .orderBy('cost_entry.entryNumber', 'DESC')
      .getOne();

    if (!lastEntry || !lastEntry.entryNumber) {
      return `${prefix}0001`;
    }

    // Extract number from last entry (e.g., "CE-2026-0001" -> 1)
    const match = lastEntry.entryNumber.match(/CE-\d{4}-(\d+)/);
    if (!match) {
      return `${prefix}0001`;
    }

    const lastNumber = parseInt(match[1], 10);
    const nextNumber = lastNumber + 1;
    return `${prefix}${nextNumber.toString().padStart(4, '0')}`;
  }

  async create(costEntryData: Partial<CostEntry>): Promise<CostEntry> {
    // Validate required fields
    if (!costEntryData.projectId) {
      throw new Error('Project ID is required');
    }

    if (!costEntryData.costCodeId) {
      throw new Error('Cost code ID is required');
    }

    if (!costEntryData.costCategory) {
      throw new Error('Cost category is required');
    }

    if (!costEntryData.description || costEntryData.description.trim().length === 0) {
      throw new Error('Description is required');
    }

    if (!costEntryData.totalCost || costEntryData.totalCost <= 0) {
      throw new Error('Total cost must be greater than 0');
    }

    if (!costEntryData.entryDate) {
      throw new Error('Entry date is required');
    }

    if (!costEntryData.createdBy) {
      throw new Error('Created by user ID is required');
    }

    // Auto-calculate total cost if quantity and unit cost provided
    if (costEntryData.quantity && costEntryData.unitCost) {
      costEntryData.totalCost = costEntryData.quantity * costEntryData.unitCost;
    }

    // Generate entry number if not provided
    if (!costEntryData.entryNumber) {
      costEntryData.entryNumber = await this.generateEntryNumber();
    }

    // Set defaults
    if (costEntryData.isBillable === undefined) {
      costEntryData.isBillable = true;
    }

    if (costEntryData.isCommitted === undefined) {
      costEntryData.isCommitted = false;
    }

    if (!costEntryData.paymentStatus) {
      costEntryData.paymentStatus = PaymentStatus.UNPAID;
    }

    if (!costEntryData.entrySource) {
      costEntryData.entrySource = EntrySource.MANUAL;
    }

    const costEntry = this.repository.create(costEntryData);
    return await this.repository.save(costEntry);
  }

  async findById(id: string): Promise<CostEntry | null> {
    return await this.repository.findOne({
      where: { id },
      relations: [
        'project',
        'workPackage',
        'costCode',
        'vendor',
        'creator',
        'approver',
      ],
    });
  }

  async findByEntryNumber(entryNumber: string): Promise<CostEntry | null> {
    return await this.repository.findOne({
      where: { entryNumber },
      relations: [
        'project',
        'workPackage',
        'costCode',
        'vendor',
        'creator',
        'approver',
      ],
    });
  }

  async findAll(filters: CostEntryFilters = {}): Promise<CostEntryListResult> {
    const {
      projectId,
      workPackageId,
      costCodeId,
      costCategory,
      vendorId,
      paymentStatus,
      entrySource,
      isBillable,
      isCommitted,
      dateFrom,
      dateTo,
      search,
      page = 1,
      perPage = 20,
      sortBy = 'entryDate',
      sortOrder = 'DESC',
    } = filters;

    const queryBuilder = this.repository
      .createQueryBuilder('cost_entry')
      .leftJoinAndSelect('cost_entry.project', 'project')
      .leftJoinAndSelect('cost_entry.workPackage', 'workPackage')
      .leftJoinAndSelect('cost_entry.costCode', 'costCode')
      .leftJoinAndSelect('cost_entry.vendor', 'vendor')
      .leftJoinAndSelect('cost_entry.creator', 'creator')
      .leftJoinAndSelect('cost_entry.approver', 'approver');

    // Apply filters
    if (projectId) {
      queryBuilder.andWhere('cost_entry.projectId = :projectId', { projectId });
    }

    if (workPackageId) {
      queryBuilder.andWhere('cost_entry.workPackageId = :workPackageId', { workPackageId });
    }

    if (costCodeId) {
      queryBuilder.andWhere('cost_entry.costCodeId = :costCodeId', { costCodeId });
    }

    if (costCategory) {
      queryBuilder.andWhere('cost_entry.costCategory = :costCategory', { costCategory });
    }

    if (vendorId) {
      queryBuilder.andWhere('cost_entry.vendorId = :vendorId', { vendorId });
    }

    if (paymentStatus) {
      queryBuilder.andWhere('cost_entry.paymentStatus = :paymentStatus', { paymentStatus });
    }

    if (entrySource) {
      queryBuilder.andWhere('cost_entry.entrySource = :entrySource', { entrySource });
    }

    if (isBillable !== undefined) {
      queryBuilder.andWhere('cost_entry.isBillable = :isBillable', { isBillable });
    }

    if (isCommitted !== undefined) {
      queryBuilder.andWhere('cost_entry.isCommitted = :isCommitted', { isCommitted });
    }

    if (dateFrom) {
      queryBuilder.andWhere('cost_entry.entryDate >= :dateFrom', { dateFrom });
    }

    if (dateTo) {
      queryBuilder.andWhere('cost_entry.entryDate <= :dateTo', { dateTo });
    }

    if (search) {
      queryBuilder.andWhere(
        '(cost_entry.entryNumber ILIKE :search OR cost_entry.description ILIKE :search OR cost_entry.invoiceNumber ILIKE :search)',
        { search: `%${search}%` }
      );
    }

    // Apply sorting
    const sortField = `cost_entry.${sortBy}`;
    queryBuilder.orderBy(sortField, sortOrder);

    // Apply pagination
    const skip = (page - 1) * perPage;
    queryBuilder.skip(skip).take(perPage);

    const [costEntries, total] = await queryBuilder.getManyAndCount();

    return {
      costEntries,
      total,
      page,
      perPage,
    };
  }

  /**
   * Get cost summary for a project
   */
  async getCostSummary(projectId: string, filters?: {
    dateFrom?: Date;
    dateTo?: Date;
  }): Promise<CostSummary> {
    const queryBuilder = this.repository
      .createQueryBuilder('cost_entry')
      .where('cost_entry.projectId = :projectId', { projectId });

    if (filters?.dateFrom) {
      queryBuilder.andWhere('cost_entry.entryDate >= :dateFrom', { dateFrom: filters.dateFrom });
    }

    if (filters?.dateTo) {
      queryBuilder.andWhere('cost_entry.entryDate <= :dateTo', { dateTo: filters.dateTo });
    }

    // Total cost
    const totalResult = await queryBuilder
      .select('SUM(cost_entry.totalCost)', 'total')
      .getRawOne();
    const totalCost = parseFloat(totalResult?.total || '0');

    // Billable cost
    const billableResult = await queryBuilder
      .clone()
      .andWhere('cost_entry.isBillable = :isBillable', { isBillable: true })
      .select('SUM(cost_entry.totalCost)', 'total')
      .getRawOne();
    const billableCost = parseFloat(billableResult?.total || '0');

    // Non-billable cost
    const nonBillableCost = totalCost - billableCost;

    // Committed cost
    const committedResult = await queryBuilder
      .clone()
      .andWhere('cost_entry.isCommitted = :isCommitted', { isCommitted: true })
      .select('SUM(cost_entry.totalCost)', 'total')
      .getRawOne();
    const committedCost = parseFloat(committedResult?.total || '0');

    // By cost category
    const byCostCategory: Record<CostCategory, number> = {
      [CostCategory.LABOR]: 0,
      [CostCategory.MATERIAL]: 0,
      [CostCategory.EQUIPMENT]: 0,
      [CostCategory.SUBCONTRACTOR]: 0,
      [CostCategory.OVERHEAD]: 0,
      [CostCategory.OTHER]: 0,
    };

    for (const category of Object.values(CostCategory)) {
      const result = await queryBuilder
        .clone()
        .andWhere('cost_entry.costCategory = :category', { category })
        .select('SUM(cost_entry.totalCost)', 'total')
        .getRawOne();
      byCostCategory[category] = parseFloat(result?.total || '0');
    }

    // By payment status
    const byPaymentStatus: Record<PaymentStatus, number> = {
      [PaymentStatus.UNPAID]: 0,
      [PaymentStatus.PARTIAL]: 0,
      [PaymentStatus.PAID]: 0,
      [PaymentStatus.OVERDUE]: 0,
    };

    for (const status of Object.values(PaymentStatus)) {
      const result = await queryBuilder
        .clone()
        .andWhere('cost_entry.paymentStatus = :status', { status })
        .select('SUM(cost_entry.totalCost)', 'total')
        .getRawOne();
      byPaymentStatus[status] = parseFloat(result?.total || '0');
    }

    return {
      totalCost,
      billableCost,
      nonBillableCost,
      committedCost,
      byCostCategory,
      byPaymentStatus,
    };
  }

  /**
   * Get total cost by cost code for a project
   */
  async getCostByCostCode(projectId: string): Promise<Array<{ costCodeId: string; costCode: string; totalCost: number }>> {
    const result = await this.repository
      .createQueryBuilder('cost_entry')
      .leftJoin('cost_entry.costCode', 'costCode')
      .select('cost_entry.costCodeId', 'costCodeId')
      .addSelect('costCode.code', 'costCode')
      .addSelect('SUM(cost_entry.totalCost)', 'totalCost')
      .where('cost_entry.projectId = :projectId', { projectId })
      .groupBy('cost_entry.costCodeId')
      .addGroupBy('costCode.code')
      .orderBy('costCode.code', 'ASC')
      .getRawMany();

    return result.map((row) => ({
      costCodeId: row.costCodeId,
      costCode: row.costCode,
      totalCost: parseFloat(row.totalCost || '0'),
    }));
  }

  async update(id: string, costEntryData: Partial<CostEntry>): Promise<CostEntry | null> {
    // Validate total cost if being updated
    if (costEntryData.totalCost !== undefined && costEntryData.totalCost <= 0) {
      throw new Error('Total cost must be greater than 0');
    }

    // Auto-calculate total cost if quantity and unit cost provided
    if (costEntryData.quantity && costEntryData.unitCost) {
      costEntryData.totalCost = costEntryData.quantity * costEntryData.unitCost;
    }

    await this.repository.update(id, costEntryData);
    return await this.findById(id);
  }

  /**
   * Approve a cost entry
   */
  async approve(id: string, approvedBy: string): Promise<CostEntry | null> {
    await this.repository.update(id, {
      approvedBy,
      approvedAt: new Date(),
    });
    return await this.findById(id);
  }

  /**
   * Update payment status
   */
  async updatePaymentStatus(id: string, paymentStatus: PaymentStatus): Promise<CostEntry | null> {
    await this.repository.update(id, { paymentStatus });
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

  async existsByEntryNumber(entryNumber: string): Promise<boolean> {
    const count = await this.repository.count({ where: { entryNumber } });
    return count > 0;
  }
}

export const createCostEntryRepository = (): CostEntryRepository => {
  return new CostEntryRepository();
};
