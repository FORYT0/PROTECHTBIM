import { Router, Request, Response } from 'express';
import { ProjectService, createProjectService } from '../services/ProjectService';
import { ProjectStatus } from '../entities/Project';
import { authenticateToken, createAuthService } from '../middleware/auth.middleware';

export const createProjectRouter = (projectService?: ProjectService): Router => {
  const router = Router();
  const service = projectService || createProjectService();
  const authService = createAuthService();
  const authenticate = authenticateToken(authService);

  // POST /api/v1/projects - Create project
  router.post('/', authenticate, async (req: Request, res: Response) => {
    try {
      const userId = req.user?.userId;

      if (!userId) {
        return res.status(401).json({
          error: 'Unauthorized',
          message: 'User not authenticated',
        });
      }

      const {
        name,
        description,
        program_id,
        portfolio_id,
        status,
        lifecycle_phase,
        start_date,
        end_date,
        template_id,
        custom_fields,
      } = req.body;

      const project = await service.createProject({
        name,
        description,
        programId: program_id,
        portfolioId: portfolio_id,
        ownerId: userId,
        status,
        lifecyclePhase: lifecycle_phase,
        startDate: start_date ? new Date(start_date) : undefined,
        endDate: end_date ? new Date(end_date) : undefined,
        templateId: template_id,
        customFields: custom_fields,
      }, userId);

      return res.status(201).json({
        project: {
          id: project.id,
          name: project.name,
          description: project.description,
          program_id: project.programId,
          portfolio_id: project.portfolioId,
          owner_id: project.ownerId,
          status: project.status,
          lifecycle_phase: project.lifecyclePhase,
          start_date: project.startDate,
          end_date: project.endDate,
          template_id: project.templateId,
          custom_fields: project.customFields,
          created_at: project.createdAt,
          updated_at: project.updatedAt,
        },
      });
    } catch (error: any) {
      console.error('Error creating project:', error);
      return res.status(400).json({
        error: 'Bad Request',
        message: error.message || 'Failed to create project',
      });
    }
  });

  // GET /api/v1/projects - List projects with filtering
  router.get('/', authenticate, async (req: Request, res: Response) => {
    try {
      const {
        portfolio_id,
        program_id,
        status,
        owner_id,
        search,
        page,
        per_page,
        sort_by,
        sort_order,
      } = req.query;

      // Parse status array if provided
      let statusArray: ProjectStatus[] | undefined;
      if (status) {
        if (Array.isArray(status)) {
          statusArray = status as ProjectStatus[];
        } else if (typeof status === 'string') {
          statusArray = status.split(',') as ProjectStatus[];
        }
      }

      const result = await service.listProjects({
        portfolioId: portfolio_id as string,
        programId: program_id as string,
        status: statusArray,
        ownerId: owner_id as string,
        search: search as string,
        page: page ? parseInt(page as string, 10) : undefined,
        perPage: per_page ? parseInt(per_page as string, 10) : undefined,
        sortBy: sort_by as string,
        sortOrder: (sort_order as string)?.toUpperCase() as 'ASC' | 'DESC',
      });

      return res.status(200).json({
        projects: result.projects.map((project) => ({
          id: project.id,
          name: project.name,
          description: project.description,
          program_id: project.programId,
          portfolio_id: project.portfolioId,
          owner_id: project.ownerId,
          status: project.status,
          lifecycle_phase: project.lifecyclePhase,
          start_date: project.startDate,
          end_date: project.endDate,
          template_id: project.templateId,
          custom_fields: project.customFields,
          created_at: project.createdAt,
          updated_at: project.updatedAt,
          owner: project.owner
            ? {
              id: project.owner.id,
              email: project.owner.email,
              name: project.owner.name,
            }
            : undefined,
          program: project.program
            ? {
              id: project.program.id,
              name: project.program.name,
            }
            : undefined,
          portfolio: project.portfolio
            ? {
              id: project.portfolio.id,
              name: project.portfolio.name,
            }
            : undefined,
        })),
        total: result.total,
        page: result.page,
        per_page: result.perPage,
      });
    } catch (error: any) {
      console.error('Error listing projects:', error);
      return res.status(400).json({
        error: 'Bad Request',
        message: error.message || 'Failed to list projects',
      });
    }
  });

  // GET /api/v1/projects/:id - Get project details
  router.get('/:id', authenticate, async (req: Request, res: Response) => {
    try {
      const { id } = req.params;

      const project = await service.getProjectById(id);

      if (!project) {
        return res.status(404).json({
          error: 'Not Found',
          message: 'Project not found',
        });
      }

      return res.status(200).json({
        project: {
          id: project.id,
          name: project.name,
          description: project.description,
          program_id: project.programId,
          portfolio_id: project.portfolioId,
          owner_id: project.ownerId,
          status: project.status,
          lifecycle_phase: project.lifecyclePhase,
          start_date: project.startDate,
          end_date: project.endDate,
          template_id: project.templateId,
          custom_fields: project.customFields,
          created_at: project.createdAt,
          updated_at: project.updatedAt,
          owner: project.owner
            ? {
              id: project.owner.id,
              email: project.owner.email,
              name: project.owner.name,
            }
            : undefined,
          program: project.program
            ? {
              id: project.program.id,
              name: project.program.name,
            }
            : undefined,
          portfolio: project.portfolio
            ? {
              id: project.portfolio.id,
              name: project.portfolio.name,
            }
            : undefined,
        },
      });
    } catch (error: any) {
      console.error('Error getting project:', error);
      return res.status(400).json({
        error: 'Bad Request',
        message: error.message || 'Failed to get project',
      });
    }
  });

  // PATCH /api/v1/projects/:id - Update project
  router.patch('/:id', authenticate, async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const userId = req.user?.userId;

      if (!userId) {
        return res.status(401).json({
          error: 'Unauthorized',
          message: 'User not authenticated',
        });
      }

      const {
        name,
        description,
        program_id,
        portfolio_id,
        status,
        lifecycle_phase,
        start_date,
        end_date,
        custom_fields,
      } = req.body;

      const project = await service.updateProject(id, {
        name,
        description,
        programId: program_id,
        portfolioId: portfolio_id,
        status,
        lifecyclePhase: lifecycle_phase,
        startDate: start_date ? new Date(start_date) : undefined,
        endDate: end_date ? new Date(end_date) : undefined,
        customFields: custom_fields,
      }, userId);

      return res.status(200).json({
        project: {
          id: project.id,
          name: project.name,
          description: project.description,
          program_id: project.programId,
          portfolio_id: project.portfolioId,
          owner_id: project.ownerId,
          status: project.status,
          lifecycle_phase: project.lifecyclePhase,
          start_date: project.startDate,
          end_date: project.endDate,
          template_id: project.templateId,
          custom_fields: project.customFields,
          created_at: project.createdAt,
          updated_at: project.updatedAt,
          owner: project.owner
            ? {
              id: project.owner.id,
              email: project.owner.email,
              name: project.owner.name,
            }
            : undefined,
          program: project.program
            ? {
              id: project.program.id,
              name: project.program.name,
            }
            : undefined,
          portfolio: project.portfolio
            ? {
              id: project.portfolio.id,
              name: project.portfolio.name,
            }
            : undefined,
        },
      });
    } catch (error: any) {
      console.error('Error updating project:', error);

      if (error.message === 'Project not found') {
        return res.status(404).json({
          error: 'Not Found',
          message: error.message,
        });
      }

      return res.status(400).json({
        error: 'Bad Request',
        message: error.message || 'Failed to update project',
      });
    }
  });

  // DELETE /api/v1/projects/:id - Delete project
  router.delete('/:id', authenticate, async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const userId = req.user?.userId;

      if (!userId) {
        return res.status(401).json({
          error: 'Unauthorized',
          message: 'User not authenticated',
        });
      }

      const deleted = await service.deleteProject(id, userId);

      if (!deleted) {
        return res.status(404).json({
          error: 'Not Found',
          message: 'Project not found',
        });
      }

      return res.status(204).send();
    } catch (error: any) {
      console.error('Error deleting project:', error);

      if (error.message === 'Project not found') {
        return res.status(404).json({
          error: 'Not Found',
          message: error.message,
        });
      }

      return res.status(400).json({
        error: 'Bad Request',
        message: error.message || 'Failed to delete project',
      });
    }
  });

  // POST /api/v1/projects/:id/transition-phase - Transition project lifecycle phase
  router.post(
    '/:id/transition-phase',
    authenticate,
    async (req: Request, res: Response) => {
      try {
        const { id } = req.params;
        const { new_phase } = req.body;

        if (!new_phase) {
          return res.status(400).json({
            error: 'Bad Request',
            message: 'new_phase is required',
          });
        }

        const userId = req.user?.userId;
        if (!userId) {
          return res.status(401).json({
            error: 'Unauthorized',
            message: 'User not authenticated',
          });
        }

        const project = await service.transitionPhase(id, new_phase, userId);

        return res.status(200).json({
          project: {
            id: project.id,
            name: project.name,
            description: project.description,
            program_id: project.programId,
            portfolio_id: project.portfolioId,
            owner_id: project.ownerId,
            status: project.status,
            lifecycle_phase: project.lifecyclePhase,
            start_date: project.startDate,
            end_date: project.endDate,
            template_id: project.templateId,
            custom_fields: project.customFields,
            created_at: project.createdAt,
            updated_at: project.updatedAt,
            owner: project.owner
              ? {
                id: project.owner.id,
                email: project.owner.email,
                name: project.owner.name,
              }
              : undefined,
            program: project.program
              ? {
                id: project.program.id,
                name: project.program.name,
              }
              : undefined,
            portfolio: project.portfolio
              ? {
                id: project.portfolio.id,
                name: project.portfolio.name,
              }
              : undefined,
          },
          message: `Project transitioned to ${new_phase} phase successfully`,
        });
      } catch (error: any) {
        console.error('Error transitioning project phase:', error);

        if (error.message === 'Project not found') {
          return res.status(404).json({
            error: 'Not Found',
            message: error.message,
          });
        }

        return res.status(400).json({
          error: 'Bad Request',
          message: error.message || 'Failed to transition project phase',
        });
      }
    }
  );

  // GET /api/v1/projects/:id/gantt - Get Gantt chart data
  router.get('/:id/gantt', authenticate, async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { start_date, end_date, include_relations, baseline_id } = req.query;

      // Parse query parameters
      const filters: any = {};

      if (start_date) {
        filters.startDate = new Date(start_date as string);
        if (isNaN(filters.startDate.getTime())) {
          return res.status(400).json({
            error: 'Bad Request',
            message: 'Invalid start_date format',
          });
        }
      }

      if (end_date) {
        filters.endDate = new Date(end_date as string);
        if (isNaN(filters.endDate.getTime())) {
          return res.status(400).json({
            error: 'Bad Request',
            message: 'Invalid end_date format',
          });
        }
      }

      if (include_relations !== undefined) {
        filters.includeRelations = include_relations === 'true';
      }

      const ganttData = await service.getGanttData(id, filters);

      // Optionally include baseline data
      let baselineData = null;
      if (baseline_id) {
        const { createBaselineService } = await import('../services/BaselineService');
        const baselineService = createBaselineService();

        try {
          const baseline = await baselineService.getBaselineWithWorkPackages(baseline_id as string);
          if (baseline && baseline.projectId === id) {
            baselineData = {
              id: baseline.id,
              name: baseline.name,
              created_at: baseline.createdAt,
              work_packages: baseline.workPackages.map((bwp) => ({
                work_package_id: bwp.workPackageId,
                subject: bwp.subject,
                start_date: bwp.startDate,
                due_date: bwp.dueDate,
              })),
            };
          }
        } catch (error) {
          console.warn('Failed to load baseline data:', error);
          // Continue without baseline data
        }
      }

      return res.status(200).json({
        work_packages: ganttData.workPackages.map((wp) => ({
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
        })),
        relations: ganttData.relations.map((rel) => ({
          id: rel.id,
          from_id: rel.fromId,
          to_id: rel.toId,
          relation_type: rel.relationType,
          lag_days: rel.lagDays,
          created_at: rel.createdAt,
        })),
        baseline: baselineData,
      });
    } catch (error: any) {
      console.error('Error getting Gantt data:', error);

      if (error.message === 'Project not found') {
        return res.status(404).json({
          error: 'Not Found',
          message: error.message,
        });
      }

      return res.status(400).json({
        error: 'Bad Request',
        message: error.message || 'Failed to get Gantt data',
      });
    }
  });

  // GET /api/v1/projects/:id/backlog - Get product backlog (work packages not in any sprint)
  router.get('/:id/backlog', authenticate, async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { page, per_page, sort_by, sort_order } = req.query;

      // Import WorkPackageService
      const { createWorkPackageService } = await import('../services/WorkPackageService');
      const workPackageService = createWorkPackageService();

      // Get work packages for this project that are not in any sprint
      const result = await workPackageService.listWorkPackages({
        projectId: id,
        sprintId: null, // Only work packages not assigned to a sprint
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
          story_points: wp.storyPoints,
          estimated_hours: wp.estimatedHours,
          created_at: wp.createdAt,
          updated_at: wp.updatedAt,
          assignee: wp.assignee
            ? {
              id: wp.assignee.id,
              email: wp.assignee.email,
              name: wp.assignee.name,
            }
            : undefined,
        })),
        total: result.total,
        page: result.page,
        per_page: result.perPage,
      });
    } catch (error: any) {
      console.error('Error getting backlog:', error);

      if (error.message === 'Project not found') {
        return res.status(404).json({
          error: 'Not Found',
          message: error.message,
        });
      }

      return res.status(400).json({
        error: 'Bad Request',
        message: error.message || 'Failed to get backlog',
      });
    }
  });

  // GET /api/v1/projects/:id/snapshot - Get project snapshot with enterprise summaries
  router.get('/:id/snapshot', authenticate, async (req: Request, res: Response) => {
    try {
      const { id } = req.params;

      const project = await service.getProject(id);
      if (!project) {
        return res.status(404).json({
          error: 'Not Found',
          message: 'Project not found',
        });
      }

      // TODO: Implement actual snapshot data aggregation
      // For now, return mock structure that frontend expects
      const snapshot = {
        project_id: id,
        contract_summary: {
          original_value: 0,
          revised_value: 0,
          total_variations: 0,
          pending_variations: 0,
        },
        change_order_summary: {
          total: 0,
          approved: 0,
          pending: 0,
          rejected: 0,
          total_cost_impact: 0,
          approved_cost_impact: 0,
        },
        field_summary: {
          daily_reports_count: 0,
          last_report_date: null,
          total_manpower: 0,
          active_delays: 0,
        },
        snag_summary: {
          total: 0,
          open: 0,
          in_progress: 0,
          resolved: 0,
          critical: 0,
          total_cost_impact: 0,
        },
      };

      return res.status(200).json({ snapshot });
    } catch (error: any) {
      console.error('Error getting project snapshot:', error);
      return res.status(400).json({
        error: 'Bad Request',
        message: error.message || 'Failed to get project snapshot',
      });
    }
  });

  return router;
};
