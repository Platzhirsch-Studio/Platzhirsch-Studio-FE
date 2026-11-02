// src/lib/legal/dseSections.js – gemeinsame DSE-Sperre (Rat 9,5, Maßnahme B3/B4).
//
// Eine Liste aller Ergänzungen der Datenschutzerklärung, die für neue
// Funktionen mit Personendaten vorbereitet sind. Jeder Eintrag hat
//   anchor     Abschnitt-ID auf /<locale>/datenschutz (id="…")
//   status     "entwurf" bis die Kanzlei den Wortlaut freigibt, dann
//              "freigegeben". NUR nach schriftlicher Freigabe umstellen,
//              Wortlaut in src/components/LegalDrafts/dseErgaenzungen.js ohne
//              [eckige Klammern] (Unit-Test rat95-recht-dse.test.mjs).
//   vorschlag  wo der Vorschlag mit den offenen Punkten liegt
//
// Regel (dseGateOpen): In Produktion läuft eine Funktion mit Personendaten
// erst, wenn ihr Abschnitt freigegeben ist und damit auf /datenschutz steht.
// In der Entwicklung (Testbetrieb) bleibt alles prüfbar; dort zeigt die
// Datenschutzseite die Entwürfe sichtbar als „Entwurf“.
// Der Release-Test (tools/qa/prod-check.mjs, Schritt „dse“) prüft zusätzlich
// im Produktions-HTML, dass jede aktive Funktion ihren Anker hat
// (src/lib/legal/dseFeatures.js).
//
// Rein, ohne "@/" und ohne Pakete: Client, Server und node --test lesen sie.

export const DSE_FREIGEGEBEN = "freigegeben";

export const DSE_SECTIONS = Object.freeze({
  termin: Object.freeze({
    anchor: "termin",
    title: "Online-Terminbuchung und Videoberatung",
    status: "entwurf",
    vorschlag: "Marktresearch/digital/features/termin-dse-vorschlag.md",
  }),
  whatsapp: Object.freeze({
    anchor: "whatsapp",
    title: "WhatsApp",
    status: "entwurf",
    vorschlag: "Marktresearch/digital/features/whatsapp-dse-vorschlag.md (Teil B)",
  }),
  einblicke: Object.freeze({
    anchor: "besucher-einblicke",
    title: "Besucher-Einblicke (eigene Heatmap)",
    status: "entwurf",
    vorschlag: "Marktresearch/digital/features/einblicke-dse-vorschlag.md",
  }),
  ideenboard: Object.freeze({
    anchor: "ideenboard",
    title: "Ideenboard teilen",
    status: "entwurf",
    vorschlag: "Marktresearch/recht/07-dse-ergaenzungen-rat95.md (Abschnitt Ideenboard)",
  }),
  wunschliste: Object.freeze({
    anchor: "wunschliste",
    title: "Teilbare Wunschliste",
    status: "entwurf",
    vorschlag: "Marktresearch/digital/features/service-recht-vorschlag.md (Wunschliste, Teil A)",
  }),
  empfehlung: Object.freeze({
    anchor: "empfehlung",
    title: "Empfehlungsprogramm",
    status: "entwurf",
    vorschlag: "Marktresearch/digital/features/empfehlung-bedingungen-vorschlag.md (Ergänzung Datenschutzerklärung)",
  }),
  serviceAnfragen: Object.freeze({
    anchor: "service-anfragen",
    title: "Anfragen zu Hotel & Objekt, Architekten, Winterservice und Pflege",
    status: "entwurf",
    vorschlag: "Marktresearch/digital/features/service-recht-vorschlag.md (Teile D) und 07-dse-ergaenzungen-rat95.md",
  }),
  ar: Object.freeze({
    anchor: "ar-ansicht",
    title: "3D- und AR-Ansicht",
    status: "entwurf",
    vorschlag: "Marktresearch/recht/07-dse-ergaenzungen-rat95.md (Abschnitt AR)",
  }),
  tagebuch: Object.freeze({
    anchor: "tagebuch",
    title: "Kundenportal: Projekt-Tagebuch und Referenz",
    status: "entwurf",
    vorschlag: "Marktresearch/digital/features/service-recht-vorschlag.md (Projekt-Tagebuch, Teil B)",
  }),
});

export const DSE_SECTION_IDS = Object.freeze(Object.keys(DSE_SECTIONS));

export const isProduction = (env = process.env) => env?.NODE_ENV === "production" || env?.VERCEL_ENV === "production";

/** Abschnitt von der Kanzlei freigegeben? */
export function dseApproved(id, sections = DSE_SECTIONS) {
  return sections?.[id]?.status === DSE_FREIGEGEBEN;
}

/**
 * Darf die Funktion zu diesem Abschnitt laufen? Produktion: nur mit
 * freigegebenem Abschnitt. Entwicklung: immer (Testbetrieb, Entwürfe sichtbar).
 */
export function dseGateOpen(id, env = process.env, sections = DSE_SECTIONS) {
  if (!sections?.[id]) throw new Error(`Unbekannter DSE-Abschnitt: ${id}`);
  return !isProduction(env) || dseApproved(id, sections);
}

/**
 * Wie erscheint der Abschnitt auf /datenschutz?
 *   "live"    freigegeben → normaler Text
 *   "entwurf" nur außerhalb der Produktion, sichtbar als Entwurf markiert
 *   null      gar nicht (Produktion ohne Freigabe)
 */
export function dseRenderMode(id, env = process.env, sections = DSE_SECTIONS) {
  if (dseApproved(id, sections)) return "live";
  return isProduction(env) ? null : "entwurf";
}

/** Abschnitte, die noch auf die Kanzlei warten (für Paket und Cockpit). */
export function dseOpenSections(sections = DSE_SECTIONS) {
  return Object.entries(sections)
    .filter(([, s]) => s.status !== DSE_FREIGEGEBEN)
    .map(([id, s]) => ({ id, anchor: s.anchor, title: s.title, vorschlag: s.vorschlag }));
}
