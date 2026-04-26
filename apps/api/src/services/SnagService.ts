import { AppDataSource } from '../config/data-source';
import { Snag, SnagSeverity, SnagCategory, SnagStatus } from '../entities/Snag';
import { ActivityLog, ActivityActionType, ActivityEntityType } from '../entities/ActivityLog';
import { RealtimeEventService, RealtimeEventType } from './RealtimeEventService';

export interface CreateSnagDTO {
  projectId: string;
  workPackageId?: string;
  location: string;
  description: string;
  severity: SnagSeverity;
  category: SnagCategory;
  assignedTo?: string;
  dueDate?: Date;
  costImpact?: number;
  photoUrls?: string[];
}

export interface UpdateSnagDTO {
  location?: string;
  description?: string;
  severity?: SnagSeverity;
  category?: SnagCategory;
  assignedTo?: string;
  dueDate?: Date;
  costImpact?: number;
  rectificationCost?: number;
  photoUrls?: string[];
}

export class SnagService {
  private realtimeService: RealtimeEventService;

  constructor() {
    this.realtimeService = new RealtimeEventService();
  }

  private get snagRepository() {
    return AppDataSource.getRepository(Snag);
  }

  private get activityLogRepository() {
    return AppDataSource.getRepository(ActivityLog);
  }

  async getAllSnags(): Promise<Snag[]> {
    return await this.snagRepository.find({
      relations: ['project', 'workPackage', 'creator', 'assignee'],
      order: { createdAt: 'DESC' },
    });
  }

  async createSnag(data: CreateSnagDTO, userId: string): Promise<Snag> {
    // Validation
    if (!data.projectId || !data.location || !data.description) {
      throw new Error('Project ID, location, and description are required');
    }

    // Create snag
    const snag = this.snagRepository.create({
      projectId: data.projectId,
      workPackageId: data.workPackageId || null,
      location: data.location,
      description: data.description,
      severity: data.severity,
      category: data.category,
      assignedTo: data.assignedTo || null,
      dueDate: data.dueDate || null,
      status: SnagStatus.OPEN,
      costImpact: data.costImpact || 0,
      rectificationCost: 0,
      photoUrls: data.photoUrls || null,
      createdBy: userId,
    });

    const saved = await this.snagRepository.save(snag);

    // Log activity
    await this.activityLogRepository.save({
      projectId: saved.projectId,
      userId,
      actionType: ActivityActionType.CREATED,
      entityType: ActivityEntityType.PROJECT,
      entityId: saved.id,
      description: `created snag: ${saved.location}`,
      metadata: {
        location: saved.location,
        severity: saved.severity,
        category: saved.category,
      },
    });

    // Emit real-time event
    this.realtimeService.emitSnagEvent(
      RealtimeEventType.SNAG_CREATED,
      saved.projectId,
      saved.id,
      {
        location: saved.location,
        severity: saved.severity,
      }
    );

    return saved;
  }

  async updateSnag(id: string, data: UpdateSnagDTO, userId: string): Promise<Snag> {
    const snag = await this.getSnagById(id);

    if (!snag) {
      throw new Error('Snag not found');
    }

    // Update fields
    if (data.location !== undefined) snag.location = data.location;
    if (data.description !== undefined) snag.description = data.description;
    if (data.severity !== undefined) snag.severity = data.severity;
    if (data.category !== undefined) snag.category = data.category;
    if (data.assignedTo !== undefined) snag.assignedTo = data.assignedTo;
    if (data.dueDate !== undefined) snag.dueDate = data.dueDate;
    if (data.costImpact !== undefined) snag.costImpact = data.costImpact;
    if (data.rectificationCost !== undefined) snag.rectificationCost = data.rectificationCost;
    if (data.photoUrls !== undefined) snag.photoUrls = data.photoUrls;

    const updated = await this.snagRepository.save(snag);

    // Log activity
    await this.activityLogRepository.save({
      projectId: updated.projectId,
      userId,
      actionType: ActivityActionType.UPDATED,
      entityType: ActivityEntityType.PROJECT,
      entityId: updated.id,
      description: `updated snag: ${updated.location}`,
      metadata: {
        changes: data,
      },
    });

    // Emit real-time event
    this.realtimeService.emitSnagEvent(
      RealtimeEventType.SNAG_UPDATED,
      updated.projectId,
      updated.id,
      {
        action: 'snag_updated',
      }
    );

    return updated;
  }

