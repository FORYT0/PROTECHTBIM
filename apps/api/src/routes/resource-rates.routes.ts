import { Router, Request, Response } from 'express';
import { ResourceRateService, createResourceRateService } from '../services/ResourceRateService';
import { CostCategory } from '../entities/CostEntry';
import { authenticateToken, createAuthService } from '../middleware/auth.middleware';

export const createResourceRateRouter = (resourceRateService?: ResourceRateService): Router => {
  const router = Router();
  const service = resourceRateService || createResourceRateService();
  const authService = createAuthService();
  const authenticate = authenticateToken(authService);

  // POST /api/v1/resource-rates - Create resource rate
  router.post('/', authenticate, async (req: Request, res: Response) => {
    try {
      const {
        user_id,
        role,
        hourly_rate,
        overtime_rate,
        overtime_multiplier,
        cost_category,
        cost_code_id,
        effective_from,
        effective_to,
        is_active,
      } = req.body;

      const rate = await service.createResourceRate({
        userId: user_id,
        role,
        hourlyRate: hourly_rate,
        overtimeRate: overtime_rate,
        overtimeMultiplier: overtime_multiplier,
        costCategory: cost_category,
        costCodeId: cost_code_id,
        effectiveFrom: new Date(effective_from),
        effectiveTo: effective_to ? new Date(effective_to) : undefined,
        isActive: is_active,
      });

      return res.status(201).json({
        resource_rate: {
          id: rate.id,
          user_id: rate.userId,
          role: rate.role,
          hourly_rate: rate.hourlyRate,
          overtime_rate: rate.overtimeRate,
          overtime_multiplier: rate.overtimeMultiplier,
          cost_category: rate.costCategory,
          cost_code_id: rate.costCodeId,
          effective_from: rate.effectiveFrom,
          effective_to: rate.effectiveTo,
          is_active: rate.isActive,
          created_at: rate.createdAt,
          updated_at: rate.updatedAt,
        },
      });
    } catch (error: any) {
      console.error('Error creating resource rate:', error);
      return res.status(400).json({
        error: 'Bad Request',
        message: error.message || 'Failed to create resource rate',
      });
    }
  });

  // GET /api/v1/resource-rates - List resource rates
  router.get('/', authenticate, async (req: Request, res: Response) => {
    try {
      const {
        user_id,
        role,
        cost_category,
        is_active,
        effective_date,
        page,
        per_page,
        sort_by,
        sort_order,
      } = req.query;

      const result = await service.listResourceRates({
        userId: user_id as string,
        role: role as string,
        costCategory: cost_category as CostCategory,
        isActive: is_active === 'true' ? true : is_active === 'false' ? false : undefined,
        effectiveDate: effective_date ? new Date(effective_date as string) : undefined,
        page: page ? parseInt(page as string, 10) : undefined,
        perPage: per_page ? parseInt(per_page as string, 10) : undefined,
        sortBy: sort_by as string,
        sortOrder: (sort_order as string)?.toUpperCase() as 'ASC' | 'DESC',
      });

      return res.status(200).json({
        resource_rates: result.resourceRates.map((r) => ({
          id: r.id,
          user_id: r.userId,
          role: r.role,
          hourly_rate: r.hourlyRate,
          overtime_rate: r.overtimeRate,
          overtime_multiplier: r.overtimeMultiplier,
          cost_category: r.costCategory,
          cost_code_id: r.costCodeId,
          effective_from: r.effectiveFrom,
          effective_to: r.effectiveTo,
          is_active: r.isActive,
          created_at: r.createdAt,
          updated_at: r.updatedAt,
          user: r.user
            ? {
                id: r.user.id,
                email: r.user.email,
                name: r.user.name,
              }
            : undefined,
          cost_code: r.costCode
            ? {
                id: r.costCode.id,
                code: r.costCode.code,
                name: r.costCode.name,
              }
            : undefined,
        })),
        total: result.total,
        page: result.page,
        per_page: result.perPage,
      });
    } catch (error: any) {
      console.error('Error listing resource rates:', error);
      return res.status(400).json({
        error: 'Bad Request',
        message: error.message || 'Failed to list resource rates',
      });
    }
  });

  // GET /api/v1/resource-rates/users/:userId/current - Get current rate for user
  router.get('/users/:userId/current', authenticate, async (req: Request, res: Response) => {
    try {
      const { userId } = req.params;
      const { date } = req.query;

      const rate = await service.getCurrentRate(
        userId,
        date ? new Date(date as string) : undefined
      );

      if (!rate) {
        return res.status(404).json({
          error: 'Not Found',
          message: 'No active rate found for user',
        });
      }

      return res.status(200).json({
        resource_rate: {
          id: rate.id,
          user_id: rate.userId,
          role: rate.role,
          hourly_rate: rate.hourlyRate,
          overtime_rate: rate.overtimeRate,
          overtime_multiplier: rate.overtimeMultiplier,
          cost_category: rate.costCategory,
          cost_code_id: rate.costCodeId,
          effective_from: rate.effectiveFrom,
          effective_to: rate.effectiveTo,
          is_active: rate.isActive,
          created_at: rate.createdAt,
          updated_at: rate.updatedAt,
        },
      });
    } catch (error: any) {
      console.error('Error getting current rate:', error);
      return res.status(400).json({
        error: 'Bad Request',
        message: error.message || 'Failed to get current rate',
      });
    }
  });

  // GET /api/v1/resource-rates/users/:userId/history - Get rate history for user
  router.get('/users/:userId/history', authenticate, async (req: Request, res: Response) => {
    try {
      const { userId } = req.params;

      const history = await service.getRateHistory(userId);

      return res.status(200).json({
        resource_rates: history.map((r) => ({
          id: r.id,
          user_id: r.userId,
          role: r.role,
          hourly_rate: r.hourlyRate,
          overtime_rate: r.overtimeRate,
          overtime_multiplier: r.overtimeMultiplier,
          cost_category: r.costCategory,
          cost_code_id: r.costCodeId,
          effective_from: r.effectiveFrom,
          effective_to: r.effectiveTo,
          is_active: r.isActive,
          created_at: r.createdAt,
          updated_at: r.updatedAt,
        })),
      });
    } catch (error: any) {
      console.error('Error getting rate history:', error);
      return res.status(400).json({
        error: 'Bad Request',
        message: error.message || 'Failed to get rate history',
      });
    }
  });

  // GET /api/v1/resource-rates/:id - Get resource rate by ID
  router.get('/:id', authenticate, async (req: Request, res: Response) => {
    try {
      const { id } = req.params;

      const rate = await service.getResourceRateById(id);

      if (!rate) {
        return res.status(404).json({
          error: 'Not Found',
          message: 'Resource rate not found',
        });
      }

      return res.status(200).json({
        resource_rate: {
          id: rate.id,
          user_id: rate.userId,
          role: rate.role,
          hourly_rate: rate.hourlyRate,
          overtime_rate: rate.overtimeRate,
          overtime_multiplier: rate.overtimeMultiplier,
          cost_category: rate.costCategory,
          cost_code_id: rate.costCodeId,
          effective_from: rate.effectiveFrom,
          effective_to: rate.effectiveTo,
          is_active: rate.isActive,
          created_at: rate.createdAt,
          updated_at: rate.updatedAt,
          user: rate.user
            ? {
                id: rate.user.id,
                email: rate.user.email,
                name: rate.user.name,
              }
            : undefined,
          cost_code: rate.costCode
            ? {
                id: rate.costCode.id,
                code: rate.costCode.code,
                name: rate.costCode.name,
              }
            : undefined,
        },
      });
    } catch (error: any) {
      console.error('Error getting resource rate:', error);
      return res.status(400).json({
        error: 'Bad Request',
        message: error.message || 'Failed to get resource rate',
      });
    }
  });

  // PATCH /api/v1/resource-rates/:id - Update resource rate
  router.patch('/:id', authenticate, async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const {
        role,
        hourly_rate,
        overtime_rate,
        overtime_multiplier,
        cost_category,
        cost_code_id,
        effective_from,
        effective_to,
        is_active,
      } = req.body;

      const rate = await service.updateResourceRate(id, {
        role,
        hourlyRate: hourly_rate,
        overtimeRate: overtime_rate,
        overtimeMultiplier: overtime_multiplier,
        costCategory: cost_category,
        costCodeId: cost_code_id,
        effectiveFrom: effective_from ? new Date(effective_from) : undefined,
        effectiveTo: effective_to ? new Date(effective_to) : undefined,
        isActive: is_active,
      });

      return res.status(200).json({
        resource_rate: {
          id: rate.id,
          user_id: rate.userId,
          role: rate.role,
          hourly_rate: rate.hourlyRate,
          overtime_rate: rate.overtimeRate,
          overtime_multiplier: rate.overtimeMultiplier,
          cost_category: rate.costCategory,
          cost_code_id: rate.costCodeId,
          effective_from: rate.effectiveFrom,
          effective_to: rate.effectiveTo,
          is_active: rate.isActive,
          created_at: rate.createdAt,
          updated_at: rate.updatedAt,
        },
      });
    } catch (error: any) {
      console.error('Error updating resource rate:', error);

      if (error.message === 'Resource rate not found') {
        return res.status(404).json({
          error: 'Not Found',
          message: error.message,
        });
      }

      return res.status(400).json({
        error: 'Bad Request',
        message: error.message || 'Failed to update resource rate',
      });
    }
  });

  // DELETE /api/v1/resource-rates/:id - Delete resource rate
  router.delete('/:id', authenticate, async (req: Request, res: Response) => {
    try {
      const { id } = req.params;

      const deleted = await service.deleteResourceRate(id);

      if (!deleted) {
        return res.status(404).json({
          error: 'Not Found',
          message: 'Resource rate not found',
        });
      }

      return res.status(204).send();
    } catch (error: any) {
      console.error('Error deleting resource rate:', error);

      if (error.message === 'Resource rate not found') {
        return res.status(404).json({
          error: 'Not Found',
          message: error.message,
        });
      }

      return res.status(400).json({
        error: 'Bad Request',
        message: error.message || 'Failed to delete resource rate',
      });
    }
  });

  // POST /api/v1/resource-rates/:id/deactivate - Deactivate resource rate
  router.post('/:id/deactivate', authenticate, async (req: Request, res: Response) => {
    try {
      const { id } = req.params;

      const rate = await service.deactivateResourceRate(id);

      if (!rate) {
        return res.status(404).json({
          error: 'Not Found',
          message: 'Resource rate not found',
        });
      }

      return res.status(200).json({
        resource_rate: {
          id: rate.id,
          user_id: rate.userId,
          role: rate.role,
          hourly_rate: rate.hourlyRate,
          overtime_rate: rate.overtimeRate,
          overtime_multiplier: rate.overtimeMultiplier,
          cost_category: rate.costCategory,
          cost_code_id: rate.costCodeId,
          effective_from: rate.effectiveFrom,
          effective_to: rate.effectiveTo,
          is_active: rate.isActive,
          created_at: rate.createdAt,
          updated_at: rate.updatedAt,
        },
        message: 'Resource rate deactivated successfully',
      });
    } catch (error: any) {
      console.error('Error deactivating resource rate:', error);
      return res.status(400).json({
        error: 'Bad Request',
        message: error.message || 'Failed to deactivate resource rate',
      });
    }
  });

  // POST /api/v1/resource-rates/:id/activate - Activate resource rate
  router.post('/:id/activate', authenticate, async (req: Request, res: Response) => {
    try {
      const { id } = req.params;

      const rate = await service.activateResourceRate(id);

      if (!rate) {
        return res.status(404).json({
          error: 'Not Found',
          message: 'Resource rate not found',
        });
      }

      return res.status(200).json({
        resource_rate: {
          id: rate.id,
          user_id: rate.userId,
          role: rate.role,
          hourly_rate: rate.hourlyRate,
          overtime_rate: rate.overtimeRate,
          overtime_multiplier: rate.overtimeMultiplier,
          cost_category: rate.costCategory,
          cost_code_id: rate.costCodeId,
          effective_from: rate.effectiveFrom,
          effective_to: rate.effectiveTo,
          is_active: rate.isActive,
          created_at: rate.createdAt,
          updated_at: rate.updatedAt,
        },
        message: 'Resource rate activated successfully',
      });
    } catch (error: any) {
      console.error('Error activating resource rate:', error);
      return res.status(400).json({
        error: 'Bad Request',
        message: error.message || 'Failed to activate resource rate',
      });
    }
  });

  return router;
};
