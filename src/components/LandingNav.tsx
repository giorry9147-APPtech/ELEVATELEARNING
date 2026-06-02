"use client";

import Link from "next/link";
import { useAuth } from "@/components/AuthProvider";

export default function LandingNav() {
  const { user, loading, signOut } = useAuth();

  return (
    <nav className="flex items-center gap-4 text-sm">
      <Link href="/prijzen" className="text-slate-600 hover:text-slate-900">
        Prijzen
      </Link>
      <Link href="/dashboard" className="text-slate-600 hover:text-slate-900">
        Mijn lessen
      </Link>
      {loading ? null : user ? (
        <button
          onClick={signOut}
          className="rounded-lg border border-slate-300 px-4 py-2 font-medium text-slate-700 hover:bg-slate-50"
        >
          Uitloggen
        </button>
      ) : (
        <Link
          href="/login"
          style={{ backgroundColor: "var(--brand)" }}
          className="rounded-lg px-4 py-2 font-medium text-white brightness-100 hover:brightness-95"
        >
          Inloggen
        </Link>
      )}
    </nav>
  );
}
