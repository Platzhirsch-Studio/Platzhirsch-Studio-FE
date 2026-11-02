// GermanOnlyNotice – Hinweis auf EN/FR/IT-Rechtsseiten (Datenschutz,
// Impressum), r3-recht-inhalt P1-2: WCAG 3.1.2 (Sprache von Teilen) und
// Art. 12 DSGVO (klare Information).
//
// Die Rechtstexte liegen nur auf Deutsch vor (Entwurfsstand, Freigabe durch
// die Kanzlei offen: inhaber-offen B.5/B.6). Deshalb
//   - steht der deutsche Textkörper in einem Container mit lang="de"
//     (Impressum/LegalProse.js), ebenso H1 und Brotkrume („Datenschutz“,
//     „Impressum“) auf EN/FR/IT,
//   - steht darüber dieser Satz in der Seitensprache.
// Hreflang und Canonical bleiben unverändert (page.js der beiden Routen).
// Die Übersetzungen der Rechtstexte selbst sind Sache der Kanzlei
// (00-abschluss.md F3: „Welche Sprachfassungen bekommen Impressum und DSE?“).
//
// Texte hier statt in src/messages: die Datei gehört dem Team Recht, die
// Messages einem anderen Team; der Satz ist an diese beiden Seiten gebunden.

export const GERMAN_ONLY_NOTICE = Object.freeze({
  en: "This page is only available in German. The German version is authoritative.",
  fr: "Cette page n’est disponible qu’en allemand. La version allemande fait foi.",
  it: "Questa pagina è disponibile solo in tedesco. Fa fede la versione tedesca.",
});

/** Satz für die Seitensprache, oder null auf Deutsch (und für unbekannte Sprachen: Englisch). */
export function germanOnlyNotice(locale) {
  if (!locale || locale === "de") return null;
  return GERMAN_ONLY_NOTICE[locale] || GERMAN_ONLY_NOTICE.en;
}

/** Deutsches Wort auf einer fremdsprachigen Seite: als <span lang="de">. */
export function germanText(text, locale) {
  return locale && locale !== "de" ? <span lang="de">{text}</span> : text;
}

/** Hinweiszeile (als lead im PageHeader). */
export default function GermanOnlyNotice({ locale }) {
  const text = germanOnlyNotice(locale);
  if (!text) return null;
  return <span data-german-only-notice="">{text}</span>;
}
