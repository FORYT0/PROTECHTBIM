import { Repository } from 'typeorm';
import { AppDataSource } from '../config/data-source';
import { Vendor, VendorType } from '../entities/Vendor';

export interface VendorFilters {
  vendorType?: VendorType;
  isActive?: boolean;
  search?: string;
  page?: number;
  perPage?: number;
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC';
}

export interface VendorListResult {
  vendors: Vendor[];
  total: number;
  page: number;
  perPage: number;
}

export class VendorRepository {
  private repository: Repository<Vendor>;

  constructor() {
    this.repository = AppDataSource.getRepository(Vendor);
  }

  /**
   * Generate next vendor code (VEN-001, VEN-002, etc.)
   */
  private async generateVendorCode(): Promise<string> {
    const lastVendor = await this.repository.findOne({
      where: {},
      order: { vendorCode: 'DESC' },
    });

    if (!lastVendor || !lastVendor.vendorCode) {
      return 'VEN-001';
    }

    // Extract number from last code (e.g., "VEN-001" -> 1)
    const match = lastVendor.vendorCode.match(/VEN-(\d+)/);
    if (!match) {
      return 'VEN-001';
    }

    const lastNumber = parseInt(match[1], 10);
    const nextNumber = lastNumber + 1;
    return `VEN-${nextNumber.toString().padStart(3, '0')}`;
  }

  async create(vendorData: Partial<Vendor>): Promise<Vendor> {
    // Validate required fields
    if (!vendorData.vendorName || vendorData.vendorName.trim().length === 0) {
      throw new Error('Vendor name is required');
    }

    // Validate email format if provided
    if (vendorData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(vendorData.email)) {
      throw new Error('Invalid email format');
    }

    // Validate rating if provided
    if (vendorData.rating !== undefined && vendorData.rating !== null) {
      if (vendorData.rating < 1 || vendorData.rating > 5) {
        throw new Error('Rating must be between 1 and 5');
      }
    }

    // Generate vendor code if not provided
    if (!vendorData.vendorCode) {
      vendorData.vendorCode = await this.generateVendorCode();
    }

    // Check for duplicate vendor code
    const existing = await this.repository.findOne({
      where: { vendorCode: vendorData.vendorCode },
    });
    if (existing) {
      throw new Error(`Vendor code ${vendorData.vendorCode} already exists`);
    }

    const vendor = this.repository.create(vendorData);
    return await this.repository.save(vendor);
  }

  async findById(id: string): Promise<Vendor | null> {
    return await this.repository.findOne({
      where: { id },
    });
  }

  async findByCode(vendorCode: string): Promise<Vendor | null> {
    return await this.repository.findOne({
      where: { vendorCode },
    });
  }

  async findAll(filters: VendorFilters = {}): Promise<VendorListResult> {
    const {
      vendorType,
      isActive,
      search,
      page = 1,
      perPage = 20,
      sortBy = 'vendorName',
      sortOrder = 'ASC',
    } = filters;

    const queryBuilder = this.repository.createQueryBuilder('vendor');

    // Apply filters
    if (vendorType !== undefined) {
      queryBuilder.andWhere('vendor.vendorType = :vendorType', { vendorType });
    }

    if (isActive !== undefined) {
      queryBuilder.andWhere('vendor.isActive = :isActive', { isActive });
    }

    if (search) {
      queryBuilder.andWhere(
        '(vendor.vendorCode ILIKE :search OR vendor.vendorName ILIKE :search OR vendor.contactPerson ILIKE :search OR vendor.email ILIKE :search)',
        { search: `%${search}%` }
      );
    }

    // Apply sorting
    const sortField = `vendor.${sortBy}`;
    queryBuilder.orderBy(sortField, sortOrder);

    // Apply pagination
    const skip = (page - 1) * perPage;
    queryBuilder.skip(skip).take(perPage);

    const [vendors, total] = await queryBuilder.getManyAndCount();

    return {
      vendors,
      total,
      page,
      perPage,
    };
  }

  /**
   * Search vendors by name or code
   */
  async search(query: string, limit: number = 10): Promise<Vendor[]> {
    return await this.repository
      .createQueryBuilder('vendor')
      .where('vendor.vendorCode ILIKE :query OR vendor.vendorName ILIKE :query', {
        query: `%${query}%`,
      })
      .andWhere('vendor.isActive = :isActive', { isActive: true })
      .orderBy('vendor.vendorName', 'ASC')
      .limit(limit)
      .getMany();
  }

  async update(id: string, vendorData: Partial<Vendor>): Promise<Vendor | null> {
    // Validate email format if being updated
    if (vendorData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(vendorData.email)) {
      throw new Error('Invalid email format');
    }

    // Validate rating if being updated
    if (vendorData.rating !== undefined && vendorData.rating !== null) {
      if (vendorData.rating < 1 || vendorData.rating > 5) {
        throw new Error('Rating must be between 1 and 5');
      }
    }

    // Check for duplicate vendor code if being updated
    if (vendorData.vendorCode) {
      const existing = await this.repository.findOne({
        where: { vendorCode: vendorData.vendorCode },
      });
      if (existing && existing.id !== id) {
        throw new Error(`Vendor code ${vendorData.vendorCode} already exists`);
      }
    }

    await this.repository.update(id, vendorData);
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

  async existsByCode(vendorCode: string): Promise<boolean> {
    const count = await this.repository.count({ where: { vendorCode } });
    return count > 0;
  }

  /**
   * Get vendor statistics
   */
  async getStatistics(): Promise<{
    total: number;
    active: number;
    byType: Record<VendorType, number>;
  }> {
    const total = await this.repository.count();
    const active = await this.repository.count({ where: { isActive: true } });

    const byType: Record<VendorType, number> = {
      [VendorType.SUPPLIER]: 0,
      [VendorType.SUBCONTRACTOR]: 0,
      [VendorType.CONSULTANT]: 0,
      [VendorType.EQUIPMENT_RENTAL]: 0,
      [VendorType.OTHER]: 0,
    };

    for (const type of Object.values(VendorType)) {
      byType[type] = await this.repository.count({ where: { vendorType: type } });
    }

    return { total, active, byType };
  }
}

export const createVendorRepository = (): VendorRepository => {
  return new VendorRepository();
};
