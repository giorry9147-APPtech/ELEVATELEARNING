"use client";

import { useEffect, useState } from "react";
import Whiteboard from "./Whiteboard";
import VideoPanel from "./VideoPanel";
import Chat from "./Chat";
import { BrandMark } from "@/components/BrandingProvider";

type Props = { roomId: string };

/**
 * De live klas: whiteboard (groot, links) + video (rechtsboven) + chat
 * (rechtsonder). Vraagt eenmalig om een naam en onthoudt die lokaal.
 */
export default function Classroom({ roomId }: Props) {
  const [userName, setUserName] = useState<string | null>(null);
  const [draft, setDraft] = useState("");

  useEffect(() => {
    setUserName(localStorage.getItem("bijles:name"));
  }, []);

  if (userName === null) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-100">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            const name = draft.trim();
            if (!name) return;
            localStorage.setItem("bijles:name", name);
            setUserName(name);
          }}
          className="w-full max-w-sm rounded-2xl bg-white p-8 shadow-lg"
        >
          <h1 className="text-lg font-semibold text-slate-800">
            Welkom in de bijles
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Hoe mogen we je noemen in deze sessie?
          </p>
          <input
            autoFocus
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="Bijv. Sanne"
            className="mt-4 w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-sky-500"
          />
          <button
            type="submit"
            className="mt-4 w-full rounded-lg bg-sky-600 px-4 py-2 font-medium text-white hover:bg-sky-700"
          >
            Naar de klas
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="flex h-screen flex-col bg-slate-100">
      <header className="flex items-center justify-between border-b border-slate-200 bg-white px-4 py-2">
        <div className="flex items-center gap-2">
          <BrandMark />
          <span className="text-slate-400">/</span>
          <span className="text-sm text-slate-500">room: {roomId}</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm text-slate-600">{userName}</span>
          <button
            onClick={() => {
              navigator.clipboard.writeText(window.location.href);
            }}
            className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Link kopiëren
          </button>
        </div>
      </header>

      <div className="grid flex-1 grid-cols-1 gap-2 overflow-hidden p-2 lg:grid-cols-[1fr_360px]">
        {/* Whiteboard */}
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
          <Whiteboard roomId={roomId} />
        </div>

        {/* Rechterkolom: video boven, chat onder */}
        <div className="flex min-h-0 flex-col gap-2">
          <div className="h-1/2 overflow-hidden rounded-xl border border-slate-200">
            <VideoPanel roomId={roomId} userName={userName} />
          </div>
          <div className="h-1/2 overflow-hidden rounded-xl border border-slate-200">
            <Chat roomId={roomId} userName={userName} />
          </div>
        </div>
      </div>
    </div>
  );
}
