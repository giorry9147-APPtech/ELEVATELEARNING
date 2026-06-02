# Videoprovider — keuze & afwegingen

> Waarom we (voorlopig) op **Daily.co** blijven, en wanneer overstappen naar
> self-hosted **Jitsi** of **LiveKit** zinvol wordt. Video zit achter een
> abstractielaag (`VideoPanel` + `/api/daily-room`), dus wisselen is later een
> geïsoleerde klus — geen herbouw.

## Kostenrealiteit (Daily)

- Gratis: **10.000 participant-minuten/maand**, daarna **$0,004/participant-min**.
- 1-op-1 les van 1 uur = 2 × 60 = **120 participant-min**.
- Gratis laag ≈ **83 uur 1-op-1 les/maand**; daarna ~**$0,48 per lesuur**.
- Bij €29/mnd-abonnement is video dus een fractie van de marge.

## "Gratis" ≠ goedkoper voor je business

Jitsi is gratis qua licentie, maar:

| Nadeel van Jitsi | Impact |
|---|---|
| Publieke servers (meet.jit.si) niet voor commercieel embedden | Wisselende kwaliteit, geen garanties, ToS-risico |
| Zelf hosten = DevOps | Servers (JVB), TURN, schalen, updates, security, **on-call bij uitval tijdens een les** |
| Opname | Jitsi vereist **Jibri** (zwaar); Daily = 1 knop |
| Kwaliteit hangt aan jouw setup | Daily heeft wereldwijde geoptimaliseerde infra |
| Branding/embed | Daily Prebuilt embedt strak; Jitsi-UI aanpassen kost werk |
| Support | Bij self-host ben jij de support |

Je ruilt **een paar dollar/maand** voor **serveronderhoud + betrouwbaarheidsrisico
+ jouw tijd**. Voor een klein team dat snel een betrouwbaar SaaS wil: slechte ruil.

## Opties

| | Daily (nu) | Self-host Jitsi | LiveKit |
|---|---|---|---|
| Kosten | Per minuut (laag bij start) | "Gratis" + servers + jouw tijd | Self-host gratis / Cloud free tier |
| Opzet | ✅ Klaar | ⚠️ Veel DevOps | ⚠️ Middel (mooie SDK) |
| Betrouwbaarheid | ✅ Beheerd | Hangt aan jou | Goed (Cloud) |
| Beste voor | Snel + betrouwbaar lanceren | Veel volume + DevOps | Eigen video-UI bouwen |

## Beslissing

**Blijven op Daily t/m de SaaS-lancering.** Overstappen (Jitsi self-host of
LiveKit) pas wanneer:
1. je structureel ver boven 10.000 min/maand zit, **én**
2. per-minuut-kosten > serverkosten + onderhoudstijd, **én**
3. er DevOps-capaciteit is.

Kostenbescherming voor Daily is al ingebouwd (room-`exp` + auto-eject, zie
`memory/daily-cost-protection`).
