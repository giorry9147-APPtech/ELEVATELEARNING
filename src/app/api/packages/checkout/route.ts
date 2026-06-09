import { NextResponse } from "next/server";
import { stripe } from "@/lib/stripe/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { config } from "@/lib/config";

/**
 * Publieke checkout: een leerling betaalt een pakket van een docent. De
 * betaling is een DIRECTE charge op het Connect-account van de docent
 * (`stripeAccount`), dus het geld komt op zíjn rekening en hij draagt de
 * Stripe-kosten. Geen platform-commissie (0%).
 */
export async function POST(request: Request) {
  if (!stripe) {
    return NextResponse.json({ error: "Betalen is nog niet beschikbaar." }, { status: 503 });
  }

  let packageId = "";
  let name = "";
  let email = "";
  try {
    const body = await request.json();
    packageId = String(body?.packageId ?? "");
    name = String(body?.name ?? "");
    email = String(body?.email ?? "");
  } catch {
    return NextResponse.json({ error: "bad_request" }, { status: 400 });
  }
  if (!packageId) return NextResponse.json({ error: "Geen pakket." }, { status: 400 });

  // Basis-URL = waar de leerling nu zit (localhost of productie).
  const base = request.headers.get("origin") || config.appUrl;

  const admin = createAdminClient();
  if (!admin) return NextResponse.json({ error: "Serverconfig ontbreekt." }, { status: 500 });

  const { data: pkg } = await admin
    .from("lesson_packages")
    .select("id, org_id, name, price_cents, currency, active")
    .eq("id", packageId)
    .maybeSingle();
  if (!pkg || !pkg.active || pkg.price_cents <= 0) {
    return NextResponse.json({ error: "Pakket niet beschikbaar." }, { status: 400 });
  }

  const { data: org } = await admin
    .from("organizations")
    .select("stripe_account_id")
    .eq("id", pkg.org_id)
    .maybeSingle();
  const accountId = (org?.stripe_account_id as string | null) ?? null;
  if (!accountId) {
    return NextResponse.json(
      { error: "Deze docent heeft online betalen nog niet ingesteld." },
      { status: 400 },
    );
  }

  const account = await stripe.accounts.retrieve(accountId);
  if (!account.charges_enabled) {
    return NextResponse.json(
      { error: "Online betalen is bij deze docent nog niet actief." },
      { status: 400 },
    );
  }

  const session = await stripe.checkout.sessions.create(
    {
      mode: "payment",
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: (pkg.currency || "EUR").toLowerCase(),
            unit_amount: pkg.price_cents,
            product_data: { name: pkg.name },
          },
        },
      ],
      payment_method_types: ["card", "ideal"],
      customer_email: email || undefined,
      success_url: `${base}/betaald?session_id={CHECKOUT_SESSION_ID}&acct=${accountId}`,
      cancel_url: `${base}/betalen/${pkg.org_id}`,
      metadata: {
        org_id: pkg.org_id,
        package_id: pkg.id,
        buyer_name: name || "",
        buyer_email: email || "",
      },
    },
    { stripeAccount: accountId },
  );

  await admin.from("package_purchases").insert({
    org_id: pkg.org_id,
    package_id: pkg.id,
    buyer_name: name || null,
    buyer_email: email || null,
    amount_cents: pkg.price_cents,
    currency: pkg.currency || "EUR",
    status: "pending",
    stripe_session_id: session.id,
  });

  return NextResponse.json({ url: session.url });
}
