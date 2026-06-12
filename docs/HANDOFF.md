# Overdracht / Handoff — Bijlesplatform SaaS

> Voor een nieuwe chat-sessie. Beschrijft de volledige staat, locaties,
> beslissingen, valkuilen en wat er nog moet gebeuren. Lees ook de
> memory-bestanden (`MEMORY.md`-index) en `docs/ROADMAP.md`,
> `docs/SAAS-ARCHITECTURE.md`, `docs/KOSTEN-PRIJZEN.md`, `docs/VIDEO-KEUZE.md`,
> `docs/MARKTANALYSE.md` (concurrentie + go-to-market + geprioriteerde fases).

## 1. Wat is dit
Multi-tenant **SaaS bijlesplatform**: docenten nemen een abonnement (€0/€19/€39/€129),
geven online les (video + collaboratief whiteboard + chat) aan hun leerlingen.
White-label klanten (Djelian, Xiomara) krijgen eigen domein + huisstijl op
**dezelfde codebase**. Xiomara wil later een opdrachten/voortgang-module
(per-tenant feature-flag, geen aparte site).

**STATUS: het platform is COMMERCIEEL LIVE** — docenten kunnen zich aanmelden
(invite-gated), abonneren via Stripe (iDEAL/kaart, echte betalingen), lesgeven
met minuten-metering + blokkering, en white-label draaien. **Volledig afvink-overzicht
(gedaan / nog te doen): zie sectie 10.**

