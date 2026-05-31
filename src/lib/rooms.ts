/**
 * Room- en sessiebeheer aan de clientzijde.
 *
 * Werkt nu volledig zonder backend: rooms krijgen een uniek ID en recente
 * sessies worden lokaal (localStorage) onthouden. Zodra Supabase actief is,
 * kunnen deze functies één-op-één naar de database verhuizen.
 */

export type RecentSession = {
  roomId: string;
  title: string;
  createdAt: number;
};

const STORAGE_KEY = "bijles:recent-sessions";

/** Genereert een uniek, leesbaar room-ID (bijv. "wisk-7f3a9c"). */
export function generateRoomId(prefix = "les"): string {
  const rand =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID().replace(/-/g, "").slice(0, 6)
      : Math.random().toString(36).slice(2, 8);
  return `${prefix}-${rand}`;
}

/** Bouwt de volledige, deelbare URL naar een classroom. */
export function roomUrl(roomId: string): string {
  if (typeof window === "undefined") return `/klas/${roomId}`;
  return `${window.location.origin}/klas/${roomId}`;
}

export function getRecentSessions(): RecentSession[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as RecentSession[]) : [];
  } catch {
    return [];
  }
}

export function addRecentSession(session: RecentSession): void {
  if (typeof window === "undefined") return;
  const existing = getRecentSessions().filter(
    (s) => s.roomId !== session.roomId,
  );
  const next = [session, ...existing].slice(0, 12);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
}

export function removeRecentSession(roomId: string): void {
  if (typeof window === "undefined") return;
  const next = getRecentSessions().filter((s) => s.roomId !== roomId);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
}

/** Haalt een room-ID uit losse invoer (ID óf geplakte volledige URL). */
export function normalizeRoomInput(input: string): string {
  const trimmed = input.trim();
  const urlMatch = trimmed.match(/\/klas\/([^/?#]+)/);
  if (urlMatch) return urlMatch[1];
  return trimmed;
}
