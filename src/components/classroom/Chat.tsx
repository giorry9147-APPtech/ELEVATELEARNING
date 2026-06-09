"use client";

import { useEffect, useRef, useState } from "react";
import type { RealtimeChannel } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";
import { config } from "@/lib/config";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { cn } from "@/components/ui/cn";

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
    <div className="flex h-full flex-col bg-surface">
      <div className="border-b border-border px-4 py-3">
        <h2 className="text-sm font-semibold text-foreground">Chat</h2>
        {!config.supabase.enabled && (
          <p className="mt-0.5 text-xs text-warning">
            Lokale modus — berichten worden nog niet gedeeld (Supabase nodig).
          </p>
        )}
      </div>

      <div ref={listRef} className="flex-1 space-y-2.5 overflow-y-auto px-4 py-3">
        {messages.length === 0 && (
          <p className="text-sm text-muted-foreground">Nog geen berichten.</p>
        )}
        {messages.map((m) => {
          const mine = m.author === userName;
          const time = new Date(m.ts).toLocaleTimeString("nl-NL", {
            hour: "2-digit",
            minute: "2-digit",
          });
          return (
            <div
              key={m.id}
              className={cn("flex flex-col", mine ? "items-end" : "items-start")}
            >
              {!mine && (
                <span className="mb-0.5 px-1 text-xs font-medium text-muted-foreground">
                  {m.author}
                </span>
              )}
              <div
                className={cn(
                  "max-w-[85%] rounded-2xl px-3 py-2 text-sm",
                  mine
                    ? "rounded-br-sm bg-brand text-white"
                    : "rounded-bl-sm bg-muted text-foreground",
                )}
              >
                {m.text}
              </div>
              <span className="mt-0.5 px-1 text-[10px] text-muted-foreground">
                {time}
              </span>
            </div>
          );
        })}
      </div>

      <form onSubmit={send} className="flex gap-2 border-t border-border p-3">
        <Input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Typ een bericht…"
        />
        <Button type="submit">Stuur</Button>
      </form>
    </div>
  );
}