  async assignSnag(id: string, assignedTo: string, userId: string): Promise<Snag> {
    const snag = await this.getSnagById(id);

    if (!snag) {
      throw new Error('Snag not found');
    }

    snag.assignedTo = assignedTo;

    if (snag.status === SnagStatus.OPEN) {
      snag.status = SnagStatus.IN_PROGRESS;
    }

    const updated = await this.snagRepository.save(snag);

    // Log activity
    await this.activityLogRepository.save({
      projectId: updated.projectId,
      userId,
      actionType: ActivityActionType.ASSIGNED,
      entityType: ActivityEntityType.PROJECT,
      entityId: updated.id,
      description: `assigned snag: ${updated.location}`,
      metadata: {
        assignedTo,
      },
    });

    // Emit real-time event
    this.realtimeService.emitSnagEvent(
      RealtimeEventType.SNAG_UPDATED,
      updated.projectId,
      updated.id,
      {
        action: 'snag_assigned',
        assignedTo,
      }
    );

    return updated;
  }

  async resolveSnag(id: string, userId: string, rectificationCost?: number): Promise<Snag> {
    const snag = await this.getSnagById(id);

    if (!snag) {
      throw new Error('Snag not found');
    }

    if (snag.status === SnagStatus.CLOSED || snag.status === SnagStatus.VERIFIED) {
      throw new Error('Snag is already closed or verified');
    }

    snag.status = SnagStatus.RESOLVED;
    snag.resolvedBy = userId;
    snag.resolvedAt = new Date();

    if (rectificationCost !== undefined) {
      snag.rectificationCost = rectificationCost;
    }

    const updated = await this.snagRepository.save(snag);

    // Log activity
    await this.activityLogRepository.save({
      projectId: updated.projectId,
      userId,
      actionType: ActivityActionType.UPDATED,
      entityType: ActivityEntityType.PROJECT,
      entityId: updated.id,
      description: `resolved snag: ${updated.location}`,
      metadata: {
        rectificationCost: updated.rectificationCost,
      },
    });

    // Emit real-time event
    this.realtimeService.emitSnagEvent(
      RealtimeEventType.SNAG_RESOLVED,
      updated.projectId,
      updated.id,
      {
        action: 'snag_resolved',
      }
    );

    return updated;
  }

  async verifySnag(id: string, userId: string): Promise<Snag> {
    const snag = await this.getSnagById(id);

    if (!snag) {
      throw new Error('Snag not found');
    }

    if (snag.status !== SnagStatus.RESOLVED) {
      throw new Error('Only resolved snags can be verified');
    }

    snag.status = SnagStatus.VERIFIED;
    snag.verifiedBy = userId;
    snag.verifiedAt = new Date();

    const updated = await this.snagRepository.save(snag);

    // Log activity
    await this.activityLogRepository.save({
      projectId: updated.projectId,
      userId,
      actionType: ActivityActionType.UPDATED,
      entityType: ActivityEntityType.PROJECT,
      entityId: updated.id,
      description: `verified snag: ${updated.location}`,
      metadata: {},
    });

    // Emit real-time event
    this.realtimeService.emitSnagEvent(
      RealtimeEventType.SNAG_UPDATED,
      updated.projectId,
      updated.id,
      {
        action: 'snag_verified',
      }
    );

    return updated;
  }

  async closeSnag(id: string, userId: string): Promise<Snag> {
    const snag = await this.getSnagById(id);

    if (!snag) {
      throw new Error('Snag not found');
    }

    if (snag.status !== SnagStatus.VERIFIED) {
      throw new Error('Only verified snags can be closed');
    }

    snag.status = SnagStatus.CLOSED;

    const updated = await this.snagRepository.save(snag);

    // Log activity
    await this.activityLogRepository.save({
      projectId: updated.projectId,
      userId,
      actionType: ActivityActionType.UPDATED,
      entityType: ActivityEntityType.PROJECT,
      entityId: updated.id,
      description: `closed snag: ${updated.location}`,
      metadata: {},
    });

    // Emit real-time event
    this.realtimeService.emitSnagEvent(
      RealtimeEventType.SNAG_UPDATED,
      updated.projectId,
      updated.id,
      {
        action: 'snag_closed',
      }
    );

    return updated;
  }

