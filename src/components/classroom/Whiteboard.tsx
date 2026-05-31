"use client";

import { useEffect, useRef, useState, type ComponentType } from "react";
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

type Props = { roomId: string };

/**
 * Collaboratief whiteboard (Excalidraw).
 * - Zonder Supabase: volledig functioneel, maar lokaal (geen sync).
 * - Met Supabase: tekenacties worden via een realtime broadcast-kanaal
 *   gedeeld met alle deelnemers in dezelfde room.
 */
export default function Whiteboard({ roomId }: Props) {
  const apiRef = useRef<ExcalidrawImperativeAPI | null>(null);
  const channelRef = useRef<RealtimeChannel | null>(null);
  // Voorkomt een echo-loop: updates die we zelf binnenkrijgen niet opnieuw uitzenden.
  const applyingRemote = useRef(false);
  // Lichte throttle zodat we het kanaal niet overspoelen tijdens het tekenen.
  const lastSent = useRef(0);
  const [synced, setSynced] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    if (!supabase) return;

    const channel = supabase.channel(`whiteboard:${roomId}`, {
      config: { broadcast: { self: false } },
    });

    channel
      .on("broadcast", { event: "scene" }, ({ payload }) => {
        const api = apiRef.current;
        if (!api) return;
        applyingRemote.current = true;
        api.updateScene({
          elements: payload.elements as OrderedExcalidrawElement[],
        });
        applyingRemote.current = false;
      })
      .subscribe((status) => setSynced(status === "SUBSCRIBED"));

    channelRef.current = channel;
    return () => {
      supabase.removeChannel(channel);
      channelRef.current = null;
    };
  }, [roomId]);

  const handleChange: ExcalidrawProps["onChange"] = (elements) => {
    if (applyingRemote.current || !channelRef.current) return;
    const now = Date.now();
    if (now - lastSent.current < 80) return;
    lastSent.current = now;
    channelRef.current.send({
      type: "broadcast",
      event: "scene",
      payload: { elements },
    });
  };

  return (
    <div className="relative h-full w-full">
      <Excalidraw
        excalidrawAPI={(api) => (apiRef.current = api)}
        onChange={handleChange}
        langCode="nl-NL"
        UIOptions={{
          canvasActions: { loadScene: true, saveToActiveFile: false },
        }}
      />
      {config.supabase.enabled && (
        <span
          className={`absolute right-3 top-3 z-10 rounded-full px-2 py-0.5 text-xs font-medium ${
            synced
              ? "bg-emerald-100 text-emerald-700"
              : "bg-amber-100 text-amber-700"
          }`}
        >
          {synced ? "● Live gesynchroniseerd" : "○ Verbinden…"}
        </span>
      )}
    </div>
  );
}
