import type Anthropic from "@anthropic-ai/sdk";
import { anthropic, AI_MODEL, TOOLS_SYSTEM } from "@/lib/ai";
import { createClient } from "@/lib/supabase/server";

/**
 * AI-studiehulp: samenvatting of oefenvragen uit ingeplakte lesstof.
 * Eén-shot (geen streaming). Gegate op ingelogde gebruikers.
 */
export async function POST(request: Request) {
  if (!anthropic) {
    return Response.json({ error: "AI is nog niet geactiveerd." }, { status: 503 });
  }

  const supabase = await createClient();
  if (!supabase) return Response.json({ error: "Auth niet beschikbaar." }, { status: 500 });
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return Response.json({ error: "Log eerst in." }, { status: 401 });

  let mode = "summary";
  let text = "";
  try {
    const body = await request.json();
    mode = body?.mode === "questions" ? "questions" : "summary";
    text = String(body?.text ?? "").slice(0, 12000);
  } catch {
    return Response.json({ error: "bad_request" }, { status: 400 });
  }
  if (!text.trim()) return Response.json({ error: "Plak eerst wat lesstof." }, { status: 400 });

  const instruction =
    mode === "questions"
      ? `Maak 5 oefenvragen over de onderstaande lesstof, oplopend in moeilijkheid. Zet de antwoorden onderaan onder een kopje "Antwoorden". Antwoord in het Nederlands.`
      : `Vat de onderstaande lesstof samen voor een leerling. Geef: 1) een korte samenvatting in eigen woorden, 2) de kernpunten als bullets, en 3) een kort "Onthoud dit"-lijstje. Antwoord in het Nederlands.`;

  try {
    const resp = await anthropic.messages.create({
      model: AI_MODEL,
      max_tokens: 2000,
      system: [{ type: "text", text: TOOLS_SYSTEM, cache_control: { type: "ephemeral" } }],
      messages: [{ role: "user", content: `${instruction}\n\nLesstof:\n${text}` }],
    });
    const out = resp.content
      .filter((b): b is Anthropic.TextBlock => b.type === "text")
      .map((b) => b.text)
      .join("");
    return Response.json({ text: out });
  } catch {
    return Response.json({ error: "AI lukt nu niet. Probeer het later opnieuw." }, { status: 502 });
  }
}
