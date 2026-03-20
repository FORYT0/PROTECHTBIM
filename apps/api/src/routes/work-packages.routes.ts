import { Router, Request, Response } from 'express';
import { WorkPackageService, createWorkPackageService } from '../services/WorkPackageService';
import { WorkPackageType } from '../entities/WorkPackage';
import { authenticateToken, createAuthService } from '../middleware/auth.middleware';

export const createWorkPackageRouter = (workPackageService?: WorkPackageService): Router => {
  const router = Router();
  const service = workPackageService || createWorkPackageService();
  const authService = createAuthService();
  const authenticate = authenticateToken(authService);

  // POST /api/v1/work_packages - Create work package
  router.post('/', authenticate, async (req: Request, res: Response) => {
    try {
      const {
        project_id,
        type,
        subject,
        description,
        status,
        priority,
        assignee_id,
        accountable_id,
        parent_id,
        start_date,
        due_date,
        estimated_hours,
        scheduling_mode,
        version_id,
        sprint_id,
        story_points,
        custom_fields,
      } = req.body;

      const userId = (req as any).user?.userId;
      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized', message: 'User not found' });
      }

      const workPackage = await service.createWorkPackage({
        projectId: project_id,
        type,
        subject,
        description,
        status,
        priority,
        assigneeId: assignee_id,
        accountableId: accountable_id,
        parentId: parent_id,
        startDate: start_date ? new Date(start_date) : undefined,
        dueDate: due_date ? new Date(due_date) : undefined,
        estimatedHours: estimated_hours,
        schedulingMode: scheduling_mode,
        versionId: version_id,
        sprintId: sprint_id,
        storyPoints: story_points,
        customFields: custom_fields,
      }, userId);

      return res.status(201).json({
        work_package: {
          id: workPackage.id,
          project_id: workPackage.projectId,
          type: workPackage.type,
          subject: workPackage.subject,
          description: workPackage.description,
          status: workPackage.status,
          priority: workPackage.priority,
          assignee_id: workPackage.assigneeId,
          accountable_id: workPackage.accountableId,
          parent_id: workPackage.parentId,
          start_date: workPackage.startDate,
          due_date: workPackage.dueDate,
          estimated_hours: workPackage.estimatedHours,
          spent_hours: workPackage.spentHours,
          progress_percent: workPackage.progressPercent,
          scheduling_mode: workPackage.schedulingMode,
          version_id: workPackage.versionId,
          sprint_id: workPackage.sprintId,
          story_points: workPackage.storyPoints,
          custom_fields: workPackage.customFields,
          created_at: workPackage.createdAt,
          updated_at: workPackage.updatedAt,
        },
      });
    } catch (error: any) {
      console.error('Error creating work package:', error);
      return res.status(400).json({
        error: 'Bad Request',
        message: error.message || 'Failed to create work package',
      });
    }
  });

  // GET /api/v1/work_packages - List work packages with filtering
  router.get('/', authenticate, async (req: Request, res: Response) => {
    try {
      const {
        project_id,
        type,
        status,
        assignee_id,
        parent_id,
        priority,
        start_date_from,
        start_date_to,
        due_date_from,
        due_date_to,
        search,
        page,
        per_page,
        sort_by,
        sort_order,
      } = req.query;

      // Parse type array if provided
      let typeArray: WorkPackageType[] | undefined;
      if (type) {
        if (Array.isArray(type)) {
          typeArray = type as WorkPackageType[];
        } else if (typeof type === 'string') {
          typeArray = type.split(',') as WorkPackageType[];
        }
      }

      // Parse status array if provided
      let statusArray: string[] | undefined;
      if (status) {
        if (Array.isArray(status)) {
          statusArray = status as string[];
        } else if (typeof status === 'string') {
          statusArray = status.split(',');
        }
      }

      // Parse priority array if provided
      let priorityArray: string[] | undefined;
      if (priority) {
        if (Array.isArray(priority)) {
          priorityArray = priority as string[];
        } else if (typeof priority === 'string') {
          priorityArray = priority.split(',');
        }
      }

      // Parse custom fields from query parameters
      const customFields: Record<string, any> = {};
      Object.keys(req.query).forEach((key) => {
        if (key.startsWith('custom_field_')) {
          const fieldName = key.replace('custom_field_', '');
          const value = req.query[key];

          // Handle array values (comma-separated)
          if (typeof value === 'string' && value.includes(',')) {
            customFields[fieldName] = value.split(',');
          } else {
            customFields[fieldName] = value;
          }
        }
      });

      const result = await service.listWorkPackages({
        projectId: project_id as string,
        type: typeArray,
        status: statusArray,
        assigneeId: assignee_id as string,
        parentId: parent_id as string,
        priority: priorityArray,
        startDateFrom: start_date_from ? new Date(start_date_from as string) : undefined,
        startDateTo: start_date_to ? new Date(start_date_to as string) : undefined,
        dueDateFrom: due_date_from ? new Date(due_date_from as string) : undefined,
        dueDateTo: due_date_to ? new Date(due_date_to as string) : undefined,
        customFields: Object.keys(customFields).length > 0 ? customFields : undefined,
        search: search as string,
        page: page ? parseInt(page as string, 10) : undefined,
        perPage: per_page ? parseInt(per_page as string, 10) : undefined,
        sortBy: sort_by as string,
        sortOrder: (sort_order as string)?.toUpperCase() as 'ASC' | 'DESC',
      });

      return res.status(200).json({
        work_packages: result.workPackages.map((wp) => ({
          id: wp.id,
          project_id: wp.projectId,
          type: wp.type,
          subject: wp.subject,
          description: wp.description,
          status: wp.status,
          priority: wp.priority,
          assignee_id: wp.assigneeId,
          accountable_id: wp.accountableId,
          parent_id: wp.parentId,
          start_date: wp.startDate,
          due_date: wp.dueDate,
          estimated_hours: wp.estimatedHours,
          spent_hours: wp.spentHours,
          progress_percent: wp.progressPercent,
          scheduling_mode: wp.schedulingMode,
          version_id: wp.versionId,
          sprint_id: wp.sprintId,
          story_points: wp.storyPoints,
          custom_fields: wp.customFields,
          created_at: wp.createdAt,
          updated_at: wp.updatedAt,
          assignee: wp.assignee
            ? {
              id: wp.assignee.id,
              email: wp.assignee.email,
              name: wp.assignee.name,
            }
            : undefined,
          accountable: wp.accountable
            ? {
              id: wp.accountable.id,
              email: wp.accountable.email,
              name: wp.accountable.name,
            }
            : undefined,
          parent: wp.parent
            ? {
              id: wp.parent.id,
              subject: wp.parent.subject,
            }
            : undefined,
          watchers: wp.watchers?.map((watcher) => ({
            user_id: watcher.userId,
            user: watcher.user
              ? {
                id: watcher.user.id,
                email: watcher.user.email,
                name: watcher.user.name,
              }
              : undefined,
          })),
        })),
        total: result.total,
        page: result.page,
        per_page: result.perPage,
      });
    } catch (error: any) {
      console.error('Error listing work packages:', error);
      return res.status(400).json({
        error: 'Bad Request',
        message: error.message || 'Failed to list work packages',
      });
    }
  });

  // GET /api/v1/work_packages/:id - Get work package details
  router.get('/:id', authenticate, async (req: Request, res: Response) => {
    try {
      const { id } = req.params;

      const workPackage = await service.getWorkPackageById(id);

      if (!workPackage) {
        return res.status(404).json({
          error: 'Not Found',
          message: 'Work package not found',
        });
      }

      return res.status(200).json({
        work_package: {
          id: workPackage.id,
          project_id: workPackage.projectId,
          type: workPackage.type,
          subject: workPackage.subject,
          description: workPackage.description,
          status: workPackage.status,
          priority: workPackage.priority,
          assignee_id: workPackage.assigneeId,
          accountable_id: workPackage.accountableId,
          parent_id: workPackage.parentId,
          start_date: workPackage.startDate,
          due_date: workPackage.dueDate,
          estimated_hours: workPackage.estimatedHours,
          spent_hours: workPackage.spentHours,
          progress_percent: workPackage.progressPercent,
          scheduling_mode: workPackage.schedulingMode,
          version_id: workPackage.versionId,
          sprint_id: workPackage.sprintId,
          story_points: workPackage.storyPoints,
          custom_fields: workPackage.customFields,
          created_at: workPackage.createdAt,
          updated_at: workPackage.updatedAt,
          project: workPackage.project
            ? {
              id: workPackage.project.id,
              name: workPackage.project.name,
            }
            : undefined,
          assignee: workPackage.assignee
            ? {
              id: workPackage.assignee.id,
              email: workPackage.assignee.email,
              name: workPackage.assignee.name,
            }
            : undefined,
          accountable: workPackage.accountable
            ? {
              id: workPackage.accountable.id,
              email: workPackage.accountable.email,
              name: workPackage.accountable.name,
            }
            : undefined,
          parent: workPackage.parent
            ? {
              id: workPackage.parent.id,
              subject: workPackage.parent.subject,
            }
            : undefined,
          watchers: workPackage.watchers?.map((watcher) => ({
            user_id: watcher.userId,
            user: watcher.user
              ? {
                id: watcher.user.id,
                email: watcher.user.email,
                name: watcher.user.name,
              }
              : undefined,
          })),
        },
      });
    } catch (error: any) {
      console.error('Error getting work package:', error);
      return res.status(400).json({
        error: 'Bad Request',
        message: error.message || 'Failed to get work package',
      });
    }
  });

  // PATCH /api/v1/work_packages/:id - Update work package
  router.patch('/:id', authenticate, async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const {
        subject,
        description,
        status,
        priority,
        assignee_id,
        accountable_id,
        parent_id,
        start_date,
        due_date,
        estimated_hours,
        progress_percent,
        scheduling_mode,
        version_id,
        sprint_id,
        story_points,
        custom_fields,
      } = req.body;

      const userId = (req as any).user?.userId;
      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized', message: 'User not found' });
      }

      const workPackage = await service.updateWorkPackage(id, {
        subject,
        description,
        status,
        priority,
        assigneeId: assignee_id,
        accountableId: accountable_id,
        parentId: parent_id,
        startDate: start_date ? new Date(start_date) : undefined,
        dueDate: due_date ? new Date(due_date) : undefined,
        estimatedHours: estimated_hours,
        progressPercent: progress_percent,
        schedulingMode: scheduling_mode,
        versionId: version_id,
        sprintId: sprint_id,
        storyPoints: story_points,
        customFields: custom_fields,
      }, userId);

      return res.status(200).json({
        work_package: {
          id: workPackage.id,
          project_id: workPackage.projectId,
          type: workPackage.type,
          subject: workPackage.subject,
          description: workPackage.description,
          status: workPackage.status,
          priority: workPackage.priority,
          assignee_id: workPackage.assigneeId,
          accountable_id: workPackage.accountableId,
          parent_id: workPackage.parentId,
          start_date: workPackage.startDate,
          due_date: workPackage.dueDate,
          estimated_hours: workPackage.estimatedHours,
          spent_hours: workPackage.spentHours,
          progress_percent: workPackage.progressPercent,
          scheduling_mode: workPackage.schedulingMode,
          version_id: workPackage.versionId,
          sprint_id: workPackage.sprintId,
          story_points: workPackage.storyPoints,
          custom_fields: workPackage.customFields,
          created_at: workPackage.createdAt,
          updated_at: workPackage.updatedAt,
          project: workPackage.project
            ? {
              id: workPackage.project.id,
              name: workPackage.project.name,
            }
            : undefined,
          assignee: workPackage.assignee
            ? {
              id: workPackage.assignee.id,
              email: workPackage.assignee.email,
              name: workPackage.assignee.name,
            }
            : undefined,
          accountable: workPackage.accountable
            ? {
              id: workPackage.accountable.id,
              email: workPackage.accountable.email,
              name: workPackage.accountable.name,
            }
            : undefined,
          parent: workPackage.parent
            ? {
              id: workPackage.parent.id,
              subject: workPackage.parent.subject,
            }
            : undefined,
          watchers: workPackage.watchers?.map((watcher) => ({
            user_id: watcher.userId,
            user: watcher.user
              ? {
                id: watcher.user.id,
                email: watcher.user.email,
                name: watcher.user.name,
              }
              : undefined,
          })),
        },
      });
    } catch (error: any) {
      console.error('Error updating work package:', error);

      if (error.message === 'Work package not found') {
        return res.status(404).json({
          error: 'Not Found',
          message: error.message,
        });
      }

      return res.status(400).json({
        error: 'Bad Request',
        message: error.message || 'Failed to update work package',
      });
    }
  });

  // DELETE /api/v1/work_packages/:id - Delete work package
  router.delete('/:id', authenticate, async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const userId = (req as any).user?.userId;
      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized', message: 'User not found' });
      }

      const deleted = await service.deleteWorkPackage(id, userId);

      if (!deleted) {
        return res.status(404).json({
          error: 'Not Found',
          message: 'Work package not found',
        });
      }

      return res.status(204).send();
    } catch (error: any) {
      console.error('Error deleting work package:', error);

      if (error.message === 'Work package not found') {
        return res.status(404).json({
          error: 'Not Found',
          message: error.message,
        });
      }

      return res.status(400).json({
        error: 'Bad Request',
        message: error.message || 'Failed to delete work package',
      });
    }
  });

  // POST /api/v1/work_packages/:id/watchers - Add watcher
  router.post('/:id/watchers', authenticate, async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { user_id } = req.body;

      if (!user_id) {
        return res.status(400).json({
          error: 'Bad Request',
          message: 'user_id is required',
        });
      }

      const watcher = await service.addWatcher(id, user_id);

      return res.status(201).json({
        watcher: {
          work_package_id: watcher.workPackageId,
          user_id: watcher.userId,
          created_at: watcher.createdAt,
          user: watcher.user
            ? {
              id: watcher.user.id,
              email: watcher.user.email,
              name: watcher.user.name,
            }
            : undefined,
        },
      });
    } catch (error: any) {
      console.error('Error adding watcher:', error);

      if (error.message === 'Work package not found') {
        return res.status(404).json({
          error: 'Not Found',
          message: error.message,
        });
      }

      if (error.message === 'User not found') {
        return res.status(404).json({
          error: 'Not Found',
          message: error.message,
        });
      }

      if (error.message === 'User is already watching this work package') {
        return res.status(409).json({
          error: 'Conflict',
          message: error.message,
        });
      }

      return res.status(400).json({
        error: 'Bad Request',
        message: error.message || 'Failed to add watcher',
      });
    }
  });

  // DELETE /api/v1/work_packages/:id/watchers/:user_id - Remove watcher
  router.delete('/:id/watchers/:user_id', authenticate, async (req: Request, res: Response) => {
    try {
      const { id, user_id } = req.params;

      const removed = await service.removeWatcher(id, user_id);

      if (!removed) {
        return res.status(404).json({
          error: 'Not Found',
          message: 'Watcher not found',
        });
      }

      return res.status(204).send();
    } catch (error: any) {
      console.error('Error removing watcher:', error);

      if (error.message === 'Work package not found') {
        return res.status(404).json({
          error: 'Not Found',
          message: error.message,
        });
      }

      if (error.message === 'User is not watching this work package') {
        return res.status(404).json({
          error: 'Not Found',
          message: error.message,
        });
      }

      return res.status(400).json({
        error: 'Bad Request',
        message: error.message || 'Failed to remove watcher',
      });
    }
  });

  // GET /api/v1/work_packages/:id/watchers - List watchers
  router.get('/:id/watchers', authenticate, async (req: Request, res: Response) => {
    try {
      const { id } = req.params;

      const watchers = await service.getWatchers(id);

      return res.status(200).json({
        watchers: watchers.map((watcher) => ({
          work_package_id: watcher.workPackageId,
          user_id: watcher.userId,
          created_at: watcher.createdAt,
          user: watcher.user
            ? {
              id: watcher.user.id,
              email: watcher.user.email,
              name: watcher.user.name,
            }
            : undefined,
        })),
      });
    } catch (error: any) {
      console.error('Error listing watchers:', error);

      if (error.message === 'Work package not found') {
        return res.status(404).json({
          error: 'Not Found',
          message: error.message,
        });
      }

      return res.status(400).json({
        error: 'Bad Request',
        message: error.message || 'Failed to list watchers',
      });
    }
  });

  return router;
};
