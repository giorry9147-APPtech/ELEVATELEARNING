import { NextResponse } from "next/server";
import { config, dailyLimits } from "@/lib/config";

/**
 * Geeft per sessie een eigen Daily-videoroom terug.
 * - Met DAILY_API_KEY: maakt (of hergebruikt) een room met de naam = roomId.
 * - Zonder API-key: valt terug op de gedeelde demo-room (NEXT_PUBLIC_DAILY_ROOM_URL).
 *
 * De API-key blijft server-side; de browser krijgt alleen de room-URL.
 *
 * KOSTENBESCHERMING: elke room krijgt een harde verlooptijd (exp) +
 * eject_at_room_exp. Daily ejecteert dan automatisch iedereen op exp — óók
 * als de browser is dichtgeklapt. Zo tikken vergeten tabs nooit eindeloos door.
 * De client krijgt `exp` terug en kan vlak ervoor "verlengen" aanbieden (PATCH).
 */

// Maak een Daily-roomnaam veilig: alleen [A-Za-z0-9_-], max 40 tekens.
function safeName(roomId: string): string {
  return roomId.replace(/[^A-Za-z0-9_-]/g, "-").slice(0, 40);
}

function nowSeconds(): number {
  return Math.floor(Date.now() / 1000);
}

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
  // Geen exp mogelijk zonder key; client krijgt exp:null (geen auto-eject).
  if (!apiKey || !domain) {
    return NextResponse.json({
      url: config.daily.roomUrl || null,
      shared: true,
      exp: null,
    });
  }
  if (!roomId) {
    return NextResponse.json({ error: "missing_room_id" }, { status: 400 });
  }

  const name = safeName(roomId);
  const roomUrl = `https://${domain}/${name}`;
  const headers = { Authorization: `Bearer ${apiKey}` };

  // Bestaat de room al? Dan is de deterministische URL meteen geldig.
  // (Cruciaal: zo belandt de 2e deelnemer in DEZELFDE room, niet in de fallback.)
  const existing = await fetch(`https://api.daily.co/v1/rooms/${name}`, {
    headers,
  });
  if (existing.ok) {
    const room = await existing.json().catch(() => null);
    let exp: number | null = room?.config?.exp ?? null;
    // Oudere room zonder exp? Alsnog een limiet zetten — anders tikt hij door.
    if (!exp) {
      exp = nowSeconds() + dailyLimits.sessionMinutes * 60;
      await setExp(name, exp, headers);
    }
    return NextResponse.json({ url: roomUrl, shared: false, exp });
  }

  // Bestaat nog niet → aanmaken, mét harde verlooptijd.
  const exp = nowSeconds() + dailyLimits.sessionMinutes * 60;
  const created = await fetch("https://api.daily.co/v1/rooms", {
    method: "POST",
    headers: { ...headers, "Content-Type": "application/json" },
    body: JSON.stringify({
      name,
      privacy: "public",
      properties: {
        enable_screenshare: true,
        enable_chat: false, // chat doen we zelf, naast het whiteboard
        start_video_off: false,
        start_audio_off: false,
        exp, // room verloopt automatisch op dit tijdstip (unix seconden)
        eject_at_room_exp: true, // ...en iedereen wordt dan uit de room gezet
      },
    }),
  });
  if (created.ok) {
    return NextResponse.json({ url: roomUrl, shared: false, exp });
  }

  // Race-conditie: net door iemand anders aangemaakt tussen GET en POST?
  const recheck = await fetch(`https://api.daily.co/v1/rooms/${name}`, {
    headers,
  });
  if (recheck.ok) {
    const room = await recheck.json().catch(() => null);
    return NextResponse.json({
      url: roomUrl,
      shared: false,
      exp: room?.config?.exp ?? null,
    });
  }

  // Echte fout: val terug op de gedeelde room zodat de les doorgaat.
  return NextResponse.json({
    url: config.daily.roomUrl || null,
    shared: true,
    exp: null,
    warning: `daily_api_${created.status}`,
  });
}

/**
 * Verleng (of verkort) de verlooptijd van een room.
 * Body: { roomId: string, addMinutes?: number }
 * Antwoord: { exp: number } — de nieuwe verlooptijd in unix seconden.
 */
export async function PATCH(request: Request) {
  const apiKey = process.env.DAILY_API_KEY ?? "";
  const domain = config.daily.domain;
  if (!apiKey || !domain) {
    return NextResponse.json({ error: "no_api_key" }, { status: 400 });
  }

  let roomId = "";
  let addMinutes: number = dailyLimits.extendMinutes;
  try {
    const body = await request.json();
    roomId = String(body?.roomId ?? "").trim();
    if (typeof body?.addMinutes === "number" && body.addMinutes > 0) {
      // Begrens om misbruik te voorkomen (max 8 uur per verlenging).
      addMinutes = Math.min(body.addMinutes, 8 * 60);
    }
  } catch {
    return NextResponse.json({ error: "bad_request" }, { status: 400 });
  }
  if (!roomId) {
    return NextResponse.json({ error: "missing_room_id" }, { status: 400 });
  }

  const name = safeName(roomId);
  const headers = { Authorization: `Bearer ${apiKey}` };

  // Huidige exp ophalen zodat we vanaf het juiste punt verlengen.
  const current = await fetch(`https://api.daily.co/v1/rooms/${name}`, {
    headers,
  });
  if (!current.ok) {
    return NextResponse.json({ error: "room_not_found" }, { status: 404 });
  }
  const room = await current.json().catch(() => null);
  const base = Math.max(room?.config?.exp ?? 0, nowSeconds());
  const exp = base + addMinutes * 60;

  const ok = await setExp(name, exp, headers);
  if (!ok) {
    return NextResponse.json({ error: "update_failed" }, { status: 502 });
  }
  return NextResponse.json({ exp });
}

// Zet de verlooptijd van een bestaande room (Daily-update = POST /rooms/:name).
async function setExp(
  name: string,
  exp: number,
  headers: Record<string, string>,
): Promise<boolean> {
  const res = await fetch(`https://api.daily.co/v1/rooms/${name}`, {
    method: "POST",
    headers: { ...headers, "Content-Type": "application/json" },
    body: JSON.stringify({
      properties: { exp, eject_at_room_exp: true },
    }),
  });
  return res.ok;
}
