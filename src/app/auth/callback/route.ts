import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { applyInviteForCurrentUser } from "@/lib/applyInvite";

/**
 * OAuth/PKCE callback (code-exchange). E-mail-magic-links lopen via
 * /auth/confirm (token_hash + verifyOtp); deze route blijft voor toekomstige
 * OAuth-providers die met een `?code=` terugkomen.
 */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/dashboard";

  if (!code) {
    return NextResponse.redirect(`${origin}/login?error=auth`);
  }

  const supabase = await createClient();
  if (!supabase) {
    return NextResponse.redirect(`${origin}/login?error=auth`);
  }

  const { error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) {
    return NextResponse.redirect(`${origin}/login?error=auth`);
  }

  await applyInviteForCurrentUser(supabase);
  return NextResponse.redirect(`${origin}${next}`);
}
