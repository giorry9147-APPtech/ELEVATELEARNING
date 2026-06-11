"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/components/AuthProvider";
import { BrandMark } from "@/components/BrandingProvider";
import {
  getStudent,
  updateStudent,
  deleteStudent,
  listNotes,
  addNote,
  type Student,
  type StudentNote,
} from "@/lib/students";
import {
  listStudentLessons,
  listLinkableSessions,
  linkLesson,
  setAttendance,
  unlinkLesson,
  startLessonForStudent,
  type StudentLesson,
  type LinkableSession,
  type AttendanceStatus,
} from "@/lib/lessons";
import { Container } from "@/components/ui/Container";
import { Card } from "@/components/ui/Card";
import { Button, buttonClasses } from "@/components/ui/Button";
import { Input, Label, Textarea } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import { cn } from "@/components/ui/cn";
import { ClockIcon, WhiteboardIcon } from "@/components/ui/icons";

const STATUS: { key: AttendanceStatus; label: string }[] = [
  { key: "planned", label: "Gepland" },
  { key: "present", label: "Aanwezig" },
  { key: "absent", label: "Afwezig" },
];

export default function StudentDetail({ studentId }: { studentId: string }) {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [student, setStudent] = useState<Student | null | undefined>(undefined);
  const [notes, setNotes] = useState<StudentNote[]>([]);
  const [lessons, setLessons] = useState<StudentLesson[]>([]);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState<Record<string, string>>({});
  const [noteBody, setNoteBody] = useState("");
  const [noteKind, setNoteKind] = useState<"note" | "contact">("note");
  const [lessonTitle, setLessonTitle] = useState("");
  const [picker, setPicker] = useState<LinkableSession[] | null>(null);
  const [saving, setSaving] = useState(false);
  const [starting, setStarting] = useState(false);

  useEffect(() => {
    if (loading || !user) return;
    getStudent(studentId).then((s) => {
      setStudent(s);
      if (s) {
        setForm({
          name: s.name,
          level: s.level ?? "",
          subject: s.subject ?? "",
          email: s.email ?? "",
          phone: s.phone ?? "",
        });
      }
    });
    listNotes(studentId).then(setNotes);
    listStudentLessons(studentId).then(setLessons);
  }, [loading, user, studentId]);

  const saveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const ok = await updateStudent(studentId, form);
    setSaving(false);
    if (ok) {
      setStudent((s) => (s ? ({ ...s, ...form } as Student) : s));
      setEditing(false);
    }
  };

  const submitNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!noteBody.trim()) return;
    setSaving(true);
    const created = await addNote(studentId, noteBody, noteKind);
    setSaving(false);
    if (created) {
      setNotes((prev) => [created, ...prev]);
      setNoteBody("");
    }
  };

  const remove = async () => {
    if (!window.confirm("Deze leerling en alle notities verwijderen?")) return;
    await deleteStudent(studentId);
    router.push("/leerlingen");
  };

  const startLesson = async () => {
    if (!student) return;
    setStarting(true);
    const room = await startLessonForStudent(
      studentId,
      lessonTitle.trim() || `Les — ${student.name}`,
    );
    if (room) router.push(`/klas/${room}`);
    else setStarting(false);
  };

  const openPicker = async () => {
    setPicker([]);
    setPicker(await listLinkableSessions(studentId));
  };

  const link = async (s: LinkableSession) => {
    const ok = await linkLesson(s.id, studentId, "planned");
    if (ok) {
      setLessons((prev) =>
        [
          {
            attendanceId: `tmp-${s.id}`,
            sessionId: s.id,
            roomId: s.roomId,
            title: s.title,
            createdAt: s.createdAt,
            status: "planned" as AttendanceStatus,
          },
          ...prev,
        ].sort((a, b) => b.createdAt - a.createdAt),
      );
      setPicker((p) => (p ? p.filter((x) => x.id !== s.id) : p));
      // ververs zodat we het echte attendance-id krijgen
      listStudentLessons(studentId).then(setLessons);
    }
  };

  const changeStatus = async (lesson: StudentLesson, status: AttendanceStatus) => {
    setLessons((prev) =>
      prev.map((l) => (l.attendanceId === lesson.attendanceId ? { ...l, status } : l)),
    );
    await setAttendance(lesson.attendanceId, status);
  };

  const unlink = async (lesson: StudentLesson) => {
    setLessons((prev) => prev.filter((l) => l.attendanceId !== lesson.attendanceId));
    await unlinkLesson(lesson.attendanceId);
  };

  const stats = useMemo(() => {
    const s = { total: lessons.length, present: 0, absent: 0, planned: 0 };
    for (const l of lessons) s[l.status]++;
    return s;
  }, [lessons]);

  if (!loading && !user) {
    return (
      <Centered>
        <p className="text-muted-foreground">Log in om deze leerling te bekijken.</p>
        <Link href="/login" className={buttonClasses({ className: "mt-4" })}>
          Inloggen
        </Link>
      </Centered>
    );
  }

  if (student === undefined) {
    return <Centered>{loading ? "" : <p className="text-muted-foreground">Laden…</p>}</Centered>;
  }

  if (student === null) {
    return (
      <Centered>
        <p className="text-muted-foreground">Leerling niet gevonden.</p>
        <Link href="/leerlingen" className={buttonClasses({ variant: "secondary", className: "mt-4" })}>
          Terug naar leerlingen
        </Link>
      </Centered>
    );
  }

  return (
    <main className="min-h-screen flex-1 app-surface">
      <header className="app-header">
        <Container className="flex items-center justify-between py-4">
          <Link href="/dashboard">
            <BrandMark />
          </Link>
          <Link href="/leerlingen" className="text-sm text-muted-foreground transition hover:text-foreground">
            ← Leerlingen
          </Link>
        </Container>
      </header>

      <Container className="grid gap-6 py-8 lg:grid-cols-[340px_1fr]">
        {/* Profiel */}
        <div>
          <Card className="p-6">
            <div className="flex items-center gap-4">
              <span className="flex h-14 w-14 items-center justify-center rounded-full bg-brand-soft text-lg font-bold text-brand-strong">
                {initials(student.name)}
              </span>
              <div className="min-w-0">
                <h1 className="truncate text-xl font-bold tracking-tight text-foreground">
                  {student.name}
                </h1>
                <p className="truncate text-sm text-muted-foreground">
                  {[student.level, student.subject].filter(Boolean).join(" · ") || "Geen details"}
                </p>
              </div>
            </div>

            {!editing ? (
              <>
                <dl className="mt-5 space-y-2.5 text-sm">
                  <Row label="E-mail" value={student.email} />
                  <Row label="Telefoon" value={student.phone} />
                  <Row label="Niveau" value={student.level} />
                  <Row label="Vak" value={student.subject} />
                </dl>
                <div className="mt-5 flex gap-2">
                  <Button variant="secondary" size="sm" onClick={() => setEditing(true)}>
                    Bewerken
                  </Button>
                  <button
                    onClick={remove}
                    className="rounded-full px-3 py-1.5 text-sm font-medium text-muted-foreground transition hover:bg-muted hover:text-danger"
                  >
                    Verwijderen
                  </button>
                </div>
              </>
            ) : (
              <form onSubmit={saveProfile} className="mt-5 space-y-3">
                {([
                  ["name", "Naam"],
                  ["level", "Niveau / klas"],
                  ["subject", "Vak(ken)"],
                  ["email", "E-mail"],
                  ["phone", "Telefoon"],
                ] as const).map(([key, label]) => (
                  <div key={key}>
                    <Label htmlFor={`f-${key}`}>{label}</Label>
                    <Input
                      id={`f-${key}`}
                      value={form[key] ?? ""}
                      onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                    />
                  </div>
                ))}
                <div className="flex gap-2 pt-1">
                  <Button type="submit" size="sm" disabled={saving}>
                    {saving ? "Opslaan…" : "Opslaan"}
                  </Button>
                  <Button type="button" variant="ghost" size="sm" onClick={() => setEditing(false)}>
                    Annuleren
                  </Button>
                </div>
              </form>
            )}
          </Card>
        </div>

        {/* Rechterkolom */}
        <div className="space-y-6">
          {/* Lessen + aanwezigheid */}
          <Card className="p-6">
            <div className="flex flex-wrap items-center gap-2">
              <WhiteboardIcon size={18} className="text-brand" />
              <h2 className="font-semibold text-foreground">Lessen & aanwezigheid</h2>
              <span className="ml-auto flex gap-2">
                <Button variant="secondary" size="sm" onClick={openPicker}>
                  Bestaande les koppelen
                </Button>
              </span>
            </div>

            {/* Stats */}
            {stats.total > 0 && (
              <div className="mt-4 grid grid-cols-4 gap-2">
                <Stat label="Lessen" value={stats.total} />
                <Stat label="Aanwezig" value={stats.present} tone="text-success" />
                <Stat label="Afwezig" value={stats.absent} tone="text-danger" />
                <Stat label="Gepland" value={stats.planned} tone="text-brand" />
              </div>
            )}

            {/* Start direct een les */}
            <div className="mt-4 flex flex-col gap-2 sm:flex-row">
              <Input
                value={lessonTitle}
                onChange={(e) => setLessonTitle(e.target.value)}
                placeholder={`Les voor ${student.name} (titel optioneel)`}
              />
              <Button onClick={startLesson} disabled={starting} className="shrink-0">
                {starting ? "Bezig…" : "Start les"}
              </Button>
            </div>

            {/* Picker voor bestaande sessies */}
            {picker !== null && (
              <div className="mt-3 rounded-xl border border-border bg-muted/40 p-3">
                {picker.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    Geen losse lessen om te koppelen.
                  </p>
                ) : (
                  <ul className="space-y-1.5">
                    {picker.map((s) => (
                      <li key={s.id} className="flex items-center justify-between gap-2 text-sm">
                        <span className="min-w-0 truncate text-foreground">{s.title}</span>
                        <Button variant="ghost" size="sm" onClick={() => link(s)}>
                          Koppelen
                        </Button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}

            {/* Gekoppelde lessen */}
            {lessons.length === 0 ? (
              <p className="mt-4 text-sm text-muted-foreground">
                Nog geen lessen gekoppeld. Start er een of koppel een bestaande les.
              </p>
            ) : (
              <ul className="mt-4 space-y-2.5">
                {lessons.map((l) => (
                  <li
                    key={l.attendanceId}
                    className="flex flex-wrap items-center gap-2 rounded-xl border border-border p-3"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-foreground">{l.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(l.createdAt).toLocaleDateString("nl-NL", { dateStyle: "medium" })}
                      </p>
                    </div>
                    <div className="flex overflow-hidden rounded-full border border-border">
                      {STATUS.map((st) => (
                        <button
                          key={st.key}
                          onClick={() => changeStatus(l, st.key)}
                          className={cn(
                            "px-2.5 py-1 text-xs font-medium transition",
                            l.status === st.key
                              ? st.key === "present"
                                ? "bg-success text-white"
                                : st.key === "absent"
                                  ? "bg-danger text-white"
                                  : "bg-brand text-white"
                              : "text-muted-foreground hover:bg-muted",
                          )}
                        >
                          {st.label}
                        </button>
                      ))}
                    </div>
                    <Link href={`/klas/${l.roomId}`} className={buttonClasses({ variant: "secondary", size: "sm" })}>
                      Open
                    </Link>
                    <button
                      onClick={() => unlink(l)}
                      className="rounded-full p-1.5 text-muted-foreground transition hover:bg-muted hover:text-danger"
                      aria-label="Ontkoppelen"
                    >
                      ✕
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </Card>

          {/* CRM: notitie toevoegen */}
          <Card className="p-6">
            <h2 className="font-semibold text-foreground">Notitie of contactmoment</h2>
            <form onSubmit={submitNote} className="mt-3">
              <div className="mb-2 flex gap-2">
                {(["note", "contact"] as const).map((k) => (
                  <button
                    key={k}
                    type="button"
                    onClick={() => setNoteKind(k)}
                    className={cn(
                      "rounded-full px-3 py-1.5 text-sm font-medium transition",
                      noteKind === k
                        ? "bg-brand text-white"
                        : "bg-muted text-muted-foreground hover:bg-border",
                    )}
                  >
                    {k === "note" ? "Voortgangsnotitie" : "Contactmoment"}
                  </button>
                ))}
              </div>
              <Textarea
                value={noteBody}
                onChange={(e) => setNoteBody(e.target.value)}
                rows={3}
                placeholder={
                  noteKind === "note"
                    ? "Bijv. Kwadratische formules gaan goed; nog oefenen met ontbinden."
                    : "Bijv. Gebeld met ouder over planning vakantieweek."
                }
              />
              <Button type="submit" size="sm" disabled={saving} className="mt-3">
                {saving ? "Opslaan…" : "Toevoegen"}
              </Button>
            </form>
          </Card>

          {/* Tijdlijn */}
          <div>
            <h2 className="mb-3 text-sm font-semibold tracking-wide text-muted-foreground uppercase">
              Tijdlijn
            </h2>
            {notes.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nog geen notities of contactmomenten.</p>
            ) : (
              <ul className="space-y-3">
                {notes.map((n) => (
                  <Card key={n.id} as="li" className="p-4">
                    <div className="mb-1.5 flex items-center gap-2">
                      <Badge variant={n.kind === "contact" ? "accent" : "brand"}>
                        {n.kind === "contact" ? "Contact" : "Notitie"}
                      </Badge>
                      <span className="flex items-center gap-1 text-xs text-muted-foreground">
                        <ClockIcon size={13} />
                        {new Date(n.createdAt).toLocaleString("nl-NL", {
                          dateStyle: "medium",
                          timeStyle: "short",
                        })}
                      </span>
                    </div>
                    <p className="whitespace-pre-wrap text-sm text-foreground">{n.body}</p>
                  </Card>
                ))}
              </ul>
            )}
          </div>
        </div>
      </Container>
    </main>
  );
}

function Centered({ children }: { children: React.ReactNode }) {
  return (
    <main className="flex min-h-screen flex-1 items-center justify-center app-surface px-4">
      <Card className="p-10 text-center">{children}</Card>
    </main>
  );
}

function Stat({
  label,
  value,
  tone = "text-foreground",
}: {
  label: string;
  value: number;
  tone?: string;
}) {
  return (
    <div className="rounded-xl border border-border bg-muted/40 p-2.5 text-center">
      <p className={cn("text-xl font-bold", tone)}>{value}</p>
      <p className="text-[11px] text-muted-foreground">{label}</p>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string | null }) {
  return (
    <div className="flex justify-between gap-3">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="text-right font-medium text-foreground">{value || "—"}</dd>
    </div>
  );
}

function initials(name: string): string {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");
}
