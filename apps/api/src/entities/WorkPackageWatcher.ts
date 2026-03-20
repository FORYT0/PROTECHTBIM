import {
  Entity,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  PrimaryColumn,
} from 'typeorm';
import { WorkPackage } from './WorkPackage';
import { User } from './User';

@Entity('work_package_watchers')
export class WorkPackageWatcher {
  @PrimaryColumn({ type: 'uuid', name: 'work_package_id' })
  workPackageId!: string;

  @PrimaryColumn({ type: 'uuid', name: 'user_id' })
  userId!: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  // Relationships
  @ManyToOne(() => WorkPackage, (wp) => wp.watchers, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'work_package_id' })
  workPackage!: WorkPackage;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user!: User;
}
