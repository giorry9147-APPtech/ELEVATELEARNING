"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { getCurrentOrg, type Org } from "@/lib/org";
import { createSession } from "@/lib/sessions";
import { generateRoomId } from "@/lib/rooms";
import { useAuth } from "@/components/AuthProvider";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input, Label } from "@/components/ui/Input";
import { Container } from "@/components/ui/Container";
import { SkyBackdrop } from "@/components/ui/SkyBackdrop";
import { cn } from "@/components/ui/cn";
import {
  GraduationIcon,
  WhiteboardIcon,
  ArrowRightIcon,
  CheckIcon,
  SparkleIcon,
} from "@/components/ui/icons";

const PRESET_COLORS = [
  "#2563eb", // blauw
  "#0284c7", // sky
  "#7c3aed", // paars
  "#0d9488", // teal
  "#db2777", // roze
  "#ea580c", // oranje
];

const STEPS = ["Welkom", "Huisstijl", "Klaar"];

/**
 * Multi-step onboarding voor nieuwe docenten: welkom → huisstijl (naam +
 * merkkleur, live preview, opgeslagen op de tenant) → eerste les starten.
 * Werkt-zonder-keys: zonder Supabase slaat stap 2 niets op maar blijft de flow
 * werken (richting dashboard / eerste les).
 */
