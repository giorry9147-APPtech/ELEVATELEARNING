import "server-only";

import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { config } from "@/lib/config";

const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";

/**
 * Admin-client met de service-/secret-key. Omzeilt RLS — gebruik ALLEEN
 * server-side (route handlers, server actions) en nooit in de browser.
 * Geeft `null` terug zonder geldige config.
 */
export function createAdminClient() {
  if (!config.supabase.enabled || !serviceKey) return null;
  return createSupabaseClient(config.supabase.url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
