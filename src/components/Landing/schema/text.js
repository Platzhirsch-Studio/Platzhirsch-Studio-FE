// Texte der Studio-Grafiken (Rat 9,5 B7). Bis zur Übernahme in src/messages
// (Vorschlag: Marktresearch/digital/features/rat95-t3-messages.json,
// Namespace `landing.schema`) gilt diese Tabelle. Reines Modul (node --test).

export const SCHEMA_TEXT = Object.freeze({
  de: {
    caption: "Schema des Studios",
    labels: { sample: "Musterzimmer", series: "Serie", layer: "Planungsdaten · Möbel", triangle: "Arbeitsdreieck", table: "Ihr Platz", board: "Ihre Ideen" },
  },
  en: {
    caption: "Studio diagram",
    labels: { sample: "Sample room", series: "Series", layer: "Planning data · furniture", triangle: "Work triangle", table: "Your seat", board: "Your ideas" },
  },
  fr: {
    caption: "Schéma du studio",
    labels: { sample: "Chambre témoin", series: "Série", layer: "Données de plan · mobilier", triangle: "Triangle d’activité", table: "Votre place", board: "Vos idées" },
  },
  it: {
    caption: "Schema dello studio",
    labels: { sample: "Camera campione", series: "Serie", layer: "Dati di progetto · arredi", triangle: "Triangolo di lavoro", table: "Il vostro posto", board: "Le vostre idee" },
  },
});

/** Texte einer Sprache; swiss = de-CH ohne ß. */
export function schemaText(locale = "de", swiss = false) {
  const t = SCHEMA_TEXT[locale] || SCHEMA_TEXT.de;
  if (!swiss) return t;
  const ss = (v) => v.replace(/ß/g, "ss");
  return { caption: ss(t.caption), labels: Object.fromEntries(Object.entries(t.labels).map(([k, v]) => [k, ss(v)])) };
}

/**
 * QM R1 (01.11.2026): „Schema des Studios“ passte nicht zu Karte, Hausschnitt
 * oder Hotelflur. Jede Grafik sagt jetzt, was sie zeigt – weiterhin
 * erkennbar als Schema bzw. Kartenskizze (kein Foto, kein Projekt). Termin und
 * Ideenboard behalten die allgemeine Beschriftung (caption). {ort} = Ortsname.
 */
export const KIND_CAPTION = Object.freeze({
  de: {
    kueche: "Schema einer Küche: Grundriss mit Arbeitsdreieck",
    hotel: "Schema eines Hotelflurs: Musterzimmer und Serie",
    architekten: "Schema eines Hauses: Planungsdaten und Möbel je Ebene",
    stadt: "Kartenskizze: {ort} und unser Studio in Lochau (Luftlinie)",
  },
  en: {
    kueche: "Kitchen diagram: floor plan with work triangle",
    hotel: "Hotel corridor diagram: sample room and series",
    architekten: "House diagram: planning data and furniture per floor",
    stadt: "Map sketch: {ort} and our studio in Lochau (straight line)",
  },
  fr: {
    kueche: "Schéma d’une cuisine : plan avec triangle d’activité",
    hotel: "Schéma d’un couloir d’hôtel : chambre témoin et série",
    architekten: "Schéma d’une maison : données de plan et mobilier par niveau",
    stadt: "Croquis : {ort} et notre studio à Lochau (à vol d’oiseau)",
  },
  it: {
    kueche: "Schema di una cucina: pianta con triangolo di lavoro",
    hotel: "Schema di un corridoio d’hotel: camera campione e serie",
    architekten: "Schema di una casa: dati di progetto e arredi per piano",
    stadt: "Schizzo: {ort} e il nostro studio a Lochau (in linea d’aria)",
  },
});

/** Beschriftung einer Grafik je Art; ohne Eintrag die allgemeine caption. */
export function kindCaption(kind, locale = "de", swiss = false, ort = "") {
  const table = KIND_CAPTION[locale] || KIND_CAPTION.de;
  const raw = table[kind] ? table[kind].replace("{ort}", ort) : schemaText(locale, swiss).caption;
  return swiss ? raw.replace(/ß/g, "ss") : raw;
}
