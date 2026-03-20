import request from 'supertest';
import express, { Express } from 'express';
import { createAuthRouter } from '../../routes/auth.routes';
import { AuthService } from '../../services/auth.service';
import { UserRepository } from '../../repositories/UserRepository';
import { User } from '../../entities/User';
import { hashPassword } from '@protecht-bim/shared-utils';

// Mock the UserRepository
jest.mock('../../repositories/UserRepository');

describe('Auth Routes', () => {
  let app: Express;
  let authService: AuthService;
  let mockUserRepository: jest.Mocked<UserRepository>;

  const mockUser: User = {
    id: '123e4567-e89b-12d3-a456-426614174000',
    email: 'test@example.com',
    name: 'Test User',
    passwordHash: '$2b$10$abcdefghijklmnopqrstuv',
    status: 'active',
    currency: 'USD',
    isPlaceholder: false,
    createdAt: new Date(),
    updatedAt: new Date(),
    roles: [{ id: '1', name: 'user', description: 'Regular user' } as any],
    groups: [],
  };

  beforeEach(() => {
    jest.clearAllMocks();

    // Create mock repository
    mockUserRepository = new UserRepository({} as any) as jest.Mocked<UserRepository>;

    // Set environment variables
    process.env.JWT_SECRET = 'test-secret-key';
    process.env.JWT_EXPIRES_IN = '3600';
    process.env.JWT_REFRESH_EXPIRES_IN = '604800';

    // Create auth service
    authService = new AuthService(mockUserRepository);

    // Create Express app with auth routes
    app = express();
    app.use(express.json());
    app.use('/api/v1/auth', createAuthRouter(authService));
  });

  describe('POST /api/v1/auth/register', () => {
    it('should register a new user successfully', async () => {
      mockUserRepository.findByEmail.mockResolvedValue(null);
      mockUserRepository.create.mockResolvedValue(mockUser);

      const response = await request(app)
        .post('/api/v1/auth/register')
        .send({
          email: 'newuser@example.com',
          password: 'password123',
          name: 'New User',
        });

      expect(response.status).toBe(201);
      expect(response.body.message).toBe('User registered successfully');
      expect(response.body.user).toBeDefined();
      expect(response.body.user.passwordHash).toBeUndefined();
      expect(response.body.tokens).toBeDefined();
      expect(response.body.tokens.accessToken).toBeDefined();
    });

    it('should return 400 for missing fields', async () => {
      const response = await request(app)
        .post('/api/v1/auth/register')
        .send({
          email: 'test@example.com',
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Bad Request');
    });

    it('should return 400 for invalid email format', async () => {
      const response = await request(app)
        .post('/api/v1/auth/register')
        .send({
          email: 'invalid-email',
          password: 'password123',
          name: 'Test User',
        });

      expect(response.status).toBe(400);
      expect(response.body.message).toContain('Invalid email format');
    });

    it('should return 400 for short password', async () => {
      const response = await request(app)
        .post('/api/v1/auth/register')
        .send({
          email: 'test@example.com',
          password: 'short',
          name: 'Test User',
        });

      expect(response.status).toBe(400);
      expect(response.body.message).toContain('at least 8 characters');
    });

    it('should return 409 for existing email', async () => {
      mockUserRepository.findByEmail.mockResolvedValue(mockUser);

      const response = await request(app)
        .post('/api/v1/auth/register')
        .send({
          email: 'test@example.com',
          password: 'password123',
          name: 'Test User',
        });

      expect(response.status).toBe(409);
      expect(response.body.message).toBe('Email already exists');
    });
  });

  describe('POST /api/v1/auth/login', () => {
    it('should login successfully with valid credentials', async () => {
      const password = 'password123';
      const hashedPassword = await hashPassword(password);
      const userWithHashedPassword = { ...mockUser, passwordHash: hashedPassword };

      mockUserRepository.findByEmail.mockResolvedValue(userWithHashedPassword);
      mockUserRepository.updateLastLogin.mockResolvedValue();

      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'test@example.com',
          password: password,
        });

      expect(response.status).toBe(200);
      expect(response.body.message).toBe('Login successful');
      expect(response.body.user).toBeDefined();
      expect(response.body.user.passwordHash).toBeUndefined();
      expect(response.body.tokens).toBeDefined();
    });

    it('should return 400 for missing credentials', async () => {
      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'test@example.com',
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Bad Request');
    });

    it('should return 401 for invalid credentials', async () => {
      mockUserRepository.findByEmail.mockResolvedValue(null);

      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'test@example.com',
          password: 'wrongpassword',
        });

      expect(response.status).toBe(401);
      expect(response.body.message).toBe('Invalid email or password');
    });

    it('should return 403 for inactive user', async () => {
      const password = 'password123';
      const hashedPassword = await hashPassword(password);
      const inactiveUser = { ...mockUser, passwordHash: hashedPassword, status: 'inactive' as const };

      mockUserRepository.findByEmail.mockResolvedValue(inactiveUser);

      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'test@example.com',
          password: password,
        });

      expect(response.status).toBe(403);
      expect(response.body.message).toContain('not active');
    });
  });

  describe('POST /api/v1/auth/refresh', () => {
    it('should refresh tokens successfully', async () => {
      const tokens = authService.generateTokens(mockUser);
      mockUserRepository.findById.mockResolvedValue(mockUser);

      const response = await request(app)
        .post('/api/v1/auth/refresh')
        .send({
          refreshToken: tokens.refreshToken,
        });

      expect(response.status).toBe(200);
      expect(response.body.message).toBe('Token refreshed successfully');
      expect(response.body.tokens).toBeDefined();
    });

    it('should return 400 for missing refresh token', async () => {
      const response = await request(app)
        .post('/api/v1/auth/refresh')
        .send({});

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Bad Request');
    });

    it('should return 401 for invalid refresh token', async () => {
      const response = await request(app)
        .post('/api/v1/auth/refresh')
        .send({
          refreshToken: 'invalid-token',
        });

      expect(response.status).toBe(401);
      expect(response.body.message).toContain('Invalid or expired');
    });
  });

  describe('POST /api/v1/auth/logout', () => {
    it('should logout successfully with valid token', async () => {
      const tokens = authService.generateTokens(mockUser);

      const response = await request(app)
        .post('/api/v1/auth/logout')
        .set('Authorization', `Bearer ${tokens.accessToken}`)
        .send();

      expect(response.status).toBe(200);
      expect(response.body.message).toBe('Logout successful');
    });

    it('should return 401 without token', async () => {
      const response = await request(app)
        .post('/api/v1/auth/logout')
        .send();

      expect(response.status).toBe(401);
      expect(response.body.error).toBe('Unauthorized');
    });
  });

  describe('GET /api/v1/auth/me', () => {
    it('should return user info with valid token', async () => {
      const tokens = authService.generateTokens(mockUser);

      const response = await request(app)
        .get('/api/v1/auth/me')
        .set('Authorization', `Bearer ${tokens.accessToken}`);

      expect(response.status).toBe(200);
      expect(response.body.user).toBeDefined();
      expect(response.body.user.userId).toBe(mockUser.id);
      expect(response.body.user.email).toBe(mockUser.email);
    });

    it('should return 401 without token', async () => {
      const response = await request(app)
        .get('/api/v1/auth/me');

      expect(response.status).toBe(401);
    });

    it('should return 401 with invalid token', async () => {
      const response = await request(app)
        .get('/api/v1/auth/me')
        .set('Authorization', 'Bearer invalid-token');

      expect(response.status).toBe(401);
    });
  });

  describe('POST /api/v1/auth/change-password', () => {
    it('should change password successfully', async () => {
      const oldPassword = 'oldpassword123';
      const newPassword = 'newpassword123';
      const hashedOldPassword = await hashPassword(oldPassword);
      const userWithPassword = { ...mockUser, passwordHash: hashedOldPassword };

      mockUserRepository.findById.mockResolvedValue(userWithPassword);
      mockUserRepository.update.mockResolvedValue(mockUser);

      const tokens = authService.generateTokens(mockUser);

      const response = await request(app)
        .post('/api/v1/auth/change-password')
        .set('Authorization', `Bearer ${tokens.accessToken}`)
        .send({
          oldPassword: oldPassword,
          newPassword: newPassword,
        });

      expect(response.status).toBe(200);
      expect(response.body.message).toBe('Password changed successfully');
    });

    it('should return 400 for missing passwords', async () => {
      const tokens = authService.generateTokens(mockUser);

      const response = await request(app)
        .post('/api/v1/auth/change-password')
        .set('Authorization', `Bearer ${tokens.accessToken}`)
        .send({
          oldPassword: 'oldpassword',
        });

      expect(response.status).toBe(400);
    });

    it('should return 400 for short new password', async () => {
      const tokens = authService.generateTokens(mockUser);

      const response = await request(app)
        .post('/api/v1/auth/change-password')
        .set('Authorization', `Bearer ${tokens.accessToken}`)
        .send({
          oldPassword: 'oldpassword123',
          newPassword: 'short',
        });

      expect(response.status).toBe(400);
      expect(response.body.message).toContain('at least 8 characters');
    });

    it('should return 401 for invalid old password', async () => {
      const hashedPassword = await hashPassword('correctpassword');
      const userWithPassword = { ...mockUser, passwordHash: hashedPassword };

      mockUserRepository.findById.mockResolvedValue(userWithPassword);

      const tokens = authService.generateTokens(mockUser);

      const response = await request(app)
        .post('/api/v1/auth/change-password')
        .set('Authorization', `Bearer ${tokens.accessToken}`)
        .send({
          oldPassword: 'wrongpassword',
          newPassword: 'newpassword123',
        });

      expect(response.status).toBe(401);
      expect(response.body.message).toBe('Invalid old password');
    });

    it('should return 401 without token', async () => {
      const response = await request(app)
        .post('/api/v1/auth/change-password')
        .send({
          oldPassword: 'oldpassword',
          newPassword: 'newpassword',
        });

      expect(response.status).toBe(401);
    });
  });
});
