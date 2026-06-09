"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { getCurrentOrg, type Org } from "@/lib/org";
import { useAuth } from "@/components/AuthProvider";
import { BrandMark } from "@/components/BrandingProvider";
import { Container } from "@/components/ui/Container";
import { Card } from "@/components/ui/Card";
import { Button, buttonClasses } from "@/components/ui/Button";
import { Input, Label } from "@/components/ui/Input";

type Domain = { id: string; hostname: string; verified: boolean };

export default function Settings() {
  const { user, loading } = useAuth();
  const [org, setOrg] = useState<Org | null>(null);
  const [name, setName] = useState("");
  const [tagline, setTagline] = useState("");
  const [logoUrl, setLogoUrl] = useState("");
  const [brandColor, setBrandColor] = useState("#0284c7");
  const [domains, setDomains] = useState<Domain[]>([]);
  const [newDomain, setNewDomain] = useState("");
  const [saved, setSaved] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (loading || !user) return;
    (async () => {
      const o = await getCurrentOrg();
      setOrg(o);
      const supabase = createClient();
      if (!o || !supabase) return;
      const { data: row } = await supabase
        .from("organizations")
        .select("name, tagline, logo_url, brand_color")
        .eq("id", o.id)
        .maybeSingle();
      if (row) {
        setName(row.name ?? "");
        setTagline(row.tagline ?? "");
        setLogoUrl(row.logo_url ?? "");
        setBrandColor(row.brand_color ?? "#0284c7");
      }
      const { data: doms } = await supabase
        .from("org_domains")
        .select("id, hostname, verified")
        .eq("org_id", o.id)
        .order("created_at");
      setDomains((doms as Domain[]) ?? []);
    })();
  }, [loading, user]);

  // Live voorbeeld van de merkkleur.
  useEffect(() => {
    document.documentElement.style.setProperty("--brand", brandColor);
  }, [brandColor]);

  const saveBranding = async (e: React.FormEvent) => {
    e.preventDefault();
    const supabase = createClient();
    if (!supabase || !org) return;
    setBusy(true);
    const { error } = await supabase
      .from("organizations")
      .update({
        name: name.trim() || "Mijn lesomgeving",
        tagline: tagline.trim() || null,
        logo_url: logoUrl.trim() || null,
        brand_color: brandColor,
      })
      .eq("id", org.id);
    setBusy(false);
    if (!error) {
      setSaved(true);
      // Herlaad zodat de branding overal (headers) meteen klopt.
      setTimeout(() => window.location.reload(), 700);
    }
  };

  const addDomain = async () => {
    const supabase = createClient();
    const host = newDomain.trim().toLowerCase();
    if (!supabase || !org || !host) return;
    const { data, error } = await supabase
      .from("org_domains")
      .insert({ org_id: org.id, hostname: host })
      .select("id, hostname, verified")
      .maybeSingle();
    if (!error && data) {
      setDomains((d) => [...d, data as Domain]);
      setNewDomain("");
    }
  };

  const removeDomain = async (id: string) => {
    const supabase = createClient();
    if (!supabase) return;
    await supabase.from("org_domains").delete().eq("id", id);
    setDomains((d) => d.filter((x) => x.id !== id));
  };

  if (!loading && !user) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-muted/40 px-4">
        <Card className="p-10 text-center">
          <p className="text-muted-foreground">Log in om je instellingen te beheren.</p>
          <Link href="/login" className={buttonClasses({ size: "md", className: "mt-4" })}>
            Inloggen
          </Link>
        </Card>
      </main>
    );
  }

  const isOwner = org?.role === "owner";

  return (
    <main className="min-h-screen flex-1 bg-muted/40">
      <header className="border-b border-border bg-surface">
        <Container size="md" className="flex items-center justify-between py-4">
          <Link href="/dashboard">
            <BrandMark />
          </Link>
          <Link
            href="/dashboard"
            className="text-sm text-muted-foreground transition hover:text-foreground"
          >
            ← Terug
          </Link>
        </Container>
      </header>

      <Container size="md" className="py-8">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Instellingen</h1>
        {org && (
          <p className="mt-1 text-sm text-muted-foreground">
            Lesomgeving: <strong className="text-foreground">{org.name}</strong> · rol {org.role}
          </p>
        )}

        {!isOwner && org && (
          <p className="mt-4 rounded-xl bg-amber-50 px-3 py-2 text-sm text-warning">
            Alleen de eigenaar van de lesomgeving kan branding en domeinen wijzigen.
          </p>
        )}

        {/* Branding */}
        <Card className="mt-6 p-6">
          <h2 className="font-semibold text-foreground">Huisstijl (white-label)</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Logo, naam en kleur die je leerlingen zien.
          </p>
          <form onSubmit={saveBranding} className="mt-4 space-y-4">
            <div>
              <Label>Naam</Label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={!isOwner}
              />
            </div>
            <div>
              <Label>
                Tagline <span className="font-normal text-muted-foreground">(optioneel)</span>
              </Label>
              <Input
                value={tagline}
                onChange={(e) => setTagline(e.target.value)}
                disabled={!isOwner}
                placeholder="Bijv. Bijles op maat"
              />
            </div>
            <div>
              <Label>
                Logo-URL <span className="font-normal text-muted-foreground">(optioneel)</span>
              </Label>
              <Input
                value={logoUrl}
                onChange={(e) => setLogoUrl(e.target.value)}
                disabled={!isOwner}
                placeholder="https://.../logo.png"
              />
            </div>
            <div className="flex items-center gap-3">
              <Label className="mb-0">Merkkleur</Label>
              <input
                type="color"
                value={brandColor}
                onChange={(e) => setBrandColor(e.target.value)}
                disabled={!isOwner}
                className="h-9 w-14 cursor-pointer rounded-lg border border-input"
              />
              <span className="text-sm text-muted-foreground">{brandColor}</span>
            </div>

            {isOwner && (
              <Button type="submit" disabled={busy}>
                {busy ? "Opslaan…" : saved ? "Opgeslagen ✓" : "Opslaan"}
              </Button>
            )}
          </form>
        </Card>

        {/* Domeinen */}
        <Card className="mt-6 p-6">
          <h2 className="font-semibold text-foreground">Eigen domein(en)</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Koppel een domein zodat je leerlingen op jouw eigen webadres lesgeven.
            Het domein moet daarna nog via DNS naar Vercel wijzen.
          </p>

          <ul className="mt-4 space-y-2">
            {domains.map((d) => (
              <li
                key={d.id}
                className="flex items-center justify-between rounded-xl border border-border px-3 py-2 text-sm"
              >
                <span className="font-medium text-foreground">{d.hostname}</span>
                {isOwner && (
                  <button
                    onClick={() => removeDomain(d.id)}
                    className="rounded-full p-1.5 text-muted-foreground transition hover:bg-muted hover:text-danger"
                    aria-label="Verwijderen"
                  >
                    ✕
                  </button>
                )}
              </li>
            ))}
            {domains.length === 0 && (
              <li className="text-sm text-muted-foreground">Nog geen domein gekoppeld.</li>
            )}
          </ul>

          {isOwner && (
            <div className="mt-3 flex gap-2">
              <Input
                value={newDomain}
                onChange={(e) => setNewDomain(e.target.value)}
                placeholder="bijv. djelian.nl"
              />
              <Button onClick={addDomain} variant="secondary">
                Toevoegen
              </Button>
            </div>
          )}
        </Card>
      </Container>
    </main>
  );
}
