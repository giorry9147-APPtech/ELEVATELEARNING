"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import { useAuth } from "@/components/AuthProvider";
import { BrandMark } from "@/components/BrandingProvider";
import { Container } from "@/components/ui/Container";
import { Card } from "@/components/ui/Card";
import { Button, buttonClasses } from "@/components/ui/Button";
import { Input, Textarea } from "@/components/ui/Input";
import { cn } from "@/components/ui/cn";
import { SparkleIcon, ChatIcon, BookIcon } from "@/components/ui/icons";

type Msg = { role: "user" | "assistant"; content: string };

export default function AiTutor() {
  const { user, loading } = useAuth();
  const [tab, setTab] = useState<"chat" | "tools">("chat");

  // Chat
  const [messages, setMessages] = useState<Msg[]>([]);
  const [draft, setDraft] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [chatError, setChatError] = useState("");
  const listRef = useRef<HTMLDivElement>(null);

  // Studiehulp
  const [lesText, setLesText] = useState("");
  const [result, setResult] = useState("");
  const [toolBusy, setToolBusy] = useState(false);
  const [toolError, setToolError] = useState("");

  const scrollDown = () =>
    setTimeout(() => listRef.current?.scrollTo({ top: listRef.current.scrollHeight }), 30);

  const send = async (e: React.FormEvent) => {
    e.preventDefault();
    const text = draft.trim();
    if (!text || streaming) return;
    setChatError("");
    const next: Msg[] = [...messages, { role: "user", content: text }];
    setMessages([...next, { role: "assistant", content: "" }]);
    setDraft("");
    setStreaming(true);
    scrollDown();
    try {
      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: next }),
      });
      if (!res.ok || !res.body) {
        const data = await res.json().catch(() => ({}));
        setMessages(next); // verwijder lege assistant-bubbel
        setChatError(data?.error ?? "AI lukt nu niet.");
        return;
      }
      const reader = res.body.getReader();
      const dec = new TextDecoder();
      let acc = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        acc += dec.decode(value, { stream: true });
        setMessages([...next, { role: "assistant", content: acc }]);
        scrollDown();
      }
    } catch {
      setMessages(next);
      setChatError("Er ging iets mis. Probeer het opnieuw.");
    } finally {
      setStreaming(false);
    }
  };

  const runTool = async (mode: "summary" | "questions") => {
    if (!lesText.trim() || toolBusy) return;
    setToolBusy(true);
    setToolError("");
    setResult("");
    try {
      const res = await fetch("/api/ai/tools", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode, text: lesText }),
      });
      const data = await res.json();
      if (data?.text) setResult(data.text);
      else setToolError(data?.error ?? "AI lukt nu niet.");
    } catch {
      setToolError("Er ging iets mis. Probeer het opnieuw.");
    } finally {
      setToolBusy(false);
    }
  };

  return (
    <main className="min-h-screen flex-1 app-surface">
      <header className="app-header">
        <Container className="flex items-center justify-between py-4">
          <Link href="/dashboard">
            <BrandMark />
          </Link>
          <Link href="/dashboard" className="text-sm text-muted-foreground transition hover:text-foreground">
            ← Dashboard
          </Link>
        </Container>
      </header>

      <Container className="py-8">
        <span className="inline-flex items-center gap-1.5 text-sm font-medium text-brand">
          <SparkleIcon size={16} /> AI
        </span>
        <h1 className="mt-1 text-2xl font-bold tracking-tight text-foreground">AI-huiswerkmaatje</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Een vriendelijke tutor die stap voor stap uitlegt — en lesstof samenvat of er oefenvragen van maakt.
        </p>

        {!loading && !user ? (
          <Card className="mt-8 p-10 text-center">
            <p className="text-muted-foreground">Log in om het AI-maatje te gebruiken.</p>
            <Link href="/login" className={buttonClasses({ className: "mt-4" })}>
              Inloggen
            </Link>
          </Card>
        ) : (
          <>
            {/* Tabs */}
            <div className="mt-6 flex gap-2">
              {([
                ["chat", "Chat", ChatIcon],
                ["tools", "Samenvatting & oefenvragen", BookIcon],
              ] as const).map(([key, label, Icon]) => (
                <button
                  key={key}
                  onClick={() => setTab(key)}
                  className={cn(
                    "inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-medium transition",
                    tab === key ? "bg-brand text-white" : "bg-muted text-muted-foreground hover:bg-border",
                  )}
                >
                  <Icon size={16} /> {label}
                </button>
              ))}
            </div>

            {tab === "chat" ? (
              <Card className="mt-5 flex h-[60vh] flex-col p-0">
                <div ref={listRef} className="flex-1 space-y-3 overflow-y-auto p-5">
                  {messages.length === 0 && (
                    <div className="flex h-full flex-col items-center justify-center text-center text-muted-foreground">
                      <span className="flex h-12 w-12 items-center justify-center rounded-full bg-brand-soft text-brand-strong">
                        <SparkleIcon size={24} />
                      </span>
                      <p className="mt-3 max-w-sm text-sm">
                        Stel een vraag, bijv. <span className="text-foreground">“Leg uit hoe ik kwadratische
                        vergelijkingen oplos.”</span> Ik help je er stap voor stap zelf op te komen.
                      </p>
                    </div>
                  )}
                  {messages.map((m, i) => {
                    const mine = m.role === "user";
                    return (
                      <div key={i} className={cn("flex", mine ? "justify-end" : "justify-start")}>
                        <div
                          className={cn(
                            "max-w-[85%] whitespace-pre-wrap rounded-2xl px-3.5 py-2.5 text-sm",
                            mine
                              ? "rounded-br-sm bg-brand text-white"
                              : "rounded-bl-sm bg-muted text-foreground",
                          )}
                        >
                          {m.content || (streaming ? "…" : "")}
                        </div>
                      </div>
                    );
                  })}
                </div>
                {chatError && <p className="px-5 pb-1 text-sm text-danger">{chatError}</p>}
                <form onSubmit={send} className="flex gap-2 border-t border-border p-3">
                  <Input
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                    placeholder="Stel je vraag…"
                    disabled={streaming}
                  />
                  <Button type="submit" disabled={streaming || !draft.trim()}>
                    {streaming ? "…" : "Stuur"}
                  </Button>
                </form>
              </Card>
            ) : (
              <div className="mt-5 grid gap-5 lg:grid-cols-2">
                <Card className="p-6">
                  <h2 className="font-semibold text-foreground">Lesstof</h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Plak je aantekeningen of een stuk lesstof. Het AI-maatje maakt er een samenvatting of
                    oefenvragen van.
                  </p>
                  <Textarea
                    value={lesText}
                    onChange={(e) => setLesText(e.target.value)}
                    rows={10}
                    className="mt-3"
                    placeholder="Plak hier je lesstof…"
                  />
                  <div className="mt-3 flex flex-wrap gap-2">
                    <Button onClick={() => runTool("summary")} disabled={toolBusy || !lesText.trim()}>
                      {toolBusy ? "Bezig…" : "Vat samen"}
                    </Button>
                    <Button
                      variant="secondary"
                      onClick={() => runTool("questions")}
                      disabled={toolBusy || !lesText.trim()}
                    >
                      Maak oefenvragen
                    </Button>
                  </div>
                  {toolError && <p className="mt-2 text-sm text-danger">{toolError}</p>}
                </Card>

                <Card className="p-6">
                  <h2 className="font-semibold text-foreground">Resultaat</h2>
                  {result ? (
                    <div className="mt-3 whitespace-pre-wrap text-sm text-foreground">{result}</div>
                  ) : (
                    <p className="mt-3 text-sm text-muted-foreground">
                      {toolBusy ? "Het AI-maatje denkt na…" : "Hier verschijnt je samenvatting of oefenvragen."}
                    </p>
                  )}
                </Card>
              </div>
            )}

            <p className="mt-4 text-xs text-muted-foreground">
              AI kan fouten maken — controleer belangrijke antwoorden. Het maatje helpt je leren, het doet je
              huiswerk niet voor je.
            </p>
          </>
        )}
      </Container>
    </main>
  );
}
