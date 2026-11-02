// src/lib/arbeitsweise/copy.js – deutsche Texte der Signature-Seite /de/arbeitsweise.
//
// Quelle: Marktresearch/digital/features/arbeitsweise-konzept.md §7 (Gastgeber-Ton,
// Sie-Form, keine Superlative, kein Ausrufezeichen, keine erfundenen Projekte,
// Zahlen oder Zitate). EN/FR/IT (R5-fix P2, gesamtwerk P1-2): übersetzt aus
// diesen Texten in ./copy-intl.js; arbeitsweiseCopy(locale) unten setzt Texte,
// Pfade und Links je Sprache zusammen (die Seite gibt es in allen vier
// Sprachen unter /<locale>/arbeitsweise).
//
// Stellen mit [Inhaber] im Konzept sind hier als `// INHABER:` markiert. Sie
// stehen in der vorsichtigen Fassung (keine Preise, kein pauschales Versprechen).
//
// Rein, ohne React und ohne Pakete: Server- und Client-Komponenten können es
// importieren, node --test ebenso.

import { INTL } from "./copy-intl.js";
import { homeCrumbLabel } from "../seo/breadcrumbs.js";
import { ROUTES } from "../../utils/routing.js";

export const PATH = "/arbeitsweise";
export const LOCALES = Object.freeze(["de", "en", "fr", "it"]);

export const META = {
  // AP-2 (SEO-Team A, 31.10.2026): Suchbegriff „Einrichtungsplanung“ vorn, ≤ 60 mit Suffix.
  title: "Einrichtungsplanung: Handzeichnung, Modell, 3D · Platzhirsch",
  description:
    "Wir sehen uns Ihre Räume vor Ort an, Harald Menghin zeichnet von Hand und baut ein Modell. Dann 3D-Planung und Rendering. Showroom in Lochau.",
  ogTitle: "Von der Handzeichnung zum Rendering",
};

// R5-fix P2: die Startseite heißt in der Brotkrume „Startseite“ (je Sprache
// homeCrumbLabel(), lib/seo/breadcrumbs.js) – auch im JSON-LD, nicht fest „Home“.
export const CRUMBS = [
  { label: homeCrumbLabel("de"), href: "/" },
  { label: "Das Haus", href: "/ueber-uns/platzhirsch" },
  { label: "Arbeitsweise" },
];

// Die sieben Schritte: Nummer, Name, Kapitel. `phase` = Zustand der Liniengrafik.
export const STEPS = [
  { n: 1, id: "schritt-01", name: "Kennenlernen", chapter: "vor-ort" },
  { n: 2, id: "schritt-02", name: "Vor Ort", chapter: "vor-ort" },
  { n: 3, id: "schritt-03", name: "Handzeichnung", chapter: "von-hand" },
  { n: 4, id: "schritt-04", name: "Modell", chapter: "von-hand" },
  { n: 5, id: "schritt-05", name: "3D-Planung", chapter: "strich-zum-raum" },
  { n: 6, id: "schritt-06", name: "Rendering", chapter: "strich-zum-raum" },
  { n: 7, id: "schritt-07", name: "Umsetzung", chapter: "wirklichkeit" },
];

export const TOTAL_STEPS = STEPS.length;

/** „Schritt 03 von 07“ (Overline, visuell). */
export const stationLabel = (n) => `Schritt ${String(n).padStart(2, "0")} von ${String(TOTAL_STEPS).padStart(2, "0")}`;
/** „Schritt 3: “ (nur für Screenreader, vor dem Schrittnamen in der H3). */
export const stepSrPrefix = (n) => `Schritt ${n}: `;

export const APPOINTMENT = {
  // ux P1-5 (Runde 2): gewählt wird nichts, es ist eine Anfrage mit Wunschtermin.
  label: "Termin anfragen",
  href: "/beratung",
  // INHABER (inhaber-offen A3): Dauer und „kostenlos“ sind nicht bestätigt –
  // bis dahin nur der Ort, keine Dauer, keine Preisangabe (Release-Rat recht P0-3, UWG).
  note: "Im Showroom mit Café oder bei Ihnen",
  noteClosing: "Dienstag bis Samstag, auf Wunsch bei Ihnen",
};

