"use client";

import Link from "next/link";
import { useAuth } from "@/components/AuthProvider";
import { buttonClasses } from "@/components/ui/Button";
import { cn } from "@/components/ui/cn";

/**
 * Inhoud van de zwevende navbar-pill: gecentreerde links + rechts de CTA.
 * Wordt als 2 grid-kinderen geplaatst (kolom "links midden" + "CTA rechts");
 * het logo staat als eerste kolom in de header zelf.
 */
export default function LandingNav({
  onDark = false,
  accent = "brand",
}: {
  onDark?: boolean;
  accent?: "brand" | "green";
}) {
  const { user, loading, signOut } = useAuth();

  const link = cn(
    "rounded-full px-3.5 py-2 font-medium transition",
    onDark
      ? "text-white/85 hover:bg-white/15 hover:text-white"
      : "text-muted-foreground hover:bg-black/5 hover:text-foreground",
  );

  const whitePill =
    "inline-flex h-9 items-center justify-center gap-2 rounded-full bg-white px-4 text-sm font-medium text-brand shadow-soft transition hover:bg-white/90";
  const greenPill =
    "btn-green inline-flex h-9 items-center justify-center gap-2 rounded-full px-4 text-sm font-medium transition";
  const cta = onDark
    ? whitePill
    : accent === "green"
      ? greenPill
      : buttonClasses({ variant: "primary", size: "sm" });

  const ghost = cn(
    "hidden h-9 items-center rounded-full px-4 text-sm font-medium transition sm:inline-flex",
    onDark
      ? "text-white/90 hover:bg-white/15 hover:text-white"
      : "text-muted-foreground hover:bg-black/5 hover:text-foreground",
  );

  return (
    <>
      <nav className="hidden items-center justify-center gap-1 text-sm md:flex">
        <Link href="/prijzen" className={link}>
          Prijzen
        </Link>
        <Link href="/dashboard" className={link}>
          Mijn lessen
        </Link>
        <Link href="/voorwaarden" className={link}>
          Voorwaarden
        </Link>
      </nav>

      <div className="flex items-center justify-end gap-1 justify-self-end">
        {loading ? null : user ? (
          <button onClick={signOut} className={cta}>
            Uitloggen
          </button>
        ) : (
          <>
            <Link href="/login" className={ghost}>
              Inloggen
            </Link>
            <Link href="/login" className={cta}>
              Aan de slag
            </Link>
          </>
        )}
      </div>
    </>
  );
}
