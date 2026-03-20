# Repository Layer

This directory contains the repository classes that provide data access operations for the PROTECHT BIM application.

## Overview

Repositories encapsulate database operations and provide a clean API for interacting with entities. They use TypeORM's DataSource and Repository classes to perform CRUD operations and complex queries.

## Available Repositories

### UserRepository

Manages user data and operations.

**Methods:**
- `create(userData)` - Create a new user
- `findById(id)` - Find user by ID with roles and groups
- `findByEmail(email)` - Find user by email
- `findAll(options)` - Find all users with filtering and pagination
- `update(id, userData)` - Update user data
- `delete(id)` - Delete a user
- `updateLastLogin(id)` - Update last login timestamp
- `assignRoles(userId, roleIds)` - Assign roles to a user
- `assignGroups(userId, groupIds)` - Assign groups to a user
- `emailExists(email, excludeUserId?)` - Check if email is already in use

**Example Usage:**
```typescript
import { DataSource } from 'typeorm';
import { UserRepository } from './repositories/UserRepository';

const dataSource = new DataSource({ /* config */ });
await dataSource.initialize();

const userRepo = new UserRepository(dataSource);

// Create a user
const user = await userRepo.create({
  email: 'john@example.com',
  name: 'John Doe',
  passwordHash: 'hashed_password',
  language: 'en',
  timezone: 'UTC',
});

// Find user by email
const foundUser = await userRepo.findByEmail('john@example.com');

// Update user
await userRepo.update(user.id, { name: 'John Smith' });

// Assign roles
await userRepo.assignRoles(user.id, [roleId1, roleId2]);
```

### UserGroupRepository

Manages user groups for permission management.

**Methods:**
- `create(groupData)` - Create a new user group
- `findById(id)` - Find group by ID with users
- `findAll(options)` - Find all groups with pagination
- `update(id, groupData)` - Update group data
- `delete(id)` - Delete a group
- `addUsers(groupId, userIds)` - Add users to a group
- `removeUsers(groupId, userIds)` - Remove users from a group
- `nameExists(name, excludeGroupId?)` - Check if group name exists

**Example Usage:**
```typescript
import { UserGroupRepository } from './repositories/UserGroupRepository';

const groupRepo = new UserGroupRepository(dataSource);

// Create a group
const group = await groupRepo.create({
  name: 'Developers',
  description: 'Development team members',
});

// Add users to group
await groupRepo.addUsers(group.id, [userId1, userId2]);

// Remove users from group
await groupRepo.removeUsers(group.id, [userId1]);
```

## Testing

Unit tests are located in `src/__tests__/repositories/` and use Jest with an in-memory test database.

Run tests:
```bash
npm test
```

Run tests with coverage:
```bash
npm test -- --coverage
```

## Design Patterns

### Repository Pattern
Repositories abstract the data layer and provide a collection-like interface for accessing domain objects. This pattern:
- Separates business logic from data access logic
- Makes testing easier by allowing mock repositories
- Provides a centralized place for data access logic
- Enables easier database technology changes

### Dependency Injection
Repositories accept a DataSource in their constructor, allowing for:
- Easy testing with test databases
- Multiple database connections
- Better separation of concerns

## Best Practices

1. **Always use repositories** - Never access TypeORM repositories directly from controllers or services
2. **Return domain entities** - Repositories should return entity instances, not plain objects
3. **Handle relations explicitly** - Use the `relations` option to load related entities when needed
4. **Use transactions** - For operations that modify multiple entities, use TypeORM transactions
5. **Validate input** - Repositories should validate input data before database operations
6. **Handle errors gracefully** - Return null for not-found cases, throw errors for unexpected failures

## Future Enhancements

- Add caching layer using Redis
- Implement soft delete functionality
- Add audit logging for all operations
- Implement query builders for complex filtering
- Add bulk operations for better performance
