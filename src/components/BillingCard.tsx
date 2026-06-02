"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { getMyUsage, openPortal, type Usage } from "@/lib/billing";
import { planById } from "@/lib/plans";

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
  const barColor = over ? "#dc2626" : low ? "#d97706" : "var(--brand)";

  const manage = async () => {
    setBusy(true);
    const url = await openPortal();
    setBusy(false);
    if (url) window.location.href = url;
  };

  return (
    <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-5">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-slate-500">Abonnement</p>
          <p className="text-lg font-semibold text-slate-800">{plan.name}</p>
        </div>
        <div className="flex gap-2">
          <Link
            href="/prijzen"
            className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            {usage.plan === "whitelabel" ? "Plannen" : "Upgrade"}
          </Link>
          {usage.plan !== "free" && (
            <button
              onClick={manage}
              disabled={busy}
              className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-60"
            >
              {busy ? "…" : "Beheer"}
            </button>
          )}
        </div>
      </div>

      <div className="mt-4">
        <div className="flex items-center justify-between text-sm">
          <span className="font-medium text-slate-700">Lesminuten deze maand</span>
          <span className={over ? "text-red-600" : low ? "text-amber-600" : "text-slate-500"}>
            {Math.round(usage.minutesUsed)} / {usage.minutesIncluded.toLocaleString("nl-NL")}
          </span>
        </div>
        <div className="mt-1.5 h-2.5 w-full overflow-hidden rounded-full bg-slate-100">
          <div
            className="h-full rounded-full transition-all"
            style={{ width: `${pct}%`, backgroundColor: barColor }}
          />
        </div>
        {over ? (
          <p className="mt-2 text-sm text-red-600">
            Je minuten zijn op. <Link href="/prijzen" className="font-medium underline">Upgrade</Link> om te blijven lesgeven.
          </p>
        ) : low ? (
          <p className="mt-2 text-sm text-amber-600">
            Nog {Math.max(0, Math.round(usage.minutesRemaining))} minuten over deze maand.
          </p>
        ) : null}
      </div>
    </div>
  );
}
