// src/lib/features.js – Feature-Schalter der digitalen Werkzeuge und Welten.
//
// Inhaber-Entscheidung Nr. 9 (28.10.2026): keine separate Labs-Welt. Alle
// Features sind fester Teil der Seite, mit eigener URL außerhalb von /labs
// (alte URLs leiten per 308 um, src/lib/seo/labsMoves.cjs), im Menü
// „Planen & Erleben“, auf der Startseite und auf der Übersicht /de/leistungen.
//
// Ein Schalter je Feature, STANDARD AN (auch im Produktions-Build):
//   NEXT_PUBLIC_FEATURE_<NAME>="0"   aus (Menü, Startseite, Übersicht)
//   alles andere / nicht gesetzt     an
// Der Schalter entscheidet nur über die Verlinkung. Die Seite selbst bleibt
// erreichbar; sie hat ihre eigenen Regeln (z. B. /showroom: 404 ohne echte
// Aufnahme, Ezarri: EZARRI_PUBLIC in src/lib/ezarri/config.js).
//
// NEXT_PUBLIC_* setzt Next.js beim Build nur ein, wenn der Name WÖRTLICH als
// `process.env.NEXT_PUBLIC_…` im Code steht (node_modules/next/dist/docs/01-app/
// 02-guides/environment-variables.md, „dynamic lookups will not be inlined“).
// Deshalb steht jeder Schalter unten einzeln ausgeschrieben, nie über
// process.env[name]. Werte werden beim Build eingefroren: Abschalten heißt
// Variable setzen und neu bauen.
//
// Rein, ohne React und ohne Pakete: Server- und Client-Komponenten können es
// importieren, node --test ebenso. Doku: Marktresearch/digital/teamleiter/integration.md

// Sofaplaner-Texte hängen an der Datenquelle (R8, recht P0-1/ux P1-4): ohne
// Minotti-Zustimmung kein Markenname, keine „echten Elemente“.
import { SOURCE_COPY } from "./sofaplaner/consent.js";
// Showroom-Rundgang: nur mit echter, freigegebener Aufnahme verlinkt (ux P0-1,
// Runde 4; QM Inhaber-Entscheidung Nr. 7, 02.11.: eine Bedingung showroomSichtbar())
// – auch im Dev-Server, die Testszene wird nirgends verlinkt.
import { showroomSichtbar } from "./showroom/config.js";

/** Rohwerte der Schalter, je Feature wörtlich gelesen (siehe oben). */
const RAW = {
  kuechenplaner: process.env.NEXT_PUBLIC_FEATURE_KUECHENPLANER,
  sofaplaner: process.env.NEXT_PUBLIC_FEATURE_SOFAPLANER,
  arviewer: process.env.NEXT_PUBLIC_FEATURE_ARVIEWER,
  stilfinder: process.env.NEXT_PUBLIC_FEATURE_STILFINDER,
  licht: process.env.NEXT_PUBLIC_FEATURE_LICHT,
  dreilaender: process.env.NEXT_PUBLIC_FEATURE_DREILAENDER,
  showroom: process.env.NEXT_PUBLIC_FEATURE_SHOWROOM,
  concierge: process.env.NEXT_PUBLIC_FEATURE_CONCIERGE,
  upload: process.env.NEXT_PUBLIC_FEATURE_UPLOAD,
  portal: process.env.NEXT_PUBLIC_FEATURE_PORTAL,
  agent: process.env.NEXT_PUBLIC_FEATURE_AGENT,
  yacht: process.env.NEXT_PUBLIC_FEATURE_YACHT,
  outdoor: process.env.NEXT_PUBLIC_FEATURE_OUTDOOR,
  ezarri: process.env.NEXT_PUBLIC_FEATURE_EZARRI,
  pflege: process.env.NEXT_PUBLIC_FEATURE_PFLEGE,
};

const NODE_ENV = process.env.NODE_ENV;

/**
 * Regel eines Schalters: nur "0" schaltet aus, sonst an – in jeder Umgebung
 * (Inhaber-Entscheidung Nr. 9: standardmäßig AN). `nodeEnv` bleibt als
 * Parameter, damit Tests belegen, dass die Umgebung keine Rolle spielt.
 * @param {string|undefined} raw
 * @param {string|undefined} [_nodeEnv]
 */
