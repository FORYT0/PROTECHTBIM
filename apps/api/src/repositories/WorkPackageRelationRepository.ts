import { Repository } from 'typeorm';
import { AppDataSource } from '../config/data-source';
import { WorkPackageRelation, RelationType } from '../entities/WorkPackageRelation';

export class WorkPackageRelationRepository {
  private repository: Repository<WorkPackageRelation>;

  constructor() {
    this.repository = AppDataSource.getRepository(WorkPackageRelation);
  }

  async create(relationData: Partial<WorkPackageRelation>): Promise<WorkPackageRelation> {
    const relation = this.repository.create(relationData);
    return await this.repository.save(relation);
  }

  async findById(id: string): Promise<WorkPackageRelation | null> {
    return await this.repository.findOne({
      where: { id },
      relations: ['from', 'to'],
    });
  }

  async findByWorkPackageId(workPackageId: string): Promise<WorkPackageRelation[]> {
    return await this.repository.find({
      where: [{ fromId: workPackageId }, { toId: workPackageId }],
      relations: ['from', 'to'],
    });
  }

  async findByFromId(fromId: string): Promise<WorkPackageRelation[]> {
    return await this.repository.find({
      where: { fromId },
      relations: ['to'],
    });
  }

  async findByToId(toId: string): Promise<WorkPackageRelation[]> {
    return await this.repository.find({
      where: { toId },
      relations: ['from'],
    });
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.repository.delete(id);
    return (result.affected ?? 0) > 0;
  }

  async exists(id: string): Promise<boolean> {
    const count = await this.repository.count({ where: { id } });
    return count > 0;
  }

  async findRelation(
    fromId: string,
    toId: string,
    relationType: RelationType
  ): Promise<WorkPackageRelation | null> {
    return await this.repository.findOne({
      where: { fromId, toId, relationType },
    });
  }
}

export const createWorkPackageRelationRepository = (): WorkPackageRelationRepository => {
  return new WorkPackageRelationRepository();
};
