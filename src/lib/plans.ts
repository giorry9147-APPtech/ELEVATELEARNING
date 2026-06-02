/**
 * Abonnementsplannen (SaaS Fase 4). De minuten zijn LESMINUTEN per maand
 * (1-op-1). `stripePriceId` komt uit env zodra de Stripe-producten zijn
 * aangemaakt. Bron voor prijzen/limieten: docs/KOSTEN-PRIJZEN.md.
 */

export type PlanId = "free" | "starter" | "pro" | "whitelabel";

export type PlanFeatures = {
  recording: boolean;
  whitelabel: boolean;
  assignments: boolean;
};

export type Plan = {
  id: PlanId;
  name: string;
  priceEur: number; // per maand
  minutesIncluded: number; // lesminuten/maand
  seats: number; // inbegrepen docenten
  overagePerMinuteEur: number; // prijs per extra lesminuut
  features: PlanFeatures;
  blurb: string;
  highlight?: boolean;
  stripePriceId?: string;
};

export const PLANS: Record<PlanId, Plan> = {
  free: {
    id: "free",
    name: "Gratis (proef)",
    priceEur: 0,
    minutesIncluded: 150,
    seats: 1,
    overagePerMinuteEur: 0,
    features: { recording: false, whitelabel: false, assignments: false },
    blurb: "Proef het platform met je eerste lessen.",
  },
  starter: {
    id: "starter",
    name: "Starter",
    priceEur: 19,
    minutesIncluded: 1000,
    seats: 1,
    overagePerMinuteEur: 0.02,
    features: { recording: false, whitelabel: false, assignments: false },
    blurb: "Voor de solo-docent: alle lesfeatures, onbeperkt leerlingen.",
    stripePriceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_STARTER,
  },
  pro: {
    id: "pro",
    name: "Pro",
    priceEur: 39,
    minutesIncluded: 3000,
    seats: 1,
    overagePerMinuteEur: 0.02,
    features: { recording: true, whitelabel: false, assignments: false },
    blurb: "Meer minuten, opname en prioriteit-support.",
    highlight: true,
    stripePriceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_PRO,
  },
  whitelabel: {
    id: "whitelabel",
    name: "White-label",
    priceEur: 129,
    minutesIncluded: 6000,
    seats: 3,
    overagePerMinuteEur: 0.01,
    features: { recording: true, whitelabel: true, assignments: true },
    blurb: "Eigen domein, huisstijl, opdrachten-module en 3 docenten.",
    stripePriceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_WHITELABEL,
  },
};

export const PLAN_ORDER: PlanId[] = ["free", "starter", "pro", "whitelabel"];

export function planById(id: string | null | undefined): Plan {
  return PLANS[(id as PlanId) ?? "free"] ?? PLANS.free;
}
