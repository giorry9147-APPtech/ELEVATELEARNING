-- ════════════════════════════════════════════════════════════════
--  Migratie 002 — Whiteboards in de database (SaaS Fase 2)
--  Voer dit uit in Supabase → SQL Editor (na 001_tenants.sql). Idempotent.
--  Bewaart de volledige bord-state (alle borden + pagina's) per tenant + room,
--  zodat lesmateriaal van een ingelogde docent op elk apparaat terugkomt.
-- ════════════════════════════════════════════════════════════════

create table if not exists public.whiteboards (
  org_id     uuid not null references public.organizations (id) on delete cascade,
  room_id    text not null,
  state      jsonb not null default '[]'::jsonb,  -- { boards, activeBoardId, data }
  updated_at timestamptz not null default now(),
  primary key (org_id, room_id)
);

alter table public.whiteboards enable row level security;

-- Alleen leden van de tenant mogen het whiteboard lezen/schrijven.
drop policy if exists "wb lezen" on public.whiteboards;
create policy "wb lezen" on public.whiteboards
  for select using (org_id in (select public.user_org_ids()));

drop policy if exists "wb schrijven" on public.whiteboards;
create policy "wb schrijven" on public.whiteboards
  for all
  using (org_id in (select public.user_org_ids()))
  with check (org_id in (select public.user_org_ids()));
