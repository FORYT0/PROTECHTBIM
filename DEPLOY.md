# PROTECHT BIM — Deployment Guide

## Architecture
Single Railway service serves both the API and the built React frontend.
- Build: `npm run build` (compiles API + bundles frontend)
- Start: `node apps/api/dist/main.js` (API serves frontend as static files in production)

---

## Step 1 — Verify build locally

```bash
# From repo root
npm run build
# Should complete with no errors
# API compiled to: apps/api/dist/main.js
# Frontend bundled to: apps/web/dist/
```

---

## Step 2 — Railway setup

### 2a. Create project
[railway.app](https://railway.app) → New Project → Deploy from GitHub → select your repo

Railway will use `railway.toml` at the repo root automatically.

### 2b. Add PostgreSQL
Railway project → **+ New** → Database → PostgreSQL

### 2c. Add Redis
Railway project → **+ New** → Database → Redis

### 2d. Set environment variables
Railway Service → Variables → add all of these:

```
NODE_ENV=production
API_PORT=3000
LOG_LEVEL=info

# From PostgreSQL Connect tab:
DATABASE_HOST=
DATABASE_PORT=5432
DATABASE_NAME=railway
DATABASE_USER=postgres
DATABASE_PASSWORD=

# From Redis Connect tab:
REDIS_HOST=
REDIS_PORT=6379
REDIS_PASSWORD=

# Generate: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
JWT_SECRET=
JWT_EXPIRES_IN=3600
JWT_REFRESH_EXPIRES_IN=604800

# Generate a DIFFERENT value from JWT_SECRET:
SESSION_SECRET=
SESSION_TTL=86400

# Leave blank — frontend is same-origin, no CORS needed
CORS_ORIGIN=

MAX_FILE_SIZE=104857600
ALLOWED_FILE_TYPES=.ifc,.rvt,.nwd,.pdf,.png,.jpg,.jpeg,.dwg
```

### 2e. Deploy
Railway auto-deploys on push. Watch build logs — should end with:
```
Server is running on http://localhost:3000
```

### 2f. Run migrations (after first successful deploy)
Railway Service → Settings → Deploy → **One-off command**:
```
node apps/api/dist/scripts/run-migrations.js
```

---

## Step 3 — Verify

| Check | URL |
|---|---|
| API health | `https://your-app.up.railway.app/health` |
| Frontend | `https://your-app.up.railway.app/` |
| Login | `https://your-app.up.railway.app/login` |

The frontend and API are on the same domain — no CORS configuration needed.

---

## Troubleshooting

**Build fails**
- Check Railway build logs
- Run `npm run build` locally first to catch errors

**`Cannot find module` errors at runtime**
- Ensure `npm install` ran during build (it's in the build command)
- Check that `apps/api/dist/main.js` exists after build

**Database connection error**
- Confirm `DATABASE_*` vars match PostgreSQL Connect tab exactly
- SSL is already configured for Railway in `data-source.ts`

**Blank page / 404 on refresh**
- The API serves `index.html` for all non-API routes in production
- Verify `NODE_ENV=production` is set in Railway variables

**Migrations not running**
- Use the one-off command above after deploy
- Check Railway logs for migration output
