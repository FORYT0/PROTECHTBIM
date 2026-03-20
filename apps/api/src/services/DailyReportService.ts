import { AppDataSource } from '../config/data-source';
import { DailyReport } from '../entities/DailyReport';
import { DelayEvent, DelayType, ResponsibleParty, DelayStatus } from '../entities/DelayEvent';
import { TimeEntry } from '../entities/TimeEntry';
import { ActivityLog, ActivityActionType, ActivityEntityType } from '../entities/ActivityLog';
import { RealtimeEventService, RealtimeEventType } from './RealtimeEventService';

export interface CreateDailyReportDTO {
  projectId: string;
  reportDate: Date;
  weather?: string;
  temperature?: number;
  manpowerCount?: number;
  equipmentCount?: number;
  workCompleted?: string;
  workPlannedTomorrow?: string;
  delays?: string;
  safetyIncidents?: string;
  siteNotes?: string;
  visitorsOnSite?: string;
  materialsDelivered?: string;
}

export interface CreateDelayEventDTO {
  dailyReportId?: string;
  projectId: string;
  delayType: DelayType;
  description: string;
  estimatedImpactDays?: number;
  costImpact?: number;
  responsibleParty: ResponsibleParty;
  mitigationAction?: string;
}

export class DailyReportService {
  private realtimeService: RealtimeEventService;

  constructor() {
    this.realtimeService = new RealtimeEventService();
  }

  private get dailyReportRepository() {
    return AppDataSource.getRepository(DailyReport);
  }

  private get delayEventRepository() {
    return AppDataSource.getRepository(DelayEvent);
  }

  private get timeEntryRepository() {
    return AppDataSource.getRepository(TimeEntry);
  }

  private get activityLogRepository() {
    return AppDataSource.getRepository(ActivityLog);
  }

  async getAllDailyReports(): Promise<DailyReport[]> {
    return await this.dailyReportRepository.find({
      relations: ['project', 'creator'],
      order: { reportDate: 'DESC' },
    });
  }

  async createDailyReport(data: CreateDailyReportDTO, userId: string): Promise<DailyReport> {
    // Validation
    if (!data.projectId || !data.reportDate) {
      throw new Error('Project ID and report date are required');
    }

    // Check if report already exists for this date
    const existing = await this.dailyReportRepository.findOne({
      where: {
        projectId: data.projectId,
        reportDate: data.reportDate,
      },
    });

    if (existing) {
      throw new Error('Daily report already exists for this date');
    }

    // Auto-populate manpower count from time entries if not provided
    let manpowerCount = data.manpowerCount;
    if (manpowerCount === undefined || manpowerCount === null) {
      manpowerCount = await this.getManpowerCountForDate(data.projectId, data.reportDate);
    }

    // Create daily report
    const dailyReport = this.dailyReportRepository.create({
      projectId: data.projectId,
      reportDate: data.reportDate,
      weather: data.weather || null,
      temperature: data.temperature || null,
      manpowerCount,
      equipmentCount: data.equipmentCount || 0,
      workCompleted: data.workCompleted || null,
      workPlannedTomorrow: data.workPlannedTomorrow || null,
      delays: data.delays || null,
      safetyIncidents: data.safetyIncidents || null,
      siteNotes: data.siteNotes || null,
      visitorsOnSite: data.visitorsOnSite || null,
      materialsDelivered: data.materialsDelivered || null,
      createdBy: userId,
    });

    const saved = await this.dailyReportRepository.save(dailyReport);

    // Log activity
    await this.activityLogRepository.save({
      projectId: saved.projectId,
      userId,
      actionType: ActivityActionType.CREATED,
      entityType: ActivityEntityType.PROJECT,
      entityId: saved.id,
      description: `created daily report for ${saved.reportDate.toISOString().split('T')[0]}`,
      metadata: {
        reportDate: saved.reportDate,
        manpowerCount: saved.manpowerCount,
      },
    });

    // Emit real-time event
    this.realtimeService.emitDailyReportEvent(
      RealtimeEventType.DAILY_REPORT_CREATED,
      saved.projectId,
      saved.id,
      {
        reportDate: saved.reportDate,
        manpowerCount: saved.manpowerCount,
      }
    );

    return saved;
  }

  async updateDailyReport(
    id: string,
    data: Partial<CreateDailyReportDTO>,
    userId: string
  ): Promise<DailyReport> {
    const report = await this.getDailyReportById(id);

    if (!report) {
      throw new Error('Daily report not found');
    }

    // Update fields
    if (data.weather !== undefined) report.weather = data.weather;
    if (data.temperature !== undefined) report.temperature = data.temperature;
    if (data.manpowerCount !== undefined) report.manpowerCount = data.manpowerCount;
    if (data.equipmentCount !== undefined) report.equipmentCount = data.equipmentCount;
    if (data.workCompleted !== undefined) report.workCompleted = data.workCompleted;
    if (data.workPlannedTomorrow !== undefined) report.workPlannedTomorrow = data.workPlannedTomorrow;
    if (data.delays !== undefined) report.delays = data.delays;
    if (data.safetyIncidents !== undefined) report.safetyIncidents = data.safetyIncidents;
    if (data.siteNotes !== undefined) report.siteNotes = data.siteNotes;
    if (data.visitorsOnSite !== undefined) report.visitorsOnSite = data.visitorsOnSite;
    if (data.materialsDelivered !== undefined) report.materialsDelivered = data.materialsDelivered;

    const updated = await this.dailyReportRepository.save(report);

    // Log activity
    await this.activityLogRepository.save({
      projectId: updated.projectId,
      userId,
      actionType: ActivityActionType.UPDATED,
      entityType: ActivityEntityType.PROJECT,
      entityId: updated.id,
      description: `updated daily report for ${updated.reportDate.toISOString().split('T')[0]}`,
      metadata: {
        changes: data,
      },
    });

    // Emit real-time event
    this.realtimeService.emitDailyReportEvent(
      RealtimeEventType.DAILY_REPORT_UPDATED,
      updated.projectId,
      updated.id,
      {
        action: 'daily_report_updated',
      }
    );

    return updated;
  }

