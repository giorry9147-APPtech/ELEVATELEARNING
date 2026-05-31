/**
 * Centrale configuratie + feature-flags.
 *
 * Het platform is ontworpen om te werken mét of zónder API-keys:
 * - Geen Supabase-key  → whiteboard werkt lokaal, geen login/realtime.
 * - Geen Daily-room    → video-paneel toont een setup-kaart i.p.v. de call.
 *
 * Zo kun je meteen demoën en keys later toevoegen zonder code te wijzigen.
 */

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";
const dailyRoomUrl = process.env.NEXT_PUBLIC_DAILY_ROOM_URL ?? "";

export const config = {
  appUrl: process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",

  supabase: {
    url: supabaseUrl,
    anonKey: supabaseAnonKey,
    /** True zodra een geldige Supabase-config aanwezig is. */
    enabled: Boolean(supabaseUrl && supabaseAnonKey),
  },

  daily: {
    roomUrl: dailyRoomUrl,
    domain: process.env.NEXT_PUBLIC_DAILY_DOMAIN ?? "",
    /** True zodra er een room-URL is ingesteld. */
    enabled: Boolean(dailyRoomUrl),
  },
} as const;

export type AppConfig = typeof config;

// ── Daily.co kostenbescherming ────────────────────────────────────────────
// Een Daily-sessie verbruikt minuten zolang iemand VERBONDEN is. Om te
// voorkomen dat een vergeten/achtergebleven tab eindeloos doortikt, krijgt
// elke room een harde verlooptijd (exp). Daily ejecteert dan iedereen
// automatisch (eject_at_room_exp) — óók als de browser is dichtgeklapt.
export const dailyLimits = {
  /** Standaard sessieduur (minuten) voordat de room verloopt. */
  sessionMinutes: 90,
  /** Met hoeveel minuten "Verlengen" de sessie oprekt. */
  extendMinutes: 30,
  /** Hoeveel seconden vóór exp de "verlengen?"-waarschuwing verschijnt. */
  warnBeforeSeconds: 5 * 60,
} as const;
