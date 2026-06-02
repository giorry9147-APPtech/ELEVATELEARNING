import { NextResponse } from "next/server";
import { stripe } from "@/lib/stripe/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { config } from "@/lib/config";

/**
 * Opent het Stripe Customer Portal zodat de docent zelf z'n abonnement,
 * betaalmethode, facturen en opzegging kan beheren.
 */
export async function POST() {
  if (!stripe) {
    return NextResponse.json({ error: "Stripe niet gekoppeld." }, { status: 503 });
  }

  const supabase = await createClient();
  const { data: auth } = (await supabase?.auth.getUser()) ?? { data: { user: null } };
  const user = auth?.user;
  if (!user) {
    return NextResponse.json({ error: "Log eerst in." }, { status: 401 });
  }

  const admin = createAdminClient();
  const { data: membership } = await supabase!
    .from("org_members")
    .select("org_id")
    .eq("user_id", user.id)
    .limit(1)
    .maybeSingle();
  const orgId = membership?.org_id as string | undefined;

  const { data: sub } = orgId
    ? await admin!
        .from("subscriptions")
        .select("stripe_customer_id")
        .eq("org_id", orgId)
        .maybeSingle()
    : { data: null };

  const customerId = sub?.stripe_customer_id as string | undefined;
  if (!customerId) {
    return NextResponse.json(
      { error: "Nog geen abonnement om te beheren." },
      { status: 400 },
    );
  }

  const portal = await stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: `${config.appUrl}/dashboard`,
  });

  return NextResponse.json({ url: portal.url });
}
