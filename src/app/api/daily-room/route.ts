import { NextResponse } from "next/server";
import { config } from "@/lib/config";

/**
 * Geeft per sessie een eigen Daily-videoroom terug.
 * - Met DAILY_API_KEY: maakt (of hergebruikt) een room met de naam = roomId.
 * - Zonder API-key: valt terug op de gedeelde demo-room (NEXT_PUBLIC_DAILY_ROOM_URL).
 *
 * De API-key blijft server-side; de browser krijgt alleen de room-URL.
 */
export async function POST(request: Request) {
  const apiKey = process.env.DAILY_API_KEY ?? "";
  const domain = config.daily.domain;

  let roomId = "";
  try {
    const body = await request.json();
    roomId = String(body?.roomId ?? "").trim();
  } catch {
    return NextResponse.json({ error: "bad_request" }, { status: 400 });
  }

  // Geen API-key → gedeelde room (of niets als ook die ontbreekt).
  if (!apiKey || !domain) {
    return NextResponse.json({
      url: config.daily.roomUrl || null,
      shared: true,
    });
  }
  if (!roomId) {
    return NextResponse.json({ error: "missing_room_id" }, { status: 400 });
  }

  // Daily-roomnamen: alleen [A-Za-z0-9_-]. Maak het roomId veilig.
  const name = roomId.replace(/[^A-Za-z0-9_-]/g, "-").slice(0, 40);
  const roomUrl = `https://${domain}/${name}`;

  const res = await fetch("https://api.daily.co/v1/rooms", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      name,
      privacy: "public",
      properties: {
        enable_screenshare: true,
        enable_chat: false, // chat doen we zelf, naast het whiteboard
        start_video_off: false,
        start_audio_off: false,
      },
    }),
  });

  // 200 = nieuw aangemaakt; 409 = bestond al → in beide gevallen is de URL geldig.
  if (res.ok || res.status === 409) {
    return NextResponse.json({ url: roomUrl, shared: false });
  }

  // Bij een andere fout: val terug op de gedeelde room zodat de les doorgaat.
  return NextResponse.json({
    url: config.daily.roomUrl || null,
    shared: true,
    warning: `daily_api_${res.status}`,
  });
}
