"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useAuth } from "@/components/AuthProvider";
import { BrandMark } from "@/components/BrandingProvider";
import { getCurrentOrg } from "@/lib/org";
import {
  getAvailability,
  saveAvailability,
  getLessonMinutes,
  setLessonMinutes,
  getBookingPrice,
  setBookingPrice,
  listBookings,
  cancelBooking,
  type Booking,
} from "@/lib/booking";
import { hmToMin, minToHm, type WindowDef } from "@/lib/slots";
import { Container } from "@/components/ui/Container";
import { Card } from "@/components/ui/Card";
import { Button, buttonClasses } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { cn } from "@/components/ui/cn";
import { CalendarIcon, ClockIcon } from "@/components/ui/icons";

const WEEKDAYS = [
  { iso: 1, label: "Maandag" },
  { iso: 2, label: "Dinsdag" },
  { iso: 3, label: "Woensdag" },
  { iso: 4, label: "Donderdag" },
  { iso: 5, label: "Vrijdag" },
  { iso: 6, label: "Zaterdag" },
  { iso: 7, label: "Zondag" },
];
const DURATIONS = [30, 45, 60, 90];

type DayState = { enabled: boolean; start: string; end: string };

function emptyDays(): Record<number, DayState> {
  const o: Record<number, DayState> = {};
  for (const w of WEEKDAYS) o[w.iso] = { enabled: false, start: "16:00", end: "20:00" };
  return o;
}

