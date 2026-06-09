import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { stripe } from "@/lib/stripe/server";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Connect-webhook: events van de aangesloten docent-accounts (directe charges).
 * Markeert pakket-aankopen betrouwbaar als betaald — ook als de leerling de tab
 * sluit vóór terugkeer, en bij vertraagde iDEAL-betalingen. Idempotent.
 *
 * Aparte signing-secret t.o.v. de platform-webhook (Connect = "Connected
 * accounts"-endpoint in Stripe). Zet `STRIPE_CONNECT_WEBHOOK_SECRET`.
 */
export async function POST(request: Request) {
  const secret = process.env.STRIPE_CONNECT_WEBHOOK_SECRET ?? "";
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

  async function settle(session: Stripe.Checkout.Session, status: "paid" | "failed") {
    let studentId: string | null = null;
    if (status === "paid") {
      const orgId = (session.metadata?.org_id as string) || null;
      const email =
        (session.metadata?.buyer_email as string) || session.customer_email || null;
      if (orgId && email) {
        const { data: stu } = await admin!
          .from("students")
          .select("id")
          .eq("org_id", orgId)
          .eq("email", email)
          .maybeSingle();
        studentId = (stu?.id as string) ?? null;
      }
    }
    await admin!
      .from("package_purchases")
      .update(status === "paid" ? { status: "paid", student_id: studentId } : { status: "failed" })
      .eq("stripe_session_id", session.id);
  }

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;
      // Bij directe (kaart) betaling is dit meteen 'paid'; bij vertraagde
      // methoden volgt async_payment_succeeded later.
      if (session.payment_status === "paid") await settle(session, "paid");
      break;
    }
    case "checkout.session.async_payment_succeeded":
      await settle(event.data.object as Stripe.Checkout.Session, "paid");
      break;
    case "checkout.session.async_payment_failed":
      await settle(event.data.object as Stripe.Checkout.Session, "failed");
      break;
    default:
      break;
  }

  return NextResponse.json({ received: true });
}
