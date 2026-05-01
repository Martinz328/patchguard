-- PatchGuard: store scan results for reports + rate limiting

create extension if not exists pgcrypto;

create table if not exists public.scan_results (
  id uuid primary key default gen_random_uuid(),
  url text not null,
  score integer not null check (score >= 0 and score <= 100),
  grade text not null check (grade in ('GOOD', 'MODERATE', 'AT_RISK')),
  findings jsonb not null default '[]'::jsonb,
  duration_ms integer,
  created_at timestamptz not null default now(),
  ip_address text
);
zsh (153-155)
 
create index if not exists scan_results_created_at_desc_idx
  on public.scan_results (created_at desc);

create index if not exists scan_results_url_idx
  on public.scan_results (url);

alter table public.scan_results enable row level security;

-- Lock down public access: anonymous can only INSERT.
revoke all on table public.scan_results from anon;
revoke all on table public.scan_results from authenticated;
grant insert on table public.scan_results to anon;

create policy "anon_insert_only"
  on public.scan_results
  for insert
  to anon
  with check (true);

