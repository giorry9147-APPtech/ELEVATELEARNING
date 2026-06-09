"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { PLANS, PLAN_ORDER, type PlanId } from "@/lib/plans";
import { useAuth } from "@/components/AuthProvider";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { cn } from "@/components/ui/cn";
import { CheckIcon, ClockIcon, UsersIcon } from "@/components/ui/icons";

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
    <li
      className={cn(
        "flex items-center gap-2",
        ok ? "text-foreground" : "text-muted-foreground/50",
      )}
    >
      <CheckIcon
        size={16}
        className={ok ? "shrink-0 text-success" : "shrink-0 text-muted-foreground/30"}
      />
      {label}
    </li>
  );

  return (
    <>
      {error && (
        <p className="mb-4 rounded-xl bg-amber-50 px-3 py-2 text-center text-sm text-warning">
          {error}
        </p>
      )}
      <div className="grid items-stretch gap-5 lg:grid-cols-4">
        {PLAN_ORDER.map((id) => {
          const p = PLANS[id];
          return (
            <Card
              key={id}
              className={cn(
                "flex flex-col p-6",
                p.highlight && "ring-2 ring-brand",
              )}
            >
              {p.highlight && (
                <Badge className="mb-2">Populair</Badge>
              )}
              <h3 className="font-semibold text-foreground">{p.name}</h3>
              <div className="mt-2 flex items-baseline gap-1">
                <span className="text-4xl font-bold tracking-tight text-foreground">
                  €{p.priceEur}
                </span>
                <span className="text-sm text-muted-foreground">/mnd</span>
              </div>
              <p className="mt-1 text-sm text-muted-foreground">{p.blurb}</p>

              <ul className="mt-5 space-y-2 text-sm">
                <li className="flex items-center gap-2 font-medium text-foreground">
                  <ClockIcon size={16} className="shrink-0 text-brand" />
                  {p.minutesIncluded.toLocaleString("nl-NL")} lesminuten
                </li>
                <li className="flex items-center gap-2 text-foreground">
                  <UsersIcon size={16} className="shrink-0 text-brand" />
                  {p.seats} docent{p.seats > 1 ? "en" : ""}
                </li>
                {featureLine(true, "Whiteboard + video + chat")}
                {featureLine(p.features.recording, "Opname")}
                {featureLine(p.features.whitelabel, "Eigen domein + huisstijl")}
                {featureLine(p.features.assignments, "Opdrachten & voortgang")}
                {p.overagePerMinuteEur > 0 && (
                  <li className="text-xs text-muted-foreground">
                    Daarna €{p.overagePerMinuteEur.toFixed(2).replace(".", ",")}/min
                  </li>
                )}
              </ul>

              <Button
                onClick={() => choose(id)}
                disabled={busy === id}
                variant={p.highlight ? "primary" : "secondary"}
                fullWidth
                className="mt-6"
              >
                {busy === id
                  ? "Bezig…"
                  : id === "free"
                    ? "Gratis starten"
                    : "Kies " + p.name}
              </Button>
            </Card>
          );
        })}
      </div>
    </>
  );
}
