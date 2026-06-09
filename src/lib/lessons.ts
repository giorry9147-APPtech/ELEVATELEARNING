"use client";

import { createClient } from "@/lib/supabase/client";
import { generateRoomId } from "@/lib/rooms";

/**
 * Koppeling tussen lessen (sessions) en leerlingen: lessenhistorie +
 * aanwezigheid (Fase 5). Tenant-scoped via RLS. Werkt-zonder-migratie:
 * lees-functies geven `[]` terug als de tabel/keys ontbreken.
 */

export type AttendanceStatus = "planned" | "present" | "absent";

export type StudentLesson = {
  attendanceId: string;
  sessionId: string;
  roomId: string;
  title: string;
  createdAt: number;
  status: AttendanceStatus;
};

export type LinkableSession = {
  id: string;
  roomId: string;
  title: string;
  createdAt: number;
};

type AttendanceRow = {
  id: string;
  status: string;
  session_id: string;
  sessions: { room_id: string; title: string; created_at: string } | null;
};

function toStatus(s: string): AttendanceStatus {
  return s === "present" || s === "absent" ? s : "planned";
}

/** Lessen gekoppeld aan een leerling (nieuwste eerst). */
export async function listStudentLessons(studentId: string): Promise<StudentLesson[]> {
  const supabase = createClient();
  if (!supabase) return [];
  const { data, error } = await supabase
    .from("lesson_attendance")
    .select("id,status,session_id,sessions(room_id,title,created_at)")
    .eq("student_id", studentId);
  if (error || !data) return [];
  return (data as unknown as AttendanceRow[])
    .filter((r) => r.sessions)
    .map((r) => ({
      attendanceId: r.id,
      sessionId: r.session_id,
      roomId: r.sessions!.room_id,
      title: r.sessions!.title,
      createdAt: new Date(r.sessions!.created_at).getTime(),
      status: toStatus(r.status),
    }))
    .sort((a, b) => b.createdAt - a.createdAt);
}

export type StudentStats = {
  total: number;
  present: number;
  absent: number;
  planned: number;
  lastAt: number | null;
};

/** Aanwezigheid-statistiek per leerling (tenant-breed, voor roster + dashboard). */
export async function studentStatsMap(): Promise<Record<string, StudentStats>> {
  const supabase = createClient();
  if (!supabase) return {};
  const { data, error } = await supabase
    .from("lesson_attendance")
    .select("student_id,status,sessions(created_at)");
  if (error || !data) return {};
  const rows = data as unknown as {
    student_id: string;
    status: string;
    sessions: { created_at: string } | null;
  }[];
  const map: Record<string, StudentStats> = {};
  for (const row of rows) {
    const m = (map[row.student_id] ??= {
      total: 0,
      present: 0,
      absent: 0,
      planned: 0,
      lastAt: null,
    });
    m.total++;
    m[toStatus(row.status)]++;
    const at = row.sessions ? new Date(row.sessions.created_at).getTime() : null;
    if (at !== null && (m.lastAt === null || at > m.lastAt)) m.lastAt = at;
  }
  return map;
}

/** Tenant-sessies die nog NIET aan deze leerling gekoppeld zijn. */
export async function listLinkableSessions(studentId: string): Promise<LinkableSession[]> {
  const supabase = createClient();
  if (!supabase) return [];
  const [{ data: sessions }, { data: linked }] = await Promise.all([
    supabase
      .from("sessions")
      .select("id,room_id,title,created_at")
      .order("created_at", { ascending: false })
      .limit(50),
    supabase.from("lesson_attendance").select("session_id").eq("student_id", studentId),
  ]);
  const linkedIds = new Set((linked ?? []).map((l) => (l as { session_id: string }).session_id));
  return (sessions ?? [])
    .map((s) => s as { id: string; room_id: string; title: string; created_at: string })
    .filter((s) => !linkedIds.has(s.id))
    .map((s) => ({
      id: s.id,
      roomId: s.room_id,
      title: s.title,
      createdAt: new Date(s.created_at).getTime(),
    }));
}

/** Koppel een bestaande sessie aan een leerling. */
export async function linkLesson(
  sessionId: string,
  studentId: string,
  status: AttendanceStatus = "planned",
): Promise<boolean> {
  const supabase = createClient();
  if (!supabase) return false;
  const { data: orgId } = await supabase.rpc("ensure_my_org");
  const { error } = await supabase.from("lesson_attendance").insert({
    org_id: orgId ?? null,
    session_id: sessionId,
    student_id: studentId,
    status,
  });
  return !error;
}

export async function setAttendance(
  attendanceId: string,
  status: AttendanceStatus,
): Promise<boolean> {
  const supabase = createClient();
  if (!supabase) return false;
  const { error } = await supabase
    .from("lesson_attendance")
    .update({ status })
    .eq("id", attendanceId);
  return !error;
}

export async function unlinkLesson(attendanceId: string): Promise<boolean> {
  const supabase = createClient();
  if (!supabase) return false;
  const { error } = await supabase.from("lesson_attendance").delete().eq("id", attendanceId);
  return !error;
}

/**
 * Start direct een nieuwe les voor een leerling: maakt de sessie aan, koppelt
 * de leerling (aanwezig) en geeft de room-id terug om naar de klas te gaan.
 */
export async function startLessonForStudent(
  studentId: string,
  title: string,
): Promise<string | null> {
  const supabase = createClient();
  if (!supabase) return null;
  const { data: orgId } = await supabase.rpc("ensure_my_org");
  const { data: auth } = await supabase.auth.getUser();
  const roomId = generateRoomId();
  const { data: sess, error } = await supabase
    .from("sessions")
    .insert({
      room_id: roomId,
      title: title.trim() || "Naamloze les",
      teacher_id: auth?.user?.id ?? null,
      org_id: orgId ?? null,
    })
    .select("id")
    .maybeSingle();
  if (error || !sess) return null;
  await supabase.from("lesson_attendance").insert({
    org_id: orgId ?? null,
    session_id: (sess as { id: string }).id,
    student_id: studentId,
    status: "present",
  });
  return roomId;
}
