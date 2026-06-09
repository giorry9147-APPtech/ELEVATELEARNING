"use client";

import { createClient } from "@/lib/supabase/client";

/**
 * Leerlingen-roster + CRM-data (Fase 5). Tenant-scoped via RLS.
 * Werkt-zonder-migratie: bij ontbrekende tabel/keys geven de lees-functies
 * `null` terug (de UI toont dan een nette hint) i.p.v. te crashen.
 */

export type Student = {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  subject: string | null;
  level: string | null;
  archived: boolean;
  createdAt: number;
};

export type StudentNote = {
  id: string;
  body: string;
  kind: "note" | "contact";
  createdAt: number;
};

type StudentRow = {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  subject: string | null;
  level: string | null;
  archived: boolean | null;
  created_at: string;
};

type NoteRow = {
  id: string;
  body: string;
  kind: string;
  created_at: string;
};

export type StudentInput = {
  name: string;
  email?: string;
  phone?: string;
  subject?: string;
  level?: string;
};

function mapStudent(r: StudentRow): Student {
  return {
    id: r.id,
    name: r.name,
    email: r.email,
    phone: r.phone,
    subject: r.subject,
    level: r.level,
    archived: !!r.archived,
    createdAt: new Date(r.created_at).getTime(),
  };
}

const COLS = "id,name,email,phone,subject,level,archived,created_at";

/** Alle (niet-gearchiveerde) leerlingen van de tenant. `null` = niet beschikbaar. */
export async function listStudents(): Promise<Student[] | null> {
  const supabase = createClient();
  if (!supabase) return [];
  const { data, error } = await supabase
    .from("students")
    .select(COLS)
    .order("name", { ascending: true });
  if (error) return null;
  return (data as StudentRow[]).map(mapStudent);
}

export async function getStudent(id: string): Promise<Student | null> {
  const supabase = createClient();
  if (!supabase) return null;
  const { data, error } = await supabase
    .from("students")
    .select(COLS)
    .eq("id", id)
    .maybeSingle();
  if (error || !data) return null;
  return mapStudent(data as StudentRow);
}

export async function createStudent(input: StudentInput): Promise<Student | null> {
  const supabase = createClient();
  if (!supabase) return null;
  const { data: orgId } = await supabase.rpc("ensure_my_org");
  const { data, error } = await supabase
    .from("students")
    .insert({
      org_id: orgId ?? null,
      name: input.name.trim(),
      email: input.email?.trim() || null,
      phone: input.phone?.trim() || null,
      subject: input.subject?.trim() || null,
      level: input.level?.trim() || null,
    })
    .select(COLS)
    .maybeSingle();
  if (error || !data) return null;
  return mapStudent(data as StudentRow);
}

export async function updateStudent(
  id: string,
  patch: Partial<StudentInput>,
): Promise<boolean> {
  const supabase = createClient();
  if (!supabase) return false;
  const clean: Record<string, string | null> = {};
  for (const k of ["name", "email", "phone", "subject", "level"] as const) {
    if (k in patch) clean[k] = (patch[k]?.trim() || null) as string | null;
  }
  const { error } = await supabase.from("students").update(clean).eq("id", id);
  return !error;
}

export async function archiveStudent(id: string, archived: boolean): Promise<boolean> {
  const supabase = createClient();
  if (!supabase) return false;
  const { error } = await supabase.from("students").update({ archived }).eq("id", id);
  return !error;
}

export async function deleteStudent(id: string): Promise<boolean> {
  const supabase = createClient();
  if (!supabase) return false;
  const { error } = await supabase.from("students").delete().eq("id", id);
  return !error;
}

/** CRM-tijdlijn van een leerling (nieuwste eerst). */
export async function listNotes(studentId: string): Promise<StudentNote[]> {
  const supabase = createClient();
  if (!supabase) return [];
  const { data, error } = await supabase
    .from("student_notes")
    .select("id,body,kind,created_at")
    .eq("student_id", studentId)
    .order("created_at", { ascending: false });
  if (error || !data) return [];
  return (data as NoteRow[]).map((r) => ({
    id: r.id,
    body: r.body,
    kind: r.kind === "contact" ? "contact" : "note",
    createdAt: new Date(r.created_at).getTime(),
  }));
}

export async function addNote(
  studentId: string,
  body: string,
  kind: "note" | "contact",
): Promise<StudentNote | null> {
  const supabase = createClient();
  if (!supabase) return null;
  const { data: orgId } = await supabase.rpc("ensure_my_org");
  const { data: auth } = await supabase.auth.getUser();
  const { data, error } = await supabase
    .from("student_notes")
    .insert({
      org_id: orgId ?? null,
      student_id: studentId,
      author_id: auth?.user?.id ?? null,
      kind,
      body: body.trim(),
    })
    .select("id,body,kind,created_at")
    .maybeSingle();
  if (error || !data) return null;
  const r = data as NoteRow;
  return {
    id: r.id,
    body: r.body,
    kind: r.kind === "contact" ? "contact" : "note",
    createdAt: new Date(r.created_at).getTime(),
  };
}
