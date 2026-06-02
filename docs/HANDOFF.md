# Overdracht / Handoff — Bijlesplatform SaaS

> Voor een nieuwe chat-sessie. Beschrijft de volledige staat, locaties,
> beslissingen, valkuilen en wat er nog moet gebeuren. Lees ook de
> memory-bestanden (`MEMORY.md`-index) en `docs/ROADMAP.md`,
> `docs/SAAS-ARCHITECTURE.md`, `docs/KOSTEN-PRIJZEN.md`, `docs/VIDEO-KEUZE.md`.

## 1. Wat is dit
Multi-tenant **SaaS bijlesplatform**: docenten nemen een abonnement (€0/€19/€39/€129),
geven online les (video + collaboratief whiteboard + chat) aan hun leerlingen.
White-label klanten (Djelian, Xiomara) krijgen eigen domein + huisstijl op
**dezelfde codebase**. Xiomara wil later een opdrachten/voortgang-module
(per-tenant feature-flag, geen aparte site).

## 2. Locaties & toegang
- **App-code:** `/Users/cornerstonetech/Desktop/WHITEBOARD/bijlesplatform/` (= repo-root)
- **GitHub:** `github.com/giorry9147-APPtech/ELEVATELEARNING`, branch `main`
- **Live:** https://elevatelearning-nine.vercel.app
- **Vercel:** project `elevatelearning` (account `giorry9147-apptech`). **Vercel CLI is lokaal ingelogd** → `npx vercel --prod --yes` om te deployen, `npx vercel env add NAME production` voor env.
- **Supabase:** project ref `sjnvkqvtsvbcwixhrqam`, URL `https://sjnvkqvtsvbcwixhrqam.supabase.co`
- **Stripe:** test-mode, NL-account `acct_1TdpucJmeFMZgdY9`

## 3. Stack
Next.js 16 (App Router, src-dir, Tailwind v4, Turbopack) · React 19 · Supabase
(Postgres + Auth + RLS + Realtime) · Excalidraw (whiteboard) · Daily.co (video) ·
Stripe Billing (abonnementen) · Resend (e-mail, nog te activeren) · gehost op Vercel.

## 4. Wat is gebouwd (allemaal LIVE)
- **MVP klas** (`/klas/[roomId]`): Excalidraw-whiteboard met **meerdere borden (tabs)** + **meerdere pagina's per bord** (grijs paginakader "Pagina N") + **wiskunde-toetsenbord** (∑); realtime-sync via Supabase broadcast met **reconciliatie**; Daily-video (**eigen room per les** via `/api/daily-room`, met room-`exp`/auto-eject kostenbescherming); chat.
- **Auth:** e-mail + wachtwoord (NIET magic link). `/api/signup` maakt accounts server-side aan met `email_confirm` (geen mail), **invite-gated** (code `TEAM-2026`), claimt bestaande passwordless accounts. Login = `signInWithPassword`. Supabase Auth + RLS.
- **Fase 1 — Tenants:** `organizations` + `org_members` (rollen owner/teacher/assistant/student) + RLS-isolatie via `user_org_ids()`. Auto-tenant bij signup. Sessies tenant-scoped.
- **Fase 2 — Whiteboards in DB:** tabel `whiteboards` (org_id, room_id, state jsonb). Ingelogde docent laadt/saved naar DB (terug op elk apparaat); niet-ingelogd = localStorage.
- **Fase 3 — White-label:** branding-velden op `organizations` (logo_url, brand_color, tagline) + `org_domains` + RPCs `branding_for_host` / `my_branding`. `BrandingProvider` past merk toe (CSS-var `--brand`, `BrandMark` logo+naam in headers). `/settings` = eigenaar bewerkt branding + domeinen.
- **Fase 4a — Abonnementen:** `/api/checkout` (Stripe Checkout, subscription, iDEAL+kaart), `/api/portal` (Customer Portal), `/api/stripe/webhook` (sub-status → `subscriptions` + `organizations.plan/features`). `BillingCard` in dashboard (plan + minuten-meter + upgrade/beheer). Plannen in `src/lib/plans.ts`.
- **Fase 4b — Metering + gating:** `/api/daily/webhook` (meeting.ended → lesminuten = participant-min/2 → `usage_ledger`, HMAC-geverifieerd, room→sessie→org, idempotent op meeting-id). Gating in `SessionLauncher`: geen nieuwe les bij 0 resterende minuten. `my_usage()` RPC voedt de meter.

## 5. Database-migraties (Supabase SQL Editor, in volgorde, idempotent)
`supabase/schema.sql` (basis: profiles/invites/sessions) → `001_tenants.sql` →
`002_whiteboards.sql` → `003_branding.sql` → `004_billing.sql`.
**Status: alle 5 zijn door de gebruiker gedraaid** (004-tabellen geverifieerd aanwezig).
Nieuwe migraties: maak `005_*.sql` etc. en laat de GEBRUIKER ze draaien (ik heb
geen Supabase Management-token meer).

## 6. Keys & secrets (waar ze staan)
Alles staat in `bijlesplatform/.env.local` (**gitignored**) én in **Vercel** (production+development):
- Supabase: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` (anon JWT), `SUPABASE_SERVICE_ROLE_KEY` (= `sb_secret_...`)
- Daily: `NEXT_PUBLIC_DAILY_ROOM_URL` (`https://bijlesplatform.daily.co/Demo_bijles`), `NEXT_PUBLIC_DAILY_DOMAIN`, `DAILY_API_KEY`, `DAILY_WEBHOOK_SECRET`
- Stripe: `STRIPE_SECRET_KEY` (sk_test), `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` (pk_test), `STRIPE_WEBHOOK_SECRET`, `NEXT_PUBLIC_STRIPE_PRICE_STARTER/PRO/WHITELABEL`
- `NEXT_PUBLIC_APP_URL=https://elevatelearning-nine.vercel.app`

