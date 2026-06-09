import Link from "next/link";
import PricingTable from "@/components/PricingTable";
import { BrandMark } from "@/components/BrandingProvider";
import { Container, SectionHeading } from "@/components/ui/Container";
import { SkyBackdrop } from "@/components/ui/SkyBackdrop";

export const metadata = { title: "Prijzen — Bijles" };

export default function PrijzenPage() {
  return (
    <main className="flex-1">
      <SkyBackdrop variant="green" className="pb-24">
        <Container size="xl">
          <header className="flex items-center justify-between py-5">
            <Link href="/">
              <BrandMark className="text-lg" />
            </Link>
            <Link
              href="/dashboard"
              className="rounded-full px-3 py-2 text-sm font-medium text-muted-foreground transition hover:bg-black/5 hover:text-foreground"
            >
              Mijn lessen
            </Link>
          </header>

          <div className="py-12 sm:py-16">
            <SectionHeading
              eyebrow="Prijzen"
              title="Eén platform, één prijs per maand"
              description="Lesgeven met video, whiteboard en chat. Kies een pakket met genoeg lesminuten; daarboven reken je per minuut bij."
            />
          </div>
        </Container>
      </SkyBackdrop>

      <Container size="xl" className="pb-20">
        <div className="-mt-16">
          <PricingTable />
        </div>
        <p className="mt-8 text-center text-xs text-muted-foreground">
          Prijzen excl. btw. Lesminuten gelden voor 1-op-1; groepslessen
          verbruiken sneller. Maandelijks opzegbaar.
        </p>
      </Container>
    </main>
  );
}
