import 'reflect-metadata';
import { DataSource, DataSourceOptions } from 'typeorm';
import { User } from '../entities/User';
import { UserGroup } from '../entities/UserGroup';
import { Role } from '../entities/Role';
import { Permission } from '../entities/Permission';
import { Portfolio } from '../entities/Portfolio';
import { Program } from '../entities/Program';
import { Project } from '../entities/Project';

/**
 * Test database configuration
 * Uses a separate test database to avoid affecting development data
 */
export const testDataSourceOptions: DataSourceOptions = {
  type: 'postgres',
  host: process.env.DATABASE_HOST || 'localhost',
  port: parseInt(process.env.DATABASE_PORT || '5432', 10),
  username: process.env.DATABASE_USER || 'postgres',
  password: process.env.DATABASE_PASSWORD || 'postgres',
  database: 'protecht_bim_test',
  entities: [User, UserGroup, Role, Permission, Portfolio, Program, Project],
  migrations: ['src/migrations/*.ts'],
  synchronize: false,
  logging: false,
  dropSchema: true, // Drop schema before each test run
};

export const TestDataSource = new DataSource(testDataSourceOptions);
