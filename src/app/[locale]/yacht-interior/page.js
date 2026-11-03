// /de/yacht-interior and /en/yacht-interior — Yacht- und Boots-Interior,
// Signature "Die Werfthalle". Welle 2 (team EN-Yacht-Sofa, 29.10.2026): German
// and English. English copy: src/lib/yacht/content-en.js (page texts),
// src/lib/yacht/concepts-en.js (concepts, zones, products, image alts),
// src/lib/yacht/ui.js (component strings). 01.11.2026: French and Italian
// (src/lib/yacht/content-intl.js, concepts-fr.js, concepts-it.js) – the 308
// FR/IT → /de (src/lib/seo/deOnlyRedirects.cjs, FR_IT_ONLY_EXACT) is removed by
// the integration. hreflang: the site-wide set for de/en/fr/it + x-default (= de);
// each language its own canonical. Layout: src/components/Yacht/YachtPage.js (R7-P4,
// shorter page, AI images card-sized, no "Beach Club"),
// 3D island: src/components/Yacht/Werfthalle.js (lazy, three.js only after
// visibility/click). Concepts and products: src/lib/yacht/concepts.json,
// checked live against the backoffice (src/lib/yacht/catalog.js); AI concept
// images: src/lib/yacht/renders.json (only Blender renderings since 03.11.2026, captioned).
// Robots: index, follow again since the integration (Inhaber-Entscheidung
// Nr. 9, 28.10.2026: what is legally missing is solved inside the page, not by
// hiding it). The Minotti × Custom Line Navetta 42 photos are released in
// writing (mail 28.10.2026, Inhaber-Entscheidung Nr. 11) → the chapter is
// shown (NAVETTA_RELEASED = true in src/lib/yacht/navetta.js), photos
// unchanged with credit, served from public/labs/yacht/minotti-navetta42. Listed in
// src/lib/seo/sitemap/extraPages.js (sitemap + /llms.txt).
// JSON-LD: WebPage + Service + FAQPage.
// Wording rules (Marktresearch/29-geschaeftsfeld-yacht-interior.md §8): no
// "Nr. 1", no dealer/partner claims, no "marine-zertifiziert", no
// "Bauleitung", no prices, no invented references; boat trades are called
// "Bootssattler", "Werft" or "Fachbetriebe".
import { notFound } from "next/navigation";
import { landingMetadata, titleWithSuffix } from "@/components/Landing/landingPage";
import { clampDescription, localeUrl, ogLocale, seoAlternates, titleWithSuffix as titleWithSuffix60 } from "@/lib/seo/pageMetadata";
import { YACHT_LOCALES, yachtLanguages } from "@/lib/yacht/seo";
import { CONTENT_EN, META_EN } from "@/lib/yacht/content-en";
import { YACHT_INTL } from "@/lib/yacht/content-intl";
import { localizeConcepts } from "@/lib/yacht/concepts-en";
import { OG_CARDS } from "@/lib/yacht/ogCardEn";
import YachtPage from "@/components/Yacht/YachtPage";
import concepts from "@/lib/yacht/concepts.json";
import renders from "@/lib/yacht/renders.json";
import { withLiveCatalog } from "@/lib/yacht/catalog";
import { buildConcepts } from "@/lib/yacht/model";

const PATH = "/yacht-interior";

