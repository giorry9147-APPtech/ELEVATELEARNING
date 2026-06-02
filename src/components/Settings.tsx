"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { getCurrentOrg, type Org } from "@/lib/org";
import { useAuth } from "@/components/AuthProvider";
import { BrandMark } from "@/components/BrandingProvider";

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
      <main className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center">
          <p className="text-slate-600">Log in om je instellingen te beheren.</p>
          <Link
            href="/login"
            className="mt-3 inline-block rounded-lg px-4 py-2 text-sm font-medium text-white"
            style={{ backgroundColor: "var(--brand)" }}
          >
            Inloggen
          </Link>
        </div>
      </main>
    );
  }

  const isOwner = org?.role === "owner";

  return (
    <main className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-6 py-4">
          <Link href="/dashboard">
            <BrandMark />
          </Link>
          <Link
            href="/dashboard"
            className="text-sm text-slate-500 hover:text-slate-800"
          >
            ← Terug
          </Link>
        </div>
      </header>

      <div className="mx-auto max-w-3xl px-6 py-8">
        <h1 className="text-2xl font-bold text-slate-900">Instellingen</h1>
        {org && (
          <p className="mt-1 text-sm text-slate-500">
            Lesomgeving: <strong>{org.name}</strong> · rol {org.role}
          </p>
        )}

        {!isOwner && org && (
          <p className="mt-4 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-700">
            Alleen de eigenaar van de lesomgeving kan branding en domeinen wijzigen.
          </p>
        )}

        {/* Branding */}
        <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-6">
          <h2 className="font-semibold text-slate-800">Huisstijl (white-label)</h2>
          <p className="mt-1 text-sm text-slate-500">
            Logo, naam en kleur die je leerlingen zien.
          </p>
          <form onSubmit={saveBranding} className="mt-4 space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700">Naam</label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={!isOwner}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-sky-500 disabled:bg-slate-50"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700">
                Tagline <span className="font-normal text-slate-400">(optioneel)</span>
              </label>
              <input
                value={tagline}
                onChange={(e) => setTagline(e.target.value)}
                disabled={!isOwner}
                placeholder="Bijv. Bijles op maat"
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-sky-500 disabled:bg-slate-50"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700">
                Logo-URL <span className="font-normal text-slate-400">(optioneel)</span>
              </label>
              <input
                value={logoUrl}
                onChange={(e) => setLogoUrl(e.target.value)}
                disabled={!isOwner}
                placeholder="https://.../logo.png"
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-sky-500 disabled:bg-slate-50"
              />
            </div>
            <div className="flex items-center gap-3">
              <label className="text-sm font-medium text-slate-700">Merkkleur</label>
              <input
                type="color"
                value={brandColor}
                onChange={(e) => setBrandColor(e.target.value)}
                disabled={!isOwner}
                className="h-9 w-14 cursor-pointer rounded border border-slate-300"
              />
              <span className="text-sm text-slate-500">{brandColor}</span>
            </div>

            {isOwner && (
              <button
                type="submit"
                disabled={busy}
                style={{ backgroundColor: "var(--brand)" }}
                className="rounded-lg px-4 py-2 text-sm font-medium text-white hover:brightness-95 disabled:opacity-60"
              >
                {busy ? "Opslaan…" : saved ? "Opgeslagen ✓" : "Opslaan"}
              </button>
            )}
          </form>
        </section>

        {/* Domeinen */}
        <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-6">
          <h2 className="font-semibold text-slate-800">Eigen domein(en)</h2>
          <p className="mt-1 text-sm text-slate-500">
            Koppel een domein zodat je leerlingen op jouw eigen webadres lesgeven.
            Het domein moet daarna nog via DNS naar Vercel wijzen.
          </p>

          <ul className="mt-4 space-y-2">
            {domains.map((d) => (
              <li
                key={d.id}
                className="flex items-center justify-between rounded-lg border border-slate-200 px-3 py-2 text-sm"
              >
                <span className="font-medium text-slate-700">{d.hostname}</span>
                {isOwner && (
                  <button
                    onClick={() => removeDomain(d.id)}
                    className="text-slate-400 hover:text-red-600"
                  >
                    ✕
                  </button>
                )}
              </li>
            ))}
            {domains.length === 0 && (
              <li className="text-sm text-slate-400">Nog geen domein gekoppeld.</li>
            )}
          </ul>

          {isOwner && (
            <div className="mt-3 flex gap-2">
              <input
                value={newDomain}
                onChange={(e) => setNewDomain(e.target.value)}
                placeholder="bijv. djelian.nl"
                className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-sky-500"
              />
              <button
                onClick={addDomain}
                className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                Toevoegen
              </button>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
