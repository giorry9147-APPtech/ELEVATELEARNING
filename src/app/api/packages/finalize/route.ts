import { NextResponse } from "next/server";
import { stripe } from "@/lib/stripe/server";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Rondt een aankoop af na terugkeer uit Checkout: haalt de sessie op (op het
 * Connect-account), markeert de aankoop als betaald en koppelt 'm — indien
 * mogelijk — aan een bestaande leerling op e-mail. Idempotent.
 */
export async function POST(request: Request) {
  if (!stripe) return NextResponse.json({ paid: false }, { status: 503 });

  let sessionId = "";
  let acct = "";
  try {
    const body = await request.json();
    sessionId = String(body?.sessionId ?? "");
    acct = String(body?.acct ?? "");
  } catch {
    return NextResponse.json({ error: "bad_request" }, { status: 400 });
  }
  if (!sessionId || !acct) return NextResponse.json({ error: "bad_request" }, { status: 400 });

  const session = await stripe.checkout.sessions.retrieve(
    sessionId,
    {},
    { stripeAccount: acct },
  );
  const paid = session.payment_status === "paid";

  const admin = createAdminClient();
  if (paid && admin) {
    const email = (session.metadata?.buyer_email as string) || session.customer_email || null;
    const orgId = (session.metadata?.org_id as string) || null;

    // Koppel aan bestaande leerling op e-mail (best effort).
    let studentId: string | null = null;
    if (email && orgId) {
      const { data: stu } = await admin
        .from("students")
        .select("id")
        .eq("org_id", orgId)
        .eq("email", email)
        .maybeSingle();
      studentId = (stu?.id as string) ?? null;
    }

    await admin
      .from("package_purchases")
      .update({ status: "paid", student_id: studentId })
      .eq("stripe_session_id", sessionId);
  }

  return NextResponse.json({
    paid,
    amount: session.amount_total,
    currency: session.currency,
  });
}
