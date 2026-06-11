"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useAuth } from "@/components/AuthProvider";
import { BrandMark } from "@/components/BrandingProvider";
import {
  listPackages,
  createPackage,
  updatePackage,
  deletePackage,
  setPackageActive,
  listPurchases,
  formatPrice,
  perHour,
  type Package,
  type PackageKind,
  type Purchase,
} from "@/lib/packages";
import { getCurrentOrg } from "@/lib/org";
import { Container } from "@/components/ui/Container";
import { Card } from "@/components/ui/Card";
import { Button, buttonClasses } from "@/components/ui/Button";
import { Input, Label, Textarea } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import { cn } from "@/components/ui/cn";
import { EuroIcon, CheckIcon } from "@/components/ui/icons";

type FormState = {
  name: string;
  subject: string;
  kind: PackageKind;
  priceEur: string;
  hours: string;
  description: string;
};

const EMPTY: FormState = {
  name: "",
  subject: "",
  kind: "bundle",
  priceEur: "",
  hours: "",
  description: "",
};

export default function Packages() {
  const { user, loading, enabled } = useAuth();
  const [packages, setPackages] = useState<Package[] | null>(null);
  const [busy, setBusy] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY);
  const [saving, setSaving] = useState(false);
  const [connect, setConnect] = useState<{ connected: boolean; chargesEnabled: boolean } | null>(null);
  const [orgId, setOrgId] = useState<string | null>(null);
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [connecting, setConnecting] = useState(false);
  const [connectError, setConnectError] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (loading) return;
    if (!user) {
      setBusy(false);
      return;
    }
    listPackages().then((p) => {
      setPackages(p);
      setBusy(false);
    });
    fetch("/api/connect/status")
      .then((r) => r.json())
      .then((d) => setConnect({ connected: !!d?.connected, chargesEnabled: !!d?.chargesEnabled }))
      .catch(() => setConnect({ connected: false, chargesEnabled: false }));
    getCurrentOrg().then((o) => setOrgId(o?.id ?? null));
    listPurchases().then(setPurchases);
  }, [loading, user]);

  const startOnboarding = async () => {
    setConnecting(true);
    setConnectError("");
    try {
      const res = await fetch("/api/connect/onboard", { method: "POST" });
      const data = await res.json();
      if (data?.url) {
        window.location.href = data.url;
        return;
      }
      setConnectError(data?.error || "Kon de onboarding niet starten.");
    } catch {
      setConnectError("Er ging iets mis. Probeer het opnieuw.");
    }
    setConnecting(false);
  };

  const payUrl =
    typeof window !== "undefined" && orgId ? `${window.location.origin}/betalen/${orgId}` : "";

  const copyLink = async () => {
    if (!payUrl) return;
    await navigator.clipboard.writeText(payUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const openNew = () => {
    setEditingId(null);
    setForm(EMPTY);
    setShowForm(true);
  };

  const openEdit = (p: Package) => {
    setEditingId(p.id);
    setForm({
      name: p.name,
      subject: p.subject ?? "",
      kind: p.kind,
      priceEur: (p.priceCents / 100).toString().replace(".", ","),
      hours: p.hours != null ? String(p.hours) : "",
      description: p.description ?? "",
    });
    setShowForm(true);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    const priceCents = Math.round(
      parseFloat(form.priceEur.replace(",", ".") || "0") * 100,
    );
    const hours = form.kind === "bundle" ? parseFloat(form.hours.replace(",", ".")) || null : null;
    const input = {
      name: form.name,
      subject: form.subject,
      kind: form.kind,
      priceCents,
      hours,
      description: form.description,
    };
    setSaving(true);
    if (editingId) {
      const ok = await updatePackage(editingId, input);
      if (ok) {
        setPackages((prev) =>
          (prev ?? []).map((p) =>
            p.id === editingId
              ? { ...p, ...input, priceCents, hours, description: form.description || null, subject: form.subject || null }
              : p,
          ),
        );
        close();
      }
    } else {
      const created = await createPackage(input);
      if (created) {
        setPackages((prev) => [...(prev ?? []), created]);
        close();
      }
    }
    setSaving(false);
  };

  const close = () => {
    setShowForm(false);
    setEditingId(null);
    setForm(EMPTY);
  };

  const remove = async (id: string) => {
    if (!window.confirm("Dit pakket verwijderen?")) return;
    await deletePackage(id);
    setPackages((prev) => (prev ?? []).filter((p) => p.id !== id));
  };

  const toggleActive = async (p: Package) => {
    setPackages((prev) =>
      (prev ?? []).map((x) => (x.id === p.id ? { ...x, active: !x.active } : x)),
    );
    await setPackageActive(p.id, !p.active);
  };

  const mustLogin = enabled && !loading && !user;

  return (
    <main className="min-h-screen flex-1 bg-muted/40">
      <header className="border-b border-border bg-surface">
        <Container className="flex items-center justify-between py-4">
          <Link href="/dashboard">
            <BrandMark />
          </Link>
          <Link href="/dashboard" className="text-sm text-muted-foreground transition hover:text-foreground">
            ← Dashboard
          </Link>
        </Container>
      </header>

      <Container className="py-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <span className="inline-flex items-center gap-1.5 text-sm font-medium text-brand">
              <EuroIcon size={16} /> Catalogus
            </span>
            <h1 className="mt-1 text-2xl font-bold tracking-tight text-foreground">
              Tarieven &amp; pakketten
            </h1>
          </div>
          {user && packages !== null && !showForm && (
            <Button onClick={openNew}>+ Nieuw pakket</Button>
          )}
        </div>

        <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
          Stel zelf je lesprijzen en pakketten samen — wat jij je leerlingen rekent.
          Leerlingen betalen je rechtstreeks via iDEAL of creditcard.
        </p>

        {/* Online betalen (Stripe Connect) */}
        {user && connect && (
          <Card className="mt-5 p-5">
            <div className="flex flex-wrap items-center gap-4">
              <span
                className={cn(
                  "flex h-11 w-11 shrink-0 items-center justify-center rounded-full",
                  connect.chargesEnabled ? "bg-green-50 text-success" : "bg-brand-soft text-brand-strong",
                )}
              >
                {connect.chargesEnabled ? <CheckIcon size={22} /> : <EuroIcon size={22} />}
              </span>
              <div className="min-w-[12rem] flex-1">
                <p className="font-medium text-foreground">
                  {connect.chargesEnabled ? "Online betalen is actief" : "Online betalen instellen"}
                </p>
                <p className="text-sm text-muted-foreground">
                  {connect.chargesEnabled
                    ? "Deel je betaallink met leerlingen — zij betalen je rechtstreeks."
                    : connect.connected
                      ? "Rond je gegevens bij Stripe af zodat leerlingen kunnen betalen."
                      : "Vul je naam + bankgegevens in zodat leerlingen je pakketten kunnen betalen. Het geld komt direct op jouw rekening."}
                </p>
              </div>
              {!connect.chargesEnabled && (
                <Button onClick={startOnboarding} disabled={connecting}>
                  {connecting ? "Bezig…" : connect.connected ? "Onboarding afronden" : "Uitbetaling instellen"}
                </Button>
              )}
            </div>

            {connectError && (
              <p className="mt-3 rounded-xl bg-amber-50 px-3 py-2 text-sm text-warning">
                {connectError}
              </p>
            )}

            {/* Betaallink (altijd zichtbaar om te delen/previewen) */}
            {payUrl && (
              <>
                <div className="mt-4 flex flex-wrap items-center gap-2 rounded-xl border border-border bg-muted/40 p-3">
                  <span className="min-w-0 flex-1 truncate text-sm text-muted-foreground">
                    Betaallink: <span className="text-foreground">{payUrl}</span>
                  </span>
                  <Link href={payUrl} className={buttonClasses({ variant: "secondary", size: "sm" })}>
                    Open
                  </Link>
                  <Button variant="secondary" size="sm" onClick={copyLink}>
                    {copied ? "Gekopieerd!" : "Kopieer"}
                  </Button>
                </div>
                {!connect.chargesEnabled && (
                  <p className="mt-2 text-xs text-warning">
                    Let op: leerlingen kunnen pas écht afrekenen zodra je Stripe-onboarding klaar is.
                  </p>
                )}
              </>
            )}
          </Card>
        )}

        {/* Formulier */}
        {user && showForm && (
          <Card className="mt-5 p-6">
            <form onSubmit={submit} className="grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <Label htmlFor="p-name">Naam *</Label>
                <Input
                  id="p-name"
                  required
                  autoFocus
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="Bijv. 12 uur wiskunde"
                />
              </div>

              <div>
                <Label>Soort</Label>
                <div className="flex gap-2">
                  {([
                    ["bundle", "Pakket (totaal)"],
                    ["hourly", "Per uur"],
                  ] as const).map(([k, label]) => (
                    <button
                      key={k}
                      type="button"
                      onClick={() => setForm({ ...form, kind: k })}
                      className={cn(
                        "flex-1 rounded-xl border px-3 py-2 text-sm font-medium transition",
                        form.kind === k
                          ? "border-brand bg-brand-soft text-brand-strong"
                          : "border-border text-muted-foreground hover:bg-muted",
                      )}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <Label htmlFor="p-subject">
                  Vak <span className="font-normal text-muted-foreground">(optioneel)</span>
                </Label>
                <Input
                  id="p-subject"
                  value={form.subject}
                  onChange={(e) => setForm({ ...form, subject: e.target.value })}
                  placeholder="Bijv. Wiskunde B"
                />
              </div>

              <div>
                <Label htmlFor="p-price">
                  {form.kind === "hourly" ? "Uurtarief (€)" : "Totaalprijs (€)"}
                </Label>
                <Input
                  id="p-price"
                  inputMode="decimal"
                  value={form.priceEur}
                  onChange={(e) => setForm({ ...form, priceEur: e.target.value })}
                  placeholder={form.kind === "hourly" ? "30" : "330"}
                />
              </div>

              {form.kind === "bundle" && (
                <div>
                  <Label htmlFor="p-hours">Aantal uren</Label>
                  <Input
                    id="p-hours"
                    inputMode="decimal"
                    value={form.hours}
                    onChange={(e) => setForm({ ...form, hours: e.target.value })}
                    placeholder="12"
                  />
                </div>
              )}

              <div className="sm:col-span-2">
                <Label htmlFor="p-desc">
                  Omschrijving <span className="font-normal text-muted-foreground">(optioneel)</span>
                </Label>
                <Textarea
                  id="p-desc"
                  rows={2}
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="Bijv. 12 lessen van een uur, in te plannen binnen een half jaar."
                />
              </div>

              <div className="flex gap-2 sm:col-span-2">
                <Button type="submit" disabled={saving}>
                  {saving ? "Opslaan…" : editingId ? "Wijzigingen opslaan" : "Pakket toevoegen"}
                </Button>
                <Button type="button" variant="ghost" onClick={close}>
                  Annuleren
                </Button>
              </div>
            </form>
          </Card>
        )}

        {/* Inhoud */}
        {mustLogin ? (
          <Card className="mt-8 p-10 text-center">
            <p className="text-muted-foreground">Log in om je tarieven te beheren.</p>
            <Link href="/login" className={buttonClasses({ className: "mt-4" })}>
              Inloggen
            </Link>
          </Card>
        ) : busy ? (
          <p className="mt-8 text-muted-foreground">Laden…</p>
        ) : packages === null ? (
          <Card className="mt-8 p-8">
            <p className="font-medium text-foreground">Tarieven nog niet geactiveerd</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Draai migratie <code className="rounded bg-muted px-1">007_packages.sql</code> in
              de Supabase SQL-editor om de pakketbouwer in te schakelen.
            </p>
          </Card>
        ) : packages.length === 0 && !showForm ? (
          <Card className="mt-8 border-dashed p-10 text-center">
            <p className="text-muted-foreground">Nog geen pakketten.</p>
            <Button onClick={openNew} className="mt-4">
              Maak je eerste pakket
            </Button>
          </Card>
        ) : (
          <ul className="mt-6 grid gap-4 sm:grid-cols-2">
            {packages.map((p) => {
              const ph = perHour(p);
              return (
                <Card key={p.id} as="li" className={cn("flex flex-col p-5", !p.active && "opacity-60")}>
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <h3 className="font-semibold text-foreground">{p.name}</h3>
                      <div className="mt-1 flex flex-wrap items-center gap-1.5">
                        <Badge variant={p.kind === "hourly" ? "accent" : "brand"}>
                          {p.kind === "hourly" ? "Per uur" : "Pakket"}
                        </Badge>
                        {p.subject && <Badge variant="muted">{p.subject}</Badge>}
                        {!p.active && <Badge variant="warning">Inactief</Badge>}
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xl font-bold text-foreground">
                        {formatPrice(p.priceCents, p.currency)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {p.kind === "hourly"
                          ? "per uur"
                          : p.hours
                            ? `${p.hours} uur${ph ? ` · ${formatPrice(ph)}/u` : ""}`
                            : "totaal"}
                      </p>
                    </div>
                  </div>
                  {p.description && (
                    <p className="mt-3 text-sm text-muted-foreground">{p.description}</p>
                  )}
                  <div className="mt-4 flex items-center gap-2 pt-1">
                    <Button variant="secondary" size="sm" onClick={() => openEdit(p)}>
                      Bewerken
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => toggleActive(p)}>
                      {p.active ? "Deactiveren" : "Activeren"}
                    </Button>
                    <button
                      onClick={() => remove(p.id)}
                      className="ml-auto rounded-full p-1.5 text-muted-foreground transition hover:bg-muted hover:text-danger"
                      aria-label="Verwijderen"
                    >
                      ✕
                    </button>
                  </div>
                </Card>
              );
            })}
          </ul>
        )}

        {/* Recente verkopen */}
        {user && purchases.length > 0 && (
          <div className="mt-10">
            <h2 className="mb-3 text-sm font-semibold tracking-wide text-muted-foreground uppercase">
              Recente verkopen
            </h2>
            <Card className="divide-y divide-border p-0">
              {purchases.map((pu) => (
                <div key={pu.id} className="flex items-center justify-between gap-3 p-4">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-foreground">
                      {pu.packageName ?? "Pakket"}
                    </p>
                    <p className="truncate text-xs text-muted-foreground">
                      {(pu.buyerName || pu.buyerEmail || "Onbekend") +
                        " · " +
                        new Date(pu.createdAt).toLocaleDateString("nl-NL", { dateStyle: "medium" })}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-3">
                    <span className="text-sm font-semibold text-foreground">
                      {formatPrice(pu.amountCents, pu.currency)}
                    </span>
                    <Badge variant={pu.status === "paid" ? "success" : "warning"}>
                      {pu.status === "paid" ? "Betaald" : "Open"}
                    </Badge>
                  </div>
                </div>
              ))}
            </Card>
          </div>
        )}
      </Container>
    </main>
  );
}
