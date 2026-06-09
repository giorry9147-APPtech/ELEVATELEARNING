"use client";

import { createClient } from "@/lib/supabase/client";

/**
 * Prijs-/pakketcatalogus van de docent (Fase 5). Tenant-scoped via RLS.
 * Werkt-zonder-migratie: `listPackages` geeft `null` als de tabel ontbreekt.
 */

export type PackageKind = "hourly" | "bundle";

export type Package = {
  id: string;
  name: string;
  description: string | null;
  subject: string | null;
  kind: PackageKind;
  priceCents: number;
  currency: string;
  hours: number | null;
  active: boolean;
  createdAt: number;
};

export type PackageInput = {
  name: string;
  description?: string;
  subject?: string;
  kind: PackageKind;
  priceCents: number;
  hours?: number | null;
  active?: boolean;
};

type PackageRow = {
  id: string;
  name: string;
  description: string | null;
  subject: string | null;
  kind: string;
  price_cents: number;
  currency: string;
  hours: number | null;
  active: boolean;
  created_at: string;
};

const COLS = "id,name,description,subject,kind,price_cents,currency,hours,active,created_at";

function mapPackage(r: PackageRow): Package {
  return {
    id: r.id,
    name: r.name,
    description: r.description,
    subject: r.subject,
    kind: r.kind === "hourly" ? "hourly" : "bundle",
    priceCents: r.price_cents,
    currency: r.currency,
    hours: r.hours,
    active: r.active,
    createdAt: new Date(r.created_at).getTime(),
  };
}

/** Bedrag in centen → leesbaar (bv. "€ 330,00"). */
export function formatPrice(cents: number, currency = "EUR"): string {
  return new Intl.NumberFormat("nl-NL", { style: "currency", currency }).format(
    cents / 100,
  );
}

/** Effectief uurtarief van een pakket (bundel: totaal/uren), of null. */
export function perHour(p: Package): number | null {
  if (p.kind === "hourly") return p.priceCents;
  if (p.kind === "bundle" && p.hours && p.hours > 0)
    return Math.round(p.priceCents / p.hours);
  return null;
}

export async function listPackages(): Promise<Package[] | null> {
  const supabase = createClient();
  if (!supabase) return [];
  const { data, error } = await supabase
    .from("lesson_packages")
    .select(COLS)
    .order("position", { ascending: true })
    .order("created_at", { ascending: true });
  if (error) return null;
  return (data as PackageRow[]).map(mapPackage);
}

export async function createPackage(input: PackageInput): Promise<Package | null> {
  const supabase = createClient();
  if (!supabase) return null;
  const { data: orgId } = await supabase.rpc("ensure_my_org");
  const { data, error } = await supabase
    .from("lesson_packages")
    .insert({
      org_id: orgId ?? null,
      name: input.name.trim(),
      description: input.description?.trim() || null,
      subject: input.subject?.trim() || null,
      kind: input.kind,
      price_cents: Math.max(0, Math.round(input.priceCents)),
      hours: input.kind === "bundle" ? input.hours ?? null : null,
      active: input.active ?? true,
    })
    .select(COLS)
    .maybeSingle();
  if (error || !data) return null;
  return mapPackage(data as PackageRow);
}

export async function updatePackage(
  id: string,
  input: PackageInput,
): Promise<boolean> {
  const supabase = createClient();
  if (!supabase) return false;
  const { error } = await supabase
    .from("lesson_packages")
    .update({
      name: input.name.trim(),
      description: input.description?.trim() || null,
      subject: input.subject?.trim() || null,
      kind: input.kind,
      price_cents: Math.max(0, Math.round(input.priceCents)),
      hours: input.kind === "bundle" ? input.hours ?? null : null,
    })
    .eq("id", id);
  return !error;
}

export async function setPackageActive(id: string, active: boolean): Promise<boolean> {
  const supabase = createClient();
  if (!supabase) return false;
  const { error } = await supabase
    .from("lesson_packages")
    .update({ active })
    .eq("id", id);
  return !error;
}

export async function deletePackage(id: string): Promise<boolean> {
  const supabase = createClient();
  if (!supabase) return false;
  const { error } = await supabase.from("lesson_packages").delete().eq("id", id);
  return !error;
}

export type Purchase = {
  id: string;
  buyerName: string | null;
  buyerEmail: string | null;
  amountCents: number;
  currency: string;
  status: string;
  packageName: string | null;
  createdAt: number;
};

/** Aankopen van pakketten door leerlingen (nieuwste eerst). */
export async function listPurchases(): Promise<Purchase[]> {
  const supabase = createClient();
  if (!supabase) return [];
  const { data, error } = await supabase
    .from("package_purchases")
    .select("id,buyer_name,buyer_email,amount_cents,currency,status,created_at,lesson_packages(name)")
    .order("created_at", { ascending: false })
    .limit(50);
  if (error || !data) return [];
  return (
    data as unknown as {
      id: string;
      buyer_name: string | null;
      buyer_email: string | null;
      amount_cents: number;
      currency: string;
      status: string;
      created_at: string;
      lesson_packages: { name: string } | null;
    }[]
  ).map((r) => ({
    id: r.id,
    buyerName: r.buyer_name,
    buyerEmail: r.buyer_email,
    amountCents: r.amount_cents,
    currency: r.currency,
    status: r.status,
    packageName: r.lesson_packages?.name ?? null,
    createdAt: new Date(r.created_at).getTime(),
  }));
}
