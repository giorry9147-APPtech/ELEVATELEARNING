import { NextResponse } from "next/server";
import { stripe, stripeIsLive, CONNECT_ACCOUNT_COL } from "@/lib/stripe/server";

/**
 * Tijdelijke diagnose: vertelt in welke Stripe-modus deze omgeving draait.
 * Geeft ALLEEN booleans/kolomnaam terug — geen secrets.
 */
export async function GET() {
  return NextResponse.json({
    stripeConfigured: Boolean(stripe),
    stripeLive: stripeIsLive,
    accountColumn: CONNECT_ACCOUNT_COL,
    connectWebhookSecretSet: Boolean(process.env.STRIPE_CONNECT_WEBHOOK_SECRET),
  });
}
