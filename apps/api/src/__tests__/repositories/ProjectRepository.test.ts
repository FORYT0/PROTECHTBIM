import { ProjectRepository, ProjectFilters } from '../../repositories/ProjectRepository';
import { Project, ProjectStatus, LifecyclePhase } from '../../entities/Project';
import { User } from '../../entities/User';
import { Program } from '../../entities/Program';
import { Portfolio } from '../../entities/Portfolio';

// Mock the data source
jest.mock('../../config/data-source', () => ({
  AppDataSource: {
    getRepository: jest.fn(),
  },
}));

describe('ProjectRepository', () => {
  let projectRepository: ProjectRepository;
  let mockRepository: any;

  const mockUser: User = {
    id: '123e4567-e89b-12d3-a456-426614174000',
    email: 'test@example.com',
    name: 'Test User',
    passwordHash: 'hash',
    status: 'active',
    currency: 'USD',
    isPlaceholder: false,
    createdAt: new Date(),
    updatedAt: new Date(),
    roles: [],
    groups: [],
  };

  const mockPortfolio: Portfolio = {
    id: 'portfolio-123',
    name: 'Test Portfolio',
    description: 'Test Portfolio Description',
    ownerId: mockUser.id,
    createdAt: new Date(),
    updatedAt: new Date(),
    customFields: {},
    owner: mockUser,
    programs: [],
  };

  const mockProgram: Program = {
    id: 'program-123',
    name: 'Test Program',
    description: 'Test Program Description',
    portfolioId: mockPortfolio.id,
    ownerId: mockUser.id,
    createdAt: new Date(),
    updatedAt: new Date(),
    customFields: {},
    owner: mockUser,
    portfolio: mockPortfolio,
    projects: [],
  };

  const mockProject: Project = {
    id: 'project-123',
    name: 'Test Project',
    description: 'Test Description',
    programId: mockProgram.id,
    portfolioId: mockPortfolio.id,
    ownerId: mockUser.id,
    status: ProjectStatus.ACTIVE,
    lifecyclePhase: LifecyclePhase.INITIATION,
    startDate: new Date('2024-01-01'),
    endDate: new Date('2024-12-31'),
    templateId: undefined,
    customFields: {},
    createdAt: new Date(),
    updatedAt: new Date(),
    owner: mockUser,
    program: mockProgram,
    portfolio: mockPortfolio,
  };

  beforeEach(() => {
    jest.clearAllMocks();

    // Create mock query builder
    const mockQueryBuilder = {
      leftJoinAndSelect: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      take: jest.fn().mockReturnThis(),
      getManyAndCount: jest.fn().mockResolvedValue([[mockProject], 1]),
    };

    // Create mock repository
    mockRepository = {
      create: jest.fn().mockReturnValue(mockProject),
      save: jest.fn().mockResolvedValue(mockProject),
      findOne: jest.fn().mockResolvedValue(mockProject),
      update: jest.fn().mockResolvedValue({ affected: 1 }),
      delete: jest.fn().mockResolvedValue({ affected: 1 }),
      count: jest.fn().mockResolvedValue(1),
      createQueryBuilder: jest.fn().mockReturnValue(mockQueryBuilder),
    };

    // Mock AppDataSource.getRepository
    const { AppDataSource } = require('../../config/data-source');
    AppDataSource.getRepository.mockReturnValue(mockRepository);

    projectRepository = new ProjectRepository();
  });

  describe('create', () => {
    it('should create a project with valid data', async () => {
      const projectData = {
        name: 'New Project',
        description: 'New Description',
        ownerId: mockUser.id,
        status: ProjectStatus.ACTIVE,
        lifecyclePhase: LifecyclePhase.INITIATION,
      };

      const result = await projectRepository.create(projectData);

      expect(mockRepository.create).toHaveBeenCalledWith(projectData);
      expect(mockRepository.save).toHaveBeenCalled();
      expect(result).toEqual(mockProject);
    });

    it('should create a project with program and portfolio', async () => {
      const projectData = {
        name: 'New Project',
        ownerId: mockUser.id,
        programId: mockProgram.id,
        portfolioId: mockPortfolio.id,
      };

      const result = await projectRepository.create(projectData);

      expect(mockRepository.create).toHaveBeenCalledWith(projectData);
      expect(result).toEqual(mockProject);
    });

    it('should create a project with custom fields', async () => {
      const projectData = {
        name: 'New Project',
        ownerId: mockUser.id,
        customFields: { budget: 100000, priority: 'high' },
      };

      const result = await projectRepository.create(projectData);

      expect(mockRepository.create).toHaveBeenCalledWith(projectData);
      expect(result).toEqual(mockProject);
    });

    it('should create a project with start and end dates', async () => {
      const projectData = {
        name: 'New Project',
        ownerId: mockUser.id,
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-12-31'),
      };

      const result = await projectRepository.create(projectData);

      expect(mockRepository.create).toHaveBeenCalledWith(projectData);
      expect(result).toEqual(mockProject);
    });
  });

  describe('findById', () => {
    it('should find a project by id with relations', async () => {
      const result = await projectRepository.findById('project-123');

      expect(mockRepository.findOne).toHaveBeenCalledWith({
        where: { id: 'project-123' },
        relations: ['owner', 'program', 'portfolio'],
      });
      expect(result).toEqual(mockProject);
    });

    it('should return null when project not found', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      const result = await projectRepository.findById('non-existent');

      expect(result).toBeNull();
    });
  });

  describe('findAll - filtering', () => {
    it('should list all projects without filters', async () => {
      const result = await projectRepository.findAll();

      expect(result.projects).toHaveLength(1);
      expect(result.total).toBe(1);
      expect(result.page).toBe(1);
      expect(result.perPage).toBe(20);
    });

    it('should filter projects by portfolio', async () => {
      const filters: ProjectFilters = {
        portfolioId: mockPortfolio.id,
      };

      await projectRepository.findAll(filters);

      const queryBuilder = mockRepository.createQueryBuilder();
      expect(queryBuilder.andWhere).toHaveBeenCalledWith(
        'project.portfolioId = :portfolioId',
        { portfolioId: mockPortfolio.id }
      );
    });

    it('should filter projects by program', async () => {
      const filters: ProjectFilters = {
        programId: mockProgram.id,
      };

      await projectRepository.findAll(filters);

      const queryBuilder = mockRepository.createQueryBuilder();
      expect(queryBuilder.andWhere).toHaveBeenCalledWith(
        'project.programId = :programId',
        { programId: mockProgram.id }
      );
    });

    it('should filter projects by status', async () => {
      const filters: ProjectFilters = {
        status: [ProjectStatus.ACTIVE, ProjectStatus.ON_HOLD],
      };

      await projectRepository.findAll(filters);

      const queryBuilder = mockRepository.createQueryBuilder();
      expect(queryBuilder.andWhere).toHaveBeenCalledWith(
        'project.status IN (:...status)',
        { status: [ProjectStatus.ACTIVE, ProjectStatus.ON_HOLD] }
      );
    });

    it('should filter projects by owner', async () => {
      const filters: ProjectFilters = {
        ownerId: mockUser.id,
      };

      await projectRepository.findAll(filters);

      const queryBuilder = mockRepository.createQueryBuilder();
      expect(queryBuilder.andWhere).toHaveBeenCalledWith(
        'project.ownerId = :ownerId',
        { ownerId: mockUser.id }
      );
    });

    it('should filter projects by search term', async () => {
      const filters: ProjectFilters = {
        search: 'test',
      };

      await projectRepository.findAll(filters);

      const queryBuilder = mockRepository.createQueryBuilder();
      expect(queryBuilder.andWhere).toHaveBeenCalledWith(
        '(project.name ILIKE :search OR project.description ILIKE :search)',
        { search: '%test%' }
      );
    });

    it('should apply multiple filters together', async () => {
      const filters: ProjectFilters = {
        portfolioId: mockPortfolio.id,
        status: [ProjectStatus.ACTIVE],
        ownerId: mockUser.id,
        search: 'test',
      };

      await projectRepository.findAll(filters);

      const queryBuilder = mockRepository.createQueryBuilder();
      expect(queryBuilder.andWhere).toHaveBeenCalledTimes(4);
    });
  });

  describe('findAll - pagination', () => {
    it('should paginate results with default values', async () => {
      await projectRepository.findAll();

      const queryBuilder = mockRepository.createQueryBuilder();
      expect(queryBuilder.skip).toHaveBeenCalledWith(0);
      expect(queryBuilder.take).toHaveBeenCalledWith(20);
    });

    it('should paginate results with custom page and perPage', async () => {
      const filters: ProjectFilters = {
        page: 2,
        perPage: 10,
      };

      await projectRepository.findAll(filters);

      const queryBuilder = mockRepository.createQueryBuilder();
      expect(queryBuilder.skip).toHaveBeenCalledWith(10);
      expect(queryBuilder.take).toHaveBeenCalledWith(10);
    });

    it('should calculate correct skip for page 3', async () => {
      const filters: ProjectFilters = {
        page: 3,
        perPage: 15,
      };

      await projectRepository.findAll(filters);

      const queryBuilder = mockRepository.createQueryBuilder();
      expect(queryBuilder.skip).toHaveBeenCalledWith(30);
      expect(queryBuilder.take).toHaveBeenCalledWith(15);
    });
  });

  describe('findAll - sorting', () => {
    it('should sort by default field (createdAt DESC)', async () => {
      await projectRepository.findAll();

      const queryBuilder = mockRepository.createQueryBuilder();
      expect(queryBuilder.orderBy).toHaveBeenCalledWith('project.createdAt', 'DESC');
    });

    it('should sort by name ascending', async () => {
      const filters: ProjectFilters = {
        sortBy: 'name',
        sortOrder: 'ASC',
      };

      await projectRepository.findAll(filters);

      const queryBuilder = mockRepository.createQueryBuilder();
      expect(queryBuilder.orderBy).toHaveBeenCalledWith('project.name', 'ASC');
    });

    it('should sort by status descending', async () => {
      const filters: ProjectFilters = {
        sortBy: 'status',
        sortOrder: 'DESC',
      };

      await projectRepository.findAll(filters);

      const queryBuilder = mockRepository.createQueryBuilder();
      expect(queryBuilder.orderBy).toHaveBeenCalledWith('project.status', 'DESC');
    });
  });

  describe('update', () => {
    it('should update a project', async () => {
      const updateData = {
        name: 'Updated Project',
        description: 'Updated Description',
      };

      const result = await projectRepository.update('project-123', updateData);

      expect(mockRepository.update).toHaveBeenCalledWith('project-123', updateData);
      expect(mockRepository.findOne).toHaveBeenCalled();
      expect(result).toEqual(mockProject);
    });

    it('should return null when updating non-existent project', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      const result = await projectRepository.update('non-existent', { name: 'Test' });

      expect(result).toBeNull();
    });
  });

  describe('delete', () => {
    it('should delete a project', async () => {
      const result = await projectRepository.delete('project-123');

      expect(mockRepository.delete).toHaveBeenCalledWith('project-123');
      expect(result).toBe(true);
    });

    it('should return false when deleting non-existent project', async () => {
      mockRepository.delete.mockResolvedValue({ affected: 0 });

      const result = await projectRepository.delete('non-existent');

      expect(result).toBe(false);
    });
  });

  describe('exists', () => {
    it('should return true when project exists', async () => {
      mockRepository.count.mockResolvedValue(1);

      const result = await projectRepository.exists('project-123');

      expect(mockRepository.count).toHaveBeenCalledWith({ where: { id: 'project-123' } });
      expect(result).toBe(true);
    });

    it('should return false when project does not exist', async () => {
      mockRepository.count.mockResolvedValue(0);

      const result = await projectRepository.exists('non-existent');

      expect(result).toBe(false);
    });
  });
});
