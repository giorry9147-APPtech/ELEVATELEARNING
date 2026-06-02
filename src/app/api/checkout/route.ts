import { NextResponse } from "next/server";

/**
 * Start een Stripe Checkout-sessie voor het gekozen plan.
 *
 * NOG NIET GEKOPPELD: zonder STRIPE_SECRET_KEY geven we een nette melding
 * terug. Zodra de Stripe-keys + price-id's zijn ingesteld, implementeren we
 * hier de echte Checkout-sessie (subscription mode, iDEAL + kaart).
 */
export async function POST() {
  const configured = Boolean(process.env.STRIPE_SECRET_KEY);
  if (!configured) {
    return NextResponse.json(
      { error: "Afrekenen is nog niet gekoppeld — Stripe komt eraan." },
      { status: 503 },
    );
  }

  // TODO (volgende stap, met keys): Stripe Checkout-sessie aanmaken.
  return NextResponse.json(
    { error: "Checkout wordt binnenkort geactiveerd." },
    { status: 501 },
  );
}
