import * as React from "react";
import { cn } from "./cn";
import { ChatIcon } from "./icons";

/**
 * Premium product-peek: een verfijnde CSS/SVG-mock van het klaslokaal
 * (whiteboard met grafiek + video + chat). Decoratief blikvanger voor de hero —
 * toont eerlijk het echte product i.p.v. een generieke illustratie.
 */
export function ClassroomPreview({ className }: { className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={cn(
        "relative w-full rounded-[28px] border border-white/70 bg-gradient-to-b from-white to-[#f4faf6] p-3 shadow-soft-lg ring-1 ring-black/[0.04] backdrop-blur-xl",
        className,
      )}
    >
      {/* subtiele bovenrand-glans */}
      <div className="pointer-events-none absolute inset-x-6 top-0 h-px bg-gradient-to-r from-transparent via-white to-transparent" />

      {/* venster-balk */}
      <div className="mb-3 flex items-center gap-2 px-2 pt-1">
        <span className="flex gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-rose-300" />
          <span className="h-2.5 w-2.5 rounded-full bg-amber-300" />
          <span className="h-2.5 w-2.5 rounded-full bg-emerald-300" />
        </span>
        <span className="ml-2 flex h-6 flex-1 items-center gap-1.5 rounded-full bg-muted px-3 text-[9px] font-medium text-muted-foreground">
          <svg viewBox="0 0 24 24" width="9" height="9" fill="none" stroke="currentColor" strokeWidth="2.4">
            <rect x="5" y="11" width="14" height="9" rx="2" />
            <path d="M8 11V8a4 4 0 0 1 8 0v3" />
          </svg>
          bijles.app/klas/wiskunde
        </span>
      </div>

      <div className="grid grid-cols-3 gap-3">
        {/* whiteboard met grafiek */}
        <div
          className="col-span-2 overflow-hidden rounded-2xl bg-gradient-to-br from-white to-[#eef7f1] p-4 ring-1 ring-border"
          style={{
            backgroundImage:
              "radial-gradient(circle, rgba(15,42,87,0.06) 1px, transparent 1px)",
            backgroundSize: "15px 15px",
          }}
        >
          <svg viewBox="0 0 240 150" className="h-auto w-full">
            <defs>
              <linearGradient id="cpArea" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0" stopColor="#1f9d60" stopOpacity="0.22" />
                <stop offset="1" stopColor="#1f9d60" stopOpacity="0" />
              </linearGradient>
            </defs>
            {/* assen */}
            <line x1="22" y1="120" x2="222" y2="120" stroke="#cbd5e1" strokeWidth="1.5" />
            <line x1="120" y1="20" x2="120" y2="132" stroke="#cbd5e1" strokeWidth="1.5" />
            {/* oppervlakte onder de curve */}
            <path d="M34 120 Q120 -6 206 120 Z" fill="url(#cpArea)" />
            {/* curve */}
            <path
              d="M34 120 Q120 -6 206 120"
              fill="none"
              stroke="#1f9d60"
              strokeWidth="3"
              strokeLinecap="round"
            />
            {/* vertex */}
            <circle cx="120" cy="50" r="5" fill="#15803d" stroke="#ffffff" strokeWidth="2.5" />
            {/* label */}
            <text x="138" y="46" className="fill-foreground" fontSize="13" fontWeight="700">
              f(x) = x²
            </text>
            {/* correct-vinkje */}
            <path
              d="M150 88 l11 9 l-4 -15"
              fill="none"
              stroke="#7c3aed"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>

        {/* rechterkolom: video + chat */}
        <div className="col-span-1 flex flex-col gap-3">
          {/* video met geïllustreerde docent */}
          <div className="relative aspect-square overflow-hidden rounded-2xl ring-1 ring-black/5">
            <div className="absolute inset-0 bg-gradient-to-br from-[#aee9c7] to-[#4fb988]" />
            <div className="absolute inset-0 bg-[radial-gradient(120%_80%_at_50%_0%,rgba(255,255,255,0.35),transparent_55%)]" />
            <svg viewBox="0 0 100 100" className="absolute inset-0 h-full w-full">
              <defs>
                <radialGradient id="cpSkin" cx="50%" cy="42%" r="60%">
                  <stop offset="0" stopColor="#f9d4ad" />
                  <stop offset="1" stopColor="#efc095" />
                </radialGradient>
              </defs>
              {/* schouders / trui */}
              <path d="M11 101 C11 80 29 70 50 70 C71 70 89 80 89 101 Z" fill="#ffffff" />
              <path d="M50 70 C44 70 40 74 39 81 L61 81 C60 74 56 70 50 70 Z" fill="#e8eef6" />
              {/* nek + schaduw */}
              <rect x="43" y="55" width="14" height="20" rx="6" fill="#eab78c" />
              <ellipse cx="50" cy="60" rx="9" ry="3.5" fill="#000000" opacity="0.06" />
              {/* hoofd */}
              <circle cx="50" cy="42" r="19" fill="url(#cpSkin)" />
              {/* oren */}
              <circle cx="31" cy="44" r="3.4" fill="#efc095" />
              <circle cx="69" cy="44" r="3.4" fill="#efc095" />
              {/* haar */}
              <path d="M28 43 C27 22 73 22 72 43 C72 43 70 33 62 33 C60 30 55 29 50 29 C45 29 40 30 38 33 C30 33 28 43 28 43 Z" fill="#4a3326" />
              {/* wenkbrauwen */}
              <path d="M40 38 q3 -1.6 6 0" fill="none" stroke="#4a3326" strokeWidth="1.6" strokeLinecap="round" />
              <path d="M54 38 q3 -1.6 6 0" fill="none" stroke="#4a3326" strokeWidth="1.6" strokeLinecap="round" />
              {/* ogen */}
              <circle cx="43" cy="42.5" r="2.2" fill="#2a1d16" />
              <circle cx="57" cy="42.5" r="2.2" fill="#2a1d16" />
              <circle cx="43.7" cy="41.8" r="0.7" fill="#ffffff" />
              <circle cx="57.7" cy="41.8" r="0.7" fill="#ffffff" />
              {/* blosjes */}
              <circle cx="39" cy="49" r="2.6" fill="#f4a98e" opacity="0.5" />
              <circle cx="61" cy="49" r="2.6" fill="#f4a98e" opacity="0.5" />
              {/* glimlach */}
              <path d="M44 49.5 Q50 55 56 49.5" fill="none" stroke="#2a1d16" strokeWidth="2" strokeLinecap="round" />
            </svg>
            <span className="absolute bottom-1.5 left-1.5 flex items-center gap-1 rounded-full bg-black/35 px-1.5 py-0.5 text-[9px] font-medium text-white backdrop-blur">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" /> Daan · live
            </span>
          </div>

          {/* chat */}
          <div className="flex-1 rounded-2xl bg-muted/70 p-2 ring-1 ring-border">
            <div className="mb-1.5 flex items-center gap-1 text-[9px] font-medium text-muted-foreground">
              <ChatIcon size={11} /> chat
            </div>
            <div className="space-y-1.5">
              <div className="flex items-end gap-1">
                <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-slate-300 text-[7px] font-bold text-white">
                  L
                </span>
                <span className="block rounded-lg rounded-bl-sm bg-white px-1.5 py-1 text-[8px] text-foreground shadow-sm">
                  Snap je stap 3?
                </span>
              </div>
              <div className="flex items-end justify-end gap-1">
                <span className="block rounded-lg rounded-br-sm bg-brand px-1.5 py-1 text-[8px] text-white shadow-sm">
                  Ja! 🙌
                </span>
                <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-brand-strong text-[7px] font-bold text-white">
                  D
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
