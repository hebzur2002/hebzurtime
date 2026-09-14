# TimeTrack — Setup Guide

## 1. Supabase setup
1. Go to supabase.com → New project (free tier).
2. Once created, go to **SQL Editor → New Query**, paste the contents of
   `supabase/schema.sql`, and run it. This creates the `entries`,
   `user_settings`, and `categories` tables with default categories seeded.
3. Go to **Project Settings → API** and copy:
   - Project URL
   - anon public key
4. Go to **Authentication → Providers** and enable at least one sign-in
   method (Email magic link is the simplest for a solo personal app — no
   password needed).

## 2. Local project setup 
1. `.env.local` already has working VAPID keys + a cron secret filled in —
   you only need to add your Supabase URL, anon key, and service role key
   (Project Settings → API → `service_role` — keep this one secret, never
   expose it client-side).
2. `npm install`
3. `npm run dev` → open http://localhost:3000

## 3. Auth
Email magic-link sign-in is wired up (`/login` → `supabase.auth.signInWithOtp`).
Make sure **Authentication → Providers → Email** is enabled in Supabase, and
that your site URL is added under **Authentication → URL Configuration** (both
`http://localhost:3000` for local dev and your Vercel domain for prod) so the
magic link redirects correctly.

## 4. Deploy
Push this to a GitHub repo, then import it in Vercel. Add all the env vars
from `.env.local` in Vercel's project settings (Settings → Environment
Variables) — same names, same values. Every push to `main` auto-deploys.

### Background push notifications (works when the app/tab is closed)
This is now built — here's what makes it fire even with the app closed:
1. On first load, the app registers `public/sw.js` (a service worker) and
   asks for notification permission, then saves the subscription in the new
   `push_subscriptions` table.
2. `/api/send-reminders` is the actual trigger — call it on a schedule and it
   checks every user's settings and sends a push via `web-push` to whoever is
   due (respecting their interval and sleep window).
3. `vercel.json` sets up a Vercel Cron Job to hit that route every 15
   minutes. **Vercel's free Hobby plan only runs cron jobs once a day** — for
   real 15-minute reminders you either need a Vercel Pro plan, or point a
   free external cron service (e.g. cron-job.org) at
   `https://your-app.vercel.app/api/send-reminders` every 15 min, with header
   `Authorization: Bearer <your CRON_SECRET>`.
4. On Vercel, if you set the `CRON_SECRET` env var, Vercel's own Cron Jobs
   send that same bearer token automatically — nothing extra to configure
   there.
5. Use the "Test notification now" button on the home page to confirm the
   whole pipeline (permission → subscription → server push) actually works
   end to end, ideally after closing the tab once.

## What's built (V1 MVP)
- Quick-tap category logging (Study/Work/Travel/Food/Rest/Entertainment/Personal)
- Optional note per entry
- Today's timeline view
- "Where did my day go?" category breakdown bars
- Settings page: reminder interval (15/30/60/120 min), notification style
  (normal vs always-silent), sleep window
- Magic-link login
- Background push reminders — work even when the app/tab is closed (service
  worker + VAPID + a cron-triggered API route, see section 4 above)

## What's not built yet (next steps)
- Missed-entry detection & backfill prompt
- Weekly/monthly rollup view
- Edit/delete entries UI
