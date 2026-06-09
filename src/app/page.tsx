import Link from "next/link";
import SessionLauncher from "@/components/SessionLauncher";
import LandingNav from "@/components/LandingNav";
import { BrandMark } from "@/components/BrandingProvider";
import { Container, SectionHeading } from "@/components/ui/Container";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { buttonClasses } from "@/components/ui/Button";
import { ClassroomPreview } from "@/components/ui/ClassroomPreview";
import { FloatingObjects } from "@/components/ui/FloatingObjects";
import {
  VideoIcon,
  ShieldIcon,
  GraduationIcon,
  ArrowRightIcon,
  CheckIcon,
  ClockIcon,
  EuroIcon,
  TagIcon,
} from "@/components/ui/icons";

const PILLARS = [
  {
    icon: EuroIcon,
    title: "Eigen tarieven & prijzen bepalen",
    soon: true,
    points: [
      { soon: true, text: "Stel zelf je lesprijzen en pakketten samen (bijv. “12 uur wiskunde”) en bepaal wat je je leerlingen rekent — wij bemoeien ons daar niet mee." },
      { soon: true, text: "Directe betaling door leerlingen via Stripe Connect: jij houdt je deel." },
    ],
  },
  {
    icon: TagIcon,
    title: "Eigen merk & zelfstandigheid",
    points: [
      { text: "White-label: eigen naam, logo, kleuren en domein — ons platform is onzichtbaar. Het voelt als jóuw software." },
      { text: "Je eigen afgeschermde lesomgeving — een echte micro-onderneming." },
    ],
  },
  {
    icon: GraduationIcon,
    title: "Beter lesgeven, minder gedoe",
    points: [
      { text: "Alles in één scherm: video, live whiteboard en chat. Geen Zoom + Miro + WhatsApp door elkaar." },
      { text: "Krachtig whiteboard: meerdere borden, pagina’s en een wiskunde-toetsenbord." },
      { text: "Geen drempel voor de leerling: klik op een link — geen account, geen download." },
      { text: "Lesmateriaal bewaard: borden en pagina’s per les opgeslagen, terug op elk apparaat." },
    ],
  },
  {
    icon: ShieldIcon,
    title: "Vertrouwd & zorgeloos",
    points: [
      { text: "Nederlandstalig, iDEAL-betaling, AVG-proof met EU-hosting." },
      { text: "Transparante kosten: vast abonnement met lesminuten en een duidelijke verbruiksmeter." },
      { text: "Snel starten: frictieloze aanmelding, meteen lesgeven." },
    ],
  },
];

const TRUST = [
  { icon: ShieldIcon, label: "AVG-proof, EU-hosting" },
  { icon: CheckIcon, label: "iDEAL & creditcard" },
  { icon: GraduationIcon, label: "In het Nederlands" },
  { icon: VideoIcon, label: "Geen downloads" },
];

// Hero-knoppen (op de lichtgroene achtergrond → donkergroene accenten).
const heroPrimary =
  "btn-green inline-flex h-13 items-center justify-center gap-2 rounded-full px-7 text-base font-semibold transition";
const heroSecondary =
  "inline-flex h-13 items-center justify-center gap-2 rounded-full border border-[#15803d]/30 bg-white/40 px-7 text-base font-semibold text-[#0f3d2a] backdrop-blur transition hover:bg-white/70";

