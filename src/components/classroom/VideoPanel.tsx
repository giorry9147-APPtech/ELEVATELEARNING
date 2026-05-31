"use client";

import { useEffect, useRef, useState } from "react";
import DailyIframe, { type DailyCall } from "@daily-co/daily-js";

type Props = { roomId: string; userName?: string };

/**
 * Videopaneel met een abstractie-vriendelijke opzet: de rest van de app
 * praat alleen met <VideoPanel/>, niet rechtstreeks met Daily. Zo kunnen we
 * later kosteloos wisselen naar self-hosted Jitsi of LiveKit.
 *
 * De room-URL wordt per sessie opgehaald via /api/daily-room:
 * met een Daily API-key krijgt elke les een eigen room, anders de gedeelde room.
 */
export default function VideoPanel({ roomId, userName }: Props) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const callRef = useRef<DailyCall | null>(null);
  const [url, setUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Haal de room-URL voor deze sessie op.
  useEffect(() => {
    let cancelled = false;
    fetch("/api/daily-room", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ roomId }),
    })
      .then((r) => r.json())
      .then((data) => {
        if (cancelled) return;
        setUrl(data?.url ?? null);
        setLoading(false);
      })
      .catch(() => {
        if (cancelled) return;
        setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [roomId]);

  // Sluit de call aan zodra we een URL hebben.
  useEffect(() => {
    if (!url || !wrapperRef.current || callRef.current) return;

    const call = DailyIframe.createFrame(wrapperRef.current, {
      iframeStyle: { width: "100%", height: "100%", border: "0" },
      showLeaveButton: true,
      showFullscreenButton: true,
    });
    callRef.current = call;
    call.join({ url, userName: userName || "Gast" });

    return () => {
      call.destroy();
      callRef.current = null;
    };
  }, [url, userName]);

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center bg-slate-900 text-slate-400">
        Video laden…
      </div>
    );
  }

  if (!url) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-3 bg-slate-900 p-6 text-center text-slate-300">
        <div className="text-4xl">🎥</div>
        <p className="font-medium text-white">Video nog niet ingesteld</p>
        <p className="max-w-xs text-sm text-slate-400">
          Maak op{" "}
          <a
            href="https://dashboard.daily.co"
            target="_blank"
            rel="noreferrer"
            className="text-sky-400 underline"
          >
            dashboard.daily.co
          </a>{" "}
          een room aan en plak de URL in{" "}
          <code className="rounded bg-slate-800 px-1">.env.local</code> bij{" "}
          <code className="rounded bg-slate-800 px-1">
            NEXT_PUBLIC_DAILY_ROOM_URL
          </code>
          .
        </p>
      </div>
    );
  }

  return <div ref={wrapperRef} className="h-full w-full bg-slate-900" />;
}
