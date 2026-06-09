-- ════════════════════════════════════════════════════════════════
--  Migratie 005 — Leerlingen-roster + CRM (Fase 5)
--  Voer dit uit in Supabase → SQL Editor (na 004_billing.sql). Idempotent.
--  Voegt toe: students (leerlingen per tenant, optioneel gekoppeld aan een
--  login) + student_notes (CRM-tijdlijn: voortgangsnotities & contact) + RLS.
-- ════════════════════════════════════════════════════════════════

-- ── Leerlingen (CRM-records; user_id optioneel als de leerling inlogt) ──
create table if not exists public.students (
  id         uuid primary key default gen_random_uuid(),
  org_id     uuid not null references public.organizations (id) on delete cascade,
  name       text not null,
  email      text,
  phone      text,
  subject    text,                                   -- vak(ken), vrij veld
  level      text,                                   -- niveau/klas, bv. "5 vwo"
  user_id    uuid references auth.users (id) on delete set null, -- optioneel account
  archived   boolean not null default false,
  created_at timestamptz not null default now()
);
create index if not exists students_org_idx  on public.students (org_id);
create index if not exists students_user_idx on public.students (user_id);

-- ── CRM-tijdlijn: voortgangsnotities + contactmomenten ──
create table if not exists public.student_notes (
  id         uuid primary key default gen_random_uuid(),
  org_id     uuid not null references public.organizations (id) on delete cascade,
  student_id uuid not null references public.students (id) on delete cascade,
  author_id  uuid references auth.users (id) on delete set null,
  kind       text not null default 'note',          -- note | contact
  body       text not null,
  created_at timestamptz not null default now()
);
create index if not exists student_notes_student_idx
  on public.student_notes (student_id, created_at desc);

-- ════════════════════════════════════════════════════════════════
--  Row Level Security (tenant-isolatie; beheer door owner/teacher/assistant)
-- ════════════════════════════════════════════════════════════════
alter table public.students      enable row level security;
alter table public.student_notes enable row level security;

drop policy if exists "students lezen" on public.students;
create policy "students lezen" on public.students
  for select using (org_id in (select public.user_org_ids()));

drop policy if exists "students beheren" on public.students;
create policy "students beheren" on public.students
  for all using (
    org_id in (select om.org_id from public.org_members om
               where om.user_id = auth.uid() and om.role in ('owner','teacher','assistant'))
  ) with check (
    org_id in (select om.org_id from public.org_members om
               where om.user_id = auth.uid() and om.role in ('owner','teacher','assistant'))
  );

drop policy if exists "notes lezen" on public.student_notes;
create policy "notes lezen" on public.student_notes
  for select using (org_id in (select public.user_org_ids()));

drop policy if exists "notes beheren" on public.student_notes;
create policy "notes beheren" on public.student_notes
  for all using (
    org_id in (select om.org_id from public.org_members om
               where om.user_id = auth.uid() and om.role in ('owner','teacher','assistant'))
  ) with check (
    org_id in (select om.org_id from public.org_members om
               where om.user_id = auth.uid() and om.role in ('owner','teacher','assistant'))
  );