  async getSnagById(id: string): Promise<Snag | null> {
    return await this.snagRepository.findOne({
      where: { id },
      relations: ['project', 'workPackage', 'assignee', 'creator', 'resolver', 'verifier'],
    });
  }

  async getSnagsByProject(projectId: string): Promise<Snag[]> {
    return await this.snagRepository.find({
      where: { projectId },
      order: { createdAt: 'DESC' },
    });
  }

  async getSnagsByWorkPackage(workPackageId: string): Promise<Snag[]> {
    return await this.snagRepository.find({
      where: { workPackageId },
      relations: ['assignee', 'creator'],
      order: { createdAt: 'DESC' },
    });
  }

  async getSnagsByStatus(projectId: string, status: SnagStatus): Promise<Snag[]> {
    return await this.snagRepository.find({
      where: { projectId, status },
      relations: ['workPackage', 'assignee'],
      order: { createdAt: 'DESC' },
    });
  }

  async getSnagMetrics(projectId: string) {
    const snags = await this.getSnagsByProject(projectId);

    const metrics = {
      total: snags.length,
      open: 0,
      inProgress: 0,
      resolved: 0,
      verified: 0,
      closed: 0,
      bySeverity: {
        minor: 0,
        major: 0,
        critical: 0,
      },
      byCategory: {} as Record<string, number>,
      totalCostImpact: 0,
      totalRectificationCost: 0,
      averageResolutionTime: 0,
    };

    let totalResolutionTime = 0;
    let resolvedCount = 0;

    snags.forEach((snag) => {
      // By status
      switch (snag.status) {
        case SnagStatus.OPEN:
          metrics.open++;
          break;
        case SnagStatus.IN_PROGRESS:
          metrics.inProgress++;
          break;
        case SnagStatus.RESOLVED:
          metrics.resolved++;
          break;
        case SnagStatus.VERIFIED:
          metrics.verified++;
          break;
        case SnagStatus.CLOSED:
          metrics.closed++;
          break;
      }

      // By severity
      switch (snag.severity) {
        case SnagSeverity.MINOR:
          metrics.bySeverity.minor++;
          break;
        case SnagSeverity.MAJOR:
          metrics.bySeverity.major++;
          break;
        case SnagSeverity.CRITICAL:
          metrics.bySeverity.critical++;
          break;
      }

      // By category
      metrics.byCategory[snag.category] = (metrics.byCategory[snag.category] || 0) + 1;

      // Costs
      metrics.totalCostImpact += snag.costImpact;
      metrics.totalRectificationCost += snag.rectificationCost;

      // Resolution time
      if (snag.resolvedAt) {
        const resolutionTime = snag.resolvedAt.getTime() - snag.createdAt.getTime();
        totalResolutionTime += resolutionTime;
        resolvedCount++;
      }
    });

    // Average resolution time in days
    if (resolvedCount > 0) {
      metrics.averageResolutionTime = totalResolutionTime / resolvedCount / (1000 * 60 * 60 * 24);
    }

    return metrics;
  }

  async deleteSnag(id: string, userId: string): Promise<boolean> {
    const snag = await this.getSnagById(id);

    if (!snag) {
      throw new Error('Snag not found');
    }

    // Log activity before deletion
    await this.activityLogRepository.save({
      projectId: snag.projectId,
      userId,
      actionType: ActivityActionType.DELETED,
      entityType: ActivityEntityType.PROJECT,
      entityId: id,
      description: `deleted snag: ${snag.location}`,
      metadata: {
        location: snag.location,
        severity: snag.severity,
      },
    });

    await this.snagRepository.remove(snag);

    // Emit real-time event
    this.realtimeService.emitSnagEvent(
      RealtimeEventType.SNAG_UPDATED, // We don't have SNAG_DELETED yet
      snag.projectId,
      id,
      {
        action: 'snag_deleted',
      }
    );

    return true;
  }
}

export const createSnagService = (): SnagService => {
  return new SnagService();
};
