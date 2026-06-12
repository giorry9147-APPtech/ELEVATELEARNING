-- ════════════════════════════════════════════════════════════════
--  Migratie 010 — Booking & rooster (Fase 7)
--  Voer dit uit in Supabase → SQL Editor (na 009). Idempotent.
--  Docent stelt wekelijkse beschikbaarheid in; leerlingen boeken vrije slots.
-- ════════════════════════════════════════════════════════════════

-- Lesduur per tenant (minuten) — basis voor de slot-grootte.
alter table public.organizations
  add column if not exists lesson_minutes integer not null default 60;

-- Wekelijkse beschikbaarheid (terugkerend, per weekdag).
create table if not exists public.availability (
  id         uuid primary key default gen_random_uuid(),
  org_id     uuid not null references public.organizations (id) on delete cascade,
  weekday    smallint not null,        -- 1=ma .. 7=zo (ISO-8601)
  start_min  integer not null,         -- minuten vanaf middernacht (bv. 960 = 16:00)
  end_min    integer not null,         -- bv. 1200 = 20:00
  created_at timestamptz not null default now()
);
create index if not exists availability_org_idx on public.availability (org_id);

-- Boekingen van leerlingen.
create table if not exists public.bookings (
  id            uuid primary key default gen_random_uuid(),
  org_id        uuid not null references public.organizations (id) on delete cascade,
  student_id    uuid references public.students (id) on delete set null,
  student_name  text,
  student_email text,
  starts_at     timestamptz not null,
  duration_min  integer not null default 60,
  status        text not null default 'confirmed',  -- confirmed | cancelled
  room_id       text,
  created_at    timestamptz not null default now()
);
create index if not exists bookings_org_idx on public.bookings (org_id, starts_at);

-- ── Row Level Security ──
alter table public.availability enable row level security;
alter table public.bookings     enable row level security;

drop policy if exists "availability lezen" on public.availability;
create policy "availability lezen" on public.availability
  for select using (org_id in (select public.user_org_ids()));

drop policy if exists "availability beheren" on public.availability;
create policy "availability beheren" on public.availability
  for all using (
    org_id in (select om.org_id from public.org_members om
               where om.user_id = auth.uid() and om.role in ('owner','teacher'))
  ) with check (
    org_id in (select om.org_id from public.org_members om
               where om.user_id = auth.uid() and om.role in ('owner','teacher'))
  );

drop policy if exists "bookings lezen" on public.bookings;
create policy "bookings lezen" on public.bookings
  for select using (org_id in (select public.user_org_ids()));

drop policy if exists "bookings beheren" on public.bookings;
create policy "bookings beheren" on public.bookings
  for all using (
    org_id in (select om.org_id from public.org_members om
               where om.user_id = auth.uid() and om.role in ('owner','teacher'))
  ) with check (
    org_id in (select om.org_id from public.org_members om
               where om.user_id = auth.uid() and om.role in ('owner','teacher'))
  );
-- Publieke boekingen worden server-side via de service-role aangemaakt (omzeilt RLS).
