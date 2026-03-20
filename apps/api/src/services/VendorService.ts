import { Vendor, VendorType } from '../entities/Vendor';
import {
  VendorRepository,
  VendorFilters,
  VendorListResult,
  createVendorRepository,
} from '../repositories/VendorRepository';

export interface CreateVendorDTO {
  vendorName: string;
  vendorType?: VendorType;
  contactPerson?: string;
  email?: string;
  phone?: string;
  address?: string;
  paymentTerms?: string;
  taxId?: string;
  bankAccount?: string;
  rating?: number;
  isActive?: boolean;
}

export interface UpdateVendorDTO {
  vendorName?: string;
  vendorType?: VendorType;
  contactPerson?: string;
  email?: string;
  phone?: string;
  address?: string;
  paymentTerms?: string;
  taxId?: string;
  bankAccount?: string;
  rating?: number;
  isActive?: boolean;
}

export class VendorService {
  private vendorRepository: VendorRepository;

  constructor(vendorRepository?: VendorRepository) {
    this.vendorRepository = vendorRepository || createVendorRepository();
  }

  async createVendor(data: CreateVendorDTO): Promise<Vendor> {
    if (!data.vendorName || data.vendorName.trim().length === 0) {
      throw new Error('Vendor name is required');
    }

    const vendorData: Partial<Vendor> = {
      vendorName: data.vendorName.trim(),
      vendorType: data.vendorType || VendorType.SUPPLIER,
      contactPerson: data.contactPerson?.trim(),
      email: data.email?.trim(),
      phone: data.phone?.trim(),
      address: data.address?.trim(),
      paymentTerms: data.paymentTerms?.trim(),
      taxId: data.taxId?.trim(),
      bankAccount: data.bankAccount?.trim(),
      rating: data.rating,
      isActive: data.isActive !== undefined ? data.isActive : true,
    };

    return await this.vendorRepository.create(vendorData);
  }

  async getVendorById(id: string): Promise<Vendor | null> {
    if (!id) {
      throw new Error('Vendor ID is required');
    }

    return await this.vendorRepository.findById(id);
  }

  async getVendorByCode(vendorCode: string): Promise<Vendor | null> {
    if (!vendorCode) {
      throw new Error('Vendor code is required');
    }

    return await this.vendorRepository.findByCode(vendorCode);
  }

  async listVendors(filters: VendorFilters): Promise<VendorListResult> {
    if (filters.page && filters.page < 1) {
      throw new Error('Page must be greater than 0');
    }

    if (filters.perPage && (filters.perPage < 1 || filters.perPage > 100)) {
      throw new Error('Per page must be between 1 and 100');
    }

    return await this.vendorRepository.findAll(filters);
  }

  async searchVendors(query: string, limit: number = 10): Promise<Vendor[]> {
    if (!query || query.trim().length === 0) {
      throw new Error('Search query is required');
    }

    return await this.vendorRepository.search(query.trim(), limit);
  }

  async updateVendor(id: string, data: UpdateVendorDTO): Promise<Vendor> {
    if (!id) {
      throw new Error('Vendor ID is required');
    }

    const existingVendor = await this.vendorRepository.findById(id);
    if (!existingVendor) {
      throw new Error('Vendor not found');
    }

    if (data.vendorName !== undefined && data.vendorName.trim().length === 0) {
      throw new Error('Vendor name cannot be empty');
    }

    const updateData: Partial<Vendor> = {};

    if (data.vendorName !== undefined) updateData.vendorName = data.vendorName.trim();
    if (data.vendorType !== undefined) updateData.vendorType = data.vendorType;
    if (data.contactPerson !== undefined) updateData.contactPerson = data.contactPerson?.trim();
    if (data.email !== undefined) updateData.email = data.email?.trim();
    if (data.phone !== undefined) updateData.phone = data.phone?.trim();
    if (data.address !== undefined) updateData.address = data.address?.trim();
    if (data.paymentTerms !== undefined) updateData.paymentTerms = data.paymentTerms?.trim();
    if (data.taxId !== undefined) updateData.taxId = data.taxId?.trim();
    if (data.bankAccount !== undefined) updateData.bankAccount = data.bankAccount?.trim();
    if (data.rating !== undefined) updateData.rating = data.rating;
    if (data.isActive !== undefined) updateData.isActive = data.isActive;

    const updatedVendor = await this.vendorRepository.update(id, updateData);

    if (!updatedVendor) {
      throw new Error('Failed to update vendor');
    }

    return updatedVendor;
  }

  async deleteVendor(id: string): Promise<boolean> {
    if (!id) {
      throw new Error('Vendor ID is required');
    }

    const exists = await this.vendorRepository.exists(id);
    if (!exists) {
      throw new Error('Vendor not found');
    }

    return await this.vendorRepository.delete(id);
  }

  async getStatistics() {
    return await this.vendorRepository.getStatistics();
  }
}

export const createVendorService = (): VendorService => {
  return new VendorService();
};
