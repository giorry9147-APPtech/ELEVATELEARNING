-- ════════════════════════════════════════════════════════════════
--  Migratie 001 — Multi-tenant fundament (SaaS Fase 1)
--  Voer dit uit in Supabase → SQL Editor (na schema.sql). Idempotent.
--  Voegt toe: organizations (tenants), org_members (rollen), org-scoping
--  van sessions, auto-tenant bij signup, RLS-isolatie, en backfill.
-- ════════════════════════════════════════════════════════════════

-- ── Tenants ──
create table if not exists public.organizations (
  id         uuid primary key default gen_random_uuid(),
  slug       text unique,
  name       text not null default 'Mijn lesomgeving',
  owner_id   uuid references auth.users (id) on delete set null,
  plan       text not null default 'free',     -- free | pro | whitelabel
  features   jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

-- ── Lidmaatschap (user ↔ tenant + rol) ──
create table if not exists public.org_members (
  org_id     uuid references public.organizations (id) on delete cascade,
  user_id    uuid references auth.users (id) on delete cascade,
  role       text not null default 'teacher',  -- owner | teacher | assistant | student
  created_at timestamptz not null default now(),
  primary key (org_id, user_id)
);
create index if not exists org_members_user_idx on public.org_members (user_id);

-- ── Sessions tenant-scopen ──
alter table public.sessions
  add column if not exists org_id uuid references public.organizations (id) on delete cascade;
create index if not exists sessions_org_idx on public.sessions (org_id);

-- ════════════════════════════════════════════════════════════════
--  Helpers
-- ════════════════════════════════════════════════════════════════

-- Tenants van de ingelogde gebruiker (SECURITY DEFINER → geen RLS-recursie).
create or replace function public.user_org_ids()
returns setof uuid language sql security definer stable
set search_path = public as $$
  select org_id from public.org_members where user_id = auth.uid()
$$;

-- Maakt (indien nodig) een persoonlijke tenant voor `uid`. Intern gebruik.
create or replace function public.ensure_org_for_user(uid uuid, display_name text)
returns uuid language plpgsql security definer set search_path = public as $$
declare existing uuid;
begin
  select om.org_id into existing from public.org_members om
    where om.user_id = uid limit 1;
  if existing is not null then return existing; end if;

  insert into public.organizations (name, owner_id)
    values (coalesce(nullif(display_name, ''), 'Mijn lesomgeving'), uid)
    returning id into existing;
  insert into public.org_members (org_id, user_id, role)
    values (existing, uid, 'owner') on conflict do nothing;
  return existing;
end $$;
revoke all on function public.ensure_org_for_user(uuid, text) from public;

-- App-veilige variant: werkt alleen voor de ingelogde gebruiker zelf.
create or replace function public.ensure_my_org()
returns uuid language plpgsql security definer set search_path = public as $$
declare uid uuid := auth.uid(); dname text;
begin
  if uid is null then return null; end if;
  select split_part(email, '@', 1) into dname from auth.users where id = uid;
  return public.ensure_org_for_user(uid, dname);
end $$;
grant execute on function public.ensure_my_org() to authenticated;

-- ── Auto-tenant bij signup (uitbreiding van handle_new_user) ──
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, new.raw_user_meta_data ->> 'full_name')
  on conflict (id) do nothing;
  perform public.ensure_org_for_user(new.id, split_part(new.email, '@', 1));
  return new;
end $$;

-- ════════════════════════════════════════════════════════════════
--  Backfill (bestaande users + sessies)
-- ════════════════════════════════════════════════════════════════

-- Tenant voor bestaande users zonder lidmaatschap.
do $$
declare r record;
begin
  for r in
    select u.id, u.email from auth.users u
    left join public.org_members m on m.user_id = u.id
    where m.user_id is null
  loop
    perform public.ensure_org_for_user(r.id, split_part(r.email, '@', 1));
  end loop;
end $$;

-- Bestaande sessies koppelen aan de tenant van hun docent.
update public.sessions s
set org_id = (
  select om.org_id from public.org_members om
  where om.user_id = s.teacher_id limit 1
)
where s.org_id is null and s.teacher_id is not null;

-- ════════════════════════════════════════════════════════════════
--  Row Level Security
-- ════════════════════════════════════════════════════════════════
alter table public.organizations enable row level security;
alter table public.org_members  enable row level security;

drop policy if exists "org lezen" on public.organizations;
create policy "org lezen" on public.organizations
  for select using (id in (select public.user_org_ids()));

drop policy if exists "org owner beheert" on public.organizations;
create policy "org owner beheert" on public.organizations
  for update using (owner_id = auth.uid());

drop policy if exists "leden lezen" on public.org_members;
create policy "leden lezen" on public.org_members
  for select using (
    user_id = auth.uid() or org_id in (select public.user_org_ids())
  );

-- ── Sessions: van teacher-scope naar tenant-scope ──
drop policy if exists "sessies lezen" on public.sessions;
create policy "sessies lezen" on public.sessions
  for select using (org_id in (select public.user_org_ids()));

drop policy if exists "docent maakt sessie" on public.sessions;
create policy "docent maakt sessie" on public.sessions
  for insert with check (
    org_id in (select public.user_org_ids()) and auth.uid() = teacher_id
  );

drop policy if exists "docent beheert sessie" on public.sessions;
create policy "docent beheert sessie" on public.sessions
  for update using (org_id in (select public.user_org_ids()));

drop policy if exists "docent verwijdert sessie" on public.sessions;
create policy "docent verwijdert sessie" on public.sessions
  for delete using (org_id in (select public.user_org_ids()));
