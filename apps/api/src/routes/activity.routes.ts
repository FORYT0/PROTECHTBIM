import { Router, Request, Response } from 'express';
import { ActivityLogRepository, ActivityLogFilters } from '../repositories/ActivityLogRepository';
import { ActivityActionType, ActivityEntityType } from '../entities/ActivityLog';
import { authenticateToken, createAuthService } from '../middleware/auth.middleware';

export const createActivityRouter = (): Router => {
  const router = Router();
  const repository = new ActivityLogRepository();
  const authService = createAuthService();
  const authenticate = authenticateToken(authService);

  // GET /api/v1/projects/:projectId/activity - Get project activities
  router.get(
    '/projects/:projectId/activity',
    authenticate,
    async (req: Request, res: Response) => {
      try {
        const { projectId } = req.params;
        const {
          action_type,
          entity_type,
          user_id,
          date_from,
          date_to,
          page,
          per_page,
          sort_by,
          sort_order,
        } = req.query;

        const filters: ActivityLogFilters = {
          projectId,
          actionType: action_type as ActivityActionType,
          entityType: entity_type as ActivityEntityType,
          userId: user_id as string,
          page: page ? parseInt(page as string, 10) : 1,
          perPage: per_page ? parseInt(per_page as string, 10) : 20,
          sortBy: sort_by as string,
          sortOrder: (sort_order as string)?.toUpperCase() as 'ASC' | 'DESC',
        };

        if (date_from) {
          const dateFrom = new Date(date_from as string);
          if (isNaN(dateFrom.getTime())) {
            return res.status(400).json({
              error: 'Bad Request',
              message: 'Invalid date_from format',
            });
          }
          filters.dateFrom = dateFrom;
        }

        if (date_to) {
          const dateTo = new Date(date_to as string);
          if (isNaN(dateTo.getTime())) {
            return res.status(400).json({
              error: 'Bad Request',
              message: 'Invalid date_to format',
            });
          }
          filters.dateTo = dateTo;
        }

        const result = await repository.findProjectActivities(projectId, filters);

        return res.status(200).json({
          activities: result.activities.map((activity) => ({
            id: activity.id,
            project_id: activity.projectId,
            work_package_id: activity.workPackageId,
            user_id: activity.userId,
            user_name: activity.user?.name,
            user_email: activity.user?.email,
            action_type: activity.actionType,
            entity_type: activity.entityType,
            entity_id: activity.entityId,
            description: activity.description,
            metadata: activity.metadata,
            created_at: activity.createdAt,
          })),
          total: result.total,
          page: result.page,
          per_page: result.perPage,
        });
      } catch (error: any) {
        console.error('Error getting project activities:', error);
        return res.status(400).json({
          error: 'Bad Request',
          message: error.message || 'Failed to get project activities',
        });
      }
    }
  );

  // GET /api/v1/work_packages/:workPackageId/activity - Get work package activities
  router.get(
    '/work_packages/:workPackageId/activity',
    authenticate,
    async (req: Request, res: Response) => {
      try {
        const { workPackageId } = req.params;
        const {
          action_type,
          user_id,
          date_from,
          date_to,
          page,
          per_page,
          sort_by,
          sort_order,
        } = req.query;

        const filters: ActivityLogFilters = {
          workPackageId,
          actionType: action_type as ActivityActionType,
          userId: user_id as string,
          page: page ? parseInt(page as string, 10) : 1,
          perPage: per_page ? parseInt(per_page as string, 10) : 20,
          sortBy: sort_by as string,
          sortOrder: (sort_order as string)?.toUpperCase() as 'ASC' | 'DESC',
        };

        if (date_from) {
          const dateFrom = new Date(date_from as string);
          if (isNaN(dateFrom.getTime())) {
            return res.status(400).json({
              error: 'Bad Request',
              message: 'Invalid date_from format',
            });
          }
          filters.dateFrom = dateFrom;
        }

        if (date_to) {
          const dateTo = new Date(date_to as string);
          if (isNaN(dateTo.getTime())) {
            return res.status(400).json({
              error: 'Bad Request',
              message: 'Invalid date_to format',
            });
          }
          filters.dateTo = dateTo;
        }

        const result = await repository.findAll(filters);

        return res.status(200).json({
          activities: result.activities.map((activity) => ({
            id: activity.id,
            project_id: activity.projectId,
            work_package_id: activity.workPackageId,
            user_id: activity.userId,
            user_name: activity.user?.name,
            user_email: activity.user?.email,
            action_type: activity.actionType,
            entity_type: activity.entityType,
            entity_id: activity.entityId,
            description: activity.description,
            metadata: activity.metadata,
            created_at: activity.createdAt,
          })),
          total: result.total,
          page: result.page,
          per_page: result.perPage,
        });
      } catch (error: any) {
        console.error('Error getting work package activities:', error);
        return res.status(400).json({
          error: 'Bad Request',
          message: error.message || 'Failed to get work package activities',
        });
      }
    }
  );

  // GET /api/v1/activity/feed - Get current user's activity feed
  router.get('/activity/feed', authenticate, async (req: Request, res: Response) => {
    try {
      const userId = req.user?.userId;

      if (!userId) {
        return res.status(401).json({
          error: 'Unauthorized',
          message: 'User not authenticated',
        });
      }

      const {
        action_type,
        entity_type,
        date_from,
        date_to,
        page,
        per_page,
        sort_by,
        sort_order,
      } = req.query;

      const filters: ActivityLogFilters = {
        userId,
        actionType: action_type as ActivityActionType,
        entityType: entity_type as ActivityEntityType,
        page: page ? parseInt(page as string, 10) : 1,
        perPage: per_page ? parseInt(per_page as string, 10) : 20,
        sortBy: sort_by as string,
        sortOrder: (sort_order as string)?.toUpperCase() as 'ASC' | 'DESC',
      };

      if (date_from) {
        const dateFrom = new Date(date_from as string);
        if (isNaN(dateFrom.getTime())) {
          return res.status(400).json({
            error: 'Bad Request',
            message: 'Invalid date_from format',
          });
        }
        filters.dateFrom = dateFrom;
      }

      if (date_to) {
        const dateTo = new Date(date_to as string);
        if (isNaN(dateTo.getTime())) {
          return res.status(400).json({
            error: 'Bad Request',
            message: 'Invalid date_to format',
          });
        }
        filters.dateTo = dateTo;
      }

      const result = await repository.findUserActivities(userId, filters);

      return res.status(200).json({
        activities: result.activities.map((activity) => ({
          id: activity.id,
          project_id: activity.projectId,
          work_package_id: activity.workPackageId,
          user_id: activity.userId,
          user_name: activity.user?.name,
          user_email: activity.user?.email,
          action_type: activity.actionType,
          entity_type: activity.entityType,
          entity_id: activity.entityId,
          description: activity.description,
          metadata: activity.metadata,
          created_at: activity.createdAt,
        })),
        total: result.total,
        page: result.page,
        per_page: result.perPage,
      });
    } catch (error: any) {
      console.error('Error getting user activity feed:', error);
      return res.status(400).json({
        error: 'Bad Request',
        message: error.message || 'Failed to get user activity feed',
      });
    }
  });

  // GET /api/v1/activity/filters - Get available activity filters
  router.get('/activity/filters', authenticate, async (_req: Request, res: Response) => {
    try {
      return res.status(200).json({
        action_types: Object.values(ActivityActionType),
        entity_types: Object.values(ActivityEntityType),
        description: 'Available filters for activity queries',
      });
    } catch (error: any) {
      console.error('Error getting activity filters:', error);
      return res.status(400).json({
        error: 'Bad Request',
        message: error.message || 'Failed to get activity filters',
      });
    }
  });

  // GET /api/v1/activity/summary/:projectId - Get activity summary
  router.get(
    '/activity/summary/:projectId',
    authenticate,
    async (req: Request, res: Response) => {
      try {
        const { projectId } = req.params;
        const { days } = req.query;

        const daysCount = days ? parseInt(days as string, 10) : 7;

        if (daysCount < 1 || daysCount > 365) {
          return res.status(400).json({
            error: 'Bad Request',
            message: 'days must be between 1 and 365',
          });
        }

        const summary = await repository.getActivitySummary(projectId, daysCount);

        return res.status(200).json({
          project_id: projectId,
          days: daysCount,
          total_activities: summary.total,
          by_action_type: summary.byType,
          by_entity_type: summary.byEntity,
        });
      } catch (error: any) {
        console.error('Error getting activity summary:', error);
        return res.status(400).json({
          error: 'Bad Request',
          message: error.message || 'Failed to get activity summary',
        });
      }
    }
  );

  // GET /api/v1/activity/recent/:projectId - Get recent project activities
  router.get(
    '/activity/recent/:projectId',
    authenticate,
    async (req: Request, res: Response) => {
      try {
        const { projectId } = req.params;
        const { limit } = req.query;

        const limitCount = limit ? parseInt(limit as string, 10) : 10;

        if (limitCount < 1 || limitCount > 100) {
          return res.status(400).json({
            error: 'Bad Request',
            message: 'limit must be between 1 and 100',
          });
        }

        const activities = await repository.findRecentActivities(projectId, limitCount);

        return res.status(200).json({
          project_id: projectId,
          activities: activities.map((activity) => ({
            id: activity.id,
            project_id: activity.projectId,
            work_package_id: activity.workPackageId,
            user_id: activity.userId,
            user_name: activity.user?.name,
            user_email: activity.user?.email,
            action_type: activity.actionType,
            entity_type: activity.entityType,
            entity_id: activity.entityId,
            description: activity.description,
            metadata: activity.metadata,
            created_at: activity.createdAt,
          })),
          count: activities.length,
        });
      } catch (error: any) {
        console.error('Error getting recent activities:', error);
        return res.status(400).json({
          error: 'Bad Request',
          message: error.message || 'Failed to get recent activities',
        });
      }
    }
  );

  return router;
};
