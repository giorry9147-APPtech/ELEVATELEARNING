import { NextResponse } from "next/server";
import { stripe, CONNECT_ACCOUNT_COL } from "@/lib/stripe/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { config } from "@/lib/config";

/**
 * Start (of hervat) de Stripe Connect Express-onboarding voor de tenant van de
 * ingelogde docent. Maakt indien nodig een Express-account aan en geeft een
 * onboarding-link terug. De docent vult alleen naam + bankgegevens in; geld van
 * leerlingbetalingen komt op zijn eigen account (hij draagt de Stripe-kosten).
 */
export async function POST(request: Request) {
  if (!stripe) {
    return NextResponse.json({ error: "Stripe is nog niet gekoppeld." }, { status: 503 });
  }
  // Basis-URL = waar de docent nu zit (localhost of productie), val terug op config.
  const base = request.headers.get("origin") || config.appUrl;
  const supabase = await createClient();
  if (!supabase) {
    return NextResponse.json({ error: "Auth niet beschikbaar." }, { status: 500 });
  }
  const { data: auth } = await supabase.auth.getUser();
  const user = auth.user;
  if (!user) return NextResponse.json({ error: "Log eerst in." }, { status: 401 });

  const { data: membership } = await supabase
    .from("org_members")
    .select("org_id, role")
    .eq("user_id", user.id)
    .limit(1)
    .maybeSingle();
  const orgId = membership?.org_id as string | undefined;
  if (!orgId) return NextResponse.json({ error: "Geen lesomgeving gevonden." }, { status: 400 });

  const admin = createAdminClient();
  if (!admin) return NextResponse.json({ error: "Serverconfig ontbreekt." }, { status: 500 });

  const { data: org } = await admin
    .from("organizations")
    .select(CONNECT_ACCOUNT_COL)
    .eq("id", orgId)
    .maybeSingle();

  let accountId =
    ((org as Record<string, string | null> | null)?.[CONNECT_ACCOUNT_COL] as
      | string
      | null) ?? undefined;

  // Zelfherstel: bestaat het opgeslagen account niet (meer) in deze modus
  // (bv. een test-account onder live-keys), maak dan een nieuw account.
  if (accountId) {
    try {
      await stripe.accounts.retrieve(accountId);
    } catch {
      accountId = undefined;
    }
  }

  try {
    if (!accountId) {
      const account = await stripe.accounts.create({
        type: "express",
        country: "NL",
        email: user.email ?? undefined,
        business_type: "individual",
        capabilities: {
          card_payments: { requested: true },
          transfers: { requested: true },
        },
        metadata: { org_id: orgId },
      });
      accountId = account.id;
      await admin
        .from("organizations")
        .update({ [CONNECT_ACCOUNT_COL]: accountId })
        .eq("id", orgId);
    }

    const link = await stripe.accountLinks.create({
      account: accountId,
      refresh_url: `${base}/tarieven?connect=refresh`,
      return_url: `${base}/tarieven?connect=done`,
      type: "account_onboarding",
    });

    return NextResponse.json({ url: link.url });
  } catch (e) {
    // Geef de echte Stripe-reden terug (bv. "Connect niet ingeschakeld in live").
    const message = e instanceof Error ? e.message : "Onbekende fout bij Stripe.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
