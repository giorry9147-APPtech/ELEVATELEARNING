-- ════════════════════════════════════════════════════════════════
--  Migratie 006 — Lessen ↔ leerlingen koppelen (Fase 5)
--  Voer dit uit in Supabase → SQL Editor (na 005_students.sql). Idempotent.
--  Koppelt sessies aan leerlingen voor lessenhistorie + aanwezigheid.
-- ════════════════════════════════════════════════════════════════

create table if not exists public.lesson_attendance (
  id         uuid primary key default gen_random_uuid(),
  org_id     uuid not null references public.organizations (id) on delete cascade,
  session_id uuid not null references public.sessions (id) on delete cascade,
  student_id uuid not null references public.students (id) on delete cascade,
  status     text not null default 'planned',   -- planned | present | absent
  created_at timestamptz not null default now(),
  unique (session_id, student_id)
);
create index if not exists attendance_student_idx on public.lesson_attendance (student_id);
create index if not exists attendance_session_idx on public.lesson_attendance (session_id);

-- ── Row Level Security (tenant-scope; beheer door owner/teacher/assistant) ──
alter table public.lesson_attendance enable row level security;

drop policy if exists "attendance lezen" on public.lesson_attendance;
create policy "attendance lezen" on public.lesson_attendance
  for select using (org_id in (select public.user_org_ids()));

drop policy if exists "attendance beheren" on public.lesson_attendance;
create policy "attendance beheren" on public.lesson_attendance
  for all using (
    org_id in (select om.org_id from public.org_members om
               where om.user_id = auth.uid() and om.role in ('owner','teacher','assistant'))
  ) with check (
    org_id in (select om.org_id from public.org_members om
               where om.user_id = auth.uid() and om.role in ('owner','teacher','assistant'))
  );
