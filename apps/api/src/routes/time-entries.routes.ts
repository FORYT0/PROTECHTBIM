import { Router, Request, Response } from 'express';
import { TimeEntryRepository } from '../repositories/TimeEntryRepository';
import { authenticateToken, createAuthService } from '../middleware/auth.middleware';
import { TimeEntry } from '../entities/TimeEntry';
import { ActivityLogRepository } from '../repositories/ActivityLogRepository';
import { WorkPackageRepository } from '../repositories/WorkPackageRepository';
import { ActivityActionType, ActivityEntityType } from '../entities/ActivityLog';

export interface TimeEntryFilters {
  workPackageId?: string;
  userId?: string;
  dateFrom?: Date;
  dateTo?: Date;
  billable?: boolean;
  page?: number;
  perPage?: number;
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC';
}

export const createTimeEntryRouter = (): Router => {
  const router = Router();
  const repository = new TimeEntryRepository();
  const workPackageRepository = new WorkPackageRepository();
  const activityLogRepository = new ActivityLogRepository();
  const authService = createAuthService();
  const authenticate = authenticateToken(authService);

  // POST /api/v1/time_entries - Log time
  router.post('/', authenticate, async (req: Request, res: Response) => {
    try {
      const userId = req.user?.userId;

      if (!userId) {
        return res.status(401).json({
          error: 'Unauthorized',
          message: 'User not authenticated',
        });
      }

      const { work_package_id, hours, date, comment, billable } = req.body;

      // Validate required fields
      if (!work_package_id) {
        return res.status(400).json({
          error: 'Bad Request',
          message: 'work_package_id is required',
        });
      }

      if (hours === undefined || hours === null) {
        return res.status(400).json({
          error: 'Bad Request',
          message: 'hours is required',
        });
      }

      if (!date) {
        return res.status(400).json({
          error: 'Bad Request',
          message: 'date is required',
        });
      }

      // Parse date
      const entryDate = new Date(date);
      if (isNaN(entryDate.getTime())) {
        return res.status(400).json({
          error: 'Bad Request',
          message: 'Invalid date format',
        });
      }

      // Create time entry
      const timeEntry = await repository.create({
        workPackageId: work_package_id,
        userId,
        hours: parseFloat(hours),
        date: entryDate,
        comment: comment || null,
        billable: billable ?? false,
      });

      // Log activity
      const workPackage = await workPackageRepository.findById(timeEntry.workPackageId);
      if (workPackage) {
        await activityLogRepository.create({
          projectId: workPackage.projectId,
          workPackageId: workPackage.id,
          userId,
          actionType: ActivityActionType.CREATED,
          entityType: ActivityEntityType.WORK_PACKAGE,
          entityId: workPackage.id,
          description: `logged ${timeEntry.hours} hours on work package: ${workPackage.subject}`,
          metadata: {
            timeEntryId: timeEntry.id,
            hours: timeEntry.hours,
            date: timeEntry.date,
          },
        });
      }

      return res.status(201).json({
        time_entry: {
          id: timeEntry.id,
          work_package_id: timeEntry.workPackageId,
          user_id: timeEntry.userId,
          hours: parseFloat(timeEntry.hours.toString()),
          date: timeEntry.date,
          comment: timeEntry.comment,
          billable: timeEntry.billable,
          created_at: timeEntry.createdAt,
          updated_at: timeEntry.updatedAt,
        },
      });
    } catch (error: any) {
      console.error('Error creating time entry:', error);
      return res.status(400).json({
        error: 'Bad Request',
        message: error.message || 'Failed to create time entry',
      });
    }
  });

  // GET /api/v1/time_entries - List time entries (auth optional, filters by userId)
  router.get('/', async (req: Request, res: Response) => {
    try {
      const {
        work_package_id,
        user_id,
        date_from,
        date_to,
        billable,
        page,
        per_page,
        sort_by,
        sort_order,
      } = req.query;

      const filters: TimeEntryFilters = {
        workPackageId: work_package_id as string,
        userId: user_id as string,
        billable: billable !== undefined ? billable === 'true' : undefined,
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
        time_entries: result.timeEntries.map((te) => ({
          id: te.id,
          work_package_id: te.workPackageId,
          user_id: te.userId,
          hours: parseFloat(te.hours.toString()),
          date: te.date,
          comment: te.comment,
          billable: te.billable,
          created_at: te.createdAt,
          updated_at: te.updatedAt,
          user: te.user
            ? {
              id: te.user.id,
              email: te.user.email,
              name: te.user.name,
            }
            : undefined,
          work_package: te.workPackage
            ? {
              id: te.workPackage.id,
              subject: te.workPackage.subject,
              project_id: te.workPackage.projectId,
            }
            : undefined,
        })),
        total: result.total,
        page: result.page,
        per_page: result.perPage,
      });
    } catch (error: any) {
      console.error('Error listing time entries:', error);
      return res.status(400).json({
        error: 'Bad Request',
        message: error.message || 'Failed to list time entries',
      });
    }
  });

  // GET /api/v1/time_entries/:id - Get time entry details
  router.get('/:id', authenticate, async (req: Request, res: Response) => {
    try {
      const { id } = req.params;

      const timeEntry = await repository.findById(id);

      if (!timeEntry) {
        return res.status(404).json({
          error: 'Not Found',
          message: 'Time entry not found',
        });
      }

      return res.status(200).json({
        time_entry: {
          id: timeEntry.id,
          work_package_id: timeEntry.workPackageId,
          user_id: timeEntry.userId,
          hours: parseFloat(timeEntry.hours.toString()),
          date: timeEntry.date,
          comment: timeEntry.comment,
          billable: timeEntry.billable,
          created_at: timeEntry.createdAt,
          updated_at: timeEntry.updatedAt,
          user: timeEntry.user
            ? {
              id: timeEntry.user.id,
              email: timeEntry.user.email,
              name: timeEntry.user.name,
            }
            : undefined,
          work_package: timeEntry.workPackage
            ? {
              id: timeEntry.workPackage.id,
              subject: timeEntry.workPackage.subject,
              project_id: timeEntry.workPackage.projectId,
            }
            : undefined,
        },
      });
    } catch (error: any) {
      console.error('Error getting time entry:', error);
      return res.status(400).json({
        error: 'Bad Request',
        message: error.message || 'Failed to get time entry',
      });
    }
  });

  // PATCH /api/v1/time_entries/:id - Update time entry
  router.patch('/:id', authenticate, async (req: Request, res: Response) => {
    try {
      const userId = req.user?.userId;
      const { id } = req.params;
      const { hours, date, comment, billable } = req.body;

      // Verify ownership
      const existing = await repository.findById(id);
      if (!existing) {
        return res.status(404).json({
          error: 'Not Found',
          message: 'Time entry not found',
        });
      }

      if (existing.userId !== userId) {
        return res.status(403).json({
          error: 'Forbidden',
          message: 'You can only edit your own time entries',
        });
      }

      // Prepare update data
      const updateData: Partial<TimeEntry> = {};

      if (hours !== undefined && hours !== null) {
        updateData.hours = parseFloat(hours);
      }

      if (date !== undefined) {
        const entryDate = new Date(date);
        if (isNaN(entryDate.getTime())) {
          return res.status(400).json({
            error: 'Bad Request',
            message: 'Invalid date format',
          });
        }
        updateData.date = entryDate;
      }

      if (comment !== undefined) {
        updateData.comment = comment;
      }

      if (billable !== undefined) {
        updateData.billable = billable;
      }

      // Update time entry
      const updated = await repository.update(id, updateData);

      if (!updated) {
        return res.status(404).json({
          error: 'Not Found',
          message: 'Time entry not found',
        });
      }

      // Log activity
      const workPackage = await workPackageRepository.findById(updated.workPackageId);
      if (workPackage) {
        await activityLogRepository.create({
          projectId: workPackage.projectId,
          workPackageId: workPackage.id,
          userId,
          actionType: ActivityActionType.UPDATED,
          entityType: ActivityEntityType.WORK_PACKAGE,
          entityId: workPackage.id,
          description: `updated time log for work package: ${workPackage.subject}`,
          metadata: {
            timeEntryId: updated.id,
            hours: updated.hours,
          },
        });
      }

      return res.status(200).json({
        time_entry: {
          id: updated.id,
          work_package_id: updated.workPackageId,
          user_id: updated.userId,
          hours: parseFloat(updated.hours.toString()),
          date: updated.date,
          comment: updated.comment,
          billable: updated.billable,
          created_at: updated.createdAt,
          updated_at: updated.updatedAt,
        },
      });
    } catch (error: any) {
      console.error('Error updating time entry:', error);

      if (error.message === 'Time entry not found') {
        return res.status(404).json({
          error: 'Not Found',
          message: error.message,
        });
      }

      return res.status(400).json({
        error: 'Bad Request',
        message: error.message || 'Failed to update time entry',
      });
    }
  });

  // DELETE /api/v1/time_entries/:id - Delete time entry
  router.delete('/:id', authenticate, async (req: Request, res: Response) => {
    try {
      const userId = req.user?.userId;
      const { id } = req.params;

      // Verify ownership
      const existing = await repository.findById(id);
      if (!existing) {
        return res.status(404).json({
          error: 'Not Found',
          message: 'Time entry not found',
        });
      }

      if (existing.userId !== userId) {
        return res.status(403).json({
          error: 'Forbidden',
          message: 'You can only delete your own time entries',
        });
      }

      const deleted = await repository.delete(id);

      if (!deleted) {
        return res.status(404).json({
          error: 'Not Found',
          message: 'Time entry not found',
        });
      }

      return res.status(204).send();
    } catch (error: any) {
      console.error('Error deleting time entry:', error);

      if (error.message === 'Time entry not found') {
        return res.status(404).json({
          error: 'Not Found',
          message: error.message,
        });
      }

      return res.status(400).json({
        error: 'Bad Request',
        message: error.message || 'Failed to delete time entry',
      });
    }
  });

  // GET /api/v1/time_entries/work_package/:work_package_id/total - Get total hours for work package
  router.get(
    '/work_package/:work_package_id/total',
    authenticate,
    async (req: Request, res: Response) => {
      try {
        const { work_package_id } = req.params;

        const total = await repository.getTotalHoursByWorkPackage(work_package_id);

        return res.status(200).json({
          work_package_id,
          total_hours: total,
        });
      } catch (error: any) {
        console.error('Error getting total hours:', error);
        return res.status(400).json({
          error: 'Bad Request',
          message: error.message || 'Failed to get total hours',
        });
      }
    }
  );

  // GET /api/v1/time_entries/user/:user_id/total - Get total hours for user
  router.get(
    '/user/:user_id/total',
    authenticate,
    async (req: Request, res: Response) => {
      try {
        const { user_id } = req.params;
        const { date_from, date_to } = req.query;

        let dateFrom: Date | undefined;
        let dateTo: Date | undefined;

        if (date_from) {
          dateFrom = new Date(date_from as string);
          if (isNaN(dateFrom.getTime())) {
            return res.status(400).json({
              error: 'Bad Request',
              message: 'Invalid date_from format',
            });
          }
        }

        if (date_to) {
          dateTo = new Date(date_to as string);
          if (isNaN(dateTo.getTime())) {
            return res.status(400).json({
              error: 'Bad Request',
              message: 'Invalid date_to format',
            });
          }
        }

        const total = await repository.getTotalHoursByUser(user_id, dateFrom, dateTo);

        return res.status(200).json({
          user_id,
          total_hours: total,
          date_from: dateFrom,
          date_to: dateTo,
        });
      } catch (error: any) {
        console.error('Error getting user total hours:', error);
        return res.status(400).json({
          error: 'Bad Request',
          message: error.message || 'Failed to get total hours',
        });
      }
    }
  );

  // POST /api/v1/time_entries/bulk - Bulk create time entries
  router.post('/bulk', authenticate, async (req: Request, res: Response) => {
    try {
      const userId = req.user?.userId;

      if (!userId) {
        return res.status(401).json({
          error: 'Unauthorized',
          message: 'User not authenticated',
        });
      }

      const { entries } = req.body;

      if (!Array.isArray(entries)) {
        return res.status(400).json({
          error: 'Bad Request',
          message: 'entries must be an array',
        });
      }

      const created: any[] = [];
      const errors: any[] = [];

      for (let i = 0; i < entries.length; i++) {
        try {
          const { work_package_id, hours, date, comment, billable } = entries[i];

          const timeEntry = await repository.create({
            workPackageId: work_package_id,
            userId,
            hours: parseFloat(hours),
            date: new Date(date),
            comment: comment || null,
            billable: billable ?? false,
          });

          created.push({
            id: timeEntry.id,
            work_package_id: timeEntry.workPackageId,
            user_id: timeEntry.userId,
            hours: parseFloat(timeEntry.hours.toString()),
            date: timeEntry.date,
            comment: timeEntry.comment,
            billable: timeEntry.billable,
          });
        } catch (error: any) {
          errors.push({
            index: i,
            error: error.message,
            entry: entries[i],
          });
        }
      }

      return res.status(201).json({
        created,
        errors,
        created_count: created.length,
        error_count: errors.length,
      });
    } catch (error: any) {
      console.error('Error bulk creating time entries:', error);
      return res.status(400).json({
        error: 'Bad Request',
        message: error.message || 'Failed to bulk create time entries',
      });
    }
  });

  return router;
};
