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
import { Project } from './Project';
import { User } from './User';

@Entity('daily_reports')
@Index(['projectId', 'reportDate'])
@Index(['reportDate'])
export class DailyReport {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column('uuid')
  projectId!: string;

  @ManyToOne(() => Project, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'projectId' })
  project!: Project;

  @Column({ type: 'date' })
  reportDate!: Date;

  @Column({ type: 'varchar', length: 100, nullable: true })
  weather!: string | null;

  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  temperature!: number | null;

  @Column({ type: 'integer', default: 0 })
  manpowerCount!: number;

  @Column({ type: 'integer', default: 0 })
  equipmentCount!: number;

  @Column({ type: 'text', nullable: true })
  workCompleted!: string | null;

  @Column({ type: 'text', nullable: true })
  workPlannedTomorrow!: string | null;

  @Column({ type: 'text', nullable: true })
  delays!: string | null;

  @Column({ type: 'text', nullable: true })
  safetyIncidents!: string | null;

  @Column({ type: 'text', nullable: true })
  siteNotes!: string | null;

  @Column({ type: 'text', nullable: true })
  visitorsOnSite!: string | null;

  @Column({ type: 'text', nullable: true })
  materialsDelivered!: string | null;

  @Column('uuid')
  createdBy!: string;

  @ManyToOne(() => User, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'createdBy' })
  creator!: User;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