  async createDelayEvent(data: CreateDelayEventDTO, userId: string): Promise<DelayEvent> {
    // Validation
    if (!data.projectId || !data.delayType || !data.description) {
      throw new Error('Project ID, delay type, and description are required');
    }

    // Create delay event
    const delayEvent = this.delayEventRepository.create({
      dailyReportId: data.dailyReportId || null,
      projectId: data.projectId,
      delayType: data.delayType,
      description: data.description,
      estimatedImpactDays: data.estimatedImpactDays || 0,
      costImpact: data.costImpact || 0,
      responsibleParty: data.responsibleParty,
      status: DelayStatus.LOGGED,
      mitigationAction: data.mitigationAction || null,
      createdBy: userId,
    });

    const saved = await this.delayEventRepository.save(delayEvent);

    // Log activity
    await this.activityLogRepository.save({
      projectId: saved.projectId,
      userId,
      actionType: ActivityActionType.CREATED,
      entityType: ActivityEntityType.PROJECT,
      entityId: saved.id,
      description: `logged delay event: ${saved.delayType}`,
      metadata: {
        delayType: saved.delayType,
        estimatedImpactDays: saved.estimatedImpactDays,
        costImpact: saved.costImpact,
        responsibleParty: saved.responsibleParty,
      },
    });

    // Emit real-time event
    this.realtimeService.emitProjectEvent(
      RealtimeEventType.PROJECT_UPDATED,
      saved.projectId,
      {
        delayEventId: saved.id,
        delayType: saved.delayType,
        action: 'delay_event_created',
      }
    );

    return saved;
  }

  async getDailyReportById(id: string): Promise<DailyReport | null> {
    return await this.dailyReportRepository.findOne({
      where: { id },
      relations: ['project', 'creator'],
    });
  }

  async getDailyReportsByProject(projectId: string): Promise<DailyReport[]> {
    return await this.dailyReportRepository.find({
      where: { projectId },
      relations: ['creator'],
      order: { reportDate: 'DESC' },
    });
  }

  async getDailyReportByDate(projectId: string, reportDate: Date): Promise<DailyReport | null> {
    return await this.dailyReportRepository.findOne({
      where: { projectId, reportDate },
      relations: ['creator'],
    });
  }

  async getDelayEventsByProject(projectId: string): Promise<DelayEvent[]> {
    return await this.delayEventRepository.find({
      where: { projectId },
      relations: ['dailyReport', 'creator'],
      order: { createdAt: 'DESC' },
    });
  }

  async getDelayEventsByDailyReport(dailyReportId: string): Promise<DelayEvent[]> {
    return await this.delayEventRepository.find({
      where: { dailyReportId },
      relations: ['creator'],
      order: { createdAt: 'ASC' },
    });
  }

  private async getManpowerCountForDate(projectId: string, date: Date): Promise<number> {
    const result = await this.timeEntryRepository
      .createQueryBuilder('te')
      .select('COUNT(DISTINCT te.userId)', 'count')
      .innerJoin('te.workPackage', 'wp')
      .where('wp.projectId = :projectId', { projectId })
      .andWhere('te.date = :date', { date })
      .getRawOne();

    return parseInt(result?.count || '0', 10);
  }

  async getDelayMetrics(projectId: string) {
    const delays = await this.getDelayEventsByProject(projectId);

    const metrics = {
      total: delays.length,
      byType: {} as Record<string, number>,
      byResponsibleParty: {} as Record<string, number>,
      totalImpactDays: 0,
      totalCostImpact: 0,
      byStatus: {
        logged: 0,
        underReview: 0,
        approved: 0,
        rejected: 0,
      },
    };

    delays.forEach((delay) => {
      // By type
      metrics.byType[delay.delayType] = (metrics.byType[delay.delayType] || 0) + 1;

      // By responsible party
      metrics.byResponsibleParty[delay.responsibleParty] =
        (metrics.byResponsibleParty[delay.responsibleParty] || 0) + 1;

      // Totals
      metrics.totalImpactDays += delay.estimatedImpactDays;
      metrics.totalCostImpact += delay.costImpact;

      // By status
      switch (delay.status) {
        case DelayStatus.LOGGED:
          metrics.byStatus.logged++;
          break;
        case DelayStatus.UNDER_REVIEW:
          metrics.byStatus.underReview++;
          break;
        case DelayStatus.APPROVED:
          metrics.byStatus.approved++;
          break;
        case DelayStatus.REJECTED:
          metrics.byStatus.rejected++;
          break;
      }
    });

    return metrics;
  }

  async getDailyReportCompletionRate(projectId: string, startDate: Date, endDate: Date): Promise<number> {
    const totalDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));

    const reportCount = await this.dailyReportRepository.count({
      where: {
        projectId,
      },
    });

    return totalDays > 0 ? (reportCount / totalDays) * 100 : 0;
  }
}

export const createDailyReportService = (): DailyReportService => {
  return new DailyReportService();
};
