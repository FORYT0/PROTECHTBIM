import { DataSource } from 'typeorm';
import { UserRepository } from '../../repositories/UserRepository';
import { User } from '../../entities/User';
import { Role } from '../../entities/Role';
import { UserGroup } from '../../entities/UserGroup';

describe('UserRepository', () => {
  let dataSource: DataSource;
  let userRepository: UserRepository;

  beforeAll(async () => {
    dataSource = new DataSource({
      type: 'postgres',
      url: process.env.DATABASE_URL,
      entities: [User, Role, UserGroup],
      synchronize: true,
      dropSchema: true,
    });

    await dataSource.initialize();
    userRepository = new UserRepository(dataSource);
  });

  afterAll(async () => {
    await dataSource.destroy();
  });

  beforeEach(async () => {
    // Clean up tables before each test
    await dataSource.getRepository(User).clear();
    await dataSource.getRepository(Role).clear();
    await dataSource.getRepository(UserGroup).clear();
  });

  describe('create', () => {
    it('should create a new user', async () => {
      const userData = {
        email: 'test@example.com',
        name: 'Test User',
        passwordHash: 'hashed_password',
      };

      const user = await userRepository.create(userData);

      expect(user.id).toBeDefined();
      expect(user.email).toBe(userData.email);
      expect(user.name).toBe(userData.name);
      expect(user.passwordHash).toBe(userData.passwordHash);
      expect(user.status).toBe('active');
      expect(user.createdAt).toBeDefined();
    });

    it('should create a user with optional fields', async () => {
      const userData = {
        email: 'test@example.com',
        name: 'Test User',
        passwordHash: 'hashed_password',
        language: 'en',
        timezone: 'UTC',
        hourlyRate: 50.00,
        currency: 'EUR',
      };

      const user = await userRepository.create(userData);

      expect(user.language).toBe('en');
      expect(user.timezone).toBe('UTC');
      expect(user.hourlyRate).toBe(50.00);
      expect(user.currency).toBe('EUR');
    });
  });

  describe('findById', () => {
    it('should find a user by ID', async () => {
      const user = await userRepository.create({
        email: 'test@example.com',
        name: 'Test User',
        passwordHash: 'hashed_password',
      });

      const foundUser = await userRepository.findById(user.id);

      expect(foundUser).toBeDefined();
      expect(foundUser?.id).toBe(user.id);
      expect(foundUser?.email).toBe(user.email);
    });

    it('should return null for non-existent user', async () => {
      const foundUser = await userRepository.findById('00000000-0000-0000-0000-000000000000');

      expect(foundUser).toBeNull();
    });
  });

  describe('findByEmail', () => {
    it('should find a user by email', async () => {
      const user = await userRepository.create({
        email: 'test@example.com',
        name: 'Test User',
        passwordHash: 'hashed_password',
      });

      const foundUser = await userRepository.findByEmail(user.email);

      expect(foundUser).toBeDefined();
      expect(foundUser?.id).toBe(user.id);
      expect(foundUser?.email).toBe(user.email);
    });

    it('should return null for non-existent email', async () => {
      const foundUser = await userRepository.findByEmail('nonexistent@example.com');

      expect(foundUser).toBeNull();
    });
  });

  describe('findAll', () => {
    beforeEach(async () => {
      await userRepository.create({
        email: 'user1@example.com',
        name: 'User 1',
        passwordHash: 'hash1',
        status: 'active',
      });

      await userRepository.create({
        email: 'user2@example.com',
        name: 'User 2',
        passwordHash: 'hash2',
        status: 'inactive',
      });

      await userRepository.create({
        email: 'user3@example.com',
        name: 'User 3',
        passwordHash: 'hash3',
        status: 'active',
        isPlaceholder: true,
      });
    });

    it('should find all users', async () => {
      const result = await userRepository.findAll();

      expect(result.total).toBe(3);
      expect(result.users).toHaveLength(3);
    });

    it('should filter users by status', async () => {
      const result = await userRepository.findAll({ status: 'active' });

      expect(result.total).toBe(2);
      expect(result.users.every(u => u.status === 'active')).toBe(true);
    });

    it('should filter users by isPlaceholder', async () => {
      const result = await userRepository.findAll({ isPlaceholder: true });

      expect(result.total).toBe(1);
      expect(result.users[0].isPlaceholder).toBe(true);
    });

    it('should support pagination', async () => {
      const result = await userRepository.findAll({ skip: 1, take: 1 });

      expect(result.total).toBe(3);
      expect(result.users).toHaveLength(1);
    });
  });

  describe('update', () => {
    it('should update a user', async () => {
      const user = await userRepository.create({
        email: 'test@example.com',
        name: 'Test User',
        passwordHash: 'hashed_password',
      });

      const updatedUser = await userRepository.update(user.id, {
        name: 'Updated Name',
        language: 'fr',
      });

      expect(updatedUser).toBeDefined();
      expect(updatedUser?.name).toBe('Updated Name');
      expect(updatedUser?.language).toBe('fr');
      expect(updatedUser?.email).toBe(user.email);
    });

    it('should return null for non-existent user', async () => {
      const updatedUser = await userRepository.update('00000000-0000-0000-0000-000000000000', {
        name: 'Updated Name',
      });

      expect(updatedUser).toBeNull();
    });
  });

  describe('delete', () => {
    it('should delete a user', async () => {
      const user = await userRepository.create({
        email: 'test@example.com',
        name: 'Test User',
        passwordHash: 'hashed_password',
      });

      const deleted = await userRepository.delete(user.id);

      expect(deleted).toBe(true);

      const foundUser = await userRepository.findById(user.id);
      expect(foundUser).toBeNull();
    });

    it('should return false for non-existent user', async () => {
      const deleted = await userRepository.delete('00000000-0000-0000-0000-000000000000');

      expect(deleted).toBe(false);
    });
  });

  describe('updateLastLogin', () => {
    it('should update last login timestamp', async () => {
      const user = await userRepository.create({
        email: 'test@example.com',
        name: 'Test User',
        passwordHash: 'hashed_password',
      });

      expect(user.lastLoginAt).toBeUndefined();

      await userRepository.updateLastLogin(user.id);

      const updatedUser = await userRepository.findById(user.id);
      expect(updatedUser?.lastLoginAt).toBeDefined();
      expect(updatedUser?.lastLoginAt).toBeInstanceOf(Date);
    });
  });

  describe('emailExists', () => {
    it('should return true if email exists', async () => {
      await userRepository.create({
        email: 'test@example.com',
        name: 'Test User',
        passwordHash: 'hashed_password',
      });

      const exists = await userRepository.emailExists('test@example.com');

      expect(exists).toBe(true);
    });

    it('should return false if email does not exist', async () => {
      const exists = await userRepository.emailExists('nonexistent@example.com');

      expect(exists).toBe(false);
    });

    it('should exclude specific user ID when checking', async () => {
      const user = await userRepository.create({
        email: 'test@example.com',
        name: 'Test User',
        passwordHash: 'hashed_password',
      });

      const exists = await userRepository.emailExists('test@example.com', user.id);

      expect(exists).toBe(false);
    });
  });
});
