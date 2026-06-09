"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { config } from "@/lib/config";
import { BrandMark } from "@/components/BrandingProvider";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input, Label } from "@/components/ui/Input";
import { SkyBackdrop } from "@/components/ui/SkyBackdrop";

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
      // Nieuwe docenten gaan eerst door de onboarding-wizard.
      router.push(mode === "signup" ? "/welkom" : "/dashboard");
    } finally {
      setBusy(false);
    }
  };

  return (
    <SkyBackdrop variant="green" objects className="flex min-h-screen flex-col items-center justify-center px-4 py-10">
      <Link href="/" className="mb-6">
        <BrandMark className="text-lg" />
      </Link>
      <Card className="w-full max-w-md p-8">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          {mode === "login" ? "Inloggen" : "Account aanmaken"}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {mode === "login"
            ? "Log in met je e-mailadres en wachtwoord."
            : "Maak een account met je uitnodigingscode."}
        </p>

        {!config.supabase.enabled && (
          <div className="mt-4 rounded-xl bg-amber-50 px-3 py-2 text-sm text-warning">
            Login is nog niet geactiveerd (Supabase-keys ontbreken).
          </div>
        )}

        <form onSubmit={submit} className="mt-6 space-y-4">
          <div>
            <Label htmlFor="email">E-mailadres</Label>
            <Input
              id="email"
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="jij@voorbeeld.nl"
            />
          </div>
          <div>
            <Label htmlFor="password">Wachtwoord</Label>
            <Input
              id="password"
              type="password"
              required
              minLength={6}
              autoComplete={mode === "login" ? "current-password" : "new-password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Minstens 6 tekens"
            />
          </div>
          {mode === "signup" && (
            <div>
              <Label htmlFor="invite">Uitnodigingscode</Label>
              <Input
                id="invite"
                value={inviteCode}
                onChange={(e) => setInviteCode(e.target.value)}
                placeholder="Bijv. TEAM-2026"
              />
            </div>
          )}

          {error && <p className="text-sm text-danger">{error}</p>}

          <Button type="submit" disabled={busy} fullWidth>
            {busy
              ? "Bezig…"
              : mode === "login"
                ? "Inloggen"
                : "Account aanmaken"}
          </Button>
        </form>

        <p className="mt-5 text-center text-sm text-muted-foreground">
          {mode === "login" ? (
            <>
              Nog geen account?{" "}
              <button
                onClick={() => {
                  setMode("signup");
                  setError("");
                }}
                className="font-medium text-brand hover:underline"
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
                className="font-medium text-brand hover:underline"
              >
                Inloggen
              </button>
            </>
          )}
        </p>
      </Card>
    </SkyBackdrop>
  );
}
