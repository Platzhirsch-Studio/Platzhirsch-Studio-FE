// src/lib/ezarri/copy.js – alle deutschen Texte der Ezarri-Welt (Team A).
//
// Eigene Texte von Platzhirsch. Fakten stammen aus Ezarris Website und
// Datenblättern (Stand 28.10.2026) und stehen als Herstellerangabe da
// („laut Ezarri“). Ezarris eigene Formulierungen werden nicht übernommen.
// Stimme laut Design-Bibel: Sie-Form, Fakten statt Adjektive, keine
// Superlative, kein „Luxus“, keine Preise (nur „auf Anfrage“).
//
// Händler-Aussage: Dieser Text enthält KEINE. Ob „Ezarri-Vertragshändler“
// sichtbar wird, entscheiden zwei Dinge zusammen (dealerLine()):
//   1. EZARRI_PUBLIC (config.js, Inhaber-OK zum Deploy) und
//   2. ein Eintrag für "ezarri" im Claim-Register src/lib/legal/claims.js
//      (Teamleiter, Konzept §1.3/§7.5). Der Satz selbst steht dann dort –
//      an der einen Stelle, die Lint und check:claims kennen.
// Vorschlag für den Register-Text: Marktresearch/digital/features/ezarri-welt.md.
//
// Rein: keine Pakete, keine "@/"-Aliase. Server, Client und node --test.
import { CLAIM_REGISTER, isVerifiedDealerBrand } from "../legal/claims.js";
import { ezarriDealerClaimVisible } from "./config.js";

/** Neutrale Aussage, solange keine Händler-Aussage gezeigt werden darf. */
export const NEUTRAL_CLAIM = "Glasmosaik von Ezarri – Beratung und Muster in Lochau";

/**
 * Händler-Aussage aus dem Claim-Register (nur wenn belegt UND freigeschaltet), sonst null.
 * @param {boolean} [isPublic]
 */
export function dealerClaim(isPublic) {
  const visible = isPublic === undefined ? ezarriDealerClaimVisible() : ezarriDealerClaimVisible(isPublic);
  if (!visible || !isVerifiedDealerBrand("ezarri")) return null;
  return CLAIM_REGISTER.find((c) => c.brandSlug === "ezarri" && c.claim === "dealer")?.text ?? null;
}

/**
 * Titel-Zusatz aus der belegten Händler-Aussage (R2 seo P2-1), z. B. für den
 * Hub-Title; das Wort kommt aus dem Claim-Register, nicht aus diesem Code.
 * null, solange die Aussage nicht sichtbar sein darf.
 */
export function dealerTitleWord(isPublic) {
  return dealerClaim(isPublic)?.match(/ist (\S+) von Ezarri/)?.[1] ?? null;
}

/** Zeile im Markenkopf: Händler-Aussage oder neutrale Aussage. */
export function dealerLine(isPublic) {
  return dealerClaim(isPublic) ?? NEUTRAL_CLAIM;
}

export const STUDIO = Object.freeze({
  ort: "Showroom-Café, Landstraße 11, 6911 Lochau",
  muster: "Muster bestellen wir für Ihren Termin.",
  // R8 (gesamtwerk P2-4, Inhaber-Entscheidung Nr. 3): keine pauschale Länderaufzählung –
  // Lieferung „auf Wunsch“ (keine Verlege-Zusage), Gebiet am Bodensee/im Dreiländereck, darüber hinaus auf Anfrage.
  laender: "Lieferung auf Wunsch: am Bodensee, im Dreiländereck und auf Anfrage darüber hinaus. Für die Schweiz kommen Ausfuhr und Verzollung dazu.",
  schweizHref: "/einkaufen-aus-der-schweiz",
});

export const NAV = Object.freeze({
  label: "Ezarri-Glasmosaik",
  items: [
    { href: "/ezarri", label: "Übersicht", exact: true },
    { href: "/ezarri/mosaike", label: "Mosaike" },
    { href: "/ezarri/kollektionen", label: "Kollektionen" },
    { href: "/ezarri/galerie", label: "Galerie" },
    { href: "/ezarri/konfigurator", label: "Konfigurator" },
    { href: "/ezarri/rechner", label: "Rechner" },
    { href: "/ezarri/technik", label: "Technik" },
  ],
  muster: { href: "/ezarri/anfrage?art=muster", label: "Muster anfragen" },
});

export const LINKS = Object.freeze({
  konfigurator: "/ezarri/konfigurator",
  rechner: "/ezarri/rechner",
  customMix: "/ezarri/custom-mix",
  anfrage: "/ezarri/anfrage",
  muster: (ids = []) => `/ezarri/anfrage?art=muster${ids.length ? `&ref=${ids.map(encodeURIComponent).join(",")}` : ""}`,
  // R8 (ux P2-7): EIN Weg zur Beratung – die allgemeine Terminanfrage mit Thema Ezarri.
  // /ezarri/anfrage bleibt für Muster und Angebot (Material, Mengen).
  beratung: "/beratung?thema=ezarri",
  katalog: "/ezarri/anfrage?art=muster&thema=katalog",
  outdoor: "/outdoor-gartenplanung",
  kueche: "/kuechen-vorarlberg",
  interior: "/interior-design-vorarlberg",
  merkliste: "/merkliste",
});

