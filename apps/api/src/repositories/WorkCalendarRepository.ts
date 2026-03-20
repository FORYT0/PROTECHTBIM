import { AppDataSource } from '../config/data-source';
import { WorkCalendar } from '../entities/WorkCalendar';
import { Repository } from 'typeorm';

export class WorkCalendarRepository {
  private repository: Repository<WorkCalendar>;

  constructor(repository?: Repository<WorkCalendar>) {
    this.repository = repository || AppDataSource.getRepository(WorkCalendar);
  }

  async create(data: Partial<WorkCalendar>): Promise<WorkCalendar> {
    const calendar = this.repository.create(data);
    return await this.repository.save(calendar);
  }

  async findById(id: string): Promise<WorkCalendar | null> {
    return await this.repository.findOne({ where: { id } });
  }

  async findByProjectId(projectId: string): Promise<WorkCalendar | null> {
    return await this.repository.findOne({ where: { projectId } });
  }

  async findDefault(): Promise<WorkCalendar | null> {
    return await this.repository.findOne({ where: { isDefault: true } });
  }

  async update(id: string, data: Partial<WorkCalendar>): Promise<WorkCalendar | null> {
    await this.repository.update(id, data);
    return await this.findById(id);
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.repository.delete(id);
    return (result.affected ?? 0) > 0;
  }

  async findAll(): Promise<WorkCalendar[]> {
    return await this.repository.find({
      order: { isDefault: 'DESC', createdAt: 'DESC' },
    });
  }
}

export const createWorkCalendarRepository = (): WorkCalendarRepository => {
  return new WorkCalendarRepository();
};
