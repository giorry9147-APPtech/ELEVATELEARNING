import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { generateRoomId } from "@/lib/rooms";

/**
 * Publieke boeking: een leerling reserveert een vrij slot bij een docent.
 * Maakt een booking + een leslink (room) aan. Schrijft via de service-role.
 */
export async function POST(request: Request) {
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
    .select("lesson_minutes")
    .eq("id", orgId)
    .maybeSingle();
  if (!org) return NextResponse.json({ error: "Onbekende docent." }, { status: 400 });
  const lessonMin = (org.lesson_minutes as number) ?? 60;
  const startsAtIso = new Date(startMs).toISOString();

  // Dubbele boeking op hetzelfde tijdstip voorkomen.
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

  // Koppel aan bestaande leerling op e-mail (best effort).
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
  const { error } = await admin.from("bookings").insert({
    org_id: orgId,
    student_id: studentId,
    student_name: name || null,
    student_email: email || null,
    starts_at: startsAtIso,
    duration_min: lessonMin,
    status: "confirmed",
    room_id: roomId,
  });
  if (error) {
    return NextResponse.json({ error: "Boeken lukt nu niet." }, { status: 500 });
  }

  return NextResponse.json({ roomId, startsAt: startMs });
}