export const HUB = Object.freeze({
  crumb: "Ezarri Glasmosaik", // = Menütext (Shell.nav.ezarri)
  eyebrow: "Ezarri · Glasmosaik aus recyceltem Glas",
  // R5 seo P2-5: Markenname in der H1.
  title: "Ezarri-Glasmosaik für Pool, Bad und Wellness",
  // Zahlen kommen aus data.getSortimentStats() (QM Runde 2, P2-3: eine Zählweise).
  // „Kollektion“ = Kollektion mit eigenen Mosaiken (17); die vier Custom-Linien
  // ohne Mosaike (Custom Mix, Custom Printed, Custom Pixel, Patterns) heißen
  // „Sonderanfertigung“ und zählen nicht als Kollektion.
  lead: (st) =>
    `${st.mosaike} Mosaike in ${st.kollektionen} Kollektionen, dazu Safe-Steps und Formstücke – sortiert nach dem, was Sie am Ende sehen: Ort, Wasserfarbe, Oberfläche. Gestalten Sie Ihr Becken im Browser und sehen Sie die Muster bei uns in Lochau.`,
  description: (st) =>
    `Ezarri-Glasmosaik für Pool, Bad, Wellness und Küche: ${st.mosaike} Mosaike in ${st.kollektionen} Kollektionen, 3D-Konfigurator, Mengenrechner, Muster und Beratung in Lochau.`,
  heroAlt: "Pool mit Ezarri Celestite, Glasmosaik in Türkis",
  primary: { label: "Becken gestalten", sub: "3D im Browser · ohne Anmeldung" },
  secondary: "Muster anfragen",
  weiche: {
    eyebrow: "Einsatz",
    title: "Wo soll das Mosaik liegen?",
    text: "Laut Datenblatt eignen sich fast alle Ezarri-Mosaike für Wand, Pool und Wellness, innen wie außen. Unter jedem Bereich steht, wie viele Mosaike geeignet sind und wie viele Ezarri in Projekten dieser Art zeigt.",
  },
  /** Kachel-Zeile: „264 Mosaike geeignet · 23 mit Projektbild“. */
  kachel: (n, mitBild) => [`${n} Mosaike geeignet`, mitBild ? `${mitBild} mit Projektbild` : null].filter(Boolean).join(" · "),
  wasser: {
    eyebrow: "Wasserwirkung",
    title: "Welche Farbe bekommt Ihr Wasser?",
    text: "Das Mosaik bestimmt, wie das Wasser wirkt. Weiß lässt es himmelblau erscheinen, Grau und Schwarz eher wie einen Bergsee. Die Zuordnung stammt von Ezarri und hängt auch von Wasserstand und Sonnenlicht ab.",
    alle: "Alle Wasserfarben im Vergleich",
  },
  kollektionen: {
    eyebrow: "Sortiment",
    title: (st) => `${st.kollektionen}\u00a0Kollektionen und ${st.sonderanfertigungen}\u00a0Sonderanfertigungen`, // QM r1: Zahl nie allein am Zeilenende
    alle: "Alle Kollektionen",
  },
  konfigurator: {
    eyebrow: "Konfigurator",
    title: "Ihr Becken, Ihre Mischung",
    text: "Eigene Maße, bis zu vier Mosaike gemischt, sieben Fugenfarben, Tageszeit und Unterwasserlicht. Die Mengen rechnet der Konfigurator gleich mit.",
    link: "Zum Konfigurator",
    rechner: "Menge berechnen",
    customMix: "Eigene Mischung oder Motiv",
  },
  technik: { eyebrow: "Technik", title: "Verlegen, pflegen, nachlesen" },
  marke: {
    eyebrow: "Die Marke",
    text: "Ezarri stellt Glasmosaik in Lazkao (Gipuzkoa, Spanien) her. Laut Ezarri besteht das Glas zu 100 % aus Recyclingglas, bestätigt nach ISO 14021; im fertigen Mosaik sind es mindestens 96 %, der Rest sind Farbstoffe und die Klebepunkte (JointPoint).",
    website: "Website von Ezarri",
  },
  gastgeber: {
    eyebrow: "Showroom-Café in Lochau",
    title: "Mosaik in die Hand nehmen",
    text: "Glas wirkt im Licht anders als am Bildschirm. Bringen Sie Pläne oder Fotos mit, wir legen die Muster auf den Tisch – mit Blick auf den Bodensee.",
    termin: "Termin anfragen",
  },
});

/**
 * Einsatz-Welten (§3.2). filter = Eignung für /ezarri/mosaike (data.getEignung),
 * galerie = Projektbild-Arten (Galerie-Einsatz, ?bild= in der Übersicht),
 * bild = fest kuratiertes Kachel- und Kopfbild (Galerie-ID, Alt-Text nach Bildinhalt, QM P1-2).
 */
