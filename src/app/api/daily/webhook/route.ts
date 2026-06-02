import { NextResponse } from "next/server";
import crypto from "crypto";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Daily-webhook voor minuten-metering. Op `meeting.ended` berekenen we de
 * verbruikte lesminuten en schrijven die naar usage_ledger (idempotent op het
 * Daily meeting-id). Mapping: room → sessions.room_id → org_id.
 *
 * Lesminuten = participant-minuten / 2 (1-op-1 = wall-clock; groepslessen
 * verbruiken evenredig sneller). Valt terug op wall-clock bij API-problemen.
 */
export async function POST(request: Request) {
  const secret = process.env.DAILY_WEBHOOK_SECRET ?? "";
  const apiKey = process.env.DAILY_API_KEY ?? "";
  const raw = await request.text();

  // ── HMAC-verificatie (Daily: base64(HMAC-SHA256(secret, `${ts}.${body}`))) ──
  if (secret) {
    const ts = request.headers.get("X-Webhook-Timestamp") ?? "";
    const sig = request.headers.get("X-Webhook-Signature") ?? "";
    const expected = crypto
      .createHmac("sha256", secret)
      .update(`${ts}.${raw}`)
      .digest("base64");
    const ok =
      sig.length === expected.length &&
      crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected));
    if (!ok) {
      return NextResponse.json({ error: "invalid_signature" }, { status: 401 });
    }
  }

  let body: {
    type?: string;
    payload?: { meeting_id?: string; room?: string; start_ts?: number; end_ts?: number };
  };
  try {
    body = JSON.parse(raw);
  } catch {
    return NextResponse.json({ error: "bad_request" }, { status: 400 });
  }

  // Daily stuurt soms een test/verificatie-event; gewoon 200 teruggeven.
  if (body.type !== "meeting.ended") {
    return NextResponse.json({ received: true });
  }

  const meetingId = body.payload?.meeting_id;
  const room = body.payload?.room;
  if (!meetingId || !room) return NextResponse.json({ received: true });

  const admin = createAdminClient();
  if (!admin) return NextResponse.json({ error: "no_admin" }, { status: 500 });

  // Room → tenant via de sessie. Geen sessie (anonieme room) → niet beprijzen.
  const { data: session } = await admin
    .from("sessions")
    .select("org_id")
    .eq("room_id", room)
    .maybeSingle();
  const orgId = session?.org_id as string | undefined;
  if (!orgId) return NextResponse.json({ received: true });

  // Participant-minuten ophalen (nauwkeurig); fallback = wall-clock.
  let lessonMinutes = 0;
  try {
    const res = await fetch(
      `https://api.daily.co/v1/meetings?room=${encodeURIComponent(room)}&limit=10`,
      { headers: { Authorization: `Bearer ${apiKey}` } },
    );
    const json = await res.json();
    const meeting = (json?.data ?? []).find(
      (m: { id?: string }) => m.id === meetingId,
    );
    const participants = meeting?.participants;
    if (Array.isArray(participants) && participants.length) {
      const participantSeconds = participants.reduce(
        (sum: number, p: { duration?: number }) => sum + (p.duration ?? 0),
        0,
      );
      lessonMinutes = participantSeconds / 60 / 2;
    } else if (typeof meeting?.duration === "number") {
      lessonMinutes = meeting.duration / 60; // wall-clock ≈ 1-op-1 lesminuten
    }
  } catch {
    // negeer; fallback hieronder
  }
  if (!lessonMinutes && body.payload?.start_ts && body.payload?.end_ts) {
    lessonMinutes = (body.payload.end_ts - body.payload.start_ts) / 60;
  }
  lessonMinutes = Math.max(0, Math.round(lessonMinutes * 100) / 100);

  // Idempotent: event_id is uniek → dubbele bezorging telt niet dubbel.
  await admin.from("usage_ledger").upsert(
    {
      org_id: orgId,
      room_id: room,
      event_id: meetingId,
      minutes: lessonMinutes,
      occurred_at: new Date().toISOString(),
    },
    { onConflict: "event_id", ignoreDuplicates: true },
  );

  return NextResponse.json({ received: true });
}
