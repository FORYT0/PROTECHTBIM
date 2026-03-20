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
import { Project } from './Project';

export enum DayOfWeek {
  SUNDAY = 0,
  MONDAY = 1,
  TUESDAY = 2,
  WEDNESDAY = 3,
  THURSDAY = 4,
  FRIDAY = 5,
  SATURDAY = 6,
}

export interface WorkingHours {
  startHour: number; // 0-23
  startMinute: number; // 0-59
  endHour: number; // 0-23
  endMinute: number; // 0-59
}

export interface Holiday {
  date: string; // ISO date string (YYYY-MM-DD)
  name: string;
}

@Entity('work_calendars')
export class WorkCalendar {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 255 })
  name!: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ type: 'uuid', name: 'project_id', nullable: true })
  @Index()
  projectId?: string;

  @Column({ type: 'boolean', name: 'is_default', default: false })
  @Index()
  isDefault!: boolean;

  // Array of working days (0 = Sunday, 1 = Monday, ..., 6 = Saturday)
  @Column({ type: 'jsonb', name: 'working_days', default: '[1,2,3,4,5]' })
  workingDays!: DayOfWeek[];

  // Working hours per day
  @Column({
    type: 'jsonb',
    name: 'working_hours',
    default: '{"startHour":8,"startMinute":0,"endHour":17,"endMinute":0}',
  })
  workingHours!: WorkingHours;

  // Hours per working day (e.g., 8 for 8-hour day)
  @Column({ type: 'decimal', precision: 5, scale: 2, name: 'hours_per_day', default: 8.0 })
  hoursPerDay!: number;

  // Non-working days (holidays)
  @Column({ type: 'jsonb', nullable: true, default: '[]' })
  holidays!: Holiday[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;

  // Relationships
  @ManyToOne(() => Project, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'project_id' })
  project?: Project;
}
