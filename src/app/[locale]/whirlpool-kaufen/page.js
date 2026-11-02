// /<locale>/whirlpool-kaufen – SEO-Landingpage „Whirlpool kaufen“ (02.11.2026).
// Suchbegriffe (AT/DE/CH): „whirlpool kaufen“, „whirlpool garten“, „outdoor
// whirlpool“, „whirlpool kaufen schweiz“, „privat spa“. Deutsch ist der
// Mastertext (CONTENT unten), EN/FR/IT kommen aus
// src/lib/content/landingKern/whirlpool.js (Gruppe „landing-kern“).
// Layout: src/components/Landing/landingPage.js (wie /kuechen-vorarlberg).
//
// Regeln:
// - Händleraussage NUR über den Claim-Guard (dealerStatementList, src/lib/legal/
//   claims.js) – der Satz wird unten je Sprache an die Einleitung gehängt,
//   kein Händlerwort im Text selbst.
// - Fakten nur aus dem Herstellerkatalog (src/lib/katalog/marken/aquavia-spa.js,
//   starpool.js) und src/lib/wellness/marken.js: Aquavia Spa = Whirlpools innen/
//   außen/Einbau/Überlauf, Swimspas, Cold Plunge; Starpool = Whirlpool Air Bath,
//   Ice Bath. Keine Preise, keine Lieferzeiten, keine Referenzen.
// - Kein Ausstellungsversprechen: Modelle „im Termin anhand von Herstellerunterlagen
//   und Mustern“ (Bad-&-Wellness-Bereich im Showroom erst ab 2027, Inhaber Nr. 19).
// - Strom/Wasser nur allgemein („im Termin klären“, befugter Elektrofachbetrieb).
// - Lieferung „auf Wunsch/auf Anfrage“ (Entscheidung Nr. 3); Schweiz: Ausfuhr und
//   Verzollung kommen dazu (Wortlaut wie src/lib/ezarri/copy.js `laender`).
// - Bilder: Herstellerbilder aus dem Katalog mit Bildfreigabe laut Inhaber
//   (Nr. 19/21, docs/bildquellen/QUELLEN.md), unverändert; Alt-Texte aus dem Katalog.
// - Kein Markenblock (BrandGroups verlinkt /ueber-uns/marken/<slug>, das es für die
//   Wellness-Marken nicht gibt) – Markenlinks führen in den Katalog (/bad-wellness/marke/…).
// JSON-LD WebPage + FAQPage via LandingPage.
import { notFound } from "next/navigation";
import LandingPage, { landingMetadata } from "@/components/Landing/landingPage";
import { KERN_LOCALES, kernContent, kernMetadata, withKernLanguages } from "@/lib/content/landingKern";
import { dealerStatementList } from "@/lib/legal/claims";

const PATH = "/whirlpool-kaufen";
// Marken mit belegtem Händlerstatus auf dieser Seite (CLAIM_REGISTER).
const DEALER_BRANDS = ["aquavia-spa", "starpool"];

export async function generateMetadata({ params }) {
  const { locale } = await params;
  if (!KERN_LOCALES.includes(locale)) return {};
  if (locale !== "de") return kernMetadata({ path: PATH, locale });
  return withKernLanguages(landingMetadata({
    path: PATH,
    title: "Whirlpool kaufen in Vorarlberg",
    description:
      "Outdoor-Whirlpool oder Privat-Spa mit Aquavia Spa, von Hand und in 3D geplant in Lochau am Bodensee. Lieferung nach AT, DE und CH auf Anfrage.",
  }), PATH);
}

