import * as React from "react";
import { cn } from "./cn";

/*
 * Bewegende school-objecten voor de hero: boeken, schrijfgerei en dingen die
 * in de klas horen, die zachtjes op en neer zweven. Puur decoratief
 * (aria-hidden). Vaste posities (geen random → stabiel bij SSR/hydration).
 * Respecteert prefers-reduced-motion (globale CSS zet animaties dan stil).
 */
type FloatItem = {
  emoji: string;
  /** positie in % */
  top: string;
  left?: string;
  right?: string;
  size: string;
  dur: string;
  delay: string;
  rot: string;
  opacity?: number;
};

const ITEMS: FloatItem[] = [
  { emoji: "📚", top: "16%", left: "6%", size: "3rem", dur: "7s", delay: "0s", rot: "-8deg" },
  { emoji: "✏️", top: "62%", left: "10%", size: "2.5rem", dur: "6s", delay: "0.6s", rot: "12deg" },
  { emoji: "📐", top: "30%", left: "20%", size: "2.25rem", dur: "8s", delay: "1.2s", rot: "6deg", opacity: 0.9 },
  { emoji: "🎓", top: "10%", right: "30%", size: "2.75rem", dur: "7.5s", delay: "0.3s", rot: "-5deg" },
  { emoji: "📖", top: "74%", left: "30%", size: "2.25rem", dur: "6.5s", delay: "1.6s", rot: "-10deg", opacity: 0.85 },
  { emoji: "🧮", top: "22%", right: "8%", size: "2.5rem", dur: "8.5s", delay: "0.9s", rot: "8deg" },
  { emoji: "🖍️", top: "70%", right: "12%", size: "2.5rem", dur: "7s", delay: "0.2s", rot: "-12deg" },
  { emoji: "📝", top: "44%", right: "22%", size: "2.25rem", dur: "6.8s", delay: "1.4s", rot: "10deg", opacity: 0.9 },
  { emoji: "🔬", top: "52%", left: "3%", size: "2.25rem", dur: "8.2s", delay: "0.5s", rot: "5deg", opacity: 0.85 },
  { emoji: "🌍", top: "86%", right: "32%", size: "2.5rem", dur: "7.3s", delay: "1.1s", rot: "-6deg", opacity: 0.8 },
];

export function FloatingObjects({ className }: { className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={cn("pointer-events-none absolute inset-0 -z-10 overflow-hidden", className)}
    >
      {ITEMS.map((it, i) => (
        <span
          key={i}
          className="floaty absolute drop-shadow-[0_8px_16px_rgba(15,42,87,0.18)] select-none"
          style={
            {
              top: it.top,
              left: it.left,
              right: it.right,
              fontSize: it.size,
              opacity: it.opacity ?? 1,
              "--dur": it.dur,
              "--delay": it.delay,
              "--rot": it.rot,
            } as React.CSSProperties
          }
        >
          {it.emoji}
        </span>
      ))}
    </div>
  );
}
