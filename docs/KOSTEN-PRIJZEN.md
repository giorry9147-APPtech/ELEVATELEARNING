# Kosten & prijzen — Bijlesplatform SaaS

> Berekening van maandlasten en voorgestelde abonnementen. Prijzen 2026.
> Daily/Vercel/Supabase rekenen in USD; hier ≈ $1 = €0,92.

## 1. Vaste maandlasten (vóór video-gebruik)

| Dienst | Plan | Kosten/mnd | Waarom |
|---|---|---|---|
| Vercel | Pro | $20 (~€18) | Verplicht zodra commercieel (Hobby = niet-commercieel) |
| Supabase | Pro | $25 (~€23) | Geen pauzeren, dagelijkse backups, 8GB db, 100k MAU |
| Resend | Free | €0 | 3.000 mails/mnd gratis; pas €20 bij ~50k mails |
| Domeinen | — | ~€2-4 | jouwplatform.nl + djelian.nl + xiomara.nl (~€10/jr elk) |
| Sentry/monitoring | Free | €0 | Gratis tier volstaat; later ~€25 |
| **Vaste basis** | | **≈ €45/mnd** | |

## 2. Variabele kosten: Daily video (grootste COGS)

- Gratis: **10.000 participant-minuten/maand**, daarna **$0,004/participant-min**.
- 1-op-1 les = 2 deelnemers → **per lesuur ≈ $0,48 (€0,44)** ná de gratis laag.
- Video-kost ≈ **€0,008 per lesminuut** (1-op-1). Groepsles verbruikt sneller.
- Opname (optioneel): +$0,0135/min (~€0,75 per opgenomen lesuur).

## 3. Wat je écht per maand betaalt — 3 scenario's

| Scenario | Lessen/mnd (1u) | Participant-min | Video-kost | Totaal/mnd |
|---|---|---|---|---|
| Start (3 docenten) | ~80 | 9.600 | €0 (binnen gratis) | **≈ €45** |
| Groei (10 docenten) | ~200 | 24.000 | ~€52 | **≈ €100** |
| Schaal (30 docenten) | ~600 | 72.000 | ~€230 | **≈ €275** |

In de startfase betaal je ~**€45/mnd** totaal — video is dan nog gratis.

## 4. Voorgestelde pakketten

Strategie: redelijke inbegrepen minuten + goedkope overage (jij betaalt
€0,008/min, rekent €0,01–0,02 → 1,5–3× markup). De meeste gebruikers benutten
30–50% van hun minuten, dus de echte marge ligt hoger dan "bij max".

| Pakket | Prijs/mnd | Inbegrepen | Belangrijkste features | Video-COGS bij max | Marge bij max |
|---|---|---|---|---|---|
| Gratis (proef) | €0 | ~150 lesmin | 1 docent, basis, geen opname | ~€0 | acquisitie |
| Starter | €19 | 1.000 lesmin (~16u) | 1 docent, alle whiteboard-features, onbeperkt leerlingen | ~€8 | ~€11 |
| Pro | €39 | 3.000 lesmin (~50u) | + opname, prioriteit-support | ~€24 | ~€15 |
| White-label / Business | €129 | 6.000 lesmin (~100u) | + eigen domein + huisstijl + opdrachten/voortgang-module + 3 docenten | ~€48 | ~€80 |
| Overage | — | — | €0,02/min (Starter/Pro), €0,01/min (Business) | €0,008/min | gezond |

Djelian & Xiomara → **White-label €129** (eigen domein + Xiomara's module).

## 5. Wat verder meespeelt

- **Stripe-fees** (van omzet, geen vaste kost): ~1,5% + €0,25 per kaart, of
  iDEAL ~€0,29 vast. Op €39 ≈ €0,90.
- **BTW**: 21% rekenen en afdragen (admin; Stripe Tax helpt, ~0,5%).
- **Boekhouding**: ~€10–30/mnd overhead.

## 6. Break-even

Vaste basis (~€45) gedekt bij **3× Starter** of **1× White-label + 1× Starter**.
Daarna is alles boven de video-COGS marge.

## Samenvatting

Start ~**€45/mnd** all-in, schaalt mee met omzet. Pakketten
**€0 / €19 / €39 / €129** met overage dekken solo-tutors tot white-label klanten.

> Deze tiers worden de basis voor Fase 4 (Stripe Billing + feature-gating +
> minuten-metering).
