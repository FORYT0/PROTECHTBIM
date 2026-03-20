import { Repository, FindOptionsWhere } from 'typeorm';
import { AppDataSource } from '../config/data-source';
import { Project, ProjectStatus } from '../entities/Project';

export interface ProjectFilters {
  portfolioId?: string;
  programId?: string;
  status?: ProjectStatus[];
  ownerId?: string;
  search?: string;
  page?: number;
  perPage?: number;
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC';
}

export interface ProjectListResult {
  projects: Project[];
  total: number;
  page: number;
  perPage: number;
}

export class ProjectRepository {
  private repository: Repository<Project>;

  constructor() {
    this.repository = AppDataSource.getRepository(Project);
  }

  async create(projectData: Partial<Project>): Promise<Project> {
    const project = this.repository.create(projectData);
    return await this.repository.save(project);
  }

  async findById(id: string): Promise<Project | null> {
    return await this.repository.findOne({
      where: { id },
      relations: ['owner', 'program', 'portfolio'],
    });
  }

  async findAll(filters: ProjectFilters = {}): Promise<ProjectListResult> {
    const {
      portfolioId,
      programId,
      status,
      ownerId,
      search,
      page = 1,
      perPage = 20,
      sortBy = 'createdAt',
      sortOrder = 'DESC',
    } = filters;

    const where: FindOptionsWhere<Project> = {};

    if (portfolioId) {
      where.portfolioId = portfolioId;
    }

    if (programId) {
      where.programId = programId;
    }

    if (status && status.length > 0) {
      // TypeORM doesn't support IN operator directly in FindOptionsWhere
      // We'll handle this with query builder below
    }

    if (ownerId) {
      where.ownerId = ownerId;
    }

    const queryBuilder = this.repository
      .createQueryBuilder('project')
      .leftJoinAndSelect('project.owner', 'owner')
      .leftJoinAndSelect('project.program', 'program')
      .leftJoinAndSelect('project.portfolio', 'portfolio');

    // Apply filters
    if (portfolioId) {
      queryBuilder.andWhere('project.portfolioId = :portfolioId', { portfolioId });
    }

    if (programId) {
      queryBuilder.andWhere('project.programId = :programId', { programId });
    }

    if (status && status.length > 0) {
      queryBuilder.andWhere('project.status IN (:...status)', { status });
    }

    if (ownerId) {
      queryBuilder.andWhere('project.ownerId = :ownerId', { ownerId });
    }

    if (search) {
      queryBuilder.andWhere(
        '(project.name ILIKE :search OR project.description ILIKE :search)',
        { search: `%${search}%` }
      );
    }

    // Apply sorting
    const sortField = `project.${sortBy}`;
    queryBuilder.orderBy(sortField, sortOrder);

    // Apply pagination
    const skip = (page - 1) * perPage;
    queryBuilder.skip(skip).take(perPage);

    const [projects, total] = await queryBuilder.getManyAndCount();

    return {
      projects,
      total,
      page,
      perPage,
    };
  }

  async update(id: string, projectData: Partial<Project>): Promise<Project | null> {
    await this.repository.update(id, projectData);
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
}

export const createProjectRepository = (): ProjectRepository => {
  return new ProjectRepository();
};
