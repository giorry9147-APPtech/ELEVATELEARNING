import { NextResponse } from "next/server";
import { stripe, CONNECT_ACCOUNT_COL } from "@/lib/stripe/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { config } from "@/lib/config";
import { generateRoomId } from "@/lib/rooms";

/**
 * Boek + betaal: reserveert een slot als 'pending' en start een Connect-checkout
 * (directe charge op het docent-account). De boeking wordt 'confirmed' zodra de
 * betaling binnen is (finalize/webhook). Voorkomt dubbel boeken.
 */
export async function POST(request: Request) {
  if (!stripe) return NextResponse.json({ error: "Betalen niet beschikbaar." }, { status: 503 });
  const base = request.headers.get("origin") || config.appUrl;

  let orgId = "";
  let startMs = 0;
  let name = "";
  let email = "";
  try {
    const body = await request.json();
    orgId = String(body?.orgId ?? "");
    startMs = Number(body?.startMs ?? 0);
    name = String(body?.name ?? "");
    email = String(body?.email ?? "");
  } catch {
    return NextResponse.json({ error: "bad_request" }, { status: 400 });
  }
  if (!orgId || !startMs) return NextResponse.json({ error: "bad_request" }, { status: 400 });
  if (startMs < Date.now()) {
    return NextResponse.json({ error: "Dit tijdstip is al verstreken." }, { status: 400 });
  }

  const admin = createAdminClient();
  if (!admin) return NextResponse.json({ error: "Serverconfig ontbreekt." }, { status: 500 });

  const { data: org } = await admin
    .from("organizations")
    .select(`name, booking_price_cents, lesson_minutes, ${CONNECT_ACCOUNT_COL}`)
    .eq("id", orgId)
    .maybeSingle();
  if (!org) return NextResponse.json({ error: "Onbekende docent." }, { status: 400 });

  const price = (org.booking_price_cents as number) ?? 0;
  if (price <= 0) {
    return NextResponse.json({ error: "Deze les is gratis te boeken." }, { status: 400 });
  }
  const accountId =
    ((org as Record<string, string | null>)[CONNECT_ACCOUNT_COL] as string | null) ?? null;
  if (!accountId) {
    return NextResponse.json({ error: "Online betalen is hier nog niet ingesteld." }, { status: 400 });
  }
  const account = await stripe.accounts.retrieve(accountId);
  if (!account.charges_enabled) {
    return NextResponse.json({ error: "Online betalen is hier nog niet actief." }, { status: 400 });
  }

  const startsAtIso = new Date(startMs).toISOString();
  const { data: clash } = await admin
    .from("bookings")
    .select("id")
    .eq("org_id", orgId)
    .eq("starts_at", startsAtIso)
    .neq("status", "cancelled")
    .maybeSingle();
  if (clash) {
    return NextResponse.json({ error: "Dit tijdstip is net geboekt. Kies een ander." }, { status: 409 });
  }

  let studentId: string | null = null;
  if (email) {
    const { data: stu } = await admin
      .from("students")
      .select("id")
      .eq("org_id", orgId)
      .eq("email", email)
      .maybeSingle();
    studentId = (stu?.id as string) ?? null;
  }

  const roomId = generateRoomId();
  const session = await stripe.checkout.sessions.create(
    {
      mode: "payment",
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: "eur",
            unit_amount: price,
            product_data: { name: `Bijles bij ${org.name as string}` },
          },
        },
      ],
      payment_method_types: ["card", "ideal"],
      customer_email: email || undefined,
      success_url: `${base}/betaald?session_id={CHECKOUT_SESSION_ID}&acct=${accountId}`,
      cancel_url: `${base}/boeken/${orgId}`,
      metadata: { type: "booking", org_id: orgId, room_id: roomId },
    },
    { stripeAccount: accountId },
  );

  await admin.from("bookings").insert({
    org_id: orgId,
    student_id: studentId,
    student_name: name || null,
    student_email: email || null,
    starts_at: startsAtIso,
    duration_min: (org.lesson_minutes as number) ?? 60,
    status: "pending",
    room_id: roomId,
    stripe_session_id: session.id,
  });

  return NextResponse.json({ url: session.url });
}
