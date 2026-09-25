create table if not exists public.abr_app_state (
  id text primary key,
  state jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.abr_app_state enable row level security;
