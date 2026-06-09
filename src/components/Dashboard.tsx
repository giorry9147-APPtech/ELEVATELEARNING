"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { roomUrl, type RecentSession } from "@/lib/rooms";
import { listSessions, deleteSession } from "@/lib/sessions";
import { getCurrentOrg, type Org } from "@/lib/org";
import { listStudents } from "@/lib/students";
import { studentStatsMap } from "@/lib/lessons";
import { useAuth } from "@/components/AuthProvider";
import { BrandMark } from "@/components/BrandingProvider";
import BillingCard from "@/components/BillingCard";
import { Container } from "@/components/ui/Container";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button, buttonClasses } from "@/components/ui/Button";
import { GraduationIcon, ArrowRightIcon, UsersIcon } from "@/components/ui/icons";

export default function Dashboard() {
  const { user, loading, enabled, signOut } = useAuth();
  const [sessions, setSessions] = useState<RecentSession[]>([]);
  const [org, setOrg] = useState<Org | null>(null);
  const [copied, setCopied] = useState<string | null>(null);
  const [busy, setBusy] = useState(true);
  const [studentCount, setStudentCount] = useState<number | null>(null);
  const [lessonCount, setLessonCount] = useState(0);

  useEffect(() => {
    if (loading) return;
    // Bij ingeschakelde Supabase wachten we tot we de auth-status kennen.
    listSessions(user?.id ?? null).then((s) => {
      setSessions(s);
      setBusy(false);
    });
    if (user) {
      getCurrentOrg().then(setOrg);
      listStudents().then((s) => setStudentCount(s ? s.length : null));
      studentStatsMap().then((m) =>
        setLessonCount(Object.values(m).reduce((sum, x) => sum + x.total, 0)),
      );
    }
  }, [loading, user]);

  const remove = async (roomId: string) => {
    await deleteSession(roomId, user?.id ?? null);
    setSessions(await listSessions(user?.id ?? null));
  };

  const copy = async (roomId: string) => {
    await navigator.clipboard.writeText(roomUrl(roomId));
    setCopied(roomId);
    setTimeout(() => setCopied(null), 1500);
  };

  // Soft auth-gate: met Supabase actief maar niet ingelogd → vraag te loggen.
  const mustLogin = enabled && !loading && !user;

  return (
    <main className="min-h-screen flex-1 bg-muted/40">
      <header className="border-b border-border bg-surface">
        <Container className="flex items-center justify-between py-4">
          <Link href="/">
            <BrandMark />
          </Link>
          <div className="flex items-center gap-2">
            {user && (
              <>
                <span className="hidden text-sm text-muted-foreground sm:inline">
                  {user.email}
                </span>
                <Link href="/leerlingen" className={buttonClasses({ variant: "secondary", size: "sm" })}>
                  Leerlingen
                </Link>
                <Link href="/tarieven" className={buttonClasses({ variant: "secondary", size: "sm" })}>
                  Tarieven
                </Link>
                <Link href="/settings" className={buttonClasses({ variant: "secondary", size: "sm" })}>
                  Instellingen
                </Link>
                <button onClick={signOut} className={buttonClasses({ variant: "ghost", size: "sm" })}>
                  Uitloggen
                </button>
              </>
            )}
            <Link href="/" className={buttonClasses({ size: "sm" })}>
              + Nieuwe les
            </Link>
          </div>
        </Container>
      </header>

      <Container className="py-8">
        {org && (
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 text-sm font-medium text-brand">
              <GraduationIcon size={16} /> {org.name}
            </span>
            <Badge variant="muted">{org.role}</Badge>
          </div>
        )}
        <h1 className="mt-1.5 text-2xl font-bold tracking-tight text-foreground">
          Mijn lessen
        </h1>
        {user && <BillingCard />}
        {user && studentCount !== null && (
          <Card className="mt-6 flex flex-wrap items-center gap-4 p-5">
            <span className="flex h-11 w-11 items-center justify-center rounded-full bg-brand-soft text-brand-strong">
              <UsersIcon size={22} />
            </span>
            <div className="flex-1">
              <p className="text-sm text-muted-foreground">Leerlingen (CRM)</p>
              <p className="text-lg font-semibold text-foreground">
                {studentCount} {studentCount === 1 ? "leerling" : "leerlingen"}
                {lessonCount > 0 && (
                  <span className="font-normal text-muted-foreground">
                    {" · "}
                    {lessonCount} gekoppelde {lessonCount === 1 ? "les" : "lessen"}
                  </span>
                )}
              </p>
            </div>
            <Link href="/leerlingen" className={buttonClasses({ variant: "secondary", size: "sm" })}>
              Beheer leerlingen
            </Link>
          </Card>
        )}
        {!enabled && (
          <p className="mt-1 text-sm text-warning">
            Lokale modus — deze lijst staat alleen op dit apparaat.
          </p>
        )}

        {mustLogin ? (
          <Card className="mt-8 p-10 text-center">
            <p className="text-muted-foreground">Log in om je lessen te zien.</p>
            <Link href="/login" className={buttonClasses({ size: "md", className: "mt-4" })}>
              Inloggen
            </Link>
          </Card>
        ) : busy ? (
          <p className="mt-8 text-muted-foreground">Laden…</p>
        ) : sessions.length === 0 ? (
          <Card className="mt-8 border-dashed p-10 text-center">
            <p className="text-muted-foreground">Nog geen lessen.</p>
            <Link href="/" className={buttonClasses({ size: "md", className: "mt-4" })}>
              Start je eerste les <ArrowRightIcon size={18} />
            </Link>
          </Card>
        ) : (
          <ul className="mt-6 space-y-3">
            {sessions.map((s) => (
              <Card
                key={s.roomId}
                as="li"
                className="flex items-center justify-between p-4"
              >
                <div className="min-w-0">
                  <p className="truncate font-medium text-foreground">{s.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(s.createdAt).toLocaleString("nl-NL", {
                      dateStyle: "medium",
                      timeStyle: "short",
                    })}{" "}
                    · {s.roomId}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <Button onClick={() => copy(s.roomId)} variant="secondary" size="sm">
                    {copied === s.roomId ? "Gekopieerd!" : "Link"}
                  </Button>
                  <Link href={`/klas/${s.roomId}`} className={buttonClasses({ size: "sm" })}>
                    Open
                  </Link>
                  <button
                    onClick={() => remove(s.roomId)}
                    className="rounded-full p-2 text-muted-foreground transition hover:bg-muted hover:text-danger"
                    aria-label="Verwijderen"
                  >
                    ✕
                  </button>
                </div>
              </Card>
            ))}
          </ul>
        )}
      </Container>
    </main>
  );
}
