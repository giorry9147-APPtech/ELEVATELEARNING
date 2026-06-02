import LegalShell from "@/components/LegalShell";
import { LEGAL } from "@/lib/legal";

export const metadata = { title: "Cookiebeleid — Bijles" };

export default function CookiesPage() {
  return (
    <LegalShell title="Cookiebeleid">
      <p>
        {LEGAL.tradeName} gebruikt zo min mogelijk cookies. Hieronder lees je
        welke en waarom.
      </p>

      <h2>Essentiële cookies</h2>
      <p>
        Deze zijn nodig om de dienst te laten werken en vereisen geen
        toestemming:
      </p>
      <ul>
        <li><strong>Authenticatie</strong> (Supabase): houdt je ingelogd.</li>
        <li><strong>Betaling</strong> (Stripe): nodig tijdens het afrekenen en voor fraudepreventie.</li>
        <li><strong>Voorkeuren</strong>: bijv. je gekozen naam of cookie-keuze (lokaal opgeslagen).</li>
      </ul>

      <h2>Analytische / tracking-cookies</h2>
      <p>
        Op dit moment plaatsen wij <strong>geen</strong> tracking- of
        advertentiecookies. Mochten wij in de toekomst analytics toevoegen, dan
        vragen wij daarvoor eerst je toestemming.
      </p>

      <h2>Cookies beheren</h2>
      <p>
        Je kunt cookies beheren of verwijderen via de instellingen van je
        browser. Het uitschakelen van essentiële cookies kan de werking van het
        platform beperken.
      </p>

      <p>
        Vragen? Mail <a href={`mailto:${LEGAL.email}`}>{LEGAL.email}</a>.
      </p>
    </LegalShell>
  );
}