export function flagOn(raw, _nodeEnv = NODE_ENV) {
  const v = typeof raw === "string" ? raw.trim() : raw;
  return v !== "0";
}

// Gruppen der Übersicht und des Menüs.
export const FEATURE_GROUPS = [
  { id: "planen", label: "Online planen", intro: "Werkzeuge, mit denen Sie Ihr Vorhaben vorbereiten. Online starten – Harald Menghin zeichnet Ihr Konzept anschließend von Hand." },
  { id: "erleben", label: "Erleben", intro: "Möbel, Räume und Welten ansehen, bevor sie bei Ihnen stehen." },
  { id: "service", label: "Service", intro: "Kurze Wege zwischen Ihnen und dem Team in Lochau." },
  // Runde 5 (ux P1-4): „Für KI-Assistenten (MCP)“ ist kein Kundenservice –
  // eigener, kleiner Bereich am Ende der Übersicht (LabsHub.js).
  { id: "fachleute", label: "Für Fachleute", intro: "Für KI-Assistenten und Entwickler: Katalog, Showroom und Arbeitsweise maschinenlesbar." },
];

// Status für die interne Doku (nicht mehr als Plakette sichtbar, Usability B4:
// „Prototyp“ liest ein Kunde als „unfertig“).
//   live      öffentliche, indexierte Seite
//   vorschau  erreichbar, aber noindex (Rechtliches/Freigabe offen, dokumentiert)
export const STATUS = {
  live: { label: "Öffentliche Seite", tone: "live" },
  vorschau: { label: "Online, nicht indexiert", tone: "online" },
};

/**
 * Alle Features. hrefs ohne Locale (next-intl Link setzt sie); die Seiten
 * gibt es auf Deutsch, der Showroom-Rundgang in allen vier Sprachen
 * (`locales`). `image`: eigene Ansicht aus dem jeweiligen Werkzeug
 * (Bildschirmfoto, kein Herstellerbild), Quellen in der Doku; ohne Bild
 * zeichnet `visual` eine eigene Grafik (measure, palette, contours, mosaic,
 * sun, plan, nodes). `image.credit`: Quellenangabe unter dem Bild
 * (freigegebene Herstellerbilder). `nav`: kurzer Menütext.
 */
