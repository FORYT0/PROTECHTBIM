import 'reflect-metadata';
import { DataSource, DataSourceOptions } from 'typeorm';
import * as dotenv from 'dotenv';
import { User } from '../entities/User';
import { UserGroup } from '../entities/UserGroup';
import { Role } from '../entities/Role';
import { Permission } from '../entities/Permission';
import { Portfolio } from '../entities/Portfolio';
import { Program } from '../entities/Program';
import { Project } from '../entities/Project';
import { WorkPackage } from '../entities/WorkPackage';
import { WorkPackageRelation } from '../entities/WorkPackageRelation';
import { WorkPackageWatcher } from '../entities/WorkPackageWatcher';
import { WorkCalendar } from '../entities/WorkCalendar';
import { Baseline } from '../entities/Baseline';
import { BaselineWorkPackage } from '../entities/BaselineWorkPackage';
import { Board } from '../entities/Board';
import { BoardColumn } from '../entities/BoardColumn';
import { Sprint } from '../entities/Sprint';
import { SprintBurndown } from '../entities/SprintBurndown';
import { TimeEntry } from '../entities/TimeEntry';
import { CostEntry } from '../entities/CostEntry';
import { CostCode } from '../entities/CostCode';
import { Vendor } from '../entities/Vendor';
import { ResourceRate } from '../entities/ResourceRate';
import { Budget } from '../entities/Budget';
import { BudgetLine } from '../entities/BudgetLine';
import { ActivityLog } from '../entities/ActivityLog';
import { Comment } from '../entities/Comment';
import { Attachment } from '../entities/Attachment';
import { WikiPage } from '../entities/WikiPage';
import { Contract } from '../entities/Contract';
import { ChangeOrder } from '../entities/ChangeOrder';
import { ChangeOrderCostLine } from '../entities/ChangeOrderCostLine';
import { PaymentCertificate } from '../entities/PaymentCertificate';
import { DailyReport } from '../entities/DailyReport';
import { DelayEvent } from '../entities/DelayEvent';
import { SitePhoto } from '../entities/SitePhoto';
import { Snag } from '../entities/Snag';

// Load environment variables
dotenv.config();

// Support Railway's DATABASE_URL connection string
const dbUrl = process.env.DATABASE_URL;

export const dataSourceOptions: DataSourceOptions = dbUrl
  ? {
      type: 'postgres',
      url: dbUrl,
      entities: [User, UserGroup, Role, Permission, Portfolio, Program, Project, WorkPackage, WorkPackageRelation, WorkPackageWatcher, WorkCalendar, Baseline, BaselineWorkPackage, Board, BoardColumn, Sprint, SprintBurndown, TimeEntry, CostEntry, CostCode, Vendor, ResourceRate, Budget, BudgetLine, ActivityLog, Comment, Attachment, WikiPage, Contract, ChangeOrder, ChangeOrderCostLine, PaymentCertificate, DailyReport, DelayEvent, SitePhoto, Snag],
      migrations: [
        process.env.NODE_ENV === 'production'
          ? 'dist/src/migrations/*.js'
          : 'src/migrations/*.ts'
      ],
      synchronize: process.env.NODE_ENV !== 'production',
      logging: process.env.NODE_ENV === 'development',
      ssl: { rejectUnauthorized: false },
      extra: { max: 20, min: 2, idleTimeoutMillis: 30000, connectionTimeoutMillis: 5000 },
    }
  : {
  type: 'postgres',
  host: process.env.DATABASE_HOST || 'localhost',
  port: parseInt(process.env.DATABASE_PORT || '5432', 10),
  username: process.env.DATABASE_USER || 'postgres',
  password: process.env.DATABASE_PASSWORD || 'postgres',
  database: process.env.DATABASE_NAME || 'protecht_bim',
  entities: [User, UserGroup, Role, Permission, Portfolio, Program, Project, WorkPackage, WorkPackageRelation, WorkPackageWatcher, WorkCalendar, Baseline, BaselineWorkPackage, Board, BoardColumn, Sprint, SprintBurndown, TimeEntry, CostEntry, CostCode, Vendor, ResourceRate, Budget, BudgetLine, ActivityLog, Comment, Attachment, WikiPage, Contract, ChangeOrder, ChangeOrderCostLine, PaymentCertificate, DailyReport, DelayEvent, SitePhoto, Snag],
  migrations: [
    process.env.NODE_ENV === 'production'
      ? 'dist/src/migrations/*.js'
      : 'src/migrations/*.ts'
  ],
  synchronize: process.env.NODE_ENV !== 'production',
  logging: process.env.NODE_ENV === 'development',
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  extra: { max: 20, min: 2, idleTimeoutMillis: 30000, connectionTimeoutMillis: 5000 },
};

// Create and export the data source
export const AppDataSource = new DataSource(dataSourceOptions);

// Initialize the data source
export const initializeDatabase = async (): Promise<DataSource> => {
  try {
    if (!AppDataSource.isInitialized) {
      await AppDataSource.initialize();
      console.log('✅ Database connection established successfully');
      console.log(`📊 Connected to: ${(dataSourceOptions as any).database}@${(dataSourceOptions as any).host}:${(dataSourceOptions as any).port}`);
    }
    return AppDataSource;
  } catch (error) {
    console.error('❌ Error during database initialization:', error);
    throw error;
  }
};
