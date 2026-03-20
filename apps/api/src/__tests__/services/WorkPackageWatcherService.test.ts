import { WorkPackageService } from '../../services/WorkPackageService';
import { WorkPackageRepository } from '../../repositories/WorkPackageRepository';
import { ProjectRepository } from '../../repositories/ProjectRepository';
import { WorkPackageWatcherRepository } from '../../repositories/WorkPackageWatcherRepository';
import { WorkPackageWatcher } from '../../entities/WorkPackageWatcher';
import { User } from '../../entities/User';
import { AppDataSource } from '../../config/data-source';

describe('WorkPackageService - Watcher Methods', () => {
  let service: WorkPackageService;
  let workPackageRepository: jest.Mocked<WorkPackageRepository>;
  let projectRepository: jest.Mocked<ProjectRepository>;
  let watcherRepository: jest.Mocked<WorkPackageWatcherRepository>;

  const mockWorkPackageId = '123e4567-e89b-12d3-a456-426614174000';
  const mockUserId = '123e4567-e89b-12d3-a456-426614174001';

  beforeEach(() => {
    workPackageRepository = {
      exists: jest.fn(),
    } as any;

    projectRepository = {} as any;

    watcherRepository = {
      addWatcher: jest.fn(),
      removeWatcher: jest.fn(),
      getWatchers: jest.fn(),
      isWatching: jest.fn(),
    } as any;

    service = new WorkPackageService(
      workPackageRepository,
      projectRepository,
      watcherRepository
    );

    // Mock AppDataSource
    jest.spyOn(AppDataSource, 'getRepository').mockReturnValue({
      findOne: jest.fn(),
    } as any);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('addWatcher', () => {
    it('should add a watcher successfully', async () => {
      const mockWatcher: WorkPackageWatcher = {
        workPackageId: mockWorkPackageId,
        userId: mockUserId,
        createdAt: new Date(),
      } as WorkPackageWatcher;

      workPackageRepository.exists.mockResolvedValue(true);
      (AppDataSource.getRepository as jest.Mock).mockReturnValue({
        findOne: jest.fn().mockResolvedValue({ id: mockUserId, email: 'test@example.com' }),
      });
      watcherRepository.isWatching.mockResolvedValue(false);
      watcherRepository.addWatcher.mockResolvedValue(mockWatcher);

      const result = await service.addWatcher(mockWorkPackageId, mockUserId);

      expect(result).toEqual(mockWatcher);
      expect(workPackageRepository.exists).toHaveBeenCalledWith(mockWorkPackageId);
      expect(watcherRepository.isWatching).toHaveBeenCalledWith(mockWorkPackageId, mockUserId);
      expect(watcherRepository.addWatcher).toHaveBeenCalledWith(mockWorkPackageId, mockUserId);
    });

    it('should throw error when work package ID is missing', async () => {
      await expect(service.addWatcher('', mockUserId)).rejects.toThrow(
        'Work package ID is required'
      );
    });

    it('should throw error when user ID is missing', async () => {
      await expect(service.addWatcher(mockWorkPackageId, '')).rejects.toThrow(
        'User ID is required'
      );
    });

    it('should throw error when work package does not exist', async () => {
      workPackageRepository.exists.mockResolvedValue(false);

      await expect(service.addWatcher(mockWorkPackageId, mockUserId)).rejects.toThrow(
        'Work package not found'
      );
    });

    it('should throw error when user does not exist', async () => {
      workPackageRepository.exists.mockResolvedValue(true);
      (AppDataSource.getRepository as jest.Mock).mockReturnValue({
        findOne: jest.fn().mockResolvedValue(null),
      });

      await expect(service.addWatcher(mockWorkPackageId, mockUserId)).rejects.toThrow(
        'User not found'
      );
    });

    it('should throw error when user is already watching', async () => {
      workPackageRepository.exists.mockResolvedValue(true);
      (AppDataSource.getRepository as jest.Mock).mockReturnValue({
        findOne: jest.fn().mockResolvedValue({ id: mockUserId, email: 'test@example.com' }),
      });
      watcherRepository.isWatching.mockResolvedValue(true);

      await expect(service.addWatcher(mockWorkPackageId, mockUserId)).rejects.toThrow(
        'User is already watching this work package'
      );
    });
  });

  describe('removeWatcher', () => {
    it('should remove a watcher successfully', async () => {
      workPackageRepository.exists.mockResolvedValue(true);
      watcherRepository.isWatching.mockResolvedValue(true);
      watcherRepository.removeWatcher.mockResolvedValue(true);

      const result = await service.removeWatcher(mockWorkPackageId, mockUserId);

      expect(result).toBe(true);
      expect(workPackageRepository.exists).toHaveBeenCalledWith(mockWorkPackageId);
      expect(watcherRepository.isWatching).toHaveBeenCalledWith(mockWorkPackageId, mockUserId);
      expect(watcherRepository.removeWatcher).toHaveBeenCalledWith(
        mockWorkPackageId,
        mockUserId
      );
    });

    it('should throw error when work package ID is missing', async () => {
      await expect(service.removeWatcher('', mockUserId)).rejects.toThrow(
        'Work package ID is required'
      );
    });

    it('should throw error when user ID is missing', async () => {
      await expect(service.removeWatcher(mockWorkPackageId, '')).rejects.toThrow(
        'User ID is required'
      );
    });

    it('should throw error when work package does not exist', async () => {
      workPackageRepository.exists.mockResolvedValue(false);

      await expect(service.removeWatcher(mockWorkPackageId, mockUserId)).rejects.toThrow(
        'Work package not found'
      );
    });

    it('should throw error when user is not watching', async () => {
      workPackageRepository.exists.mockResolvedValue(true);
      watcherRepository.isWatching.mockResolvedValue(false);

      await expect(service.removeWatcher(mockWorkPackageId, mockUserId)).rejects.toThrow(
        'User is not watching this work package'
      );
    });
  });

  describe('getWatchers', () => {
    it('should get all watchers successfully', async () => {
      const mockWatchers: WorkPackageWatcher[] = [
        {
          workPackageId: mockWorkPackageId,
          userId: mockUserId,
          createdAt: new Date(),
          user: {
            id: mockUserId,
            email: 'test@example.com',
            name: 'Test User',
          } as User,
        } as WorkPackageWatcher,
      ];

      workPackageRepository.exists.mockResolvedValue(true);
      watcherRepository.getWatchers.mockResolvedValue(mockWatchers);

      const result = await service.getWatchers(mockWorkPackageId);

      expect(result).toEqual(mockWatchers);
      expect(workPackageRepository.exists).toHaveBeenCalledWith(mockWorkPackageId);
      expect(watcherRepository.getWatchers).toHaveBeenCalledWith(mockWorkPackageId);
    });

    it('should throw error when work package ID is missing', async () => {
      await expect(service.getWatchers('')).rejects.toThrow('Work package ID is required');
    });

    it('should throw error when work package does not exist', async () => {
      workPackageRepository.exists.mockResolvedValue(false);

      await expect(service.getWatchers(mockWorkPackageId)).rejects.toThrow(
        'Work package not found'
      );
    });

    it('should return empty array when no watchers exist', async () => {
      workPackageRepository.exists.mockResolvedValue(true);
      watcherRepository.getWatchers.mockResolvedValue([]);

      const result = await service.getWatchers(mockWorkPackageId);

      expect(result).toEqual([]);
    });
  });
});
