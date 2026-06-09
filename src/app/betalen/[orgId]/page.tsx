import PayShop, { type ShopPackage } from "@/components/PayShop";
import { createAdminClient } from "@/lib/supabase/admin";
import { stripe } from "@/lib/stripe/server";
import { Card } from "@/components/ui/Card";
import { Container } from "@/components/ui/Container";

export const metadata = { title: "Betalen — Bijles" };

type PkgRow = {
  id: string;
  name: string;
  description: string | null;
  subject: string | null;
  kind: string;
  price_cents: number;
  currency: string;
  hours: number | null;
};

export default async function BetalenPage({
  params,
}: {
  params: Promise<{ orgId: string }>;
}) {
  const { orgId } = await params;
  const admin = createAdminClient();

  if (!admin) {
    return <Notice text="Betalen is nog niet beschikbaar." />;
  }

  const { data: org } = await admin
    .from("organizations")
    .select("name, stripe_account_id")
    .eq("id", orgId)
    .maybeSingle();

  if (!org) {
    return <Notice text="Deze betaalpagina bestaat niet." />;
  }

  const { data: pkgs } = await admin
    .from("lesson_packages")
    .select("id,name,description,subject,kind,price_cents,currency,hours")
    .eq("org_id", orgId)
    .eq("active", true)
    .order("position", { ascending: true });

  let canPay = false;
  const accountId = (org.stripe_account_id as string | null) ?? null;
  if (accountId && stripe) {
    try {
      const account = await stripe.accounts.retrieve(accountId);
      canPay = account.charges_enabled;
    } catch {
      canPay = false;
    }
  }

  const packages: ShopPackage[] = ((pkgs as PkgRow[]) ?? []).map((p) => ({
    id: p.id,
    name: p.name,
    description: p.description,
    subject: p.subject,
    kind: p.kind === "hourly" ? "hourly" : "bundle",
    priceCents: p.price_cents,
    currency: p.currency,
    hours: p.hours,
  }));

  return <PayShop orgName={org.name as string} canPay={canPay} packages={packages} />;
}

function Notice({ text }: { text: string }) {
  return (
    <main className="flex min-h-screen flex-1 items-center justify-center bg-muted/40 px-4">
      <Container size="md">
        <Card className="p-10 text-center text-muted-foreground">{text}</Card>
      </Container>
    </main>
  );
}
