import { Router, Request, Response } from 'express';
import { AuthService } from '../services/auth.service';
import { authenticateToken } from '../middleware/auth.middleware';

export const createAuthRouter = (authService: AuthService): Router => {
  const router = Router();

  /**
   * POST /api/v1/auth/register
   * Register a new user
   */
  router.post('/register', async (req: Request, res: Response) => {
    try {
      const { email, password, name } = req.body;

      // Validate input
      if (!email || !password || !name) {
        return res.status(400).json({
          error: 'Bad Request',
          message: 'Email, password, and name are required',
        });
      }

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return res.status(400).json({
          error: 'Bad Request',
          message: 'Invalid email format',
        });
      }

      // Validate password strength (minimum 8 characters)
      if (password.length < 8) {
        return res.status(400).json({
          error: 'Bad Request',
          message: 'Password must be at least 8 characters long',
        });
      }

      const result = await authService.register({ email, password, name });

      // Remove sensitive data from response
      const { passwordHash, ...userWithoutPassword } = result.user;

      return res.status(201).json({
        message: 'User registered successfully',
        user: userWithoutPassword,
        tokens: result.tokens,
      });
    } catch (error) {
      if (error instanceof Error && error.message === 'Email already exists') {
        return res.status(409).json({
          error: 'Conflict',
          message: error.message,
        });
      }

      console.error('Registration error:', error);
      return res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to register user',
      });
    }
  });

  /**
   * POST /api/v1/auth/login
   * Login with email and password
   */
  router.post('/login', async (req: Request, res: Response) => {
    try {
      const { email, password } = req.body;

      // Validate input
      if (!email || !password) {
        return res.status(400).json({
          error: 'Bad Request',
          message: 'Email and password are required',
        });
      }

      const result = await authService.login({ email, password });

      if (!result) {
        return res.status(401).json({
          error: 'Unauthorized',
          message: 'Invalid email or password',
        });
      }

      // Remove sensitive data from response
      const { passwordHash, ...userWithoutPassword } = result.user;

      return res.status(200).json({
        message: 'Login successful',
        user: userWithoutPassword,
        tokens: result.tokens,
      });
    } catch (error) {
      if (error instanceof Error && error.message === 'User account is not active') {
        return res.status(403).json({
          error: 'Forbidden',
          message: error.message,
        });
      }

      console.error('Login error:', error);
      return res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to login',
      });
    }
  });

  /**
   * POST /api/v1/auth/refresh
   * Refresh access token using refresh token
   */
  router.post('/refresh', async (req: Request, res: Response) => {
    try {
      const { refreshToken } = req.body;

      if (!refreshToken) {
        return res.status(400).json({
          error: 'Bad Request',
          message: 'Refresh token is required',
        });
      }

      const tokens = await authService.refreshAccessToken(refreshToken);

      if (!tokens) {
        return res.status(401).json({
          error: 'Unauthorized',
          message: 'Invalid or expired refresh token',
        });
      }

      return res.status(200).json({
        message: 'Token refreshed successfully',
        tokens,
      });
    } catch (error) {
      console.error('Token refresh error:', error);
      return res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to refresh token',
      });
    }
  });

  /**
   * POST /api/v1/auth/logout
   * Logout user (requires authentication)
   */
  router.post('/logout', authenticateToken(authService), async (req: Request, res: Response) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          error: 'Unauthorized',
          message: 'Authentication required',
        });
      }

      await authService.logout(req.user.userId);

      return res.status(200).json({
        message: 'Logout successful',
      });
    } catch (error) {
      console.error('Logout error:', error);
      return res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to logout',
      });
    }
  });

  /**
   * GET /api/v1/auth/me
   * Get current user information (requires authentication)
   */
  router.get('/me', authenticateToken(authService), async (req: Request, res: Response) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          error: 'Unauthorized',
          message: 'Authentication required',
        });
      }

      return res.status(200).json({
        user: req.user,
      });
    } catch (error) {
      console.error('Get user error:', error);
      return res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to get user information',
      });
    }
  });

  /**
   * POST /api/v1/auth/change-password
   * Change user password (requires authentication)
   */
  router.post('/change-password', authenticateToken(authService), async (req: Request, res: Response) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          error: 'Unauthorized',
          message: 'Authentication required',
        });
      }

      const { oldPassword, newPassword } = req.body;

      if (!oldPassword || !newPassword) {
        return res.status(400).json({
          error: 'Bad Request',
          message: 'Old password and new password are required',
        });
      }

      // Validate new password strength
      if (newPassword.length < 8) {
        return res.status(400).json({
          error: 'Bad Request',
          message: 'New password must be at least 8 characters long',
        });
      }

      const success = await authService.changePassword(
        req.user.userId,
        oldPassword,
        newPassword
      );

      if (!success) {
        return res.status(401).json({
          error: 'Unauthorized',
          message: 'Invalid old password',
        });
      }

      return res.status(200).json({
        message: 'Password changed successfully',
      });
    } catch (error) {
      console.error('Change password error:', error);
      return res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to change password',
      });
    }
  });

  return router;
};