export const FEATURES = [
  {
    id: "kuechenplaner",
    env: "NEXT_PUBLIC_FEATURE_KUECHENPLANER",
    group: "planen",
    title: "Küchenplaner",
    nav: "Küchenplaner online",
    href: "/kuechenplaner",
    locales: ["en", "fr", "it"], // Sprach-Integration 01.11.2026
    status: "live",
    summary: "Küchenzeile, L- oder U-Form im Grundriss legen, Fronten und Arbeitsplatten wählen und das Ergebnis in 3D ansehen.",
    note: "Preise auf Anfrage. Die Feinplanung machen wir persönlich mit Ihnen.",
    image: { src: "/bilder/leistungen/kuechenplaner.webp", alt: "Küchenplaner: L-Küche im Grundriss mit Modulen und Maßen" },
  },
  {
    id: "sofaplaner",
    env: "NEXT_PUBLIC_FEATURE_SOFAPLANER",
    group: "planen",
    title: SOURCE_COPY.seoName,
    nav: "Sofa zusammenstellen",
    href: "/sofaplaner",
    // Welle 2 (Nr. 13): auch auf Englisch; seit 01.11.2026 auch FR/IT.
    locales: ["en", "fr", "it"],
    status: "live",
    summary: SOURCE_COPY.summary,
    image: { src: "/bilder/leistungen/sofaplaner.webp", alt: "Sofaplaner: Ecksofa aus drei Elementen im Grundriss eines Raums mit Maßen" },
  },
  {
    id: "stilfinder",
    env: "NEXT_PUBLIC_FEATURE_STILFINDER",
    group: "planen",
    title: "Stil-Finder",
    nav: "Stil-Finder",
    href: "/stil-finder",
    locales: ["en", "fr", "it"], // Sprach-Integration 01.11.2026
    status: "live",
    summary: "Sechs Bildfragen zu Raum, Material, Farbe und Licht – am Ende Ihr Stilprofil mit Farbpalette, Marken und Moodboard.",
    image: null,
    visual: "palette",
  },
  {
    id: "licht",
    env: "NEXT_PUBLIC_FEATURE_LICHT",
    group: "planen",
    title: "Bodensee-Licht",
    nav: "Bodensee-Licht",
    href: "/bodensee-licht",
    status: "live",
    summary: "Der echte Sonnenstand für Ihren Ort, Ihre Fensterrichtung, Datum und Uhrzeit – in Küche und am Pool, mit Lichtblatt zum Ausdrucken.",
    image: null,
    visual: "sun",
  },
  {
    id: "arviewer",
    env: "NEXT_PUBLIC_FEATURE_ARVIEWER",
    group: "erleben",
    title: "3D & AR ansehen",
    nav: "3D & AR ansehen",
    href: "/3d-ansicht",
    status: "live",
    summary: "Möbel in 3D drehen, Maße einblenden und per Handy in Originalgröße in den eigenen Raum stellen.",
    note: "Ausgewählte Stücke aus dem Sortiment.",
    image: null,
    visual: "measure",
  },
  {
    id: "showroom",
    env: "NEXT_PUBLIC_FEATURE_SHOWROOM",
    group: "erleben",
    title: "Showroom-Rundgang",
    nav: "Showroom-Rundgang",
    href: "/showroom",
    // Nur verlinkt, wenn echtes Material da ist (showroomSichtbar(), QM Inhaber-
    // Entscheidung Nr. 7, 02.11. – nie die Testszene), siehe shellNav.js.
    requires: "showroom",
    locales: ["de", "en", "fr", "it"],
    status: "vorschau",
    summary: "Die Ausstellung in Lochau als Rundgang: Stationen ansehen, Stücke anklicken, merken oder einen Termin anfragen.",
    image: null,
    visual: "plan",
  },
  {
    id: "yacht",
    env: "NEXT_PUBLIC_FEATURE_YACHT",
    group: "erleben",
    title: "Yacht-Interieur",
    nav: "Yacht-Interieur",
    href: "/yacht-interior",
    locales: ["en", "fr", "it"], // Welle 2 (Nr. 13) EN; seit 01.11.2026 auch FR/IT
    status: "live",
    summary: "Einrichtung für Boote und Bootshäuser am Bodensee – mit Konzeptwelten und dem Boot in 3D.",
    image: { src: "/bilder/leistungen/yacht.webp", alt: "Yacht-Interieur: gezeichnetes Boot auf dem Abendsee" },
  },
  {
    id: "outdoor",
    env: "NEXT_PUBLIC_FEATURE_OUTDOOR",
    group: "erleben",
    title: "Outdoor & Garten",
    nav: "Outdoor- & Gartenplanung",
    href: "/outdoor-gartenplanung",
    locales: ["en", "fr", "it"], // Sprach-Integration 01.11.2026
    status: "vorschau", // noindex bis zur Rechtsprüfung (GewO, outdoor-gartenplanung/page.js)
    summary: "Ihr Garten als Wohnraum: Outdoor-Konzept mit Möbeln, Beschattung und Licht, abgestimmt mit befugten Fachbetrieben für Gartenbau, Pool und Technik.",
    image: null,
    visual: "contours",
  },
  {
    id: "ezarri",
    env: "NEXT_PUBLIC_FEATURE_EZARRI",
    group: "erleben",
    title: "Ezarri Glasmosaik",
    nav: "Ezarri Glasmosaik",
    href: "/ezarri",
    // Führender Schalter: EZARRI_PUBLIC (src/lib/ezarri/config.js,
    // Gesamturteil W10). Ist er aus, erscheint Ezarri nirgends verlinkt.
    requires: "ezarri",
    locales: ["en", "fr", "it"], // Welle 2 (Nr. 13) EN; Welt seit 01.11.2026 auch FR/IT (EZARRI_WELT_LOCALES)
    status: "live",
    summary: "Glasmosaik von Ezarri für Bad, Pool und Wellness: Sortiment, Fliesen-Übersicht und Konfigurator.",
    image: {
      src: "/ezarri/gemma/anw-celestite-25-gemma-mosaic-pool-ezarri-1-1600.webp",
      alt: "Pool mit Ezarri Celestite, Glasmosaik in Türkis",
      credit: "Bild: Ezarri, ezarri.com",
    },
  },
  {
    id: "dreilaender",
    env: "NEXT_PUBLIC_FEATURE_DREILAENDER",
    group: "service",
    title: "Dreiländer-Rechner",
    nav: "Dreiländer-Rechner",
    href: "/dreilaender-rechner",
    locales: ["en", "fr", "it"], // Sprach-Integration 01.11.2026
    status: "live",
    summary: "Karte des Dreiländerecks mit Fahrzeiten und ein Richtwert-Rechner für Kauf aus der Schweiz, Liechtenstein und Deutschland.",
    note: "Richtwert, keine Steuerberatung.",
    image: { src: "/bilder/leistungen/dreilaender.webp", alt: "Dreiländer-Rechner: Karte mit Lochau und Orten in vier Ländern" },
  },
  {
    id: "concierge",
    env: "NEXT_PUBLIC_FEATURE_CONCIERGE",
    group: "service",
    title: "KI-Concierge",
    nav: "KI-Concierge",
    href: "/concierge",
    status: "live",
    summary: "Fragen zu Sortiment, Marken und Showroom stellen – eine KI antwortet und übergibt auf Wunsch an einen Menschen.",
    note: "Sie schreiben mit einer KI. Keine verbindlichen Preise oder Lieferzusagen.",
    // Runde 4 (ux P0-1): Bildschirmfoto der echten Oberfläche, ohne Mock-Plakette.
    image: { src: "/bilder/leistungen/concierge.webp", alt: "KI-Concierge: Beispielgespräch zu einem Sofa, als KI gekennzeichnet" },
  },
  {
    id: "upload",
    env: "NEXT_PUBLIC_FEATURE_UPLOAD",
    group: "service",
    title: "Fotos per Handy senden",
    nav: "Fotos per Handy senden",
    href: "/upload",
    status: "vorschau", // Service-Seite, bleibt noindex (SEO-Gutachten: Upload, Portal, Druck)
    summary: "Nach Ihrer Anfrage QR-Code scannen und Fotos, Raum-Video oder Pläne direkt vom Handy an uns senden.",
    // Runde 5 (ux P1-4): Piktogramm statt Demo-Screenshot.
    image: null,
    visual: "phone",
  },
  {
    id: "portal",
    env: "NEXT_PUBLIC_FEATURE_PORTAL",
    group: "service",
    title: "Mein Platzhirsch",
    nav: "Mein Platzhirsch",
    href: "/portal",
    // Wie im Menü (shellNav.js, seo P2-9): direkt zur Anmeldung, ohne 307.
    hubHref: "/portal/login",
    status: "vorschau", // Login-Bereich, noindex
    summary: "Ihr Projekt an einem Ort: Termine, Dokumente, Nachrichten, Ihr Raum in 3D und die Gewerke – Anmeldung per Link, ohne Passwort.",
    // Runde 5 (ux P1-4): Piktogramm statt Demo-Screenshot.
    image: null,
    visual: "folder",
  },
  {
    // Service Nr. 4 (Inhaber 29.10.2026): Pflege-Service und Pflege-Abo.
    // Seite DE und EN (FR/IT 404, src/proxy.js); noindex, solange
    // PFLEGE_CONFIG.indexieren false ist (Preise, Einsatzgebiet, Recht offen).
    id: "pflege",
    env: "NEXT_PUBLIC_FEATURE_PFLEGE",
    group: "service",
    title: "Pflege-Service",
    nav: "Pflege-Service",
    href: "/pflege-service",
    locales: ["en", "fr", "it"], // seit 01.11.2026 auch FR/IT
    status: "vorschau",
    summary: "Leder, Stoff und Holz: ein Pflegetermin bei Ihnen zu Hause, einmalig oder jährlich als Abo. Preise auf Anfrage.",
    image: null,
    visual: "care",
  },
  {
    id: "agent",
    env: "NEXT_PUBLIC_FEATURE_AGENT",
    group: "fachleute",
    title: "Für KI-Assistenten",
    nav: "Für KI-Assistenten",
    href: "/ki-assistenten",
    status: "live",
    summary: "Katalog, Showroom und Arbeitsweise für KI-Assistenten lesbar (MCP) – mit Terminwunsch, den Sie selbst bestätigen.",
    image: null,
    visual: "nodes",
  },
];

