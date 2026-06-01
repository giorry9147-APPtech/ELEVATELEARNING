# SaaS-architectuur — Bijlesplatform (multi-tenant)

> Ontwerpdocument. Beschrijft hoe het platform van een gratis demo naar een
> multi-tenant SaaS gaat, inclusief white-label klanten (Djelian, Xiomara) en
> aan/uit te zetten feature-modules (bijv. Xiomara's opdrachten + voortgang).

## 1. Kernidee: multi-tenancy

Eén codebase, één deployment, **veel tenants** (organisaties). Een tenant =
een docent of bijlesbureau met zijn eigen geïsoleerde omgeving. We bouwen
**geen website per klant** — een "eigen omgeving" is data, geen aparte app.

```
Organization (tenant)        ← "Xiomara", "Djelian", "Losse docent Jan"
 ├── leden (users + rol)      owner / teacher / assistant / student
 ├── leerlingen (students)
 ├── lessen + sessies (rooms)
 ├── lesmateriaal (boards/pagina's)
 ├── branding (logo, kleuren)
 ├── domein(en)               xiomara.nl → deze tenant
 ├── features (modules aan/uit)
 ├── abonnement (Stripe)
 └── verbruik (videominuten/maand)
```

Djelian & Xiomara zijn **white-label tenants**: zelfde motor, eigen domein +
huisstijl + (voor Xiomara) de opdrachten-module aan. Geen fork.

## 2. Datamodel (Supabase / Postgres)

Bestaande tabellen (`profiles`, `invites`, `sessions`) blijven; we voegen het
tenant-fundament toe en hangen alles aan `org_id`.

```sql
-- Tenants
organizations (
  id uuid pk,
  slug text unique,            -- "xiomara"
  name text,
  owner_id uuid → auth.users,
  plan text default 'free',    -- free | pro | whitelabel
  features jsonb default '{}', -- { "assignments": true, "recording": false }
  created_at timestamptz
)

-- Wie hoort bij welke tenant + met welke rol
org_members (
  org_id uuid → organizations,
  user_id uuid → auth.users,
  role text,                   -- owner | teacher | assistant | student
  primary key (org_id, user_id)
)

-- Huisstijl (white-label)
org_branding (
  org_id uuid pk → organizations,
  logo_url text, primary_color text, accent_color text,
  tagline text
)

-- Custom domeinen → tenant
org_domains (
  id uuid pk,
  org_id uuid → organizations,
  hostname text unique,        -- "xiomara.nl"
  verified boolean default false
)

-- Leerlingen (persistente identiteit binnen een tenant)
students (
  id uuid pk,
  org_id uuid → organizations,
  name text,
  email text,                  -- optioneel
  user_id uuid → auth.users,   -- optioneel: als de leerling inlogt
  created_at timestamptz
)

-- Abonnement (Stripe)
subscriptions (
  org_id uuid pk → organizations,
  stripe_customer_id text,
  stripe_subscription_id text,
  status text,                 -- active | past_due | canceled
  plan text,
  current_period_end timestamptz,
  minutes_included int         -- bv. 2000
)

-- Verbruik per maand (metering)
usage_counters (
  org_id uuid → organizations,
  period text,                 -- "2026-06"
  video_minutes numeric default 0,
  primary key (org_id, period)
)
```

Bestaande `sessions` krijgt `org_id`. Lesmateriaal verhuist van localStorage
naar de DB:

```sql
boards (
  id uuid pk,
  org_id uuid → organizations,
  session_id uuid → sessions,  -- of null = herbruikbaar lesmateriaal
  name text,                   -- "Hoofdstuk 1"
  scene jsonb,                 -- Excalidraw-elementen (incl. pagina-kaders)
  position int,
  updated_at timestamptz
)
```

### Module: Opdrachten & voortgang (Xiomara)

Apart, alleen actief als `organizations.features.assignments = true`.

```sql
assignments (
  id uuid pk, org_id uuid, title text, description text,
  created_by uuid → auth.users, created_at timestamptz
)
questions (
  id uuid pk, assignment_id uuid → assignments,
  type text,                   -- multiple_choice | open | true_false
  prompt text, options jsonb, correct jsonb, position int
)
submissions (
  id uuid pk, assignment_id uuid → assignments, student_id uuid → students,
  started_at timestamptz, completed_at timestamptz, score numeric
)
answers (
  id uuid pk, submission_id uuid → submissions, question_id uuid → questions,
  response jsonb, is_correct boolean
)
```

Voortgang voor de docent = aggregatie over `submissions` (per leerling: % af,
score, laatste activiteit). Het "vraag-en-antwoord-spel" voor de leerling =
een UI bovenop `questions` + `answers`.

## 3. Tenant-isolatie (RLS)

Elke tenant-tabel heeft `org_id`. Een helper bepaalt de tenants van de
ingelogde gebruiker:

```sql
create function user_org_ids() returns setof uuid
language sql security definer stable as $$
  select org_id from org_members where user_id = auth.uid()
$$;
```

Policies volgen het patroon:

```sql
-- lezen/schrijven alleen binnen je eigen tenant(s)
create policy "tenant lezen" on boards
  for select using (org_id in (select user_org_ids()));
create policy "docent beheert" on boards
  for all using (
    org_id in (select org_id from org_members
               where user_id = auth.uid() and role in ('owner','teacher'))
  );
```

Leerlingen krijgen smallere policies (alleen eigen `submissions`/`answers`).

## 4. Domein → tenant routing

Vercel ondersteunt meerdere domeinen op één project. Resolutie gebeurt in
Next.js **proxy** (Next 16; voorheen `middleware`):

1. Lees de hostnaam van het verzoek (`xiomara.nl`, of `xiomara.platform.nl`).
2. Zoek de tenant: `org_domains.hostname` → `org_id` (gecached).
3. Laad branding + features van die tenant en injecteer als context.
4. App rendert met het juiste logo/kleuren en de juiste modules.

```
xiomara.nl          → proxy → org "xiomara"  → branding + assignments-module
djelian.nl          → proxy → org "djelian"  → branding, geen extra modules
app.platform.nl/... → standaard self-serve signup (nieuwe tenants)
```

- **Subdomeinen** (`naam.platform.nl`): wildcard-domein op Vercel.
- **Eigen domein** (`xiomara.nl`): klant zet CNAME → Vercel, wij voegen het
  domein toe + rij in `org_domains`.

## 5. Rollen

| Rol | Mag |
|---|---|
| **owner** | alles in de tenant + facturatie + leden beheren |
| **teacher** | lessen, leerlingen, materiaal, opdrachten |
| **assistant** | lesgeven, beperkt beheer |
| **student** | deelnemen aan lessen, opdrachten maken, eigen voortgang |

Leerlingen joinen de klas nog steeds via een **link zonder account**. Voor de
opdrachten-module krijgen ze een lichte identiteit (naam + optioneel e-mail/
inlog) zodat voortgang persistent is.

## 6. Abonnementen & minuten-metering

- **Stripe Billing**, één klant + abonnement per tenant. Stripe ondersteunt
  ook iDEAL, plus Stripe Tax (BTW) en een klant-portaal.
- Tiers (voorstel):
  - **Free** — beperkte minuten, 1 docent, basis
  - **Pro €29/mnd** — 2000 videominuten, onbeperkt leerlingen
  - **White-label** — eigen domein + huisstijl + modules (Djelian/Xiomara)
- **Webhooks** (`checkout.session.completed`, `customer.subscription.updated`)
  → werk `subscriptions` + `organizations.features`/`plan` bij.
- **Metering videominuten:** bij sessie-einde (Daily room-`exp` /
  meeting-webhook) tellen we participant-minuten op in `usage_counters`. Vóór
  het starten van een sessie checken we `video_minutes < minutes_included`;
  bij de grens waarschuwen of blokkeren. De bestaande room-`exp`/auto-eject is
  hiervan de eerste bouwsteen.

## 7. Migratie van de huidige staat

1. Bij signup van een docent → automatisch een `organization` + `org_members`
   (role owner) aanmaken (DB-trigger of server-action).
2. `sessions` krijgt `org_id` (default = org van de maker).
3. Borden/pagina's: van localStorage → `boards` (org-scoped, per sessie).
4. Bestaande feature-flags (`config.ts`) blijven voor infra; tenant-features
   komen uit `organizations.features`.

## 8. Gefaseerde bouw

```
Fase 1 — Tenant-fundament
  organizations + org_members + RLS + auto-org-bij-signup
  sessions org-scopen; docent-dashboard per tenant
Fase 2 — Lesmateriaal in DB
  boards/pagina's → Supabase (org-scoped); terug op elk apparaat
Fase 3 — White-label
  org_branding + org_domains + proxy-routing (Djelian/Xiomara live op domein)
Fase 4 — Billing
  Stripe abonnementen + tiers + feature-gating + minuten-metering
Fase 5 — Modules
  module-systeem (features-flags) + Opdrachten & Voortgang (Xiomara)
```

Elke fase is los te deployen; het platform blijft tussendoor werkend.
