"use client";

import { useEffect, useState } from "react";
import { Container, SectionHeading } from "@/components/ui/Container";
import { SkyBackdrop } from "@/components/ui/SkyBackdrop";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input, Label } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import { GraduationIcon } from "@/components/ui/icons";

export type ShopPackage = {
  id: string;
  name: string;
  description: string | null;
  subject: string | null;
  kind: "hourly" | "bundle";
  priceCents: number;
  currency: string;
  hours: number | null;
};

function fmt(cents: number, currency: string) {
  return new Intl.NumberFormat("nl-NL", { style: "currency", currency }).format(cents / 100);
}

export default function PayShop({
  orgName,
  canPay,
  packages,
  initialPackageId,
}: {
  orgName: string;
  canPay: boolean;
  packages: ShopPackage[];
  initialPackageId?: string;
}) {
  const [selected, setSelected] = useState<ShopPackage | null>(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  // Diep-link: ?pkg=<id> selecteert meteen het juiste pakket.
  useEffect(() => {
    if (!initialPackageId) return;
    const p = packages.find((x) => x.id === initialPackageId);
    if (p) {
      setSelected(p);
      setTimeout(
        () => document.getElementById("betaalform")?.scrollIntoView({ behavior: "smooth", block: "center" }),
        80,
      );
    }
  }, [initialPackageId, packages]);

  const choose = (p: ShopPackage) => {
    setSelected(p);
    setError("");
    setTimeout(
      () => document.getElementById("betaalform")?.scrollIntoView({ behavior: "smooth", block: "center" }),
      50,
    );
  };

  const pay = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selected) return;
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/packages/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ packageId: selected.id, name, email }),
      });
      const data = await res.json();
      if (data?.url) window.location.href = data.url;
      else setError(data?.error ?? "Betalen lukt nu niet.");
    } catch {
      setError("Er ging iets mis. Probeer het later opnieuw.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="flex-1">
      <SkyBackdrop variant="green">
        <Container size="lg" className="py-12 sm:py-16">
          <div className="mx-auto mb-3 flex w-fit items-center gap-2 rounded-full bg-white/60 px-3.5 py-1.5 text-sm font-semibold text-[#15532f] ring-1 ring-[#15803d]/15 backdrop-blur">
            <GraduationIcon size={14} /> {orgName}
          </div>
          <SectionHeading
            title="Kies je lespakket"
            description="Veilig betalen via iDEAL of creditcard. Je betaalt rechtstreeks aan je docent."
          />
        </Container>
      </SkyBackdrop>

      <Container size="lg" className="-mt-8 pb-20">
        {!canPay && (
          <Card className="mb-5 p-4 text-sm text-warning">
            Deze docent kan op dit moment nog geen online betalingen ontvangen.
          </Card>
        )}

        {packages.length === 0 ? (
          <Card className="p-10 text-center text-muted-foreground">
            Er zijn nog geen pakketten beschikbaar.
          </Card>
        ) : (
          <ul className="grid gap-4 sm:grid-cols-2">
            {packages.map((p) => (
              <Card key={p.id} as="li" className="flex flex-col p-5">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="font-semibold text-foreground">{p.name}</h3>
                    <div className="mt-1 flex flex-wrap gap-1.5">
                      <Badge variant={p.kind === "hourly" ? "accent" : "brand"}>
                        {p.kind === "hourly" ? "Per uur" : "Pakket"}
                      </Badge>
                      {p.subject && <Badge variant="muted">{p.subject}</Badge>}
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xl font-bold text-foreground">{fmt(p.priceCents, p.currency)}</p>
                    <p className="text-xs text-muted-foreground">
                      {p.kind === "hourly" ? "per uur" : p.hours ? `${p.hours} uur` : "totaal"}
                    </p>
                  </div>
                </div>
                {p.description && (
                  <p className="mt-3 text-sm text-muted-foreground">{p.description}</p>
                )}
                <Button className="mt-4" disabled={!canPay} onClick={() => choose(p)}>
                  Betalen · {fmt(p.priceCents, p.currency)}
                </Button>
              </Card>
            ))}
          </ul>
        )}

        {/* Betaal-formulier voor het gekozen pakket */}
        {selected && (
          <Card id="betaalform" className="mt-6 p-6">
            <p className="text-sm text-muted-foreground">Gekozen pakket</p>
            <div className="mt-1 flex items-baseline justify-between">
              <h3 className="font-semibold text-foreground">{selected.name}</h3>
              <span className="text-lg font-bold text-foreground">
                {fmt(selected.priceCents, selected.currency)}
              </span>
            </div>
            <form onSubmit={pay} className="mt-4 grid gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="b-name">Je naam</Label>
                <Input id="b-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Voor- en achternaam" />
              </div>
              <div>
                <Label htmlFor="b-email">E-mail</Label>
                <Input id="b-email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="jij@voorbeeld.nl" />
              </div>
              {error && <p className="text-sm text-danger sm:col-span-2">{error}</p>}
              <div className="sm:col-span-2">
                <Button type="submit" disabled={busy || !canPay} fullWidth size="lg">
                  {busy ? "Bezig…" : `Betaal ${fmt(selected.priceCents, selected.currency)}`}
                </Button>
                <p className="mt-2 text-center text-xs text-muted-foreground">
                  Je wordt veilig doorgestuurd naar Stripe (iDEAL of creditcard).
                </p>
              </div>
            </form>
          </Card>
        )}
      </Container>
    </main>
  );
}
