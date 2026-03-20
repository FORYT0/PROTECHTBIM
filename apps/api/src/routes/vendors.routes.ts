import { Router, Request, Response } from 'express';
import { VendorService, createVendorService } from '../services/VendorService';
import { VendorType } from '../entities/Vendor';
import { authenticateToken, createAuthService } from '../middleware/auth.middleware';

export const createVendorRouter = (vendorService?: VendorService): Router => {
  const router = Router();
  const service = vendorService || createVendorService();
  const authService = createAuthService();
  const authenticate = authenticateToken(authService);

  // POST /api/v1/vendors - Create vendor
  router.post('/', authenticate, async (req: Request, res: Response) => {
    try {
      const {
        vendor_name,
        vendor_type,
        contact_person,
        email,
        phone,
        address,
        payment_terms,
        tax_id,
        bank_account,
        rating,
        is_active,
      } = req.body;

      const vendor = await service.createVendor({
        vendorName: vendor_name,
        vendorType: vendor_type,
        contactPerson: contact_person,
        email,
        phone,
        address,
        paymentTerms: payment_terms,
        taxId: tax_id,
        bankAccount: bank_account,
        rating,
        isActive: is_active,
      });

      return res.status(201).json({
        vendor: {
          id: vendor.id,
          vendor_code: vendor.vendorCode,
          vendor_name: vendor.vendorName,
          vendor_type: vendor.vendorType,
          contact_person: vendor.contactPerson,
          email: vendor.email,
          phone: vendor.phone,
          address: vendor.address,
          payment_terms: vendor.paymentTerms,
          tax_id: vendor.taxId,
          bank_account: vendor.bankAccount,
          is_active: vendor.isActive,
          rating: vendor.rating,
          created_at: vendor.createdAt,
          updated_at: vendor.updatedAt,
        },
      });
    } catch (error: any) {
      console.error('Error creating vendor:', error);
      return res.status(400).json({
        error: 'Bad Request',
        message: error.message || 'Failed to create vendor',
      });
    }
  });

  // GET /api/v1/vendors - List vendors
  router.get('/', authenticate, async (req: Request, res: Response) => {
    try {
      const { vendor_type, is_active, search, page, per_page, sort_by, sort_order } = req.query;

      const result = await service.listVendors({
        vendorType: vendor_type as VendorType,
        isActive: is_active === 'true' ? true : is_active === 'false' ? false : undefined,
        search: search as string,
        page: page ? parseInt(page as string, 10) : undefined,
        perPage: per_page ? parseInt(per_page as string, 10) : undefined,
        sortBy: sort_by as string,
        sortOrder: (sort_order as string)?.toUpperCase() as 'ASC' | 'DESC',
      });

      return res.status(200).json({
        vendors: result.vendors.map((v) => ({
          id: v.id,
          vendor_code: v.vendorCode,
          vendor_name: v.vendorName,
          vendor_type: v.vendorType,
          contact_person: v.contactPerson,
          email: v.email,
          phone: v.phone,
          address: v.address,
          payment_terms: v.paymentTerms,
          tax_id: v.taxId,
          bank_account: v.bankAccount,
          is_active: v.isActive,
          rating: v.rating,
          created_at: v.createdAt,
          updated_at: v.updatedAt,
        })),
        total: result.total,
        page: result.page,
        per_page: result.perPage,
      });
    } catch (error: any) {
      console.error('Error listing vendors:', error);
      return res.status(400).json({
        error: 'Bad Request',
        message: error.message || 'Failed to list vendors',
      });
    }
  });

  // GET /api/v1/vendors/search - Search vendors
  router.get('/search', authenticate, async (req: Request, res: Response) => {
    try {
      const { q, limit } = req.query;

      if (!q) {
        return res.status(400).json({
          error: 'Bad Request',
          message: 'Search query (q) is required',
        });
      }

      const vendors = await service.searchVendors(
        q as string,
        limit ? parseInt(limit as string, 10) : undefined
      );

      return res.status(200).json({
        vendors: vendors.map((v) => ({
          id: v.id,
          vendor_code: v.vendorCode,
          vendor_name: v.vendorName,
          vendor_type: v.vendorType,
          contact_person: v.contactPerson,
          email: v.email,
          phone: v.phone,
        })),
      });
    } catch (error: any) {
      console.error('Error searching vendors:', error);
      return res.status(400).json({
        error: 'Bad Request',
        message: error.message || 'Failed to search vendors',
      });
    }
  });

  // GET /api/v1/vendors/statistics - Get vendor statistics
  router.get('/statistics', authenticate, async (req: Request, res: Response) => {
    try {
      const stats = await service.getStatistics();

      return res.status(200).json({
        statistics: {
          total: stats.total,
          active: stats.active,
          by_type: stats.byType,
        },
      });
    } catch (error: any) {
      console.error('Error getting vendor statistics:', error);
      return res.status(400).json({
        error: 'Bad Request',
        message: error.message || 'Failed to get vendor statistics',
      });
    }
  });

  // GET /api/v1/vendors/:id - Get vendor by ID
  router.get('/:id', authenticate, async (req: Request, res: Response) => {
    try {
      const { id } = req.params;

      const vendor = await service.getVendorById(id);

      if (!vendor) {
        return res.status(404).json({
          error: 'Not Found',
          message: 'Vendor not found',
        });
      }

      return res.status(200).json({
        vendor: {
          id: vendor.id,
          vendor_code: vendor.vendorCode,
          vendor_name: vendor.vendorName,
          vendor_type: vendor.vendorType,
          contact_person: vendor.contactPerson,
          email: vendor.email,
          phone: vendor.phone,
          address: vendor.address,
          payment_terms: vendor.paymentTerms,
          tax_id: vendor.taxId,
          bank_account: vendor.bankAccount,
          is_active: vendor.isActive,
          rating: vendor.rating,
          created_at: vendor.createdAt,
          updated_at: vendor.updatedAt,
        },
      });
    } catch (error: any) {
      console.error('Error getting vendor:', error);
      return res.status(400).json({
        error: 'Bad Request',
        message: error.message || 'Failed to get vendor',
      });
    }
  });

  // PATCH /api/v1/vendors/:id - Update vendor
  router.patch('/:id', authenticate, async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const {
        vendor_name,
        vendor_type,
        contact_person,
        email,
        phone,
        address,
        payment_terms,
        tax_id,
        bank_account,
        rating,
        is_active,
      } = req.body;

      const vendor = await service.updateVendor(id, {
        vendorName: vendor_name,
        vendorType: vendor_type,
        contactPerson: contact_person,
        email,
        phone,
        address,
        paymentTerms: payment_terms,
        taxId: tax_id,
        bankAccount: bank_account,
        rating,
        isActive: is_active,
      });

      return res.status(200).json({
        vendor: {
          id: vendor.id,
          vendor_code: vendor.vendorCode,
          vendor_name: vendor.vendorName,
          vendor_type: vendor.vendorType,
          contact_person: vendor.contactPerson,
          email: vendor.email,
          phone: vendor.phone,
          address: vendor.address,
          payment_terms: vendor.paymentTerms,
          tax_id: vendor.taxId,
          bank_account: vendor.bankAccount,
          is_active: vendor.isActive,
          rating: vendor.rating,
          created_at: vendor.createdAt,
          updated_at: vendor.updatedAt,
        },
      });
    } catch (error: any) {
      console.error('Error updating vendor:', error);

      if (error.message === 'Vendor not found') {
        return res.status(404).json({
          error: 'Not Found',
          message: error.message,
        });
      }

      return res.status(400).json({
        error: 'Bad Request',
        message: error.message || 'Failed to update vendor',
      });
    }
  });

  // DELETE /api/v1/vendors/:id - Delete vendor
  router.delete('/:id', authenticate, async (req: Request, res: Response) => {
    try {
      const { id } = req.params;

      const deleted = await service.deleteVendor(id);

      if (!deleted) {
        return res.status(404).json({
          error: 'Not Found',
          message: 'Vendor not found',
        });
      }

      return res.status(204).send();
    } catch (error: any) {
      console.error('Error deleting vendor:', error);

      if (error.message === 'Vendor not found') {
        return res.status(404).json({
          error: 'Not Found',
          message: error.message,
        });
      }

      return res.status(400).json({
        error: 'Bad Request',
        message: error.message || 'Failed to delete vendor',
      });
    }
  });

  return router;
};
