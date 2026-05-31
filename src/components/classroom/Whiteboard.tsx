"use client";

import { useCallback, useEffect, useRef, useState, type ComponentType } from "react";
import dynamic from "next/dynamic";
import "@excalidraw/excalidraw/index.css";
import type {
  ExcalidrawImperativeAPI,
  ExcalidrawProps,
} from "@excalidraw/excalidraw/types";
import type { OrderedExcalidrawElement } from "@excalidraw/excalidraw/element/types";
import type { RealtimeChannel } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";
import { config } from "@/lib/config";
import {
  defaultState,
  isEmptyState,
  loadWB,
  newBoardId,
  reconcile,
  saveWB,
  type Board,
  type Elements,
  type WBState,
} from "@/lib/whiteboard";

// Excalidraw heeft `window` nodig → alleen client-side laden.
const Excalidraw = dynamic(
  async () => (await import("@excalidraw/excalidraw")).Excalidraw,
  {
    ssr: false,
    loading: () => (
      <div className="flex h-full items-center justify-center text-slate-400">
        Whiteboard laden…
      </div>
    ),
  },
) as ComponentType<ExcalidrawProps>;

// Vast paginakader (16:9) dat op elk bord toont waar de "pagina" begint/eindigt.
const FRAME_ID = "page-frame";
const PAGE_W = 1280;
const PAGE_H = 720;

/** Bouwt het vergrendelde paginakader via Excalidraw's eigen element-helper. */
async function buildFrame(): Promise<OrderedExcalidrawElement | null> {
  try {
    const { convertToExcalidrawElements } = await import("@excalidraw/excalidraw");
    const [el] = convertToExcalidrawElements([
      {
        type: "rectangle",
        id: FRAME_ID,
        x: 0,
        y: 0,
        width: PAGE_W,
        height: PAGE_H,
        strokeColor: "#cbd5e1",
        backgroundColor: "transparent",
        strokeWidth: 2,
        roughness: 0,
        locked: true,
      },
    ] as never);
    return el as OrderedExcalidrawElement;
  } catch {
    return null;
  }
}

type Props = { roomId: string };

/**
 * Collaboratief whiteboard met meerdere borden.
 * - Borden vooraf voorbereiden + tijdens de les wisselen (tabs bovenaan).
 * - Realtime-sync via Supabase met reconciliatie (samenvoegen op versie),
 *   zodat typen van de één de wijzigingen van de ander niet overschrijft.
 */
