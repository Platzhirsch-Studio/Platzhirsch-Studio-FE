// Küchenplaner – Planungsregeln und Normmaße mit Quellen.
//
// Regel: Ein Maß steht nur hier, wenn es eine Quelle mit URL hat. Wo es keine
// gibt, steht `source: null` und die Oberfläche zeigt „Maß fehlt – Gerät/Modell
// vor Bestellung prüfen“. Alle Werte sind Planungsrichtwerte, keine Zusagen.
// Abgerufen am 27.10.2026.

export const SOURCES = {
  neffErgo: {
    title: "Neff Küchenplanung – Ergonomie (Arbeitshöhe 10–15 cm unter dem Ellenbogen, Beispiel 180 cm → Ellenbogen 114 cm)",
    url: "https://www.neff-home.com/at/neff-entdecken/kuechenplanung/schritte/ergonomie",
  },
  amk: {
    title: "AMK-Studie (2011) über woodworker.de: Arbeitsplatte 10–15 cm unter dem Ellenbogen",
    url: "https://www.woodworker.de/news/weiter/ideale-arbeitshoehe-richtet-sich-nach-dem-ellenbogen",
  },
  neffRaster: {
    title: "Neff Küchenplanung – Korpushöhen und Rastermaße (10-cm- und 15-cm-Raster)",
    url: "https://www.neff-home.com/at/neff-entdecken/kuechenplanung/schritte/korpushoehe-und-rastermasse",
  },
  gang: {
    title: "sanier.de – Maße und Abstände in der Küche (Durchgang 100 cm für eine, 120 cm für zwei Personen)",
    url: "https://www.sanier.de/kueche/die-wichtigsten-masse-und-abstaende-in-der-kueche",
  },
  nkba: {
    title: "NKBA-Planungsrichtlinien (Zusammenfassung): Insel/Halbinsel – Platte 9 in (≈ 23 cm) hinter dem Kochfeld",
    url: "https://www.thewcsupply.com/pages/kitchen-design-guidelines-standard-clearances",
  },
  dreieck: {
    title: "Arbeitsdreieck (NKBA-Richtwert: jede Seite 4–9 ft ≈ 120–270 cm, Summe ≤ 26 ft ≈ 790 cm)",
    url: "https://en.wikipedia.org/wiki/Kitchen_work_triangle",
  },
  sms: {
    title: "Bundesrat (CH): SMS-Norm (früher SINK) mit 55 cm Einbaubreite, EN 1116 mit 60 cm",
    url: "https://www.newsd.admin.ch/newsd/message/attachments/6127.pdf",
  },
  liebherrNische: {
    title: "Liebherr Einbau-Kühlgeräte: Nische 178 cm (177,2–178,8 × 56–57 × 55) und 122 cm (121,6–123,6)",
    url: "https://www.liebherr.com/de-ch/gefrier-kuehlschraenke/einbaukuehlschraenke-3069014",
  },
  boschOfen: {
    title: "Bosch HBA5780S0B: Einbaunische 585–595 × 560–568 × 550 mm",
    url: "https://bosch-home.co.uk/customer-service/HBA5780S0B/04",
  },
  kompakt: {
    title: "Constructa CC4M61063 (BSH): Kompaktgerät, Nische 455 × 560 × 550 mm",
    url: "https://media3.bsh-group.com/Documents/specsheet/de-DE/CC4M61063.pdf",
  },
  haube: {
    title: "Neff: Abstand Dunstabzugshaube – Kochfeld je Haubentyp (Elektro ab 55 cm, Gas 65 cm)",
    url: "https://www.neff-home.com/at/de/c/spotlight/bltf94ee40e0269825b/hoehe-dunstabzugshaube",
  },
  gsStandard: {
    title: "Bosch SMV8YCX03E (60 cm vollintegriert): Einbaunische 815–875 × 600 × 550 mm",
    url: "https://media3.bosch-home.com/Documents/specsheet/fr-CH/SMV8YCX03E.pdf",
  },
  gsHoch: {
    title: "Bosch SBV4EAX23E (60 cm, hohe Nische): Einbaunische 865–925 × 600 × 550 mm",
    url: "https://media3.bosch-home.com/Documents/specsheet/de-AT/SBV4EAX23E.pdf",
  },
};