export const WELTEN = Object.freeze([
  {
    id: "pool",
    label: "Pool",
    title: "Glasmosaik für den Pool",
    seoTitle: "Glasmosaik Pool in Vorarlberg & am Bodensee",
    description: "Pool-Mosaik von Ezarri: Wasserfarbe wählen, rutschhemmende Safe-Steps, Corner und Cove für Kanten. Muster und Beratung in Lochau.",
    lead: "Im Pool zählt mehr als die Farbe: Fuge, Rutschhemmung an Treppe und Rand, saubere Kanten. Hier sehen Sie, worauf es ankommt, und die Mosaike, die Ezarri für Becken vorsieht.",
    filter: { einsatz: ["pool"] },
    galerie: ["pool-privat", "pool-oeffentlich"],
    bild: { galerie: "anw-6-terrazzo-teal-50-ezarri-mosaics-pool-home", alt: "Schmaler Innenpool mit Blick aufs Meer, Becken mit Ezarri Terrazzo Teal 50" },
    hinweise: [
      ["Fuge", "Ezarri empfiehlt für Becken eine Epoxidfuge der Klasse RG. Zementfugen müssen laut Ezarri nach etwa 5–6 Jahren erneuert werden."],
      ["Treppe und Rand", "Für Treppen, Bänke und Beckenrand gibt es rutschhemmende Safe-Varianten mit geprüften Werten nach DIN EN 16165."],
      ["Kanten", "Corner-Stücke fassen Außenkanten, Cove-Stücke bilden die Hohlkehle zwischen Wand und Boden."],
      ["Wasserfarbe", "Helle Mosaike machen das Wasser hell und türkis, dunkle lassen es tief und natürlich wirken."],
    ],
    platzhirsch: { title: "Pool, Terrasse und Garten als ein Projekt", text: "Becken, Möbel, Beschattung und Licht sollten zusammenpassen. Wir planen das Outdoor-Konzept und stimmen uns mit den Fachbetrieben ab, die Sie beauftragen.", href: "/outdoor-gartenplanung", label: "Outdoor-Planung ansehen" },
  },
  {
    id: "wellness",
    label: "Wellness",
    title: "Glasmosaik für Wellness und Spa",
    seoTitle: "Glasmosaik für Wellness, Sauna und Spa",
    description: "Ezarri-Glasmosaik für Whirlpool, Dampfbad und Spa: Oberflächen, Rutschhemmung und Fugen im Überblick. Muster und Beratung in Lochau.",
    lead: "Whirlpool, Dampfbad, Duschbereich im Spa: Hier liegt das Mosaik auf gekrümmten Flächen, unter Wasser und im Dampf. Glas nimmt laut Ezarri kein Wasser auf und ist gegen übliche Reinigungsmittel beständig.",
    filter: { einsatz: ["wellness"] },
    galerie: ["wellness"],
    bild: { galerie: "anw-alexande-gold-carrara-gold-mosaic-spa-wellness-ezarri-4", alt: "Dampfbad mit Sitzbank, Wände in dunklem Glasmosaik mit goldenen Steinen, Ezarri Carrara Gold 25" },
    hinweise: [
      ["Rundungen", "Die punktuelle Verklebung (JointPoint) folgt laut Ezarri auch engen Radien, etwa bei Sitzbänken und Whirlpools."],
      ["Boden", "Nasse Böden brauchen eine rutschhemmende Ausführung. Die Werte stehen auf jeder Mosaikseite."],
      ["Licht", "Perlmutt- und Metall-Oberflächen reagieren stark auf Licht. Sehen Sie sie im Muster an, nicht nur am Bildschirm."],
    ],
    platzhirsch: { title: "Wellness zu Hause planen", text: "Vom Spa-Bereich bis zum Ruheraum: Wir planen Möbel, Licht und Materialien zusammen.", href: "/interior-design-vorarlberg", label: "Interior Design ansehen" },
  },
  {
    id: "bad",
    label: "Bad",
    title: "Glasmosaik für Bad und Dusche",
    seoTitle: "Glasmosaik Bad & Dusche, rutschhemmend",
    description: "Ezarri-Glasmosaik für Dusche, Badwand und Duschboden: rutschhemmende Ausführungen, Formate, Fugen. Muster und Beratung in Lochau.",
    lead: "Im Bad trägt Mosaik dort, wo große Fliesen an Grenzen kommen: im Gefälle der bodengleichen Dusche, an Nischen und Rundungen. Für den Duschboden wählen Sie eine rutschhemmende Ausführung.",
    filter: { einsatz: ["bad"] },
    galerie: ["bad"],
    bild: { galerie: "anw-ezarri-mosaics-gemma-collection-lace-25", alt: "Bad mit geschwungenen Wänden, offener Dusche und freistehender Wanne, rundum Ezarri Lace 25 in Hellgrün" },
    hinweise: [
      ["Duschboden", "Kleine Formate folgen dem Gefälle. Rutschhemmende Safe-Ausführungen sind für nasse Böden gedacht."],
      ["Fuge", "Die Fugenfarbe verändert die Wirkung stark. Im Konfigurator können Sie alle sieben Fugenfarben ausprobieren."],
    ],
    platzhirsch: { title: "Das ganze Bad planen", text: "Mosaik, Möbel, Armaturen und Licht in einem Konzept – im Showroom in Lochau besprechen wir den Entwurf.", href: "/interior-design-vorarlberg", label: "Interior Design ansehen" },
  },
  {
    id: "kueche",
    label: "Küche",
    title: "Glasmosaik für die Küche",
    seoTitle: "Mosaik Küchenrückwand aus Glas",
    description: "Ezarri-Glasmosaik als Küchenrückwand: Oberflächen, Farben und Formate im Überblick. Küchenplanung und Muster in Lochau.",
    lead: "Als Rückwand hinter Kochfeld und Spüle ist Glasmosaik leicht zu reinigen. Metall-, Perlmutt- und matte Steinoptiken setzen eigene Akzente zwischen Fronten und Arbeitsplatte.",
    filter: { einsatz: ["kueche"] },
    galerie: ["kueche"],
    bild: { galerie: "anw-perla-hexa-mosaic-iridescent-collection-ezarri-kitchen", alt: "Helle Küche mit Kochinsel, Wände in weißem Perlmutt-Mosaik Ezarri Perla Hexa" },
    hinweise: [
      ["Fläche", "Rückwände sind meist schmal und lang. Der Rechner gibt die Menge in Kartons an."],
      ["Abstimmung", "Wählen Sie das Mosaik zusammen mit Front und Arbeitsplatte, mit den Mustern nebeneinander."],
    ],
    platzhirsch: { title: "Küche und Rückwand aus einer Planung", text: "Wir planen Küchen in Lochau und stimmen die Rückwand mit Fronten und Arbeitsplatte ab.", href: "/kuechen-vorarlberg", label: "Küchenplanung ansehen" },
  },
  {
    id: "fassade",
    label: "Fassade",
    title: "Glasmosaik für Fassade und Außenwand",
    seoTitle: "Glasmosaik für Fassade und Außenwand",
    description: "Ezarri-Glasmosaik für Außenwände und Fassaden: Angaben aus den Datenblättern, Formate und Farben. Planung mit Ihrem Fassadenbauer.",
    lead: "Laut den Datenblättern sind die Ezarri-Kollektionen für Wände und Decken innen wie außen geeignet, auf geraden wie unregelmäßigen Flächen. Projektbilder von Fassaden hat Ezarri nicht veröffentlicht. Deshalb zeigen wir eine ganz verkleidete Innenwand und die Angaben aus den Datenblättern.",
    filter: { einsatz: ["wand-innen-aussen"] },
    galerie: [],
    bild: { galerie: "anw-moonstone-hexa-mosaic-gemma-collection-ezarri-espacio", alt: "Raum mit breitem Durchgang, Wände und Laibung ganz mit Ezarri Mondstein Hexa verkleidet" },
    hinweise: [
      ["Planung", "Untergrund, Kleber und Fugen legt Ihr Fassadenbauer fest. Wir liefern Mosaik, Datenblätter und Muster."],
      ["Frost und Licht", "Glas nimmt laut Ezarri praktisch kein Wasser auf (Wasseraufnahme 0,1 % laut Datenblatt) und bleicht nicht aus."],
    ],
    platzhirsch: { title: "Haus und Garten als ein Projekt", text: "Fassade, Terrasse und Pool: Wir planen das Outdoor-Konzept mit Möbeln, Beschattung und Licht.", href: "/outdoor-gartenplanung", label: "Outdoor-Planung ansehen" },
  },
]);