export default function Home() {
  return (
    <main className="flex-1">
      {/* ---- Premium lichtgroene hero met bewegende school-objecten ---- */}
      <section className="relative isolate overflow-hidden hero-green">
        <FloatingObjects />
        <Container size="xl" className="relative">
          <header className="mt-4 grid grid-cols-[auto_1fr_auto] items-center gap-3 rounded-full border border-white/60 bg-white/45 px-4 py-2.5 shadow-soft backdrop-blur sm:px-5 sm:py-3">
            <BrandMark className="text-lg" />
            <LandingNav accent="green" />
          </header>

          <div className="grid items-center gap-12 pt-10 pb-10 lg:grid-cols-[1fr_1.2fr] lg:gap-10 lg:pt-16 lg:pb-12">
            <div className="text-center lg:text-left">
              <span className="inline-flex items-center gap-2 rounded-full bg-white/60 px-3.5 py-1.5 text-sm font-semibold text-[#15532f] ring-1 ring-[#15803d]/15 backdrop-blur">
                <GraduationIcon size={14} /> Het digitale klaslokaal voor bijles
              </span>
              <h1 className="mt-5 text-balance bg-gradient-to-br from-[#0f3d2a] to-[#1c7a49] bg-clip-text text-5xl font-extrabold leading-[1.04] tracking-tight text-transparent sm:text-6xl lg:text-[4.25rem]">
                Professioneel platform voor online lesgeven
              </h1>
              <p className="mx-auto mt-5 max-w-xl text-pretty text-lg text-[#356b53] lg:mx-0">
                Video, een live whiteboard en chat in één scherm. Geen gedoe —
                klik op een link en je zit in de les.
              </p>
              <div className="mt-8 flex flex-wrap justify-center gap-3 lg:justify-start">
                <Link href="#start" className={heroPrimary}>
                  Start een les <ArrowRightIcon size={18} />
                </Link>
                <Link href="/prijzen" className={heroSecondary}>
                  Bekijk prijzen
                </Link>
              </div>
            </div>

            <div className="relative">
              <ClassroomPreview className="mx-auto max-w-lg lg:max-w-none" />
            </div>
          </div>

          {/* Vertrouwen-strip — gestrekt over de volle breedte */}
          <ul className="mb-12 flex flex-col divide-y divide-[#15803d]/12 overflow-hidden rounded-2xl bg-white/55 shadow-soft ring-1 ring-white/60 backdrop-blur sm:flex-row sm:divide-x sm:divide-y-0 lg:mb-16">
            {TRUST.map((t) => (
              <li
                key={t.label}
                className="flex flex-1 items-center justify-center gap-2.5 px-4 py-3.5 text-sm font-semibold text-[#15532f]"
              >
                <t.icon size={18} className="shrink-0 text-[#1f9d60]" />
                {t.label}
              </li>
            ))}
          </ul>
        </Container>
      </section>

      {/* ---- Direct beginnen ---- */}
      <section id="start" className="scroll-mt-20 py-16 sm:py-20">
        <Container size="xl">
          <SectionHeading
            eyebrow="Begin direct"
            title="Start of join een les"
            description="Gratis uitproberen — geen installatie, geen account nodig voor je leerling."
          />
          <div className="mt-10">
            <SessionLauncher />
          </div>
        </Container>
      </section>

      {/* ---- Pijlers: waarom Bijles ---- */}
      <section className="py-16 sm:py-20">
        <Container size="xl">
          <SectionHeading
            eyebrow="Waarom Bijles"
            title="Alles om zelfstandig en professioneel les te geven"
            description="Jouw eigen lesplatform — onder je eigen merk, met alles in één scherm en zonder gedoe."
          />
          <div className="mt-12 grid gap-5 md:grid-cols-2">
            {PILLARS.map((p) => (
              <Card key={p.title} className="p-6 sm:p-7">
                <div className="flex items-center gap-3.5">
                  <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-brand-soft text-brand-strong">
                    <p.icon size={24} />
                  </span>
                  <h3 className="text-lg font-semibold text-foreground">{p.title}</h3>
                  {p.soon && (
                    <Badge variant="warning" className="ml-auto shrink-0">
                      Binnenkort
                    </Badge>
                  )}
                </div>
                <ul className="mt-5 space-y-3">
                  {p.points.map((pt, i) => (
                    <li key={i} className="flex gap-3 text-sm leading-relaxed text-muted-foreground">
                      {"soon" in pt && pt.soon ? (
                        <ClockIcon size={18} className="mt-0.5 shrink-0 text-warning" />
                      ) : (
                        <CheckIcon size={18} className="mt-0.5 shrink-0 text-success" />
                      )}
                      <span>{pt.text}</span>
                    </li>
                  ))}
                </ul>
              </Card>
            ))}
          </div>
        </Container>
      </section>

      {/* ---- CTA-band (vol blauw) ---- */}
      <section className="pb-20">
        <Container size="xl">
          <div className="relative isolate overflow-hidden rounded-[32px] px-6 py-16 text-center hero-green shadow-soft-lg ring-1 ring-[#15803d]/10 sm:px-12">
            <FloatingObjects />
            <div className="relative mx-auto max-w-2xl">
              <h2 className="text-balance bg-gradient-to-br from-[#0f3d2a] to-[#1c7a49] bg-clip-text text-3xl font-bold tracking-tight text-transparent sm:text-4xl">
                Klaar voor je eigen digitale klaslokaal?
              </h2>
              <p className="mt-3 text-pretty text-lg text-[#356b53]">
                Begin gratis. Upgrade wanneer je meer lesminuten of je eigen
                huisstijl wilt.
              </p>
              <div className="mt-8 flex flex-wrap justify-center gap-3">
                <Link href="/login" className={heroPrimary}>
                  Gratis beginnen <ArrowRightIcon size={18} />
                </Link>
                <Link href="/prijzen" className={heroSecondary}>
                  Prijzen bekijken
                </Link>
              </div>
            </div>
          </div>
        </Container>
      </section>

      {/* ---- Footer ---- */}
      <footer className="border-t border-border bg-surface py-10">
        <Container size="xl" className="flex flex-col items-center gap-4 text-center sm:flex-row sm:justify-between sm:text-left">
          <BrandMark />
          <nav className="flex flex-wrap justify-center gap-x-5 gap-y-2 text-sm text-muted-foreground">
            <Link href="/prijzen" className="hover:text-foreground">Prijzen</Link>
            <Link href="/voorwaarden" className="hover:text-foreground">Voorwaarden</Link>
            <Link href="/privacy" className="hover:text-foreground">Privacy</Link>
            <Link href="/cookies" className="hover:text-foreground">Cookies</Link>
          </nav>
        </Container>
        <p className="mt-6 text-center text-xs text-muted-foreground">
          © {new Date().getFullYear()} Cornerstone Tech · gebouwd met Next.js, Excalidraw &amp; Daily
        </p>
      </footer>
    </main>
  );
}
