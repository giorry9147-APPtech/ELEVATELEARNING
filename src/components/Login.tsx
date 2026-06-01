"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { config } from "@/lib/config";

type Mode = "login" | "signup";

/**
 * Inloggen met e-mail + wachtwoord. Nieuwe accounts worden server-side
 * aangemaakt (/api/signup) met een geldige uitnodigingscode — zonder
 * bevestigingsmail. Daarna direct inloggen met signInWithPassword.
 */
export default function Login() {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [inviteCode, setInviteCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    const supabase = createClient();
    if (!supabase) {
      setError("Login is nog niet actief — voeg eerst Supabase-keys toe.");
      return;
    }
    setBusy(true);
    try {
      if (mode === "signup") {
        // 1) Account server-side aanmaken (invite-gated, zonder e-mail).
        const res = await fetch("/api/signup", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password, code: inviteCode.trim() }),
        });
        const data = await res.json();
        if (!res.ok) {
          setError(data?.error ?? "Aanmaken mislukt.");
          return;
        }
      }

      // 2) Inloggen met e-mail + wachtwoord.
      const { error: signInErr } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });
      if (signInErr) {
        setError(
          mode === "login"
            ? "Onjuist e-mailadres of wachtwoord."
            : signInErr.message,
        );
        return;
      }
      router.push("/dashboard");
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
        <Link href="/" className="flex items-center gap-2 font-bold text-slate-800">
          <span>📚</span> Bijles
        </Link>
        <h1 className="mt-6 text-xl font-bold text-slate-900">
          {mode === "login" ? "Inloggen" : "Account aanmaken"}
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          {mode === "login"
            ? "Log in met je e-mailadres en wachtwoord."
            : "Maak een account met je uitnodigingscode."}
        </p>

        {!config.supabase.enabled && (
          <div className="mt-4 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-700">
            Login is nog niet geactiveerd (Supabase-keys ontbreken).
          </div>
        )}

        <form onSubmit={submit} className="mt-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700">
              E-mailadres
            </label>
            <input
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="jij@voorbeeld.nl"
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-sky-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700">
              Wachtwoord
            </label>
            <input
              type="password"
              required
              minLength={6}
              autoComplete={mode === "login" ? "current-password" : "new-password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Minstens 6 tekens"
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-sky-500"
            />
          </div>
          {mode === "signup" && (
            <div>
              <label className="block text-sm font-medium text-slate-700">
                Uitnodigingscode
              </label>
              <input
                value={inviteCode}
                onChange={(e) => setInviteCode(e.target.value)}
                placeholder="Bijv. TEAM-2026"
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-sky-500"
              />
            </div>
          )}

          {error && <p className="text-sm text-red-600">{error}</p>}

          <button
            type="submit"
            disabled={busy}
            className="w-full rounded-lg bg-sky-600 px-4 py-2 font-medium text-white hover:bg-sky-700 disabled:opacity-60"
          >
            {busy
              ? "Bezig…"
              : mode === "login"
                ? "Inloggen"
                : "Account aanmaken"}
          </button>
        </form>

        <p className="mt-4 text-center text-sm text-slate-500">
          {mode === "login" ? (
            <>
              Nog geen account?{" "}
              <button
                onClick={() => {
                  setMode("signup");
                  setError("");
                }}
                className="font-medium text-sky-600 hover:underline"
              >
                Aanmaken
              </button>
            </>
          ) : (
            <>
              Al een account?{" "}
              <button
                onClick={() => {
                  setMode("login");
                  setError("");
                }}
                className="font-medium text-sky-600 hover:underline"
              >
                Inloggen
              </button>
            </>
          )}
        </p>
      </div>
    </main>
  );
}
