import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Valideert een uitnodigingscode server-side tegen de `invites`-tabel
 * (de tabel is via RLS afgeschermd voor de browser). Geeft alleen terug
 * óf de code geldig is + welke rol erbij hoort — niet de hele rij.
 */
export async function POST(request: Request) {
  let code = "";
  try {
    const body = await request.json();
    code = String(body?.code ?? "").trim();
  } catch {
    return NextResponse.json({ valid: false, reason: "bad_request" }, { status: 400 });
  }

  if (!code) {
    return NextResponse.json({ valid: false, reason: "empty" });
  }

  const admin = createAdminClient();
  if (!admin) {
    // Zonder Supabase kunnen we niet valideren; sta toe in lokale modus.
    return NextResponse.json({ valid: true, role: "student", reason: "no_backend" });
  }

  const { data, error } = await admin
    .from("invites")
    .select("code, role, max_uses, used_count, expires_at")
    .eq("code", code)
    .maybeSingle();

  if (error || !data) {
    return NextResponse.json({ valid: false, reason: "not_found" });
  }
  if (data.expires_at && new Date(data.expires_at) < new Date()) {
    return NextResponse.json({ valid: false, reason: "expired" });
  }
  if (data.used_count >= data.max_uses) {
    return NextResponse.json({ valid: false, reason: "exhausted" });
  }

  return NextResponse.json({ valid: true, role: data.role });
}