export const HERO = {
  overline: "Unsere Arbeitsweise",
  title: "Von der Handzeichnung zum Rendering.",
  // INHABER: „baut ein Modell“ = Inhaber-Aussage (USP-Doku), FAQ 1 ist daran angeglichen.
  lead:
    "Wir lernen Ihre Räume kennen, bevor wir planen. Harald Menghin zeichnet Ihr Konzept von Hand und baut ein Modell. Danach planen wir in 3D, und Sie sehen Ihren Raum fotorealistisch, bevor etwas bestellt wird.",
  stepsLink: "Die sieben Schritte ansehen",
  // R5-fix P2 (gesamtwerk P1-1, bewusst geändert): der Auftakt zeigt keine
  // Liniengrafik des Showrooms mit Bildzeile „Showroom Lochau“ mehr (sie
  // behauptete ein Foto und zog die Sessel nach), sondern ein Papierblatt mit
  // drei Wörtern und dem Satz der Wow-Coda (src/lib/wow/messages.js coda.text)
  // – reine Typografie, nichts davon ist Haralds Hand.
  sheet: { a: "Papier.", b: "Modell.", c: "Raum.", line: "Erst die Linie. Dann Ihr Raum." },
};

export const HALTUNG = {
  overline: "Was uns ausmacht",
  title: "Wir sind Designer. Wir nehmen uns Zeit.",
  paragraphs: [
    "Eine Einrichtung beginnt bei uns nicht im Katalog, sondern bei Ihnen: bei Ihren Räumen, Ihrem Licht und Ihrem Alltag.",
    "Darum kommen wir zu Ihnen. Wenn Ihr Projekt es braucht, bleiben wir auch ein, zwei Tage vor Ort.",
    "Was wir dort sehen, zeichnet Harald Menghin von Hand. Aus der Zeichnung wird ein Modell, aus dem Modell eine exakte 3D-Planung. So bleibt der erste Gedanke bis zum fertigen Raum erhalten.",
  ],
  // Drei Wörter als ruhige Klammer neben dem Text (Ort, Hand, Präzision = die drei Beweisarten, Konzept §2).
  pillars: [
    { word: "Ort", text: "Licht, Klima und Wege, bevor ein Möbel genannt wird." },
    { word: "Hand", text: "Zeichnung und Modell, an denen Sie mitarbeiten." },
    { word: "Präzision", text: "3D-Planung mit Maßen und ein Rendering vor der Bestellung." },
  ],
};

export const UEBERSICHT = {
  overline: "So entsteht Ihr Raum",
  // INHABER: „eine Ansprechperson“ wäre eine organisatorische Zusage – erst nach Bestätigung.
  title: "Sieben Schritte, vom Gespräch bis zum Einzug.",
  note: "Nicht jedes Projekt braucht jeden Schritt in voller Länge. Was sinnvoll ist, besprechen wir im ersten Termin.",
  // Einmal statt eines Etiketts an jeder Grafik (gesamtwerk P1-1 Runde 2): die Linien sind keine Handzeichnungen.
  // R5-USP: ohne Verneinung formuliert, aber eindeutig (nichts ist Haralds Hand).
  grafikNote: "Die Liniengrafiken auf dieser Seite sind digitale Schemata des Studios. Sie zeigen den Ablauf, nicht Haralds Zeichnungen.",
};

