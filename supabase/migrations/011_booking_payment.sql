-- ════════════════════════════════════════════════════════════════
--  Migratie 011 — Boeken + betalen koppelen (Fase 7)
--  Voer dit uit in Supabase → SQL Editor (na 010). Idempotent.
--  Prijs per losse les + sessie-id op bookings zodat een boeking pas
--  bevestigd wordt na betaling.
-- ════════════════════════════════════════════════════════════════

alter table public.organizations
  add column if not exists booking_price_cents integer not null default 0;

alter table public.bookings
  add column if not exists stripe_session_id text;
create index if not exists bookings_session_idx on public.bookings (stripe_session_id);