/** Ist das Feature freigeschaltet? */
export function isFeatureOn(id, { raw = RAW, nodeEnv = NODE_ENV } = {}) {
  return flagOn(raw[id], nodeEnv);
}

/**
 * Freigeschaltete Features in fester Reihenfolge. `available` sagt für
 * Features mit `requires`, ob die Zielseite ausgeliefert wird (Showroom,
 * Ezarri); ohne Angabe gelten sie als verfügbar.
 */
export function enabledFeatures({ raw = RAW, nodeEnv = NODE_ENV, available = {} } = {}) {
  return FEATURES.filter((f) => flagOn(raw[f.id], nodeEnv) && (!f.requires || available[f.requires] !== false));
}

/** Features für eine Sprache (Deutsch: alle; sonst nur mehrsprachige Seiten). */
export function featuresFor(locale, list) {
  return list.filter((f) => locale === "de" || f.locales?.includes(locale));
}

/** Features nach Gruppen, leere Gruppen fallen weg. */
export function groupFeatures(list) {
  return FEATURE_GROUPS.map((g) => ({ ...g, features: list.filter((f) => f.group === g.id) })).filter((g) => g.features.length);
}

/**
 * Desktop-Spalten je Gruppe: 3, außer in 3 Spalten bliebe eine Karte allein
 * in der letzten Zeile und 2 Spalten gehen glatt auf (4, 10 …), dann 2.
 * Ganze Klassennamen, damit Tailwind sie findet (LabsHub.js).
 * @param {number} n
 */
