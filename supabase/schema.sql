-- ════════════════════════════════════════════════════════════════
--  Bijlesplatform — database-schema
--  Voer dit uit in Supabase → SQL Editor zodra je project is aangemaakt.
--  Bevat: rollen, profielen, uitnodigingscodes, sessies + RLS-policies.
-- ════════════════════════════════════════════════════════════════

-- ── Rollen ──
do $$ begin
  create type user_role as enum ('student', 'teacher', 'admin');
exception when duplicate_object then null; end $$;

-- ── Profielen (1-op-1 met auth.users) ──
create table if not exists public.profiles (
  id          uuid primary key references auth.users (id) on delete cascade,
  role        user_role not null default 'student',
  full_name   text,
  -- Tutor-velden (later uitbreidbaar)
  bio         text,
  subjects    text[],
  created_at  timestamptz not null default now()
);

-- ── Uitnodigingscodes (gesloten demo-fase) ──
create table if not exists public.invites (
  code        text primary key,
  role        user_role not null default 'student',
  max_uses    int not null default 1,
  used_count  int not null default 0,
  expires_at  timestamptz,
  created_at  timestamptz not null default now()
);

-- ── Sessies / rooms ──
create table if not exists public.sessions (
  id          uuid primary key default gen_random_uuid(),
  room_id     text unique not null,
  title       text not null default 'Naamloze les',
  teacher_id  uuid references public.profiles (id) on delete set null,
  scheduled_at timestamptz,
  status      text not null default 'open',  -- open | live | ended
  created_at  timestamptz not null default now()
);

create index if not exists sessions_teacher_idx on public.sessions (teacher_id);

-- ── Automatisch profiel aanmaken bij signup ──
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, new.raw_user_meta_data ->> 'full_name')
  on conflict (id) do nothing;
  return new;
end $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ════════════════════════════════════════════════════════════════
--  Row Level Security
-- ════════════════════════════════════════════════════════════════
alter table public.profiles enable row level security;
alter table public.sessions enable row level security;
alter table public.invites  enable row level security;

-- Profielen: iedereen mag eigen profiel lezen/bewerken; tutorprofielen publiek leesbaar.
drop policy if exists "eigen profiel lezen" on public.profiles;
create policy "eigen profiel lezen" on public.profiles
  for select using (auth.uid() = id or role = 'teacher');

drop policy if exists "eigen profiel bijwerken" on public.profiles;
create policy "eigen profiel bijwerken" on public.profiles
  for update using (auth.uid() = id);

-- Sessies: ingelogde gebruikers mogen lezen; docent beheert eigen sessies.
drop policy if exists "sessies lezen" on public.sessions;
create policy "sessies lezen" on public.sessions
  for select using (auth.role() = 'authenticated');

drop policy if exists "docent maakt sessie" on public.sessions;
create policy "docent maakt sessie" on public.sessions
  for insert with check (auth.uid() = teacher_id);

drop policy if exists "docent beheert sessie" on public.sessions;
create policy "docent beheert sessie" on public.sessions
  for update using (auth.uid() = teacher_id);

drop policy if exists "docent verwijdert sessie" on public.sessions;
create policy "docent verwijdert sessie" on public.sessions
  for delete using (auth.uid() = teacher_id);

-- Invites: alleen via service-role (server) beheerd; geen client-toegang.
-- (Geen select-policy = standaard geblokkeerd voor anon/authenticated.)

-- ── Voorbeeld-invite voor je team (pas aan of verwijder) ──
insert into public.invites (code, role, max_uses)
values ('TEAM-2026', 'teacher', 50)
on conflict (code) do nothing;
