"use client";

import { createClient } from "@/lib/supabase/client";

export type Branding = {
  name: string;
  logoUrl: string | null;
  brandColor: string;
  tagline: string | null;
};

/** Standaard platform-branding (geen tenant-override). */
export const PLATFORM_BRANDING: Branding = {
  name: "Bijles",
  logoUrl: null,
  brandColor: "#0284c7",
  tagline: null,
};

type Row = {
  name: string;
  logo_url: string | null;
  brand_color: string | null;
  tagline: string | null;
};

function mapRow(r: Row): Branding {
  return {
    name: r.name || PLATFORM_BRANDING.name,
    logoUrl: r.logo_url,
    brandColor: r.brand_color || PLATFORM_BRANDING.brandColor,
    tagline: r.tagline,
  };
}

/** Branding op basis van de hostnaam (eigen domein van een tenant). */
export async function brandingForHost(host: string): Promise<Branding | null> {
  const supabase = createClient();
  if (!supabase || !host) return null;
  const { data } = await supabase.rpc("branding_for_host", { host });
  const row = Array.isArray(data) ? (data[0] as Row | undefined) : null;
  return row ? mapRow(row) : null;
}

/** Branding van de eigen tenant (ingelogde docent). */
export async function myBranding(): Promise<Branding | null> {
  const supabase = createClient();
  if (!supabase) return null;
  const { data } = await supabase.rpc("my_branding");
  const row = Array.isArray(data) ? (data[0] as Row | undefined) : null;
  return row ? mapRow(row) : null;
}
