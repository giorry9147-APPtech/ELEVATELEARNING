import Link from "next/link";
import { BrandMark } from "@/components/BrandingProvider";
import { Container } from "@/components/ui/Container";
import { LEGAL } from "@/lib/legal";

/** Gedeelde opmaak voor de juridische pagina's. */
export default function LegalShell({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <main className="min-h-screen flex-1 bg-surface">
      <header className="border-b border-border">
        <Container size="md" className="flex items-center justify-between py-4">
          <Link href="/">
            <BrandMark />
          </Link>
          <Link href="/" className="text-sm text-muted-foreground transition hover:text-foreground">
            ← Home
          </Link>
        </Container>
      </header>

      <Container size="md" className="py-10">
        <article>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">{title}</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Laatst bijgewerkt: {LEGAL.updatedAt}
          </p>
          <div className="mt-8 text-muted-foreground [&_a]:text-brand [&_a]:underline [&_h2]:mb-2 [&_h2]:mt-8 [&_h2]:text-lg [&_h2]:font-semibold [&_h2]:text-foreground [&_li]:mb-1 [&_p]:mb-3 [&_ul]:mb-3 [&_ul]:list-disc [&_ul]:pl-5">
            {children}
          </div>
        </article>
      </Container>

      <footer className="border-t border-border py-6 text-center text-xs text-muted-foreground">
        <Link href="/voorwaarden" className="hover:text-foreground">Voorwaarden</Link>
        {" · "}
        <Link href="/privacy" className="hover:text-foreground">Privacy</Link>
        {" · "}
        <Link href="/cookies" className="hover:text-foreground">Cookies</Link>
      </footer>
    </main>
  );
}