export const VOR_ORT = {
  id: "vor-ort",
  overline: "Schritt 01 und 02",
  title: "Zuerst schauen wir uns um.",
  steps: {
    1: "Wir sprechen im Showroom in Lochau, gern bei einem Kaffee im Café, oder bei Ihnen zu Hause. Sie erzählen, wie Sie wohnen und was sich ändern soll. Grundrisse, Fotos und Maße helfen, sind aber keine Voraussetzung.",
    2: "Ein Raum ist mehr als sein Grundriss. Wir sehen uns an, wie das Licht im Laufe des Tages wandert, wie sich der Raum im Sommer und im Winter anfühlt und welche Wege Sie täglich gehen. Wenn Ihr Projekt es braucht, bleiben wir auch ein, zwei Tage.",
  },
  listTitle: "Was wir vor Ort ansehen",
  list: [
    "Licht am Morgen, am Mittag und am Abend",
    "Klima, Sonne, Wind und Ausblick",
    "Wege, Türen und Durchgänge",
    "Was bleibt: Möbel, Bilder, Erinnerungsstücke",
    "Wie Sie leben: Kochen, Gäste, Kinder, Ruhe",
  ],
  cta: "Termin vor Ort anfragen",
  // INHABER: keine Preisangabe bis zur Entscheidung über die Vor-Ort-Tage.
  ctaNote: "Ob und in welchem Umfang wir vor Ort arbeiten, besprechen wir mit Ihnen vorab.",
  // N4 Bodensee-Licht: Wintermorgen am kürzesten Tag (neuland.md §5.6, Arbeitsweise Schritt 2).
  lichtHref: "/bodensee-licht?zeit=08:30&datum=2026-12-21",
  lichtLabel: "Wie das Licht im Winter fällt: Bodensee-Licht",
};

export const VON_HAND = {
  id: "von-hand",
  overline: "Schritt 03 und 04",
  title: "Der erste Entwurf entsteht auf Papier.",
  steps: {
    3: "Harald Menghin skizziert Grundriss, Perspektiven und Stimmungen von Hand. Auf Papier lassen sich Varianten schnell vergleichen, und Sie sehen früh, wohin die Reise geht. Die Zeichnung zeigt nicht jedes Detail, aber die Idee.",
    4: "Dann baut Harald ein Raummodell im Maßstab, so wie man es von Architekten und Bauträgern kennt. Sie können es anfassen, von allen Seiten ansehen und gemeinsam mit uns umstellen. Viele Fragen klären sich am Tisch schneller als am Bildschirm.",
  },
};

export const STRICH_ZUM_RAUM = {
  id: "strich-zum-raum",
  overline: "Schritt 05 und 06",
  title: "Dann wird es genau.",
  steps: {
    5: "Wir übertragen Zeichnung und Modell in eine digitale Planung mit exakten Maßen, den ausgewählten Produkten und Materialien. Jetzt zeigt sich, ob jede Tür aufgeht, jede Schublade Platz hat und jedes Sofa durch das Treppenhaus passt.",
    6: "Aus der Planung entsteht ein fotorealistisches Bild Ihres Raums. So sehen Sie, wie Stoffe, Holz und Licht zusammenwirken, bevor etwas bestellt wird. Ihre Rückmeldung geben Sie im Gespräch oder im Kundenportal, auch per Sprachnachricht.",
  },
  // Pflicht-Kennzeichnung unter jedem Rendering (Bibel §7.7, Konzept §10).
  renderingLabel: "Visualisierung aus der Planung, kein Foto.",
  // Rat 9,5 (B8, gesamtwerk M6): bis Haralds 3D-Screenshot da ist, zeigt
  // Schritt 05 die echte Ausgabe unseres eigenen Werkzeugs – klar als
  // Werkzeug-Beispiel beschriftet, nie als Kundenprojekt.
  beispiel: {
    caption: "Beispiel aus unserem Küchenplaner, kein Kundenprojekt.",
    alt: "Grundriss einer Küche in L-Form mit Maßketten in Zentimetern und dem Arbeitsdreieck zwischen Spüle, Kühlschrank und Kochfeld",
    link: "Küchenplaner ausprobieren",
  },
};

export const WIRKLICHKEIT = {
  id: "wirklichkeit",
  overline: "Schritt 07",
  title: "Bis Sie eingezogen sind.",
  text:
    "Wir bestellen, koordinieren die Lieferung und auf Wunsch die Montage. Wenn mehrere Gewerke beteiligt sind, stimmen wir die Termine ab. Und wir begleiten Ihr Projekt, bis alles steht, wie es gezeichnet war.",
  // INHABER: „bleiben Ihre Ansprechperson“ erst nach Bestätigung (feedback-1 P2-4).
};

