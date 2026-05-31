import { NextResponse } from "next/server";
import type { EmailOtpType } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import { applyInviteForCurrentUser } from "@/lib/applyInvite";

/**
 * Magic-link verificatie via token_hash (de standaard Supabase SSR-aanpak
 * voor e-maillinks). De e-mailtemplate verwijst hierheen met
 *   /auth/confirm?token_hash={{ .TokenHash }}&type=email
 * Werkt ook met admin-gegenereerde links (type=signup/magiclink).
 */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const token_hash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;
  const next = searchParams.get("next") ?? "/dashboard";

  if (!token_hash || !type) {
    return NextResponse.redirect(`${origin}/login?error=auth`);
  }

  const supabase = await createClient();
  if (!supabase) {
    return NextResponse.redirect(`${origin}/login?error=auth`);
  }

  const { error } = await supabase.auth.verifyOtp({ type, token_hash });
  if (error) {
    return NextResponse.redirect(`${origin}/login?error=auth`);
  }

  await applyInviteForCurrentUser(supabase);
  return NextResponse.redirect(`${origin}${next}`);
}
