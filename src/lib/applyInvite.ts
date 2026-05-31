import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Past de meegestuurde uitnodigingscode eenmalig toe op de huidige gebruiker:
 * zet de rol op het profiel en hoogt het invite-gebruik op. Wordt aangeroepen
 * direct na een geslaagde verificatie (magic link).
 */
export async function applyInviteForCurrentUser(
  supabase: SupabaseClient,
): Promise<void> {
  const admin = createAdminClient();
  if (!admin) return;

  const { data } = await supabase.auth.getUser();
  const user = data.user;
  const meta = user?.user_metadata ?? {};
  if (!user || meta.invite_applied || !meta.invite_code) return;

  const role =
    meta.role === "teacher" || meta.role === "admin" ? meta.role : "student";

  // Rol op het profiel zetten.
  await admin.from("profiles").update({ role }).eq("id", user.id);

  // Invite-gebruik ophogen (best-effort; race-condities acceptabel in demo).
  const { data: invite } = await admin
    .from("invites")
    .select("used_count")
    .eq("code", meta.invite_code)
    .maybeSingle();
  if (invite) {
    await admin
      .from("invites")
      .update({ used_count: invite.used_count + 1 })
      .eq("code", meta.invite_code);
  }

  // Markeer als toegepast zodat herhaald inloggen niet opnieuw ophoogt.
  await admin.auth.admin.updateUserById(user.id, {
    user_metadata: { ...meta, invite_applied: true },
  });
}
