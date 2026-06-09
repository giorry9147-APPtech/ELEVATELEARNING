-- ════════════════════════════════════════════════════════════════
--  Migratie 009 — Connect-account per Stripe-modus scheiden (Fase 5 fix)
--  Voer dit uit in Supabase → SQL Editor (na 008). Idempotent.
--  Test- en live-Connect-accounts zijn verschillend; we bewaren ze apart
--  zodat lokaal (test) en productie (live) elkaar niet overschrijven.
--  `stripe_account_id` = LIVE, `stripe_account_id_test` = TEST.
-- ════════════════════════════════════════════════════════════════

alter table public.organizations
  add column if not exists stripe_account_id_test text;
