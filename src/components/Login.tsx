"use client";

import Link from "next/link";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { config } from "@/lib/config";

type Status = "idle" | "sending" | "sent" | "error";

/**
 * Wachtwoordloze login via magic link (Supabase) + invite-code voor de
 * gesloten demo-fase. Zonder Supabase-keys tonen we een duidelijke
 * "nog niet actief"-staat met instructies.
 */
export default function Login() {
  const [email, setEmail] = useState("");
  const [inviteCode, setInviteCode] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [message, setMessage] = useState("");

  const inviteError: Record<string, string> = {
    empty: "Vul een uitnodigingscode in.",
    not_found: "Deze code bestaat niet.",
    expired: "Deze code is verlopen.",
    exhausted: "Deze code is al maximaal gebruikt.",
    bad_request: "Er ging iets mis bij het controleren van de code.",
  };

  const send = async (e: React.FormEvent) => {
    e.preventDefault();
    const supabase = createClient();
    if (!supabase) {
      setStatus("error");
      setMessage("Login is nog niet actief — voeg eerst Supabase-keys toe.");
      return;
    }
    setStatus("sending");

    // 1) Valideer de uitnodigingscode server-side (RLS schermt de tabel af).
    const res = await fetch("/api/invite", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code: inviteCode.trim() }),
    });
    const invite = await res.json();
    if (!invite.valid) {
      setStatus("error");
      setMessage(inviteError[invite.reason] ?? "Ongeldige uitnodigingscode.");
      return;
    }

    // 2) Verstuur de magic link. Code + rol reizen mee als metadata en
    //    worden bij de callback toegepast op het profiel.
    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: {
        emailRedirectTo: `${config.appUrl}/auth/callback`,
        data: { invite_code: inviteCode.trim(), role: invite.role },
      },
    });
    if (error) {
      setStatus("error");
      setMessage(error.message);
    } else {
      setStatus("sent");
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
        <Link href="/" className="flex items-center gap-2 font-bold text-slate-800">
          <span>📚</span> Bijles
        </Link>
        <h1 className="mt-6 text-xl font-bold text-slate-900">Inloggen</h1>
        <p className="mt-1 text-sm text-slate-500">
          Geen wachtwoord nodig — je krijgt een veilige inloglink in je inbox.
        </p>

        {!config.supabase.enabled && (
          <div className="mt-4 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-700">
            Login is nog niet geactiveerd. Voeg{" "}
            <code className="rounded bg-amber-100 px-1">NEXT_PUBLIC_SUPABASE_URL</code>{" "}
            en de anon-key toe in{" "}
            <code className="rounded bg-amber-100 px-1">.env.local</code> om het
            in te schakelen.
          </div>
        )}

        {status === "sent" ? (
          <div className="mt-6 rounded-lg bg-emerald-50 px-4 py-4 text-sm text-emerald-700">
            ✅ Check je inbox — we hebben een inloglink gestuurd naar{" "}
            <strong>{email}</strong>.
          </div>
        ) : (
          <form onSubmit={send} className="mt-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700">
                E-mailadres
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="jij@voorbeeld.nl"
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-sky-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700">
                Uitnodigingscode{" "}
                <span className="font-normal text-slate-400">(demo-fase)</span>
              </label>
              <input
                value={inviteCode}
                onChange={(e) => setInviteCode(e.target.value)}
                placeholder="Bijv. TEAM-2026"
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-sky-500"
              />
            </div>

            {status === "error" && (
              <p className="text-sm text-red-600">{message}</p>
            )}

            <button
              type="submit"
              disabled={status === "sending"}
              className="w-full rounded-lg bg-sky-600 px-4 py-2 font-medium text-white hover:bg-sky-700 disabled:opacity-60"
            >
              {status === "sending" ? "Versturen…" : "Stuur inloglink"}
            </button>
          </form>
        )}
      </div>
    </main>
  );
}
