"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";

/**
 * Eenvoudige cookie-notice. Wij plaatsen alleen essentiële cookies (auth,
 * betaling) — die zijn toegestaan zonder voorafgaande toestemming — dus dit is
 * een informatiebanner. Bij toekomstige tracking-cookies wordt dit een echte
 * consent-keuze (opt-in).
 */
export default function CookieBanner() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    setShow(!localStorage.getItem("bijles:cookie-ok"));
  }, []);

  if (!show) return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-50 border-t border-border bg-surface/95 backdrop-blur">
      <div className="mx-auto flex max-w-4xl flex-col items-center gap-3 px-6 py-3 text-sm text-muted-foreground sm:flex-row sm:justify-between">
        <p>
          We gebruiken alleen essentiële cookies om in te loggen en betalingen te
          verwerken.{" "}
          <Link href="/cookies" className="text-brand underline">
            Meer info
          </Link>
          .
        </p>
        <Button
          size="sm"
          className="shrink-0"
          onClick={() => {
            localStorage.setItem("bijles:cookie-ok", "1");
            setShow(false);
          }}
        >
          Oké
        </Button>
      </div>
    </div>
  );
}
