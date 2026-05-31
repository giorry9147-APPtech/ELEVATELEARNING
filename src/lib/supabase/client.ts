"use client";

import { createBrowserClient } from "@supabase/ssr";
import { config } from "@/lib/config";

/**
 * Supabase browser-client. Geeft `null` terug wanneer er geen keys zijn
 * ingesteld, zodat de UI netjes kan terugvallen op de lokale demo-modus.
 */
export function createClient() {
  if (!config.supabase.enabled) return null;
  return createBrowserClient(config.supabase.url, config.supabase.anonKey);
}