export default function Whiteboard({ roomId }: Props) {
  const apiRef = useRef<ExcalidrawImperativeAPI | null>(null);
  const channelRef = useRef<RealtimeChannel | null>(null);
  // Bron van waarheid voor borden + elementen (los van React-render).
  const wb = useRef<WBState>(defaultState());
  // Updates die we zelf toepassen niet opnieuw uitzenden.
  const applyingRemote = useRef(false);
  const lastSent = useRef(0);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Actief-bord dat via remote kwam maar nog niet bekend was (wacht op meta).
  const pendingActive = useRef<string | null>(null);
  const frameRef = useRef<OrderedExcalidrawElement | null>(null);

  const [boards, setBoards] = useState<Board[]>(wb.current.boards);
  const [activeId, setActiveId] = useState(wb.current.activeBoardId);
  const [synced, setSynced] = useState(false);
  const [ready, setReady] = useState(false);

  // Zorgt dat een bord het paginakader bevat (vooraan, vergrendeld).
  const ensureFrame = useCallback((els: Elements): Elements => {
    const frame = frameRef.current;
    if (!frame || els.some((e) => e.id === FRAME_ID)) return els;
    return [frame, ...els];
  }, []);

  // ── Initieel: kader bouwen + borden laden uit localStorage ──
  useEffect(() => {
    let cancelled = false;
    (async () => {
      frameRef.current = await buildFrame();
      if (cancelled) return;
      const loaded = loadWB(roomId);
      for (const b of loaded.boards) {
        loaded.data[b.id] = ensureFrame(loaded.data[b.id] ?? []);
      }
      wb.current = loaded;
      setBoards(loaded.boards);
      setActiveId(loaded.activeBoardId);
      setReady(true);
    })();
    return () => {
      cancelled = true;
    };
  }, [roomId, ensureFrame]);

  const persist = useCallback(() => {
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => saveWB(roomId, wb.current), 400);
  }, [roomId]);

  // Past elementen toe op de canvas zonder een eigen broadcast te triggeren.
  const applyToCanvas = useCallback((elements: Elements) => {
    const api = apiRef.current;
    if (!api) return;
    applyingRemote.current = true;
    api.updateScene({ elements: elements as never });
    applyingRemote.current = false;
  }, []);

  const send = useCallback((event: string, payload: unknown) => {
    channelRef.current?.send({ type: "broadcast", event, payload });
  }, []);

  // ── Wissel van bord (lokaal of via remote) ──
  const switchBoard = useCallback(
    (id: string, silent = false) => {
      const api = apiRef.current;
      if (api && !applyingRemote.current) {
        // Bewaar huidige tekening voordat we wisselen.
        wb.current.data[wb.current.activeBoardId] = api.getSceneElements();
      }
      if (!wb.current.data[id]) wb.current.data[id] = [];
      wb.current.activeBoardId = id;
      setActiveId(id);
      applyToCanvas(wb.current.data[id]);
      persist();
      if (!silent) send("active", { boardId: id });
    },
    [applyToCanvas, persist, send],
  );

  const syncMeta = useCallback(() => {
    setBoards([...wb.current.boards]);
    send("meta", { boards: wb.current.boards });
    persist();
  }, [persist, send]);

  const addBoard = useCallback(() => {
    const id = newBoardId();
    wb.current.boards.push({ id, name: `Bord ${wb.current.boards.length + 1}` });
    wb.current.data[id] = ensureFrame([]);
    syncMeta();
    switchBoard(id);
  }, [switchBoard, syncMeta, ensureFrame]);

  const renameBoard = useCallback(
    (id: string) => {
      const board = wb.current.boards.find((b) => b.id === id);
      if (!board) return;
      const name = window.prompt("Naam van dit bord:", board.name)?.trim();
      if (!name) return;
      board.name = name;
      syncMeta();
    },
    [syncMeta],
  );

  const deleteBoard = useCallback(
    (id: string) => {
      if (wb.current.boards.length <= 1) return;
      if (!window.confirm("Dit bord verwijderen?")) return;
      wb.current.boards = wb.current.boards.filter((b) => b.id !== id);
      delete wb.current.data[id];
      const fallback = wb.current.boards[0].id;
      syncMeta();
      if (wb.current.activeBoardId === id) switchBoard(fallback);
    },
    [switchBoard, syncMeta],
  );

  // ── Realtime ──
  useEffect(() => {
    const supabase = createClient();
    if (!supabase) return;

    const channel = supabase.channel(`whiteboard:${roomId}`, {
      config: { broadcast: { self: false } },
    });

    channel
      .on("broadcast", { event: "scene" }, ({ payload }) => {
        const { boardId, elements } = payload as { boardId: string; elements: Elements };
        const merged = reconcile(wb.current.data[boardId] ?? [], elements);
        wb.current.data[boardId] = merged;
        if (boardId === wb.current.activeBoardId) applyToCanvas(merged);
        persist();
      })
      .on("broadcast", { event: "active" }, ({ payload }) => {
        const { boardId } = payload as { boardId: string };
        if (wb.current.boards.some((b) => b.id === boardId)) {
          switchBoard(boardId, true);
        } else {
          pendingActive.current = boardId;
        }
      })
      .on("broadcast", { event: "meta" }, ({ payload }) => {
        const { boards: remoteBoards } = payload as { boards: Board[] };
        // Samenvoegen: namen bijwerken + nieuwe borden toevoegen.
        const map = new Map(wb.current.boards.map((b) => [b.id, b]));
        for (const b of remoteBoards) map.set(b.id, b);
        wb.current.boards = remoteBoards.map((b) => map.get(b.id)!);
        for (const b of wb.current.boards)
          if (!wb.current.data[b.id]) wb.current.data[b.id] = ensureFrame([]);
        setBoards([...wb.current.boards]);
        if (pendingActive.current && map.has(pendingActive.current)) {
          const id = pendingActive.current;
          pendingActive.current = null;
          switchBoard(id, true);
        }
        persist();
      })
      .on("broadcast", { event: "request" }, () => {
        send("full", wb.current);
      })
      .on("broadcast", { event: "full" }, ({ payload }) => {
        const remote = payload as WBState;
        if (isEmptyState(wb.current)) {
          // Nieuwkomer met lege staat → volledig overnemen.
          wb.current = remote;
        } else {
          // Anders samenvoegen (borden + elementen).
          const map = new Map(wb.current.boards.map((b) => [b.id, b]));
          for (const b of remote.boards) map.set(b.id, b);
          wb.current.boards = [...map.values()];
          for (const b of wb.current.boards) {
            wb.current.data[b.id] = reconcile(
              wb.current.data[b.id] ?? [],
              remote.data[b.id] ?? [],
            );
          }
        }
        // Zorg dat elk (ook overgenomen) bord het paginakader heeft.
        for (const b of wb.current.boards)
          wb.current.data[b.id] = ensureFrame(wb.current.data[b.id] ?? []);
        setBoards([...wb.current.boards]);
        setActiveId(wb.current.activeBoardId);
        applyToCanvas(wb.current.data[wb.current.activeBoardId] ?? []);
        persist();
      })
      .subscribe((status) => {
        const ok = status === "SUBSCRIBED";
        setSynced(ok);
        if (ok) send("request", {}); // vraag bestaande staat op bij binnenkomst
      });

    channelRef.current = channel;
    return () => {
      supabase.removeChannel(channel);
      channelRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomId]);

  // ── Lokale tekenwijzigingen ──
  const handleChange: ExcalidrawProps["onChange"] = (elements) => {
    if (applyingRemote.current) return;
    wb.current.data[wb.current.activeBoardId] = elements;
    persist();
    const now = Date.now();
    if (now - lastSent.current < 70) return;
    lastSent.current = now;
    send("scene", { boardId: wb.current.activeBoardId, elements });
  };

  return (
    <div className="flex h-full w-full flex-col">
      {/* Tabbalk: borden voorbereiden + wisselen */}
      <div className="flex items-center gap-1 overflow-x-auto border-b border-slate-200 bg-white px-2 py-1.5">
        {boards.map((b) => (
          <button
            key={b.id}
            onClick={() => switchBoard(b.id)}
            onDoubleClick={() => renameBoard(b.id)}
            title="Klik om te wisselen · dubbelklik om te hernoemen"
            className={`group flex shrink-0 items-center gap-1 rounded-lg px-3 py-1 text-sm font-medium ${
              b.id === activeId
                ? "bg-sky-600 text-white"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            {b.name}
            {boards.length > 1 && (
              <span
                role="button"
                onClick={(e) => {
                  e.stopPropagation();
                  deleteBoard(b.id);
                }}
                className={`ml-1 rounded px-1 text-xs ${
                  b.id === activeId ? "hover:bg-sky-700" : "hover:bg-slate-300"
                }`}
              >
                ✕
              </span>
            )}
          </button>
        ))}
        <button
          onClick={addBoard}
          title="Nieuw bord toevoegen"
          className="shrink-0 rounded-lg border border-dashed border-slate-300 px-3 py-1 text-sm font-medium text-slate-500 hover:bg-slate-50"
        >
          + Bord
        </button>
      </div>

      {/* Canvas */}
      <div className="relative min-h-0 flex-1">
        {ready ? (
          <Excalidraw
            excalidrawAPI={(api) => (apiRef.current = api)}
            initialData={{
              elements: wb.current.data[wb.current.activeBoardId] as never,
              scrollToContent: true,
            }}
            onChange={handleChange}
            langCode="nl-NL"
            UIOptions={{ canvasActions: { loadScene: true, saveToActiveFile: false } }}
          />
        ) : (
          <div className="flex h-full items-center justify-center text-slate-400">
            Whiteboard laden…
          </div>
        )}
        {config.supabase.enabled && (
          <span
            className={`pointer-events-none absolute right-3 top-3 z-10 rounded-full px-2 py-0.5 text-xs font-medium ${
              synced ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"
            }`}
          >
            {synced ? "● Live gesynchroniseerd" : "○ Verbinden…"}
          </span>
        )}
      </div>
    </div>
  );
}