export async function generateMetadata({ params }) {
  const { locale } = await params;
  if (!YACHT_LOCALES.includes(locale)) return {};
  const de = landingMetadata({
    path: PATH,
    // Einhängen 31.10.2026: ≤ 34 Zeichen, damit „| Platzhirsch Home Living“ passt (wie EN und H1).
    title: "Yacht-Interieur am Bodensee",
    // texte-seo-ki 31.10.2026: < 150 Zeichen, damit clampDescription nichts abschneidet (vorher 160 → „Termin …“ fiel weg).
    // „Bootsausstattung“ (SISTRIX DE 40/Monat) > „yacht interior“ (30) > „yacht interieur“ (10); „Bootspolster“ trägt die Fragen.
    description:
      "Yacht-Interieur und Bootsausstattung am Bodensee: Deck, Salon, Kabinen und Bootshaus, von Hand geplant. Polster vom Bootssattler. Termin an Bord.",
  });
  if (locale === "de") return { ...de, alternates: seoAlternates({ canonical: de.alternates.canonical, languages: yachtLanguages(), robots: de.robots }) };
  // EN/FR/IT: same robots as German, own canonical, own title/description/og.
  const meta = locale === "en" ? META_EN : YACHT_INTL[locale].meta;
  const url = localeUrl(locale, PATH);
  // FR/IT (01.11.2026): ≤ 60 characters with suffix (pageMetadata); EN keeps its existing title.
  const title = locale === "en" ? titleWithSuffix(meta.title) : titleWithSuffix60(meta.title);
  // Rat 9,5 A15: Description ≤ 150 als ganzer Satz.
  const description = clampDescription(meta.description);
  const image = { url: `${url}/opengraph-image`, width: 1200, height: 630, alt: OG_CARDS[locale].alt };
  return {
    title,
    description,
    robots: de.robots,
    alternates: seoAlternates({ canonical: url, languages: yachtLanguages(), robots: de.robots }),
    openGraph: { type: "website", url, title: meta.title, description, siteName: "Platzhirsch Home Living", locale: ogLocale(locale), images: [image] },
    twitter: { card: "summary_large_image", title: meta.title, description, images: [image.url] },
  };
}

