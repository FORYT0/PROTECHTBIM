import { AppDataSource } from '../config/data-source';
import { Budget } from '../entities/Budget';
import { BudgetLine } from '../entities/BudgetLine';
import { Repository } from 'typeorm';

export class BudgetRepository {
  private repository: Repository<Budget>;
  private budgetLineRepository: Repository<BudgetLine>;

  constructor() {
    this.repository = AppDataSource.getRepository(Budget);
    this.budgetLineRepository = AppDataSource.getRepository(BudgetLine);
  }

  async create(budgetData: Partial<Budget>): Promise<Budget> {
    const budget = this.repository.create(budgetData);
    return await this.repository.save(budget);
  }

  async findById(id: string): Promise<Budget | null> {
    return await this.repository.findOne({
      where: { id },
      relations: ['budgetLines', 'budgetLines.costCode', 'project'],
    });
  }

  async findByProjectId(projectId: string): Promise<Budget | null> {
    return await this.repository.findOne({
      where: { projectId, isActive: true },
      relations: ['budgetLines', 'budgetLines.costCode'],
      order: { createdAt: 'DESC' },
    });
  }

  async update(id: string, budgetData: Partial<Budget>): Promise<Budget | null> {
    await this.repository.update(id, budgetData);
    return await this.findById(id);
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.repository.delete(id);
    return (result.affected ?? 0) > 0;
  }

  async createBudgetLine(budgetLineData: Partial<BudgetLine>): Promise<BudgetLine> {
    const budgetLine = this.budgetLineRepository.create(budgetLineData);
    return await this.budgetLineRepository.save(budgetLine);
  }

  async updateBudgetLine(id: string, budgetLineData: Partial<BudgetLine>): Promise<BudgetLine | null> {
    await this.budgetLineRepository.update(id, budgetLineData);
    return await this.budgetLineRepository.findOne({
      where: { id },
      relations: ['costCode'],
    });
  }

  async deleteBudgetLine(id: string): Promise<boolean> {
    const result = await this.budgetLineRepository.delete(id);
    return (result.affected ?? 0) > 0;
  }

  async getBudgetLinesByBudgetId(budgetId: string): Promise<BudgetLine[]> {
    return await this.budgetLineRepository.find({
      where: { budgetId },
      relations: ['costCode'],
      order: { createdAt: 'ASC' },
    });
  }
}

export const createBudgetRepository = (): BudgetRepository => {
  return new BudgetRepository();
};
