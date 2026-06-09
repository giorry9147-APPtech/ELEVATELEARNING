"use client";

import { createContext, useContext, useEffect, useState } from "react";
import {
  brandingForHost,
  myBranding,
  PLATFORM_BRANDING,
  type Branding,
} from "@/lib/branding";
import { useAuth } from "@/components/AuthProvider";
import { LogoMark } from "@/components/ui/Logo";

const BrandingContext = createContext<Branding>(PLATFORM_BRANDING);

/**
 * Bepaalt de actieve branding (white-label):
 * 1. op de hostnaam (eigen domein van een tenant → geldt voor iedereen, ook
 *    anonieme leerlingen),
 * 2. anders, als de gebruiker is ingelogd, de branding van zijn eigen tenant.
 * De merkkleur wordt als CSS-variabele `--brand` toegepast.
 */
export function BrandingProvider({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const [branding, setBranding] = useState<Branding>(PLATFORM_BRANDING);

  useEffect(() => {
    if (loading) return;
    let cancelled = false;
    (async () => {
      const host =
        typeof window !== "undefined" ? window.location.hostname : "";
      let resolved = await brandingForHost(host);
      if (!resolved && user) resolved = await myBranding();
      if (!cancelled) setBranding(resolved ?? PLATFORM_BRANDING);
    })();
    return () => {
      cancelled = true;
    };
  }, [user, loading]);

  useEffect(() => {
    document.documentElement.style.setProperty("--brand", branding.brandColor);
  }, [branding.brandColor]);

  return (
    <BrandingContext.Provider value={branding}>
      {children}
    </BrandingContext.Provider>
  );
}

export function useBranding() {
  return useContext(BrandingContext);
}

/** Logo + naam, herbruikbaar in headers. `tone="light"` voor donkere/blauwe achtergrond. */
export function BrandMark({
  className = "",
  tone = "default",
}: {
  className?: string;
  tone?: "default" | "light";
}) {
  const b = useBranding();
  const light = tone === "light";
  return (
    <span
      className={`flex items-center gap-2.5 font-bold ${light ? "text-white" : "text-foreground"} ${className}`}
    >
      {b.logoUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={b.logoUrl} alt={b.name} className="h-8 w-auto object-contain" />
      ) : (
        <LogoMark size={32} mono={light} />
      )}
      <span>{b.name}</span>
    </span>
  );
}
