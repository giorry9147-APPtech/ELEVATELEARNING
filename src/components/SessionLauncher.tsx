"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { generateRoomId, normalizeRoomInput } from "@/lib/rooms";
import { createSession } from "@/lib/sessions";
import { getMyUsage } from "@/lib/billing";
import { useAuth } from "@/components/AuthProvider";

/**
 * Start een nieuwe les (genereert een unieke room + deelbare link) of join
 * een bestaande les via room-code of geplakte link. Werkt volledig
 * client-side, geen backend nodig.
 */
export default function SessionLauncher() {
  const router = useRouter();
  const { user } = useAuth();
  const [title, setTitle] = useState("");
  const [joinCode, setJoinCode] = useState("");
  const [error, setError] = useState("");
  const [starting, setStarting] = useState(false);
  const [limitReached, setLimitReached] = useState(false);

  const startSession = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLimitReached(false);
    setStarting(true);

    // Gating: ingelogde docent zonder minuten kan geen nieuwe les starten.
    if (user) {
      const usage = await getMyUsage();
      if (usage && usage.minutesRemaining <= 0) {
        setLimitReached(true);
        setStarting(false);
        return;
      }
    }

    const roomId = generateRoomId();
    await createSession({
      roomId,
      title: title.trim() || "Naamloze les",
      userId: user?.id ?? null,
    });
    router.push(`/klas/${roomId}`);
  };

  const joinSession = (e: React.FormEvent) => {
    e.preventDefault();
    const roomId = normalizeRoomInput(joinCode);
    if (!roomId) {
      setError("Vul een room-code of link in.");
      return;
    }
    router.push(`/klas/${roomId}`);
  };

  return (
    <div className="mx-auto grid max-w-3xl gap-4 sm:grid-cols-2">
      {/* Start een nieuwe les */}
      <form
        onSubmit={startSession}
        className="rounded-2xl border border-slate-200 bg-white p-6 text-left shadow-sm"
      >
        <h3 className="font-semibold text-slate-800">Nieuwe les starten</h3>
        <p className="mt-1 text-sm text-slate-500">
          Je krijgt direct een deelbare link voor je student.
        </p>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Titel (bijv. Wiskunde — afgeleiden)"
          className="mt-4 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-sky-500"
        />
        <button
          type="submit"
          disabled={starting}
          className="mt-3 w-full rounded-lg bg-sky-600 px-4 py-2 font-medium text-white hover:bg-sky-700 disabled:opacity-60"
        >
          {starting ? "Bezig…" : "Start les →"}
        </button>
        {limitReached && (
          <p className="mt-2 text-sm text-red-600">
            Je lesminuten zijn op.{" "}
            <a href="/prijzen" className="font-medium underline">
              Upgrade je abonnement
            </a>{" "}
            om verder te gaan.
          </p>
        )}
      </form>

      {/* Join een bestaande les */}
      <form
        onSubmit={joinSession}
        className="rounded-2xl border border-slate-200 bg-white p-6 text-left shadow-sm"
      >
        <h3 className="font-semibold text-slate-800">Deelnemen aan een les</h3>
        <p className="mt-1 text-sm text-slate-500">
          Heb je een link of code gekregen? Plak ’m hier.
        </p>
        <input
          value={joinCode}
          onChange={(e) => {
            setJoinCode(e.target.value);
            setError("");
          }}
          placeholder="Room-code of link"
          className="mt-4 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-sky-500"
        />
        {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
        <button
          type="submit"
          className="mt-3 w-full rounded-lg border border-slate-300 px-4 py-2 font-medium text-slate-700 hover:bg-slate-50"
        >
          Deelnemen
        </button>
      </form>
    </div>
  );
}
