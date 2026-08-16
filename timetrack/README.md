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
1. Copy `.env.local.example` to `.env.local` and fill in your Supabase URL
   and anon key.
2. `npm install`
3. `npm run dev` → open http://localhost:3000

## 3. Auth (not yet wired into the UI)
This V1 assumes you're signed in. The simplest addition: a `/login` page
using `supabase.auth.signInWithOtp({ email })` for a magic-link login, then
redirect to `/` once session exists. This was left out of the MVP files so
you can wire it exactly how you like — ping me when you're ready and I'll
add it.

## 4. Deploy
Push this to a GitHub repo, then import it in Vercel. Add the two env vars
(`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`) in Vercel's
project settings. Every push to `main` auto-deploys.

## What's built (V1 MVP)
- Quick-tap category logging (Study/Work/Travel/Food/Rest/Entertainment/Personal)
- Optional note per entry
- Today's timeline view
- "Where did my day go?" category breakdown bars
- Settings page: reminder interval (15/30/60/120 min), notification style
  (normal vs always-silent), sleep window
- Browser Notification reminders (works while the tab is open)

## What's not built yet (next steps)
- Login page (see section 3 above)
- Missed-entry detection & backfill prompt
- Weekly/monthly rollup view
- Background push notifications (works when app/tab is closed) — needs a
  service worker + VAPID keys + a Supabase Edge Function on a cron schedule
- Edit/delete entries UI