**REGEL: secrets ALLEEN in `.env.local` + Vercel, NOOIT in `.env.example`** (die staat in git via `!.env.example`-exception). Bij het zetten van een key: assign aan de juiste var-naam, geen losse regels.

Concrete id's: Stripe price-ids — starter `price_1TdqDOJmeFMZgdY9FOMFgtl7`, pro `price_1TdqDPJmeFMZgdY9LcG802MW`, whitelabel `price_1TdqDPJmeFMZgdY9qLz1IbsZ`. Stripe-webhook endpoint `we_1TdqIBJmeFMZgdY9SdqVcNxC` → `/api/stripe/webhook`. Daily-webhook uuid `5118a8ca-9285-4d03-915f-f84e61902609` → `/api/daily/webhook`.

## 7. Build & deploy (workflow elke wijziging)
```
cd bijlesplatform
npm run build                  # verifieer (Next 16, geen type-fouten)
git add -A && git commit -m "..."   # commit-message eindigt met Co-Authored-By Claude
git push origin main
npx vercel --prod --yes        # deploy productie
```
Verifieer routes met curl op de live-URL. NEXT_PUBLIC_-vars zijn build-time →
na env-wijziging altijd opnieuw deployen.

## 8. Valkuilen / niet-vanzelfsprekend (BELANGRIJK)
- **Next.js 16:** `params` is async (await); React 19 heeft GEEN globale `JSX` (gebruik `ComponentType`); `ssr:false` dynamic alleen in client components; `cookies()` is async; middleware heet nu `proxy`. Zie `bijlesplatform/AGENTS.md` — lees `node_modules/next/dist/docs/` bij twijfel.
- **Excalidraw:** `convertToExcalidrawElements(..., { regenerateIds: false })` nodig, anders worden ids vervangen → paginakader-detectie faalt.
- **Daily:** geeft **400 (niet 409)** als een room al bestaat → in `/api/daily-room` eerst GET, dan pas POST (anders belandt 2e deelnemer in fallback-room). Video vereist creditcard op Daily-account (toegevoegd).
- **Stripe meet WÉL maar BLOKKEERT NIET** → gating doet de app op `usage_ledger` via `my_usage()` (zacht 80%/hard 100%).
- **Safety-classifier blokkeert**: Supabase-gebruikers verwijderen, OTP-mails sturen, en Supabase auth-config wijzigen zonder PAT → die acties moet de GEBRUIKER in het dashboard doen.
- **Geen Supabase Management-token (PAT) meer** (verwijderd na gebruik). Auth-config (Site URL, SMTP, templates) staat al goed ingesteld; nieuwe wijzigingen → gebruiker doet het of levert nieuwe PAT.
- **Werkt-zonder-keys/zonder-migratie patroon:** code degradeert netjes (localStorage-fallback, "niet gekoppeld"-meldingen) i.p.v. crashen.

## 9. Wat de gebruiker nog moet doen (handmatig)
- **Betaalflow testen:** login → `/prijzen` → Pro kiezen → Stripe Checkout met testkaart `4242 4242 4242 4242` → terug op dashboard → plan + meter verschijnen.
- **Customer Portal activeren** in Stripe (Settings → Billing → Customer portal → Save) als `/api/portal` een fout geeft.
- **Metering verifiëren:** een echte les draaien (ingelogd), afsluiten, dan meter checken (Daily `meeting.ended` → usage_ledger).
- Optioneel: oude Supabase-PAT intrekken, Resend-domein verifiëren (e-mail aan iedereen), Vercel-domeinen koppelen voor Djelian/Xiomara.

## 10. Wat is gepland (volgende fases — zie docs/ROADMAP.md)
- **Fase 5 — Docent-dashboard afronden:** leerling-roster + CRM (voortgangsnotities, contactgeschiedenis), lessenhistorie, aanwezigheid, uren/verbruik-stats. (Nieuwe tabellen: `students`, evt. `lesson_attendance`.)
- **Fase 6 — UI/UX premium-overhaul:** design system (shadcn/ui + Tailwind + Radix), Revolut-blauw, WCAG 2.2 AA (grote type/contrast/focus voor oudere docenten), multi-step onboarding, mobile-first, vertrouwen-signalen.
- **Fase 7 — Booking & rooster:** beschikbaarheids-model + boekingsflow + herinneringen (Resend).
- **Fase 8 — AVG/GDPR:** Voorwaarden/Privacy/cookiebanner/DPA, minderjarigen (NL 16).
- **Fase 9 — Opdrachten & Voortgang (Xiomara):** vraag-antwoord-game + voortgang, gated op `organizations.features.assignments`. Tabellen `assignments/questions/submissions/answers` (zie SAAS-ARCHITECTURE.md).
- **Fase 10 — Admin-panel.**

**Aanbevolen volgorde:** de gebruiker noemde **dashboard afronden + UI/UX fix** als prioriteit. Mijn advies: **Fase 6 (UI/UX) eerst** zodat Fase 5-dashboard meteen in de premium stijl wordt gebouwd (niet dubbel). De gebruiker had de definitieve keuze nog niet gemaakt toen deze chat eindigde — vraag dit als eerste in de nieuwe chat.

## 11. Eerste actie in de nieuwe chat
Lees dit bestand + `MEMORY.md`-index (saas-direction, daily-cost-protection,
bijlesplatform-stack). Vraag de gebruiker of de betaalflow getest is en met
welke fase (6 UI/UX of 5 dashboard) we doorgaan.
