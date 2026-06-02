import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { stripe, planForPrice } from "@/lib/stripe/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { PLANS } from "@/lib/plans";

/**
 * Stripe-webhook: houdt abonnementsstatus + plan/features in Supabase bij.
 * Toegang verlenen gebeurt op WEBHOOK-bevestigde status, niet op de
 * checkout-redirect. Schrijven via de service-role (admin) client.
 */
export async function POST(request: Request) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET ?? "";
  if (!stripe || !secret) {
    return NextResponse.json({ error: "not_configured" }, { status: 503 });
  }

  const sig = request.headers.get("stripe-signature") ?? "";
  const raw = await request.text();

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(raw, sig, secret);
  } catch {
    return NextResponse.json({ error: "invalid_signature" }, { status: 400 });
  }

  const admin = createAdminClient();
  if (!admin) return NextResponse.json({ error: "no_admin" }, { status: 500 });

  async function applySubscription(sub: Stripe.Subscription) {
    const orgId = sub.metadata?.org_id;
    if (!orgId) return;
    const priceId = sub.items.data[0]?.price?.id;
    const plan = planForPrice(priceId);
    const periodEnd = sub.items.data[0]?.current_period_end ?? null;
    const periodStart = sub.items.data[0]?.current_period_start ?? null;
    const active = sub.status === "active" || sub.status === "trialing";

    await admin!.from("subscriptions").upsert(
      {
        org_id: orgId,
        stripe_customer_id: sub.customer as string,
        stripe_subscription_id: sub.id,
        status: sub.status,
        plan: active ? plan : "free",
        minutes_included: active ? PLANS[plan].minutesIncluded : PLANS.free.minutesIncluded,
        current_period_start: periodStart ? new Date(periodStart * 1000).toISOString() : null,
        current_period_end: periodEnd ? new Date(periodEnd * 1000).toISOString() : null,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "org_id" },
    );

    // Plan + features op de tenant zetten (gating voor white-label/modules).
    await admin!
      .from("organizations")
      .update({
        plan: active ? plan : "free",
        features: active ? PLANS[plan].features : PLANS.free.features,
      })
      .eq("id", orgId);
  }

  switch (event.type) {
    case "customer.subscription.created":
    case "customer.subscription.updated":
    case "customer.subscription.deleted":
      await applySubscription(event.data.object as Stripe.Subscription);
      break;
    default:
      break;
  }

  return NextResponse.json({ received: true });
}
