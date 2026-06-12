/**
 * Pure slot-berekening (geen client/server-afhankelijkheden), bruikbaar aan
 * beide kanten. Genereert boekbare lesmomenten uit de wekelijkse
 * beschikbaarheid, minus reeds geboekte starttijden en het verleden.
 */

export type WindowDef = { weekday: number; startMin: number; endMin: number };
export type DaySlots = { dayMs: number; label: string; slots: number[] };

/** ISO-weekdag (1=ma .. 7=zo) uit een Date. */
export function isoWeekday(d: Date): number {
  const g = d.getDay(); // 0=zo .. 6=za
  return g === 0 ? 7 : g;
}

/** "HH:MM" → minuten vanaf middernacht. */
export function hmToMin(hm: string): number {
  const [h, m] = hm.split(":").map((x) => parseInt(x, 10));
  return (h || 0) * 60 + (m || 0);
}

/** Minuten vanaf middernacht → "HH:MM". */
export function minToHm(min: number): string {
  const h = Math.floor(min / 60);
  const m = min % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

/**
 * Boekbare slots voor de komende `days` dagen. Slot-tijden zijn epoch-ms in de
 * lokale tijdzone van de gebruiker (voor NL-docenten/leerlingen ≈ juiste tijd).
 */
export function generateSlots(
  windows: WindowDef[],
  bookedStarts: number[],
  lessonMin: number,
  days = 21,
  now: number = Date.now(),
): DaySlots[] {
  if (!windows.length || lessonMin <= 0) return [];
  const booked = new Set(bookedStarts);
  const today = new Date(now);
  today.setHours(0, 0, 0, 0);

  const out: DaySlots[] = [];
  for (let d = 0; d < days; d++) {
    const day = new Date(today);
    day.setDate(today.getDate() + d);
    const iso = isoWeekday(day);
    const dayWindows = windows.filter((w) => w.weekday === iso);
    if (!dayWindows.length) continue;

    const slots: number[] = [];
    for (const w of dayWindows) {
      for (let t = w.startMin; t + lessonMin <= w.endMin; t += lessonMin) {
        const s = new Date(day);
        s.setHours(Math.floor(t / 60), t % 60, 0, 0);
        const ms = s.getTime();
        if (ms < now) continue;
        if (booked.has(ms)) continue;
        slots.push(ms);
      }
    }
    if (slots.length) out.push({ dayMs: day.getTime(), label: dayLabel(day), slots });
  }
  return out;
}

function dayLabel(d: Date): string {
  return d.toLocaleDateString("nl-NL", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
}

export function slotTime(ms: number): string {
  return new Date(ms).toLocaleTimeString("nl-NL", { hour: "2-digit", minute: "2-digit" });
}
