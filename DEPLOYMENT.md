# Deployment guide — free public URL

Two free services: **Render** hosts the Flask API + Postgres, **Vercel** hosts
the React frontend. End result: a link you can share.

Demo logins (seeded automatically on the live site):
- Admin: `admin@demo.school` / `Demo1234!`
- Parent: `parent@demo.school` / `Demo1234!`

---

## 0. Put the project on GitHub

```bash
cd student-onboarding-portal
git init && git add . && git commit -m "School information system"
git branch -M main
git remote add origin https://github.com/AadilKak/student-onboarding-portal.git
git push -u origin main
```

---

## 1. Backend + database on Render

1. Go to https://render.com and sign up (free).
2. **New → Blueprint**, connect your GitHub, pick this repo.
   Render reads `backend/render.yaml` and creates the API **and** a free Postgres.
3. Click **Apply**. Wait for the build to finish (a few minutes).
4. Copy your API URL — it looks like `https://sis-api.onrender.com`.
5. Open `https://sis-api.onrender.com/health` — you should see `{"status":"ok"}`.

The blueprint sets a strong `JWT_SECRET_KEY` automatically and turns on demo
seed data (`SEED_DEMO=1`), so the database is populated on first boot.

> Free Postgres on Render expires after ~90 days and the web service sleeps when
> idle (first request after sleep is slow). Fine for a portfolio demo.

---

## 2. Frontend on Vercel

1. Go to https://vercel.com and sign up (free), **Add New → Project**, import the repo.
2. Vercel auto-detects Vite. Leave build settings as-is (`vercel.json` is included).
3. Under **Environment Variables**, add:
   - `VITE_API_URL` = your Render URL (e.g. `https://sis-api.onrender.com`)
4. **Deploy**. You'll get a URL like `https://your-app.vercel.app`.

---

## 3. (Optional) Lock down CORS

Once you have the Vercel URL, in Render → your service → **Environment**, add:
- `FRONTEND_ORIGIN` = `https://your-app.vercel.app`

This restricts the API to only your frontend. Redeploy.

---

## 4. Share it

Send the Vercel link. Anyone can click **"Use demo admin"** or **"Use demo
parent"** on the login screen to try it instantly.

---

## Notes for a real (non-demo) deployment
- Set `SEED_DEMO=0` so it doesn't create demo accounts.
- Uploaded files on Render's disk are **ephemeral** (wiped on redeploy). For
  permanent files, set `STORAGE_BACKEND=s3` with an S3 bucket (see backend README).
- Upgrade off the free Postgres/web tiers for uptime and persistence.
