"use client";

import Link from "next/link";
import { useAuth } from "@/components/AuthProvider";

export default function LandingNav() {
  const { user, loading, signOut } = useAuth();

  return (
    <nav className="flex items-center gap-4 text-sm">
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
          className="rounded-lg bg-sky-600 px-4 py-2 font-medium text-white hover:bg-sky-700"
        >
          Inloggen
        </Link>
      )}
    </nav>
  );
}
