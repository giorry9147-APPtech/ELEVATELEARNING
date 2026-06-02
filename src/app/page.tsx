import SessionLauncher from "@/components/SessionLauncher";
import LandingNav from "@/components/LandingNav";
import { BrandMark } from "@/components/BrandingProvider";

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-sky-50 to-white">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-6">
        <BrandMark className="text-lg" />
        <LandingNav />
      </header>

      <section className="mx-auto max-w-6xl px-6 pb-12 pt-12 text-center">
        <h1 className="mx-auto max-w-3xl text-4xl font-extrabold tracking-tight text-slate-900 sm:text-5xl">
          Online bijles die meteen voelt als{" "}
          <span className="text-sky-600">één klaslokaal</span>
        </h1>
        <p className="mx-auto mt-5 max-w-2xl text-lg text-slate-600">
          Video, een live whiteboard en chat in één scherm. Geen downloads, geen
          gedoe — klik op een link en je zit in de les.
        </p>
        <div className="mt-10">
          <SessionLauncher />
        </div>
      </section>

      <section className="mx-auto grid max-w-5xl gap-6 px-6 pb-20 sm:grid-cols-3">
        {[
          {
            icon: "🎥",
            title: "Heldere video",
            text: "Stabiele 1-op-1 of groepsvideo, direct in de browser.",
          },
          {
            icon: "🖊️",
            title: "Live whiteboard",
            text: "Samen tekenen, uitleggen en berekeningen maken — realtime.",
          },
          {
            icon: "🔗",
            title: "Eén klik join",
            text: "Deel een link, de student zit zo in de les. Geen account nodig.",
          },
        ].map((f) => (
          <div
            key={f.title}
            className="rounded-2xl border border-slate-200 bg-white p-6 text-left shadow-sm"
          >
            <div className="text-3xl">{f.icon}</div>
            <h3 className="mt-3 font-semibold text-slate-800">{f.title}</h3>
            <p className="mt-1 text-sm text-slate-600">{f.text}</p>
          </div>
        ))}
      </section>

      <footer className="border-t border-slate-200 py-6 text-center text-sm text-slate-400">
        Bijlesplatform · demo-fase · gebouwd met Next.js, Excalidraw &amp; Daily
      </footer>
    </main>
  );
}
