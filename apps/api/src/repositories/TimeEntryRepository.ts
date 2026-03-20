import { Repository } from 'typeorm';
import { AppDataSource } from '../config/data-source';
import { TimeEntry } from '../entities/TimeEntry';

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

export interface TimeEntryListResult {
  timeEntries: TimeEntry[];
  total: number;
  page: number;
  perPage: number;
}

export class TimeEntryRepository {
  private repository: Repository<TimeEntry>;

  constructor() {
    this.repository = AppDataSource.getRepository(TimeEntry);
  }

  async create(timeEntryData: Partial<TimeEntry>): Promise<TimeEntry> {
    // Validate hours is positive
    if (timeEntryData.hours !== undefined && timeEntryData.hours <= 0) {
      throw new Error('Hours must be a positive number');
    }

    const timeEntry = this.repository.create(timeEntryData);
    return await this.repository.save(timeEntry);
  }

  async findById(id: string): Promise<TimeEntry | null> {
    return await this.repository.findOne({
      where: { id },
      relations: ['workPackage', 'user'],
    });
  }

  async findAll(filters: TimeEntryFilters = {}): Promise<TimeEntryListResult> {
    const {
      workPackageId,
      userId,
      dateFrom,
      dateTo,
      billable,
      page = 1,
      perPage = 20,
      sortBy = 'date',
      sortOrder = 'DESC',
    } = filters;

    const queryBuilder = this.repository
      .createQueryBuilder('time_entry')
      .leftJoinAndSelect('time_entry.workPackage', 'workPackage')
      .leftJoinAndSelect('time_entry.user', 'user');

    // Apply filters
    if (workPackageId) {
      queryBuilder.andWhere('time_entry.workPackageId = :workPackageId', { workPackageId });
    }

    if (userId) {
      queryBuilder.andWhere('time_entry.userId = :userId', { userId });
    }

    if (dateFrom) {
      queryBuilder.andWhere('time_entry.date >= :dateFrom', { dateFrom });
    }

    if (dateTo) {
      queryBuilder.andWhere('time_entry.date <= :dateTo', { dateTo });
    }

    if (billable !== undefined) {
      queryBuilder.andWhere('time_entry.billable = :billable', { billable });
    }

    // Apply sorting
    const sortField = `time_entry.${sortBy}`;
    queryBuilder.orderBy(sortField, sortOrder);

    // Apply pagination
    const skip = (page - 1) * perPage;
    queryBuilder.skip(skip).take(perPage);

    const [timeEntries, total] = await queryBuilder.getManyAndCount();

    return {
      timeEntries,
      total,
      page,
      perPage,
    };
  }

  async update(id: string, timeEntryData: Partial<TimeEntry>): Promise<TimeEntry | null> {
    // Validate hours is positive if being updated
    if (timeEntryData.hours !== undefined && timeEntryData.hours <= 0) {
      throw new Error('Hours must be a positive number');
    }

    await this.repository.update(id, timeEntryData);
    return await this.findById(id);
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.repository.delete(id);
    return (result.affected ?? 0) > 0;
  }

  async exists(id: string): Promise<boolean> {
    const count = await this.repository.count({ where: { id } });
    return count > 0;
  }

  /**
   * Calculate total hours for a work package
   */
  async getTotalHoursByWorkPackage(workPackageId: string): Promise<number> {
    const result = await this.repository
      .createQueryBuilder('time_entry')
      .select('SUM(time_entry.hours)', 'total')
      .where('time_entry.workPackageId = :workPackageId', { workPackageId })
      .getRawOne();

    return parseFloat(result?.total || '0');
  }

  /**
   * Calculate total hours for a user within a date range
   */
  async getTotalHoursByUser(
    userId: string,
    dateFrom?: Date,
    dateTo?: Date
  ): Promise<number> {
    const queryBuilder = this.repository
      .createQueryBuilder('time_entry')
      .select('SUM(time_entry.hours)', 'total')
      .where('time_entry.userId = :userId', { userId });

    if (dateFrom) {
      queryBuilder.andWhere('time_entry.date >= :dateFrom', { dateFrom });
    }

    if (dateTo) {
      queryBuilder.andWhere('time_entry.date <= :dateTo', { dateTo });
    }

    const result = await queryBuilder.getRawOne();
    return parseFloat(result?.total || '0');
  }
}

export const createTimeEntryRepository = (): TimeEntryRepository => {
  return new TimeEntryRepository();
};
