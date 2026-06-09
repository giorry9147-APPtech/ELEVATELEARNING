"use client";

import { useState } from "react";

/**
 * Wiskunde-toetsenbord voor het whiteboard. Voegt wiskundige symbolen in op
 * de cursorpositie van Excalidraw's actieve tekstvak (`textarea.excalidraw-wysiwyg`).
 *
 * Werking: de symboolknoppen gebruiken onMouseDown + preventDefault, zodat het
 * tekstvak zijn focus houdt (anders sluit Excalidraw de tekstinvoer). Daarna
 * schrijven we het symbool met setRangeText en triggeren we een 'input'-event
 * zodat Excalidraw de tekst bijwerkt.
 */

const GROUPS: { label: string; symbols: string[] }[] = [
  {
    label: "Basis",
    symbols: ["+", "−", "×", "÷", "=", "≠", "±", "·", "√", "%", "(", ")"],
  },
  {
    label: "Vergelijken",
    symbols: ["<", ">", "≤", "≥", "≈", "≡", "∝", "∞"],
  },
  {
    label: "Machten & breuken",
    symbols: ["²", "³", "⁴", "ⁿ", "₁", "₂", "ₙ", "½", "⅓", "¼", "¾", "⅔"],
  },
  {
    label: "Grieks",
    symbols: ["π", "α", "β", "γ", "δ", "θ", "λ", "μ", "σ", "φ", "ω", "Δ", "Σ", "Ω", "Π"],
  },
  {
    label: "Analyse & logica",
    symbols: [
      "∫", "∑", "∏", "∂", "∇", "∈", "∉", "⊂", "⊆", "∪", "∩", "∅",
      "∀", "∃", "→", "⇒", "⇔", "∠", "°", "′", "″", "⊥", "∥",
    ],
  },
];

function insertSymbol(sym: string): boolean {
  const ta = document.querySelector(
    "textarea.excalidraw-wysiwyg",
  ) as HTMLTextAreaElement | null;
  if (!ta) return false;
  const start = ta.selectionStart ?? ta.value.length;
  const end = ta.selectionEnd ?? ta.value.length;
  ta.setRangeText(sym, start, end, "end");
  ta.dispatchEvent(new Event("input", { bubbles: true }));
  ta.focus();
  return true;
}

export default function MathKeyboard() {
  const [open, setOpen] = useState(false);
  const [hint, setHint] = useState(false);

  const handleSymbol = (e: React.MouseEvent, sym: string) => {
    e.preventDefault(); // behoud focus op het tekstvak
    if (!insertSymbol(sym)) {
      setHint(true);
      setTimeout(() => setHint(false), 2600);
    }
  };

  return (
    <div className="pointer-events-none absolute bottom-3 left-1/2 z-20 -translate-x-1/2">
      {open && (
        <div className="pointer-events-auto mb-2 max-h-72 w-[min(92vw,420px)] overflow-y-auto rounded-2xl border border-border bg-surface p-3 shadow-soft-lg">
          {hint && (
            <p className="mb-2 rounded-xl bg-amber-50 px-2 py-1.5 text-xs text-warning">
              Kies eerst de tekst-tool (toets <strong>T</strong> of <strong>8</strong>)
              en klik op het bord om te typen.
            </p>
          )}
          {GROUPS.map((g) => (
            <div key={g.label} className="mb-2 last:mb-0">
              <div className="mb-1 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                {g.label}
              </div>
              <div className="flex flex-wrap gap-1">
                {g.symbols.map((s) => (
                  <button
                    key={s}
                    onMouseDown={(e) => handleSymbol(e, s)}
                    className="flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-muted text-base text-foreground transition hover:bg-brand-soft hover:text-brand-strong"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      <button
        onClick={() => setOpen((o) => !o)}
        className={`pointer-events-auto flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-medium shadow-soft-lg transition ${
          open
            ? "bg-foreground text-background"
            : "bg-surface text-foreground ring-1 ring-border hover:bg-muted"
        }`}
      >
        <span className="text-base">∑</span>
        {open ? "Sluiten" : "Wiskunde"}
      </button>
    </div>
  );
}
