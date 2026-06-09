import { NextResponse } from "next/server";
import { stripe } from "@/lib/stripe/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

/** Connect-status van de tenant: gekoppeld? betalingen actief? */
export async function GET() {
  const off = { connected: false, chargesEnabled: false };
  if (!stripe) return NextResponse.json(off);

  const supabase = await createClient();
  if (!supabase) return NextResponse.json(off);
  const { data: auth } = await supabase.auth.getUser();
  const user = auth.user;
  if (!user) return NextResponse.json(off);

  const { data: membership } = await supabase
    .from("org_members")
    .select("org_id")
    .eq("user_id", user.id)
    .limit(1)
    .maybeSingle();
  const orgId = membership?.org_id as string | undefined;
  if (!orgId) return NextResponse.json(off);

  const admin = createAdminClient();
  const { data: org } = admin
    ? await admin.from("organizations").select("stripe_account_id").eq("id", orgId).maybeSingle()
    : { data: null };
  const accountId = (org?.stripe_account_id as string | null) ?? null;
  if (!accountId) return NextResponse.json(off);

  try {
    const account = await stripe.accounts.retrieve(accountId);
    return NextResponse.json({
      connected: true,
      chargesEnabled: account.charges_enabled,
      payoutsEnabled: account.payouts_enabled,
      detailsSubmitted: account.details_submitted,
    });
  } catch {
    return NextResponse.json({ connected: true, chargesEnabled: false });
  }
}
