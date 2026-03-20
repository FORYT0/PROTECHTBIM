import { Router, Request, Response } from 'express';
import {
  WorkPackageRelationService,
  createWorkPackageRelationService,
} from '../services/WorkPackageRelationService';
import { authenticateToken, createAuthService } from '../middleware/auth.middleware';
import { RelationType } from '../entities/WorkPackageRelation';

export const createWorkPackageRelationRouter = (
  relationService?: WorkPackageRelationService
): Router => {
  const router = Router();
  const service = relationService || createWorkPackageRelationService();
  const authService = createAuthService();
  const authenticate = authenticateToken(authService);

  // POST /api/v1/work_packages/:id/relations - Create relation
  router.post('/:id/relations', authenticate, async (req: Request, res: Response) => {
    try {
      const { id: fromId } = req.params;
      const { to_id, relation_type, lag_days } = req.body;

      if (!to_id) {
        return res.status(400).json({
          error: 'Bad Request',
          message: 'to_id is required',
        });
      }

      if (!relation_type) {
        return res.status(400).json({
          error: 'Bad Request',
          message: 'relation_type is required',
        });
      }

      // Validate relation type
      if (!Object.values(RelationType).includes(relation_type)) {
        return res.status(400).json({
          error: 'Bad Request',
          message: `Invalid relation_type. Must be one of: ${Object.values(RelationType).join(', ')}`,
        });
      }

      const relation = await service.createRelation({
        fromId,
        toId: to_id,
        relationType: relation_type,
        lagDays: lag_days,
      });

      return res.status(201).json({
        relation: {
          id: relation.id,
          from_id: relation.fromId,
          to_id: relation.toId,
          relation_type: relation.relationType,
          lag_days: relation.lagDays,
          created_at: relation.createdAt,
        },
      });
    } catch (error: any) {
      console.error('Error creating work package relation:', error);

      if (
        error.message === 'From work package not found' ||
        error.message === 'To work package not found'
      ) {
        return res.status(404).json({
          error: 'Not Found',
          message: error.message,
        });
      }

      if (error.message === 'Creating this relation would create a circular dependency') {
        return res.status(409).json({
          error: 'Conflict',
          message: error.message,
        });
      }

      return res.status(400).json({
        error: 'Bad Request',
        message: error.message || 'Failed to create relation',
      });
    }
  });

  // GET /api/v1/work_packages/:id/relations - List relations
  router.get('/:id/relations', authenticate, async (req: Request, res: Response) => {
    try {
      const { id } = req.params;

      const relations = await service.getRelationsByWorkPackageId(id);

      return res.status(200).json({
        relations: relations.map((rel) => ({
          id: rel.id,
          from_id: rel.fromId,
          to_id: rel.toId,
          relation_type: rel.relationType,
          lag_days: rel.lagDays,
          created_at: rel.createdAt,
          from: rel.from
            ? {
                id: rel.from.id,
                subject: rel.from.subject,
                type: rel.from.type,
                status: rel.from.status,
              }
            : undefined,
          to: rel.to
            ? {
                id: rel.to.id,
                subject: rel.to.subject,
                type: rel.to.type,
                status: rel.to.status,
              }
            : undefined,
        })),
      });
    } catch (error: any) {
      console.error('Error listing work package relations:', error);

      if (error.message === 'Work package not found') {
        return res.status(404).json({
          error: 'Not Found',
          message: error.message,
        });
      }

      return res.status(400).json({
        error: 'Bad Request',
        message: error.message || 'Failed to list relations',
      });
    }
  });

  return router;
};

// Separate router for relation-specific operations (not nested under work package)
export const createRelationRouter = (relationService?: WorkPackageRelationService): Router => {
  const router = Router();
  const service = relationService || createWorkPackageRelationService();
  const authService = createAuthService();
  const authenticate = authenticateToken(authService);

  // DELETE /api/v1/work_package_relations/:id - Delete relation
  router.delete('/:id', authenticate, async (req: Request, res: Response) => {
    try {
      const { id } = req.params;

      const deleted = await service.deleteRelation(id);

      if (!deleted) {
        return res.status(404).json({
          error: 'Not Found',
          message: 'Relation not found',
        });
      }

      return res.status(204).send();
    } catch (error: any) {
      console.error('Error deleting work package relation:', error);

      if (error.message === 'Relation not found') {
        return res.status(404).json({
          error: 'Not Found',
          message: error.message,
        });
      }

      return res.status(400).json({
        error: 'Bad Request',
        message: error.message || 'Failed to delete relation',
      });
    }
  });

  return router;
};
