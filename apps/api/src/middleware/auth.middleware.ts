import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../services/auth.service';
import { RBACService } from '../services/rbac.service';
import { UserRepository } from '../repositories/UserRepository';
import { AppDataSource } from '../config/data-source';

// Extend Express Request to include user
declare global {
  namespace Express {
    interface Request {
      user?: {
        userId: string;
        email: string;
        roles: string[];
      };
    }
  }
}

/**
 * Middleware to authenticate JWT tokens
 */
export const authenticateToken = (authService: AuthService) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    console.log(`🔐 AUTH: Authenticating ${req.method} ${req.path}`);
    try {
      // Get token from Authorization header
      const authHeader = req.headers.authorization;
      const token = authHeader && authHeader.startsWith('Bearer ')
        ? authHeader.substring(7)
        : null;

      if (!token) {
        res.status(401).json({
          error: 'Unauthorized',
          message: 'No token provided',
        });
        return;
      }

      // Verify token
      const decoded = authService.verifyAccessToken(token);
      if (!decoded) {
        res.status(401).json({
          error: 'Unauthorized',
          message: 'Invalid or expired token',
        });
        return;
      }

      // Attach user info to request
      req.user = {
        userId: decoded.userId,
        email: decoded.email,
        roles: decoded.roles,
      };

      next();
    } catch (error) {
      console.error('Authentication error:', error);
      res.status(500).json({
        error: 'Internal Server Error',
        message: 'Authentication failed',
      });
    }
  };
};

/**
 * Middleware to check if user has required role
 */
export const requireRole = (...roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        error: 'Unauthorized',
        message: 'Authentication required',
      });
      return;
    }

    const hasRole = roles.some(role => req.user!.roles.includes(role));
    if (!hasRole) {
      res.status(403).json({
        error: 'Forbidden',
        message: 'Insufficient permissions',
      });
      return;
    }

    next();
  };
};

/**
 * Middleware to check if user has a specific permission
 */
export const requirePermission = (rbacService: RBACService, permissionName: string) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    if (!req.user) {
      res.status(401).json({
        error: 'Unauthorized',
        message: 'Authentication required',
      });
      return;
    }

    try {
      const hasPermission = await rbacService.userHasPermission(
        req.user.userId,
        permissionName
      );

      if (!hasPermission) {
        res.status(403).json({
          error: 'Forbidden',
          message: 'Insufficient permissions',
        });
        return;
      }

      next();
    } catch (error) {
      console.error('Permission check error:', error);
      res.status(500).json({
        error: 'Internal Server Error',
        message: 'Permission check failed',
      });
    }
  };
};

/**
 * Middleware to check if user has any of the specified permissions
 */
export const requireAnyPermission = (rbacService: RBACService, permissionNames: string[]) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    if (!req.user) {
      res.status(401).json({
        error: 'Unauthorized',
        message: 'Authentication required',
      });
      return;
    }

    try {
      for (const permissionName of permissionNames) {
        const hasPermission = await rbacService.userHasPermission(
          req.user.userId,
          permissionName
        );
        if (hasPermission) {
          next();
          return;
        }
      }

      res.status(403).json({
        error: 'Forbidden',
        message: 'Insufficient permissions',
      });
    } catch (error) {
      console.error('Permission check error:', error);
      res.status(500).json({
        error: 'Internal Server Error',
        message: 'Permission check failed',
      });
    }
  };
};

/**
 * Optional authentication - attaches user if token is valid but doesn't require it
 */
export const optionalAuth = (authService: AuthService) => {
  return async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
    try {
      const authHeader = req.headers.authorization;
      const token = authHeader && authHeader.startsWith('Bearer ')
        ? authHeader.substring(7)
        : null;

      if (token) {
        const decoded = authService.verifyAccessToken(token);
        if (decoded) {
          req.user = {
            userId: decoded.userId,
            email: decoded.email,
            roles: decoded.roles,
          };
        }
      }

      next();
    } catch (error) {
      // Continue without authentication
      next();
    }
  };
};

/**
 * Create auth service instance
 */
export const createAuthService = (): AuthService => {
  const userRepository = new UserRepository(AppDataSource);
  return new AuthService(userRepository);
};
