import LegalShell from "@/components/LegalShell";
import { LEGAL } from "@/lib/legal";

export const metadata = { title: "Algemene Voorwaarden — Bijles" };

export default function VoorwaardenPage() {
  return (
    <LegalShell title="Algemene Voorwaarden">
      <p>
        Deze voorwaarden gelden voor het gebruik van het {LEGAL.tradeName}-platform,
        aangeboden door {LEGAL.companyName} ({LEGAL.country}, KvK {LEGAL.kvk}).
      </p>

      <h2>1. De dienst</h2>
      <p>
        {LEGAL.tradeName} is online software waarmee docenten lesgeven via video,
        een collaboratief whiteboard en chat, en hun lessen/leerlingen beheren.
      </p>

      <h2>2. Account</h2>
      <p>
        Je bent verantwoordelijk voor de juistheid van je gegevens en de
        geheimhouding van je wachtwoord. Tijdens de besloten fase is toegang
        alleen mogelijk met een geldige uitnodigingscode.
      </p>

      <h2>3. Abonnementen &amp; betaling</h2>
      <ul>
        <li>Abonnementen worden maandelijks vooraf betaald via onze betaalpartner Stripe (iDEAL/kaart).</li>
        <li>Elk pakket bevat een aantal lesminuten per maand; bij het bereiken van de limiet kun je upgraden om verder te gaan.</li>
        <li>Prijzen zijn exclusief btw, tenzij anders vermeld.</li>
        <li>Je kunt maandelijks opzeggen via het klantportaal; toegang blijft tot het einde van de betaalde periode.</li>
      </ul>

      <h2>4. Toegestaan gebruik</h2>
      <p>
        Je gebruikt het platform niet voor onrechtmatige doeleinden, niet om
        anderen te schaden, en niet in strijd met toepasselijke wetgeving. Wij
        mogen misbruik onderzoeken en accounts opschorten.
      </p>

      <h2>5. Beschikbaarheid</h2>
      <p>
        Wij streven naar een hoge beschikbaarheid maar geven geen garantie op
        ononderbroken werking. Voor video gebruiken wij een externe provider
        (Daily.co).
      </p>

      <h2>6. Aansprakelijkheid</h2>
      <p>
        Voor zover wettelijk toegestaan is onze aansprakelijkheid beperkt tot het
        bedrag dat je in de betreffende maand hebt betaald. Wij zijn niet
        aansprakelijk voor indirecte schade.
      </p>

      <h2>7. Beëindiging</h2>
      <p>
        Beide partijen kunnen de overeenkomst beëindigen conform deze
        voorwaarden. Bij beëindiging vervalt je toegang en kunnen gegevens na een
        redelijke termijn worden verwijderd.
      </p>

      <h2>8. Wijzigingen</h2>
      <p>
        Wij kunnen deze voorwaarden aanpassen. Bij belangrijke wijzigingen
        informeren wij je vooraf.
      </p>

      <h2>9. Toepasselijk recht</h2>
      <p>
        Op deze voorwaarden is Nederlands recht van toepassing. Geschillen worden
        voorgelegd aan de bevoegde rechter in {LEGAL.country}.
      </p>

      <p>
        Vragen? Mail{" "}
        <a href={`mailto:${LEGAL.email}`}>{LEGAL.email}</a>.
      </p>

      <p className="mt-8 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-700">
        Startsjabloon, geen juridisch advies — laat nakijken door een jurist.
      </p>
    </LegalShell>
  );
}
