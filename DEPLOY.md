# PROTECHT BIM — Backend Migration: Railway → Render + Neon

## Overview
Railway trial ended. Migration to 100% free open-source infrastructure:
- **Database**: Neon.tech (free serverless Postgres — 0.5GB, no card required)
- **API Host**: Render.com (free web service — sleeps after 15min inactivity)
- **Frontend**: Vercel (unchanged — free hobby tier)

---

## Step 1 — Create Neon Database (5 minutes)

1. Go to [neon.tech](https://neon.tech) → **Sign up free** (GitHub login works)
2. Create a new project → name it `protecht-bim`
3. On the dashboard, click **Connection string** → copy the `postgresql://...` URL
4. It looks like: `postgresql://username:password@ep-xxx.us-east-2.aws.neon.tech/neondb?sslmode=require`
5. **Save this URL** — you'll need it in Step 3

---

## Step 2 — Deploy API on Render (10 minutes)

1. Go to [render.com](https://render.com) → **Sign up free** (GitHub login works)
2. Click **New → Web Service**
3. Connect your GitHub repo: `FORYT0/PROTECHTBIM`
4. Configure:
   - **Name**: `protechtbim-api`
   - **Root Directory**: *(leave blank — uses repo root)*
   - **Runtime**: `Node`
   - **Build Command**: `npm install --include=dev && node apps/api/scripts/build-bundle.js`
   - **Start Command**: `node apps/api/dist-bundle/main.js`
   - **Plan**: Free
5. Click **Advanced** → **Add Environment Variables**:

| Key | Value |
|-----|-------|
| `NODE_ENV` | `production` |
| `PORT` | `10000` |
| `DATABASE_URL` | *(paste your Neon connection string)* |
| `JWT_SECRET` | *(generate: openssl rand -hex 32)* |
| `CORS_ORIGIN` | `https://protechtbim-web.vercel.app` |
| `GROQ_API_KEY` | *(your Groq key from [console.groq.com](https://console.groq.com))* |

6. Click **Create Web Service**
7. Wait ~5 minutes for first build
8. Your API URL will be: `https://protechtbim-api.onrender.com`

> **Note on free tier**: Render spins down after 15 min of inactivity.
> First request takes ~30s to wake. The app shows a "waking up" toast and retries automatically.

---

## Step 3 — Update Vercel Environment Variable

1. Go to [vercel.com](https://vercel.com) → Your project → **Settings → Environment Variables**
2. Find `VITE_API_URL` (or add it if missing)
3. Set value to: `https://protechtbim-api.onrender.com/api/v1`
4. Click **Save** → Go to **Deployments** → **Redeploy** (to pick up the new env var)

---

## Step 4 — Seed the Database

Once your Render service is running, seed the demo data:

**Option A — Render Shell** (easiest):
1. Render dashboard → your service → **Shell**
2. Run: `node apps/api/dist-bundle/seed.js`

**Option B — Local** (with Neon URL):
```bash
cd "C:\Users\User\AndroidStudioProjects\PROTECHT BIM"
set DATABASE_URL=postgresql://your-neon-url-here
node apps/api/dist-bundle/seed.js
```

---

## Step 5 — Verify

Visit your app: `https://protechtbim-web.vercel.app`

Login with:
- `admin@protecht.demo` / `Demo1234!`
- `pm@protecht.demo` / `Demo1234!`
- `eng@protecht.demo` / `Demo1234!`

---

## Free Tier Limits

| Service | Limit | Notes |
|---------|-------|-------|
| Neon | 0.5GB storage, 190hrs compute/month | More than enough for dev/demo |
| Render | 750hrs/month, sleeps after 15min | App wakes on first request |
| Vercel | 100GB bandwidth, unlimited deploys | No limits for this project size |

---

## Alternative Free Options

If Render is too slow (cold-starts), alternatives:
- **Fly.io** — 3 free shared VMs, doesn't sleep: `fly launch`
- **Koyeb** — 2 free services, no sleep
- **Cyclic.sh** — free Node hosting
- **Supabase** — free Postgres if you prefer over Neon (also has auth/storage)

---

## Keep the API Warm (Optional)

To prevent Render cold-starts, use a free uptime monitor:
- [UptimeRobot](https://uptimerobot.com) — free, pings your URL every 5min
- Add monitor: `https://protechtbim-api.onrender.com/health`
- This keeps the API warm 24/7 on the free tier
