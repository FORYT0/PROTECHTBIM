import { Router, Request, Response } from 'express';
import { CostCodeService, createCostCodeService } from '../services/CostCodeService';
import { authenticateToken, createAuthService } from '../middleware/auth.middleware';

export const createCostCodeRouter = (costCodeService?: CostCodeService): Router => {
  const router = Router();
  const service = costCodeService || createCostCodeService();
  const authService = createAuthService();
  const authenticate = authenticateToken(authService);

  // POST /api/v1/cost-codes - Create cost code
  router.post('/', authenticate, async (req: Request, res: Response) => {
    try {
      const { code, name, description, parent_code_id, level, is_active } = req.body;

      const costCode = await service.createCostCode({
        code,
        name,
        description,
        parentCodeId: parent_code_id,
        level,
        isActive: is_active,
      });

      return res.status(201).json({
        cost_code: {
          id: costCode.id,
          code: costCode.code,
          name: costCode.name,
          description: costCode.description,
          parent_code_id: costCode.parentCodeId,
          level: costCode.level,
          is_active: costCode.isActive,
          created_at: costCode.createdAt,
          updated_at: costCode.updatedAt,
        },
      });
    } catch (error: any) {
      console.error('Error creating cost code:', error);
      return res.status(400).json({
        error: 'Bad Request',
        message: error.message || 'Failed to create cost code',
      });
    }
  });

  // GET /api/v1/cost-codes - List cost codes
  router.get('/', authenticate, async (req: Request, res: Response) => {
    try {
      const {
        parent_code_id,
        level,
        is_active,
        search,
        page,
        per_page,
        sort_by,
        sort_order,
      } = req.query;

      const result = await service.listCostCodes({
        parentCodeId: parent_code_id === 'null' ? null : (parent_code_id as string),
        level: level ? parseInt(level as string, 10) : undefined,
        isActive: is_active === 'true' ? true : is_active === 'false' ? false : undefined,
        search: search as string,
        page: page ? parseInt(page as string, 10) : undefined,
        perPage: per_page ? parseInt(per_page as string, 10) : undefined,
        sortBy: sort_by as string,
        sortOrder: (sort_order as string)?.toUpperCase() as 'ASC' | 'DESC',
      });

      return res.status(200).json({
        cost_codes: result.costCodes.map((cc) => ({
          id: cc.id,
          code: cc.code,
          name: cc.name,
          description: cc.description,
          parent_code_id: cc.parentCodeId,
          level: cc.level,
          is_active: cc.isActive,
          created_at: cc.createdAt,
          updated_at: cc.updatedAt,
          parent_code: cc.parentCode
            ? {
                id: cc.parentCode.id,
                code: cc.parentCode.code,
                name: cc.parentCode.name,
              }
            : undefined,
        })),
        total: result.total,
        page: result.page,
        per_page: result.perPage,
      });
    } catch (error: any) {
      console.error('Error listing cost codes:', error);
      return res.status(400).json({
        error: 'Bad Request',
        message: error.message || 'Failed to list cost codes',
      });
    }
  });

  // GET /api/v1/cost-codes/hierarchy - Get hierarchical structure
  router.get('/hierarchy', authenticate, async (req: Request, res: Response) => {
    try {
      const hierarchy = await service.getHierarchy();

      return res.status(200).json({
        cost_codes: hierarchy.map((cc: any) => ({
          id: cc.id,
          code: cc.code,
          name: cc.name,
          description: cc.description,
          level: cc.level,
          is_active: cc.isActive,
          children: cc.children?.map((child: any) => ({
            id: child.id,
            code: child.code,
            name: child.name,
            description: child.description,
            level: child.level,
            is_active: child.isActive,
          })),
        })),
      });
    } catch (error: any) {
      console.error('Error getting cost code hierarchy:', error);
      return res.status(400).json({
        error: 'Bad Request',
        message: error.message || 'Failed to get cost code hierarchy',
      });
    }
  });

  // GET /api/v1/cost-codes/:id - Get cost code by ID
  router.get('/:id', authenticate, async (req: Request, res: Response) => {
    try {
      const { id } = req.params;

      const costCode = await service.getCostCodeById(id);

      if (!costCode) {
        return res.status(404).json({
          error: 'Not Found',
          message: 'Cost code not found',
        });
      }

      return res.status(200).json({
        cost_code: {
          id: costCode.id,
          code: costCode.code,
          name: costCode.name,
          description: costCode.description,
          parent_code_id: costCode.parentCodeId,
          level: costCode.level,
          is_active: costCode.isActive,
          created_at: costCode.createdAt,
          updated_at: costCode.updatedAt,
          parent_code: costCode.parentCode
            ? {
                id: costCode.parentCode.id,
                code: costCode.parentCode.code,
                name: costCode.parentCode.name,
              }
            : undefined,
        },
      });
    } catch (error: any) {
      console.error('Error getting cost code:', error);
      return res.status(400).json({
        error: 'Bad Request',
        message: error.message || 'Failed to get cost code',
      });
    }
  });

  // GET /api/v1/cost-codes/:id/children - Get child cost codes
  router.get('/:id/children', authenticate, async (req: Request, res: Response) => {
    try {
      const { id } = req.params;

      const children = await service.getChildren(id);

      return res.status(200).json({
        cost_codes: children.map((cc) => ({
          id: cc.id,
          code: cc.code,
          name: cc.name,
          description: cc.description,
          parent_code_id: cc.parentCodeId,
          level: cc.level,
          is_active: cc.isActive,
          created_at: cc.createdAt,
          updated_at: cc.updatedAt,
        })),
      });
    } catch (error: any) {
      console.error('Error getting child cost codes:', error);
      return res.status(400).json({
        error: 'Bad Request',
        message: error.message || 'Failed to get child cost codes',
      });
    }
  });

  // PATCH /api/v1/cost-codes/:id - Update cost code
  router.patch('/:id', authenticate, async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { code, name, description, parent_code_id, level, is_active } = req.body;

      const costCode = await service.updateCostCode(id, {
        code,
        name,
        description,
        parentCodeId: parent_code_id,
        level,
        isActive: is_active,
      });

      return res.status(200).json({
        cost_code: {
          id: costCode.id,
          code: costCode.code,
          name: costCode.name,
          description: costCode.description,
          parent_code_id: costCode.parentCodeId,
          level: costCode.level,
          is_active: costCode.isActive,
          created_at: costCode.createdAt,
          updated_at: costCode.updatedAt,
        },
      });
    } catch (error: any) {
      console.error('Error updating cost code:', error);

      if (error.message === 'Cost code not found') {
        return res.status(404).json({
          error: 'Not Found',
          message: error.message,
        });
      }

      return res.status(400).json({
        error: 'Bad Request',
        message: error.message || 'Failed to update cost code',
      });
    }
  });

  // DELETE /api/v1/cost-codes/:id - Delete cost code
  router.delete('/:id', authenticate, async (req: Request, res: Response) => {
    try {
      const { id } = req.params;

      const deleted = await service.deleteCostCode(id);

      if (!deleted) {
        return res.status(404).json({
          error: 'Not Found',
          message: 'Cost code not found',
        });
      }

      return res.status(204).send();
    } catch (error: any) {
      console.error('Error deleting cost code:', error);

      if (error.message === 'Cost code not found') {
        return res.status(404).json({
          error: 'Not Found',
          message: error.message,
        });
      }

      return res.status(400).json({
        error: 'Bad Request',
        message: error.message || 'Failed to delete cost code',
      });
    }
  });

  // POST /api/v1/cost-codes/:id/deactivate - Deactivate cost code
  router.post('/:id/deactivate', authenticate, async (req: Request, res: Response) => {
    try {
      const { id } = req.params;

      const costCode = await service.deactivateCostCode(id);

      return res.status(200).json({
        cost_code: {
          id: costCode.id,
          code: costCode.code,
          name: costCode.name,
          description: costCode.description,
          parent_code_id: costCode.parentCodeId,
          level: costCode.level,
          is_active: costCode.isActive,
          created_at: costCode.createdAt,
          updated_at: costCode.updatedAt,
        },
        message: 'Cost code deactivated successfully',
      });
    } catch (error: any) {
      console.error('Error deactivating cost code:', error);

      if (error.message === 'Cost code not found') {
        return res.status(404).json({
          error: 'Not Found',
          message: error.message,
        });
      }

      return res.status(400).json({
        error: 'Bad Request',
        message: error.message || 'Failed to deactivate cost code',
      });
    }
  });

  // POST /api/v1/cost-codes/:id/activate - Activate cost code
  router.post('/:id/activate', authenticate, async (req: Request, res: Response) => {
    try {
      const { id } = req.params;

      const costCode = await service.activateCostCode(id);

      return res.status(200).json({
        cost_code: {
          id: costCode.id,
          code: costCode.code,
          name: costCode.name,
          description: costCode.description,
          parent_code_id: costCode.parentCodeId,
          level: costCode.level,
          is_active: costCode.isActive,
          created_at: costCode.createdAt,
          updated_at: costCode.updatedAt,
        },
        message: 'Cost code activated successfully',
      });
    } catch (error: any) {
      console.error('Error activating cost code:', error);

      if (error.message === 'Cost code not found') {
        return res.status(404).json({
          error: 'Not Found',
          message: error.message,
        });
      }

      return res.status(400).json({
        error: 'Bad Request',
        message: error.message || 'Failed to activate cost code',
      });
    }
  });

  return router;
};