export default function Onboarding() {
  const router = useRouter();
  const { user, loading, enabled } = useAuth();
  const [step, setStep] = useState(0);
  const [org, setOrg] = useState<Org | null>(null);
  const [name, setName] = useState("");
  const [tagline, setTagline] = useState("");
  const [brandColor, setBrandColor] = useState("#2563eb");
  const [saving, setSaving] = useState(false);
  const [starting, setStarting] = useState(false);

  // Niet ingelogd (met Supabase actief) → naar login.
  useEffect(() => {
    if (!loading && enabled && !user) router.replace("/login");
  }, [loading, enabled, user, router]);

  // Bestaande org-gegevens voorvullen.
  useEffect(() => {
    if (loading || !user) return;
    (async () => {
      const o = await getCurrentOrg();
      setOrg(o);
      if (o?.name) setName(o.name);
      const supabase = createClient();
      if (!o || !supabase) return;
      const { data } = await supabase
        .from("organizations")
        .select("tagline, brand_color")
        .eq("id", o.id)
        .maybeSingle();
      if (data) {
        setTagline(data.tagline ?? "");
        if (data.brand_color) setBrandColor(data.brand_color);
      }
    })();
  }, [loading, user]);

  // Live merkkleur-preview op de hele wizard.
  useEffect(() => {
    document.documentElement.style.setProperty("--brand", brandColor);
  }, [brandColor]);

  const previewName = name.trim() || "Mijn lesomgeving";

  const saveBranding = async () => {
    const supabase = createClient();
    if (!supabase || !org) return;
    setSaving(true);
    await supabase
      .from("organizations")
      .update({
        name: name.trim() || "Mijn lesomgeving",
        tagline: tagline.trim() || null,
        brand_color: brandColor,
      })
      .eq("id", org.id);
    setSaving(false);
  };

  const finish = () => {
    localStorage.setItem("bijles:onboarded", "1");
  };

  const startFirstLesson = async () => {
    setStarting(true);
    finish();
    const roomId = generateRoomId();
    await createSession({
      roomId,
      title: "Mijn eerste les",
      userId: user?.id ?? null,
    });
    router.push(`/klas/${roomId}`);
  };

  const goDashboard = () => {
    finish();
    router.push("/dashboard");
  };

  const next = async () => {
    if (step === 1) await saveBranding();
    setStep((s) => Math.min(STEPS.length - 1, s + 1));
  };

  return (
    <SkyBackdrop variant="green" objects className="flex min-h-screen flex-col items-center justify-center px-4 py-10">
      <Container size="md" className="!px-0">
        {/* Stappen-indicator */}
        <ol className="mb-6 flex items-center justify-center gap-2" aria-label="Voortgang">
          {STEPS.map((label, i) => (
            <li key={label} className="flex items-center gap-2">
              <span
                className={cn(
                  "flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold transition",
                  i < step && "bg-brand text-white",
                  i === step && "bg-white text-brand ring-2 ring-brand",
                  i > step && "bg-white/70 text-muted-foreground",
                )}
              >
                {i < step ? <CheckIcon size={14} /> : i + 1}
              </span>
              <span
                className={cn(
                  "hidden text-sm font-semibold sm:inline",
                  i === step ? "text-[#0f3d2a]" : "text-[#356b53]",
                )}
              >
                {label}
              </span>
              {i < STEPS.length - 1 && (
                <span className="mx-1 h-px w-6 bg-[#15803d]/25 sm:w-10" aria-hidden="true" />
              )}
            </li>
          ))}
        </ol>

        <Card className="mx-auto w-full max-w-lg p-8">
          {/* Stap 0 — Welkom */}
          {step === 0 && (
            <div className="text-center">
              <span className="btn-primary mx-auto flex h-14 w-14 items-center justify-center rounded-2xl">
                <GraduationIcon size={28} />
              </span>
              <h1 className="mt-5 text-2xl font-bold tracking-tight text-foreground">
                Welkom bij je digitale klaslokaal
              </h1>
              <p className="mx-auto mt-2 max-w-sm text-pretty text-muted-foreground">
                In een paar stappen richt je je eigen lesomgeving in. Het duurt
                minder dan een minuut.
              </p>
              <ul className="mx-auto mt-6 max-w-sm space-y-2 text-left text-sm text-foreground">
                {[
                  "Geef je lesomgeving een naam en kleur",
                  "Deel een link — je leerling heeft geen account nodig",
                  "Whiteboard, video en chat in één scherm",
                ].map((t) => (
                  <li key={t} className="flex items-start gap-2">
                    <CheckIcon size={18} className="mt-0.5 shrink-0 text-success" />
                    {t}
                  </li>
                ))}
              </ul>
              <Button onClick={next} fullWidth className="mt-7">
                Aan de slag <ArrowRightIcon size={18} />
              </Button>
            </div>
          )}

          {/* Stap 1 — Huisstijl */}
          {step === 1 && (
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-foreground">
                Je huisstijl
              </h1>
              <p className="mt-1 text-muted-foreground">
                Dit zien je leerlingen. Je kunt het later altijd aanpassen.
              </p>

              {/* Live preview */}
              <div className="mt-5 flex items-center gap-3 rounded-2xl border border-border bg-muted/50 p-4">
                <span
                  className="flex h-10 w-10 items-center justify-center rounded-xl text-white"
                  style={{ backgroundColor: "var(--brand)" }}
                >
                  <GraduationIcon size={20} />
                </span>
                <div className="min-w-0">
                  <p className="truncate font-bold text-foreground">{previewName}</p>
                  {tagline.trim() && (
                    <p className="truncate text-sm text-muted-foreground">{tagline}</p>
                  )}
                </div>
              </div>

              <div className="mt-5 space-y-4">
                <div>
                  <Label htmlFor="org-name">Naam lesomgeving</Label>
                  <Input
                    id="org-name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Bijv. Bijles Sanne"
                  />
                </div>
                <div>
                  <Label htmlFor="org-tagline">
                    Tagline <span className="font-normal text-muted-foreground">(optioneel)</span>
                  </Label>
                  <Input
                    id="org-tagline"
                    value={tagline}
                    onChange={(e) => setTagline(e.target.value)}
                    placeholder="Bijv. Wiskunde &amp; natuurkunde op maat"
                  />
                </div>
                <div>
                  <Label>Merkkleur</Label>
                  <div className="flex flex-wrap items-center gap-2">
                    {PRESET_COLORS.map((c) => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => setBrandColor(c)}
                        aria-label={`Kleur ${c}`}
                        className={cn(
                          "h-9 w-9 rounded-full ring-offset-2 transition",
                          brandColor.toLowerCase() === c && "ring-2 ring-foreground",
                        )}
                        style={{ backgroundColor: c }}
                      />
                    ))}
                    <label className="relative h-9 w-9 cursor-pointer overflow-hidden rounded-full border border-input">
                      <input
                        type="color"
                        value={brandColor}
                        onChange={(e) => setBrandColor(e.target.value)}
                        className="absolute -inset-2 cursor-pointer"
                        aria-label="Eigen kleur kiezen"
                      />
                    </label>
                  </div>
                </div>
              </div>

              {!enabled && (
                <p className="mt-4 rounded-xl bg-amber-50 px-3 py-2 text-sm text-warning">
                  Login/database nog niet actief — je huisstijl wordt nu niet
                  bewaard, maar je kunt wel verder.
                </p>
              )}

              <div className="mt-7 flex gap-3">
                <Button variant="ghost" onClick={() => setStep(0)}>
                  Terug
                </Button>
                <Button onClick={next} disabled={saving} fullWidth>
                  {saving ? "Opslaan…" : "Volgende"}
                  {!saving && <ArrowRightIcon size={18} />}
                </Button>
              </div>
            </div>
          )}

          {/* Stap 2 — Klaar */}
          {step === 2 && (
            <div className="text-center">
              <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-soft text-brand-strong">
                <SparkleIcon size={28} />
              </span>
              <h1 className="mt-5 text-2xl font-bold tracking-tight text-foreground">
                Je klaslokaal staat klaar
              </h1>
              <p className="mx-auto mt-2 max-w-sm text-pretty text-muted-foreground">
                Start meteen je eerste les, of bekijk eerst rustig je dashboard.
              </p>
              <div className="mt-7 space-y-3">
                <Button onClick={startFirstLesson} disabled={starting} fullWidth size="lg">
                  <WhiteboardIcon size={20} />
                  {starting ? "Bezig…" : "Start je eerste les"}
                </Button>
                <Button onClick={goDashboard} variant="secondary" fullWidth>
                  Naar dashboard
                </Button>
              </div>
            </div>
          )}
        </Card>

        {step === 0 && (
          <p className="mt-4 text-center text-sm">
            <button
              onClick={goDashboard}
              className="text-[#356b53] underline-offset-2 hover:text-[#0f3d2a] hover:underline"
            >
              Overslaan
            </button>
          </p>
        )}
      </Container>
    </SkyBackdrop>
  );
}
