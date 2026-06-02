# Roadmap — Bijlesplatform SaaS

Status van de bouw, plus de uitgebreide fases op basis van
`completesaasclaude.md` (gekozen blueprint) en `completesaasgemini.md`.

## ✅ Afgerond

| Fase | Wat | Status |
|---|---|---|
| MVP | Live klas: Excalidraw-whiteboard (multi-bord + pagina's + wiskunde-toetsenbord), Daily-video (eigen room/les + kostenbescherming), chat | ✅ |
| Auth | E-mail + wachtwoord (invite-gated), Supabase Auth + RLS | ✅ |
| 1 | Tenant-fundament: organizations + org_members + RLS + auto-tenant | ✅ |
| 2 | Whiteboards in Supabase per tenant | ✅ |
| 3 | White-label: branding + eigen domeinen | ✅ |
| 4a | Stripe-abonnementen: checkout (iDEAL+kaart), Customer Portal, webhook → plan/features, minuten-meter | ✅ |
| 4b | Minuten-metering (Daily-webhook → usage_ledger) + blokkering (zacht 80% / hard 100%) | ✅ |

## 🔜 Te doen

| Fase | Wat | Waarom |
|---|---|---|
| **5. Docent-dashboard afronden** | Leerling-roster + CRM (voortgangsnotities, contactgeschiedenis), lessenhistorie (komend/afgelopen), aanwezigheid afvinken, verbruik/uren-stats | Het dashboard is "de werkruimte" van de docent; nu nog basis |
| **6. UI/UX premium-overhaul** | Design system (shadcn/ui + Tailwind + Radix), Revolut-blauw, WCAG 2.2 AA voor oudere docenten, multi-step onboarding-wizard, mobile-first, vertrouwen-signalen | Premium uitstraling = conversie + autoriteit |
| **7. Booking & rooster** | Eigen beschikbaarheids-model (regels + slots, tijdzone), boekingsflow, bevestigingen/herinneringen via Resend | Roostering is het hart van de student-ervaring |
| **8. AVG/GDPR + juridisch** | Voorwaarden, Privacy/AVG, cookiebanner, DPA-template, EU-hosting, minderjarigen (NL-leeftijd 16) | Verplicht vóór commercieel |
| **9. Opdrachten & Voortgang (Xiomara)** | Vraag-antwoord-game voor leerlingen + voortgang voor docent. Module gated op `features.assignments` | Concrete klantwens; bewijst het modulaire white-label-model |
| **10. Admin-panel** | Beheer docenten/leerlingen, verbruik, refunds, impersonatie | Operatie & support |

## Losse to-do's
- **Resend-domein** verifiëren (e-mail aan iedereen i.p.v. alleen eigen adres).
- **Vercel-domeinen** koppelen voor Djelian/Xiomara zodra ze een domein hebben.
- **Customer Portal** 1× activeren in Stripe (Settings → Billing).
- Optioneel: **Stripe Meters** voor overage-facturatie i.p.v. harde blokkade.

## Aanbevolen volgorde
De gebruiker noemde **docent-dashboard afronden** + **UI/UX fix** als prioriteit
→ Fase 5 en 6 eerst. Daarna 9 (Xiomara's module, concrete klant) en 7/8
richting commerciële lancering.
