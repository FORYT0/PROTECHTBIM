import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { User } from './User';
import { WorkPackage } from './WorkPackage';

@Entity('time_entries')
export class TimeEntry {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid', name: 'work_package_id' })
  @Index()
  workPackageId!: string;

  @Column({ type: 'uuid', name: 'user_id' })
  @Index()
  userId!: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  hours!: number;

  @Column({ type: 'date' })
  @Index()
  date!: Date;

  @Column({ type: 'text', nullable: true })
  comment?: string;

  @Column({ type: 'boolean', default: true })
  billable!: boolean;

  // Cost Calculation Fields
  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true, name: 'hourly_rate' })
  hourlyRate!: number | null; // captured at time of entry

  @Column({ type: 'decimal', precision: 15, scale: 2, nullable: true, name: 'labor_cost' })
  laborCost!: number | null; // auto-calculated: hours * rate

  @Column({ type: 'uuid', nullable: true, name: 'cost_entry_id' })
  costEntryId!: string | null; // link to generated cost entry

  @Column({ type: 'boolean', default: false, name: 'is_overtime' })
  isOvertime!: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;

  // Relationships
  @ManyToOne(() => WorkPackage, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'work_package_id' })
  workPackage!: WorkPackage;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user!: User;
}
