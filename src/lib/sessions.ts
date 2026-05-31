"use client";

import { createClient } from "@/lib/supabase/client";
import {
  addRecentSession,
  getRecentSessions,
  removeRecentSession,
  type RecentSession,
} from "@/lib/rooms";

/**
 * Sessiebeheer met automatische opslag-keuze:
 * - Ingelogd + Supabase actief → sessies in de database (`sessions`-tabel),
 *   gekoppeld aan het account en gedeeld over apparaten.
 * - Anders → lokaal in localStorage (gast-/demo-modus).
 */

export async function createSession(params: {
  roomId: string;
  title: string;
  userId: string | null;
}): Promise<void> {
  const { roomId, title, userId } = params;
  const supabase = createClient();

  if (supabase && userId) {
    const { error } = await supabase.from("sessions").insert({
      room_id: roomId,
      title,
      teacher_id: userId,
    });
    if (!error) return;
    // Bij fout: val terug op lokaal zodat de gebruiker niet vastloopt.
  }

  addRecentSession({ roomId, title, createdAt: Date.now() });
}

export async function listSessions(
  userId: string | null,
): Promise<RecentSession[]> {
  const supabase = createClient();

  if (supabase && userId) {
    const { data, error } = await supabase
      .from("sessions")
      .select("room_id, title, created_at")
      .eq("teacher_id", userId)
      .order("created_at", { ascending: false })
      .limit(50);
    if (!error && data) {
      return data.map((s) => ({
        roomId: s.room_id,
        title: s.title,
        createdAt: new Date(s.created_at).getTime(),
      }));
    }
  }

  return getRecentSessions();
}

export async function deleteSession(
  roomId: string,
  userId: string | null,
): Promise<void> {
  const supabase = createClient();

  if (supabase && userId) {
    const { error } = await supabase
      .from("sessions")
      .delete()
      .eq("room_id", roomId)
      .eq("teacher_id", userId);
    if (!error) return;
  }

  removeRecentSession(roomId);
}
