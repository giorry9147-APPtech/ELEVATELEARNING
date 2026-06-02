-- ════════════════════════════════════════════════════════════════
--  Migratie 003 — White-label branding + domeinen (SaaS Fase 3)
--  Voer dit uit in Supabase → SQL Editor (na 002). Idempotent.
--  Voegt per tenant toe: logo, merkkleur, tagline + eigen domein(en),
--  plus publieke resolutie van branding op hostnaam.
-- ════════════════════════════════════════════════════════════════

-- ── Branding-velden op de tenant ──
alter table public.organizations
  add column if not exists logo_url    text,
  add column if not exists brand_color text default '#0284c7',  -- sky-600
  add column if not exists tagline     text;

-- ── Eigen domeinen per tenant ──
create table if not exists public.org_domains (
  id         uuid primary key default gen_random_uuid(),
  org_id     uuid not null references public.organizations (id) on delete cascade,
  hostname   text unique not null,
  verified   boolean not null default true,   -- echte DNS-verificatie loopt via Vercel
  created_at timestamptz not null default now()
);
create index if not exists org_domains_org_idx on public.org_domains (org_id);

alter table public.org_domains enable row level security;

drop policy if exists "domains lezen" on public.org_domains;
create policy "domains lezen" on public.org_domains
  for select using (org_id in (select public.user_org_ids()));

drop policy if exists "owner beheert domains" on public.org_domains;
create policy "owner beheert domains" on public.org_domains
  for all
  using (org_id in (
    select org_id from public.org_members
    where user_id = auth.uid() and role = 'owner'
  ))
  with check (org_id in (
    select org_id from public.org_members
    where user_id = auth.uid() and role = 'owner'
  ));

-- ════════════════════════════════════════════════════════════════
--  Publieke resolutie van branding
-- ════════════════════════════════════════════════════════════════

-- Op hostnaam (voor anonieme bezoekers op een eigen domein).
create or replace function public.branding_for_host(host text)
returns table (org_id uuid, name text, logo_url text, brand_color text, tagline text)
language sql security definer stable set search_path = public as $$
  select o.id, o.name, o.logo_url, o.brand_color, o.tagline
  from public.org_domains d
  join public.organizations o on o.id = d.org_id
  where lower(d.hostname) = lower(host) and d.verified
  limit 1
$$;
grant execute on function public.branding_for_host(text) to anon, authenticated;

-- Branding van de eigen tenant (voor de ingelogde docent).
create or replace function public.my_branding()
returns table (org_id uuid, name text, logo_url text, brand_color text, tagline text)
language sql security definer stable set search_path = public as $$
  select o.id, o.name, o.logo_url, o.brand_color, o.tagline
  from public.org_members m
  join public.organizations o on o.id = m.org_id
  where m.user_id = auth.uid()
  limit 1
$$;
grant execute on function public.my_branding() to authenticated;
