import "server-only";

import Stripe from "stripe";
import { PLANS, type PlanId } from "@/lib/plans";

const key = process.env.STRIPE_SECRET_KEY ?? "";

/** Server-side Stripe-client. Null wanneer Stripe nog niet gekoppeld is. */
export const stripe = key ? new Stripe(key) : null;

/** Map een Stripe price-id terug naar ons plan (via env-config). */
export function planForPrice(priceId: string | null | undefined): PlanId {
  if (!priceId) return "free";
  const map: Record<string, PlanId> = {
    [process.env.NEXT_PUBLIC_STRIPE_PRICE_STARTER ?? "_"]: "starter",
    [process.env.NEXT_PUBLIC_STRIPE_PRICE_PRO ?? "_"]: "pro",
    [process.env.NEXT_PUBLIC_STRIPE_PRICE_WHITELABEL ?? "_"]: "whitelabel",
  };
  return map[priceId] ?? "free";
}

/** Price-id voor een plan. */
export function priceForPlan(plan: PlanId): string | undefined {
  return PLANS[plan].stripePriceId;
}