export const WASSER = Object.freeze({
  crumb: "Wasserwirkung",
  eyebrow: "Wasserwirkung",
  title: "Welche Farbe bekommt Ihr Wasser?",
  seoTitle: "Poolfarbe wählen: Wie Mosaik das Wasser färbt",
  description: "Sechs Wasserfarben nebeneinander, von himmelblau bis Bergsee, mit passenden Ezarri-Mosaiken und Projektbildern.",
  lead: "Wasser hat keine eigene Farbe, es nimmt sie vom Becken. Ezarri ordnet seine Mosaike sechs Wasserwirkungen zu. Wie stark der Effekt ist, hängt von Wassertiefe, Sonnenstand und Umgebung ab.",
  texte: {
    himmelblau: "Weiße und sehr helle Mosaike. Das Wasser wirkt hell, klar und leicht blau.",
    tuerkisblau: "Helle Blau- und Türkistöne. Die klassische Poolfarbe, besonders in flachen Bereichen.",
    blau: "Mittlere bis dunkle Blautöne. Je dunkler das Mosaik, desto tiefer wirkt das Blau.",
    gruen: "Beige-, Sand- und Rosatöne lassen das Wasser laut Ezarri transparent grün erscheinen.",
    graugruen: "Graue Mosaike geben dem Wasser Grau mit blauen oder grünen Anteilen.",
    natur: "Schwarze und dunkelgrüne Mosaike. Das Wasser wirkt wie in einem Bergsee oder Fluss.",
  },
  quelle: "Zuordnung der Wasserfarben: Ezarri (Galerie-Filter und FAQ), Stand 28.10.2026.",
});

export const KOLLEKTIONEN = Object.freeze({
  crumb: "Kollektionen",
  eyebrow: "Sortiment",
  title: "Kollektionen",
  seoTitle: "Ezarri Kollektionen: Premium, Classic, Individuell",
  description: (st) =>
    `Alle ${st.kollektionen} Ezarri-Kollektionen und ${st.sonderanfertigungen} Sonderanfertigungen: Gea, Zen, Iridescent, Niebla, Lisa und mehr. Formate, Oberflächen und Datenblätter im Überblick.`,
  lead: "Premium, Classic und Individuell: Jede Kollektion hat eigene Oberflächen und Formate. Bei den Sonderanfertigungen fertigt Ezarri Mischung oder Motiv für Ihr Projekt.",
  /** Zeile unter Kollektionen ohne eigene Mosaike (Custom Mix, Printed, Pixel, Patterns). */
  sonder: "Sonderanfertigung",
  sonderN: (n) => (n === 1 ? "1 Sonderanfertigung" : `${n} Sonderanfertigungen`),
  linien: {
    Premium: "Steinoptik, Perlmutt, Metall, Gold und nachleuchtendes Glas.",
    Classic: "Die Grundfarben für Becken, einfarbig oder als fertige Mischung.",
    Custom: "Eigene Mischungen, Druck- und Pixelmotive, Verläufe.",
  },
  custom: "Diese Kollektion ist eine Dienstleistung. Die Mischung oder das Motiv entsteht für Ihr Projekt.",
  customLink: "Eigene Mischung planen",
  alt: "Datenblätter älterer Kollektionen",
  konfigurator: "Im Konfigurator öffnen",
  datenblatt: "Datenblatt (PDF, englisch)",
  ausfuehrungen: "Safe-Steps, Corner und Cove",
  anwendung: "Anwendungsbeispiel",
});

export const MOSAIKE = Object.freeze({
  crumb: "Mosaike",
  eyebrow: "Alle Mosaike",
  title: "Mosaike",
  seoTitle: "Ezarri Glasmosaik: alle Mosaike mit Filter",
  description: "Alle Ezarri-Mosaike nach Einsatz, Wasserfarbe, Farbe, Format und Kollektion filtern. Vergleichen, merken, Muster anfragen.",
  lead: "Filtern Sie nach Wasserwirkung, Farbe, Format und Projektbildern. Vergleichen Sie bis zu vier Mosaike und merken Sie sich Ihre Auswahl.",
  suche: "Name oder Code",
  sucheLabel: "Suche",
  filter: "Filter",
  mehrFilter: "Weitere Filter",
  anwenden: "Filter anwenden",
  zuruecksetzen: "Alle Filter entfernen",
  treffer: (n) => (n === 1 ? "1 Mosaik" : `${n} Mosaike`),
  weitere: (n) => `Weitere ${n} laden`,
  seite: (p, ps) => `Seite ${p} von ${ps}`,
  leer: {
    title: "Kein Mosaik passt zu allen Filtern",
    text: "Entfernen Sie einen Filter, suchen Sie eine ähnliche Farbe – oder fragen Sie uns. Wir suchen das passende Mosaik für Sie.",
    aehnlich: "Ähnliche Farbe finden",
    anfrage: "Wir suchen es für Sie",
  },
  farbe: { label: "Farbe wählen", hinweis: "Sortiert nach Ähnlichkeit zur gewählten Farbe", entfernen: "Farbe entfernen" },
  safe: "Nur rutschhemmend",
  spezial: "Mit Corner oder Cove",
  sortNaehe: "nach Farbnähe",
  filterKnopf: (n) => (n ? `Filter (${n})` : "Filter"),
  filterTitel: "Mosaike filtern",
  anzeigen: (n) => (n === 1 ? "1 Mosaik anzeigen" : `${n} Mosaike anzeigen`),
  schliessen: "Filter schließen",
  projektbild: { legend: "Projektbild aus", hinweis: "Mosaike, die Ezarri in Projekten dieser Art zeigt." },
  eignung:
    "Laut Datenblatt eignen sich fast alle Ezarri-Mosaike für Wand und Boden, Pool und Wellness, innen wie außen, also auch für Bad und Küche. Für nasse Böden und Stufen wählen Sie „Nur rutschhemmend“.",
  /** Zusatz zur Trefferzeile, solange ohne Art-Filter nur Basis-Mosaike gezeigt werden. */
  weitereArten: (n) => `${n} Safe-Steps und Formstücke unter „Art“`,
  alleArten: "Auch Safe-Steps und Formstücke zeigen",
  sortLabel: "Sortierung",
  sortierung: [
    { id: "empfohlen", label: "Empfohlen" },
    { id: "name", label: "Name A–Z" },
    { id: "kollektion", label: "Kollektion" },
    { id: "hell", label: "Farbe hell → dunkel" },
  ],
});

export const KARTE = Object.freeze({
  /** Sichtbares Label vor der Wasserwirkung (QM Runde 2 P2-1). */
  imWasser: "Im Wasser:",
  vergleichen: "Vergleichen",
  verglichen: "Im Vergleich",
  merken: (name) => `Merken: Ezarri ${name}`,
  vollerVergleich: "Höchstens 4 Mosaike im Vergleich",
});

