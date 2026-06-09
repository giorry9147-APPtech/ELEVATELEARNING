"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { generateRoomId, normalizeRoomInput } from "@/lib/rooms";
import { createSession } from "@/lib/sessions";
import { getMyUsage } from "@/lib/billing";
import { useAuth } from "@/components/AuthProvider";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { PencilIcon, LinkIcon, ArrowRightIcon } from "@/components/ui/icons";

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
    <div className="mx-auto grid max-w-3xl gap-4 text-left sm:grid-cols-2">
      {/* Start een nieuwe les */}
      <Card className="p-6">
        <form onSubmit={startSession}>
          <span className="btn-primary mb-4 flex h-10 w-10 items-center justify-center rounded-xl">
            <PencilIcon size={20} />
          </span>
          <h3 className="font-semibold text-foreground">Nieuwe les starten</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Je krijgt direct een deelbare link voor je student.
          </p>
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Titel (bijv. Wiskunde — afgeleiden)"
            className="mt-4"
          />
          <Button type="submit" disabled={starting} fullWidth className="mt-3">
            {starting ? "Bezig…" : "Start les"}
            {!starting && <ArrowRightIcon size={18} />}
          </Button>
          {limitReached && (
            <p className="mt-2 text-sm text-danger">
              Je lesminuten zijn op.{" "}
              <a href="/prijzen" className="font-medium underline">
                Upgrade je abonnement
              </a>{" "}
              om verder te gaan.
            </p>
          )}
        </form>
      </Card>

      {/* Join een bestaande les */}
      <Card className="p-6">
        <form onSubmit={joinSession}>
          <span className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-brand-soft text-brand-strong">
            <LinkIcon size={20} />
          </span>
          <h3 className="font-semibold text-foreground">Deelnemen aan een les</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Heb je een link of code gekregen? Plak ’m hier.
          </p>
          <Input
            value={joinCode}
            onChange={(e) => {
              setJoinCode(e.target.value);
              setError("");
            }}
            placeholder="Room-code of link"
            className="mt-4"
          />
          {error && <p className="mt-1 text-xs text-danger">{error}</p>}
          <Button type="submit" variant="secondary" fullWidth className="mt-3">
            Deelnemen
          </Button>
        </form>
      </Card>
    </div>
  );
}
