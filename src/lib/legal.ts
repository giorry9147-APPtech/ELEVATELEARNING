/**
 * Bedrijfs- en juridische gegevens, gebruikt op de Voorwaarden-, Privacy- en
 * Cookie-pagina's. VUL DEZE IN met je echte gegevens vóór je live gaat.
 *
 * ⚠️ De juridische teksten zijn een degelijke startsjabloon, GEEN juridisch
 * advies. Laat ze vóór commercieel gebruik nakijken door een jurist.
 */
export const LEGAL = {
  companyName: "[Bedrijfsnaam — juridische entiteit bij KvK]",
  tradeName: "Bijles",
  kvk: "91058732",
  vat: "NL004862218B12",
  address: "Röntgenweg 183, 2624 BD Delft",
  country: "Nederland",
  email: "giorgioasimson@gmail.com",
  phone: "+31 6 21650846",
  // Laatst bijgewerkt (handmatig aanpassen bij wijzigingen).
  updatedAt: "juni 2026",
};

/** Sub-verwerkers (voor de privacyverklaring/DPA). Allen EU/EEA-hosting waar mogelijk. */
export const SUBPROCESSORS = [
  { name: "Supabase", purpose: "Database, authenticatie, opslag", region: "EU" },
  { name: "Vercel", purpose: "Hosting van de applicatie", region: "EU/VS" },
  { name: "Daily.co", purpose: "Videoverbindingen", region: "VS (EU-routing mogelijk)" },
  { name: "Stripe", purpose: "Betalingsverwerking", region: "EU/VS" },
  { name: "Resend", purpose: "Transactionele e-mail", region: "EU/VS" },
];
