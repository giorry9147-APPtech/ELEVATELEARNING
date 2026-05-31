import type { OrderedExcalidrawElement } from "@excalidraw/excalidraw/element/types";

/**
 * State + helpers voor een whiteboard met meerdere borden (pagina's).
 * Een docent kan borden vooraf voorbereiden ("Hoofdstuk 1", "Hoofdstuk 2", …)
 * en er tijdens de les tussen wisselen; het actieve bord synct naar studenten.
 */

export type Elements = readonly OrderedExcalidrawElement[];
export type Board = { id: string; name: string };
export type WBState = {
  boards: Board[];
  activeBoardId: string;
  /** elementen per bord-id */
  data: Record<string, Elements>;
};

export function newBoardId(): string {
  const r =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID().replace(/-/g, "").slice(0, 8)
      : Math.random().toString(36).slice(2, 10);
  return `bord-${r}`;
}

export function defaultState(): WBState {
  const id = "bord-1";
  return { boards: [{ id, name: "Bord 1" }], activeBoardId: id, data: { [id]: [] } };
}

const storageKey = (roomId: string) => `bijles:wb:${roomId}`;

export function loadWB(roomId: string): WBState {
  if (typeof window === "undefined") return defaultState();
  try {
    const raw = localStorage.getItem(storageKey(roomId));
    if (!raw) return defaultState();
    const s = JSON.parse(raw) as WBState;
    if (!s.boards?.length || !s.data) return defaultState();
    return s;
  } catch {
    return defaultState();
  }
}

export function saveWB(roomId: string, state: WBState): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(storageKey(roomId), JSON.stringify(state));
  } catch {
    // localStorage vol of niet beschikbaar — niet fataal.
  }
}

/**
 * Voegt remote-elementen samen met lokale op basis van element-`version`
 * (hoogste wint). Voorkomt dat de ene deelnemer de wijzigingen van de ander
 * (zoals net-getypte tekst) overschrijft.
 */
export function reconcile(local: Elements, remote: Elements): OrderedExcalidrawElement[] {
  const map = new Map<string, OrderedExcalidrawElement>();
  for (const el of local) map.set(el.id, el);
  for (const el of remote) {
    const cur = map.get(el.id);
    if (!cur || (el.version ?? 0) >= (cur.version ?? 0)) map.set(el.id, el);
  }
  return [...map.values()];
}

/** True als de staat nog 'leeg' is (alleen het standaardbord, geen tekeningen). */
export function isEmptyState(s: WBState): boolean {
  return s.boards.length === 1 && (s.data[s.boards[0].id]?.length ?? 0) === 0;
}
