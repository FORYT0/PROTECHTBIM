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
import { User } from './User';
import { CostCode } from './CostCode';
import { CostCategory } from './CostEntry';

@Entity('resource_rates')
@Index(['userId', 'effectiveFrom'])
@Index(['isActive'])
export class ResourceRate {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid', name: 'user_id' })
  userId!: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user!: User;

  @Column({ type: 'varchar', length: 100 })
  role!: string; // e.g., "Project Manager", "Site Engineer"

  @Column({ type: 'decimal', precision: 10, scale: 2, name: 'hourly_rate' })
  hourlyRate!: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true, name: 'overtime_rate' })
  overtimeRate!: number | null;

  @Column({ type: 'decimal', precision: 3, scale: 2, nullable: true, name: 'overtime_multiplier' })
  overtimeMultiplier!: number | null; // e.g., 1.5 for time-and-a-half

  @Column({
    type: 'enum',
    enum: CostCategory,
    default: CostCategory.LABOR,
    name: 'cost_category',
  })
  costCategory!: CostCategory;

  @Column({ type: 'uuid', nullable: true, name: 'cost_code_id' })
  costCodeId!: string | null;

  @ManyToOne(() => CostCode, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'cost_code_id' })
  costCode!: CostCode | null;

  @Column({ type: 'date', name: 'effective_from' })
  effectiveFrom!: Date;

  @Column({ type: 'date', nullable: true, name: 'effective_to' })
  effectiveTo!: Date | null;

  @Column({ type: 'boolean', default: true, name: 'is_active' })
  isActive!: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}
