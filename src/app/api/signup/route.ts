import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Account aanmaken met e-mail + wachtwoord, ZONDER bevestigingsmail.
 * - Valideert de uitnodigingscode (gesloten demo-fase).
 * - Maakt de gebruiker server-side aan met email_confirm=true (admin-key),
 *   zodat er geen magic link / e-mail nodig is.
 * - Zet de rol op het profiel.
 *
 * Demo-grade: bestaat het e-mailadres al (bv. oude magic-link-account zonder
 * wachtwoord), dan claimen we het door het wachtwoord te zetten. Vóór een
 * commerciële lancering vervangen we dit door een echte signup/confirm- of
 * wachtwoord-reset-flow.
 */
export async function POST(request: Request) {
  let email = "";
  let password = "";
  let code = "";
  try {
    const body = await request.json();
    email = String(body?.email ?? "").trim().toLowerCase();
    password = String(body?.password ?? "");
    code = String(body?.code ?? "").trim();
  } catch {
    return NextResponse.json({ error: "bad_request" }, { status: 400 });
  }

  if (!email || password.length < 6) {
    return NextResponse.json(
      { error: "Vul een e-mailadres en een wachtwoord van minstens 6 tekens in." },
      { status: 400 },
    );
  }

  const admin = createAdminClient();
  if (!admin) {
    return NextResponse.json({ error: "Auth is niet geconfigureerd." }, { status: 500 });
  }

  // 1) Uitnodigingscode valideren.
  const { data: invite } = await admin
    .from("invites")
    .select("code, role, max_uses, used_count, expires_at")
    .eq("code", code)
    .maybeSingle();
  if (!invite) {
    return NextResponse.json({ error: "Ongeldige uitnodigingscode." }, { status: 403 });
  }
  if (invite.expires_at && new Date(invite.expires_at) < new Date()) {
    return NextResponse.json({ error: "Deze uitnodigingscode is verlopen." }, { status: 403 });
  }
  if (invite.used_count >= invite.max_uses) {
    return NextResponse.json({ error: "Deze uitnodigingscode is op." }, { status: 403 });
  }
  const role = invite.role as string;

  // 2) Account aanmaken (of claimen als het al bestaat).
  const { data: created, error: createErr } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { role, invite_code: code },
  });

  let userId = created?.user?.id ?? null;
  let isNew = !!userId;

  if (createErr) {
    // Bestaat waarschijnlijk al → opzoeken en wachtwoord zetten (claim).
    const { data: list } = await admin.auth.admin.listUsers({ perPage: 200 });
    const existing = list?.users.find((u) => u.email?.toLowerCase() === email);
    if (!existing) {
      return NextResponse.json({ error: createErr.message }, { status: 400 });
    }
    await admin.auth.admin.updateUserById(existing.id, {
      password,
      email_confirm: true,
      user_metadata: { ...existing.user_metadata, role },
    });
    userId = existing.id;
    isNew = false;
  }

  // 3) Rol op het profiel zetten + invite-gebruik ophogen (alleen bij nieuw).
  if (userId) {
    await admin.from("profiles").update({ role }).eq("id", userId);
    if (isNew) {
      await admin
        .from("invites")
        .update({ used_count: invite.used_count + 1 })
        .eq("code", code);
    }
  }

  return NextResponse.json({ ok: true });
}
