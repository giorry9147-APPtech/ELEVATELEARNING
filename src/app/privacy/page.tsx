import LegalShell from "@/components/LegalShell";
import { LEGAL, SUBPROCESSORS } from "@/lib/legal";

export const metadata = { title: "Privacybeleid — Bijles" };

export default function PrivacyPage() {
  return (
    <LegalShell title="Privacybeleid (AVG)">
      <p>
        {LEGAL.companyName} (&quot;{LEGAL.tradeName}&quot;, &quot;wij&quot;)
        respecteert je privacy en verwerkt persoonsgegevens conform de Algemene
        Verordening Gegevensbescherming (AVG/GDPR) en de Uitvoeringswet AVG.
      </p>

      <h2>Wie zijn wij</h2>
      <p>
        Verwerkingsverantwoordelijke: {LEGAL.companyName}, {LEGAL.address},{" "}
        {LEGAL.country}. KvK {LEGAL.kvk}, btw {LEGAL.vat}. Contact:{" "}
        <a href={`mailto:${LEGAL.email}`}>{LEGAL.email}</a>, {LEGAL.phone}.
      </p>
      <p>
        Voor lesgegevens die een docent over zijn leerlingen vastlegt, treden
        wij op als <strong>verwerker</strong>; de docent (of diens organisatie)
        is verwerkingsverantwoordelijke.
      </p>

      <h2>Welke gegevens wij verwerken</h2>
      <ul>
        <li>Accountgegevens: e-mailadres, naam, rol, wachtwoord (versleuteld).</li>
        <li>Lesgegevens: sessies, whiteboard-inhoud, chatberichten, lesmateriaal.</li>
        <li>Abonnement &amp; betaling: plan, verbruik (lesminuten), facturen (via Stripe).</li>
        <li>Technische gegevens: logbestanden, IP-adres, apparaat/browser.</li>
      </ul>

      <h2>Waarom en op welke grondslag</h2>
      <ul>
        <li>Uitvoering van de overeenkomst (de dienst leveren) — art. 6(1)(b).</li>
        <li>Wettelijke verplichting (administratie, btw) — art. 6(1)(c).</li>
        <li>Gerechtvaardigd belang (beveiliging, verbetering) — art. 6(1)(f).</li>
        <li>Toestemming, waar vereist (bijv. niet-essentiële cookies) — art. 6(1)(a).</li>
      </ul>

      <h2>Minderjarigen</h2>
      <p>
        In Nederland is de leeftijd voor digitale toestemming <strong>16 jaar</strong>.
        Voor leerlingen jonger dan 16 is toestemming van een ouder/voogd vereist.
        Docenten en organisaties zorgen dat zij hiervoor een geldige grondslag
        hebben.
      </p>

      <h2>Sub-verwerkers</h2>
      <p>Wij schakelen zorgvuldig geselecteerde sub-verwerkers in:</p>
      <ul>
        {SUBPROCESSORS.map((s) => (
          <li key={s.name}>
            <strong>{s.name}</strong> — {s.purpose} ({s.region}).
          </li>
        ))}
      </ul>
      <p>
        Met deze partijen sluiten wij verwerkersovereenkomsten (DPA&apos;s). Waar
        gegevens buiten de EER worden verwerkt, gebeurt dit met passende
        waarborgen (zoals EU-modelcontractbepalingen).
      </p>

      <h2>Bewaartermijnen</h2>
      <p>
        Wij bewaren gegevens niet langer dan nodig: accountgegevens zolang het
        account bestaat, financiële administratie 7 jaar (wettelijke plicht),
        lesgegevens conform de afspraken met de docent/organisatie.
      </p>

      <h2>Jouw rechten</h2>
      <p>
        Je hebt recht op inzage, correctie, verwijdering, beperking, bezwaar en
        dataportabiliteit. Stuur een verzoek naar{" "}
        <a href={`mailto:${LEGAL.email}`}>{LEGAL.email}</a>. Je kunt ook een
        klacht indienen bij de{" "}
        <a href="https://autoriteitpersoonsgegevens.nl" target="_blank" rel="noreferrer">
          Autoriteit Persoonsgegevens
        </a>
        .
      </p>

      <h2>Beveiliging &amp; datalekken</h2>
      <p>
        Wij nemen passende technische en organisatorische maatregelen (o.a.
        versleuteling, toegangscontrole via Row-Level Security). Bij een datalek
        handelen wij conform de meldplicht (72 uur).
      </p>

      <p className="mt-8 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-700">
        Dit is een startsjabloon en geen juridisch advies. Laat het nakijken door
        een jurist en vul de bedrijfsgegevens in.
      </p>
    </LegalShell>
  );
}
