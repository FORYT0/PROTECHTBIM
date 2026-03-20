import ical, {
  ICalCalendar,
  ICalEventData,
  ICalEventStatus,
  ICalAttendeeRole,
  ICalAttendeeStatus,
} from 'ical-generator';
import { WorkPackage } from '../entities/WorkPackage';
import {
  WorkPackageRepository,
  createWorkPackageRepository,
} from '../repositories/WorkPackageRepository';
import { ProjectRepository, createProjectRepository } from '../repositories/ProjectRepository';

export interface ICalendarOptions {
  projectId: string;
  baseUrl: string;
}

export class ICalendarService {
  private workPackageRepository: WorkPackageRepository;
  private projectRepository: ProjectRepository;

  constructor(
    workPackageRepository?: WorkPackageRepository,
    projectRepository?: ProjectRepository
  ) {
    this.workPackageRepository = workPackageRepository || createWorkPackageRepository();
    this.projectRepository = projectRepository || createProjectRepository();
  }

  /**
   * Generate iCalendar feed for a project
   * Creates an ICS file with all work packages as calendar events
   */
  async generateProjectCalendar(options: ICalendarOptions): Promise<string> {
    const { projectId, baseUrl } = options;

    // Verify project exists
    const project = await this.projectRepository.findById(projectId);
    if (!project) {
      throw new Error('Project not found');
    }

    // Get all work packages for the project
    const { workPackages } = await this.workPackageRepository.findAll({
      projectId,
      perPage: 10000, // Get all work packages
    });

    // Create calendar
    const calendar = ical({
      name: `${project.name} - Work Packages`,
      description: project.description || `Work packages for project ${project.name}`,
      prodId: {
        company: 'PROTECHT BIM',
        product: 'Project Management',
      },
      timezone: 'UTC',
    });

    // Add work packages as events
    for (const wp of workPackages) {
      this.addWorkPackageToCalendar(calendar, wp, baseUrl);
    }

    return calendar.toString();
  }

  /**
   * Add a work package as a calendar event
   */
  private addWorkPackageToCalendar(
    calendar: ICalCalendar,
    workPackage: WorkPackage,
    baseUrl: string
  ): void {
    // Skip work packages without dates
    if (!workPackage.startDate && !workPackage.dueDate) {
      return;
    }

    // Determine event dates
    let start: Date;
    let end: Date;

    if (workPackage.type === 'milestone') {
      // Milestones are all-day events on the due date
      if (!workPackage.dueDate) return;
      start = new Date(workPackage.dueDate);
      end = new Date(workPackage.dueDate);
    } else {
      // Tasks and other types span from start to due date
      start = workPackage.startDate
        ? new Date(workPackage.startDate)
        : workPackage.dueDate
        ? new Date(workPackage.dueDate)
        : new Date();

      end = workPackage.dueDate
        ? new Date(workPackage.dueDate)
        : workPackage.startDate
        ? new Date(workPackage.startDate)
        : new Date();
    }

    // Build event description
    const descriptionParts: string[] = [];

    if (workPackage.description) {
      descriptionParts.push(workPackage.description);
      descriptionParts.push('');
    }

    descriptionParts.push(`Type: ${workPackage.type}`);
    descriptionParts.push(`Status: ${workPackage.status}`);
    descriptionParts.push(`Priority: ${workPackage.priority}`);

    if (workPackage.progressPercent !== undefined) {
      descriptionParts.push(`Progress: ${workPackage.progressPercent}%`);
    }

    if (workPackage.estimatedHours) {
      descriptionParts.push(`Estimated Hours: ${workPackage.estimatedHours}`);
    }

    if (workPackage.spentHours) {
      descriptionParts.push(`Spent Hours: ${workPackage.spentHours}`);
    }

    if (workPackage.assignee) {
      descriptionParts.push(`Assignee: ${workPackage.assignee.name || workPackage.assignee.email}`);
    }

    descriptionParts.push('');
    descriptionParts.push(`View in PROTECHT BIM: ${baseUrl}/work-packages/${workPackage.id}`);

    // Create event data
    const eventData: ICalEventData = {
      id: workPackage.id,
      start,
      end,
      summary: `[${workPackage.type.toUpperCase()}] ${workPackage.subject}`,
      description: descriptionParts.join('\n'),
      url: `${baseUrl}/work-packages/${workPackage.id}`,
      created: workPackage.createdAt,
      lastModified: workPackage.updatedAt,
      allDay: workPackage.type === 'milestone',
    };

    // Add location if there's a parent work package
    if (workPackage.parentId) {
      eventData.location = `Parent: ${workPackage.parentId}`;
    }

    // Add categories based on status and priority
    eventData.categories = [
      { name: workPackage.type },
      { name: workPackage.status },
    ];
    if (workPackage.priority === 'high' || workPackage.priority === 'urgent') {
      eventData.categories.push({ name: 'Important' });
    }

    // Set status based on work package status
    if (workPackage.status === 'closed' || workPackage.status === 'completed') {
      eventData.status = ICalEventStatus.CONFIRMED;
    } else if (workPackage.status === 'cancelled') {
      eventData.status = ICalEventStatus.CANCELLED;
    } else {
      eventData.status = ICalEventStatus.TENTATIVE;
    }

    // Add organizer if there's an accountable person
    if (workPackage.accountable) {
      eventData.organizer = {
        name: workPackage.accountable.name || workPackage.accountable.email,
        email: workPackage.accountable.email,
      };
    }

    // Add attendee if there's an assignee
    if (workPackage.assignee) {
      eventData.attendees = [
        {
          name: workPackage.assignee.name || workPackage.assignee.email,
          email: workPackage.assignee.email,
          role: ICalAttendeeRole.REQ,
          status: ICalAttendeeStatus.ACCEPTED,
        },
      ];
    }

    calendar.createEvent(eventData);
  }

  /**
   * Generate iCalendar feed for a specific user's assigned work packages
   */
  async generateUserCalendar(userId: string, baseUrl: string): Promise<string> {
    // Get all work packages assigned to the user
    const { workPackages } = await this.workPackageRepository.findAll({
      assigneeId: userId,
      perPage: 10000,
    });

    // Create calendar
    const calendar = ical({
      name: 'My Work Packages',
      description: 'Work packages assigned to me',
      prodId: {
        company: 'PROTECHT BIM',
        product: 'Project Management',
      },
      timezone: 'UTC',
    });

    // Add work packages as events
    for (const wp of workPackages) {
      this.addWorkPackageToCalendar(calendar, wp, baseUrl);
    }

    return calendar.toString();
  }
}

export const createICalendarService = (): ICalendarService => {
  return new ICalendarService();
};
