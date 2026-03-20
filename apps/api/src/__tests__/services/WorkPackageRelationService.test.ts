import { WorkPackageRelationService } from '../../services/WorkPackageRelationService';
import { WorkPackageRelationRepository } from '../../repositories/WorkPackageRelationRepository';
import { WorkPackageRepository } from '../../repositories/WorkPackageRepository';
import { WorkPackageRelation, RelationType } from '../../entities/WorkPackageRelation';
import { WorkPackage, WorkPackageType, Priority, SchedulingMode } from '../../entities/WorkPackage';

describe('WorkPackageRelationService', () => {
  let service: WorkPackageRelationService;
  let mockRelationRepository: jest.Mocked<WorkPackageRelationRepository>;
  let mockWorkPackageRepository: jest.Mocked<WorkPackageRepository>;

  const mockWorkPackage1: Partial<WorkPackage> = {
    id: 'wp-1',
    projectId: 'project-123',
    type: WorkPackageType.TASK,
    subject: 'Task 1',
    status: 'new',
    priority: Priority.NORMAL,
    spentHours: 0,
    progressPercent: 0,
    schedulingMode: SchedulingMode.MANUAL,
    customFields: {},
  };

  const mockWorkPackage2: Partial<WorkPackage> = {
    id: 'wp-2',
    projectId: 'project-123',
    type: WorkPackageType.TASK,
    subject: 'Task 2',
    status: 'new',
    priority: Priority.NORMAL,
    spentHours: 0,
    progressPercent: 0,
    schedulingMode: SchedulingMode.MANUAL,
    customFields: {},
  };

  const mockRelation: WorkPackageRelation = {
    id: 'rel-123',
    fromId: 'wp-1',
    toId: 'wp-2',
    relationType: RelationType.SUCCESSOR,
    lagDays: 0,
    createdAt: new Date(),
    from: mockWorkPackage1 as WorkPackage,
    to: mockWorkPackage2 as WorkPackage,
  };

  beforeEach(() => {
    jest.clearAllMocks();

    mockRelationRepository = {
      create: jest.fn(),
      findById: jest.fn(),
      findByWorkPackageId: jest.fn(),
      findByFromId: jest.fn(),
      findByToId: jest.fn(),
      delete: jest.fn(),
      exists: jest.fn(),
      findRelation: jest.fn(),
    } as any;

    mockWorkPackageRepository = {
      exists: jest.fn(),
      findById: jest.fn(),
      findAll: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      findByIds: jest.fn(),
    } as any;

    service = new WorkPackageRelationService(mockRelationRepository, mockWorkPackageRepository);
  });

  describe('createRelation', () => {
    it('should create a relation successfully', async () => {
      mockWorkPackageRepository.exists.mockResolvedValueOnce(true).mockResolvedValueOnce(true);
      mockRelationRepository.findRelation.mockResolvedValue(null);
      mockRelationRepository.findByFromId.mockResolvedValue([]);
      mockRelationRepository.create.mockResolvedValue(mockRelation);

      const result = await service.createRelation({
        fromId: 'wp-1',
        toId: 'wp-2',
        relationType: RelationType.SUCCESSOR,
        lagDays: 0,
      });

      expect(result).toEqual(mockRelation);
      expect(mockRelationRepository.create).toHaveBeenCalledWith({
        fromId: 'wp-1',
        toId: 'wp-2',
        relationType: RelationType.SUCCESSOR,
        lagDays: 0,
      });
    });

    it('should throw error if fromId is missing', async () => {
      await expect(
        service.createRelation({
          fromId: '',
          toId: 'wp-2',
          relationType: RelationType.SUCCESSOR,
        })
      ).rejects.toThrow('From work package ID is required');
    });

    it('should throw error if toId is missing', async () => {
      await expect(
        service.createRelation({
          fromId: 'wp-1',
          toId: '',
          relationType: RelationType.SUCCESSOR,
        })
      ).rejects.toThrow('To work package ID is required');
    });

    it('should throw error if relationType is missing', async () => {
      await expect(
        service.createRelation({
          fromId: 'wp-1',
          toId: 'wp-2',
          relationType: undefined as any,
        })
      ).rejects.toThrow('Relation type is required');
    });

    it('should throw error for self-referencing relation', async () => {
      await expect(
        service.createRelation({
          fromId: 'wp-1',
          toId: 'wp-1',
          relationType: RelationType.SUCCESSOR,
        })
      ).rejects.toThrow('Work package cannot have a relation to itself');
    });

    it('should throw error if from work package does not exist', async () => {
      mockWorkPackageRepository.exists.mockResolvedValueOnce(false);

      await expect(
        service.createRelation({
          fromId: 'wp-999',
          toId: 'wp-2',
          relationType: RelationType.SUCCESSOR,
        })
      ).rejects.toThrow('From work package not found');
    });

    it('should throw error if to work package does not exist', async () => {
      mockWorkPackageRepository.exists.mockResolvedValueOnce(true).mockResolvedValueOnce(false);

      await expect(
        service.createRelation({
          fromId: 'wp-1',
          toId: 'wp-999',
          relationType: RelationType.SUCCESSOR,
        })
      ).rejects.toThrow('To work package not found');
    });

    it('should throw error if relation already exists', async () => {
      mockWorkPackageRepository.exists.mockResolvedValueOnce(true).mockResolvedValueOnce(true);
      mockRelationRepository.findRelation.mockResolvedValue(mockRelation);

      await expect(
        service.createRelation({
          fromId: 'wp-1',
          toId: 'wp-2',
          relationType: RelationType.SUCCESSOR,
        })
      ).rejects.toThrow('Relation already exists between these work packages');
    });

    it('should set default lag days to 0', async () => {
      mockWorkPackageRepository.exists.mockResolvedValueOnce(true).mockResolvedValueOnce(true);
      mockRelationRepository.findRelation.mockResolvedValue(null);
      mockRelationRepository.findByFromId.mockResolvedValue([]);
      mockRelationRepository.create.mockResolvedValue(mockRelation);

      await service.createRelation({
        fromId: 'wp-1',
        toId: 'wp-2',
        relationType: RelationType.SUCCESSOR,
      });

      expect(mockRelationRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          lagDays: 0,
        })
      );
    });
  });

  describe('Circular Dependency Detection', () => {
    it('should detect direct circular dependency', async () => {
      // Setup: wp-1 -> wp-2 exists, trying to create wp-2 -> wp-1
      mockWorkPackageRepository.exists.mockResolvedValue(true);
      mockRelationRepository.findRelation.mockResolvedValue(null);

      // Mock existing relation: wp-2 -> wp-1 would complete the cycle
      const existingRelation: WorkPackageRelation = {
        id: 'rel-existing',
        fromId: 'wp-2',
        toId: 'wp-1',
        relationType: RelationType.SUCCESSOR,
        lagDays: 0,
        createdAt: new Date(),
        from: mockWorkPackage2 as WorkPackage,
        to: mockWorkPackage1 as WorkPackage,
      };

      mockRelationRepository.findByFromId.mockResolvedValue([existingRelation]);

      await expect(
        service.createRelation({
          fromId: 'wp-1',
          toId: 'wp-2',
          relationType: RelationType.SUCCESSOR,
        })
      ).rejects.toThrow('Creating this relation would create a circular dependency');
    });

    it('should detect indirect circular dependency (A -> B -> C -> A)', async () => {
      mockWorkPackageRepository.exists.mockResolvedValue(true);
      mockRelationRepository.findRelation.mockResolvedValue(null);

      // Setup: wp-1 -> wp-2 -> wp-3, trying to create wp-3 -> wp-1
      const relation1to2: WorkPackageRelation = {
        id: 'rel-1',
        fromId: 'wp-2',
        toId: 'wp-3',
        relationType: RelationType.SUCCESSOR,
        lagDays: 0,
        createdAt: new Date(),
        from: mockWorkPackage2 as WorkPackage,
        to: { id: 'wp-3' } as WorkPackage,
      };

      const relation2to3: WorkPackageRelation = {
        id: 'rel-2',
        fromId: 'wp-3',
        toId: 'wp-1',
        relationType: RelationType.SUCCESSOR,
        lagDays: 0,
        createdAt: new Date(),
        from: { id: 'wp-3' } as WorkPackage,
        to: mockWorkPackage1 as WorkPackage,
      };

      mockRelationRepository.findByFromId
        .mockResolvedValueOnce([relation1to2]) // wp-2 -> wp-3
        .mockResolvedValueOnce([relation2to3]) // wp-3 -> wp-1
        .mockResolvedValueOnce([]); // wp-1 has no outgoing relations

      await expect(
        service.createRelation({
          fromId: 'wp-1',
          toId: 'wp-2',
          relationType: RelationType.SUCCESSOR,
        })
      ).rejects.toThrow('Creating this relation would create a circular dependency');
    });

    it('should allow non-dependency relations without circular check', async () => {
      mockWorkPackageRepository.exists.mockResolvedValue(true);
      mockRelationRepository.findRelation.mockResolvedValue(null);
      mockRelationRepository.create.mockResolvedValue({
        ...mockRelation,
        relationType: RelationType.RELATES_TO,
      });

      // RELATES_TO should not trigger circular dependency check
      const result = await service.createRelation({
        fromId: 'wp-1',
        toId: 'wp-2',
        relationType: RelationType.RELATES_TO,
      });

      expect(result).toBeDefined();
      expect(mockRelationRepository.create).toHaveBeenCalled();
    });

    it('should allow DUPLICATES relation without circular check', async () => {
      mockWorkPackageRepository.exists.mockResolvedValue(true);
      mockRelationRepository.findRelation.mockResolvedValue(null);
      mockRelationRepository.create.mockResolvedValue({
        ...mockRelation,
        relationType: RelationType.DUPLICATES,
      });

      const result = await service.createRelation({
        fromId: 'wp-1',
        toId: 'wp-2',
        relationType: RelationType.DUPLICATES,
      });

      expect(result).toBeDefined();
      expect(mockRelationRepository.create).toHaveBeenCalled();
    });

    it('should check circular dependency for BLOCKS relation', async () => {
      mockWorkPackageRepository.exists.mockResolvedValue(true);
      mockRelationRepository.findRelation.mockResolvedValue(null);

      const existingRelation: WorkPackageRelation = {
        id: 'rel-existing',
        fromId: 'wp-2',
        toId: 'wp-1',
        relationType: RelationType.BLOCKS,
        lagDays: 0,
        createdAt: new Date(),
        from: mockWorkPackage2 as WorkPackage,
        to: mockWorkPackage1 as WorkPackage,
      };

      mockRelationRepository.findByFromId.mockResolvedValue([existingRelation]);

      await expect(
        service.createRelation({
          fromId: 'wp-1',
          toId: 'wp-2',
          relationType: RelationType.BLOCKS,
        })
      ).rejects.toThrow('Creating this relation would create a circular dependency');
    });
  });

  describe('getRelationsByWorkPackageId', () => {
    it('should return all relations for a work package', async () => {
      mockWorkPackageRepository.exists.mockResolvedValue(true);
      mockRelationRepository.findByWorkPackageId.mockResolvedValue([mockRelation]);

      const result = await service.getRelationsByWorkPackageId('wp-1');

      expect(result).toEqual([mockRelation]);
      expect(mockRelationRepository.findByWorkPackageId).toHaveBeenCalledWith('wp-1');
    });

    it('should throw error if work package ID is missing', async () => {
      await expect(service.getRelationsByWorkPackageId('')).rejects.toThrow(
        'Work package ID is required'
      );
    });

    it('should throw error if work package does not exist', async () => {
      mockWorkPackageRepository.exists.mockResolvedValue(false);

      await expect(service.getRelationsByWorkPackageId('wp-999')).rejects.toThrow(
        'Work package not found'
      );
    });
  });

  describe('deleteRelation', () => {
    it('should delete a relation successfully', async () => {
      mockRelationRepository.exists.mockResolvedValue(true);
      mockRelationRepository.delete.mockResolvedValue(true);

      const result = await service.deleteRelation('rel-123');

      expect(result).toBe(true);
      expect(mockRelationRepository.delete).toHaveBeenCalledWith('rel-123');
    });

    it('should throw error if relation ID is missing', async () => {
      await expect(service.deleteRelation('')).rejects.toThrow('Relation ID is required');
    });

    it('should throw error if relation does not exist', async () => {
      mockRelationRepository.exists.mockResolvedValue(false);

      await expect(service.deleteRelation('rel-999')).rejects.toThrow('Relation not found');
    });
  });

  describe('getRelationById', () => {
    it('should return a relation by ID', async () => {
      mockRelationRepository.findById.mockResolvedValue(mockRelation);

      const result = await service.getRelationById('rel-123');

      expect(result).toEqual(mockRelation);
      expect(mockRelationRepository.findById).toHaveBeenCalledWith('rel-123');
    });

    it('should throw error if relation ID is missing', async () => {
      await expect(service.getRelationById('')).rejects.toThrow('Relation ID is required');
    });

    it('should return null if relation not found', async () => {
      mockRelationRepository.findById.mockResolvedValue(null);

      const result = await service.getRelationById('rel-999');

      expect(result).toBeNull();
    });
  });
});
