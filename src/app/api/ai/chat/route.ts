import { anthropic, AI_MODEL, TUTOR_SYSTEM } from "@/lib/ai";
import { createClient } from "@/lib/supabase/server";

/**
 * AI-huiswerkmaatje chat — streamt het antwoord van Claude terug (betere UX).
 * Gegate op ingelogde gebruikers. Werkt-zonder-key: 503 zonder ANTHROPIC_API_KEY.
 */
export async function POST(request: Request) {
  if (!anthropic) {
    return Response.json({ error: "AI is nog niet geactiveerd." }, { status: 503 });
  }

  const supabase = await createClient();
  if (!supabase) return Response.json({ error: "Auth niet beschikbaar." }, { status: 500 });
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return Response.json({ error: "Log eerst in." }, { status: 401 });

  type Msg = { role: "user" | "assistant"; content: string };
  let messages: Msg[] = [];
  try {
    const body = await request.json();
    const raw = Array.isArray(body?.messages) ? body.messages : [];
    messages = raw
      .filter(
        (m: unknown): m is Msg =>
          !!m &&
          ((m as Msg).role === "user" || (m as Msg).role === "assistant") &&
          typeof (m as Msg).content === "string" &&
          (m as Msg).content.trim().length > 0,
      )
      .slice(-20)
      .map((m: Msg) => ({ role: m.role, content: m.content.slice(0, 6000) }));
  } catch {
    return Response.json({ error: "bad_request" }, { status: 400 });
  }
  if (!messages.length) return Response.json({ error: "Geen bericht." }, { status: 400 });

  const stream = anthropic.messages.stream({
    model: AI_MODEL,
    max_tokens: 1500,
    system: [{ type: "text", text: TUTOR_SYSTEM, cache_control: { type: "ephemeral" } }],
    messages,
  });

  const encoder = new TextEncoder();
  const body = new ReadableStream<Uint8Array>({
    async start(controller) {
      try {
        stream.on("text", (t) => controller.enqueue(encoder.encode(t)));
        await stream.finalMessage();
      } catch {
        controller.enqueue(encoder.encode("\n\n[Er ging iets mis bij de AI. Probeer het opnieuw.]"));
      } finally {
        controller.close();
      }
    },
  });

  return new Response(body, {
    headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "no-store" },
  });
}
