"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { getMyUsage, openPortal, type Usage } from "@/lib/billing";
import { planById } from "@/lib/plans";
import { Card } from "@/components/ui/Card";
import { Button, buttonClasses } from "@/components/ui/Button";

export default function BillingCard() {
  const [usage, setUsage] = useState<Usage | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    getMyUsage().then(setUsage);
  }, []);

  if (!usage) return null;

  const plan = planById(usage.plan);
  const pct =
    usage.minutesIncluded > 0
      ? Math.min(100, Math.round((usage.minutesUsed / usage.minutesIncluded) * 100))
      : 0;
  const low = pct >= 80;
  const over = pct >= 100;
  const barColor = over ? "var(--danger)" : low ? "var(--warning)" : "var(--brand)";

  const manage = async () => {
    setBusy(true);
    const url = await openPortal();
    setBusy(false);
    if (url) window.location.href = url;
  };

  return (
    <Card className="mt-6 p-5">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-muted-foreground">Abonnement</p>
          <p className="text-lg font-semibold text-foreground">{plan.name}</p>
        </div>
        <div className="flex gap-2">
          <Link href="/prijzen" className={buttonClasses({ variant: "secondary", size: "sm" })}>
            {usage.plan === "whitelabel" ? "Plannen" : "Upgrade"}
          </Link>
          {usage.plan !== "free" && (
            <Button onClick={manage} disabled={busy} variant="secondary" size="sm">
              {busy ? "…" : "Beheer"}
            </Button>
          )}
        </div>
      </div>

      <div className="mt-4">
        <div className="flex items-center justify-between text-sm">
          <span className="font-medium text-foreground">Lesminuten deze maand</span>
          <span className={over ? "text-danger" : low ? "text-warning" : "text-muted-foreground"}>
            {Math.round(usage.minutesUsed)} / {usage.minutesIncluded.toLocaleString("nl-NL")}
          </span>
        </div>
        <div className="mt-1.5 h-2.5 w-full overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full transition-all"
            style={{ width: `${pct}%`, backgroundColor: barColor }}
          />
        </div>
        {over ? (
          <p className="mt-2 text-sm text-danger">
            Je minuten zijn op.{" "}
            <Link href="/prijzen" className="font-medium underline">Upgrade</Link> om te blijven lesgeven.
          </p>
        ) : low ? (
          <p className="mt-2 text-sm text-warning">
            Nog {Math.max(0, Math.round(usage.minutesRemaining))} minuten over deze maand.
          </p>
        ) : null}
      </div>
    </Card>
  );
}