export function desktopCols(n) {
  // R8 (ux P2): 5 Karten ließen im 3er-Raster rechts unten eine Lücke →
  // 6er-Raster mit 2 + 3 Karten (desktopSpan).
  if (n === 5) return "lg:grid-cols-6";
  return n > 3 && n % 3 === 1 && n % 2 === 0 ? "lg:grid-cols-2" : "lg:grid-cols-3";
}

/**
 * Spaltenbreite einer Karte im 6er-Raster (nur bei 5 Karten): die ersten zwei
 * je halbe Breite, die drei folgenden je ein Drittel – keine Lücke.
 * @param {number} n  Karten der Gruppe
 * @param {number} i  Index der Karte
 */
export function desktopSpan(n, i) {
  if (n !== 5) return "";
  return i < 2 ? "lg:col-span-3" : "lg:col-span-2";
}

/**
 * Karten der Übersicht /de/leistungen und der Startseite. Runde 5 (ux P1-4,
 * Inhaber-Entscheidung Nr. 9): dieselben Einträge wie das Menü „Planen &
 * Erleben“ (src/components/Navbar/shellNav.js) – also auch Garten- und
 * Terrassenplanung, „Fotos per Handy senden“ und das Kundenportal (über
 * `hubHref` direkt zur Anmeldung, ohne 307). Der Showroom-Rundgang nur mit
 * echter Aufnahme (auch im Dev-Server – die Testszene wird nie verlinkt), der
 * KI-Concierge nur, wenn er mit echter KI läuft (conciergeLive() in
 * src/lib/concierge/config.js – der Aufrufer übergibt es, diese Datei bleibt
 * ohne Server-Code). Seiten mit status "vorschau" sind noindex,follow: ein
 * Link dorthin ist eine Navigationsentscheidung (wie im Menü), kein SEO-Fehler.
 * @param {Array} list  freigeschaltete Features (navFeatures())
 * @param {{recording?: boolean, concierge?: boolean}} [opts]
 */
export const HUB_ALSO = Object.freeze(["outdoor", "upload", "portal", "pflege"]);
// QM Inhaber-Entscheidung Nr. 7, 02.11.: `recording` = showroomSichtbar() (eine Bedingung für alle Showroom-Links).
export function hubFeatures(list, { recording = showroomSichtbar(), concierge = false } = {}) {
  return list
    .filter((f) => {
      if (f.id === "showroom") return recording;
      if (f.id === "concierge") return concierge;
      return f.status === "live" || HUB_ALSO.includes(f.id);
    })
    .map((f) => (f.hubHref ? { ...f, href: f.hubHref } : f));
}

/** Schalter-Hinweise auf der Übersicht: nie mehr (Usability B4, keine Entwicklersprache vor Kunden). */
export const SHOW_FLAG_HINTS = false;