export const VERGLEICH = Object.freeze({
  crumb: "Vergleich",
  title: "Mosaike vergleichen",
  seoTitle: "Ezarri Mosaike vergleichen",
  leiste: (n) => `Vergleich (${n})`,
  oeffnen: "Vergleich ansehen",
  leeren: "Vergleich leeren",
  leer: "Wählen Sie auf der Mosaik-Übersicht bis zu vier Mosaike mit „Vergleichen“.",
  zurUebersicht: "Zur Mosaik-Übersicht",
  unterschied: "unterschiedlich",
  gleich: "gleich",
  nurUnterschiede: "Nur Unterschiede zeigen",
  entfernen: (name) => `${name} aus dem Vergleich entfernen`,
  konfigurator: "Diese Mischung im Konfigurator",
  muster: "Muster aller anfragen",
  nichtMischbar: "Mindestens ein Mosaik lässt sich laut Ezarri nicht mischen.",
  zeilen: {
    kollektion: "Kollektion",
    format: "Format",
    oberflaeche: "Oberfläche",
    wasser: "Wasserwirkung",
    rutsch: "Rutschhemmung",
    spezial: "Corner / Cove",
    blatt: "Blatt",
    steine: "Steine pro Blatt",
    m2karton: "m² pro Karton",
    kgm2: "kg pro m²",
    einsatz: "Einsatz",
    mischbar: "Mischbar im Konfigurator",
  },
});

export const DETAIL = Object.freeze({
  preis: "Preis auf Anfrage",
  preisHinweis: "Wir nennen Ihnen den Preis mit Menge, Lieferweg und Lieferzeit.",
  muster: "Muster anfragen",
  konfigurator: "Im Konfigurator ansehen",
  rechner: "Menge berechnen",
  merken: "Merken",
  gemerkt: "Gemerkt",
  ausfuehrungen: "Ausführungen",
  formate: "Format",
  safe: "Rutschhemmend",
  spezial: "Formstücke",
  aufDieserSeite: "auf dieser Seite",
  massTitle: "Maße des Blatts",
  massLegende: (stein, fuge) => `Ein Stein ${stein}, Fuge ${fuge}. Zeichnung nicht maßstäblich zum Bildschirm.`,
  fakten: "Technische Angaben",
  verpackung: "Verpackung",
  luecke: "laut Ezarri nicht angegeben",
  rutschKorrigiert: "Im Datenblatt sind Barfuß- und Schuhwert vertauscht eingetragen; hier richtig zugeordnet.",
  aehnlich: "Ähnliche Mosaike",
  passtZu: "Aus derselben Kollektion",
  projekte: "Projekte mit diesem Mosaik",
  verlegung: "Verlegung im Becken",
  datenblatt: "Datenblatt der Kollektion",
  ezarriSeite: "Produktseite bei Ezarri",
  fuge: "Fugenempfehlung",
  labels: {
    code: "Code",
    kollektion: "Kollektion",
    linie: "Linie",
    typ: "Art",
    format: "Format",
    stein: "Stein",
    blatt: "Blatt",
    steine: "Steine pro Blatt",
    dicke: "Dicke",
    fugeMm: "Fugenbreite",
    oberflaeche: "Oberfläche",
    farbe: "Farbe",
    einsatz: "Einsatz",
    wasser: "Wasserwirkung",
    rutschBarfuss: "Barfuß (DIN EN 16165 A)",
    rutschSchuh: "Schuh (DIN EN 16165 B)",
    rutschPendel: "Pendel (UNE-EN 16165 C)",
    blattKarton: "Blatt pro Karton",
    m2Karton: "m² pro Karton",
    m2Palette: "m² pro Palette",
    kgm2: "Gewicht",
    mischbar: "Mischbar",
  },
});

/** Rezept fertiger Mischungen auf der Detailseite (QM Runde 2, P2-2). */
export const MISCHUNG = Object.freeze({
  title: "Mischung laut Ezarri",
  balken: "Anteile der Mischung",
  ohneSeite: "ohne eigene Produktseite bei Ezarri",
  quelle: "Rezept: Ezarri, Produktseite",
  quelleKonfigurator: "Rezept: Ezarri, Konfigurator (Produktseite unvollständig)",
  quelleLink: "Bei Ezarri ansehen",
  konfigurator: "Diese Mischung im Konfigurator",
  konfiguratorFertig: "Fertige Mischung im Konfigurator",
  konfiguratorHinweis: "Der Konfigurator startet mit diesem Rezept. Sie können die Anteile dort ändern.",
  muster: "Muster der Einzelfarben anfragen",
  /** Faktenzeile „Mischbar“ bei fertigen Mischungen (statt „nein“). */
  nurFertig: "Im Konfigurator nur als fertige Mischung wählbar",
  zeile: "Mischung",
});

export const GALERIE = Object.freeze({
  crumb: "Galerie",
  eyebrow: "Projekte mit Ezarri-Mosaik",
  title: "Galerie",
  seoTitle: "Projekte mit Ezarri-Glasmosaik: Galerie",
  description: "Über 1000 Projektbilder mit Ezarri-Glasmosaik: Pools, Wellness, Bad und Küche. Filter nach Einsatz, Wasserfarbe und Kollektion.",
  // Eine Zeile (QM Runde 2 P2-4: erste Bildreihe im ersten Bildschirm).
  lead: "Projektbilder von Ezarri, zu jedem Bild das verwendete Mosaik.",
  /** Bildunterschrift unter der Kachel (QM P3-2); Credit einmal unter dem Raster. */
  diesesMosaik: (name) => `Mosaik: ${name}`,
  filterTitel: "Galerie filtern",
  /** Einsatz-Filter der Galerie (Ezarris Galerie-Kategorien). */
  einsatz: [
    { id: "pool-privat", label: "Privatpool" },
    { id: "pool-oeffentlich", label: "Öffentliches Bad und Hotel" },
    { id: "wellness", label: "Wellness und Spa" },
    { id: "bad", label: "Bad" },
    { id: "kueche", label: "Küche" },
  ],
  anzeigen: (n) => (n === 1 ? "1 Bild anzeigen" : `${n} Bilder anzeigen`),
  laedt: "Wird geladen …",
  videos: {
    link: (n) => `Videos (${n})`,
    title: "Produktvideos von Ezarri",
    text: "Kurze Filme zu einzelnen Mosaiken, keine Projekte. Sie öffnen sich bei YouTube.",
  },
  video: "Video bei YouTube ansehen",
  videoHinweis: "Öffnet youtube.com in einem neuen Tab.",
  oeffnen: "Bild groß ansehen",
  schliessen: "Schließen",
  vor: "Nächstes Bild",
  zurueck: "Vorheriges Bild",
  leer: "Zu diesen Filtern gibt es keine Projektbilder.",
  treffer: (n) => (n === 1 ? "1 Projektbild" : `${n} Projektbilder`),
});