const CONTENT = {
  thema: "wellness",
  processText:
    "Harald Menghin zeichnet Ihren Whirlpool-Platz zuerst von Hand: Stellfläche, Wege, Sichtschutz, Licht und die Möbel daneben. Danach planen wir in 3D mit Maßen, Untergrund und Anschlüssen, und Sie sehen Terrasse oder Spa-Raum als Rendering, bevor etwas bestellt wird.",
  banner: {
    image: "/Images/Wellness/produkte/aquavia-spa/aquavia-spa-serenity-1.webp",
    title: "Whirlpool kaufen in Vorarlberg: Outdoor-Whirlpool und Privat-Spa",
    lead: "Geplant in Lochau am Bodensee – für Garten, Terrasse und Haus im Dreiländereck Österreich, Deutschland und Schweiz.",
    alt: "Aquavia Spa Serenity Hot Tub: auf einer Terrasse",
    crumb: "Whirlpool kaufen",
  },
  // Faktenzeile unter dem Hero: der Dreiländer-Kontext, ohne Preis- oder Fristversprechen.
  facts: [
    { label: "Österreich", value: "Lieferung und Montage auf Wunsch, abgestimmt mit Elektriker und Installateur" },
    { label: "Deutschland", value: "Kein Zoll – Österreich und Deutschland liegen im EU-Binnenmarkt; Lieferung auf Anfrage" },
    { label: "Schweiz", value: "Lieferung auf Anfrage; Ausfuhr und Verzollung kommen dazu – den Ablauf erklären wir Ihnen" },
  ],
  intro: {
    eyebrow: "Whirlpool · Vorarlberg · Bodensee",
    heading: "Ein Whirlpool, der zu Garten und Haus passt",
    paragraphs: [
      "Ein Whirlpool im Garten oder ein Privat-Spa im Haus ist mehr als ein Becken: Er braucht einen tragfähigen Untergrund, Strom und Wasser, Platz für Abdeckung und Wartung – und einen Ort, an dem man gern sitzt. Bei Platzhirsch Home Living in Lochau planen wir den Whirlpool deshalb wie einen Raum: mit Terrasse, Sichtschutz, Licht und den Möbeln daneben.",
      "Wir planen mit Whirlpools von Aquavia Spa aus Cervera in Katalonien – für innen und außen, zum Einbau oder mit Überlauf, dazu Swimspas und ein Kaltwasserbecken – und mit dem Whirlpool Air Bath von Starpool aus dem Trentino. Ob Garten in Dornbirn, Terrasse am Bodensee oder Haus im Rheintal: Lieferung und Montage gibt es auf Wunsch, in Deutschland, der Schweiz und Liechtenstein auf Anfrage.",
    ],
    benefits: [
      "Whirlpool-Platz von Hand gezeichnet, dann in 3D geplant",
      "Aquavia Spa: Whirlpools für innen, außen und zum Einbau, Swimspas und Cold Plunge",
      "Terrasse, Garten und Wohnbereich aus einer Hand geplant",
      "Lieferung und Montage auf Wunsch, mit Elektriker und Installateur abgestimmt",
    ],
    image: "/Images/Wellness/produkte/aquavia-spa/aquavia-spa-capri-1.webp",
    imageAlt: "Aquavia Spa Capri Hot Tub: in ein Holzpodest in einem Innenraum eingelassen",
  },
  steps: {
    eyebrow: "So entsteht Ihr Whirlpool-Platz",
    heading: "Von der ersten Idee bis zur Montage",
    items: [
      { title: "Beratung in Lochau", text: "Wir sprechen über Nutzung, Platzzahl und Aufstellung – innen oder außen – und vergleichen Modelle, Verkleidungen und Abdeckungen anhand von Herstellerunterlagen und Mustern." },
      { title: "Von Hand gezeichnet", text: "Harald Menghin zeichnet Terrasse oder Spa-Raum zuerst von Hand: Stellfläche, Wege, Sichtschutz und Licht. Danach planen wir in 3D mit exakten Maßen." },
      { title: "Technik & Gewerke", text: "Untergrund, Stromanschluss, Wasserzulauf und -ablauf zeichnen wir in den Plan ein und stimmen sie mit Elektriker, Installateur und bei Bedarf mit der Statik ab. Was Ihr Standort braucht, klären wir im Termin." },
      { title: "Lieferung & Montage", text: "Vorher prüfen wir Zufahrt und Einbringweg. Lieferung und Montage koordinieren wir auf Wunsch – in Österreich, Deutschland und der Schweiz auf Anfrage; für die Schweiz kommen Ausfuhr und Verzollung dazu." },
    ],
    links: [
      { href: "/arbeitsweise", label: "So arbeiten wir im Detail" },
      { href: "/bad-wellness/marke/aquavia-spa", label: "Aquavia Spa: Whirlpools im Katalog" },
      { href: "/bad-wellness/kategorie/whirlpool", label: "Alle Whirlpools im Katalog" },
      { href: "/swim-spa", label: "Swim Spa: Schwimmen und Entspannen auf wenigen Metern" },
      { href: "/ezarri/pool", label: "Ezarri-Glasmosaik für Pool und Spa" },
      { href: "/einkaufen-aus-der-schweiz", label: "Einkaufen aus der Schweiz: Ausfuhr und Verzollung" },
      { href: "/outdoor-winterservice", label: "Winterservice für Outdoor-Möbel" },
      { href: "/pflege-service", label: "Pflege-Service für Möbel und Polster" },
    ],
  },
  gallery: [
    { src: "/Images/Wellness/produkte/aquavia-spa/aquavia-spa-serenity-2.webp", alt: "Aquavia Spa Serenity Hot Tub: auf einer Terrasse, Blick von nahem" },
    { src: "/Images/Wellness/produkte/aquavia-spa/aquavia-spa-swimspa-amazon-5.webp", alt: "Aquavia Spa Swimspa Amazon: auf einem Holzdeck im Garten" },
    { src: "/Images/Wellness/produkte/starpool/starpool-air-bath-1.webp", alt: "Starpool Air Bath: Whirlpool auf einer Terrasse im Freien" },
  ],
  showroom: {
    heading: "Whirlpool-Beratung am Bodensee",
    text: "Nur wenige Minuten von Bregenz entfernt zeigen wir Möbel und Leuchten internationaler Designmarken. Whirlpools besprechen wir im Termin anhand von Herstellerunterlagen, Mustern und Plänen und zeigen Ihnen Ihren Platz in 3D. Ob und welche Modelle gerade zu sehen sind, sagen wir Ihnen bei der Terminvereinbarung.",
  },
  cta: {
    heading: "Planen wir Ihren Whirlpool",
    text: "Vereinbaren Sie einen unverbindlichen Beratungstermin in Lochau – oder schreiben Sie uns, wo der Whirlpool stehen soll.",
  },
  faq: {
    name: "whirlpool-faq",
    heading: "Fragen zum Whirlpool-Kauf",
    items: [
      { q: "Wie läuft die Planung eines Whirlpools bei Platzhirsch ab?", a: "Im ersten Gespräch klären wir Nutzung, Platzzahl und Aufstellung. Harald Menghin zeichnet Ihren Platz von Hand, danach planen wir in 3D mit Maßen, Untergrund und Anschlüssen. Modelle und Ausstattung wählen Sie anhand von Herstellerunterlagen und Mustern. Zum Schluss koordinieren wir Lieferung und Montage mit den Gewerken." },
      { q: "Whirlpool innen oder außen – was ist zu beachten?", a: "Im Freien braucht ein Whirlpool einen ebenen, tragfähigen Untergrund, Platz für Abdeckung und Wartung und eine Zufahrt für die Anlieferung. Auf Terrasse, Balkon oder Dach prüft eine Statikerin oder ein Statiker die Tragfähigkeit; ob eine Bauanzeige nötig ist, klärt Ihre Gemeinde. Im Haus kommen Lüftung, Feuchteschutz, Bodenablauf und der Einbringweg dazu. Was Ihr Standort braucht, klären wir im Termin." },
      { q: "Welche Anschlüsse braucht ein Whirlpool?", a: "Strom, Wasserzulauf und einen Ablauf zum Entleeren. Den Stromanschluss stellt ein befugter Elektrofachbetrieb her; welche Spannung ein Modell braucht, steht in den Herstellerangaben. Leitungsweg und Anschlusspunkt zeichnen wir in die Planung ein – die Details klären wir im Termin mit Elektriker und Installateur." },
      { q: "Liefern Sie Whirlpools auch nach Deutschland und in die Schweiz?", a: "Ja, auf Anfrage – nach Vorarlberg, Deutschland, in die Schweiz und nach Liechtenstein. Zwischen Österreich und Deutschland gibt es keinen Zoll. Für die Schweiz kommen Ausfuhr und Verzollung dazu; den Ablauf beschreiben wir auf platzhirsch.studio/de/einkaufen-aus-der-schweiz und besprechen ihn gern mit Ihnen." },
      { q: "Kann ein Outdoor-Whirlpool im Winter genutzt werden?", a: "Ob ein Modell für den Betrieb im Winter ausgelegt ist und wie es stillgelegt wird, steht in den Herstellerangaben – wir besprechen das mit Ihnen bei der Modellwahl. Eine passende Abdeckung planen wir von Anfang an mit ein. Für die Outdoor-Möbel rund um den Whirlpool gibt es unseren Winterservice mit Abholung, Pflege und Lager auf platzhirsch.studio/de/outdoor-winterservice." },
      { q: "Wer kümmert sich um Pflege und Wartung?", a: "Wasserpflege und Wartung richten sich nach den Herstellerangaben Ihres Modells; passende Pflegesets und Zubehör stehen im Katalog. Für Polster, Leder und Holz der Möbel rund um den Whirlpool bieten wir einen Pflege-Service an: platzhirsch.studio/de/pflege-service." },
    ],
  },
};

export default async function WhirlpoolKaufenPage({ params }) {
  const { locale } = await params;
  if (!KERN_LOCALES.includes(locale)) notFound();
  const base = kernContent(PATH, locale, CONTENT);
  // Händlersatz aus dem Claim-Guard in der Seitensprache, als eigener Absatz nach der Einleitung.
  const dealer = dealerStatementList(DEALER_BRANDS, locale);
  const content = dealer ? { ...base, intro: { ...base.intro, paragraphs: [...base.intro.paragraphs, dealer] } } : base;
  return <LandingPage content={content} path={PATH} />;
}
