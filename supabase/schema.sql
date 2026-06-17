-- Run this in the Supabase SQL editor after creating your project.
-- Enable email/password auth under Authentication → Providers.

create table if not exists public.user_plans (
  user_id uuid primary key references auth.users (id) on delete cascade,
  data jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.user_plans enable row level security;

create policy "Users can read own plan"
  on public.user_plans
  for select
  using (auth.uid() = user_id);

create policy "Users can insert own plan"
  on public.user_plans
  for insert
  with check (auth.uid() = user_id);

create policy "Users can update own plan"
  on public.user_plans
  for update
  using (auth.uid() = user_id);

create policy "Users can delete own plan"
  on public.user_plans
  for delete
  using (auth.uid() = user_id);
