import { Repository, In } from 'typeorm';
import { AppDataSource } from '../config/data-source';
import { WorkPackage, WorkPackageType } from '../entities/WorkPackage';

export interface WorkPackageFilters {
  projectId?: string;
  type?: WorkPackageType[];
  status?: string[];
  assigneeId?: string;
  parentId?: string;
  priority?: string[];
  sprintId?: string | null; // null means not in any sprint (backlog)
  startDateFrom?: Date;
  startDateTo?: Date;
  dueDateFrom?: Date;
  dueDateTo?: Date;
  customFields?: Record<string, any>;
  search?: string;
  page?: number;
  perPage?: number;
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC';
}

export interface WorkPackageListResult {
  workPackages: WorkPackage[];
  total: number;
  page: number;
  perPage: number;
}

export class WorkPackageRepository {
  private repository: Repository<WorkPackage>;

  constructor() {
    this.repository = AppDataSource.getRepository(WorkPackage);
  }

  async create(workPackageData: Partial<WorkPackage>): Promise<WorkPackage> {
    const workPackage = this.repository.create(workPackageData);
    return await this.repository.save(workPackage);
  }

  async findById(id: string): Promise<WorkPackage | null> {
    return await this.repository.findOne({
      where: { id },
      relations: ['project', 'assignee', 'accountable', 'parent', 'watchers', 'watchers.user'],
    });
  }

  async findAll(filters: WorkPackageFilters = {}): Promise<WorkPackageListResult> {
    const {
      projectId,
      type,
      status,
      assigneeId,
      parentId,
      priority,
      startDateFrom,
      startDateTo,
      dueDateFrom,
      dueDateTo,
      customFields,
      search,
      page = 1,
      perPage = 20,
      sortBy = 'createdAt',
      sortOrder = 'DESC',
    } = filters;

    const queryBuilder = this.repository
      .createQueryBuilder('work_package')
      .leftJoinAndSelect('work_package.project', 'project')
      .leftJoinAndSelect('work_package.assignee', 'assignee')
      .leftJoinAndSelect('work_package.accountable', 'accountable')
      .leftJoinAndSelect('work_package.parent', 'parent')
      .leftJoinAndSelect('work_package.watchers', 'watchers')
      .leftJoinAndSelect('watchers.user', 'watcher_user');

    // Apply filters
    if (projectId) {
      queryBuilder.andWhere('work_package.projectId = :projectId', { projectId });
    }

    if (type && type.length > 0) {
      queryBuilder.andWhere('work_package.type IN (:...type)', { type });
    }

    if (status && status.length > 0) {
      queryBuilder.andWhere('work_package.status IN (:...status)', { status });
    }

    if (assigneeId) {
      queryBuilder.andWhere('work_package.assigneeId = :assigneeId', { assigneeId });
    }

    if (parentId !== undefined) {
      if (parentId === null || parentId === 'null') {
        queryBuilder.andWhere('work_package.parentId IS NULL');
      } else {
        queryBuilder.andWhere('work_package.parentId = :parentId', { parentId });
      }
    }

    // Sprint filtering (null means backlog items)
    if (filters.sprintId !== undefined) {
      if (filters.sprintId === null) {
        queryBuilder.andWhere('work_package.sprintId IS NULL');
      } else {
        queryBuilder.andWhere('work_package.sprintId = :sprintId', { sprintId: filters.sprintId });
      }
    }

    // Priority filtering
    if (priority && priority.length > 0) {
      queryBuilder.andWhere('work_package.priority IN (:...priority)', { priority });
    }

    // Date range filtering
    if (startDateFrom) {
      queryBuilder.andWhere('work_package.startDate >= :startDateFrom', { startDateFrom });
    }

    if (startDateTo) {
      queryBuilder.andWhere('work_package.startDate <= :startDateTo', { startDateTo });
    }

    if (dueDateFrom) {
      queryBuilder.andWhere('work_package.dueDate >= :dueDateFrom', { dueDateFrom });
    }

    if (dueDateTo) {
      queryBuilder.andWhere('work_package.dueDate <= :dueDateTo', { dueDateTo });
    }

    // Custom field filtering
    if (customFields && Object.keys(customFields).length > 0) {
      Object.entries(customFields).forEach(([key, value], index) => {
        const paramName = `customField${index}`;
        if (value === null) {
          queryBuilder.andWhere(
            `(work_package.customFields->>'${key}' IS NULL OR work_package.customFields->>'${key}' = 'null')`
          );
        } else if (Array.isArray(value)) {
          // Support array values for multi-select custom fields
          queryBuilder.andWhere(
            `work_package.customFields->>'${key}' IN (:...${paramName})`,
            { [paramName]: value }
          );
        } else {
          queryBuilder.andWhere(
            `work_package.customFields->>'${key}' = :${paramName}`,
            { [paramName]: String(value) }
          );
        }
      });
    }

    // Full-text search on subject and description
    if (search) {
      queryBuilder.andWhere(
        '(work_package.subject ILIKE :search OR work_package.description ILIKE :search)',
        { search: `%${search}%` }
      );
    }

    // Apply sorting
    const sortField = `work_package.${sortBy}`;
    queryBuilder.orderBy(sortField, sortOrder);

    // Apply pagination
    const skip = (page - 1) * perPage;
    queryBuilder.skip(skip).take(perPage);

    const [workPackages, total] = await queryBuilder.getManyAndCount();

    return {
      workPackages,
      total,
      page,
      perPage,
    };
  }

  async update(id: string, workPackageData: Partial<WorkPackage>): Promise<WorkPackage | null> {
    await this.repository.update(id, workPackageData);
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

  async findByIds(ids: string[]): Promise<WorkPackage[]> {
    if (ids.length === 0) {
      return [];
    }
    return await this.repository.find({
      where: { id: In(ids) },
    });
  }
}

export const createWorkPackageRepository = (): WorkPackageRepository => {
  return new WorkPackageRepository();
};
