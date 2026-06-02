"use client";

import { createClient } from "@/lib/supabase/client";

export type Usage = {
  plan: string;
  minutesIncluded: number;
  minutesUsed: number;
  minutesRemaining: number;
};

/** Verbruik + restant van de huidige periode (voedt de minuten-meter). */
export async function getMyUsage(): Promise<Usage | null> {
  const supabase = createClient();
  if (!supabase) return null;
  const { data } = await supabase.rpc("my_usage");
  const r = Array.isArray(data) ? data[0] : null;
  if (!r) return null;
  return {
    plan: r.plan as string,
    minutesIncluded: Number(r.minutes_included),
    minutesUsed: Number(r.minutes_used),
    minutesRemaining: Number(r.minutes_remaining),
  };
}

/** Opent het Stripe Customer Portal (retourneert de URL). */
export async function openPortal(): Promise<string | null> {
  const res = await fetch("/api/portal", { method: "POST" });
  const d = await res.json().catch(() => null);
  return d?.url ?? null;
}
