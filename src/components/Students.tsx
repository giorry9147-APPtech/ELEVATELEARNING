"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/components/AuthProvider";
import { BrandMark } from "@/components/BrandingProvider";
import {
  listStudents,
  createStudent,
  type Student,
} from "@/lib/students";
import { studentStatsMap, type StudentStats } from "@/lib/lessons";
import { Container } from "@/components/ui/Container";
import { Card } from "@/components/ui/Card";
import { Button, buttonClasses } from "@/components/ui/Button";
import { Input, Label } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import { UsersIcon, ArrowRightIcon } from "@/components/ui/icons";

export default function Students() {
  const { user, loading, enabled } = useAuth();
  const [students, setStudents] = useState<Student[] | null>(null);
  const [stats, setStats] = useState<Record<string, StudentStats>>({});
  const [busy, setBusy] = useState(true);
  const [query, setQuery] = useState("");
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState({ name: "", level: "", subject: "", email: "" });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (loading) return;
    if (!user) {
      setBusy(false);
      return;
    }
    listStudents().then((s) => {
      setStudents(s);
      setBusy(false);
    });
    studentStatsMap().then(setStats);
  }, [loading, user]);

  const filtered = useMemo(() => {
    if (!students) return [];
    const q = query.trim().toLowerCase();
    if (!q) return students;
    return students.filter((s) =>
      [s.name, s.level, s.subject, s.email]
        .filter(Boolean)
        .some((v) => v!.toLowerCase().includes(q)),
    );
  }, [students, query]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    setSaving(true);
    const created = await createStudent(form);
    setSaving(false);
    if (created) {
      setStudents((prev) => [...(prev ?? []), created].sort((a, b) => a.name.localeCompare(b.name)));
      setForm({ name: "", level: "", subject: "", email: "" });
      setAdding(false);
    }
  };

  const mustLogin = enabled && !loading && !user;

  return (
    <main className="min-h-screen flex-1 bg-muted/40">
      <header className="border-b border-border bg-surface">
        <Container className="flex items-center justify-between py-4">
          <Link href="/dashboard">
            <BrandMark />
          </Link>
          <Link
            href="/dashboard"
            className="text-sm text-muted-foreground transition hover:text-foreground"
          >
            ← Dashboard
          </Link>
        </Container>
      </header>

      <Container className="py-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <span className="inline-flex items-center gap-1.5 text-sm font-medium text-brand">
              <UsersIcon size={16} /> CRM
            </span>
            <h1 className="mt-1 text-2xl font-bold tracking-tight text-foreground">
              Leerlingen
            </h1>
          </div>
          {user && students !== null && (
            <Button onClick={() => setAdding((v) => !v)}>
              {adding ? "Sluiten" : "+ Nieuwe leerling"}
            </Button>
          )}
        </div>

        {/* Toevoeg-formulier */}
        {user && adding && (
          <Card className="mt-5 p-6">
            <form onSubmit={submit} className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="s-name">Naam *</Label>
                <Input
                  id="s-name"
                  required
                  autoFocus
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="Bijv. Lisa de Vries"
                />
              </div>
              <div>
                <Label htmlFor="s-level">Niveau / klas</Label>
                <Input
                  id="s-level"
                  value={form.level}
                  onChange={(e) => setForm({ ...form, level: e.target.value })}
                  placeholder="Bijv. 5 vwo"
                />
              </div>
              <div>
                <Label htmlFor="s-subject">Vak(ken)</Label>
                <Input
                  id="s-subject"
                  value={form.subject}
                  onChange={(e) => setForm({ ...form, subject: e.target.value })}
                  placeholder="Bijv. Wiskunde B"
                />
              </div>
              <div>
                <Label htmlFor="s-email">
                  E-mail <span className="font-normal text-muted-foreground">(optioneel)</span>
                </Label>
                <Input
                  id="s-email"
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  placeholder="ouder@voorbeeld.nl"
                />
              </div>
              <div className="sm:col-span-2">
                <Button type="submit" disabled={saving}>
                  {saving ? "Opslaan…" : "Leerling toevoegen"}
                </Button>
              </div>
            </form>
          </Card>
        )}

        {/* Zoeken */}
        {user && students && students.length > 0 && (
          <div className="mt-6">
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Zoek op naam, niveau of vak…"
              className="max-w-sm"
            />
          </div>
        )}

        {/* Inhoud */}
        {mustLogin ? (
          <Card className="mt-8 p-10 text-center">
            <p className="text-muted-foreground">Log in om je leerlingen te beheren.</p>
            <Link href="/login" className={buttonClasses({ className: "mt-4" })}>
              Inloggen
            </Link>
          </Card>
        ) : busy ? (
          <p className="mt-8 text-muted-foreground">Laden…</p>
        ) : students === null ? (
          <Card className="mt-8 p-8">
            <p className="font-medium text-foreground">Leerlingen nog niet geactiveerd</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Draai migratie <code className="rounded bg-muted px-1">005_students.sql</code> in
              de Supabase SQL-editor om het CRM in te schakelen.
            </p>
          </Card>
        ) : filtered.length === 0 ? (
          <Card className="mt-8 border-dashed p-10 text-center">
            <p className="text-muted-foreground">
              {query ? "Geen leerlingen gevonden." : "Nog geen leerlingen."}
            </p>
            {!query && (
              <Button onClick={() => setAdding(true)} className="mt-4">
                Voeg je eerste leerling toe
              </Button>
            )}
          </Card>
        ) : (
          <ul className="mt-5 grid gap-3 sm:grid-cols-2">
            {filtered.map((s) => (
              <Card key={s.id} as="li" className="p-0">
                <Link
                  href={`/leerlingen/${s.id}`}
                  className="flex items-center gap-4 p-4 transition hover:bg-muted/50"
                >
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-brand-soft text-sm font-bold text-brand-strong">
                    {initials(s.name)}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium text-foreground">{s.name}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      {[s.level, s.subject].filter(Boolean).join(" · ") || "Geen details"}
                    </p>
                  </div>
                  {stats[s.id]?.total ? (
                    <Badge variant="muted">
                      {stats[s.id].total} {stats[s.id].total === 1 ? "les" : "lessen"}
                    </Badge>
                  ) : null}
                  <ArrowRightIcon size={18} className="shrink-0 text-muted-foreground" />
                </Link>
              </Card>
            ))}
          </ul>
        )}
      </Container>
    </main>
  );
}

function initials(name: string): string {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");
}