export const HARALD = {
  id: "harald",
  overline: "Wer zeichnet",
  name: "Harald Menghin",
  // INHABER (inhaber-offen A4): Rollenbezeichnung bestätigen. Bis dahin keine
  // Rolle (null = Zeile entfällt), kein „Designer & Zeichner“.
  role: null,
  // INHABER: Text von Harald bestätigen lassen, am besten ersetzt durch ein echtes,
  // wörtliches Zitat mit Einwilligung („oft mehrere Varianten“ entfernt: unbelegt).
  text:
    "Harald denkt mit dem Stift. Bevor er am Bildschirm plant, zeichnet er. Dann baut er das Modell, an dem Sie mit uns gemeinsam weiterarbeiten. Bei uns begleitet er Ihr Projekt von der ersten Skizze bis zur Planung.",
  teamLink: { label: "Das ganze Team kennenlernen", href: "/ueber-uns/team" },
  // R5-USP (gesamtwerk P0-1, bewusst geändert): die Tafel „Leitsatz des
  // Studios“ (Rahmen in Porträtgröße, wirkte wie ein Platzhalter) ist weg.
  // Solange MEDIA.portrait null ist, trägt eine Textsektion: Name groß, drei
  // Tätigkeiten aus dem Ablauf, der Text. Kein Monogramm, kein Fake-Porträt.
  does: [
    { word: "Zeichnet", text: "Grundriss, Perspektiven und Stimmungen von Hand." },
    { word: "Baut", text: "Ein Raummodell im Maßstab, das Sie anfassen können." },
    { word: "Begleitet", text: "Gespräche bei Ihnen, im Showroom und am Modell." },
  ],
  doesLabel: "Was Harald Menghin in Ihrem Projekt macht",
  // Zitat nur aus HANDWERK.zitat (Haralds wörtlicher Satz mit Einwilligung).
  quoteLabel: "Harald Menghin",
};

// Handwerk konkret (feedback-2 P2-3b): NUR mit Haralds eigenen Angaben.
// Solange ein Feld null ist, erscheint dazu NICHTS auf der Seite (keine Beispielwerte).
// INHABER: Rückfrage an Harald (auch in den Teamleitungs-Rückfragen):
//   1. Mit welchem Werkzeug zeichnet er (Stift, Papier)?            → werkzeug
//   2. In welchem Maßstab und aus welchem Material baut er Modelle? → massstab, material
//   3. Wie lange dauert ein Modell typischerweise?                  → modellDauer
//   4. Ein wörtlicher Satz von ihm zu seiner Arbeit (mit Einwilligung)? → zitat
// Eintrag als kurzer Text in Haralds Worten, z. B. werkzeug: "…", zitat: "…".
export const HANDWERK = {
  werkzeug: null,
  massstab: null,
  material: null,
  modellDauer: null,
  zitat: null,
};

/** Rückfragen an Harald, die vor dem Livegang beantwortet sein sollen (nicht sichtbar). */
export const INHABER_RUECKFRAGEN = [
  "Mit welchem Werkzeug zeichnen Sie (Stift, Papier)?",
  "In welchem Maßstab und aus welchem Material bauen Sie die Modelle?",
  "Wie lange dauert ein Modell typischerweise?",
  "Ein wörtlicher Satz von Ihnen zu Ihrer Arbeit, mit Einwilligung zur Veröffentlichung?",
];

/** Bezeichnungen der Handwerkszeilen unter Schritt 03 und 04. */
export const HANDWERK_LABELS = {
  werkzeug: "Werkzeug",
  massstab: "Maßstab",
  material: "Material",
  modellDauer: "Dauer",
};

/**
 * Zeilen unter einem Schritt: Schritt 3 → Werkzeug, Schritt 4 → Maßstab, Material, Dauer.
 * Nur Felder mit echter Angabe; leer = nichts anzeigen.
 * @returns {{label: string, value: string}[]}
 */
