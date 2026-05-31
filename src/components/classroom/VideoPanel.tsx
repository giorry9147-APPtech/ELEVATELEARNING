"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import DailyIframe, { type DailyCall } from "@daily-co/daily-js";
import { dailyLimits } from "@/lib/config";

type Props = { roomId: string; userName?: string };

type RoomInfo = { url: string | null; exp: number | null };

/**
 * Videopaneel met een abstractie-vriendelijke opzet: de rest van de app
 * praat alleen met <VideoPanel/>, niet rechtstreeks met Daily. Zo kunnen we
 * later kosteloos wisselen naar self-hosted Jitsi of LiveKit.
 *
 * De room-URL wordt per sessie opgehaald via /api/daily-room: met een Daily
 * API-key krijgt elke les een eigen room met een harde verlooptijd (exp).
 *
 * KOSTENBESCHERMING: vlak voor exp verschijnt een "verlengen?"-melding. Klikt
 * niemand, dan ejecteert Daily de sessie automatisch op exp en stoppen de
 * minuten. Zo betaal je nooit voor een vergeten/achtergebleven tab.
 */
export default function VideoPanel({ roomId, userName }: Props) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const callRef = useRef<DailyCall | null>(null);
  const [url, setUrl] = useState<string | null>(null);
  const [exp, setExp] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [ended, setEnded] = useState(false);

  // "Now" als tikkende klok; secondsLeft leiden we eruit af (geen setState in
  // effect-body → geen cascading renders).
  const [now, setNow] = useState(() => Math.floor(Date.now() / 1000));
  const [extending, setExtending] = useState(false);

  // Haal de room-URL + verlooptijd voor deze sessie op.
  useEffect(() => {
    let cancelled = false;
    fetch("/api/daily-room", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ roomId }),
    })
      .then((r) => r.json())
      .then((data: RoomInfo) => {
        if (cancelled) return;
        setUrl(data?.url ?? null);
        setExp(typeof data?.exp === "number" ? data.exp : null);
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

    // Wordt iemand door Daily uit de room gezet op exp? Toon "beëindigd".
    const onLeft = () => setEnded(true);
    call.on("left-meeting", onLeft);
    call.on("error", onLeft);

    call.join({ url, userName: userName || "Gast" });

    return () => {
      call.off("left-meeting", onLeft);
      call.off("error", onLeft);
      call.destroy();
      callRef.current = null;
    };
  }, [url, userName]);

  // Klok tikt alleen als er een exp is om naartoe af te tellen.
  useEffect(() => {
    if (!exp) return;
    const id = setInterval(() => setNow(Math.floor(Date.now() / 1000)), 1000);
    return () => clearInterval(id);
  }, [exp]);

  // Afgeleid: resterende seconden (null = geen limiet, bv. gedeelde demo-room).
  const secondsLeft = exp ? exp - now : null;
  const expired = secondsLeft !== null && secondsLeft <= 0;

  // Verleng de sessie via de API en schuif de lokale exp mee op.
  const extend = useCallback(async () => {
    setExtending(true);
    try {
      const res = await fetch("/api/daily-room", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          roomId,
          addMinutes: dailyLimits.extendMinutes,
        }),
      });
      const data = await res.json();
      if (typeof data?.exp === "number") {
        setExp(data.exp);
        setEnded(false);
      }
    } catch {
      // Stil falen: bij geen verlenging ejecteert Daily gewoon op de oude exp.
    } finally {
      setExtending(false);
    }
  }, [roomId]);

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

  const isOver = ended || expired;
  const showWarning =
    !isOver &&
    secondsLeft !== null &&
    secondsLeft <= dailyLimits.warnBeforeSeconds &&
    secondsLeft > 0;

  return (
    <div className="relative h-full w-full bg-slate-900">
      <div ref={wrapperRef} className="h-full w-full" />

      {/* Sessie verlopen → call is geëjecteerd, minuten stoppen. */}
      {isOver && (
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-3 bg-slate-900/95 p-6 text-center text-slate-200">
          <div className="text-4xl">⏱️</div>
          <p className="font-medium text-white">Sessie beëindigd</p>
          <p className="max-w-xs text-sm text-slate-400">
            De videosessie is automatisch afgesloten. Verleng om verder te gaan.
          </p>
          <button
            onClick={extend}
            disabled={extending}
            className="mt-1 rounded-lg bg-sky-600 px-4 py-2 text-sm font-medium text-white hover:bg-sky-700 disabled:opacity-60"
          >
            {extending
              ? "Bezig…"
              : `Sessie heropenen (+${dailyLimits.extendMinutes} min)`}
          </button>
        </div>
      )}

      {/* Waarschuwing vlak voor exp: verlengen of laten verlopen. */}
      {showWarning && (
        <div className="absolute inset-x-0 bottom-0 z-10 flex items-center justify-between gap-3 bg-amber-500/95 px-4 py-3 text-sm text-amber-950">
          <span className="font-medium">
            Sessie verloopt over {formatLeft(secondsLeft!)}.
          </span>
          <button
            onClick={extend}
            disabled={extending}
            className="shrink-0 rounded-lg bg-amber-950 px-3 py-1.5 font-medium text-amber-50 hover:bg-amber-900 disabled:opacity-60"
          >
            {extending ? "Bezig…" : `Verleng +${dailyLimits.extendMinutes} min`}
          </button>
        </div>
      )}
    </div>
  );
}

// "4:05" of "45s" — korte, leesbare resterende tijd.
function formatLeft(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}