const CONTENT = {
  hero: {
    crumb: "Yacht-Interieur",
    eyebrow: "Boote · Yachten · Bootshäuser",
    title: "Yacht-Interieur am Bodensee",
    motto: "Nehmen Sie Platz – an Bord.",
    lead: "Leben am See, auch an Bord. Wir gestalten Cockpit, Deck, Salon und Kabinen Ihres Bootes – und Ihr Bootshaus – mit Outdoor-Möbeln, Stoffen und Licht.",
    secondary: { href: "#werfthalle", label: "Boot in 3D ansehen" },
    // Kern-USP (Entscheidung Nr. 8), mobil im ersten Bildschirm (R2 ux P2-4)
    usp: "Wir kommen an Bord. Harald Menghin zeichnet das Konzept von Hand, dann folgen 3D-Planung und Rendering.",
  },
  intro: {
    eyebrow: "Ein Boot ist ein Wohnraum mit eigenen Regeln",
    heading: "Zwischen Sattlerhandwerk und Designkonzept",
    paragraphs: [
      "Wenig Platz, viel Sonne, Feuchtigkeit – und jedes Kilo zählt. Wir bringen die Erfahrung aus Wohn- und Outdoor-Einrichtung mit an Bord: ein Konzept für Farben, Stoffe, Polster, Licht und lose Ausstattung, das zu Ihrem Boot und Ihrem Stil passt.",
      "Aufmaß, Fertigung und Montage übernehmen Fachbetriebe – ein Bootssattler und Ihre Werft. Wir stimmen die Arbeiten mit ihnen ab, damit Gestaltung und Handwerk zusammenpassen.",
    ],
    rules: [
      { name: "Gewicht", text: "Jedes Kilo zählt. Wir nennen die Gewichte mit dem Angebot, die Werft gibt sie frei." },
      { name: "Feuchte und Sonne", text: "Draußen nur, was der Hersteller für draußen vorsieht. Wohntextilien bleiben unter Deck und trocken." },
      { name: "Bewegung", text: "Was lose ist, muss sicher stehen: vor der Fahrt verstauen oder von der Werft sichern lassen." },
    ],
  },
  werfthalle: {
    eyebrow: "Die Werfthalle",
    heading: "Gehen Sie Raum für Raum durch Ihr Boot",
    text: "Im Winterlager steht das Boot an Land und ist offen zugänglich. Wählen Sie einen Bootstyp und eine Zone: Die Kamera fährt hin, bei Salon, Kabine und Bad wird das Deck aufgeschnitten. Daneben steht, was wir in dieser Zone vorschlagen.",
    note: "Das 3D-Modell ist ein Schema und nicht Ihr Boot. Möbel zeigen wir darin als vereinfachte Formen in den Farben des Konzepts – keine Nachbauten von Designermöbeln. Die echten Produkte sehen Sie daneben mit Herstellerbild.",
    initial: "motoryacht-riviera",
  },
  concepts: {
    eyebrow: "Beispielkonzepte",
    heading: "Vom Runabout bis zum Bootshaus",
    text: "Jedes Konzept hat einen Leitsatz, eine Farbwelt, Materialien und Produkte aus unserem Sortiment, Zone für Zone. Es sind Beispiele – keine Kundenprojekte.",
    imageNote:
      "Die Bilder in den Beispielkonzepten sind Konzeptvisualisierungen, mit Blender gerendert und als „Visualisierung (Rendering)“ beschriftet. Sie zeigen Stimmungen – keine realen Boote, keine Kundenprojekte und keine Produkte aus unserem Sortiment. Die Produktbilder stammen von den Herstellern.",
  },
  materials: {
    eyebrow: "Muster und Materialien",
    heading: "Gemacht für Sonne, Wasser und Wind",
    text: "An Bord gelten andere Anforderungen als im Wohnzimmer. Für jedes Produkt prüfen wir die Angaben des Herstellers zum Einsatz im Freien und an Bord. Stoffe, Teakmuster und Oberflächen sehen und fühlen Sie im Original – bei uns im Showroom oder direkt an Bord.",
    items: [
      { swatch: "teak", name: "Teak", text: "Robust und angenehm unter den Füßen. Ohne Öl wird er mit der Zeit silbergrau." },
      { swatch: "weave", name: "Lösungsgefärbtes Acrylgewebe", text: "Sehr farbbeständig, trocknet schnell. Die Werte nennt das Datenblatt des Herstellers." },
      { swatch: "foam", name: "Offenporiger Schaum", text: "Lässt Wasser ablaufen – für Cockpit- und Sonnenpolster." },
      { swatch: "leather", name: "Kunstleder für Bootspolster", text: "Pflegeleicht für Sitzbänke. Angaben zu UV und Entflammbarkeit holen wir als Datenblatt ein." },
      { swatch: "steel", name: "Edelstahl und Aluminium", text: "Für Gestelle und Beschläge. Legierung und Oberfläche für Ihr Revier klären wir mit Hersteller und Werft." },
      { swatch: "linen", name: "Leinen und Baumwollsatin", text: "Für Salon und Kabine. Wohntextilien – unter Deck und trocken." },
    ],
  },
  course: {
    eyebrow: "Kurs durchs Winterlager",
    heading: "Von September bis zum Einwassern",
    text: "Die beste Zeit für ein neues Interieur ist das Winterlager: Planung und Fertigung laufen, während das Boot an Land steht. Sprechen Sie uns früh an, damit Bootssattler und Werft die Arbeiten einplanen können. Deck-Möbel, Textilien und Bootshäuser gehen auch während der Saison.",
    months: ["Sep", "Okt", "Nov", "Dez", "Jan", "Feb", "Mär", "Apr"],
    items: [
      { from: 0, to: 1, when: "September – Oktober", title: "Erstgespräch nach der Saison", us: "Termin, Fotos und vorhandene Pläne sammeln", sattler: "–", werft: "Liegeplatz im Winterlager" },
      { from: 2, to: 2, when: "November", title: "Besichtigung an Bord", us: "Nutzung, Stil und Zonen besprechen", sattler: "Aufmaß und Schablonen", werft: "Zugang, Hinweise zu Befestigung und Gewicht" },
      { from: 2, to: 3, when: "November – Dezember", title: "Konzept", us: "Farbwelt, Material und Produktliste je Zone – mit klarer Aufstellung, wer was macht", sattler: "Machbarkeit der Polster", werft: "Freigabe von Gewicht und Stabilität" },
      { from: 3, to: 4, when: "Dezember – Januar", title: "Muster", us: "Muster im Showroom in Lochau oder an Bord, Bestellung der losen Ausstattung", sattler: "Stoff- und Schaumauswahl mit Datenblättern", werft: "–" },
      { from: 4, to: 6, when: "Januar – März", title: "Fertigung", us: "Termine abstimmen, Lieferung vorbereiten", sattler: "Polster, Persenning, Bimini", werft: "Lack, Holz, Befestigungspunkte, Elektrik" },
      { from: 6, to: 7, when: "März – April", title: "Montage und Einwassern", us: "Übergabe der losen Ausstattung", sattler: "Polster einpassen", werft: "Montage, Bohrungen, Abnahme" },
    ],
  },
  roles: {
    eyebrow: "Wer macht was",
    heading: "Drei Beteiligte, klar getrennt",
    text: "Wir gestalten und liefern die Ausstattung. Alles, was die Sicherheit und Technik Ihres Bootes betrifft, bleibt bei der Werft. Das halten wir in jedem Angebot schriftlich fest.",
    columns: [
      { title: "Platzhirsch", items: ["Konzept, Farben, Stoffe", "Möbel, Textilien, Leuchten mit Akku, Accessoires", "Lieferung der losen Ausstattung", "Termine mit Bootssattler und Werft abstimmen"] },
      { title: "Bootssattler", items: ["Aufmaß und Schablonen", "Polster, Bezüge, Persenning und Bimini", "Stoff- und Schaumauswahl mit Datenblättern", "Polster an Bord einpassen"] },
      { title: "Werft", items: ["Eingriffe in Struktur und Rumpf", "Elektrik, Gas, Lüftung", "Bohrungen und Befestigungen", "Freigabe von Gewicht und Stabilität"] },
    ],
  },
  brands: {
    eyebrow: "Marken aus unserem Sortiment",
    heading: "Ausgewählt für draußen und am Wasser",
    text: "Wir empfehlen nur Kollektionen, die der Hersteller für den jeweiligen Einsatz vorsieht. Ob ein Modell an Bord eingesetzt werden kann, klären wir vor jedem Angebot schriftlich mit dem Hersteller.",
    groups: [
      {
        title: "An Deck",
        items: [
          { name: "Paola Lenti", slug: "paola-lenti", text: "Outdoor-Möbel, Teppiche und eigene Outdoor-Stoffe – der Hersteller zeigt auch Projekte im Bereich Yachting." },
          { name: "Tuuci", slug: "tuuci", text: "Outdoor-Möbel der Kollektion Bleau. Tuuci nennt Marine- und Yachting-Umgebungen als Einsatzbereich der Marke; Schirme auf Anfrage." },
        ],
      },
      {
        title: "Unter Deck – lose und trocken",
        items: [
          { name: "Minotti", slug: "minotti", featured: ["Lido (Sofas)", "Libra Coffee Table"], text: "Sofas, Tische, Teppiche und Textilien aus dem Wohnsortiment für den Salon – lose und von der Werft gesichert." },
          { name: "Flos", slug: "flos", text: "Leuchten mit Akku, etwa Bellhop oder Bon Jour Unplugged – ohne festen Anschluss." },
          { name: "Treca", slug: "treca", text: "Matratzenauflagen. Für Kojen fragen wir Sondermaße beim Hersteller an." },
          { name: "Alonpi", slug: "alonpi", text: "Bettwäsche, Decken und Plaids für Kabine und Salon." },
        ],
      },
      {
        title: "Bootshaus, Steg & Seeterrasse",
        items: [
          { name: "Solpuri", slug: "solpuri", text: "Outdoor-Möbel: Tische, Stühle, Lounge und Liegen." },
          { name: "Umbrosa", slug: "umbrosa", text: "Sonnenschirme und Sonnensegel aus Belgien." },
          { name: "Heatsail", slug: "heatsail", text: "Wärme für den Abend am Wasser – damit die Saison länger dauert." },
          { name: "Poliform", slug: "poliform", text: "Outdoor-Modelle wie die Lounge Ketch für Terrasse und Bootshaus." },
          { name: "Sifas", slug: "sifas", text: "Outdoor-Möbel, Daybeds und Lounges für Terrasse und Steg." },
          { name: "Livintwist", slug: "livintwist", text: "Outdoor-Liegen und Canopys aus Geflecht." },
        ],
      },
    ],
  },
  area: {
    eyebrow: "Revier",
    heading: "Am Bodensee zu Hause – und am Mittelmeer unterwegs",
    regions: [
      {
        title: "Bodensee",
        text: "Häfen und Winterlager am österreichischen, deutschen und Schweizer Ufer – von Lochau, Bregenz und Hard über Lindau bis Friedrichshafen, Rorschach und Romanshorn. Besichtigungen an Bord vereinbaren wir direkt mit Ihnen.",
      },
      {
        title: "Mittelmeer",
        text: "Ihr Boot liegt an der Adria oder an einer anderen Küste am Mittelmeer? Planung und Muster besprechen wir gerne in Lochau. Lieferung und Montage vor Ort klären wir für jedes Projekt individuell.",
      },
    ],
    showroom: "Unser Showroom liegt an der Landstraße 11 in 6911 Lochau, direkt am Bodensee im Dreiländereck Österreich, Deutschland und Schweiz. Dienstag bis Freitag 10–18 Uhr, Samstag 10–14 Uhr – für eine Beratung zu Ihrem Boot empfehlen wir einen Termin.",
  },
  cta: {
    heading: "Termin an Bord oder im Showroom",
    text: "Erzählen Sie uns von Ihrem Boot oder Bootshaus. Wir kommen in den Hafen oder ins Winterlager – oder Sie besuchen uns in Lochau und sehen Stoffe und Materialien im Original.",
    // r8-leads: one CTA wording site-wide ("Termin anfragen"); the heading keeps "an Bord oder im Showroom".
    primaryLabel: "Termin anfragen",
    mailSubject: "Anfrage Yacht-Interieur",
    // R2 ux P1-1/P2-4: Termin mit Thema, damit der Wizard „Yacht“ vorbelegt
    href: "/beratung?thema=yacht",
  },
  // Benchmark fix-02: Weg für Fachleute (Werft, Bootssattler, Skipper/Yachtmanagement).
  trade: {
    eyebrow: "Für Fachleute am Wasser",
    heading: "Werft, Bootssattler, Skipper: gemeinsam an einem Boot",
    text: "Viele Projekte beginnen nicht beim Eigner, sondern bei Ihnen – im Winterlager, beim Aufmaß oder bei der Übergabe. Wir bringen Gestaltung, Marken aus unserem Sortiment und den Showroom in Lochau ein. Handwerk und Technik bleiben bei Ihnen.",
    paths: [
      { title: "Werften", text: "Ein Eigner wünscht zum Refit ein neues Interieur? Wir liefern Konzept und lose Ausstattung. Eingriffe, Befestigungen und die Freigabe von Gewicht und Stabilität bleiben bei Ihrer Werft.", subject: "Zusammenarbeit Werft – Yacht-Interieur", label: "Als Werft schreiben" },
      { title: "Bootssattler", text: "Sie fertigen Polster, Persenning und Bimini. Wir erarbeiten mit dem Eigner Farbwelt und Stoffauswahl – Aufmaß, Schablonen und Fertigung bleiben bei Ihnen.", subject: "Zusammenarbeit Bootssattler – Yacht-Interieur", label: "Als Bootssattler schreiben" },
      { title: "Skipper und Yachtmanagement", text: "Sie betreuen ein Boot für den Eigner – am Bodensee oder am Mittelmeer? Termine an Bord stimmen wir mit Ihnen ab; Planung und Muster besprechen wir in Lochau oder per Video.", subject: "Skipper / Yachtmanagement – Yacht-Interieur", label: "Termin abstimmen" },
    ],
  },
  schema: {
    serviceName: "Yacht- und Boots-Interior",
    serviceType: "Innenausstattung und Gestaltung von Booten, Yachten und Bootshäusern",
    description:
      "Gestaltung und Ausstattung von Deck, Salon, Kabinen und Bootshäusern mit Outdoor-Möbeln, Stoffen und Licht. Aufmaß, Fertigung und Montage übernehmen Bootssattler und Werft; Platzhirsch koordiniert die Termine.",
    areaServed: ["Bodensee", "Vorarlberg", "Bayern", "Baden-Württemberg", "Ostschweiz", "Mittelmeer"],
    // texte-seo-ki 31.10.2026: Suchwörter und Zielgruppen für Service.alternateName / audience
    alternateName: ["Yacht-Interieur", "Bootsausstattung", "Yacht Interior Design"],
    audience: ["Eigner von Booten und Yachten", "Werften", "Bootssattler"],
  },
  faq: {
    name: "yacht-faq",
    heading: "Fragen zu Yacht-Interieur und Bootspolstern",
    items: [
      {
        q: "Fertigen Sie Bootspolster selbst?",
        a: "Nein. Gestaltung, Stoff- und Farbberatung übernehmen wir. Aufmaß und Fertigung der Polster übernimmt ein Bootssattler aus der Region. Wir koordinieren die Termine und halten im Angebot fest, wer welche Leistung erbringt.",
      },
      // texte-seo-ki 31.10.2026: vier Fragen aus der Nachfrage (SISTRIX-Fragen zu „bootspolster“:
      // Stoff/Material/Schaum ≈ 13 000 Suchen, Kosten ≈ 1 500; AI-Topic „Bootsstoffe“,
      // „Was macht eine Bootssattlerei“) – Antworten nur mit Aussagen, die die Seite schon trägt.
      {
        q: "Welcher Stoff und welcher Schaum eignen sich für Bootspolster?",
        a: "Für Cockpit und Deck meist lösungsgefärbtes Acrylgewebe oder Kunstleder für Bootspolster, darunter offenporiger Schaum, durch den Wasser ablaufen kann. Unter Deck passen auch Leinen und Baumwollsatin, solange sie trocken bleiben. Werte zu UV-Beständigkeit, Farbechtheit und Entflammbarkeit stehen im Datenblatt des Herstellers – wir holen es vor dem Angebot ein und wählen Stoff und Schaum gemeinsam mit dem Bootssattler aus. Muster sehen Sie im Showroom in Lochau oder an Bord.",
      },
      {
        q: "Für welche Boote ist das Angebot gedacht?",
        a: "Vor allem für Motorboote und Segelyachten mit Kajüte oder Flybridge, wie sie am Bodensee und am Mittelmeer üblich sind, sowie für Bootshäuser. Sprechen Sie uns auch bei anderen Booten an – wir sagen Ihnen ehrlich, ob wir helfen können.",
      },
      {
        q: "Arbeiten Sie auch für Werften und Bootssattler?",
        a: "Ja. Wünscht sich ein Eigner eine Gestaltung für Salon, Kabinen oder Deck, übernehmen wir Konzept, Farb- und Stoffberatung und die lose Ausstattung – mit einer Produktliste, die Gewichte und Herstellerangaben enthält. Aufmaß, Fertigung, Montage und alle Eingriffe ins Boot bleiben bei Ihnen. Wir besuchen Sie gern in der Werft oder im Winterlager.",
      },
      {
        q: "Wann ist der beste Zeitpunkt für ein neues Interieur?",
        a: "Das Winterlager von November bis Februar. Dann steht das Boot an Land, und bis zum Einwassern im Frühjahr bleibt Zeit für Planung und Fertigung. Sprechen Sie uns früh an, damit Sattler und Werft die Arbeiten einplanen können. Für Deck-Möbel, Textilien und Bootshäuser geht es auch während der Saison.",
      },
      {
        q: "Was kostet ein neues Interieur für mein Boot?",
        a: "Das hängt von der Größe des Bootes, der Zahl der Zonen und den gewählten Produkten ab – Pauschalpreise nennen wir deshalb nicht. Nach der Besichtigung an Bord erhalten Sie ein schriftliches Angebot für Konzept und lose Ausstattung. Polster und Arbeiten am Boot bieten Bootssattler und Werft getrennt an; im Angebot steht, wer welche Leistung erbringt.",
      },
      {
        q: "Bauen Sie auch Möbel fest ins Boot ein?",
        a: "Eingriffe in Struktur, Elektrik, Gas oder Lüftung sowie Bohrungen und Befestigungen übernimmt immer die Werft. Wir konzentrieren uns auf Gestaltung und lose Ausstattung. So bleibt die Verantwortung für die Technik Ihres Bootes in den richtigen Händen.",
      },
      {
        q: "Sind die Möbel und Stoffe für den Einsatz an Bord geeignet?",
        a: "Wir wählen nur Produkte, die der Hersteller für den Außenbereich vorsieht, und klären vor dem Angebot mit dem Hersteller, ob ein Modell an Bord eingesetzt werden kann. Angaben zu Gewicht, Pflege und Materialeigenschaften erhalten Sie mit dem Angebot.",
      },
      {
        q: "Kann ich Minotti-Möbel auf meinem Boot einsetzen?",
        a: "Unter Deck ja: Sofas, Tische, Teppiche und Textilien aus dem Wohnsortiment, lose aufgestellt, von der Werft gesichert und im Trockenen. Für Deck und Cockpit kommen nur Kollektionen in Frage, die der Hersteller für draußen vorsieht. Ob ein Modell an Bord eingesetzt werden kann, klären wir vor dem Angebot schriftlich mit dem Hersteller. Wie Minotti-Möbel auf einer Yacht wirken, zeigt das Referenzprojekt Custom Line Navetta 42 auf dieser Seite – es wurde nicht von Platzhirsch eingerichtet.",
      },
      {
        q: "Ist das 3D-Boot auf dieser Seite mein Boot?",
        a: "Nein. Das 3D-Modell ist ein Schema für mehrere Bootstypen. Es zeigt, welche Zonen es an Bord gibt und was wir dort vorschlagen. Möbel erscheinen darin als vereinfachte Formen; die echten Produkte sehen Sie mit dem Bild des Herstellers. Für Ihr Boot beginnen wir mit einer Besichtigung an Bord.",
      },
      {
        q: "Sind die Bilder der Beispielkonzepte echte Projekte?",
        a: "Nein. Es sind Konzeptvisualisierungen, mit Blender gerendert und als „Visualisierung (Rendering)“ beschriftet. Sie zeigen eine Stimmung – keine realen Boote, keine Kundenprojekte und keine Produkte aus unserem Sortiment. Echte Fotos zeigen wir erst mit schriftlicher Freigabe der Eigner.",
      },
      {
        q: "Planen Sie auch Bootshaus, Steg und Garten am See?",
        a: "Ja. Für Bootshaus, Steg, Seeterrasse und Garten verbinden wir die Ausstattung mit unserer Outdoor-Planung. Die Gartenplanung und die Ausführung übernehmen befugte Fachbetriebe, etwa aus dem Garten- und Landschaftsbau; wir koordinieren sie für Sie.",
      },
      {
        q: "Betreuen Sie auch Boote am Mittelmeer?",
        a: "Ja, gerne. Planung und Muster besprechen wir in Lochau oder per Video. Wie Lieferung und Montage am Liegeplatz organisiert werden, klären wir für jedes Projekt individuell.",
      },
    ],
  },
};

export default async function YachtInteriorPage({ params }) {
  const { locale } = await params;
  // DE/EN/FR/IT (YACHT_LOCALES).
  if (!YACHT_LOCALES.includes(locale)) notFound();
  const live = await withLiveCatalog(concepts);
  // R2 gesamtwerk P1-6: „Beach Club / Superyacht (Inspiration)“ entfällt – kein Bodensee-Angebot.
  const allViews = localizeConcepts(buildConcepts(live, renders), locale);
  const conceptViews = allViews.filter((c) => c.model !== "superyacht");
  // QM r1: Das Markenraster sucht Produktbilder in allen Konzepten – Sifas (Kalife Daybed) steht
  // nur im ausgeblendeten Superyacht-Konzept; ohne das blieb die Sifas-Kachel ohne Bild.
  return <YachtPage content={locale === "de" ? CONTENT : locale === "en" ? CONTENT_EN : YACHT_INTL[locale].content} path={PATH} concepts={conceptViews} brandConcepts={allViews} locale={locale} />;
}
