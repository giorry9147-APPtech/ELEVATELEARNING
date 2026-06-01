"use client";

import { createClient } from "@/lib/supabase/client";
import type { WBState } from "@/lib/whiteboard";

/**
 * Persistente opslag van de whiteboard-state in Supabase, per tenant + room.
 * Alleen voor ingelogde docenten (RLS); niet-ingelogde sessies blijven
 * localStorage gebruiken (zie src/lib/whiteboard.ts).
 */

export async function loadWBRemote(roomId: string): Promise<WBState | null> {
  const supabase = createClient();
  if (!supabase) return null;
  const { data, error } = await supabase
    .from("whiteboards")
    .select("state")
    .eq("room_id", roomId)
    .limit(1)
    .maybeSingle();
  if (error || !data?.state) return null;
  return data.state as WBState;
}

export async function saveWBRemote(roomId: string, state: WBState): Promise<void> {
  const supabase = createClient();
  if (!supabase) return;
  // Tenant van de ingelogde gebruiker (maakt 'm aan indien nodig).
  const { data: orgId } = await supabase.rpc("ensure_my_org");
  if (!orgId) return;
  await supabase.from("whiteboards").upsert(
    {
      org_id: orgId,
      room_id: roomId,
      state,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "org_id,room_id" },
  );
}
