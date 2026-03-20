import jwt from 'jsonwebtoken';
import { User } from '../entities/User';
import { UserRepository } from '../repositories/UserRepository';
import { hashPassword, validatePassword } from '@protecht-bim/shared-utils';

export interface TokenPayload {
  userId: string;
  email: string;
  roles: string[];
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RefreshTokenPayload {
  userId: string;
  type: 'refresh';
}

export class AuthService {
  private userRepository: UserRepository;
  private jwtSecret: string;
  private jwtExpiresIn: number;
  private jwtRefreshExpiresIn: number;

  constructor(userRepository: UserRepository) {
    this.userRepository = userRepository;
    this.jwtSecret = process.env.JWT_SECRET || 'dev-secret-key-change-in-production';
    this.jwtExpiresIn = parseInt(process.env.JWT_EXPIRES_IN || '3600', 10);
    this.jwtRefreshExpiresIn = parseInt(process.env.JWT_REFRESH_EXPIRES_IN || '604800', 10);

    if (this.jwtSecret === 'dev-secret-key-change-in-production' && process.env.NODE_ENV === 'production') {
      throw new Error('JWT_SECRET must be set in production environment');
    }
  }

  /**
   * Authenticate user with email and password
   */
  async login(credentials: LoginCredentials): Promise<{ user: User; tokens: AuthTokens } | null> {
    const { email, password } = credentials;

    // Find user by email
    const user = await this.userRepository.findByEmail(email);
    if (!user) {
      return null;
    }

    // Check if user is active
    if (user.status !== 'active') {
      throw new Error('User account is not active');
    }

    // Validate password
    const isValidPassword = await validatePassword(password, user.passwordHash);
    if (!isValidPassword) {
      return null;
    }

    // Update last login timestamp
    await this.userRepository.updateLastLogin(user.id);

    // Generate tokens
    const tokens = this.generateTokens(user);

    return { user, tokens };
  }

  /**
   * Generate access and refresh tokens
   */
  generateTokens(user: User): AuthTokens {
    const payload: TokenPayload = {
      userId: user.id,
      email: user.email,
      roles: user.roles?.map(role => role.name) || [],
    };

    const accessToken = jwt.sign(payload, this.jwtSecret, {
      expiresIn: this.jwtExpiresIn,
    });

    const refreshPayload: RefreshTokenPayload = {
      userId: user.id,
      type: 'refresh',
    };

    const refreshToken = jwt.sign(refreshPayload, this.jwtSecret, {
      expiresIn: this.jwtRefreshExpiresIn,
    });

    return {
      accessToken,
      refreshToken,
      expiresIn: this.jwtExpiresIn,
    };
  }

  /**
   * Verify and decode access token
   */
  verifyAccessToken(token: string): TokenPayload | null {
    try {
      const decoded = jwt.verify(token, this.jwtSecret) as TokenPayload;
      
      // Ensure it's not a refresh token
      if ('type' in decoded && decoded.type === 'refresh') {
        return null;
      }

      return decoded;
    } catch (error) {
      return null;
    }
  }

  /**
   * Verify and decode refresh token
   */
  verifyRefreshToken(token: string): RefreshTokenPayload | null {
    try {
      const decoded = jwt.verify(token, this.jwtSecret) as RefreshTokenPayload;
      
      // Ensure it's a refresh token
      if (decoded.type !== 'refresh') {
        return null;
      }

      return decoded;
    } catch (error) {
      return null;
    }
  }

  /**
   * Refresh access token using refresh token
   */
  async refreshAccessToken(refreshToken: string): Promise<AuthTokens | null> {
    const decoded = this.verifyRefreshToken(refreshToken);
    if (!decoded) {
      return null;
    }

    // Get user from database
    const user = await this.userRepository.findById(decoded.userId);
    if (!user || user.status !== 'active') {
      return null;
    }

    // Generate new tokens
    return this.generateTokens(user);
  }

  /**
   * Register a new user
   */
  async register(userData: {
    email: string;
    password: string;
    name: string;
  }): Promise<{ user: User; tokens: AuthTokens }> {
    const { email, password, name } = userData;

    // Check if email already exists
    const existingUser = await this.userRepository.findByEmail(email);
    if (existingUser) {
      throw new Error('Email already exists');
    }

    // Hash password
    const passwordHash = await hashPassword(password);

    // Create user
    const user = await this.userRepository.create({
      email,
      name,
      passwordHash,
      status: 'active',
    });

    // Generate tokens
    const tokens = this.generateTokens(user);

    return { user, tokens };
  }

  /**
   * Logout user (token invalidation would be handled by client or token blacklist)
   */
  async logout(userId: string): Promise<void> {
    // In a stateless JWT system, logout is typically handled client-side by removing tokens
    // For additional security, you could implement a token blacklist in Redis
    // For now, we'll just log the action
    console.log(`User ${userId} logged out`);
  }

  /**
   * Change user password
   */
  async changePassword(userId: string, oldPassword: string, newPassword: string): Promise<boolean> {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      return false;
    }

    // Validate old password
    const isValidPassword = await validatePassword(oldPassword, user.passwordHash);
    if (!isValidPassword) {
      return false;
    }

    // Hash new password
    const newPasswordHash = await hashPassword(newPassword);

    // Update password
    await this.userRepository.update(userId, { passwordHash: newPasswordHash });

    return true;
  }
}