export function handwerkLines(n, handwerk = HANDWERK, labels = HANDWERK_LABELS) {
  const keys = n === 3 ? ["werkzeug"] : n === 4 ? ["massstab", "material", "modellDauer"] : [];
  return keys
    .filter((k) => typeof handwerk[k] === "string" && handwerk[k].trim())
    .map((k) => ({ label: labels[k], value: handwerk[k].trim() }));
}

export const KETTE = {
  id: "ein-projekt",
  overline: "Vom ersten Strich zum fertigen Raum",
  title: "Ein Projekt, Schritt für Schritt.",
  text: "So sah ein Raum vor der Planung aus, so hat Harald ihn gezeichnet, so stand er im Modell, so in der Visualisierung und so heute.",
  groupLabel: "Station des Projekts wählen",
  stations: [
    { key: "vorher", label: "Vorher", kind: "Foto vor der Planung" },
    { key: "skizze", label: "Skizze", kind: "Handzeichnung von Harald Menghin" },
    { key: "modell", label: "Modell", kind: "Foto des Modells" },
    { key: "rendering", label: "Rendering", kind: "Rendering" },
    { key: "umsetzung", label: "Heute", kind: "Foto der Umsetzung" },
  ],
  factLabels: { region: "Region", typologie: "Typologie", flaeche: "Fläche", dauer: "Dauer" },
  consent: "Veröffentlicht mit Einverständnis der Bauherrschaft.",
  // Nur mit NEXT_PUBLIC_ARBEITSWEISE_PLATZHALTER=1 (Bildplanung): EIN Platzhalter statt fünf (P3-4).
  // Ohne Schalter erscheint das Kapitel erst mit der vollständigen echten Kette.
  placeholder: "Projekt-Kette folgt: Vorher · Skizze · Modell · Rendering · Heute",
};

export const ONLINE = {
  id: "online-starten",
  overline: "Online beginnen",
  title: "Online starten. Harald zeichnet weiter.",
  lead:
    "Sie möchten erst einmal selbst ausprobieren? Unsere Online-Planer sind ein guter Anfang. Wenn Sie danach mit uns planen, nimmt Harald Ihr Ergebnis mit an den Zeichentisch.",
  onlineLabel: "Online",
  studioLabel: "Danach im Studio",
  // `feature` = id in src/lib/features.js (Link nur, wenn der Planer freigeschaltet ist).
  cards: [
    {
      feature: "kuechenplaner",
      title: "Küchenplaner",
      online: "Grundriss, Zeilen und Geräte in 3D anlegen.",
      studio: "Harald zeichnet Ihre Küche von Hand weiter, wir prüfen Maße und Anschlüsse vor Ort.",
      link: "Küche online planen",
    },
    {
      feature: "sofaplaner",
      title: "Sofaplaner",
      online: "Modell, Module und Bezug zusammenstellen.",
      studio: "Probesitzen in Lochau, und wir zeichnen, wie das Sofa in Ihrem Raum steht.",
      link: "Sofa zusammenstellen",
    },
    {
      feature: "stilfinder",
      title: "Stil-Finder",
      online: "In wenigen Bildfragen Ihren Stil finden.",
      studio: "Ihr Ergebnis wird zur ersten Skizze für Ihre Räume.",
      link: "Stil finden",
    },
  ],
  note: "Die Online-Planer sind unverbindlich und ersetzen keine Planung vor Ort.",
};

