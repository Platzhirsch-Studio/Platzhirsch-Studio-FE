// src/lib/hotel/content.js – Texte der Seite /<locale>/hotel-objekt (DE, EN;
// FR und IT seit 01.11.2026 in ./content-intl.js, Inhaber-Entscheidung).
//
// Auftrag Inhaber 29.10.2026 (Welle 2, Team Hotel). Grundlage:
// Marktresearch/digital/wachstumsrat/hotel-contract.md (Seitenkonzept 3.1,
// Rollen 2.3, Contract-Anforderungen 2.4) und der Kern-USP
// (Inhaber-Entscheidung Nr. 8, features/usp-handzeichnung-designprozess.md).
//
// Regeln für jeden Satz hier (Design-Bibel §1/§11/§14, UWG):
// - Händler-Aussage nur für Marken aus dem Claim-Register (src/lib/legal/claims.js):
//   ClassiCon und Ezarri (Entscheidung Nr. 7), seit Nr. 19/21 (31.10.2026) dazu
//   die Spa-Marken in SPA_DEALERS (Naggura nur Objektgeschäft). Agape ist nicht
//   im Register – nur „planen wir mit“. Minotti nur als „in unserer
//   Ausstellung“, nie Contract/Partner.
// - Keine Superlative, keine Preise, keine Zahlen ohne Quelle, keine
//   erfundenen Referenzen, Hotels, Zertifikate oder Zusagen (keine Antwortfrist,
//   kein „Musterzimmer im Showroom“, solange es nicht steht).
// - Normen nur allgemein und korrekt: Nachweise kommen vom Hersteller, das
//   Brandschutzkonzept des Hauses legt fest, was gilt.
// - „ein, zwei Tage vor Ort“ nur als Bedingung („wenn Ihr Projekt es braucht“).
// - Rolle von Platzhirsch: Gestaltung, lose Ausstattung, Koordination – keine
//   Bauleitung, kein Generalunternehmer (hotel-contract.md 2.3).
// - Echte Bilder: keine. Der einzige Bildplatz ist ein Ezarri-Herstellerbild
//   mit Quellenangabe (Nutzung laut Entscheidung Nr. 7 erlaubt), klar als
//   Bild des Herstellers und nicht als unser Projekt beschriftet.
//
// Reines Modul (keine "@/..."-Importe, kein React): node --test lädt es.

import { dealerStatementList } from "../legal/claims.js";
import { intlHotelCopy } from "./content-intl.js";

// Spa-Marken mit Händlerstatus laut Claim-Register (Inhaber-Entscheidungen Nr. 19/21,
// 31.10.2026). Naggura nur Objektgeschäft (Behandlungsräume). Agape ist NICHT im Register.
const SPA_DEALERS = Object.freeze(["naggura", "starpool", "soleum", "aquavia-spa", "dornbracht", "antoniolupi"]);

export const PATH = "/hotel-objekt";
/** Sprachen mit eigener Fassung (Inhaber 01.11.2026: auch FR und IT, vorher 308 → /en). */
export const HOTEL_LOCALES = Object.freeze(["de", "en", "fr", "it"]);
export const HOTEL_FALLBACK_LOCALE = "en";

/** Ezarri-Herstellerbild (Pool, Kollektion Niebla, Ezarri-Galerie). */
export const EZARRI_IMAGE = Object.freeze({
  web: "/ezarri/niebla/anw-2521-b-niebla-mosaic-pool-ezarri-3",
  width: 1600,
  height: 1200,
  source: "https://www.ezarri.com/de/galerie",
});

