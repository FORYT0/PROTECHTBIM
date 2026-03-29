# PROTECHT BIM — Deployment Guide

## Stack
- **API** → Railway (Node.js + PostgreSQL + Redis)
- **Frontend** → Vercel (React + Vite)

---

## Step 1 — Verify build locally

```bash
cd apps/api && npm run build
# Should complete with no errors, producing dist/main.js
```

---

## Step 2 — Railway (API)

### 2a. Create project
1. Go to [railway.app](https://railway.app) → New Project → Deploy from GitHub
2. Select your repo
3. Railway will detect the project — **before it deploys**, set the root directory

### 2b. Set root directory (critical for monorepo)
Railway Service → Settings → Source → **Root Directory** → `apps/api`

### 2c. Add PostgreSQL
Railway project → **+ New** → Database → PostgreSQL
- Copy the connection values from the **Connect** tab

### 2d. Add Redis
Railway project → **+ New** → Database → Redis
- Copy the connection values from the **Connect** tab

### 2e. Set environment variables
Railway Service → Variables → paste all of these:

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

# Generate with: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
JWT_SECRET=
JWT_EXPIRES_IN=3600
JWT_REFRESH_EXPIRES_IN=604800

# Generate a DIFFERENT value:
SESSION_SECRET=
SESSION_TTL=86400
COOKIE_DOMAIN=

# Your Vercel URL (set after Step 3):
CORS_ORIGIN=https://your-app.vercel.app

MAX_FILE_SIZE=104857600
ALLOWED_FILE_TYPES=.ifc,.rvt,.nwd,.pdf,.png,.jpg,.jpeg,.dwg
```

### 2f. Run migrations (after first deploy succeeds)
Railway Service → Settings → Deploy → **One-off command**:
```
npm run migration:run:prod
```

### 2g. Verify
Hit `https://your-api.up.railway.app/health` — should return:
```json
{"status":"ok","service":"protecht-bim-api"}
```

---

## Step 3 — Vercel (Frontend)

### 3a. Create project
1. Go to [vercel.com](https://vercel.com) → New Project → Import from GitHub
2. Select your repo
3. Set **Root Directory** to `apps/web`
4. Framework: **Vite** (auto-detected)

### 3b. Set environment variables
Vercel Project → Settings → Environment Variables:

```
VITE_API_URL=https://your-api.up.railway.app/api/v1
```

### 3c. Deploy
Vercel auto-deploys on push. Or click **Redeploy**.

### 3d. Update CORS on Railway
Go back to Railway → Variables → update:
```
CORS_ORIGIN=https://your-actual-vercel-url.vercel.app
```
Then redeploy the Railway service.

---

## Step 4 — Smoke test

| Check | URL |
|---|---|
| API health | `https://your-api.up.railway.app/health` |
| API version | `https://your-api.up.railway.app/api/v1` |
| Frontend | `https://your-app.vercel.app` |
| Login | `https://your-app.vercel.app/login` |

---

## Troubleshooting

**Build fails on Railway**
- Check Railway build logs
- Ensure `apps/api` is set as root directory
- Verify `npm run build` passes locally

**Database connection error**
- Confirm `DATABASE_*` vars match PostgreSQL Connect tab exactly
- Railway PostgreSQL requires SSL — already configured in `data-source.ts`

**CORS errors in browser**
- Ensure `CORS_ORIGIN` on Railway matches your exact Vercel URL (no trailing slash)
- Redeploy Railway after changing CORS

**Migrations not running**
- Use the one-off command: `npm run migration:run:prod`
- Check Railway logs for migration output

**Frontend shows blank page**
- Check browser console for errors
- Verify `VITE_API_URL` is set correctly in Vercel env vars
- Ensure Vercel `vercel.json` rewrites are in place (already configured)
