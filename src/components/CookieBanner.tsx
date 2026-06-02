"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

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
    <div className="fixed inset-x-0 bottom-0 z-50 border-t border-slate-200 bg-white/95 backdrop-blur">
      <div className="mx-auto flex max-w-4xl flex-col items-center gap-3 px-6 py-3 text-sm text-slate-600 sm:flex-row sm:justify-between">
        <p>
          We gebruiken alleen essentiële cookies om in te loggen en betalingen te
          verwerken.{" "}
          <Link href="/cookies" className="text-sky-600 underline">
            Meer info
          </Link>
          .
        </p>
        <button
          onClick={() => {
            localStorage.setItem("bijles:cookie-ok", "1");
            setShow(false);
          }}
          style={{ backgroundColor: "var(--brand)" }}
          className="shrink-0 rounded-lg px-4 py-1.5 font-medium text-white hover:brightness-95"
        >
          Oké
        </button>
      </div>
    </div>
  );
}
