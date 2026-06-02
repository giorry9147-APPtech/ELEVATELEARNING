"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { PLANS, PLAN_ORDER, type PlanId } from "@/lib/plans";
import { useAuth } from "@/components/AuthProvider";

export default function PricingTable() {
  const router = useRouter();
  const { user } = useAuth();
  const [busy, setBusy] = useState<PlanId | null>(null);
  const [error, setError] = useState("");

  const choose = async (planId: PlanId) => {
    setError("");
    if (planId === "free") {
      router.push(user ? "/dashboard" : "/login");
      return;
    }
    if (!user) {
      router.push("/login");
      return;
    }
    setBusy(planId);
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan: planId }),
      });
      const data = await res.json();
      if (data?.url) {
        window.location.href = data.url; // door naar Stripe Checkout
      } else {
        setError(data?.error ?? "Afrekenen is nog niet beschikbaar.");
      }
    } catch {
      setError("Er ging iets mis. Probeer het later opnieuw.");
    } finally {
      setBusy(null);
    }
  };

  const featureLine = (ok: boolean, label: string) => (
    <li className={`flex items-center gap-2 ${ok ? "text-slate-700" : "text-slate-300"}`}>
      <span>{ok ? "✓" : "—"}</span> {label}
    </li>
  );

  return (
    <>
      {error && (
        <p className="mb-4 rounded-lg bg-amber-50 px-3 py-2 text-center text-sm text-amber-700">
          {error}
        </p>
      )}
      <div className="grid gap-6 lg:grid-cols-4">
        {PLAN_ORDER.map((id) => {
          const p = PLANS[id];
          return (
            <div
              key={id}
              className={`flex flex-col rounded-2xl border bg-white p-6 shadow-sm ${
                p.highlight ? "border-sky-500 ring-1 ring-sky-500" : "border-slate-200"
              }`}
            >
              {p.highlight && (
                <span className="mb-2 inline-block w-fit rounded-full bg-sky-100 px-2 py-0.5 text-xs font-medium text-sky-700">
                  Populair
                </span>
              )}
              <h3 className="font-semibold text-slate-800">{p.name}</h3>
              <div className="mt-2">
                <span className="text-3xl font-bold text-slate-900">€{p.priceEur}</span>
                <span className="text-sm text-slate-500">/mnd</span>
              </div>
              <p className="mt-1 text-sm text-slate-500">{p.blurb}</p>

              <ul className="mt-4 space-y-1.5 text-sm">
                <li className="flex items-center gap-2 font-medium text-slate-700">
                  <span>⏱️</span> {p.minutesIncluded.toLocaleString("nl-NL")} lesminuten
                </li>
                <li className="flex items-center gap-2 text-slate-700">
                  <span>👤</span> {p.seats} docent{p.seats > 1 ? "en" : ""}
                </li>
                {featureLine(true, "Whiteboard + video + chat")}
                {featureLine(p.features.recording, "Opname")}
                {featureLine(p.features.whitelabel, "Eigen domein + huisstijl")}
                {featureLine(p.features.assignments, "Opdrachten & voortgang")}
                {p.overagePerMinuteEur > 0 && (
                  <li className="text-xs text-slate-400">
                    Daarna €{p.overagePerMinuteEur.toFixed(2).replace(".", ",")}/min
                  </li>
                )}
              </ul>

              <button
                onClick={() => choose(id)}
                disabled={busy === id}
                style={p.highlight ? { backgroundColor: "var(--brand)" } : undefined}
                className={`mt-6 rounded-lg px-4 py-2 text-sm font-medium disabled:opacity-60 ${
                  p.highlight
                    ? "text-white hover:brightness-95"
                    : "border border-slate-300 text-slate-700 hover:bg-slate-50"
                }`}
              >
                {busy === id
                  ? "Bezig…"
                  : id === "free"
                    ? "Gratis starten"
                    : "Kies " + p.name}
              </button>
            </div>
          );
        })}
      </div>
    </>
  );
}
