# Environment Variables Documentation

This document provides comprehensive documentation for all environment variables used in the PROTECHT BIM platform.

## Table of Contents

- [Backend API Environment Variables](#backend-api-environment-variables)
- [Frontend Web Environment Variables](#frontend-web-environment-variables)
- [Security Best Practices](#security-best-practices)
- [Environment-Specific Configurations](#environment-specific-configurations)

## Backend API Environment Variables

Location: `apps/api/.env`

### Database Configuration

PostgreSQL database connection settings.

| Variable | Type | Required | Default | Description |
|----------|------|----------|---------|-------------|
| `DATABASE_HOST` | string | Yes | `localhost` | PostgreSQL server hostname or IP address |
| `DATABASE_PORT` | number | Yes | `5432` | PostgreSQL server port |
| `DATABASE_NAME` | string | Yes | `protecht_bim` | Database name |
| `DATABASE_USER` | string | Yes | `postgres` | Database username |
| `DATABASE_PASSWORD` | string | Yes | `postgres` | Database password (change in production!) |

**Example:**
```env
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_NAME=protecht_bim
DATABASE_USER=postgres
DATABASE_PASSWORD=your_secure_password_here
```

**Production Notes:**
- Use strong passwords (min 16 characters, mixed case, numbers, symbols)
- Consider using managed database services (AWS RDS, Azure Database, etc.)
- Enable SSL/TLS connections in production
- Use connection pooling for better performance

### Redis Configuration

Redis cache and session store settings.

| Variable | Type | Required | Default | Description |
|----------|------|----------|---------|-------------|
| `REDIS_HOST` | string | Yes | `localhost` | Redis server hostname or IP address |
| `REDIS_PORT` | number | Yes | `6379` | Redis server port |
| `REDIS_PASSWORD` | string | No | `` | Redis password (empty for no auth) |
| `REDIS_DB` | number | No | `0` | Redis database number (0-15) |

**Example:**
```env
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=your_redis_password
REDIS_DB=0
```

**Production Notes:**
- Always set a password in production
- Use Redis Sentinel or Cluster for high availability
- Consider managed Redis services (AWS ElastiCache, Azure Cache, etc.)

### JWT Configuration

JSON Web Token authentication settings.

| Variable | Type | Required | Default | Description |
|----------|------|----------|---------|-------------|
| `JWT_SECRET` | string | Yes | - | Secret key for signing JWT tokens (min 32 chars) |
| `JWT_EXPIRES_IN` | number | Yes | `3600` | Access token expiration time in seconds (1 hour) |
| `JWT_REFRESH_EXPIRES_IN` | number | Yes | `604800` | Refresh token expiration time in seconds (7 days) |

**Example:**
```env
JWT_SECRET=your-super-secret-key-min-32-characters-long-change-in-production
JWT_EXPIRES_IN=3600
JWT_REFRESH_EXPIRES_IN=604800
```

**Production Notes:**
- **CRITICAL**: Generate a cryptographically secure random string for `JWT_SECRET`
- Use at least 32 characters for the secret
- Never commit secrets to version control
- Rotate secrets periodically
- Consider using environment-specific secrets management (AWS Secrets Manager, Azure Key Vault, etc.)

**Generate Secure Secret:**
```bash
# Using Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Using OpenSSL
openssl rand -hex 32
```

### Session Configuration

Express session settings.

| Variable | Type | Required | Default | Description |
|----------|------|----------|---------|-------------|
| `SESSION_SECRET` | string | Yes | - | Secret key for signing session cookies (min 32 chars) |
| `SESSION_TTL` | number | Yes | `86400` | Session time-to-live in seconds (24 hours) |
| `COOKIE_DOMAIN` | string | No | `` | Cookie domain (leave empty for localhost) |

**Example:**
```env
SESSION_SECRET=your-session-secret-min-32-characters-change-in-production
SESSION_TTL=86400
COOKIE_DOMAIN=.protecht-bim.com
```

**Production Notes:**
- Use a different secret than `JWT_SECRET`
- Set `COOKIE_DOMAIN` to your domain (e.g., `.example.com`)
- Enable secure cookies in production (HTTPS only)
- Consider shorter TTL for sensitive applications

### Application Configuration

General application settings.

| Variable | Type | Required | Default | Description |
|----------|------|----------|---------|-------------|
| `NODE_ENV` | string | Yes | `development` | Environment: `development`, `production`, `test` |
| `API_PORT` | number | Yes | `3000` | Port for API server to listen on |
| `LOG_LEVEL` | string | No | `debug` | Logging level: `error`, `warn`, `info`, `debug` |

**Example:**
```env
NODE_ENV=production
API_PORT=3000
LOG_LEVEL=info
```

**Production Notes:**
- Always set `NODE_ENV=production` in production
- Use `LOG_LEVEL=info` or `LOG_LEVEL=warn` in production
- Ensure port is not blocked by firewall

### CORS Configuration

Cross-Origin Resource Sharing settings.

| Variable | Type | Required | Default | Description |
|----------|------|----------|---------|-------------|
| `CORS_ORIGIN` | string | Yes | `http://localhost:3001` | Allowed origin for CORS (frontend URL) |

**Example:**
```env
# Development
CORS_ORIGIN=http://localhost:3001

# Production
CORS_ORIGIN=https://app.protecht-bim.com
```

**Production Notes:**
- Set to your production frontend URL
- For multiple origins, use comma-separated list or implement dynamic CORS
- Never use `*` (wildcard) in production

### File Upload Configuration

File upload limits and allowed types.

| Variable | Type | Required | Default | Description |
|----------|------|----------|---------|-------------|
| `MAX_FILE_SIZE` | number | Yes | `104857600` | Maximum file size in bytes (100MB default) |
| `ALLOWED_FILE_TYPES` | string | Yes | `.ifc,.rvt,.nwd,.pdf,.png,.jpg,.jpeg` | Comma-separated list of allowed file extensions |

**Example:**
```env
MAX_FILE_SIZE=104857600
ALLOWED_FILE_TYPES=.ifc,.rvt,.nwd,.pdf,.png,.jpg,.jpeg,.dwg
```

**Production Notes:**
- Adjust `MAX_FILE_SIZE` based on your needs and server capacity
- Validate file types on both client and server
- Consider virus scanning for uploaded files

### Storage Configuration (MinIO/S3)

Object storage settings for file attachments and BIM models.

| Variable | Type | Required | Default | Description |
|----------|------|----------|---------|-------------|
| `STORAGE_ENDPOINT` | string | Yes | `localhost:9000` | MinIO/S3 endpoint URL |
| `STORAGE_ACCESS_KEY` | string | Yes | `minioadmin` | Access key ID |
| `STORAGE_SECRET_KEY` | string | Yes | `minioadmin` | Secret access key |
| `STORAGE_BUCKET` | string | Yes | `protecht-bim` | Bucket name for storing files |
| `STORAGE_USE_SSL` | boolean | Yes | `false` | Use HTTPS for storage connections |

**Example:**
```env
# Development (MinIO)
STORAGE_ENDPOINT=localhost:9000
STORAGE_ACCESS_KEY=minioadmin
STORAGE_SECRET_KEY=minioadmin
STORAGE_BUCKET=protecht-bim
STORAGE_USE_SSL=false

# Production (AWS S3)
STORAGE_ENDPOINT=s3.amazonaws.com
STORAGE_ACCESS_KEY=AKIAIOSFODNN7EXAMPLE
STORAGE_SECRET_KEY=wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY
STORAGE_BUCKET=protecht-bim-prod
STORAGE_USE_SSL=true
```

**Production Notes:**
- Always use `STORAGE_USE_SSL=true` in production
- Use IAM roles instead of access keys when possible (AWS)
- Set appropriate bucket policies and CORS rules
- Enable versioning and lifecycle policies

### Message Queue Configuration (RabbitMQ)

Message broker settings for event-driven architecture.

| Variable | Type | Required | Default | Description |
|----------|------|----------|---------|-------------|
| `RABBITMQ_HOST` | string | Yes | `localhost` | RabbitMQ server hostname |
| `RABBITMQ_PORT` | number | Yes | `5672` | RabbitMQ server port |
| `RABBITMQ_USER` | string | Yes | `guest` | RabbitMQ username |
| `RABBITMQ_PASSWORD` | string | Yes | `guest` | RabbitMQ password |

**Example:**
```env
RABBITMQ_HOST=localhost
RABBITMQ_PORT=5672
RABBITMQ_USER=protecht_user
RABBITMQ_PASSWORD=secure_password_here
```

**Production Notes:**
- Change default credentials
- Use TLS/SSL connections in production
- Consider managed services (AWS MQ, CloudAMQP, etc.)
- Set up monitoring and alerts

## Frontend Web Environment Variables

Location: `apps/web/.env`

All frontend environment variables must be prefixed with `VITE_` to be exposed to the client.

### API Configuration

Backend API connection settings.

| Variable | Type | Required | Default | Description |
|----------|------|----------|---------|-------------|
| `VITE_API_URL` | string | Yes | `http://localhost:3000/api/v1` | Backend API base URL |
| `VITE_API_TIMEOUT` | number | No | `30000` | API request timeout in milliseconds |

**Example:**
```env
# Development
VITE_API_URL=http://localhost:3000/api/v1
VITE_API_TIMEOUT=30000

# Production
VITE_API_URL=https://api.protecht-bim.com/api/v1
VITE_API_TIMEOUT=30000
```

### Application Configuration

General application settings.

| Variable | Type | Required | Default | Description |
|----------|------|----------|---------|-------------|
| `VITE_APP_NAME` | string | No | `PROTECHT BIM` | Application name displayed in UI |
| `VITE_APP_VERSION` | string | No | `1.0.0` | Application version |
| `VITE_DEV_MODE` | boolean | No | `true` | Enable development mode features |

**Example:**
```env
VITE_APP_NAME=PROTECHT BIM
VITE_APP_VERSION=1.0.0
VITE_DEV_MODE=false
```

### Feature Flags

Enable/disable features for different phases.

| Variable | Type | Required | Default | Description |
|----------|------|----------|---------|-------------|
| `VITE_ENABLE_BIM_VIEWER` | boolean | No | `false` | Enable 3D BIM model viewer (Phase 3) |
| `VITE_ENABLE_GANTT_CHART` | boolean | No | `false` | Enable Gantt chart view (Phase 2) |
| `VITE_ENABLE_REAL_TIME` | boolean | No | `false` | Enable real-time notifications (Phase 2) |

**Example:**
```env
VITE_ENABLE_BIM_VIEWER=false
VITE_ENABLE_GANTT_CHART=false
VITE_ENABLE_REAL_TIME=false
```

## Security Best Practices

### 1. Secret Generation

Always generate cryptographically secure random strings for secrets:

```bash
# Generate 32-byte hex string (64 characters)
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Generate 64-byte hex string (128 characters)
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"

# Using OpenSSL
openssl rand -hex 32
```

### 2. Environment File Security

- **Never commit `.env` files to version control**
- Add `.env` to `.gitignore`
- Use `.env.example` as a template (without actual secrets)
- Store production secrets in secure vaults (AWS Secrets Manager, Azure Key Vault, HashiCorp Vault)

### 3. Secret Rotation

- Rotate secrets periodically (every 90 days recommended)
- Rotate immediately if compromised
- Use different secrets for different environments
- Document rotation procedures

### 4. Access Control

- Limit access to production environment variables
- Use role-based access control for secret management
- Audit access to secrets
- Use service accounts with minimal permissions

### 5. Production Checklist

Before deploying to production, verify:

- [ ] All secrets are unique and strong (min 32 characters)
- [ ] `NODE_ENV=production`
- [ ] `JWT_SECRET` is different from development
- [ ] `SESSION_SECRET` is different from `JWT_SECRET`
- [ ] Database password is strong and unique
- [ ] Redis password is set
- [ ] `STORAGE_USE_SSL=true`
- [ ] `CORS_ORIGIN` is set to production frontend URL
- [ ] `LOG_LEVEL` is set to `info` or `warn`
- [ ] All default credentials are changed
- [ ] Secrets are stored in secure vault, not in files

## Environment-Specific Configurations

### Development Environment

```env
# apps/api/.env.development
NODE_ENV=development
API_PORT=3000
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_NAME=protecht_bim_dev
REDIS_HOST=localhost
JWT_SECRET=dev-secret-key-not-for-production
SESSION_SECRET=dev-session-secret-not-for-production
CORS_ORIGIN=http://localhost:3001
LOG_LEVEL=debug
STORAGE_USE_SSL=false
```

```env
# apps/web/.env.development
VITE_API_URL=http://localhost:3000/api/v1
VITE_DEV_MODE=true
```

### Staging Environment

```env
# apps/api/.env.staging
NODE_ENV=production
API_PORT=3000
DATABASE_HOST=staging-db.example.com
DATABASE_PORT=5432
DATABASE_NAME=protecht_bim_staging
REDIS_HOST=staging-redis.example.com
JWT_SECRET=<secure-staging-secret>
SESSION_SECRET=<secure-staging-session-secret>
CORS_ORIGIN=https://staging.protecht-bim.com
LOG_LEVEL=info
STORAGE_USE_SSL=true
```

```env
# apps/web/.env.staging
VITE_API_URL=https://api-staging.protecht-bim.com/api/v1
VITE_DEV_MODE=false
```

### Production Environment

```env
# apps/api/.env.production
NODE_ENV=production
API_PORT=3000
DATABASE_HOST=prod-db.example.com
DATABASE_PORT=5432
DATABASE_NAME=protecht_bim_prod
REDIS_HOST=prod-redis.example.com
JWT_SECRET=<secure-production-secret>
SESSION_SECRET=<secure-production-session-secret>
CORS_ORIGIN=https://app.protecht-bim.com
LOG_LEVEL=warn
STORAGE_USE_SSL=true
```

```env
# apps/web/.env.production
VITE_API_URL=https://api.protecht-bim.com/api/v1
VITE_DEV_MODE=false
```

## Troubleshooting

### Common Issues

#### 1. Database Connection Failed

**Error:** `ECONNREFUSED ::1:5432`

**Solution:**
- Verify PostgreSQL is running
- Check `DATABASE_HOST` and `DATABASE_PORT`
- Verify credentials are correct
- Check firewall rules

#### 2. Redis Connection Failed

**Error:** `ECONNREFUSED ::1:6379`

**Solution:**
- Verify Redis is running
- Check `REDIS_HOST` and `REDIS_PORT`
- Verify password if set
- Check firewall rules

#### 3. JWT Token Invalid

**Error:** `Invalid token` or `Token expired`

**Solution:**
- Verify `JWT_SECRET` is set correctly
- Check token expiration times
- Ensure secret hasn't changed (invalidates all tokens)
- Clear client-side tokens and re-login

#### 4. CORS Error

**Error:** `Access to XMLHttpRequest blocked by CORS policy`

**Solution:**
- Verify `CORS_ORIGIN` matches frontend URL exactly
- Include protocol (http/https)
- Check for trailing slashes
- Restart API server after changing CORS settings

#### 5. File Upload Failed

**Error:** `File too large` or `File type not allowed`

**Solution:**
- Check `MAX_FILE_SIZE` setting
- Verify file extension in `ALLOWED_FILE_TYPES`
- Check storage service is accessible
- Verify storage credentials

## Support

For questions or issues with environment configuration:

- **Documentation**: See `apps/api/README.md` and `apps/web/README.md`
- **Issues**: GitHub Issues
- **Email**: support@protecht-bim.com
