import Link from "next/link";
import { BrandMark } from "@/components/BrandingProvider";
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
    <main className="min-h-screen bg-white">
      <header className="border-b border-slate-200">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-6 py-4">
          <Link href="/">
            <BrandMark />
          </Link>
          <Link href="/" className="text-sm text-slate-500 hover:text-slate-800">
            ← Home
          </Link>
        </div>
      </header>

      <article className="mx-auto max-w-3xl px-6 py-10">
        <h1 className="text-3xl font-bold text-slate-900">{title}</h1>
        <p className="mt-1 text-sm text-slate-400">
          Laatst bijgewerkt: {LEGAL.updatedAt}
        </p>
        <div
          className="mt-8 text-slate-600 [&_a]:text-sky-600 [&_a]:underline [&_h2]:mb-2 [&_h2]:mt-8 [&_h2]:text-lg [&_h2]:font-semibold [&_h2]:text-slate-900 [&_li]:mb-1 [&_p]:mb-3 [&_ul]:mb-3 [&_ul]:list-disc [&_ul]:pl-5"
        >
          {children}
        </div>
      </article>

      <footer className="border-t border-slate-200 py-6 text-center text-xs text-slate-400">
        <Link href="/voorwaarden" className="hover:text-slate-600">Voorwaarden</Link>
        {" · "}
        <Link href="/privacy" className="hover:text-slate-600">Privacy</Link>
        {" · "}
        <Link href="/cookies" className="hover:text-slate-600">Cookies</Link>
      </footer>
    </main>
  );
}
