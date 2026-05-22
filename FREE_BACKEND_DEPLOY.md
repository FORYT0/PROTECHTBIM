# PROTECHT BIM — Free Backend Deployment Guide

## What Changed & Why Login Was Broken

**Root cause:** Railway ended their free tier. The API URL baked into the frontend
(`protechtbim-production.up.railway.app`) was returning 404/503, so every login
attempt failed immediately.

**Fix applied (already done in your files):**
- `render.yaml` — fully wired with Supabase DB + Upstash Redis env vars
- `apps/web/.env.production` — now points to Render: `https://protechtbim-api.onrender.com`
- `.env` — updated DATABASE_URL to Supabase, added REDIS_URL for Upstash

---

## Your Free Stack (No New Accounts Needed)

| Layer     | Service            | Status              | Cost   |
|-----------|--------------------|---------------------|--------|
| API       | Render.com         | ⚠️ Need to deploy  | Free   |
| Database  | Supabase           | ✅ Already running  | Free   |
| Cache     | Upstash Redis      | ✅ Already running  | Free   |
| Frontend  | Vercel             | ✅ Already deployed | Free   |

---

## Step 1 — Push Your Changes to GitHub

```bash
cd "PROTECHT BIM"
git add render.yaml apps/web/.env.production .env
git commit -m "fix: switch API from Railway to Render free tier"
git push origin main
```

Vercel will **auto-redeploy the frontend** the moment the push lands (it watches main).

---

## Step 2 — Deploy the API to Render

1. Go to **https://render.com** and sign in with your GitHub account (no new account needed if you have GitHub).
2. Click **New → Web Service**.
3. Select your **PROTECHT BIM** GitHub repository.
4. Render will detect `render.yaml` automatically. Confirm the service name `protechtbim-api`.
5. In the **Environment Variables** section, fill in the two `sync: false` values:

   | Key            | Value |
   |----------------|-------|
   | `DATABASE_URL` | `postgresql://postgres:[81K3JihcXgWGDBTE]@db.rmqpdtrlmgjvkpibwwgr.supabase.co:5432/postgres` |
   | `REDIS_URL`    | `rediss://:gQAAAAAAATO2AAIncDE3ZjMzZGE3YWIyYmQ0MDljODQ4YzY4N2JkZWNkNzY0MHAxNzg3NzQ@still-goose-78774.upstash.io:6379` |
   | `GROQ_API_KEY` | `<YOUR_GROQ_API_KEY>` |

6. Click **Create Web Service**. The build takes ~3–5 minutes.
7. Once live, verify: `https://protechtbim-api.onrender.com/health` should return `{"status":"ok"}`.

---

## Step 3 — Verify Vercel Picked Up the New URL

After the push in Step 1, go to your Vercel dashboard and confirm the latest
deployment completed. The build injects `VITE_API_URL` at build time, so
Vercel must rebuild for the new Render URL to take effect.

If it didn't rebuild automatically:
1. Go to Vercel → your project → **Deployments**.
2. Click the three-dot menu on the latest deployment → **Redeploy**.

---

## Free Tier Limits to Know

| Service  | Limit                                           | Impact                                      |
|----------|-------------------------------------------------|---------------------------------------------|
| Render   | Spins down after **15 min** of no requests      | First request after idle takes ~30s to wake |
| Supabase | 500 MB DB, pauses after **7 days** of inactivity | Log in to Supabase dashboard to unpause     |
| Upstash  | 10,000 Redis requests/day                       | Plenty for dev/light production             |
| Vercel   | 100 GB bandwidth/month                          | More than enough                            |

### Keeping Render Awake (Optional)
Add a free uptime monitor at **https://uptimerobot.com** — create a monitor for
`https://protechtbim-api.onrender.com/health` with a 14-minute interval.
This prevents the cold-start delay entirely.

---

## Troubleshooting

**Login still fails after deploy:**
- Open DevTools → Network tab → look at the `/auth/login` request.
- If it's hitting the old `.up.railway.app` URL, Vercel hasn't redeployed yet. Trigger a manual redeploy.

**Render build fails (`build-bundle.js` not found):**
- Check that `apps/api/scripts/build-bundle.js` exists in your repo (not gitignored).

**Database connection error on Render:**
- The Supabase free tier pauses after 7 days of inactivity. Log into supabase.com, go to your project, and click **Restore**.

**Redis connection error:**
- The Upstash URL is TLS (`rediss://`). Make sure you pasted the full URL including the `rediss://` scheme prefix.