export const TECHNIK = Object.freeze({
  crumb: "Technik",
  eyebrow: "Technik",
  title: "Technik und Verlegung",
  seoTitle: "Ezarri Glasmosaik: Technik, Verlegung, Pflege",
  description: "JointPoint, Verlegung je Beckentyp, Pflege, häufige Fragen und alle Ezarri-Datenblätter als PDF.",
  lead: "Herstellerangaben von Ezarri, in eigenen Worten zusammengefasst. Die Verlegung übernimmt ein Fliesenleger-Fachbetrieb.",
  bereiche: [
    { href: "/ezarri/technik/jointpoint", title: "JointPoint", text: "Wie die Steine ohne Papier und Netz zusammenhalten." },
    { href: "/ezarri/technik/verlegung", title: "Verlegung", text: "Schritte je Beckentyp: Beton, Stahl, Polystyrol, Polypropylen, Polyester." },
    { href: "/ezarri/technik/pflege", title: "Pflege", text: "Reinigen, Kalk, Fugenreste, Chemikalien." },
    { href: "/ezarri/technik/fragen", title: "Häufige Fragen", text: "18 Antworten von Material bis Lieferzeit." },
    { href: "/ezarri/technik/downloads", title: "Downloads", text: "Datenblätter, Zertifikate und Garantie als PDF." },
    { href: "/ezarri/rechner", title: "Mosaik-Rechner", text: "m², Kartons, Kleber und Fuge für Ihr Becken." },
  ],
  fachbetrieb: "Die Verlegung übernimmt ein Fliesenleger-Fachbetrieb. Wir liefern Mosaik, Datenblätter und Muster und stimmen Termine ab.",
});

export const JOINTPOINT = Object.freeze({
  crumb: "JointPoint",
  title: "JointPoint: Klebepunkte statt Papier und Netz",
  seoTitle: "JointPoint von Ezarri erklärt",
  description: "So hält JointPoint die Ezarri-Mosaiksteine zusammen: punktuelle Verklebung, 92 % freie Rückseite, laut Ezarri bis zu 25 % schneller verlegt.",
  lead: "Bei vielen Mosaiken halten Papier auf der Vorderseite oder ein Netz auf der Rückseite die Steine zusammen. Ezarri verbindet die Steine stattdessen mit kleinen, flexiblen Klebepunkten an den Kanten.",
  punkte: [
    ["Mehr Haftfläche", "Laut Ezarri bleiben 92 % der Rückseite frei für den Kleber. Papier oder Netz liegen nicht zwischen Stein und Kleber."],
    ["Schneller verlegt", "Laut Ezarri bis zu 25 % weniger Verlegezeit als mit papierkaschierten Mosaiken, weil kein Papier abgelöst werden muss."],
    ["Biegsam", "Das Blatt folgt Rundungen, etwa an Treppen, Bänken und Whirlpools, und lässt sich leicht schneiden."],
    ["Feuchte", "Die Punkte dehnen sich laut Ezarri durch Feuchte nicht aus, schrumpfen nicht und brechen nicht."],
  ],
  grafik: {
    title: "Rückseite im Vergleich",
    netz: "Netz: Fasern liegen zwischen Stein und Kleber",
    papier: "Papier: Vorderseite verklebt, muss abgelöst werden",
    joint: "JointPoint: Punkte an den Kanten, Rückseite frei",
  },
});

/** Verlegung je Beckentyp. Quelle: ezarri.com/de/verlegung und Unterseiten, 28.10.2026. */
export const VERLEGUNG = Object.freeze({
  crumb: "Verlegung",
  title: "Verlegung je Beckentyp",
  seoTitle: "Glasmosaik im Pool verlegen: Schritte je Beckentyp",
  description: "Glasmosaik von Ezarri verlegen: Schritte für Beton-, Stahl-, Polystyrol-, Polypropylen- und Polyesterbecken nach Herstellerangaben.",
  lead: "Wählen Sie Ihren Beckentyp. Die Schritte fassen Ezarris Verlegeanleitung zusammen. Kleber und Fuge wählt Ihr Fliesenleger nach den Datenblättern der Hersteller.",
  waehlen: "Beckentyp",
  hinweisKelle: "Ezarri nennt in der Verlegeanleitung für Beton eine 6-mm-Zahnkelle, in den FAQ eine 3-mm-Zahnkelle. Ihr Fliesenleger richtet sich nach dem Datenblatt des Klebers.",
  typen: [
    {
      id: "beton",
      label: "Beton",
      schritte: [
        ["Untergrund vorbereiten", "Eben, sauber, tragfähig und trocken: Restfeuchte unter 3 %."],
        ["Kleber wählen", "Zementkleber mindestens der Klasse C2TE (EN 12004)."],
        ["Kleber auftragen", "Gleichmäßig mit der Zahnkelle aufziehen, laut Verlegeanleitung 6 mm."],
        ["Blätter ansetzen", "Die Blätter mit JointPoint einlegen und andrücken."],
        ["Ausrichten", "Mit dem Gummibrett die Fugen gerade richten."],
        ["Fugenmasse wählen", "Epoxidfuge der Klasse RG. Alternativ eine hochwertige Zementfuge CG2, die laut Ezarri nach etwa 5–6 Jahren erneuert werden muss."],
        ["Verfugen", "Mit einem weichen Gummibrett einarbeiten, Überschuss abziehen."],
        ["Reinigen", "Mit Wasser und Schwammbrett säubern."],
        ["Bauschlussreinigung", "Nach 24 Stunden mit einem Bauschlussreiniger nachreinigen."],
      ],
    },
    {
      id: "stahl",
      label: "Verzinkter Stahl",
      schritte: [
        ["Wände abdichten", "Selbstklebende Abdichtungsbahnen auf die Stahlwände kleben."],
        ["Wandstöße abdichten", "Die Stöße mit wasserdichtem Band und passendem Kleber schließen."],
        ["Boden abdichten", "Bahnen auf die ganze Betonplatte kleben, 5 cm überlappend, Überlappungen verkleben."],
        ["Übergang Boden–Wand", "Mit demselben flexiblen Band und Kleber abdichten."],
        ["Einbauteile abdichten", "Skimmer, Scheinwerfer und Düsen mit einer speziellen Dichtmasse an die Bahn anschließen."],
        ["Mosaik verlegen", "Mit dem empfohlenen Kleber und der empfohlenen Fuge, wie beim Betonbecken."],
      ],
    },
    {
      id: "polystyrol",
      label: "Polystyrol",
      schritte: [
        ["Becken abdichten", "Passende Abdichtungsbahn verlegen, 5 cm überlappend."],
        ["Überlappungen schließen", "Mit dem von Ezarri empfohlenen Produkt verkleben."],
        ["Einbauteile abdichten", "Skimmer, Scheinwerfer und Düsen mit Dichtmasse an die Bahn anschließen."],
        ["Mosaik verlegen", "Mit dem empfohlenen Kleber und der empfohlenen Fuge."],
      ],
    },
    {
      id: "polypropylen",
      label: "Polypropylen",
      schritte: [
        ["Wände abdichten", "Selbstklebende Abdichtungsbahnen auf die Wände kleben."],
        ["Wandstöße abdichten", "Mit wasserdichtem Band und passendem Kleber."],
        ["Boden abdichten", "Bahnen auf die Betonplatte kleben, 5 cm überlappend, Überlappungen verkleben."],
        ["Übergang Boden–Wand", "Mit demselben flexiblen Band und Kleber."],
        ["Einbauteile abdichten", "Skimmer, Scheinwerfer und Düsen mit Dichtmasse anschließen."],
        ["Mosaik verlegen", "Mit dem empfohlenen Kleber und der empfohlenen Fuge."],
      ],
    },
    {
      id: "polyester",
      label: "Polyester",
      schritte: [
        ["Anschleifen", "Die ganze Beckenoberfläche anschleifen."],
        ["Entstauben", "Schleifstaub und Schmutz mit Aceton entfernen."],
        ["Kleber wählen", "Reaktionsharzkleber auf Polyurethan- oder Epoxidbasis, der Bewegungen aufnimmt."],
        ["Kleber auftragen", "Mit einer 3-mm-Zahnkelle aufziehen."],
        ["Blätter ansetzen", "Mit JointPoint einlegen und andrücken."],
        ["Verfugen", "Mit Epoxidfuge."],
        ["Bauschlussreinigung", "Nach 24 Stunden mit einem Bauschlussreiniger nachreinigen."],
      ],
    },
  ],
});

