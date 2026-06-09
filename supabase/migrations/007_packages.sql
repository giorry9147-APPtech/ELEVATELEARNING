-- ════════════════════════════════════════════════════════════════
--  Migratie 007 — Prijs-/pakketbouwer (Fase 5)
--  Voer dit uit in Supabase → SQL Editor (na 006). Idempotent.
--  De docent stelt zelf lesprijzen/pakketten samen (catalogus). Directe
--  betaling door leerlingen (Stripe Connect) is een latere laag.
-- ════════════════════════════════════════════════════════════════

create table if not exists public.lesson_packages (
  id          uuid primary key default gen_random_uuid(),
  org_id      uuid not null references public.organizations (id) on delete cascade,
  name        text not null,
  description text,
  subject     text,
  kind        text not null default 'bundle',   -- hourly | bundle
  price_cents integer not null default 0,        -- per uur (hourly) of totaal (bundle)
  currency    text not null default 'EUR',
  hours       numeric,                           -- bundel: totaal uren; hourly: null
  active      boolean not null default true,
  position    integer not null default 0,
  created_at  timestamptz not null default now()
);
create index if not exists packages_org_idx on public.lesson_packages (org_id);

-- ── Row Level Security (tenant-scope; beheer door owner/teacher) ──
alter table public.lesson_packages enable row level security;

drop policy if exists "packages lezen" on public.lesson_packages;
create policy "packages lezen" on public.lesson_packages
  for select using (org_id in (select public.user_org_ids()));

drop policy if exists "packages beheren" on public.lesson_packages;
create policy "packages beheren" on public.lesson_packages
  for all using (
    org_id in (select om.org_id from public.org_members om
               where om.user_id = auth.uid() and om.role in ('owner','teacher'))
  ) with check (
    org_id in (select om.org_id from public.org_members om
               where om.user_id = auth.uid() and om.role in ('owner','teacher'))
  );
