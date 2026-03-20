import { WorkPackageRelation, RelationType } from '../entities/WorkPackageRelation';
import {
  WorkPackageRelationRepository,
  createWorkPackageRelationRepository,
} from '../repositories/WorkPackageRelationRepository';
import {
  WorkPackageRepository,
  createWorkPackageRepository,
} from '../repositories/WorkPackageRepository';

export interface CreateRelationDTO {
  fromId: string;
  toId: string;
  relationType: RelationType;
  lagDays?: number;
}

export class WorkPackageRelationService {
  private relationRepository: WorkPackageRelationRepository;
  private workPackageRepository: WorkPackageRepository;

  constructor(
    relationRepository?: WorkPackageRelationRepository,
    workPackageRepository?: WorkPackageRepository
  ) {
    this.relationRepository = relationRepository || createWorkPackageRelationRepository();
    this.workPackageRepository = workPackageRepository || createWorkPackageRepository();
  }

  async createRelation(data: CreateRelationDTO): Promise<WorkPackageRelation> {
    // Validate required fields
    if (!data.fromId) {
      throw new Error('From work package ID is required');
    }

    if (!data.toId) {
      throw new Error('To work package ID is required');
    }

    if (!data.relationType) {
      throw new Error('Relation type is required');
    }

    // Prevent self-referencing
    if (data.fromId === data.toId) {
      throw new Error('Work package cannot have a relation to itself');
    }

    // Validate both work packages exist
    const fromExists = await this.workPackageRepository.exists(data.fromId);
    if (!fromExists) {
      throw new Error('From work package not found');
    }

    const toExists = await this.workPackageRepository.exists(data.toId);
    if (!toExists) {
      throw new Error('To work package not found');
    }

    // Check if relation already exists
    const existingRelation = await this.relationRepository.findRelation(
      data.fromId,
      data.toId,
      data.relationType
    );

    if (existingRelation) {
      throw new Error('Relation already exists between these work packages');
    }

    // Check for circular dependencies before creating the relation
    const wouldCreateCycle = await this.wouldCreateCircularDependency(
      data.fromId,
      data.toId,
      data.relationType
    );

    if (wouldCreateCycle) {
      throw new Error('Creating this relation would create a circular dependency');
    }

    const relationData: Partial<WorkPackageRelation> = {
      fromId: data.fromId,
      toId: data.toId,
      relationType: data.relationType,
      lagDays: data.lagDays ?? 0,
    };

    return await this.relationRepository.create(relationData);
  }

  async getRelationById(id: string): Promise<WorkPackageRelation | null> {
    if (!id) {
      throw new Error('Relation ID is required');
    }

    return await this.relationRepository.findById(id);
  }

  async getRelationsByWorkPackageId(workPackageId: string): Promise<WorkPackageRelation[]> {
    if (!workPackageId) {
      throw new Error('Work package ID is required');
    }

    // Validate work package exists
    const exists = await this.workPackageRepository.exists(workPackageId);
    if (!exists) {
      throw new Error('Work package not found');
    }

    return await this.relationRepository.findByWorkPackageId(workPackageId);
  }

  async deleteRelation(id: string): Promise<boolean> {
    if (!id) {
      throw new Error('Relation ID is required');
    }

    // Check if relation exists
    const exists = await this.relationRepository.exists(id);
    if (!exists) {
      throw new Error('Relation not found');
    }

    return await this.relationRepository.delete(id);
  }

  /**
   * Detect if creating a relation would create a circular dependency
   * Uses depth-first search to detect cycles in the dependency graph
   */
  private async wouldCreateCircularDependency(
    fromId: string,
    toId: string,
    relationType: RelationType
  ): Promise<boolean> {
    // Only check for circular dependencies on relation types that create dependencies
    const dependencyTypes = [
      RelationType.SUCCESSOR,
      RelationType.PREDECESSOR,
      RelationType.BLOCKS,
      RelationType.BLOCKED_BY,
    ];

    if (!dependencyTypes.includes(relationType)) {
      return false;
    }

    // Check if adding this relation would create a cycle
    // A cycle exists if we can reach 'fromId' starting from 'toId' following dependency relations
    return await this.canReach(toId, fromId, new Set());
  }

  /**
   * Check if we can reach targetId starting from startId by following dependency relations
   * Uses depth-first search with visited set to prevent infinite loops
   */
  private async canReach(
    startId: string,
    targetId: string,
    visited: Set<string>
  ): Promise<boolean> {
    if (startId === targetId) {
      return true;
    }

    if (visited.has(startId)) {
      return false;
    }

    visited.add(startId);

    // Get all outgoing dependency relations from startId
    const relations = await this.relationRepository.findByFromId(startId);

    // Filter to only dependency-creating relations
    const dependencyTypes = [
      RelationType.SUCCESSOR,
      RelationType.PREDECESSOR,
      RelationType.BLOCKS,
      RelationType.BLOCKED_BY,
    ];

    const dependencyRelations = relations.filter((rel) =>
      dependencyTypes.includes(rel.relationType)
    );

    // Recursively check if we can reach target from any connected node
    for (const relation of dependencyRelations) {
      const canReachTarget = await this.canReach(relation.toId, targetId, visited);
      if (canReachTarget) {
        return true;
      }
    }

    return false;
  }

  /**
   * Detect all circular dependencies in a project
   * Returns an array of cycles found
   */
  async detectCircularDependencies(projectId: string): Promise<string[][]> {
    // Get all work packages in the project
    const workPackages = await this.workPackageRepository.findAll({
      projectId,
      perPage: 10000, // Get all work packages
    });

    const cycles: string[][] = [];
    const visited = new Set<string>();
    const recursionStack = new Set<string>();

    // Perform DFS from each unvisited node
    for (const wp of workPackages.workPackages) {
      if (!visited.has(wp.id)) {
        const cycle = await this.findCycleDFS(wp.id, visited, recursionStack, []);
        if (cycle.length > 0) {
          cycles.push(cycle);
        }
      }
    }

    return cycles;
  }

  /**
   * DFS helper to find cycles
   */
  private async findCycleDFS(
    nodeId: string,
    visited: Set<string>,
    recursionStack: Set<string>,
    path: string[]
  ): Promise<string[]> {
    visited.add(nodeId);
    recursionStack.add(nodeId);
    path.push(nodeId);

    const relations = await this.relationRepository.findByFromId(nodeId);

    const dependencyTypes = [
      RelationType.SUCCESSOR,
      RelationType.PREDECESSOR,
      RelationType.BLOCKS,
      RelationType.BLOCKED_BY,
    ];

    const dependencyRelations = relations.filter((rel) =>
      dependencyTypes.includes(rel.relationType)
    );

    for (const relation of dependencyRelations) {
      const nextId = relation.toId;

      if (!visited.has(nextId)) {
        const cycle = await this.findCycleDFS(nextId, visited, recursionStack, [...path]);
        if (cycle.length > 0) {
          return cycle;
        }
      } else if (recursionStack.has(nextId)) {
        // Found a cycle - return the cycle path
        const cycleStartIndex = path.indexOf(nextId);
        return path.slice(cycleStartIndex);
      }
    }

    recursionStack.delete(nodeId);
    return [];
  }
}

export const createWorkPackageRelationService = (): WorkPackageRelationService => {
  return new WorkPackageRelationService();
};
