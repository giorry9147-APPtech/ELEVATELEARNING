import * as React from "react";
import { cn } from "./cn";
import { FloatingObjects } from "./FloatingObjects";

/**
 * Lucht-sfeerlaag. Twee varianten:
 * - "pale" (default): subtiele lichtblauwe achtergrond voor rustige secties.
 * - "vivid": meeslepende blauwe hero-lucht (merkkleur) met witte tekst eroverheen.
 * Met `objects` zweven er school-spullen (boeken/schrijfgerei) overheen.
 * Puur decoratief (aria-hidden).
 */
export function SkyBackdrop({
  variant = "pale",
  objects = false,
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement> & {
  variant?: "pale" | "vivid" | "green";
  objects?: boolean;
}) {
  const bg =
    variant === "green" ? "hero-green" : variant === "vivid" ? "hero-sky" : "sky-backdrop";
  return (
    <div
      className={cn("relative isolate overflow-hidden", bg, className)}
      {...props}
    >
      {objects ? <FloatingObjects /> : <Clouds className={variant !== "pale" ? "opacity-90" : undefined} />}
      <div className="relative">{children}</div>
    </div>
  );
}

/** Losse, zachte wolk-blobs (te hergebruiken boven een eigen achtergrond). */
export function Clouds({ className }: { className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={cn("pointer-events-none absolute inset-0 -z-10 overflow-hidden", className)}
    >
      <div className="absolute -top-16 -left-10 h-64 w-64 rounded-full bg-white/60 blur-3xl" />
      <div className="absolute top-24 right-0 h-72 w-72 rounded-full bg-white/50 blur-3xl" />
      <div className="absolute bottom-0 left-1/3 h-80 w-[26rem] rounded-full bg-white/70 blur-3xl" />
    </div>
  );
}