export const PFLEGE = Object.freeze({
  crumb: "Pflege",
  title: "Pflege von Glasmosaik",
  seoTitle: "Glasmosaik reinigen und pflegen",
  description: "Glasmosaik reinigen: Fugenreste, Kalk, Chemikalien im Pool, Bad und Zuschnitt. Hinweise nach Ezarri-Pflegethemen.",
  lead: "Glas ist dicht und pflegeleicht. Die meisten Fragen betreffen die Fuge und Reste aus der Verlegung. Prüfen Sie Reiniger immer zuerst an einer unauffälligen Stelle und folgen Sie den Angaben des Reiniger- und Fugenherstellers.",
  themen: [
    ["Epoxid-Reste entfernen", "Frische Reste lassen sich mit Wasser und Schwammbrett abnehmen. Ausgehärtete Schleier entfernt ein Epoxid-Reiniger, den der Fugenhersteller vorgibt."],
    ["Warum Epoxidfuge", "Epoxidfugen sind dicht und gegen Poolchemie beständiger als Zementfugen. Zementfugen müssen im Becken laut Ezarri nach etwa 5–6 Jahren erneuert werden."],
    ["Kalk entfernen", "Kalkränder an der Wasserlinie mit einem geeigneten sauren Reiniger lösen, danach gut mit Wasser spülen. Die Fuge muss für den Reiniger geeignet sein."],
    ["Chemikalien und Glas", "Laut Ezarri ist das Glas gegen übliche Poolpflegemittel beständig und für Salzelektrolyse geeignet. Empfindlicher ist meist die Fuge."],
    ["Zementfugen-Reste", "Zementschleier nach dem Aushärten mit einem Zementschleierentferner abnehmen. Auf Glas nicht kratzen oder scheuern."],
    ["Verlegen unter Wasser", "Ein Becken mit Mosaik wird erst gefüllt, wenn Kleber und Fuge nach Angabe ihrer Hersteller ausgehärtet sind."],
    ["Bad reinigen", "Mildes Reinigungsmittel und ein weiches Tuch reichen. Scheuermittel und Stahlwolle zerkratzen Oberflächen wie Perlmutt oder Metall."],
    ["Mosaik schneiden", "JointPoint-Blätter lassen sich zwischen den Steinen teilen. Einzelne Steine schneidet man mit einer Glasmosaik-Zange."],
  ],
  quelle: "Themen nach Ezarris Pflegebereich (ezarri.com/de/pflege-des-Mosaiks). Die Texte sind unsere Zusammenfassung, keine Herstellertexte.",
});

