import { NextResponse } from "next/server";
import { stripe, priceForPlan } from "@/lib/stripe/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { config } from "@/lib/config";
import type { PlanId } from "@/lib/plans";

/**
 * Start een Stripe Checkout-sessie (subscription) voor het gekozen plan.
 * iDEAL + kaart; bij iDEAL zet Stripe automatisch een SEPA-mandaat op voor de
 * terugkerende incasso. Het abonnement wordt pas actief op de webhook.
 */
export async function POST(request: Request) {
  if (!stripe) {
    return NextResponse.json(
      { error: "Afrekenen is nog niet gekoppeld — Stripe komt eraan." },
      { status: 503 },
    );
  }

  let plan: PlanId = "starter";
  try {
    const body = await request.json();
    plan = body?.plan as PlanId;
  } catch {
    return NextResponse.json({ error: "bad_request" }, { status: 400 });
  }

  const priceId = priceForPlan(plan);
  if (!priceId) {
    return NextResponse.json({ error: "Onbekend plan." }, { status: 400 });
  }

  // Ingelogde gebruiker + tenant ophalen.
  const supabase = await createClient();
  if (!supabase) {
    return NextResponse.json({ error: "Auth niet beschikbaar." }, { status: 500 });
  }
  const { data: auth } = await supabase.auth.getUser();
  const user = auth.user;
  if (!user) {
    return NextResponse.json({ error: "Log eerst in." }, { status: 401 });
  }
  const { data: membership } = await supabase
    .from("org_members")
    .select("org_id")
    .eq("user_id", user.id)
    .limit(1)
    .maybeSingle();
  const orgId = membership?.org_id as string | undefined;
  if (!orgId) {
    return NextResponse.json({ error: "Geen lesomgeving gevonden." }, { status: 400 });
  }

  // Bestaande Stripe-customer hergebruiken of aanmaken.
  const admin = createAdminClient();
  let customerId: string | undefined;
  if (admin) {
    const { data: sub } = await admin
      .from("subscriptions")
      .select("stripe_customer_id")
      .eq("org_id", orgId)
      .maybeSingle();
    customerId = sub?.stripe_customer_id ?? undefined;
  }
  if (!customerId) {
    const customer = await stripe.customers.create({
      email: user.email ?? undefined,
      metadata: { org_id: orgId },
    });
    customerId = customer.id;
    await admin?.from("subscriptions").upsert(
      { org_id: orgId, stripe_customer_id: customerId },
      { onConflict: "org_id" },
    );
  }

  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    customer: customerId,
    line_items: [{ price: priceId, quantity: 1 }],
    payment_method_types: ["card", "ideal"],
    success_url: `${config.appUrl}/dashboard?checkout=success`,
    cancel_url: `${config.appUrl}/prijzen`,
    metadata: { org_id: orgId, plan },
    subscription_data: { metadata: { org_id: orgId, plan } },
    allow_promotion_codes: true,
  });

  return NextResponse.json({ url: session.url });
}
