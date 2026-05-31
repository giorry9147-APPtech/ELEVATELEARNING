"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { roomUrl, type RecentSession } from "@/lib/rooms";
import { listSessions, deleteSession } from "@/lib/sessions";
import { useAuth } from "@/components/AuthProvider";

export default function Dashboard() {
  const { user, loading, enabled, signOut } = useAuth();
  const [sessions, setSessions] = useState<RecentSession[]>([]);
  const [copied, setCopied] = useState<string | null>(null);
  const [busy, setBusy] = useState(true);

  useEffect(() => {
    if (loading) return;
    // Bij ingeschakelde Supabase wachten we tot we de auth-status kennen.
    listSessions(user?.id ?? null).then((s) => {
      setSessions(s);
      setBusy(false);
    });
  }, [loading, user]);

  const remove = async (roomId: string) => {
    await deleteSession(roomId, user?.id ?? null);
    setSessions(await listSessions(user?.id ?? null));
  };

  const copy = async (roomId: string) => {
    await navigator.clipboard.writeText(roomUrl(roomId));
    setCopied(roomId);
    setTimeout(() => setCopied(null), 1500);
  };

  // Soft auth-gate: met Supabase actief maar niet ingelogd → vraag te loggen.
  const mustLogin = enabled && !loading && !user;

  return (
    <main className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-6 py-4">
          <Link href="/" className="flex items-center gap-2 font-bold text-slate-800">
            <span>📚</span> Bijles
          </Link>
          <div className="flex items-center gap-3">
            {user && (
              <>
                <span className="hidden text-sm text-slate-500 sm:inline">
                  {user.email}
                </span>
                <button
                  onClick={signOut}
                  className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-50"
                >
                  Uitloggen
                </button>
              </>
            )}
            <Link
              href="/"
              className="rounded-lg bg-sky-600 px-4 py-2 text-sm font-medium text-white hover:bg-sky-700"
            >
              + Nieuwe les
            </Link>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-4xl px-6 py-8">
        <h1 className="text-2xl font-bold text-slate-900">Mijn lessen</h1>
        {!enabled && (
          <p className="mt-1 text-sm text-amber-600">
            Lokale modus — deze lijst staat alleen op dit apparaat.
          </p>
        )}

        {mustLogin ? (
          <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-10 text-center">
            <p className="text-slate-600">Log in om je lessen te zien.</p>
            <Link
              href="/login"
              className="mt-3 inline-block rounded-lg bg-sky-600 px-4 py-2 text-sm font-medium text-white hover:bg-sky-700"
            >
              Inloggen
            </Link>
          </div>
        ) : busy ? (
          <p className="mt-8 text-slate-400">Laden…</p>
        ) : sessions.length === 0 ? (
          <div className="mt-8 rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center">
            <p className="text-slate-500">Nog geen lessen.</p>
            <Link
              href="/"
              className="mt-3 inline-block rounded-lg bg-sky-600 px-4 py-2 text-sm font-medium text-white hover:bg-sky-700"
            >
              Start je eerste les
            </Link>
          </div>
        ) : (
          <ul className="mt-6 space-y-3">
            {sessions.map((s) => (
              <li
                key={s.roomId}
                className="flex items-center justify-between rounded-xl border border-slate-200 bg-white p-4"
              >
                <div className="min-w-0">
                  <p className="truncate font-medium text-slate-800">{s.title}</p>
                  <p className="text-xs text-slate-400">
                    {new Date(s.createdAt).toLocaleString("nl-NL", {
                      dateStyle: "medium",
                      timeStyle: "short",
                    })}{" "}
                    · {s.roomId}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <button
                    onClick={() => copy(s.roomId)}
                    className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-50"
                  >
                    {copied === s.roomId ? "Gekopieerd!" : "Link"}
                  </button>
                  <Link
                    href={`/klas/${s.roomId}`}
                    className="rounded-lg bg-sky-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-sky-700"
                  >
                    Open
                  </Link>
                  <button
                    onClick={() => remove(s.roomId)}
                    className="rounded-lg px-2 py-1.5 text-sm text-slate-400 hover:text-red-600"
                    aria-label="Verwijderen"
                  >
                    ✕
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </main>
  );
}