export const FAQ = {
  id: "fragen",
  overline: "Fragen",
  title: "Fragen zur Arbeitsweise",
  items: [
    {
      q: "Zeichnet Harald wirklich jedes Konzept von Hand?",
      // INHABER: Umfang bestätigen (Konzept §12 Nr. 3). Angeglichen an die Inhaber-Aussage
      // „baut wie Bauträger Mini-Modelle“ (USP-Doku): Modell gehört zum Ablauf, der Umfang variiert.
      // Rückfrage: Gilt das Modell für jedes Projekt? Wenn nein, Hero/Haltung/Abschluss auf „wo es hilft“ ändern.
      a: "Ja, die Einrichtungskonzepte beginnen bei uns mit einer Handzeichnung, danach baut Harald ein Modell. Wie viele Skizzen und wie detailliert das Modell wird, hängt vom Projekt ab. Das besprechen wir im ersten Termin.",
    },
    {
      q: "Wozu ein Modell, wenn es 3D-Renderings gibt?",
      a: "Ein Modell kann man in die Hand nehmen und gemeinsam umstellen. Viele Fragen zu Proportionen und Wegen lassen sich so schneller klären. Die 3D-Planung folgt danach und macht alles maßgenau.",
    },
    {
      q: "Kommen Sie zu mir nach Hause?",
      // INHABER: Gebiet bestätigen.
      a: "Ja. Wir sehen uns Ihre Räume vor Ort an, in Vorarlberg, am Bodensee und in den Nachbarregionen. Wenn Ihr Projekt es braucht, bleiben wir auch ein, zwei Tage, um Licht, Klima und Abläufe kennenzulernen.",
    },
    {
      q: "Was kostet die Planung mit Handzeichnung und Modell?",
      // INHABER: Preismodell; bis dahin keine Zahl. RECHT: Kostenaussage vor Freigabe
      // ans Rechtspaket (Bindung, Verbraucherrecht) – vorsichtige Fassung (feedback-1 P2-4).
      a: "Das hängt vom Umfang ab. Im ersten Termin klären wir, was Ihr Projekt braucht. Die Kosten besprechen wir mit Ihnen, bevor wir weiterplanen.",
    },
    {
      q: "Wann sehe ich, wie mein Raum aussehen wird?",
      a: "Schon die Handzeichnung zeigt die Idee. Mit dem fotorealistischen Rendering sehen Sie Ihren Raum mit Materialien und Licht, bevor etwas bestellt wird.",
    },
    {
      q: "Kann ich Änderungen einbringen?",
      a: "Ja, in jedem Schritt. Am Modell, im Gespräch oder im Kundenportal, auch per Sprachnachricht.",
    },
    {
      q: "Ich habe schon im Küchen- oder Sofaplaner geplant. Fange ich dann von vorne an?",
      a: "Nein. Bringen Sie Ihr Ergebnis mit oder senden Sie uns den Link. Wir planen von dort aus weiter, und Harald zeichnet Ihr Konzept von Hand weiter.",
    },
    {
      q: "Planen Sie auch Hotels, Ferienwohnungen oder Boote?",
      a: "Ja. Der Ablauf ist derselbe, vom Termin vor Ort bis zur Umsetzung. Für die Besonderheiten gibt es eigene Seiten: Yacht-Interieur, Outdoor.",
      // Wörter im Antworttext, die verlinkt werden (feedback-2 P3-8). JSON-LD behält den reinen Text.
      links: [
        { label: "Yacht-Interieur", href: "/yacht-interior" },
        { label: "Outdoor", href: "/outdoor-gartenplanung" },
      ],
    },
  ],
};

export const ABSCHLUSS = {
  id: "abschluss",
  line: "Designs, die leben.",
  title: "Erzählen Sie uns von Ihren Räumen.",
  text: "Wir hören zu, sehen sie uns an und beginnen mit dem ersten Strich.",
  trustLabel: "So arbeiten wir",
  trust: ["Termin vor Ort, wenn Ihr Projekt es braucht", "Handzeichnung und Modell vor der 3D-Planung", "Ihr Raum als Rendering, bevor etwas bestellt wird"],
};

// Kleintexte
export const UI = {
  placeholderOverline: "Bild folgt",
  // Art des fehlenden Materials je Slot (Konzept §7 Kleintexte).
  placeholderKind: {
    hero: "Harald am Zeichentisch",
    kennenlernen: "Gespräch im Showroom, Schritt 01",
    vorOrt: "Termin vor Ort, Schritt 02",
    handzeichnung: "Handzeichnung von Harald Menghin, Schritt 03",
    modell: "Foto des Modells, Schritt 04",
    planung3d: "3D-Planung, Schritt 05",
    rendering: "Rendering, Schritt 06",
    portal: "Kundenportal, Schritt 06",
    umsetzung: "Foto der Umsetzung, Schritt 07",
    portrait: "Porträt Harald Menghin",
  },
};