/** 18 Fragen, eigene Antworten. Fakten aus ezarri.com/de/faqs (28.10.2026). */
export const FRAGEN = Object.freeze({
  crumb: "Häufige Fragen",
  title: "Häufige Fragen zu Ezarri-Glasmosaik",
  seoTitle: "Ezarri Glasmosaik: häufige Fragen",
  description: "Material, Recyclingglas, JointPoint, Wasserfarbe, Kleber und Fugen, Lieferzeit und Kauf: Antworten zu Ezarri-Glasmosaik.",
  liste: [
    ["Was ist JointPoint?", "Ezarris Verbindung der Steine: kleine flexible Klebepunkte an den Kanten statt Papier oder Netz. Laut Ezarri bleiben so 92 % der Rückseite frei für den Kleber."],
    ["Warum eignet sich JointPoint für Pool und Spa?", "Weil nichts zwischen Stein und Kleber liegt. Laut Ezarri spart es bis zu 25 % Verlegezeit gegenüber Papier und ist beständig gegen Feuchte und Chemikalien."],
    ["Woraus besteht das Glas?", "Laut Ezarri aus 100 % Recyclingglas als Rohstoff, bestätigt nach ISO 14021. Im fertigen Mosaik sind mindestens 96 % Altglas aus dem Verbrauch, der Rest sind Farbstoffe und die Klebepunkte."],
    ["Was sagt das Umweltzertifikat?", "Die Eigenerklärung nach ISO 14021 belegt den Recyclinganteil. Das PDF finden Sie unter Downloads."],
    ["Wo wird produziert?", "In Lazkao (Gipuzkoa, Spanien). Dort sind auch Produktion und Zentrallager. Logistikstandorte nennt Ezarri in Castellón, Sassuolo und Miami."],
    ["Wird alles in Spanien hergestellt?", "Laut Ezarri ja, alle Mosaike kommen aus Lazkao. Etwa 70 % der Produktion gehen in den Export."],
    ["Wie lange hält Mosaik im Pool?", "Glas nimmt laut Ezarri kein Wasser auf, ist chemisch träge und temperaturwechselbeständig. Richtig verlegt bleicht es nicht aus. Die Fuge ist der Teil, der Pflege braucht."],
    ["Wie beeinflusst das Mosaik die Wasserfarbe?", "Weiß ergibt himmelblaues bis türkises Wasser, Beige und Rosa transparentes Grün, Grau Grau mit Blau- oder Grünanteil, Schwarz und Dunkelgrün einen Bergsee-Ton. Dunkles Blau macht das Wasser tiefer. Mehr dazu unter Wasserwirkung."],
    ["Wie wird verlegt?", "Glatter, sauberer, trockener Untergrund, flexibler Kleber C2TE, Blätter andrücken und ausrichten, mit Epoxid verfugen, Reste abnehmen. Die Schritte je Beckentyp stehen unter Verlegung."],
    ["Welche Kleber und Fugen?", "Kleber mindestens C2TE nach EN 12004. Als Fuge empfiehlt Ezarri Epoxid (RG), alternativ eine hochwertige Zementfuge (CG2)."],
    ["Geht Mosaik auf Polyester- oder Fertigbecken?", "Ja, mit einem elastischen Reaktionsharzkleber (Epoxid oder Polyurethan), der Bewegungen aufnimmt. Die Oberfläche wird vorher angeschliffen."],
    ["Wie lange hält eine Zementfuge im Pool?", "Laut Ezarri etwa 5–6 Jahre, dann muss neu verfugt werden. Epoxidfugen halten länger."],
    ["Warum lösen sich Fliesen im Pool?", "Meist wegen schlechter Untergrundvorbereitung, falschem Kleber oder Papier und Netz zwischen Stein und Kleber. Bei JointPoint liegt nichts dazwischen."],
    ["Wie lange dauert die Lieferung?", "Laut Ezarri sind 95 % der Mosaike ab Lager verfügbar und Aufträge werden in 24–48 Stunden vorbereitet. Den Liefertermin nach Lochau oder zu Ihnen nennen wir mit dem Angebot."],
    ["Welche Formate gibt es?", "Quadratisch 25 mm und 50 mm, Hexa mit 33,4 × 33,4 mm, dazu die Formstücke Corner und Cove. Die Formate je Mosaik stehen auf der Mosaikseite."],
    ["Wo sehe ich Muster?", "Bei uns im Showroom-Café in Lochau. Wählen Sie bis zu sechs Mosaike, wir bestellen die Muster für Ihren Termin."],
    ["So kaufen Sie Ezarri-Mosaik bei uns", "Ezarri verkauft nicht direkt an Privatkunden. Bei Platzhirsch bekommen Sie Beratung, Muster, Mengenberechnung und Angebot. Schicken Sie uns Ihre Auswahl oder einen Konfigurator-Link."],
    ["Ist die Verfügbarkeit online sichtbar?", "Ezarri zeigt den Bestand nur auf seiner Website. Wir prüfen die Menge für Ihr Projekt mit dem Angebot."],
  ],
});

export const DOWNLOADS = Object.freeze({
  crumb: "Downloads",
  title: "Datenblätter und Zertifikate",
  seoTitle: "Ezarri Datenblätter und Zertifikate (PDF)",
  description: "Alle Ezarri-Datenblätter je Kollektion, ISO 9001, ISO 14021 und Garantie als PDF. Kataloge auf Anfrage.",
  lead: "Die PDFs stammen von Ezarri. Die Datenblätter gibt es nur auf Englisch.",
  datenblaetter: "Datenblätter je Kollektion",
  zertifikate: "Zertifikate und Garantie",
  alt: "Datenblätter älterer Kollektionen",
  altHinweis: "Diese Kollektionen führt Ezarri nicht mehr auf der Website.",
  kataloge: { title: "Kataloge", text: "Ezarri gibt seine acht Kataloge (unter anderem Pool & Home, Gea, Terrazzo, Gold, Aquarelle, Gemma) nur auf Anfrage heraus.", link: "Katalog anfragen" },
  quelleLink: "Original bei Ezarri",
  zertifikatListe: [
    { datei: "calidad_de_ISO9001.pdf", title: "ISO 9001 Qualitätsmanagement", sprache: "deutsch", quelle: "https://www.ezarri.com/media/pdf/area-tecnica/certificaciones/calidad/de/ISO9001.pdf" },
    { datei: "medioambientales_de_ISO-14021.pdf", title: "ISO 14021 Recyclinganteil", sprache: "deutsch", quelle: "https://www.ezarri.com/media/pdf/area-tecnica/certificaciones/medioambientales/de/ISO-14021.pdf" },
    { datei: "certificaciones_garantia-mosaicos_Ezarri_-_Warranty_on_mosaics_-_EN-2025.pdf", title: "Garantie auf Mosaike (2025)", sprache: "englisch", quelle: "https://www.ezarri.com/media/pdf/area-tecnica/certificaciones/garantia-mosaicos/Ezarri%20-%20Warranty%20on%20mosaics%20-%20EN-2025.pdf" },
  ],
});

export const SCHLUSS = Object.freeze({
  title: "Muster ansehen, Becken planen",
  text: "Im Showroom-Café in Lochau legen wir die Mosaike nebeneinander und rechnen die Menge für Ihr Projekt.",
  primary: "Termin anfragen",
  secondary: "Muster anfragen",
});

/** Labels für Typ, Oberfläche usw. (Anzeige, nicht Filter-IDs). */
export const TYP_LABEL = Object.freeze({ mosaik: "Mosaik", "safe-step": "Safe-Step, rutschhemmend", corner: "Corner, Außenecke", cove: "Cove, Hohlkehle" });
export const LINIE_LABEL = Object.freeze({ Premium: "Premium", Classic: "Classic", Custom: "Individuell" });

/** Alt-Texte (Konzept §6.3). */
export const alt = {
  mosaik: (name, format, oberflaeche) => ["Ezarri " + name, format ? `Glasmosaik ${format}` : "Glasmosaik", oberflaeche].filter(Boolean).join(", "),
  anwendung: (name, wasser) => [name ? `Projekt mit Ezarri ${name}` : "Projekt mit Ezarri-Glasmosaik", wasser].filter(Boolean).join(", "),
};
