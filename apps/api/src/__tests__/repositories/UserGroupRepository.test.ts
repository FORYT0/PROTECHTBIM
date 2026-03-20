import { DataSource } from 'typeorm';
import { UserGroupRepository } from '../../repositories/UserGroupRepository';
import { UserRepository } from '../../repositories/UserRepository';
import { User } from '../../entities/User';
import { UserGroup } from '../../entities/UserGroup';

describe('UserGroupRepository', () => {
  let dataSource: DataSource;
  let userGroupRepository: UserGroupRepository;
  let userRepository: UserRepository;

  beforeAll(async () => {
    dataSource = new DataSource({
      type: 'postgres',
      url: process.env.DATABASE_URL,
      entities: [User, UserGroup],
      synchronize: true,
      dropSchema: true,
    });

    await dataSource.initialize();
    userGroupRepository = new UserGroupRepository(dataSource);
    userRepository = new UserRepository(dataSource);
  });

  afterAll(async () => {
    await dataSource.destroy();
  });

  beforeEach(async () => {
    await dataSource.getRepository(UserGroup).clear();
    await dataSource.getRepository(User).clear();
  });

  describe('create', () => {
    it('should create a new user group', async () => {
      const groupData = {
        name: 'Test Group',
        description: 'A test group',
      };

      const group = await userGroupRepository.create(groupData);

      expect(group.id).toBeDefined();
      expect(group.name).toBe(groupData.name);
      expect(group.description).toBe(groupData.description);
      expect(group.createdAt).toBeDefined();
    });

    it('should create a group without description', async () => {
      const groupData = {
        name: 'Test Group',
      };

      const group = await userGroupRepository.create(groupData);

      expect(group.name).toBe(groupData.name);
      expect(group.description).toBeUndefined();
    });
  });

  describe('findById', () => {
    it('should find a group by ID', async () => {
      const group = await userGroupRepository.create({
        name: 'Test Group',
        description: 'A test group',
      });

      const foundGroup = await userGroupRepository.findById(group.id);

      expect(foundGroup).toBeDefined();
      expect(foundGroup?.id).toBe(group.id);
      expect(foundGroup?.name).toBe(group.name);
    });

    it('should return null for non-existent group', async () => {
      const foundGroup = await userGroupRepository.findById('00000000-0000-0000-0000-000000000000');

      expect(foundGroup).toBeNull();
    });
  });

  describe('findAll', () => {
    beforeEach(async () => {
      await userGroupRepository.create({ name: 'Group 1', description: 'First group' });
      await userGroupRepository.create({ name: 'Group 2', description: 'Second group' });
      await userGroupRepository.create({ name: 'Group 3', description: 'Third group' });
    });

    it('should find all groups', async () => {
      const result = await userGroupRepository.findAll();

      expect(result.total).toBe(3);
      expect(result.groups).toHaveLength(3);
    });

    it('should support pagination', async () => {
      const result = await userGroupRepository.findAll({ skip: 1, take: 1 });

      expect(result.total).toBe(3);
      expect(result.groups).toHaveLength(1);
    });
  });

  describe('update', () => {
    it('should update a group', async () => {
      const group = await userGroupRepository.create({
        name: 'Test Group',
        description: 'Original description',
      });

      const updatedGroup = await userGroupRepository.update(group.id, {
        name: 'Updated Group',
        description: 'Updated description',
      });

      expect(updatedGroup).toBeDefined();
      expect(updatedGroup?.name).toBe('Updated Group');
      expect(updatedGroup?.description).toBe('Updated description');
    });

    it('should return null for non-existent group', async () => {
      const updatedGroup = await userGroupRepository.update('00000000-0000-0000-0000-000000000000', {
        name: 'Updated Group',
      });

      expect(updatedGroup).toBeNull();
    });
  });

  describe('delete', () => {
    it('should delete a group', async () => {
      const group = await userGroupRepository.create({
        name: 'Test Group',
        description: 'A test group',
      });

      const deleted = await userGroupRepository.delete(group.id);

      expect(deleted).toBe(true);

      const foundGroup = await userGroupRepository.findById(group.id);
      expect(foundGroup).toBeNull();
    });

    it('should return false for non-existent group', async () => {
      const deleted = await userGroupRepository.delete('00000000-0000-0000-0000-000000000000');

      expect(deleted).toBe(false);
    });
  });

  describe('addUsers', () => {
    it('should add users to a group', async () => {
      const group = await userGroupRepository.create({
        name: 'Test Group',
      });

      const user1 = await userRepository.create({
        email: 'user1@example.com',
        name: 'User 1',
        passwordHash: 'hash1',
      });

      const user2 = await userRepository.create({
        email: 'user2@example.com',
        name: 'User 2',
        passwordHash: 'hash2',
      });

      const updatedGroup = await userGroupRepository.addUsers(group.id, [user1.id, user2.id]);

      expect(updatedGroup).toBeDefined();
      expect(updatedGroup?.users).toHaveLength(2);
      expect(updatedGroup?.users.map(u => u.id)).toContain(user1.id);
      expect(updatedGroup?.users.map(u => u.id)).toContain(user2.id);
    });

    it('should not add duplicate users', async () => {
      const group = await userGroupRepository.create({
        name: 'Test Group',
      });

      const user = await userRepository.create({
        email: 'user@example.com',
        name: 'User',
        passwordHash: 'hash',
      });

      await userGroupRepository.addUsers(group.id, [user.id]);
      const updatedGroup = await userGroupRepository.addUsers(group.id, [user.id]);

      expect(updatedGroup?.users).toHaveLength(1);
    });

    it('should return null for non-existent group', async () => {
      const updatedGroup = await userGroupRepository.addUsers('00000000-0000-0000-0000-000000000000', []);

      expect(updatedGroup).toBeNull();
    });
  });

  describe('removeUsers', () => {
    it('should remove users from a group', async () => {
      const group = await userGroupRepository.create({
        name: 'Test Group',
      });

      const user1 = await userRepository.create({
        email: 'user1@example.com',
        name: 'User 1',
        passwordHash: 'hash1',
      });

      const user2 = await userRepository.create({
        email: 'user2@example.com',
        name: 'User 2',
        passwordHash: 'hash2',
      });

      await userGroupRepository.addUsers(group.id, [user1.id, user2.id]);

      const updatedGroup = await userGroupRepository.removeUsers(group.id, [user1.id]);

      expect(updatedGroup).toBeDefined();
      expect(updatedGroup?.users).toHaveLength(1);
      expect(updatedGroup?.users[0].id).toBe(user2.id);
    });

    it('should return null for non-existent group', async () => {
      const updatedGroup = await userGroupRepository.removeUsers('00000000-0000-0000-0000-000000000000', []);

      expect(updatedGroup).toBeNull();
    });
  });

  describe('nameExists', () => {
    it('should return true if name exists', async () => {
      await userGroupRepository.create({
        name: 'Test Group',
      });

      const exists = await userGroupRepository.nameExists('Test Group');

      expect(exists).toBe(true);
    });

    it('should return false if name does not exist', async () => {
      const exists = await userGroupRepository.nameExists('Nonexistent Group');

      expect(exists).toBe(false);
    });

    it('should exclude specific group ID when checking', async () => {
      const group = await userGroupRepository.create({
        name: 'Test Group',
      });

      const exists = await userGroupRepository.nameExists('Test Group', group.id);

      expect(exists).toBe(false);
    });
  });
});
