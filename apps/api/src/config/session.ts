import session from 'express-session';
import { getRedisClient } from './redis';

// Use dynamic import for connect-redis
const ConnectRedis = require('connect-redis');

/**
 * Session configuration for PROTECHT BIM
 * Uses Redis as the session store for scalability
 */
export const getSessionConfig = (): session.SessionOptions => {
  const redisClient = getRedisClient();

  // Create Redis store - try direct instantiation
  const store = new ConnectRedis({
    client: redisClient,
    prefix: 'session:',
    ttl: parseInt(process.env.SESSION_TTL || '86400', 10), // 24 hours default
  });

  return {
    store,
    secret: process.env.SESSION_SECRET || process.env.JWT_SECRET || 'dev-session-secret',
    resave: false,
    saveUninitialized: false,
    name: 'protecht.sid', // Custom session cookie name
    cookie: {
      secure: process.env.NODE_ENV === 'production', // HTTPS only in production
      httpOnly: true, // Prevent XSS attacks
      maxAge: parseInt(process.env.SESSION_TTL || '86400', 10) * 1000, // Convert to milliseconds
      sameSite: 'lax', // CSRF protection
      domain: process.env.COOKIE_DOMAIN,
    },
    rolling: true, // Reset expiration on every request
  };
};

/**
 * Session middleware factory
 * Call this after Redis is initialized
 */
export const createSessionMiddleware = () => {
  return session(getSessionConfig());
};

/**
 * Extend Express Session interface to include custom properties
 */
declare module 'express-session' {
  interface SessionData {
    userId?: string;
    email?: string;
    role?: string;
    permissions?: string[];
    lastActivity?: Date;
  }
}