const DE = {
  meta: {
    title: "Hoteleinrichtung am Bodensee & in den Alpen",
    description:
      "Hotels, Chalets und Gastronomie einrichten: Handzeichnung, Modell, 3D und Musterzimmer, Möbel, Licht und Ezarri-Glasmosaik, Montage im Saisonfenster. Lochau.",
    ogEyebrow: "Hotels · Chalets · Gastronomie",
    ogTitle: "Hotel & Objekt",
    ogLine: "Von Hand gezeichnet. Für Ihre Gäste eingerichtet.",
  },
  hero: {
    crumb: "Hotel & Objekt",
    eyebrow: "Hotels · Chalets · Gastronomie",
    title: "Hotels einrichten am Bodensee und in den Alpen",
    lead: "Für Häuser in Vorarlberg, am Arlberg und rund um den Bodensee planen wir Zimmer, Lobby, Restaurant, Spa und Terrasse. Harald Menghin zeichnet das Konzept von Hand, dann folgen Modell, 3D-Planung und Rendering.",
    primary: "Projekt anfragen",
    facts: [
      { label: "Für", value: "Hotels, Chalets, Ferienwohnungen, Restaurants und Bars" },
      { label: "Vor Ort", value: "Bestandsbesuch, wenn Ihr Projekt es braucht auch ein, zwei Tage" },
      { label: "Ein Ansprechpartner", value: "Für das ganze Interieur, mit klarer Aufteilung der Gewerke" },
    ],
  },
  services: {
    eyebrow: "Leistungen",
    heading: "Vom Zimmer bis zur Seeterrasse",
    text: "Wir übernehmen Gestaltung und lose Ausstattung. Einbauten, Verlegung und Haustechnik übernehmen Fachbetriebe, mit denen wir uns abstimmen.",
    items: [
      { id: "zimmer", name: "Zimmer und Suiten", text: "Sofa, Sessel, Tische, Leuchten, Vorhänge, Teppiche und Accessoires. Bett-Rückwände und Schränke fertigt ein Tischler, wir stimmen Material und Farben ab." },
      { id: "lobby", name: "Lobby und Empfang", text: "Der erste Eindruck Ihres Hauses: Lounge-Möbel, Licht, Teppich und Akzente. Den Empfangstresen baut ein Tischler nach dem gemeinsamen Entwurf." },
      { id: "restaurant", name: "Restaurant und Bar", text: "Stühle und Tische für den täglichen Betrieb, Bar-Lounge und Licht in Szenen. Die Großküche plant Ihr Fachplaner, wir stimmen die Schnittstellen ab." },
      { id: "spa", name: "Spa und Pool mit Ezarri-Mosaik", text: "Glasmosaik von Ezarri für Pool, Dampfbad und Duschen, dazu Ruheliegen, Textilien und Licht. Die Verlegung übernimmt ein Fachbetrieb.", link: { href: "/ezarri", label: "Ezarri-Glasmosaik ansehen", deOnly: true }, more: { href: "/bad-wellness", label: "Spa- und Behandlungsräume" } },
      { id: "outdoor", name: "Terrasse, Rooftop und Garten", text: "Outdoor-Möbel, Schirme und Licht für Seeterrasse, Dachterrasse und Poolbereich. Garten und Ausführung übernehmen befugte Fachbetriebe, wir koordinieren.", link: { href: "/outdoor-gartenplanung", label: "Outdoor und Garten" } },
      { id: "yacht", name: "Hotelboot, Steg und Bootshaus", text: "Für Häuser am See mit eigenem Boot oder Bootshaus: Polster, Stoffe und lose Ausstattung mit Bootssattler und Werft, wie bei unserem Yacht-Interieur.", link: { href: "/yacht-interior", label: "Yacht-Interieur", deOnly: true } },
    ],
  },
  // Inhaber-Zusatz 29.10.2026: Chalets & Ferienwohnungen (Arlberg, Bodensee,
  // Vorarlberg). Keine Preise, keine Referenzen; Anfrage mit Kontext "chalet".
  chalets: {
    id: "chalets",
    eyebrow: "Chalets & Ferienwohnungen",
    heading: "Schlüsselfertig eingerichtet, bereit für Gäste",
    text: "Für Eigentümer und Vermieter am Arlberg, am Bodensee und in Vorarlberg: Wir richten Ihr Chalet oder Ihre Ferienwohnung komplett ein und übergeben bezugsfertig oder vermietungsfertig, auch wenn Sie selbst nicht vor Ort sind.",
    regions: [
      { name: "Arlberg", text: "Lech, Zürs, Warth, St. Anton und St. Christoph" },
      { name: "Bodensee", text: "Bregenz, Lochau, Lindau und das deutsche und Schweizer Ufer" },
      { name: "Vorarlberg", text: "Bregenzerwald, Montafon, Kleinwalsertal und Rheintal" },
    ],
    items: [
      { name: "Wohnen, Schlafen, Küche", text: "Möbel, Betten, Leuchten und Küche aus einer Planung, robust genug für wechselnde Gäste." },
      { name: "Bad und Spa mit Ezarri-Mosaik", text: "Glasmosaik von Ezarri für Dusche, Dampfbad, Whirlpool oder Pool. Die Verlegung übernimmt ein Fachbetrieb." },
      { name: "Terrasse und Outdoor", text: "Outdoor-Möbel, Schirme und Licht für Balkon, Terrasse und Garten, mit Hinweisen zur Wintereinlagerung." },
      { name: "Textilien und Ausstattung", text: "Vorhänge, Teppiche, Bettwäsche, Plaids, Kissen und Accessoires, abgestimmt auf das Konzept." },
      { name: "Übergabe", text: "Aufbau, Inventarliste und Pflegehinweise für Ihre Vermietung oder Hausverwaltung. Bezugsfertig oder vermietungsfertig, wie vereinbart." },
    ],
    note: "Sie wohnen in Deutschland, der Schweiz oder weiter weg? Planung, Muster und Freigaben gehen auch per Video und im Kundenportal.",
    cta: { href: "#anfrage-chalet", label: "Chalet oder Ferienwohnung anfragen" },
  },
  process: {
    eyebrow: "Ablauf",
    heading: "Vom Bestandsbesuch bis zur Montage im Saisonfenster",
    text: "Hotelprojekte haben feste Termine. Deshalb planen wir rückwärts vom Tag, an dem Ihre Gäste kommen, und halten fest, wer was bis wann liefert.",
    steps: [
      { title: "Bestandsbesuch", text: "Wir lernen Ihr Haus kennen: Räume, Licht im Tagesverlauf, Klima, Wege der Gäste und Abläufe im Betrieb. Wenn Ihr Projekt es braucht, bleiben wir auch ein, zwei Tage vor Ort." },
      { title: "Handzeichnung", text: "Harald Menghin skizziert Grundriss, Perspektiven und Stimmungen von Hand – für Lobby, Gastro und ein typisches Zimmer." },
      { title: "Modell", text: "Ein Raummodell im Maßstab, wie es Bauträger kennen. Am Modell klären Sie mit Ihrem Team Proportionen und Wege, bevor digital geplant wird." },
      { title: "3D-Planung", text: "Die digitale Planung mit exakten Maßen, Produkten und Materialien. Auf Wunsch mit Ihrem Architekten abgestimmt." },
      { title: "Rendering", text: "Fotorealistische Bilder der Räume, bevor etwas bestellt wird. Ihr Feedback geben Sie im Kundenportal, auch per Sprachnachricht." },
      { title: "Musterzimmer", text: "Ein Zimmer oder eine Suite wird vorab vollständig eingerichtet, in Ihrem Haus. Sie testen mit Team und Stammgästen, bevor in Serie bestellt wird." },
      { title: "Liste und Angebot", text: "Jedes Stück mit Menge, Maß, Material, Nachweisen des Herstellers und Lieferzeit. Daraus entsteht das Angebot für die lose Ausstattung." },
      { title: "Montage im Saisonfenster", text: "Lieferung nach Etagenplan, Aufbau der losen Möbel und Abnahme Raum für Raum – zwischen den Saisonen oder vor der Eröffnung. Danach sind wir für Nachkauf und Ersatz da." },
    ],
    note: "Viele Polstermöbel haben Lieferzeiten von mehreren Monaten. In den Bergen wird meist zwischen den Saisonen montiert, am See oft im Winter. Sprechen Sie uns deshalb früh an.",
    link: { href: "/arbeitsweise", label: "Unsere Arbeitsweise: von der Handzeichnung zum Rendering" },
  },
  sampleRoom: {
    eyebrow: "Musterzimmer",
    heading: "Erst ein Zimmer, dann die Serie",
    text: "Im Musterzimmer fallen Fehler bei Maßen, Licht oder Bezügen in einem Raum auf – nicht in allen. Ihr Team prüft Wege und Reinigung, Stammgäste sagen, wie es sich anfühlt.",
    points: [
      "Ein Zimmer oder eine Suite in Ihrem Haus, vollständig eingerichtet",
      "Stoffe, Hölzer, Oberflächen und Leuchten vorab im Original in unserem Showroom in Lochau",
      "Änderungen fließen in die Liste, bevor in Serie bestellt wird",
    ],
  },
  roles: {
    eyebrow: "Wer macht was",
    heading: "Ein Ansprechpartner, klare Zuständigkeiten",
    text: "Im Angebot steht für jede Leistung, wer sie erbringt und mit wem Sie den Vertrag schließen.",
    taskLabel: "Leistung",
    whoLabel: "Wer",
    rows: [
      { task: "Konzept, Handzeichnung, Modell, 3D-Planung, Rendering, Musterzimmer", who: "Platzhirsch" },
      { task: "Möbel, Leuchten, Teppiche, Stoffe, Outdoor und Accessoires", who: "Platzhirsch" },
      { task: "Glasmosaik für Pool und Spa (Ezarri)", who: "Platzhirsch liefert, ein Fachbetrieb verlegt" },
      { task: "Einbauten wie Empfang, Bett-Rückwände, Schränke", who: "Tischler aus der Region, abgestimmt mit uns" },
      { task: "Großküche, Lüftung, Elektro, Brandschutzkonzept", who: "Ihre Fachplaner und Ihr Architekt" },
      { task: "Bauleitung", who: "Ihr Architekt oder Bauherr – wir stimmen uns mit ihm ab" },
    ],
  },
  quality: {
    eyebrow: "Für den Dauerbetrieb",
    heading: "Was im Hotel zählt",
    text: "Ein Sofa in der Lobby ist von früh bis spät in Gebrauch. Für jedes Stück auf der Liste holen wir die Nachweise beim Hersteller ein. Welche Werte Ihr Haus braucht, legt Ihr Brandschutzkonzept fest.",
    items: [
      { name: "Brandschutz", text: "Prüfnachweise des Herstellers für Polster, etwa nach EN 1021-1 und -2 (Zigarette und Streichholz), und für Vorhang- und Wandstoffe die passende Baustoffklasse." },
      { name: "Strapazierfähigkeit", text: "Scheuerwerte der Bezugsstoffe (Martindale) und Lichtechtheit laut Datenblatt. Für Sitzmöbel und Tische im Objektbereich die Prüfnorm des Herstellers, etwa EN 16139 und EN 15372." },
      { name: "Nachkauf", text: "Vor der Bestellung klären wir, wie lange ein Modell lieferbar ist, und empfehlen abnehmbare Bezüge und Ersatzbezüge für stark genutzte Polster." },
      { name: "Pflege", text: "Zu jedem Projekt gibt es Pflegehinweise für Ihr Housekeeping: Reinigung, Flecken, Einlagerung der Outdoor-Möbel im Winter." },
      { name: "Nass- und Barfußbereiche", text: "Für Pool und Spa wählen wir Mosaik mit den Rutschhemmwerten, die Ihr Bereich braucht – nach Datenblatt des Herstellers." },
    ],
    note: "Wir planen nur mit Modellen, für die der Hersteller die nötigen Nachweise liefern kann. Zertifikate stellen die Hersteller und Prüfstellen aus, nicht wir.",
  },
  brands: {
    eyebrow: "Marken und Material",
    heading: "Aus unserem Sortiment, für Ihr Haus",
    // Händler-Satz nur aus dem Claim-Register (src/lib/legal/claims.js), QA Welle 2 P1-1.
    dealer: dealerStatementList(["classicon", "ezarri", ...SPA_DEALERS], "de"),
    // solange EZARRI_PUBLIC aus ist (src/lib/ezarri/config.js): ohne Ezarri-Aussage
    dealerNoEzarri: dealerStatementList(["classicon", ...SPA_DEALERS], "de"),
    text: "Dazu kommen Objektstühle, Outdoor-Marken und Leuchten aus unserem Sortiment. In unserer Ausstellung in Lochau sehen Sie Möbel von Minotti, ClassiCon und weiteren Herstellern im Original.",
    ezarriCaption: "Glasmosaik von Ezarri in einem Pool. Ein Bild des Herstellers, kein Projekt von Platzhirsch.",
    ezarriAlt: "Pool mit hellblauem Glasmosaik von Ezarri, Kollektion Niebla",
    ezarriCredit: "Bild: Ezarri, ezarri.com",
    ezarriNote: "Ezarri zeigt auf der eigenen Website Hotelprojekte des Herstellers.",
    ezarriLink: { href: "https://www.ezarri.com/de", label: "Zur Website von Ezarri" },
  },
  references: {
    eyebrow: "Projekte",
    heading: "Häuser, die wir eingerichtet haben",
    text: "Wir zeigen nur Projekte, deren Gastgeber der Veröffentlichung schriftlich zugestimmt haben.",
  },
  area: {
    eyebrow: "Einsatzgebiet",
    heading: "Von Lochau an den See und in die Berge",
    text: "Bodensee mit österreichischem, deutschem und Schweizer Ufer, Vorarlberg mit Bregenzerwald und Montafon, der Arlberg mit Lech, Zürs und St. Anton, Liechtenstein und die Ostschweiz. Lieferung und Montage klären wir für jedes Projekt.",
  },
  form: {
    id: "anfrage",
    eyebrow: "Projektanfrage",
    heading: "Erzählen Sie uns von Ihrem Haus",
    text: "Ein paar Angaben genügen. Wir melden uns persönlich mit einem Vorschlag für einen Bestandsbesuch oder ein Gespräch im Showroom.",
    required: "Felder mit * brauchen wir für die Anfrage.",
    optional: "(optional)",
    fields: {
      haus: "Name des Hauses",
      ort: "Ort",
      art: "Art des Hauses",
      zimmer: "Zimmer oder Einheiten",
      zimmerHint: "Ungefähre Zahl genügt.",
      bereiche: "Welche Bereiche?",
      zeitfenster: "Zeitfenster",
      zeitfensterHint: "Bis wann soll eingerichtet sein?",
      rolle: "Ihre Rolle",
      vorname: "Vorname",
      nachname: "Nachname",
      firma: "Firma",
      email: "E-Mail",
      telefon: "Telefon",
      nachricht: "Nachricht",
      nachrichtHint: "Zum Beispiel Umbau, Eröffnung, Saison oder was schon feststeht.",
    },
    choose: "Bitte wählen",
    art: [
      { value: "hotel", label: "Hotel" },
      { value: "chalet", label: "Chalet oder Ferienwohnungen" },
      { value: "apartment", label: "Apartmenthaus" },
      { value: "gastro", label: "Restaurant, Bar oder Café" },
      { value: "anderes", label: "Anderes" },
    ],
    bereiche: [
      { value: "zimmer", label: "Zimmer und Suiten" },
      { value: "lobby", label: "Lobby und Empfang" },
      { value: "restaurant", label: "Restaurant und Bar" },
      { value: "spa", label: "Spa und Pool" },
      { value: "outdoor", label: "Terrasse und Outdoor" },
      { value: "boot", label: "Boot oder Bootshaus" },
    ],
    zeitfenster: [
      { value: "6", label: "In den nächsten 6 Monaten" },
      { value: "12", label: "In 6 bis 12 Monaten" },
      { value: "24", label: "In 12 bis 24 Monaten" },
      { value: "offen", label: "Später oder noch offen" },
    ],
    rolle: [
      { value: "eigentuemer", label: "Eigentümer oder Betreiber" },
      { value: "architektur", label: "Architektur oder Planung" },
      { value: "entwicklung", label: "Projektentwicklung" },
      { value: "andere", label: "Andere" },
    ],
    errors: {
      haus: "Bitte geben Sie den Namen des Hauses an.",
      ort: "Bitte geben Sie den Ort an.",
      art: "Bitte wählen Sie die Art des Hauses.",
      zimmer: "Bitte geben Sie eine Zahl zwischen 1 und 2000 an.",
      zeitfenster: "Bitte wählen Sie ein Zeitfenster.",
      vorname: "Bitte geben Sie Ihren Vornamen an.",
      nachname: "Bitte geben Sie Ihren Nachnamen an.",
      email: "Bitte prüfen Sie die E-Mail-Adresse, zum Beispiel name@beispiel.at.",
      emailMissing: "Bitte geben Sie Ihre E-Mail-Adresse an.",
      telefon: "Bitte prüfen Sie die Telefonnummer (6 bis 20 Ziffern).",
      server: "Bitte prüfen Sie diese Angabe.",
    },
    summaryTitle: "Bitte prüfen Sie Ihre Angaben",
    send: "Anfrage senden",
    sending: "Wird gesendet …",
    successTitle: "Anfrage angekommen",
    success: "Danke, {name}. Ihre Anfrage für {haus} ist bei uns angekommen. Wir melden uns persönlich bei Ihnen.",
    again: "Weitere Anfrage",
    termin: { label: "Lieber gleich einen Termin anfragen", text: "Im Showroom in Lochau, bei Ihnen vor Ort oder per Video." },
    // Erste Zeile im Freitext ans Backoffice (Thema + Herkunft, r8-leads).
    messageTitle: "[Anfrage Hotel & Objekt]",
    messageTitles: { hotel: "[Anfrage Hotel & Objekt]", chalet: "[Anfrage Chalet & Ferienwohnung]" },
    // Schritt 2 im Backoffice bei Kontext "chalet" (Freitext wie die Wizard-Beschriftungen).
    placeChalet: "in einem Chalet oder einer Ferienwohnung",
    messageLabels: { haus: "Haus", ort: "Ort", art: "Art", zimmer: "Zimmer/Einheiten", bereiche: "Bereiche", zeitfenster: "Zeitfenster", rolle: "Rolle", firma: "Firma", nachricht: "Nachricht" },
    pageContext: "Seite: Hotel & Objekt",
  },
  faq: {
    name: "hotel-faq",
    heading: "Fragen zur Hotel- und Gastroeinrichtung",
    items: [
      { q: "Richten Sie ein Hotel komplett ein?", a: "Wir planen das Interieur komplett und liefern die lose Ausstattung: Möbel, Leuchten, Teppiche, Stoffe, Outdoor und Glasmosaik. Einbauten, Verlegung und Haustechnik übernehmen Fachbetriebe, die wir koordinieren. So haben Sie für das Interieur einen Ansprechpartner, und jede Leistung liegt bei einem Spezialisten." },
      { q: "Übernehmen Sie die Bauleitung?", a: "Nein. Die Bauleitung bleibt bei Ihrem Architekten oder Bauherrn. Wir stimmen Termine, Anlieferung und Montage der Einrichtung mit ihm und den Fachbetrieben ab." },
      { q: "Warum zeichnet Harald Menghin von Hand?", a: "Eine Handzeichnung zeigt früh, wie ein Raum wirken soll, ohne sich in Details zu verlieren. Zusammen mit dem Modell lassen sich Proportionen und Wege mit Ihrem Team schnell klären. Danach planen wir in 3D und zeigen Ihnen fotorealistische Bilder, bevor etwas bestellt wird." },
      { q: "Sind die Möbel für Hotels geeignet und brandschutzgeprüft?", a: "Wir planen für Hotels nur mit Modellen, für die der Hersteller die nötigen Nachweise liefern kann, etwa Prüfungen der Polster nach EN 1021-1 und -2 und Scheuerwerte der Bezüge. Welche Werte Ihr Haus braucht, legt Ihr Brandschutzkonzept fest. Die Nachweise stehen in der Liste zum Angebot." },
      { q: "Was bedeutet „B1“ bei Hotelmöbeln?", a: "B1 nach DIN 4102 ist eine deutsche Klasse für Baustoffe, zum Beispiel für Vorhangstoffe oder Wandbespannungen. In Österreich gilt die europäische Einteilung nach EN 13501-1 in Verbindung mit der OIB-Richtlinie 2, in der Schweiz gelten die VKF-Brandschutzvorschriften. Polstermöbel bestehen aus mehreren Materialien und werden als Ganzes geprüft, meist nach EN 1021. Wir klären mit Ihrem Brandschutzplaner, welcher Nachweis für welches Stück gilt." },
      { q: "Was ist ein Musterzimmer und lohnt es sich?", a: "Im Musterzimmer wird ein Zimmer vorab vollständig eingerichtet. Sie, Ihr Team und Stammgäste testen es, bevor in Serie bestellt wird. Fehler bei Maßen, Licht oder Bezügen fallen so in einem Zimmer auf und nicht in allen." },
      { q: "Wann sollten wir anfangen?", a: "Möglichst früh. Viele Polstermöbel haben Lieferzeiten von mehreren Monaten, und in den Bergen wird meist zwischen den Saisonen montiert, am See oft im Winter. Wir planen rückwärts vom Termin, an dem Ihre Gäste kommen." },
      { q: "Können wir in Etappen einrichten?", a: "Ja. Viele Häuser beginnen mit Terrasse oder Bar und erneuern danach Zimmer und Lobby. Wir planen das Gesamtkonzept so, dass jede Etappe für sich fertig aussieht." },
      { q: "Helfen Sie bei Förderanträgen?", a: "Wir liefern eine Liste mit Kosten je Bereich, die Sie für einen Antrag verwenden können. Viele Programme verlangen, dass der Antrag vor der Auftragsvergabe gestellt wird. Über die Förderung entscheidet die Förderstelle. Wir beraten nicht zu Förderung, Steuern oder Recht; bitte stimmen Sie den Antrag mit Ihrer Bank ab." },
      { q: "Liefern Sie auch nach Deutschland, Liechtenstein und in die Schweiz?", a: "Lieferung und Montage klären wir für jedes Projekt. Für Liechtenstein und die Schweiz gehört die Verzollung dazu. Die Einzelheiten und Kosten stehen im Angebot." },
      { q: "Richten Sie auch einzelne Ferienwohnungen oder ein Chalet ein?", a: "Ja, von der einzelnen Ferienwohnung bis zum Chalet, mit Küche, Textilien und Accessoires. Wir übergeben bezugsfertig, auch wenn Sie selbst nicht vor Ort sind." },
    ],
  },
  showroom: {
    heading: "Material sehen, Platz nehmen",
    text: "Stoffe, Hölzer, Oberflächen, Leuchten und Glasmosaik sehen Sie bei uns im Original. Bringen Sie Ihr Team mit – für Projektgespräche bitte mit Termin.",
  },
  closing: {
    heading: "Termin für Ihr Haus",
    text: "Im Showroom mit Café in Lochau, bei Ihnen vor Ort oder per Video. Bringen Sie Pläne, Fotos und Ihren Zeitplan mit.",
    primary: "Termin anfragen",
    secondary: "Kontakt",
  },
  schema: {
    serviceName: "Hotel- und Objekteinrichtung",
    serviceType: "Einrichtung von Hotels, Chalets, Ferienwohnungen und Gastronomie",
    description:
      "Konzept mit Handzeichnung, Modell, 3D-Planung und Rendering, Musterzimmer, Lieferung und Montage loser Ausstattung für Hotels und Gastronomie; Einbauten und Verlegung durch koordinierte Fachbetriebe.",
    areaServed: ["Vorarlberg", "Tirol", "Bayern", "Baden-Württemberg", "Liechtenstein", "Kanton St. Gallen", "Kanton Thurgau"],
  },
};

