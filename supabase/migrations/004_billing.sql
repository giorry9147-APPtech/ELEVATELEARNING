-- ════════════════════════════════════════════════════════════════
--  Migratie 004 — Billing & minuten-metering (SaaS Fase 4)
--  Voer dit uit in Supabase → SQL Editor (na 003). Idempotent.
--  Voegt toe: subscriptions (Stripe-status per tenant), usage_ledger
--  (lesminuten, idempotent op Daily-event), en my_usage() voor gating.
--
--  BELANGRIJK: Stripe meet wél, maar blokkeert NIET. De echte limiet-check
--  doet de app op basis van usage_ledger (zacht 80% / hard 100%).
-- ════════════════════════════════════════════════════════════════

-- ── Abonnement per tenant (gevoed door Stripe-webhooks via service-role) ──
create table if not exists public.subscriptions (
  org_id                 uuid primary key references public.organizations (id) on delete cascade,
  stripe_customer_id     text,
  stripe_subscription_id text,
  status                 text not null default 'none',  -- none|trialing|active|past_due|canceled
  plan                   text not null default 'free',  -- free|starter|pro|whitelabel
  minutes_included       int  not null default 150,
  current_period_start   timestamptz,
  current_period_end     timestamptz,
  updated_at             timestamptz not null default now()
);

-- ── Verbruiksgrootboek: lesminuten per sessie (idempotent op Daily-event) ──
create table if not exists public.usage_ledger (
  id          uuid primary key default gen_random_uuid(),
  org_id      uuid not null references public.organizations (id) on delete cascade,
  room_id     text,
  event_id    text unique,                 -- Daily-event-id → voorkomt dubbeltellen
  minutes     numeric not null default 0,  -- lesminuten (deelnemer-min / 2 voor 1-op-1)
  occurred_at timestamptz not null default now(),
  created_at  timestamptz not null default now()
);
create index if not exists usage_ledger_org_idx on public.usage_ledger (org_id, occurred_at);

-- ════════════════════════════════════════════════════════════════
--  RLS — lezen mag binnen je tenant; schrijven gaat via service-role
--  (Stripe/Daily-webhooks), dus geen insert/update-policy voor clients.
-- ════════════════════════════════════════════════════════════════
alter table public.subscriptions enable row level security;
alter table public.usage_ledger  enable row level security;

drop policy if exists "sub lezen" on public.subscriptions;
create policy "sub lezen" on public.subscriptions
  for select using (org_id in (select public.user_org_ids()));

drop policy if exists "usage lezen" on public.usage_ledger;
create policy "usage lezen" on public.usage_ledger
  for select using (org_id in (select public.user_org_ids()));

-- ── Verbruik + restant van de huidige periode (voor de meter + gating) ──
create or replace function public.my_usage()
returns table (
  plan             text,
  minutes_included int,
  minutes_used     numeric,
  minutes_remaining numeric
)
language sql security definer stable set search_path = public as $$
  with org as (
    select org_id from public.org_members where user_id = auth.uid() limit 1
  ),
  sub as (
    select s.* from public.subscriptions s join org on org.org_id = s.org_id
  ),
  period as (
    select
      coalesce((select current_period_start from sub), date_trunc('month', now()))                       as start_at,
      coalesce((select current_period_end   from sub), date_trunc('month', now()) + interval '1 month')  as end_at
  ),
  used as (
    select coalesce(sum(u.minutes), 0) as m
    from public.usage_ledger u, org, period
    where u.org_id = org.org_id
      and u.occurred_at >= period.start_at
      and u.occurred_at <  period.end_at
  )
  select
    coalesce((select plan from sub), 'free')                       as plan,
    coalesce((select minutes_included from sub), 150)             as minutes_included,
    (select m from used)                                          as minutes_used,
    coalesce((select minutes_included from sub), 150) - (select m from used) as minutes_remaining
$$;
grant execute on function public.my_usage() to authenticated;
