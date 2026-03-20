import 'reflect-metadata';
import { Portfolio } from '../../entities/Portfolio';
import { Program } from '../../entities/Program';
import { Project, ProjectStatus, LifecyclePhase } from '../../entities/Project';

describe('Project Hierarchy Entities', () => {
  describe('Portfolio Entity', () => {
    it('should create a portfolio instance with required fields', () => {
      const portfolio = new Portfolio();
      portfolio.name = 'Test Portfolio';
      portfolio.ownerId = '123e4567-e89b-12d3-a456-426614174000';

      expect(portfolio.name).toBe('Test Portfolio');
      expect(portfolio.ownerId).toBe('123e4567-e89b-12d3-a456-426614174000');
    });

    it('should support optional description and custom fields', () => {
      const portfolio = new Portfolio();
      portfolio.name = 'Test Portfolio';
      portfolio.ownerId = '123e4567-e89b-12d3-a456-426614174000';
      portfolio.description = 'Test description';
      portfolio.customFields = { key: 'value' };

      expect(portfolio.description).toBe('Test description');
      expect(portfolio.customFields).toEqual({ key: 'value' });
    });
  });

  describe('Program Entity', () => {
    it('should create a program instance with required fields', () => {
      const program = new Program();
      program.name = 'Test Program';
      program.ownerId = '123e4567-e89b-12d3-a456-426614174000';

      expect(program.name).toBe('Test Program');
      expect(program.ownerId).toBe('123e4567-e89b-12d3-a456-426614174000');
    });

    it('should support optional portfolio relationship', () => {
      const program = new Program();
      program.name = 'Test Program';
      program.ownerId = '123e4567-e89b-12d3-a456-426614174000';
      program.portfolioId = '123e4567-e89b-12d3-a456-426614174001';

      expect(program.portfolioId).toBe('123e4567-e89b-12d3-a456-426614174001');
    });

    it('should support custom fields', () => {
      const program = new Program();
      program.name = 'Test Program';
      program.ownerId = '123e4567-e89b-12d3-a456-426614174000';
      program.customFields = { budget: 1000000 };

      expect(program.customFields).toEqual({ budget: 1000000 });
    });
  });

  describe('Project Entity', () => {
    it('should create a project instance with required fields', () => {
      const project = new Project();
      project.name = 'Test Project';
      project.ownerId = '123e4567-e89b-12d3-a456-426614174000';
      project.status = ProjectStatus.ACTIVE;
      project.lifecyclePhase = LifecyclePhase.INITIATION;

      expect(project.name).toBe('Test Project');
      expect(project.ownerId).toBe('123e4567-e89b-12d3-a456-426614174000');
      expect(project.status).toBe(ProjectStatus.ACTIVE);
      expect(project.lifecyclePhase).toBe(LifecyclePhase.INITIATION);
    });

    it('should support all project statuses', () => {
      expect(ProjectStatus.ACTIVE).toBe('active');
      expect(ProjectStatus.ON_HOLD).toBe('on_hold');
      expect(ProjectStatus.COMPLETED).toBe('completed');
      expect(ProjectStatus.ARCHIVED).toBe('archived');
    });

    it('should support all lifecycle phases', () => {
      expect(LifecyclePhase.INITIATION).toBe('initiation');
      expect(LifecyclePhase.PLANNING).toBe('planning');
      expect(LifecyclePhase.EXECUTION).toBe('execution');
      expect(LifecyclePhase.MONITORING).toBe('monitoring');
      expect(LifecyclePhase.CLOSURE).toBe('closure');
    });

    it('should support optional program and portfolio relationships', () => {
      const project = new Project();
      project.name = 'Test Project';
      project.ownerId = '123e4567-e89b-12d3-a456-426614174000';
      project.status = ProjectStatus.ACTIVE;
      project.lifecyclePhase = LifecyclePhase.PLANNING;
      project.programId = '123e4567-e89b-12d3-a456-426614174001';
      project.portfolioId = '123e4567-e89b-12d3-a456-426614174002';

      expect(project.programId).toBe('123e4567-e89b-12d3-a456-426614174001');
      expect(project.portfolioId).toBe('123e4567-e89b-12d3-a456-426614174002');
    });

    it('should support optional dates and custom fields', () => {
      const project = new Project();
      project.name = 'Test Project';
      project.ownerId = '123e4567-e89b-12d3-a456-426614174000';
      project.status = ProjectStatus.ACTIVE;
      project.lifecyclePhase = LifecyclePhase.EXECUTION;
      project.startDate = new Date('2024-01-01');
      project.endDate = new Date('2024-12-31');
      project.customFields = { priority: 'high', budget: 500000 };

      expect(project.startDate).toEqual(new Date('2024-01-01'));
      expect(project.endDate).toEqual(new Date('2024-12-31'));
      expect(project.customFields).toEqual({ priority: 'high', budget: 500000 });
    });

    it('should support template reference', () => {
      const project = new Project();
      project.name = 'Test Project';
      project.ownerId = '123e4567-e89b-12d3-a456-426614174000';
      project.status = ProjectStatus.ACTIVE;
      project.lifecyclePhase = LifecyclePhase.INITIATION;
      project.templateId = '123e4567-e89b-12d3-a456-426614174003';

      expect(project.templateId).toBe('123e4567-e89b-12d3-a456-426614174003');
    });
  });

  describe('Entity Relationships', () => {
    it('should define Portfolio to Program relationship', () => {
      const portfolio = new Portfolio();
      const program = new Program();
      
      portfolio.name = 'Test Portfolio';
      portfolio.ownerId = '123e4567-e89b-12d3-a456-426614174000';
      
      program.name = 'Test Program';
      program.ownerId = '123e4567-e89b-12d3-a456-426614174000';
      program.portfolioId = '123e4567-e89b-12d3-a456-426614174001';

      // Verify the relationship can be set
      expect(program.portfolioId).toBeDefined();
    });

    it('should define Program to Project relationship', () => {
      const program = new Program();
      const project = new Project();
      
      program.name = 'Test Program';
      program.ownerId = '123e4567-e89b-12d3-a456-426614174000';
      
      project.name = 'Test Project';
      project.ownerId = '123e4567-e89b-12d3-a456-426614174000';
      project.status = ProjectStatus.ACTIVE;
      project.lifecyclePhase = LifecyclePhase.INITIATION;
      project.programId = '123e4567-e89b-12d3-a456-426614174001';

      // Verify the relationship can be set
      expect(project.programId).toBeDefined();
    });

    it('should allow Project to reference Portfolio directly', () => {
      const project = new Project();
      
      project.name = 'Test Project';
      project.ownerId = '123e4567-e89b-12d3-a456-426614174000';
      project.status = ProjectStatus.ACTIVE;
      project.lifecyclePhase = LifecyclePhase.INITIATION;
      project.portfolioId = '123e4567-e89b-12d3-a456-426614174002';

      // Verify the direct portfolio relationship can be set
      expect(project.portfolioId).toBeDefined();
    });
  });
});
