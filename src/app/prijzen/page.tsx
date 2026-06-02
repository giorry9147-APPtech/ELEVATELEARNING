import Link from "next/link";
import PricingTable from "@/components/PricingTable";
import { BrandMark } from "@/components/BrandingProvider";

export const metadata = { title: "Prijzen — Bijles" };

export default function PrijzenPage() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-sky-50 to-white">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-6">
        <Link href="/">
          <BrandMark className="text-lg" />
        </Link>
        <Link href="/dashboard" className="text-sm text-slate-600 hover:text-slate-900">
          Mijn lessen
        </Link>
      </header>

      <section className="mx-auto max-w-6xl px-6 pb-20 pt-8">
        <div className="mx-auto max-w-2xl text-center">
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
            Eén platform, één prijs per maand
          </h1>
          <p className="mt-3 text-slate-600">
            Lesgeven met video, whiteboard en chat. Kies een pakket met genoeg
            lesminuten; daarboven reken je per minuut bij.
          </p>
        </div>

        <div className="mt-10">
          <PricingTable />
        </div>

        <p className="mt-8 text-center text-xs text-slate-400">
          Prijzen excl. btw. Lesminuten gelden voor 1-op-1; groepslessen
          verbruiken sneller. Maandelijks opzegbaar.
        </p>
      </section>
    </main>
  );
}
