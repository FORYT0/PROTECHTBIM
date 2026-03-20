import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
  Index,
} from 'typeorm';
import { Project } from './Project';
import { BoardColumn } from './BoardColumn';

export enum BoardType {
  BASIC = 'basic',
  STATUS = 'status',
  TEAM = 'team',
  VERSION = 'version',
}

@Entity('boards')
export class Board {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid', name: 'project_id' })
  @Index()
  projectId!: string;

  @Column({ type: 'varchar', length: 255 })
  name!: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({
    type: 'varchar',
    length: 50,
    name: 'board_type',
    default: BoardType.BASIC,
  })
  boardType!: BoardType;

  @Column({ type: 'jsonb', nullable: true, name: 'configuration' })
  configuration?: Record<string, any>;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;

  // Relationships
  @ManyToOne(() => Project, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'project_id' })
  project!: Project;

  @OneToMany(() => BoardColumn, (column) => column.board)
  columns!: BoardColumn[];
}
