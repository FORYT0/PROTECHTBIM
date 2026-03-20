import { AuthService } from '../../services/auth.service';
import { UserRepository } from '../../repositories/UserRepository';
import { User } from '../../entities/User';
import { hashPassword } from '@protecht-bim/shared-utils';
import jwt from 'jsonwebtoken';

// Mock the UserRepository
jest.mock('../../repositories/UserRepository');

describe('AuthService', () => {
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
    // Clear all mocks before each test
    jest.clearAllMocks();

    // Create mock repository
    mockUserRepository = new UserRepository({} as any) as jest.Mocked<UserRepository>;

    // Set environment variables for testing
    process.env.JWT_SECRET = 'test-secret-key';
    process.env.JWT_EXPIRES_IN = '3600';
    process.env.JWT_REFRESH_EXPIRES_IN = '604800';

    // Create auth service with mocked repository
    authService = new AuthService(mockUserRepository);
  });

  describe('login', () => {
    it('should successfully login with valid credentials', async () => {
      const password = 'password123';
      const hashedPassword = await hashPassword(password);
      const userWithHashedPassword = { ...mockUser, passwordHash: hashedPassword };

      mockUserRepository.findByEmail.mockResolvedValue(userWithHashedPassword);
      mockUserRepository.updateLastLogin.mockResolvedValue();

      const result = await authService.login({
        email: 'test@example.com',
        password: password,
      });

      expect(result).not.toBeNull();
      expect(result?.user.email).toBe('test@example.com');
      expect(result?.tokens.accessToken).toBeDefined();
      expect(result?.tokens.refreshToken).toBeDefined();
      expect(mockUserRepository.updateLastLogin).toHaveBeenCalledWith(mockUser.id);
    });

    it('should return null for invalid email', async () => {
      mockUserRepository.findByEmail.mockResolvedValue(null);

      const result = await authService.login({
        email: 'nonexistent@example.com',
        password: 'password123',
      });

      expect(result).toBeNull();
    });

    it('should return null for invalid password', async () => {
      const hashedPassword = await hashPassword('correctpassword');
      const userWithHashedPassword = { ...mockUser, passwordHash: hashedPassword };

      mockUserRepository.findByEmail.mockResolvedValue(userWithHashedPassword);

      const result = await authService.login({
        email: 'test@example.com',
        password: 'wrongpassword',
      });

      expect(result).toBeNull();
    });

    it('should throw error for inactive user', async () => {
      const password = 'password123';
      const hashedPassword = await hashPassword(password);
      const inactiveUser = { ...mockUser, passwordHash: hashedPassword, status: 'inactive' as const };

      mockUserRepository.findByEmail.mockResolvedValue(inactiveUser);

      await expect(
        authService.login({
          email: 'test@example.com',
          password: password,
        })
      ).rejects.toThrow('User account is not active');
    });
  });

  describe('generateTokens', () => {
    it('should generate valid access and refresh tokens', () => {
      const tokens = authService.generateTokens(mockUser);

      expect(tokens.accessToken).toBeDefined();
      expect(tokens.refreshToken).toBeDefined();
      expect(tokens.expiresIn).toBe(3600);

      // Verify access token payload
      const accessPayload = jwt.decode(tokens.accessToken) as any;
      expect(accessPayload.userId).toBe(mockUser.id);
      expect(accessPayload.email).toBe(mockUser.email);
      expect(accessPayload.roles).toEqual(['user']);

      // Verify refresh token payload
      const refreshPayload = jwt.decode(tokens.refreshToken) as any;
      expect(refreshPayload.userId).toBe(mockUser.id);
      expect(refreshPayload.type).toBe('refresh');
    });
  });

  describe('verifyAccessToken', () => {
    it('should verify valid access token', () => {
      const tokens = authService.generateTokens(mockUser);
      const decoded = authService.verifyAccessToken(tokens.accessToken);

      expect(decoded).not.toBeNull();
      expect(decoded?.userId).toBe(mockUser.id);
      expect(decoded?.email).toBe(mockUser.email);
    });

    it('should return null for invalid token', () => {
      const decoded = authService.verifyAccessToken('invalid-token');
      expect(decoded).toBeNull();
    });

    it('should return null for expired token', () => {
      // Create token with immediate expiration
      const expiredToken = jwt.sign(
        { userId: mockUser.id, email: mockUser.email, roles: [] },
        'test-secret-key',
        { expiresIn: '0s' }
      );

      // Wait a bit to ensure expiration
      const decoded = authService.verifyAccessToken(expiredToken);
      expect(decoded).toBeNull();
    });

    it('should reject refresh token as access token', () => {
      const tokens = authService.generateTokens(mockUser);
      const decoded = authService.verifyAccessToken(tokens.refreshToken);
      expect(decoded).toBeNull();
    });
  });

  describe('verifyRefreshToken', () => {
    it('should verify valid refresh token', () => {
      const tokens = authService.generateTokens(mockUser);
      const decoded = authService.verifyRefreshToken(tokens.refreshToken);

      expect(decoded).not.toBeNull();
      expect(decoded?.userId).toBe(mockUser.id);
      expect(decoded?.type).toBe('refresh');
    });

    it('should return null for invalid token', () => {
      const decoded = authService.verifyRefreshToken('invalid-token');
      expect(decoded).toBeNull();
    });

    it('should reject access token as refresh token', () => {
      const tokens = authService.generateTokens(mockUser);
      const decoded = authService.verifyRefreshToken(tokens.accessToken);
      expect(decoded).toBeNull();
    });
  });

  describe('refreshAccessToken', () => {
    it('should generate new tokens with valid refresh token', async () => {
      const tokens = authService.generateTokens(mockUser);
      mockUserRepository.findById.mockResolvedValue(mockUser);

      const newTokens = await authService.refreshAccessToken(tokens.refreshToken);

      expect(newTokens).not.toBeNull();
      expect(newTokens?.accessToken).toBeDefined();
      expect(newTokens?.refreshToken).toBeDefined();
      
      // Verify the new access token is valid
      const decoded = authService.verifyAccessToken(newTokens!.accessToken);
      expect(decoded?.userId).toBe(mockUser.id);
    });

    it('should return null for invalid refresh token', async () => {
      const newTokens = await authService.refreshAccessToken('invalid-token');
      expect(newTokens).toBeNull();
    });

    it('should return null if user not found', async () => {
      const tokens = authService.generateTokens(mockUser);
      mockUserRepository.findById.mockResolvedValue(null);

      const newTokens = await authService.refreshAccessToken(tokens.refreshToken);
      expect(newTokens).toBeNull();
    });

    it('should return null if user is inactive', async () => {
      const tokens = authService.generateTokens(mockUser);
      const inactiveUser = { ...mockUser, status: 'inactive' as const };
      mockUserRepository.findById.mockResolvedValue(inactiveUser);

      const newTokens = await authService.refreshAccessToken(tokens.refreshToken);
      expect(newTokens).toBeNull();
    });
  });

  describe('register', () => {
    it('should successfully register a new user', async () => {
      mockUserRepository.findByEmail.mockResolvedValue(null);
      mockUserRepository.create.mockResolvedValue(mockUser);

      const result = await authService.register({
        email: 'newuser@example.com',
        password: 'password123',
        name: 'New User',
      });

      expect(result.user).toBeDefined();
      expect(result.tokens).toBeDefined();
      expect(mockUserRepository.create).toHaveBeenCalled();
    });

    it('should throw error if email already exists', async () => {
      mockUserRepository.findByEmail.mockResolvedValue(mockUser);

      await expect(
        authService.register({
          email: 'test@example.com',
          password: 'password123',
          name: 'Test User',
        })
      ).rejects.toThrow('Email already exists');
    });
  });

  describe('changePassword', () => {
    it('should successfully change password with valid old password', async () => {
      const oldPassword = 'oldpassword123';
      const newPassword = 'newpassword123';
      const hashedOldPassword = await hashPassword(oldPassword);
      const userWithPassword = { ...mockUser, passwordHash: hashedOldPassword };

      mockUserRepository.findById.mockResolvedValue(userWithPassword);
      mockUserRepository.update.mockResolvedValue(mockUser);

      const result = await authService.changePassword(
        mockUser.id,
        oldPassword,
        newPassword
      );

      expect(result).toBe(true);
      expect(mockUserRepository.update).toHaveBeenCalled();
    });

    it('should return false for invalid old password', async () => {
      const hashedPassword = await hashPassword('correctpassword');
      const userWithPassword = { ...mockUser, passwordHash: hashedPassword };

      mockUserRepository.findById.mockResolvedValue(userWithPassword);

      const result = await authService.changePassword(
        mockUser.id,
        'wrongpassword',
        'newpassword123'
      );

      expect(result).toBe(false);
      expect(mockUserRepository.update).not.toHaveBeenCalled();
    });

    it('should return false if user not found', async () => {
      mockUserRepository.findById.mockResolvedValue(null);

      const result = await authService.changePassword(
        'nonexistent-id',
        'oldpassword',
        'newpassword'
      );

      expect(result).toBe(false);
    });
  });

  describe('logout', () => {
    it('should log logout action', async () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      await authService.logout(mockUser.id);

      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining(mockUser.id));
      consoleSpy.mockRestore();
    });
  });
});