// llms.txt-Zeile (Vorschlag für src/lib/seo/llms.js, Konzept §8).
export const LLMS_LINE =
  "Arbeitsweise von Platzhirsch: Termin vor Ort, Handzeichnung und Raummodell von Harald Menghin, danach 3D-Planung und fotorealistisches Rendering vor der Bestellung.";

// ------------------------------------------------ Mehrsprachig (R5-fix P2)

const DE_COPY = {
  META,
  CRUMBS,
  STEPS,
  APPOINTMENT,
  HERO,
  HALTUNG,
  UEBERSICHT,
  VOR_ORT,
  VON_HAND,
  STRICH_ZUM_RAUM,
  WIRKLICHKEIT,
  HARALD,
  HANDWERK_LABELS,
  KETTE,
  ONLINE,
  FAQ,
  ABSCHLUSS,
  UI,
};

/** Tiefe Zusammenführung: Texte aus `over`, Struktur (Ids, Pfade) aus `base`; Arrays je Index. */
function merge(base, over) {
  if (over === undefined) return base;
  if (Array.isArray(base)) return base.map((b, i) => merge(b, Array.isArray(over) ? over[i] : undefined));
  if (base && typeof base === "object" && over && typeof over === "object") {
    const out = { ...base };
    for (const [k, v] of Object.entries(over)) out[k] = k in base ? merge(base[k], v) : v;
    return out;
  }
  return over;
}

const pad = (n) => String(n).padStart(2, "0");

/**
 * Alle Texte und Ziele der Seite in `locale` (fällt auf Deutsch zurück).
 * Ziele: Termin, Team und „Das Haus“ in der Besuchersprache (ROUTES); Seiten,
 * die es nur auf Deutsch gibt (Planer, Bodensee-Licht, Yacht, Outdoor), mit
 * `locale: "de"` – sie sind im Linktext gekennzeichnet (copy-intl.js).
 */
export function arbeitsweiseCopy(locale = "de") {
  const l = LOCALES.includes(locale) ? locale : "de";
  if (l === "de") {
    return { ...DE_COPY, locale: "de", stepSrPrefix, stationLabel, germanLinkLocale: undefined };
  }
  const t = INTL[l];
  const de = { ...DE_COPY };
  const c = {};
  for (const key of Object.keys(DE_COPY)) {
    if (key === "STEPS" || key === "CRUMBS") continue;
    c[key] = merge(de[key], t[key]);
  }
  c.STEPS = STEPS.map((s, i) => ({ ...s, name: t.STEPS[i] }));
  c.CRUMBS = [
    { label: homeCrumbLabel(l), href: "/" },
    { label: t.crumbs.house, href: ROUTES.platzhirsch[l] },
    { label: t.crumbs.page },
  ];
  c.APPOINTMENT = { ...c.APPOINTMENT, href: ROUTES.beratung[l] };
  c.HARALD = { ...c.HARALD, teamLink: { label: t.HARALD.teamLabel, href: ROUTES.team[l] } };
  delete c.HARALD.teamLabel;
  c.FAQ = {
    ...c.FAQ,
    items: c.FAQ.items.map((item, i) => (FAQ.items[i].links ? { ...item, links: FAQ.items[i].links.map((link, j) => ({ ...link, label: t.FAQ.items[i].links[j].label, locale: "de" })) } : item)),
  };
  return {
    ...c,
    locale: l,
    // Ziele, die es nur auf Deutsch gibt (Planer, Bodensee-Licht): locale + hrefLang "de"
    germanLinkLocale: "de",
    stepSrPrefix: (n) => `${t.stepWord} ${n}: `,
    stationLabel: (n) => `${t.stepWord} ${pad(n)} / ${pad(TOTAL_STEPS)}`,
  };
}
