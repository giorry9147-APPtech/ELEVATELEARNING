"use client";

import { useEffect, useRef, useState } from "react";
import type { RealtimeChannel } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";
import { config } from "@/lib/config";

type Message = { id: string; author: string; text: string; ts: number };
type Props = { roomId: string; userName: string };

export default function Chat({ roomId, userName }: Props) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [draft, setDraft] = useState("");
  const channelRef = useRef<RealtimeChannel | null>(null);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const supabase = createClient();
    if (!supabase) return;

    const channel = supabase.channel(`chat:${roomId}`);
    channel
      .on("broadcast", { event: "message" }, ({ payload }) => {
        setMessages((prev) => [...prev, payload as Message]);
      })
      .subscribe();

    channelRef.current = channel;
    return () => {
      supabase.removeChannel(channel);
      channelRef.current = null;
    };
  }, [roomId]);

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight });
  }, [messages]);

  const send = (e: React.FormEvent) => {
    e.preventDefault();
    const text = draft.trim();
    if (!text) return;
    const msg: Message = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      author: userName,
      text,
      ts: Date.now(),
    };
    // Toon eigen bericht direct (broadcast self:false bij realtime).
    setMessages((prev) => [...prev, msg]);
    channelRef.current?.send({
      type: "broadcast",
      event: "message",
      payload: msg,
    });
    setDraft("");
  };

  return (
    <div className="flex h-full flex-col bg-white">
      <div className="border-b border-slate-200 px-4 py-3">
        <h2 className="text-sm font-semibold text-slate-700">Chat</h2>
        {!config.supabase.enabled && (
          <p className="mt-0.5 text-xs text-amber-600">
            Lokale modus — berichten worden nog niet gedeeld (Supabase nodig).
          </p>
        )}
      </div>

      <div ref={listRef} className="flex-1 space-y-3 overflow-y-auto px-4 py-3">
        {messages.length === 0 && (
          <p className="text-sm text-slate-400">Nog geen berichten.</p>
        )}
        {messages.map((m) => (
          <div key={m.id} className="text-sm">
            <span className="font-medium text-slate-800">{m.author}</span>{" "}
            <span className="text-slate-400">
              {new Date(m.ts).toLocaleTimeString("nl-NL", {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </span>
            <p className="text-slate-600">{m.text}</p>
          </div>
        ))}
      </div>

      <form onSubmit={send} className="flex gap-2 border-t border-slate-200 p-3">
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Typ een bericht…"
          className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-sky-500"
        />
        <button
          type="submit"
          className="rounded-lg bg-sky-600 px-4 py-2 text-sm font-medium text-white hover:bg-sky-700"
        >
          Stuur
        </button>
      </form>
    </div>
  );
}
