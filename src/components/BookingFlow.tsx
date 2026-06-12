"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { generateSlots, slotTime, type DaySlots, type WindowDef } from "@/lib/slots";
import { Container, SectionHeading } from "@/components/ui/Container";
import { SkyBackdrop } from "@/components/ui/SkyBackdrop";
import { Card } from "@/components/ui/Card";
import { Button, buttonClasses } from "@/components/ui/Button";
import { Input, Label } from "@/components/ui/Input";
import { cn } from "@/components/ui/cn";
import { GraduationIcon, CalendarIcon, CheckIcon, ClockIcon } from "@/components/ui/icons";

export default function BookingFlow({
  orgId,
  orgName,
  windows,
  bookedStarts,
  lessonMin,
}: {
  orgId: string;
  orgName: string;
  windows: WindowDef[];
  bookedStarts: number[];
  lessonMin: number;
}) {
  // Slots client-side berekenen (lokale tijdzone; voorkomt SSR/UTC-mismatch).
  const [days, setDays] = useState<DaySlots[] | null>(null);
  const [selected, setSelected] = useState<number | null>(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState<{ roomId: string; startsAt: number } | null>(null);

  useEffect(() => {
    setDays(generateSlots(windows, bookedStarts, lessonMin));
  }, [windows, bookedStarts, lessonMin]);

  const book = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selected) return;
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/bookings/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orgId, startMs: selected, name, email }),
      });
      const data = await res.json();
      if (data?.roomId) setDone({ roomId: data.roomId, startsAt: data.startsAt });
      else setError(data?.error ?? "Boeken lukt nu niet.");
    } catch {
      setError("Er ging iets mis. Probeer het later opnieuw.");
    } finally {
      setBusy(false);
    }
  };

  if (done) {
    const when = new Date(done.startsAt).toLocaleString("nl-NL", {
      weekday: "long",
      day: "numeric",
      month: "long",
      hour: "2-digit",
      minute: "2-digit",
    });
    return (
      <SkyBackdrop variant="green" className="flex min-h-screen flex-col items-center justify-center px-4 py-10">
        <Container size="md">
          <Card className="mx-auto max-w-md p-8 text-center">
            <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-green-50 text-success">
              <CheckIcon size={30} />
            </span>
            <h1 className="mt-4 text-2xl font-bold tracking-tight text-foreground">Les geboekt!</h1>
            <p className="mt-2 text-muted-foreground">
              Je les bij <strong className="text-foreground">{orgName}</strong> staat gepland op{" "}
              <strong className="text-foreground">{when}</strong>.
            </p>
            <p className="mt-4 text-sm text-muted-foreground">Bewaar je leslink — hiermee kom je in de les:</p>
            <Link href={`/klas/${done.roomId}`} className={buttonClasses({ size: "lg", className: "mt-3" })}>
              Open de les
            </Link>
          </Card>
        </Container>
      </SkyBackdrop>
    );
  }

  return (
    <main className="flex-1">
      <SkyBackdrop variant="green">
        <Container size="md" className="py-12 sm:py-16">
          <div className="mx-auto mb-3 flex w-fit items-center gap-2 rounded-full bg-white/60 px-3.5 py-1.5 text-sm font-semibold text-[#15532f] ring-1 ring-[#15803d]/15 backdrop-blur">
            <GraduationIcon size={14} /> {orgName}
          </div>
          <SectionHeading
            title="Plan je les in"
            description={`Kies een vrij moment. Een les duurt ${lessonMin} minuten.`}
          />
        </Container>
      </SkyBackdrop>

      <Container size="md" className="-mt-8 pb-20">
        {days === null ? (
          <p className="text-center text-muted-foreground">Beschikbaarheid laden…</p>
        ) : days.length === 0 ? (
          <Card className="p-10 text-center text-muted-foreground">
            Er zijn op dit moment geen vrije momenten. Probeer het later opnieuw.
          </Card>
        ) : (
          <div className="space-y-5">
            {days.map((d) => (
              <Card key={d.dayMs} className="p-5">
                <div className="mb-3 flex items-center gap-2">
                  <CalendarIcon size={18} className="text-brand" />
                  <h3 className="font-semibold capitalize text-foreground">{d.label}</h3>
                </div>
                <div className="flex flex-wrap gap-2">
                  {d.slots.map((ms) => (
                    <button
                      key={ms}
                      onClick={() => {
                        setSelected(ms);
                        setError("");
                        setTimeout(
                          () => document.getElementById("boekform")?.scrollIntoView({ behavior: "smooth", block: "center" }),
                          50,
                        );
                      }}
                      className={cn(
                        "rounded-full px-3.5 py-2 text-sm font-medium transition",
                        selected === ms
                          ? "bg-brand text-white"
                          : "bg-muted text-foreground hover:bg-brand-soft hover:text-brand-strong",
                      )}
                    >
                      {slotTime(ms)}
                    </button>
                  ))}
                </div>
              </Card>
            ))}
          </div>
        )}

        {selected && (
          <Card id="boekform" className="mt-6 p-6">
            <p className="text-sm text-muted-foreground">Gekozen moment</p>
            <p className="mt-1 flex items-center gap-2 font-semibold text-foreground">
              <ClockIcon size={16} className="text-brand" />
              {new Date(selected).toLocaleString("nl-NL", {
                weekday: "long",
                day: "numeric",
                month: "long",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </p>
            <form onSubmit={book} className="mt-4 grid gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="bk-name">Je naam</Label>
                <Input id="bk-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Voor- en achternaam" />
              </div>
              <div>
                <Label htmlFor="bk-email">E-mail</Label>
                <Input id="bk-email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="jij@voorbeeld.nl" />
              </div>
              {error && <p className="text-sm text-danger sm:col-span-2">{error}</p>}
              <div className="sm:col-span-2">
                <Button type="submit" disabled={busy} fullWidth size="lg">
                  {busy ? "Bezig…" : "Bevestig boeking"}
                </Button>
              </div>
            </form>
          </Card>
        )}
      </Container>
    </main>
  );
}
