"use client";

import { createClient } from "@/lib/supabase/client";

/**
 * Tenant (organization) van de ingelogde gebruiker. In Fase 1 heeft elke
 * docent precies één eigen tenant; later kan dit uitgroeien naar meerdere.
 */
export type Org = { id: string; name: string; role: string };

/**
 * Haalt de huidige tenant op en maakt 'm aan als die nog ontbreekt
 * (ensure_my_org dekt edge-cases waarin de signup-trigger niet liep).
 */
export async function getCurrentOrg(): Promise<Org | null> {
  const supabase = createClient();
  if (!supabase) return null;

  // Zorg dat er een tenant is voor deze gebruiker.
  await supabase.rpc("ensure_my_org");

  const { data, error } = await supabase
    .from("org_members")
    .select("role, organizations(id, name)")
    .limit(1)
    .maybeSingle();

  if (error || !data?.organizations) return null;
  const org = data.organizations as unknown as { id: string; name: string };
  return { id: org.id, name: org.name, role: data.role as string };
}

/** Geeft alleen het tenant-id terug (handig bij het aanmaken van data). */
export async function getMyOrgId(): Promise<string | null> {
  const supabase = createClient();
  if (!supabase) return null;
  const { data } = await supabase.rpc("ensure_my_org");
  return (data as string) ?? null;
}