**Belangrijke wijzigingen sinds go-live (jun 2026):**
- **Huisstijl = GROEN** (niet meer Revolut-blauw). `--brand` = groen `#15803d`; premium
  lichtgroene hero met **bewegende school-objecten**, **zwevende navbar-pill**, lettertype
  **Plus Jakarta Sans**, eigen **logo** (`LogoMark` — vulpen uit open boek, SVG). Design system
  in `src/components/ui/`, tokens + `.hero-green`/`.btn-green`/`.app-surface`/`.app-header` in
  `globals.css`. Fase 6 = KLAAR (alle pagina's + klas-panelen + onboarding `/welkom`).
- **Fase 5 (CRM + tarieven + Stripe Connect)** = KLAAR & live (Connect-onboarding werkt echt).
- **Fase 7 (booking & rooster + boeken-en-betalen)** = KLAAR.
- **AI-laag (huiswerkmaatje)** = KLAAR (key nodig, zie sectie 9).
- **LET OP — branch:** al dit werk staat op **feature-branch `fase5-6-groen-crm-connect`** en is
  via `vercel --prod` naar productie gedeployed, **MAAR de PR naar `main` is nog NIET gemerged**
  → `main` op GitHub loopt achter op productie. PR mergen via de GitHub-UI (branch
  `fase5-6-groen-crm-connect` → `main`).

## 2. Locaties & toegang
- **App-code:** `/Users/cornerstonetech/Desktop/WHITEBOARD/bijlesplatform/` (= repo-root)
- **GitHub:** `github.com/giorry9147-APPtech/ELEVATELEARNING`, branch `main`
- **Live:** https://elevatelearning-nine.vercel.app
- **Vercel:** project `elevatelearning` (account `giorry9147-apptech`). **Vercel CLI is lokaal ingelogd** → `npx vercel --prod --yes` om te deployen, `npx vercel env add NAME production` voor env.
- **Supabase:** project ref `sjnvkqvtsvbcwixhrqam`, URL `https://sjnvkqvtsvbcwixhrqam.supabase.co`
- **Stripe:** **PRODUCTIE = LIVE** (live account `acct_1TdpuSJM88sopuxU`, charges_enabled=True). Lokaal + Vercel-development gebruiken **test** (account `acct_1TdpucJmeFMZgdY9`). Let op: dit zijn twee aparte Stripe-accounts; productie is intern consistent (live keys + live price-id's + live webhook).
- **Bedrijf (juridisch):** Cornerstone Tech · KvK 91058732 · btw NL004862218B12 · Röntgenweg 183, 2624 BD Delft · info@cornerstonetech.nl · +31 6 82955157 — in `src/lib/legal.ts`.

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
- **Fase 8 — AVG/juridisch:** pagina's `/privacy`, `/voorwaarden`, `/cookies` (component `LegalShell`), cookiebanner (`CookieBanner`, alleen essentiële cookies) in layout, footer-links op de landing. Bedrijfsgegevens centraal in `src/lib/legal.ts` (Cornerstone Tech, ingevuld). Voorwaarden bevatten softwareleverancier-clausule (docent verantwoordelijk voor de les). LET OP: teksten zijn een sjabloon — gebruiker laat ze nog door een jurist nakijken.
- **GO-LIVE (Stripe productie):** live producten/prijzen + live webhook aangemaakt in het live-account; Vercel-productie draait op live keys; `.env.local` blijft test. Account is geactiveerd (charges_enabled). Echte betalingen werken.

### 4b. Code-kaart van het nieuwe werk (Fase 5/6/7 + AI) — waar staat wat
> Alles hieronder staat op branch `fase5-6-groen-crm-connect` (live in productie, `main` nog niet gemerged).

**Fase 6 — groene design system** (`src/components/ui/`): `cn`, `Button`(+`buttonClasses`), `Card`(+`GlassCard`, `as`-prop), `Input`/`Label`/`Textarea`, `Badge`, `Container`/`SectionHeading`(`tone`), `icons` (school-line-iconen), `SkyBackdrop`(`variant` pale|vivid|green + `objects`)/`Clouds`, `FloatingObjects` (zwevende emoji), `ClassroomPreview` (product-mock), `Logo` (`LogoMark`, SVG-merklogo). Tokens + `.hero-green`/`.btn-green`/`.app-surface`/`.app-header`/`.floaty` in `globals.css`. Lettertype Plus Jakarta Sans in `layout.tsx` (`--font-jakarta`). `BrandMark` (in `BrandingProvider`) toont `LogoMark`, met `tone="light"` voor donkere achtergrond. `LandingNav` heeft `onDark`/`accent`-props.

**Fase 5 — CRM:** routes `/leerlingen` (`Students.tsx`) + `/leerlingen/[id]` (`StudentDetail.tsx`). Lib `src/lib/students.ts` (students + student_notes) en `src/lib/lessons.ts` (lesson_attendance: koppelen/aanwezigheid/stats + `startLessonForStudent`). Migraties 005 + 006.

**Fase 5 — tarieven + Stripe Connect:** route `/tarieven` (`Packages.tsx`). Lib `src/lib/packages.ts` (lesson_packages + purchases). Publiek `/betalen/[orgId]` (`PayShop.tsx`) → `/betaald` (`PaymentResult.tsx`). API: `/api/connect/onboard`+`/status`+`/webhook`, `/api/packages/checkout`+`/finalize`. **Connect-helper in `src/lib/stripe/server.ts`:** `stripeIsLive` (op key-prefix) + `CONNECT_ACCOUNT_COL` (= `stripe_account_id` in live, `stripe_account_id_test` in test) — test/live-accounts worden gescheiden bewaard (migratie 009), en `onboard` maakt automatisch een nieuw account als het opgeslagen ID niet in de huidige modus bestaat. Migraties 007 + 008 + 009.

**Fase 7 — booking:** route `/rooster` (`Schedule.tsx`, docent) + publiek `/boeken/[orgId]` (`BookingFlow.tsx`). Lib `src/lib/booking.ts` (availability/bookings/prijs) + `src/lib/slots.ts` (PURE slot-generatie, **lokale tijdzone → client-side berekenen**, NL-aanname). API: `/api/bookings/create` (gratis) + `/api/bookings/checkout` (boeken+betalen via Connect). Migraties 010 + 011.

**AI-laag:** route `/ai` (`AiTutor.tsx`). Lib `src/lib/ai.ts` (server-only: Claude-client + NL-systeemprompts). API: `/api/ai/chat` (streaming) + `/api/ai/tools` (samenvatting/oefenvragen). Dependency **`@anthropic-ai/sdk`** toegevoegd (uitzondering op "geen extra deps").

**Werkruimte-pagina's** (dashboard/leerlingen/rooster/tarieven/settings/ai) gebruiken `.app-surface` + `.app-header` (glas-sticky). Dashboard-header linkt naar Leerlingen/Rooster/Tarieven/AI-maatje/Instellingen.

## 5. Database-migraties (Supabase SQL Editor, in volgorde, idempotent)
`supabase/schema.sql` (basis: profiles/invites/sessions) → `001_tenants.sql` →
`002_whiteboards.sql` → `003_branding.sql` → `004_billing.sql` → `005_students.sql`
→ `006_lesson_attendance.sql` → `007_packages.sql` → `008_connect.sql`
→ `009_connect_test.sql` → `010_bookings.sql` → `011_booking_payment.sql`.
**Status: 001–004 + schema zijn gedraaid. NIEUW, in volgorde door de GEBRUIKER te draaien:
`005_students.sql` (CRM), `006_lesson_attendance.sql` (lessen↔leerlingen), `007_packages.sql`
(pakketbouwer), `008_connect.sql` (Stripe Connect), `009_connect_test.sql` (stripe_account_id_test
voor test/live-scheiding — anders werkt Connect lokaal niet), `010_bookings.sql` (Fase 7:
availability + bookings + lesson_minutes op organizations) en `011_booking_payment.sql`
(boeken+betalen: booking_price_cents op organizations + stripe_session_id op bookings).** Tot dan tonen de bijbehorende
pagina's netjes "nog niet geactiveerd"/leeg (werkt-zonder-migratie).
Nieuwe migraties: maak `012_*.sql` etc. en laat de GEBRUIKER ze draaien (ik heb
geen Supabase Management-token meer).

**Stripe Connect (Fase 5 — leerlingen betalen docent):** Express-accounts, DIRECTE charges
op het docent-account (geld op zijn rekening, docent draagt Stripe-kosten, **0% platform-fee**).
LIVE Connect is door de gebruiker afgerond (platformprofiel + onboarding); echte leerlingbetaling
werkt. **Test/live-accounts gescheiden** (`stripe_account_id` = live, `stripe_account_id_test` =
test; migratie 009 + `CONNECT_ACCOUNT_COL` in `lib/stripe/server.ts`), met zelfherstel als een
opgeslagen account niet in de huidige modus bestaat. Aankopen worden afgerond bij terugkeer
(`/api/packages/finalize` → `/betaald`) ÉN robuust via de **Connect-webhook** `/api/connect/webhook`
(checkout.session.completed + async iDEAL) — die bevestigt zowel pakket-aankopen als boekingen.
**GEBRUIKER MOET NOG: `STRIPE_CONNECT_WEBHOOK_SECRET` in Vercel zetten + de Connect-webhook in
Stripe aanmaken ("Events on connected accounts")** — zie sectie 9. Zonder webhook werkt betalen
nog steeds via de terugkeerpagina.

## 6. Keys & secrets (waar ze staan)
Alles staat in `bijlesplatform/.env.local` (**gitignored**) én in **Vercel** (production+development):
- Supabase: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` (anon JWT), `SUPABASE_SERVICE_ROLE_KEY` (= `sb_secret_...`)
- Daily: `NEXT_PUBLIC_DAILY_ROOM_URL` (`https://bijlesplatform.daily.co/Demo_bijles`), `NEXT_PUBLIC_DAILY_DOMAIN`, `DAILY_API_KEY`, `DAILY_WEBHOOK_SECRET`
- Stripe: `STRIPE_SECRET_KEY`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`, `STRIPE_WEBHOOK_SECRET`, `NEXT_PUBLIC_STRIPE_PRICE_STARTER/PRO/WHITELABEL`. **Vercel-PRODUCTIE = LIVE-waarden; Vercel-development + `.env.local` = TEST-waarden.** (Zo maak je lokaal nooit echte kosten.)
- **Stripe Connect:** `STRIPE_CONNECT_WEBHOOK_SECRET` (aparte webhook-secret voor "Connected accounts"-events; voor leerlingbetalingen). **Nog NIET gezet — zie sectie 9.**
- **AI (Claude):** `ANTHROPIC_API_KEY` (verplicht voor de AI-laag; zonder = uitgeschakeld), optioneel `ANTHROPIC_MODEL` (default `claude-opus-4-8`; bv. `claude-haiku-4-5` voor lagere kosten). **Nog NIET gezet — zie sectie 9.**
- `NEXT_PUBLIC_APP_URL=https://elevatelearning-nine.vercel.app` (de Connect/booking-redirects vallen hierop terug, maar gebruiken normaal de request-origin — werkt lokaal én prod).

**REGEL: secrets ALLEEN in `.env.local` + Vercel, NOOIT in `.env.example`** (die staat in git via `!.env.example`-exception). Bij het zetten van een key: assign aan de juiste var-naam, geen losse regels. **Live secrets nooit naar een /tmp-bestand schrijven** (classifier blokkeert dat terecht) — doe key-operaties in één shell-invocatie met de waarde in een variabele/stdin.

Concrete id's:
- **Stripe TEST** (lokaal/dev): price-ids starter `price_1TdqDOJmeFMZgdY9FOMFgtl7`, pro `price_1TdqDPJmeFMZgdY9LcG802MW`, whitelabel `price_1TdqDPJmeFMZgdY9qLz1IbsZ`; webhook `we_1TdqIBJmeFMZgdY9SdqVcNxC`.
- **Stripe LIVE** (productie): price-ids starter `price_1TdrbGJM88sopuxUuxqUXQJ0`, pro `price_1TdrbHJM88sopuxUwtGA2vaP`, whitelabel `price_1TdrbHJM88sopuxU54vt3RQ8`; live webhook-endpoint apart aangemaakt op dezelfde URL.
- Daily-webhook uuid `5118a8ca-9285-4d03-915f-f84e61902609` → `/api/daily/webhook`.

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
**Nieuw / openstaand (jun 2026):**
- 🔑 **`ANTHROPIC_API_KEY`** zetten (console.anthropic.com) in **`.env.local`** + **Vercel**
  (production+development) → anders toont de AI-laag "nog niet geactiveerd". Optioneel
  `ANTHROPIC_MODEL=claude-haiku-4-5` voor lagere kosten.
- 🔑 **`STRIPE_CONNECT_WEBHOOK_SECRET`** zetten in Vercel (production) + Connect-webhook aanmaken
  in Stripe (Developers → Webhooks → endpoint `…/api/connect/webhook`, **"Events on connected
  accounts"**, events `checkout.session.completed` + `async_payment_succeeded` + `_failed`).
  Zonder dit blijven betalingen werken via de terugkeerpagina, maar de webhook is robuuster.
- 🧬 **Migraties draaien**: 005–008 zijn gedraaid; **controleer/draai nog `009_connect_test.sql`,
  `010_bookings.sql`, `011_booking_payment.sql`** in de Supabase SQL-editor (zie sectie 5).
- 🔀 **PR mergen** naar `main` (branch `fase5-6-groen-crm-connect`) — productie draait er al op,
  maar `main` loopt achter.
- ✅ Stripe Connect (LIVE) is door de gebruiker afgerond (platformprofiel + onboarding); echte
  leerlingbetaling werkt.

**Eerder afgerond:**
- ✅ Betaalflow in TEST is getest en werkt (bevestigd door gebruiker).
- ✅ Customer Portal in LIVE-mode geactiveerd (bevestigd door gebruiker, jun 2026). `/api/portal` werkt in productie.
- **Stripe-activatie helemaal afronden** als er nog stappen open staan (bank/verificatiedocument).
- **Live betaalflow verifiëren** (optioneel, met echt geld): zelf Starter €19 nemen → plan+meter checken → daarna opzeggen/terugbetalen.
- **Metering verifiëren:** een echte les draaien (ingelogd), afsluiten, dan meter checken (Daily `meeting.ended` → usage_ledger).
- **Juridische teksten** door een jurist laten nakijken (sjabloon).
- Optioneel: oude Supabase-PAT intrekken, Resend-domein verifiëren (e-mail aan iedereen), Vercel-domeinen koppelen voor Djelian/Xiomara.

## 10. Afvink-overzicht — gedaan / nog te doen (jun 2026)

### ✅ Gedaan (live in productie)
- ✅ **MVP klas** (whiteboard + video + chat), **Auth** (invite-gated), **Fase 1-3** (tenants,
  whiteboards-in-DB, white-label branding), **Fase 4a/4b** (abonnementen + minuten-metering),
  **Fase 8** (AVG: privacy/voorwaarden/cookies + cookiebanner).
- ✅ **Fase 6 — UI/UX premium-overhaul** → **GROENE huisstijl** (niet blauw): design system,
  hero met bewegende objecten, navbar-pill, Plus Jakarta Sans, eigen logo, onboarding-wizard
  `/welkom`. Alle pagina's + klas-panelen om.
- ✅ **Fase 5 — Docent-dashboard/CRM:** `/leerlingen` roster + CRM (voortgangsnotities,
  contactmomenten), lessen↔leerlingen + aanwezigheid, verbruik/stats; **prijs-/pakketbouwer**
  `/tarieven`; **Stripe Connect** (leerlingen betalen docent direct, 0% fee) — onboarding werkt.
- ✅ **Fase 7 — Booking & rooster:** `/rooster` (wekelijkse beschikbaarheid + lesduur),
  publieke `/boeken/[orgId]` (slot kiezen → leslink), én **boeken+betalen** (prijs per les →
  Connect-checkout). Migraties 010 + 011.
- ✅ **AI-laag (huiswerkmaatje):** `/ai` — Socratische NL-chat (streaming) + samenvatting/
  oefenvragen uit lesstof. Claude (`@anthropic-ai/sdk`, opus-4-8). **Key nodig (sectie 9).**
- ✅ **Connect-webhook** (`/api/connect/webhook`) — code gebouwd (idempotent, async iDEAL),
  bevestigt pakket-aankopen én boekingen. **Secret nog niet in Vercel → nog niet actief, zie sectie 9.**

### ❌ Nog NIET gedaan
- ❌ **Resend (e-mail)** — **NIET geactiveerd. Er worden NERGENS e-mails verstuurd**: geen
  boekings-/betaal-bevestigingen, geen herinneringen, geen uitnodigingen. `RESEND_API_KEY`
  ontbreekt. Eerste logische gebruik: bevestiging + herinnering bij een boeking (Fase 7).
- ❌ **Lesopname (Daily-recording)** — niet gebouwd. Daily ondersteunt het; laaghangend fruit
  voor Pro/white-label (concurrenten vragen er geld voor).
- 🟡 **White-label eigen domein "wrijvingsloos"** — DEELS: branding + `org_domains` + proxy-routing
  bestaan, maar het **vlot koppelen van een eigen domein** (Vercel-domein via CLI + DNS-instructie
  voor de klant) is nog niet productieklaar gemaakt. Je €129-troef.
- ❌ **Fase 9 — Opdrachten & Voortgang (Xiomara)** — quiz/voortgang-module, gated op
  `organizations.features.assignments`. Tabellen `assignments/questions/submissions/answers`
  (zie SAAS-ARCHITECTURE.md). Niet gebouwd.
- ❌ **AI — transcriptie/les-samenvatting uit de échte les** (audio/whiteboard) — alleen de
  chat + samenvatting-uit-geplakte-tekst is er; transcriptie van de video/les niet.
- ❌ **Fase 10 — Admin-panel** — beheer docenten/leerlingen, verbruik, refunds. Niet gebouwd.

**Go-to-market (Benelux-first, zie MARKTANALYSE.md):** positioneer als "het Nederlandse,
AVG-proof digitale klaslokaal (eigen merk + domein, iDEAL, vanaf €19)". **Caveat:** "uniek met
iDEAL/AVG" is niet bewezen — niet claimen zonder per-concurrent verificatie.

## 11. Eerste actie in de nieuwe chat
Lees dit bestand (vooral het afvink-overzicht in sectie 10) + `MEMORY.md`-index. Voer eerst
de openstaande gebruikersacties uit sectie 9 uit (o.a. `ANTHROPIC_API_KEY` + Connect-webhook-secret
in Vercel, PR mergen). Logische volgende bouwfases: **Resend-mails** (boekingsbevestiging/herinnering),
**lesopname (Daily-recording)**, **white-label eigen domein afmaken**, of **admin-panel (Fase 10)**.
