# PROTECHT BIM — Free Deployment Guide
## Stack: Koyeb (API) + Neon (Database) + Vercel (Frontend)
### No credit card required for any of these services.

---

## Why this stack?

| Service | Free Tier | No Card? | Sleeps? |
|---------|-----------|----------|---------|
| **Koyeb** | 1 web service + 1 Postgres | ✅ Yes | ❌ Never |
| **Neon** | 3GB Postgres, serverless | ✅ Yes | ❌ Never |
| **Vercel** | Unlimited frontend deploys | ✅ Yes | ❌ Never |

---

## Step 1 — Get Free Postgres from Neon (3 minutes)

1. Go to **[neon.tech](https://neon.tech)** → **Sign up** (GitHub login, no card)
2. Click **New Project** → name it `protecht-bim` → Create
3. On the project dashboard, click **Connection string** tab
4. Copy the full URL — it looks like:
   ```
   postgresql://user:password@ep-xxx-xxx.us-east-2.aws.neon.tech/neondb?sslmode=require
   ```
5. Save this — you need it in Step 2

---

## Step 2 — Deploy API on Koyeb (10 minutes)

1. Go to **[koyeb.com](https://app.koyeb.com)** → **Sign up** (GitHub login, no card)
2. Click **Create App**
3. Choose **GitHub** → Select `FORYT0/PROTECHTBIM`
4. Configure the service:
   - **Name**: `protechtbim-api`
   - **Branch**: `main`
   - **Build command**: `npm install --include=dev && node apps/api/scripts/build-bundle.js`
   - **Run command**: `node apps/api/dist-bundle/main.js`
   - **Port**: `3000`
5. Scroll to **Environment variables** → Add these:

| Variable | Value |
|----------|-------|
| `NODE_ENV` | `production` |
| `PORT` | `3000` |
| `DATABASE_URL` | *(paste your Neon URL from Step 1)* |
| `JWT_SECRET` | *(any long random string — 64 chars)* |
| `CORS_ORIGIN` | `https://protechtbim-web.vercel.app` |
| `GROQ_API_KEY` | *(your key from console.groq.com)* |

6. Click **Deploy**
7. Wait ~3-5 minutes for first build
8. Your API URL will be: `https://protechtbim-api-YOURNAME.koyeb.app`

> **Koyeb free tier never sleeps** — unlike Render, there are no cold starts.
> Your API responds instantly at all times.

---

## Step 3 — Update Vercel Frontend (2 minutes)

1. Go to **[vercel.com](https://vercel.com)** → Your project → **Settings → Environment Variables**
2. Set (or update):
   - **Name**: `VITE_API_URL`
   - **Value**: `https://protechtbim-api-YOURNAME.koyeb.app/api/v1`
   - **Environment**: Production (and Preview)
3. Click **Save**
4. Go to **Deployments** → click the **⋯** menu on the latest deploy → **Redeploy**

---

## Step 4 — Seed Demo Data (2 minutes)

Once your Koyeb service shows **Healthy**:

**Option A — Koyeb Terminal** (easiest):
1. Koyeb dashboard → your service → **Terminal** tab
2. Run:
   ```bash
   node apps/api/dist-bundle/seed.js
   ```

**Option B — Local CLI**:
```bash
cd "C:\Users\User\AndroidStudioProjects\PROTECHT BIM"
# Set your Neon URL temporarily
set DATABASE_URL=postgresql://your-neon-url-here
node apps/api/dist-bundle/seed.js
```

---

## Step 5 — Verify Everything Works

Visit: `https://protechtbim-web.vercel.app`

Login with:
- `admin@protecht.demo` / `Demo1234!`
- `pm@protecht.demo` / `Demo1234!`
- `eng@protecht.demo` / `Demo1234!`

Test API health directly:
```
https://protechtbim-api-YOURNAME.koyeb.app/health
```
Expected: `{"status":"ok","db":"connected"}`

---

## Troubleshooting

**Build fails on Koyeb:**
- Check Koyeb build logs — usually a missing env var
- Make sure `DATABASE_URL` is set before first deploy

**CORS errors in browser:**
- Check `CORS_ORIGIN` exactly matches your Vercel URL (no trailing slash)
- Example: `https://protechtbim-web.vercel.app` ✅ not `https://protechtbim-web.vercel.app/` ❌

**Database connection fails:**
- Neon URLs require `?sslmode=require` at the end
- The app already has `ssl: { rejectUnauthorized: false }` in config

**Login fails after redeployment:**
- Run the seed script again — JWT_SECRET may have changed
- Clear browser localStorage and try again

---

## Free Tier Limits

| Service | Limit |
|---------|-------|
| Koyeb | 512MB RAM, 0.1 vCPU, 100GB egress/month |
| Neon | 3GB storage, 5GB transfer/month |
| Vercel | 100GB bandwidth, unlimited deploys |

All limits are generous enough for demos, client presentations, and small-team production use.