/** Ellenbogenhöhe ≈ 0,633 × Körpergröße (Neff-Beispiel 180 → 114 cm). */
export const ELBOW_RATIO = 114 / 180;

/** Empfohlene Arbeitshöhe [min, max] in cm für eine Körpergröße (10–15 cm unter dem Ellenbogen). */
export function worktopRange(body) {
  const elbow = body * ELBOW_RATIO;
  return { elbow: Math.round(elbow), min: Math.round(elbow - 15), max: Math.round(elbow - 10), source: SOURCES.neffErgo };
}

export const RULES = {
  aisleTwo: { value: 120, label: "Gang für zwei Personen", source: SOURCES.gang },
  aisleOne: { value: 100, label: "Gang für eine Person", source: SOURCES.gang },
  passage: { value: 80, label: "Durchgang hinter Insel/Sitzplätzen (Planungsannahme)", source: null },
  islandBehindHob: { min: 23, label: "Platte hinter dem Kochfeld auf Insel/Halbinsel (NKBA 9 in)", source: SOURCES.nkba },
  islandBody: { min: 60, label: "Korpustiefe unter Kochfeld/Spüle auf der Insel (Normtiefe 60 cm, Planungsannahme)", source: null },
  triangleLeg: { min: 120, max: 270, label: "Seite des Arbeitsdreiecks", source: SOURCES.dreieck },
  triangleSum: { max: 790, label: "Summe Arbeitsdreieck", source: SOURCES.dreieck },
  prepZone: { min: 60, good: 90, label: "Arbeitsfläche zwischen Spüle und Kochfeld (Planungsannahme)", source: null },
  hobSide: { min: 30, label: "Abstellfläche neben dem Kochfeld (Planungsannahme)", source: null },
  hoodElectric: { value: 55, label: "Haube über Elektro-/Induktionskochfeld mindestens (Neff, je Haubentyp)", source: SOURCES.haube },
  hoodGas: { value: 65, label: "Haube über Gaskochfeld mindestens (Neff)", source: SOURCES.haube },
  hingeClear: { value: 4, label: "Passblende an der Wand, damit Türen ≥ 90° öffnen (Planungsannahme)", source: null },
  upGap: { min: 50, max: 60, label: "Hängeschrank über Arbeitsplatte (Planungsannahme)", source: null },
  // Nischenhöhe Geschirrspüler = Boden bis Unterkante Arbeitsplatte (Sockel + Korpus).
  // Beispielwerte eines Herstellers; andere Marken weichen ab → Gerät vor Bestellung prüfen.
  dwNiche: { min: 81.5, max: 87.5, label: "Nischenhöhe Geschirrspüler 60 cm, Standardgerät (Bosch-Beispiel)", source: SOURCES.gsStandard },
  dwNicheHigh: { min: 86.5, max: 92.5, label: "Nischenhöhe Geschirrspüler 60 cm, Gerät für hohe Nischen (Bosch-Beispiel)", source: SOURCES.gsHoch },
};

/** Gerätenischen (cm). Nur mit Quelle; sonst `source: null` → Maß fehlt. */
export const NICHES = {
  backofen: { h: 59, w: 56, d: 55, label: "Backofen-Nische 60", source: SOURCES.boschOfen },
  kompakt: { h: 45.5, w: 56, d: 55, label: "Kompaktgeräte-Nische 45", source: SOURCES.kompakt },
  kuehl178: { h: 178, w: 56, d: 55, label: "Kühlgeräte-Nische 178", source: SOURCES.liebherrNische },
  kuehl122: { h: 122, w: 56, d: 55, label: "Kühlgeräte-Nische 122", source: SOURCES.liebherrNische },
  weinkuehler: { h: null, w: null, d: null, label: "Weinkühler – Nischenmaß modellabhängig", source: null },
  sbsFrei: { h: null, w: null, d: null, label: "Side-by-Side freistehend – Gerätemaß modellabhängig", source: null },
};
