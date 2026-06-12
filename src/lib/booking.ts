"use client";

import { createClient } from "@/lib/supabase/client";
import type { WindowDef } from "@/lib/slots";

/** Booking & rooster — datalaag voor de docent (Fase 7). Tenant-scoped via RLS. */

export type Booking = {
  id: string;
  studentName: string | null;
  studentEmail: string | null;
  startsAt: number;
  durationMin: number;
  status: string;
  roomId: string | null;
};

async function orgId(): Promise<string | null> {
  const supabase = createClient();
  if (!supabase) return null;
  const { data } = await supabase.rpc("ensure_my_org");
  return (data as string) ?? null;
}

/** Wekelijkse beschikbaarheid. `null` = niet beschikbaar (migratie/keys). */
export async function getAvailability(): Promise<WindowDef[] | null> {
  const supabase = createClient();
  if (!supabase) return [];
  const { data, error } = await supabase
    .from("availability")
    .select("weekday,start_min,end_min")
    .order("weekday");
  if (error) return null;
  return (data as { weekday: number; start_min: number; end_min: number }[]).map((r) => ({
    weekday: r.weekday,
    startMin: r.start_min,
    endMin: r.end_min,
  }));
}

/** Vervangt de volledige beschikbaarheid door `windows`. */
export async function saveAvailability(windows: WindowDef[]): Promise<boolean> {
  const supabase = createClient();
  if (!supabase) return false;
  const id = await orgId();
  if (!id) return false;
  await supabase.from("availability").delete().eq("org_id", id);
  if (windows.length === 0) return true;
  const { error } = await supabase.from("availability").insert(
    windows.map((w) => ({
      org_id: id,
      weekday: w.weekday,
      start_min: w.startMin,
      end_min: w.endMin,
    })),
  );
  return !error;
}

export async function getLessonMinutes(): Promise<number> {
  const supabase = createClient();
  if (!supabase) return 60;
  const id = await orgId();
  if (!id) return 60;
  const { data } = await supabase
    .from("organizations")
    .select("lesson_minutes")
    .eq("id", id)
    .maybeSingle();
  return (data?.lesson_minutes as number) ?? 60;
}

/** Prijs (centen) voor één geboekte les. 0 = gratis boeken. */
export async function getBookingPrice(): Promise<number> {
  const supabase = createClient();
  if (!supabase) return 0;
  const id = await orgId();
  if (!id) return 0;
  const { data } = await supabase
    .from("organizations")
    .select("booking_price_cents")
    .eq("id", id)
    .maybeSingle();
  return (data?.booking_price_cents as number) ?? 0;
}

export async function setBookingPrice(cents: number): Promise<boolean> {
  const supabase = createClient();
  if (!supabase) return false;
  const id = await orgId();
  if (!id) return false;
  const { error } = await supabase
    .from("organizations")
    .update({ booking_price_cents: Math.max(0, Math.round(cents)) })
    .eq("id", id);
  return !error;
}

export async function setLessonMinutes(min: number): Promise<boolean> {
  const supabase = createClient();
  if (!supabase) return false;
  const id = await orgId();
  if (!id) return false;
  const { error } = await supabase
    .from("organizations")
    .update({ lesson_minutes: min })
    .eq("id", id);
  return !error;
}

/** Boekingen van de tenant (nieuwste/aankomende eerst kan de UI bepalen). */
export async function listBookings(): Promise<Booking[]> {
  const supabase = createClient();
  if (!supabase) return [];
  const { data, error } = await supabase
    .from("bookings")
    .select("id,student_name,student_email,starts_at,duration_min,status,room_id")
    .neq("status", "cancelled")
    .order("starts_at", { ascending: true });
  if (error || !data) return [];
  return (
    data as {
      id: string;
      student_name: string | null;
      student_email: string | null;
      starts_at: string;
      duration_min: number;
      status: string;
      room_id: string | null;
    }[]
  ).map((r) => ({
    id: r.id,
    studentName: r.student_name,
    studentEmail: r.student_email,
    startsAt: new Date(r.starts_at).getTime(),
    durationMin: r.duration_min,
    status: r.status,
    roomId: r.room_id,
  }));
}

export async function cancelBooking(id: string): Promise<boolean> {
  const supabase = createClient();
  if (!supabase) return false;
  const { error } = await supabase.from("bookings").update({ status: "cancelled" }).eq("id", id);
  return !error;
}
