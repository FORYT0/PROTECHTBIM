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
import { Program } from './Program';
import { Portfolio } from './Portfolio';

export enum ProjectStatus {
  ACTIVE = 'active',
  ON_HOLD = 'on_hold',
  COMPLETED = 'completed',
  ARCHIVED = 'archived',
}

export enum LifecyclePhase {
  INITIATION = 'initiation',
  PLANNING = 'planning',
  EXECUTION = 'execution',
  MONITORING = 'monitoring',
  CLOSURE = 'closure',
}

@Entity('projects')
export class Project {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 255 })
  name!: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ type: 'uuid', name: 'program_id', nullable: true })
  @Index()
  programId?: string;

  @Column({ type: 'uuid', name: 'portfolio_id', nullable: true })
  @Index()
  portfolioId?: string;

  @Column({ type: 'uuid', name: 'owner_id' })
  @Index()
  ownerId!: string;

  @Column({
    type: 'varchar',
    length: 50,
    default: ProjectStatus.ACTIVE,
  })
  @Index()
  status!: ProjectStatus;

  @Column({
    type: 'varchar',
    length: 50,
    name: 'lifecycle_phase',
    default: LifecyclePhase.INITIATION,
  })
  lifecyclePhase!: LifecyclePhase;

  @Column({ type: 'date', nullable: true, name: 'start_date' })
  startDate?: Date;

  @Column({ type: 'date', nullable: true, name: 'end_date' })
  endDate?: Date;

  @Column({ type: 'uuid', nullable: true, name: 'template_id' })
  templateId?: string;

  @Column({ type: 'jsonb', nullable: true, name: 'custom_fields' })
  customFields?: Record<string, any>;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;

  // Relationships
  @ManyToOne(() => Program, (program) => program.projects, {
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'program_id' })
  program?: Program;

  @ManyToOne(() => Portfolio, {
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'portfolio_id' })
  portfolio?: Portfolio;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'owner_id' })
  owner!: User;
}
