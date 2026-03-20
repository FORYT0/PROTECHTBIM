import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { Budget } from './Budget';
import { CostCode } from './CostCode';

@Entity('budget_lines')
@Index(['budgetId'])
@Index(['costCodeId'])
export class BudgetLine {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column('uuid')
  budgetId!: string;

  @ManyToOne(() => Budget, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'budgetId' })
  budget!: Budget;

  @Column('uuid')
  costCodeId!: string;

  @ManyToOne(() => CostCode)
  @JoinColumn({ name: 'costCodeId' })
  costCode!: CostCode;

  @Column('decimal', { precision: 12, scale: 2 })
  budgetedAmount!: number;

  @Column('decimal', { precision: 12, scale: 2, default: 0 })
  actualCost!: number;

  @Column('decimal', { precision: 12, scale: 2, default: 0 })
  committedCost!: number;

  @Column('text', { nullable: true })
  notes!: string | null;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