const EN = {
  meta: {
    title: "Hotel interiors on Lake Constance & in the Alps",
    description:
      "Furnishing hotels, chalets and restaurants: hand drawing, model, 3D and a sample room, furniture, lighting and Ezarri glass mosaic, installed between seasons.",
    ogEyebrow: "Hotels · Chalets · Restaurants",
    ogTitle: "Hotels & hospitality",
    ogLine: "Drawn by hand. Furnished for your guests.",
  },
  hero: {
    crumb: "Hotels & hospitality",
    eyebrow: "Hotels · Chalets · Restaurants",
    title: "Hotel interiors on Lake Constance and in the Alps",
    lead: "For hotels in Vorarlberg, on the Arlberg and around Lake Constance we plan rooms, lobby, restaurant, spa and terrace. Harald Menghin draws the concept by hand, followed by a model, 3D planning and rendering.",
    primary: "Enquire about a project",
    facts: [
      { label: "For", value: "Hotels, chalets, holiday apartments, restaurants and bars" },
      { label: "On site", value: "A visit to your property – one or two days if your project needs it" },
      { label: "One contact", value: "For the whole interior, with a clear split between trades" },
    ],
  },
  services: {
    eyebrow: "Services",
    heading: "From the guest room to the lake terrace",
    text: "We take care of design and loose furnishings. Built-in joinery, tiling and building services are handled by specialist firms we coordinate with.",
    items: [
      { id: "zimmer", name: "Rooms and suites", text: "Sofas, armchairs, tables, lighting, curtains, rugs and accessories. Headboards and wardrobes are made by a joiner; we coordinate materials and colours." },
      { id: "lobby", name: "Lobby and reception", text: "The first impression of your hotel: lounge furniture, lighting, rugs and accents. The reception desk is built by a joiner to the shared design." },
      { id: "restaurant", name: "Restaurant and bar", text: "Chairs and tables for daily service, a bar lounge and lighting scenes. Your specialist plans the commercial kitchen; we coordinate the interfaces." },
      { id: "spa", name: "Spa and pool with Ezarri mosaic", text: "Ezarri glass mosaic for pools, steam rooms and showers, plus loungers, textiles and lighting. Installation is carried out by a specialist tiler.", link: { href: "/ezarri", label: "Ezarri glass mosaic", deOnly: false }, more: { href: "/bad-wellness", label: "Spa and treatment rooms" } },
      { id: "outdoor", name: "Terrace, rooftop and garden", text: "Outdoor furniture, parasols and lighting for lake terraces, rooftops and pool areas. Licensed firms handle the garden and construction; we coordinate.", link: { href: "/outdoor-gartenplanung", label: "Outdoor and garden" } },
      { id: "yacht", name: "Hotel boat, jetty and boathouse", text: "For lakeside hotels with their own boat or boathouse: upholstery, fabrics and loose furnishings with a boat upholsterer and the shipyard.", link: { href: "/yacht-interior", label: "Yacht interiors", deOnly: false } },
    ],
  },
  chalets: {
    id: "chalets",
    eyebrow: "Chalets & holiday apartments",
    heading: "Furnished turnkey, ready for guests",
    text: "For owners and landlords on the Arlberg, at Lake Constance and in Vorarlberg: we furnish your chalet or holiday apartment completely and hand it over ready to move in or ready to let, even if you are not there yourself.",
    regions: [
      { name: "Arlberg", text: "Lech, Zürs, Warth, St. Anton and St. Christoph" },
      { name: "Lake Constance", text: "Bregenz, Lochau, Lindau and the German and Swiss shores" },
      { name: "Vorarlberg", text: "Bregenzerwald, Montafon, Kleinwalsertal and the Rhine valley" },
    ],
    items: [
      { name: "Living, sleeping, kitchen", text: "Furniture, beds, lighting and kitchen from one plan, robust enough for changing guests." },
      { name: "Bathroom and spa with Ezarri mosaic", text: "Ezarri glass mosaic for shower, steam room, hot tub or pool. A specialist contractor lays it." },
      { name: "Terrace and outdoor", text: "Outdoor furniture, parasols and lighting for balcony, terrace and garden, with advice on winter storage." },
      { name: "Textiles and equipment", text: "Curtains, rugs, bed linen, throws, cushions and accessories, matched to the concept." },
      { name: "Handover", text: "Assembly, an inventory list and care notes for your letting agency or property manager. Ready to move in or ready to let, as agreed." },
    ],
    note: "You live in Germany, Switzerland or further away? Planning, samples and approvals also work by video and in the customer portal.",
    cta: { href: "#anfrage-chalet", label: "Enquire about a chalet or apartment" },
  },
  process: {
    eyebrow: "Process",
    heading: "From the first site visit to installation between seasons",
    text: "Hotel projects have fixed dates. That is why we plan backwards from the day your guests arrive and record who delivers what, and when.",
    steps: [
      { title: "Site visit", text: "We get to know your property: rooms, daylight through the day, climate, guest routes and how service runs. If your project needs it, we stay on site for one or two days." },
      { title: "Hand drawing", text: "Harald Menghin sketches floor plans, perspectives and moods by hand – for the lobby, food and beverage areas and a typical guest room." },
      { title: "Model", text: "A scale model of the space, as property developers use. With the model you and your team settle proportions and routes before the digital planning starts." },
      { title: "3D planning", text: "Digital planning with exact dimensions, products and materials, coordinated with your architect if you wish." },
      { title: "Rendering", text: "Photorealistic images of the spaces before anything is ordered. You give feedback in the client portal, voice messages included." },
      { title: "Sample room", text: "One room or suite is fully furnished in advance, in your hotel. You test it with your team and regular guests before the series is ordered." },
      { title: "List and quotation", text: "Every piece with quantity, size, material, the manufacturer's test certificates and lead time. This becomes the quotation for the loose furnishings." },
      { title: "Installation between seasons", text: "Delivery by floor plan, assembly of the loose furniture and handover room by room – between seasons or before opening. Afterwards we are there for reorders and replacements." },
    ],
    note: "Many upholstered pieces have lead times of several months. In the mountains installation usually happens between seasons, on the lake often in winter. So talk to us early.",
    link: { href: "/arbeitsweise", label: "How we work: from hand drawing to rendering" },
  },
  sampleRoom: {
    eyebrow: "Sample room",
    heading: "One room first, then the series",
    text: "In a sample room, mistakes in dimensions, lighting or covers show up in one room – not in all of them. Your team checks routes and cleaning, regular guests tell you how it feels.",
    points: [
      "One room or suite in your hotel, fully furnished",
      "Fabrics, woods, finishes and lighting in the original beforehand, in our showroom in Lochau",
      "Changes go into the list before the series is ordered",
    ],
  },
  roles: {
    eyebrow: "Who does what",
    heading: "One contact, clear responsibilities",
    text: "For every service, the quotation states who provides it and with whom you sign the contract.",
    taskLabel: "Service",
    whoLabel: "Who",
    rows: [
      { task: "Concept, hand drawing, model, 3D planning, rendering, sample room", who: "Platzhirsch" },
      { task: "Furniture, lighting, rugs, fabrics, outdoor and accessories", who: "Platzhirsch" },
      { task: "Glass mosaic for pool and spa (Ezarri)", who: "Platzhirsch supplies, a specialist tiler installs" },
      { task: "Built-ins such as reception, headboards, wardrobes", who: "Regional joiners, coordinated with us" },
      { task: "Commercial kitchen, ventilation, electrics, fire safety concept", who: "Your specialist planners and your architect" },
      { task: "Site management", who: "Your architect or client – we coordinate with them" },
    ],
  },
  quality: {
    eyebrow: "Built for daily service",
    heading: "What counts in a hotel",
    text: "A lobby sofa is in use from morning to night. For every piece on the list we obtain the test certificates from the manufacturer. Your fire safety concept defines which values your property needs.",
    items: [
      { name: "Fire safety", text: "Manufacturer test certificates for upholstery, for example to EN 1021-1 and -2 (cigarette and match), and the appropriate building material class for curtain and wall fabrics." },
      { name: "Durability", text: "Abrasion values of cover fabrics (Martindale) and light fastness from the data sheet. For seating and tables in contract use, the manufacturer's test standard, for example EN 16139 and EN 15372." },
      { name: "Reorders", text: "Before ordering we check how long a model will remain available and recommend removable covers and spare covers for heavily used upholstery." },
      { name: "Care", text: "Every project comes with care notes for your housekeeping: cleaning, stains and winter storage of outdoor furniture." },
      { name: "Wet and barefoot areas", text: "For pool and spa we choose mosaic with the slip resistance your area needs – according to the manufacturer's data sheet." },
    ],
    note: "We only plan with models for which the manufacturer can supply the required evidence. Certificates are issued by manufacturers and test institutes, not by us.",
  },
  brands: {
    eyebrow: "Brands and materials",
    heading: "From our range, for your property",
    dealer: dealerStatementList(["classicon", "ezarri", ...SPA_DEALERS], "en"),
    dealerNoEzarri: dealerStatementList(["classicon", ...SPA_DEALERS], "en"),
    text: "In addition there are contract chairs, outdoor brands and lighting from our range. In our showroom in Lochau you can see furniture by Minotti, ClassiCon and other manufacturers in the original.",
    ezarriCaption: "Ezarri glass mosaic in a pool. A manufacturer's image, not a Platzhirsch project.",
    ezarriAlt: "Pool with light blue Ezarri glass mosaic, Niebla collection",
    ezarriCredit: "Image: Ezarri, ezarri.com",
    ezarriNote: "On its own website Ezarri shows the manufacturer's hotel projects.",
    ezarriLink: { href: "https://www.ezarri.com/en", label: "Visit the Ezarri website" },
  },
  references: {
    eyebrow: "Projects",
    heading: "Properties we have furnished",
    text: "We only show projects whose hosts have agreed to publication in writing.",
  },
  area: {
    eyebrow: "Where we work",
    heading: "From Lochau to the lake and the mountains",
    text: "Lake Constance with its Austrian, German and Swiss shores, Vorarlberg with the Bregenzerwald and Montafon, the Arlberg with Lech, Zürs and St. Anton, Liechtenstein and Eastern Switzerland. Delivery and installation are agreed for each project.",
  },
  form: {
    id: "anfrage",
    eyebrow: "Project enquiry",
    heading: "Tell us about your property",
    text: "A few details are enough. We will get back to you personally with a proposal for a site visit or a meeting in the showroom.",
    required: "We need the fields marked * for your enquiry.",
    optional: "(optional)",
    fields: {
      haus: "Name of the hotel or property",
      ort: "Location",
      art: "Type of property",
      zimmer: "Rooms or units",
      zimmerHint: "An approximate number is fine.",
      bereiche: "Which areas?",
      zeitfenster: "Time frame",
      zeitfensterHint: "When should the interior be ready?",
      rolle: "Your role",
      vorname: "First name",
      nachname: "Last name",
      firma: "Company",
      email: "Email",
      telefon: "Phone",
      nachricht: "Message",
      nachrichtHint: "For example renovation, opening, season or what has already been decided.",
    },
    choose: "Please choose",
    art: [
      { value: "hotel", label: "Hotel" },
      { value: "chalet", label: "Chalet or holiday apartments" },
      { value: "apartment", label: "Apartment building" },
      { value: "gastro", label: "Restaurant, bar or café" },
      { value: "anderes", label: "Other" },
    ],
    bereiche: [
      { value: "zimmer", label: "Rooms and suites" },
      { value: "lobby", label: "Lobby and reception" },
      { value: "restaurant", label: "Restaurant and bar" },
      { value: "spa", label: "Spa and pool" },
      { value: "outdoor", label: "Terrace and outdoor" },
      { value: "boot", label: "Boat or boathouse" },
    ],
    zeitfenster: [
      { value: "6", label: "Within the next 6 months" },
      { value: "12", label: "In 6 to 12 months" },
      { value: "24", label: "In 12 to 24 months" },
      { value: "offen", label: "Later or not yet decided" },
    ],
    rolle: [
      { value: "eigentuemer", label: "Owner or operator" },
      { value: "architektur", label: "Architecture or planning" },
      { value: "entwicklung", label: "Property development" },
      { value: "andere", label: "Other" },
    ],
    errors: {
      haus: "Please enter the name of the hotel or property.",
      ort: "Please enter the location.",
      art: "Please choose the type of property.",
      zimmer: "Please enter a number between 1 and 2000.",
      zeitfenster: "Please choose a time frame.",
      vorname: "Please enter your first name.",
      nachname: "Please enter your last name.",
      email: "Please check the email address, for example name@example.com.",
      emailMissing: "Please enter your email address.",
      telefon: "Please check the phone number (6 to 20 digits).",
      server: "Please check this entry.",
    },
    summaryTitle: "Please check your details",
    send: "Send enquiry",
    sending: "Sending …",
    successTitle: "Enquiry received",
    success: "Thank you, {name}. Your enquiry for {haus} has reached us. We will get back to you personally.",
    again: "Another enquiry",
    termin: { label: "Request an appointment instead", text: "In our showroom in Lochau, on site at your property or by video." },
    messageTitle: "[Anfrage Hotel & Objekt]",
    messageTitles: { hotel: "[Anfrage Hotel & Objekt]", chalet: "[Anfrage Chalet & Ferienwohnung]" },
    placeChalet: "in a chalet or holiday apartment",
    messageLabels: { haus: "Haus", ort: "Ort", art: "Art", zimmer: "Zimmer/Einheiten", bereiche: "Bereiche", zeitfenster: "Zeitfenster", rolle: "Rolle", firma: "Firma", nachricht: "Nachricht" },
    pageContext: "Seite: Hotel & Objekt (EN)",
  },
  faq: {
    name: "hotel-faq",
    heading: "Questions about hotel and restaurant interiors",
    items: [
      { q: "Do you furnish a hotel completely?", a: "We plan the whole interior and supply the loose furnishings: furniture, lighting, rugs, fabrics, outdoor and glass mosaic. Built-ins, tiling and building services are carried out by specialist firms that we coordinate. You have one contact for the interior, and every task is in the hands of a specialist." },
      { q: "Do you take on site management?", a: "No. Site management stays with your architect or client. We coordinate dates, delivery and installation of the furnishings with them and the specialist firms." },
      { q: "Why does Harald Menghin draw by hand?", a: "A hand drawing shows early on how a space should feel, without getting lost in detail. Together with the model, proportions and routes can be settled quickly with your team. Then we plan in 3D and show you photorealistic images before anything is ordered." },
      { q: "Is the furniture suitable for hotels and fire tested?", a: "For hotels we only plan with models for which the manufacturer can supply the required evidence, for example upholstery tests to EN 1021-1 and -2 and abrasion values of the covers. Your fire safety concept defines which values your property needs. The certificates are listed with the quotation." },
      { q: "What does “B1” mean for hotel furniture?", a: "B1 under DIN 4102 is a German class for building materials, such as curtain fabrics or wall coverings. In Austria the European classification to EN 13501-1 applies together with OIB Guideline 2; in Switzerland the VKF fire protection regulations apply. Upholstered furniture consists of several materials and is tested as a whole, usually to EN 1021. We clarify with your fire safety planner which evidence applies to which piece." },
      { q: "What is a sample room and is it worth it?", a: "In a sample room one room is fully furnished in advance. You, your team and regular guests test it before the series is ordered. Mistakes in dimensions, lighting or covers show up in one room rather than in all of them." },
      { q: "When should we start?", a: "As early as possible. Many upholstered pieces have lead times of several months, and in the mountains installation usually happens between seasons, on the lake often in winter. We plan backwards from the date your guests arrive." },
      { q: "Can we furnish in stages?", a: "Yes. Many hotels start with the terrace or bar and then renew rooms and lobby. We plan the overall concept so that each stage looks finished on its own." },
      { q: "Do you help with funding applications?", a: "We provide a list with costs per area that you can use for an application. Many programmes require the application to be filed before contracts are awarded. The funding body decides on funding. We do not give funding, tax or legal advice; please agree the application with your bank." },
      { q: "Do you deliver to Germany, Liechtenstein and Switzerland?", a: "Delivery and installation are agreed for each project. For Liechtenstein and Switzerland this includes customs clearance. The details and costs are set out in the quotation." },
      { q: "Do you also furnish individual holiday apartments or a chalet?", a: "Yes, from a single holiday apartment to a chalet, including kitchen, textiles and accessories. We hand over ready to move in, even if you are not on site yourself." },
    ],
  },
  showroom: {
    heading: "See the materials, take a seat",
    text: "Fabrics, woods, finishes, lighting and glass mosaic are on show in the original. Bring your team – for project meetings please make an appointment.",
  },
  closing: {
    heading: "An appointment for your property",
    text: "In our showroom with café in Lochau, on site at your property or by video. Bring plans, photos and your schedule.",
    primary: "Request an appointment",
    secondary: "Contact",
  },
  schema: {
    serviceName: "Hotel and hospitality interiors",
    serviceType: "Interior design and furnishing for hotels, chalets, holiday apartments and restaurants",
    description:
      "Concept with hand drawing, model, 3D planning and rendering, sample room, delivery and installation of loose furnishings for hotels and restaurants; built-ins and tiling by coordinated specialist firms.",
    areaServed: ["Vorarlberg", "Tyrol", "Bavaria", "Baden-Württemberg", "Liechtenstein", "Canton of St. Gallen", "Canton of Thurgau"],
  },
};

// FR/IT: Händler-Satz aus demselben Claim-Register wie DE/EN.
const INTL = intlHotelCopy((locale, withEzarri) =>
  dealerStatementList(withEzarri ? ["classicon", "ezarri", ...SPA_DEALERS] : ["classicon", ...SPA_DEALERS], locale)
);

const COPY = Object.freeze({ de: DE, en: EN, fr: INTL.fr, it: INTL.it });

/** Texte einer Sprache (DE/EN/FR/IT); andere Sprachen bekommen null. */
export function hotelCopy(locale) {
  return COPY[locale] || null;
}

/** Die Sprache, in der eine Anfrage nach `locale` beantwortet wird. */
export function hotelLocale(locale) {
  return HOTEL_LOCALES.includes(locale) ? locale : HOTEL_FALLBACK_LOCALE;
}
