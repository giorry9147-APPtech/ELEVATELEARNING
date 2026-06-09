"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Container } from "@/components/ui/Container";
import { Card } from "@/components/ui/Card";
import { buttonClasses } from "@/components/ui/Button";
import { SkyBackdrop } from "@/components/ui/SkyBackdrop";
import { CheckIcon, ClockIcon } from "@/components/ui/icons";

export default function PaymentResult() {
  const params = useSearchParams();
  const sessionId = params.get("session_id");
  const acct = params.get("acct");
  const [state, setState] = useState<"loading" | "paid" | "pending">("loading");
  const [info, setInfo] = useState<{ amount: number | null; currency: string | null }>({
    amount: null,
    currency: null,
  });

  useEffect(() => {
    if (!sessionId || !acct) {
      setState("pending");
      return;
    }
    fetch("/api/packages/finalize", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sessionId, acct }),
    })
      .then((r) => r.json())
      .then((d) => {
        setState(d?.paid ? "paid" : "pending");
        setInfo({ amount: d?.amount ?? null, currency: d?.currency ?? null });
      })
      .catch(() => setState("pending"));
  }, [sessionId, acct]);

  const amount =
    info.amount != null && info.currency
      ? new Intl.NumberFormat("nl-NL", { style: "currency", currency: info.currency.toUpperCase() }).format(
          info.amount / 100,
        )
      : null;

  return (
    <SkyBackdrop variant="green" className="flex min-h-screen flex-col items-center justify-center px-4 py-10">
      <Container size="md">
        <Card className="mx-auto max-w-md p-8 text-center">
          {state === "loading" ? (
            <p className="text-muted-foreground">Betaling controleren…</p>
          ) : state === "paid" ? (
            <>
              <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-green-50 text-success">
                <CheckIcon size={30} />
              </span>
              <h1 className="mt-4 text-2xl font-bold tracking-tight text-foreground">Betaling gelukt</h1>
              <p className="mt-2 text-muted-foreground">
                Bedankt! Je betaling{amount ? ` van ${amount}` : ""} is ontvangen. Je docent neemt
                contact op om de lessen in te plannen.
              </p>
            </>
          ) : (
            <>
              <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-amber-50 text-warning">
                <ClockIcon size={30} />
              </span>
              <h1 className="mt-4 text-2xl font-bold tracking-tight text-foreground">Betaling in behandeling</h1>
              <p className="mt-2 text-muted-foreground">
                Je betaling wordt verwerkt. Zodra deze rond is, ontvang je een bevestiging per e-mail.
              </p>
            </>
          )}
          <Link href="/" className={buttonClasses({ variant: "secondary", className: "mt-6" })}>
            Naar de homepage
          </Link>
        </Card>
      </Container>
    </SkyBackdrop>
  );
}
