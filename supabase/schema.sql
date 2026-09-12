-- Run this in Supabase SQL Editor (Dashboard > SQL Editor > New Query)

-- 1. Entries table: every logged time block
create table entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users not null,
  start_time timestamptz not null,
  end_time timestamptz not null,
  category text not null,
  note text,
  created_at timestamptz default now()
);

-- 2. User settings: one row per user
create table user_settings (
  user_id uuid references auth.users primary key,
  reminder_interval_minutes int default 60,
  notification_style text default 'normal', -- 'normal' or 'silent'
  sleep_start time default '00:00',
  sleep_end time default '06:00',
  timezone text default 'Asia/Kolkata',
  last_notified_at timestamptz, -- when we last actually sent a push (drives the cron)
  updated_at timestamptz default now()
);

-- 2b. Push subscriptions: one row per device/browser the user has enabled
-- notifications on. A user can have several (phone + laptop etc).
create table push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users not null,
  endpoint text not null unique,
  p256dh text not null,
  auth text not null,
  created_at timestamptz default now()
);

alter table push_subscriptions enable row level security;

create policy "Users manage own push subscriptions" on push_subscriptions
  for all using (auth.uid() = user_id);

-- 3. Categories: defaults + user custom ones
create table categories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users,
  label text not null,
  emoji text not null,
  is_default boolean default false,
  sort_order int default 0
);

-- Row Level Security: users can only see/edit their own data
alter table entries enable row level security;
alter table user_settings enable row level security;
alter table categories enable row level security;

create policy "Users manage own entries" on entries
  for all using (auth.uid() = user_id);

create policy "Users manage own settings" on user_settings
  for all using (auth.uid() = user_id);

create policy "Users manage own categories" on categories
  for all using (auth.uid() = user_id or user_id is null);

-- Seed default categories (visible to everyone, user_id null)
insert into categories (label, emoji, is_default, sort_order) values
  ('Study', '🎓', true, 1),
  ('Work', '💼', true, 2),
  ('Travel', '🚗', true, 3),
  ('Food', '🍴', true, 4),
  ('Rest', '😴', true, 5),
  ('Entertainment', '📱', true, 6),
  ('Personal', '🏠', true, 7);
