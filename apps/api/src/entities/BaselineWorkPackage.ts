import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { Baseline } from './Baseline';

/**
 * Stores a snapshot of work package dates at the time of baseline creation
 */
@Entity('baseline_work_packages')
export class BaselineWorkPackage {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid', name: 'baseline_id' })
  @Index()
  baselineId!: string;

  @Column({ type: 'uuid', name: 'work_package_id' })
  @Index()
  workPackageId!: string;

  @Column({ type: 'varchar', length: 500 })
  subject!: string;

  @Column({ type: 'date', nullable: true, name: 'start_date' })
  startDate?: Date;

  @Column({ type: 'date', nullable: true, name: 'due_date' })
  dueDate?: Date;

  // Relationships
  @ManyToOne(() => Baseline, (baseline) => baseline.workPackages, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'baseline_id' })
  baseline!: Baseline;
}
