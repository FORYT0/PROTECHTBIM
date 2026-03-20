import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { Project } from './Project';
import { BudgetLine } from './BudgetLine';

@Entity('budgets')
@Index(['projectId'])
export class Budget {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column('uuid')
  projectId!: string;

  @ManyToOne(() => Project, (project) => project.id, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'projectId' })
  project!: Project;

  @Column('text', { default: 'Project Budget' })
  name!: string;

  @Column('decimal', { precision: 12, scale: 2 })
  totalBudget!: number;

  @Column('decimal', { precision: 5, scale: 2, default: 0 })
  contingencyPercentage!: number;

  @Column('decimal', { precision: 12, scale: 2, default: 0 })
  contingencyAmount!: number;

  @Column('text', { default: 'USD' })
  currency!: string;

  @Column('date', { nullable: true })
  startDate!: Date | null;

  @Column('date', { nullable: true })
  endDate!: Date | null;

  @Column('text', { nullable: true })
  description!: string | null;

  @Column('boolean', { default: true })
  isActive!: boolean;

  @OneToMany(() => BudgetLine, (budgetLine) => budgetLine.budget, { cascade: true })
  budgetLines!: BudgetLine[];

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
