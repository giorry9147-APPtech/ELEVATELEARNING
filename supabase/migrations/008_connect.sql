-- ════════════════════════════════════════════════════════════════
--  Migratie 008 — Stripe Connect: leerlingen betalen de docent (Fase 5)
--  Voer dit uit in Supabase → SQL Editor (na 007). Idempotent.
--  Voegt toe: stripe_account_id op organizations (Express-account van de
--  docent) + package_purchases (aankopen van pakketten door leerlingen).
-- ════════════════════════════════════════════════════════════════

alter table public.organizations
  add column if not exists stripe_account_id text;

create table if not exists public.package_purchases (
  id                uuid primary key default gen_random_uuid(),
  org_id            uuid not null references public.organizations (id) on delete cascade,
  package_id        uuid references public.lesson_packages (id) on delete set null,
  student_id        uuid references public.students (id) on delete set null,
  buyer_name        text,
  buyer_email       text,
  amount_cents      integer not null default 0,
  currency          text not null default 'EUR',
  status            text not null default 'pending',  -- pending | paid
  stripe_session_id text unique,
  created_at        timestamptz not null default now()
);
create index if not exists purchases_org_idx on public.package_purchases (org_id, created_at desc);

-- ── Row Level Security ──
-- Lezen: binnen je tenant. Schrijven gebeurt server-side via de service-role
-- (checkout/finalize) en omzeilt RLS, dus er zijn geen write-policies nodig.
alter table public.package_purchases enable row level security;

drop policy if exists "purchases lezen" on public.package_purchases;
create policy "purchases lezen" on public.package_purchases
  for select using (org_id in (select public.user_org_ids()));
