"use client";

import { useEffect, useState } from "react";
import Whiteboard from "./Whiteboard";
import VideoPanel from "./VideoPanel";
import Chat from "./Chat";
import { BrandMark } from "@/components/BrandingProvider";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { SkyBackdrop } from "@/components/ui/SkyBackdrop";

type Props = { roomId: string };

/**
 * De live klas: whiteboard (groot, links) + video (rechtsboven) + chat
 * (rechtsonder). Vraagt eenmalig om een naam en onthoudt die lokaal.
 */
export default function Classroom({ roomId }: Props) {
  const [userName, setUserName] = useState<string | null>(null);
  const [draft, setDraft] = useState("");

  useEffect(() => {
    setUserName(localStorage.getItem("bijles:name"));
  }, []);

  if (userName === null) {
    return (
      <SkyBackdrop variant="green" objects className="flex h-screen items-center justify-center px-4">
        <Card className="w-full max-w-sm p-8">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const name = draft.trim();
              if (!name) return;
              localStorage.setItem("bijles:name", name);
              setUserName(name);
            }}
          >
            <div className="mb-4">
              <BrandMark />
            </div>
            <h1 className="text-lg font-semibold text-foreground">
              Welkom in de bijles
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Hoe mogen we je noemen in deze sessie?
            </p>
            <Input
              autoFocus
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder="Bijv. Sanne"
              className="mt-4"
            />
            <Button type="submit" fullWidth className="mt-4">
              Naar de klas
            </Button>
          </form>
        </Card>
      </SkyBackdrop>
    );
  }

  return (
    <div className="flex h-screen flex-col bg-muted/40">
      <header className="flex items-center justify-between border-b border-border bg-surface px-4 py-2">
        <div className="flex items-center gap-2">
          <BrandMark />
          <span className="text-muted-foreground/50">/</span>
          <span className="text-sm text-muted-foreground">room: {roomId}</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm text-foreground">{userName}</span>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => {
              navigator.clipboard.writeText(window.location.href);
            }}
          >
            Link kopiëren
          </Button>
        </div>
      </header>

      <div className="grid flex-1 grid-cols-1 gap-2 overflow-hidden p-2 lg:grid-cols-[1fr_360px]">
        {/* Whiteboard */}
        <div className="overflow-hidden rounded-2xl border border-border bg-surface">
          <Whiteboard roomId={roomId} />
        </div>

        {/* Rechterkolom: video boven, chat onder */}
        <div className="flex min-h-0 flex-col gap-2">
          <div className="h-1/2 overflow-hidden rounded-2xl border border-border">
            <VideoPanel roomId={roomId} userName={userName} />
          </div>
          <div className="h-1/2 overflow-hidden rounded-2xl border border-border">
            <Chat roomId={roomId} userName={userName} />
          </div>
        </div>
      </div>
    </div>
  );
}
