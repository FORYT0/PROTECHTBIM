import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { WorkPackage } from './WorkPackage';

export enum RelationType {
  SUCCESSOR = 'successor',
  PREDECESSOR = 'predecessor',
  BLOCKS = 'blocks',
  BLOCKED_BY = 'blocked_by',
  RELATES_TO = 'relates_to',
  DUPLICATES = 'duplicates',
}

@Entity('work_package_relations')
export class WorkPackageRelation {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid', name: 'from_id' })
  @Index()
  fromId!: string;

  @Column({ type: 'uuid', name: 'to_id' })
  @Index()
  toId!: string;

  @Column({ type: 'varchar', length: 50, name: 'relation_type' })
  relationType!: RelationType;

  @Column({ type: 'integer', default: 0, name: 'lag_days' })
  lagDays!: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  // Relationships
  @ManyToOne(() => WorkPackage, (wp) => wp.relationsFrom, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'from_id' })
  from!: WorkPackage;

  @ManyToOne(() => WorkPackage, (wp) => wp.relationsTo, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'to_id' })
  to!: WorkPackage;
}
