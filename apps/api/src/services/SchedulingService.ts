import { SchedulingMode } from '../entities/WorkPackage';
import { WorkPackageRelation, RelationType } from '../entities/WorkPackageRelation';
import {
  WorkPackageRepository,
  createWorkPackageRepository,
} from '../repositories/WorkPackageRepository';
import {
  WorkPackageRelationRepository,
  createWorkPackageRelationRepository,
} from '../repositories/WorkPackageRelationRepository';
import {
  WorkCalendarService,
  createWorkCalendarService,
} from './WorkCalendarService';

export interface ScheduleUpdate {
  workPackageId: string;
  oldStartDate: Date | null;
  newStartDate: Date | null;
  oldDueDate: Date | null;
  newDueDate: Date | null;
  reason: string;
}

export interface CircularDependency {
  workPackageIds: string[];
  relationChain: WorkPackageRelation[];
}

export class SchedulingService {
  private workPackageRepository: WorkPackageRepository;
  private relationRepository: WorkPackageRelationRepository;
  private calendarService: WorkCalendarService;

  constructor(
    workPackageRepository?: WorkPackageRepository,
    relationRepository?: WorkPackageRelationRepository,
    calendarService?: WorkCalendarService
  ) {
    this.workPackageRepository = workPackageRepository || createWorkPackageRepository();
    this.relationRepository = relationRepository || createWorkPackageRelationRepository();
    this.calendarService = calendarService || createWorkCalendarService();
  }



  /**
   * Recalculate dates for work packages in automatic scheduling mode
   * @param projectId - The project ID
   * @param changedWorkPackageIds - IDs of work packages whose dates changed
   * @returns Array of schedule updates that were applied
   */
  async recalculateSchedule(
    projectId: string,
    changedWorkPackageIds: string[]
  ): Promise<ScheduleUpdate[]> {
    if (!projectId) {
      throw new Error('Project ID is required');
    }

    if (!changedWorkPackageIds || changedWorkPackageIds.length === 0) {
      return [];
    }

    const updates: ScheduleUpdate[] = [];
    const processed = new Set<string>();
    const queue = [...changedWorkPackageIds];

    // Get work calendar for the project
    const calendar = await this.calendarService.getCalendarForProject(projectId);

    while (queue.length > 0) {
      const workPackageId = queue.shift()!;

      if (processed.has(workPackageId)) {
        continue;
      }

      processed.add(workPackageId);

      // Get all successor relations for this work package
      const relations = await this.relationRepository.findByFromId(workPackageId);

      for (const relation of relations) {
        // Only process successor relations
        if (relation.relationType !== RelationType.SUCCESSOR) {
          continue;
        }

        // Get the successor work package
        const successor = await this.workPackageRepository.findById(relation.toId);
        if (!successor) {
          continue;
        }

        // Skip if successor is in manual scheduling mode
        if (successor.schedulingMode === SchedulingMode.MANUAL) {
          continue;
        }

        // Get the predecessor work package
        const predecessor = await this.workPackageRepository.findById(relation.fromId);
        if (!predecessor || !predecessor.dueDate) {
          continue;
        }

        // Calculate new start date: predecessor due date + lag days + 1
        const lagDays = relation.lagDays || 0;
        let newStartDate = this.calendarService.addWorkingDays(
          predecessor.dueDate,
          lagDays + 1,
          calendar
        );

        // Calculate duration in working days
        const duration = successor.startDate && successor.dueDate
          ? this.calendarService.calculateWorkingDays(successor.startDate, successor.dueDate, calendar)
          : 0;

        // Calculate new due date: new start date + duration
        let newDueDate = duration > 0
          ? this.calendarService.addWorkingDays(newStartDate, duration - 1, calendar)
          : newStartDate;

        // Check if dates actually changed
        if (
          this.datesEqual(successor.startDate || null, newStartDate) &&
          this.datesEqual(successor.dueDate || null, newDueDate)
        ) {
          continue;
        }

        // Update the work package
        await this.workPackageRepository.update(successor.id, {
          startDate: newStartDate,
          dueDate: newDueDate,
        });

        // Record the update
        updates.push({
          workPackageId: successor.id,
          oldStartDate: successor.startDate || null,
          newStartDate: newStartDate,
          oldDueDate: successor.dueDate || null,
          newDueDate: newDueDate,
          reason: `Predecessor ${predecessor.subject} due date changed`,
        });

        // Add successor to queue for cascading updates
        queue.push(successor.id);
      }
    }

    return updates;
  }

  /**
   * Detect circular dependencies in work package relations
   * @param projectId - The project ID
   * @returns Array of circular dependency cycles found
   */
  async detectCircularDependencies(projectId: string): Promise<CircularDependency[]> {
    if (!projectId) {
      throw new Error('Project ID is required');
    }

    // Get all work packages in the project
    const { workPackages } = await this.workPackageRepository.findAll({
      projectId,
      page: 1,
      perPage: 10000,
    });

    const cycles: CircularDependency[] = [];
    const visited = new Set<string>();
    const recursionStack = new Set<string>();
    const pathRelations: WorkPackageRelation[] = [];

    // DFS to detect cycles
    const detectCycle = async (workPackageId: string): Promise<boolean> => {
      visited.add(workPackageId);
      recursionStack.add(workPackageId);

      // Get all successor relations
      const relations = await this.relationRepository.findByFromId(workPackageId);

      for (const relation of relations) {
        // Only check successor relations for cycles
        if (relation.relationType !== RelationType.SUCCESSOR) {
          continue;
        }

        pathRelations.push(relation);

        if (!visited.has(relation.toId)) {
          // Recursively check successor
          if (await detectCycle(relation.toId)) {
            return true;
          }
        } else if (recursionStack.has(relation.toId)) {
          // Found a cycle!
          const cycleStartIndex = pathRelations.findIndex((r) => r.fromId === relation.toId);
          const cycleRelations = pathRelations.slice(cycleStartIndex);
          const cycleWorkPackageIds = [
            ...new Set([
              ...cycleRelations.map((r) => r.fromId),
              ...cycleRelations.map((r) => r.toId),
            ]),
          ];

          cycles.push({
            workPackageIds: cycleWorkPackageIds,
            relationChain: cycleRelations,
          });

          return true;
        }

        pathRelations.pop();
      }

      recursionStack.delete(workPackageId);
      return false;
    };

    // Check each work package
    for (const workPackage of workPackages) {
      if (!visited.has(workPackage.id)) {
        await detectCycle(workPackage.id);
      }
    }

    return cycles;
  }

  /**
   * Check if two dates are equal (ignoring time)
   */
  private datesEqual(date1: Date | null, date2: Date | null): boolean {
    if (date1 === null && date2 === null) {
      return true;
    }

    if (date1 === null || date2 === null) {
      return false;
    }

    const d1 = new Date(date1);
    const d2 = new Date(date2);

    d1.setHours(0, 0, 0, 0);
    d2.setHours(0, 0, 0, 0);

    return d1.getTime() === d2.getTime();
  }
}

export const createSchedulingService = (): SchedulingService => {
  return new SchedulingService();
};
