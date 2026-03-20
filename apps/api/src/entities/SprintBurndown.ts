import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
  Unique,
} from 'typeorm';
import { Sprint } from './Sprint';

@Entity('sprint_burndown')
@Unique(['sprintId', 'date'])
export class SprintBurndown {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid', name: 'sprint_id' })
  @Index()
  sprintId!: string;

  @Column({ type: 'date' })
  @Index()
  date!: Date;

  @Column({ type: 'integer', name: 'remaining_story_points', default: 0 })
  remainingStoryPoints!: number;

  @Column({ type: 'integer', name: 'completed_story_points', default: 0 })
  completedStoryPoints!: number;

  @Column({ type: 'integer', name: 'total_story_points', default: 0 })
  totalStoryPoints!: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  // Relationships
  @ManyToOne(() => Sprint, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'sprint_id' })
  sprint!: Sprint;
}