export default function Schedule() {
  const { user, loading, enabled } = useAuth();
  const [orgId, setOrgId] = useState<string | null>(null);
  const [avail, setAvail] = useState<WindowDef[] | null | undefined>(undefined);
  const [dayState, setDayState] = useState<Record<number, DayState>>(emptyDays());
  const [lessonMin, setLessonMin] = useState(60);
  const [priceEur, setPriceEur] = useState("0");
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (loading || !user) return;
    getCurrentOrg().then((o) => setOrgId(o?.id ?? null));
    getLessonMinutes().then(setLessonMin);
    getBookingPrice().then((c) => setPriceEur(c ? (c / 100).toString().replace(".", ",") : "0"));
    listBookings().then(setBookings);
    getAvailability().then((w) => {
      setAvail(w);
      if (w) {
        const next = emptyDays();
        for (const win of w) {
          next[win.weekday] = {
            enabled: true,
            start: minToHm(win.startMin),
            end: minToHm(win.endMin),
          };
        }
        setDayState(next);
      }
    });
  }, [loading, user]);

  const save = async () => {
    setSaving(true);
    const windows: WindowDef[] = [];
    for (const w of WEEKDAYS) {
      const d = dayState[w.iso];
      if (!d.enabled) continue;
      const s = hmToMin(d.start);
      const e = hmToMin(d.end);
      if (e > s) windows.push({ weekday: w.iso, startMin: s, endMin: e });
    }
    await saveAvailability(windows);
    await setLessonMinutes(lessonMin);
    await setBookingPrice(Math.round(parseFloat(priceEur.replace(",", ".") || "0") * 100));
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
  };

  const remove = async (id: string) => {
    setBookings((prev) => prev.filter((b) => b.id !== id));
    await cancelBooking(id);
  };

  const bookUrl =
    typeof window !== "undefined" && orgId ? `${window.location.origin}/boeken/${orgId}` : "";
  const copyLink = async () => {
    if (!bookUrl) return;
    await navigator.clipboard.writeText(bookUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const mustLogin = enabled && !loading && !user;
  const now = Date.now();
  const upcoming = bookings.filter((b) => b.startsAt >= now);

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
          <CalendarIcon size={16} /> Rooster
        </span>
        <h1 className="mt-1 text-2xl font-bold tracking-tight text-foreground">
          Beschikbaarheid &amp; boekingen
        </h1>

        {mustLogin ? (
          <Card className="mt-8 p-10 text-center">
            <p className="text-muted-foreground">Log in om je rooster te beheren.</p>
            <Link href="/login" className={buttonClasses({ className: "mt-4" })}>
              Inloggen
            </Link>
          </Card>
        ) : avail === null ? (
          <Card className="mt-8 p-8">
            <p className="font-medium text-foreground">Rooster nog niet geactiveerd</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Draai migratie <code className="rounded bg-muted px-1">010_bookings.sql</code> in de
              Supabase SQL-editor om boekingen in te schakelen.
            </p>
          </Card>
        ) : (
          <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_360px]">
            {/* Beschikbaarheid */}
            <div className="space-y-6">
              <Card className="p-6">
                <h2 className="font-semibold text-foreground">Les &amp; prijs</h2>
                <p className="mt-3 text-sm font-medium text-foreground">Lesduur</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {DURATIONS.map((m) => (
                    <button
                      key={m}
                      onClick={() => setLessonMin(m)}
                      className={cn(
                        "rounded-full px-4 py-2 text-sm font-medium transition",
                        lessonMin === m
                          ? "bg-brand text-white"
                          : "bg-muted text-muted-foreground hover:bg-border",
                      )}
                    >
                      {m} min
                    </button>
                  ))}
                </div>

                <div className="mt-4 max-w-xs">
                  <p className="mb-1.5 text-sm font-medium text-foreground">
                    Prijs per les (€){" "}
                    <span className="font-normal text-muted-foreground">— 0 = gratis boeken</span>
                  </p>
                  <Input
                    inputMode="decimal"
                    value={priceEur}
                    onChange={(e) => setPriceEur(e.target.value)}
                    placeholder="0"
                  />
                  <p className="mt-1.5 text-xs text-muted-foreground">
                    Bij een prijs &gt; 0 rekent de leerling direct af (vereist actieve uitbetaling op{" "}
                    <Link href="/tarieven" className="text-brand underline">Tarieven</Link>).
                  </p>
                </div>
              </Card>

              <Card className="p-6">
                <h2 className="font-semibold text-foreground">Wekelijkse beschikbaarheid</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Vink de dagen aan waarop je lesgeeft en kies de tijden.
                </p>
                <div className="mt-4 space-y-2.5">
                  {WEEKDAYS.map((w) => {
                    const d = dayState[w.iso];
                    return (
                      <div key={w.iso} className="flex flex-wrap items-center gap-3 rounded-xl border border-border p-3">
                        <label className="flex w-32 shrink-0 cursor-pointer items-center gap-2 text-sm font-medium text-foreground">
                          <input
                            type="checkbox"
                            checked={d.enabled}
                            onChange={(e) => setDayState({ ...dayState, [w.iso]: { ...d, enabled: e.target.checked } })}
                            className="h-4 w-4 accent-[var(--brand)]"
                          />
                          {w.label}
                        </label>
                        <div className={cn("flex items-center gap-2", !d.enabled && "opacity-40")}>
                          <div className="w-28">
                            <Input
                              type="time"
                              value={d.start}
                              disabled={!d.enabled}
                              onChange={(e) => setDayState({ ...dayState, [w.iso]: { ...d, start: e.target.value } })}
                            />
                          </div>
                          <span className="text-muted-foreground">–</span>
                          <div className="w-28">
                            <Input
                              type="time"
                              value={d.end}
                              disabled={!d.enabled}
                              onChange={(e) => setDayState({ ...dayState, [w.iso]: { ...d, end: e.target.value } })}
                            />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
                <Button onClick={save} disabled={saving} className="mt-4">
                  {saving ? "Opslaan…" : saved ? "Opgeslagen ✓" : "Beschikbaarheid opslaan"}
                </Button>
              </Card>
            </div>

            {/* Boekingslink + aankomende boekingen */}
            <div className="space-y-6">
              <Card className="p-5">
                <h2 className="font-semibold text-foreground">Boekingslink</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Deel deze link; leerlingen kiezen zelf een vrij moment.
                </p>
                {bookUrl && (
                  <div className="mt-3 flex gap-2">
                    <Link href={bookUrl} className={buttonClasses({ variant: "secondary", size: "sm" })}>
                      Open
                    </Link>
                    <Button variant="secondary" size="sm" onClick={copyLink}>
                      {copied ? "Gekopieerd!" : "Kopieer link"}
                    </Button>
                  </div>
                )}
              </Card>

              <Card className="p-5">
                <h2 className="font-semibold text-foreground">Aankomende lessen</h2>
                {upcoming.length === 0 ? (
                  <p className="mt-2 text-sm text-muted-foreground">Nog geen boekingen.</p>
                ) : (
                  <ul className="mt-3 space-y-2.5">
                    {upcoming.map((b) => (
                      <li key={b.id} className="rounded-xl border border-border p-3">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <p className="flex items-center gap-1.5 text-sm font-medium text-foreground">
                              <ClockIcon size={14} className="text-brand" />
                              {new Date(b.startsAt).toLocaleString("nl-NL", {
                                weekday: "short",
                                day: "numeric",
                                month: "short",
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </p>
                            <p className="truncate text-xs text-muted-foreground">
                              {b.studentName || b.studentEmail || "Onbekend"}
                            </p>
                          </div>
                          <button
                            onClick={() => remove(b.id)}
                            className="rounded-full px-2 py-1 text-xs text-muted-foreground transition hover:bg-muted hover:text-danger"
                          >
                            Annuleer
                          </button>
                        </div>
                        {b.roomId && (
                          <Link
                            href={`/klas/${b.roomId}`}
                            className={buttonClasses({ variant: "secondary", size: "sm", className: "mt-2" })}
                          >
                            Open les
                          </Link>
                        )}
                      </li>
                    ))}
                  </ul>
                )}
              </Card>
            </div>
          </div>
        )}
      </Container>
    </main>
  );
}
