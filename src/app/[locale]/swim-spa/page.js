// /<locale>/swim-spa – SEO-Landingpage „Swim Spa“ (02.11.2026).
// Suchbegriffe (AT/DE/CH): „swim spa“, „swim spa kaufen“, „swimspa“. Deutsch
// ist der Mastertext (CONTENT unten), EN/FR/IT kommen aus
// src/lib/content/landingKern/swimspa.js (Gruppe „landing-kern“).
// Layout: src/components/Landing/landingPage.js (wie /kuechen-vorarlberg).
//
// Regeln:
// - Händleraussage NUR über den Claim-Guard (dealerStatementList, src/lib/legal/
//   claims.js), kein Händlerwort im Text selbst.
// - Fakten nur aus dem Herstellerkatalog (src/lib/katalog/marken/aquavia-spa.js):
//   fünf Swimspas – Amazon (4 Personen, 28 Düsen, 500 × 230 × 138 cm), Fitness
//   (4 Personen, 54 Düsen, 400 × 230 × 138 cm), Duo (zwei getrennte Becken mit
//   eigener Wassertemperatur, 600 × 230 × 138 cm), Compact Pool und Sky (je eine
//   Person, 400 × 230 × 138 cm). Starpool plant Schwimm-, Ruhe- und Salzwasserbecken
//   nach Projekt (Hotels) – nur als Hinweis für das Objektgeschäft.
//   Keine Preise, keine Lieferzeiten, keine Referenzen, keine Wirkversprechen.
// - Kein Ausstellungsversprechen („im Termin anhand von Herstellerunterlagen und Mustern“).
// - Strom/Wasser nur allgemein („im Termin klären“, befugter Elektrofachbetrieb).
// - Lieferung „auf Wunsch/auf Anfrage“ (Entscheidung Nr. 3); Schweiz: Ausfuhr und
//   Verzollung kommen dazu (Wortlaut wie src/lib/ezarri/copy.js `laender`).
// - Bilder: Herstellerbilder aus dem Katalog mit Bildfreigabe laut Inhaber
//   (Nr. 19, docs/bildquellen/QUELLEN.md), unverändert; Alt-Texte aus dem Katalog.
// - Kein Markenblock (BrandGroups verlinkt /ueber-uns/marken/<slug>, das es für
//   Aquavia Spa nicht gibt) – Markenlink führt in den Katalog (/bad-wellness/marke/…).
// JSON-LD WebPage + FAQPage via LandingPage.
import { notFound } from "next/navigation";
import LandingPage, { landingMetadata } from "@/components/Landing/landingPage";
import { KERN_LOCALES, kernContent, kernMetadata, withKernLanguages } from "@/lib/content/landingKern";
import { dealerStatementList } from "@/lib/legal/claims";

const PATH = "/swim-spa";
// Marke mit belegtem Händlerstatus auf dieser Seite (CLAIM_REGISTER).
const DEALER_BRANDS = ["aquavia-spa"];

export async function generateMetadata({ params }) {
  const { locale } = await params;
  if (!KERN_LOCALES.includes(locale)) return {};
  if (locale !== "de") return kernMetadata({ path: PATH, locale });
  return withKernLanguages(landingMetadata({
    path: PATH,
    title: "Swim Spa kaufen in Vorarlberg",
    description:
      "Swim Spa mit Gegenstromanlage für Garten und Haus: Aquavia Spa, von Hand und in 3D geplant in Lochau am Bodensee. Lieferung nach AT, DE, CH auf Anfrage.",
  }), PATH);
}

const CONTENT = {
  thema: "wellness",
  processText:
    "Harald Menghin zeichnet den Platz für Ihr Swim Spa zuerst von Hand: Becken, Einstieg, Wege, Sichtschutz und Licht. Danach planen wir in 3D mit Maßen, Untergrund und Anschlüssen, und Sie sehen Garten oder Raum als Rendering, bevor etwas bestellt wird.",
  banner: {
    image: "/Images/Wellness/produkte/aquavia-spa/aquavia-spa-swimspa-amazon-5.webp",
    title: "Swim Spa kaufen: Schwimmen und Entspannen auf wenigen Metern",
    lead: "Geplant in Lochau am Bodensee – für Gärten und Häuser in Vorarlberg, am deutschen Ufer und in der Schweiz.",
    alt: "Aquavia Spa Swimspa Amazon: auf einem Holzdeck im Garten",
    crumb: "Swim Spa",
  },
  facts: [
    { label: "Österreich", value: "Lieferung und Montage auf Wunsch, abgestimmt mit Elektriker und Installateur" },
    { label: "Deutschland", value: "Kein Zoll – Österreich und Deutschland liegen im EU-Binnenmarkt; Lieferung auf Anfrage" },
    { label: "Schweiz", value: "Lieferung auf Anfrage; Ausfuhr und Verzollung kommen dazu – den Ablauf erklären wir Ihnen" },
  ],
  intro: {
    eyebrow: "Swim Spa · Vorarlberg · Bodensee",
    heading: "Ein Becken, das Schwimmen und Whirlpool verbindet",
    paragraphs: [
      "Ein Swim Spa ist ein kompaktes Becken mit Gegenstromanlage: Sie schwimmen gegen die Strömung, ohne dass der Garten einen Pool in voller Länge braucht, und entspannen danach im Massagebereich. Die Swimspas von Aquavia Spa aus Cervera in Katalonien sind laut Hersteller 400 bis 600 cm lang und 230 cm breit – vom Amazon für vier Personen mit Schwimm- und Massagebereich über den Duo mit zwei getrennten Becken und eigener Wassertemperatur bis zu Compact Pool und Sky für eine Person, auch für innen.",
      "Bei Platzhirsch Home Living in Lochau planen wir das Swim Spa wie einen Raum: Einstieg, Wege, Sichtschutz, Licht und die Möbel daneben gehören von Anfang an dazu. Ob Garten in Bregenz, Grundstück am Bodensee oder Wellnessraum im Haus: Lieferung und Montage gibt es auf Wunsch, in Deutschland, der Schweiz und Liechtenstein auf Anfrage.",
    ],
    benefits: [
      "Swim-Spa-Platz von Hand gezeichnet, dann in 3D geplant",
      "Aquavia Spa: fünf Swimspas von 400 bis 600 cm Länge, für außen und innen",
      "Garten, Terrasse und Wohnbereich aus einer Hand geplant",
      "Lieferung und Montage auf Wunsch, mit Elektriker und Installateur abgestimmt",
    ],
    image: "/Images/Wellness/produkte/aquavia-spa/aquavia-spa-swimspa-amazon-3.webp",
    imageAlt: "Aquavia Spa Swimspa Amazon: in einem holzverkleideten Raum, Blick von oben",
  },
  steps: {
    eyebrow: "So entsteht Ihr Swim Spa",
    heading: "Von der ersten Idee bis zur Montage",
    items: [
      { title: "Beratung in Lochau", text: "Wir sprechen über Schwimmen, Entspannen und Platzbedarf, über Aufstellung im Freien, eingelassen oder im Haus – und vergleichen die Modelle anhand von Herstellerunterlagen und Mustern." },
      { title: "Von Hand gezeichnet", text: "Harald Menghin zeichnet Garten oder Raum zuerst von Hand: Becken, Einstieg, Wege, Sichtschutz und Licht. Danach planen wir in 3D mit exakten Maßen." },
      { title: "Technik & Gewerke", text: "Untergrund, Stromanschluss, Wasserzulauf und -ablauf zeichnen wir in den Plan ein und stimmen sie mit Elektriker, Installateur und bei Bedarf mit der Statik ab. Was Ihr Standort braucht, klären wir im Termin." },
      { title: "Lieferung & Montage", text: "Vorher prüfen wir Zufahrt und Einbringweg – ein Swim Spa ist mehrere Meter lang. Lieferung und Montage koordinieren wir auf Wunsch, in Deutschland und der Schweiz auf Anfrage; für die Schweiz kommen Ausfuhr und Verzollung dazu." },
    ],
    links: [
      { href: "/arbeitsweise", label: "So arbeiten wir im Detail" },
      { href: "/bad-wellness/kategorie/swimspa", label: "Alle Swimspas im Katalog" },
      { href: "/bad-wellness/marke/aquavia-spa", label: "Aquavia Spa: Whirlpools und Swimspas" },
      { href: "/whirlpool-kaufen", label: "Whirlpool kaufen: Outdoor-Whirlpool und Privat-Spa" },
      { href: "/ezarri/pool", label: "Ezarri-Glasmosaik für Pool und Spa" },
      { href: "/outdoor-gartenplanung", label: "Outdoor- und Gartenplanung am Bodensee" },
      { href: "/einkaufen-aus-der-schweiz", label: "Einkaufen aus der Schweiz: Ausfuhr und Verzollung" },
      { href: "/pflege-service", label: "Pflege-Service für Möbel und Polster" },
    ],
  },
  gallery: [
    { src: "/Images/Wellness/produkte/aquavia-spa/aquavia-spa-swimspa-duo-3.webp", alt: "Aquavia Spa Swimspa Duo: im Garten in den Boden eingelassen" },
    { src: "/Images/Wellness/produkte/aquavia-spa/aquavia-spa-swimspa-compact-pool-4.webp", alt: "Aquavia Spa Swimspa Compact Pool: Person schwimmt gegen die Strömung" },
    { src: "/Images/Wellness/produkte/aquavia-spa/aquavia-spa-swimspa-sky-3.webp", alt: "Aquavia Spa Swimspa Sky: auf einem Holzdeck am Abend, Blick von oben" },
  ],
  showroom: {
    heading: "Swim-Spa-Beratung am Bodensee",
    text: "Nur wenige Minuten von Bregenz entfernt zeigen wir Möbel und Leuchten internationaler Designmarken. Swimspas besprechen wir im Termin anhand von Herstellerunterlagen, Mustern und Plänen und zeigen Ihnen Ihren Platz in 3D. Ob und welche Modelle gerade zu sehen sind, sagen wir Ihnen bei der Terminvereinbarung.",
  },
  cta: {
    heading: "Planen wir Ihr Swim Spa",
    text: "Vereinbaren Sie einen unverbindlichen Beratungstermin in Lochau – oder schreiben Sie uns, wo das Becken stehen soll.",
  },
  faq: {
    name: "swim-spa-faq",
    heading: "Fragen zum Swim Spa",
    items: [
      { q: "Was unterscheidet ein Swim Spa von Pool und Whirlpool?", a: "Ein Swim Spa ist kürzer als ein Pool und hat eine Gegenstromanlage, gegen die Sie auf der Stelle schwimmen. Viele Modelle haben zusätzlich einen Massagebereich mit Düsen wie ein Whirlpool – beim Aquavia Spa Swimspa Duo sind Schwimm- und Massagebereich zwei getrennte Becken mit eigener Wassertemperatur. Welches Modell zu Ihnen passt, klären wir im Gespräch." },
      { q: "Wie viel Platz braucht ein Swim Spa?", a: "Die Swimspas von Aquavia Spa messen laut Hersteller 400 bis 600 cm in der Länge, 230 cm in der Breite und 138 cm in der Höhe. Dazu kommen Platz für Einstieg, Abdeckung und Wartung sowie ein ebener, tragfähiger Untergrund. Ob das Becken frei steht, teilweise eingelassen wird oder im Haus steht, planen wir mit Ihnen – im Haus kommen Lüftung, Feuchteschutz und Einbringweg dazu." },
      { q: "Welche Anschlüsse braucht ein Swim Spa?", a: "Strom, Wasserzulauf und einen Ablauf zum Entleeren. Den Stromanschluss stellt ein befugter Elektrofachbetrieb her; welche Spannung ein Modell braucht, steht in den Herstellerangaben. Leitungsweg und Anschlusspunkt zeichnen wir in die Planung ein – die Details klären wir im Termin mit Elektriker und Installateur." },
      { q: "Liefern Sie Swimspas auch nach Deutschland und in die Schweiz?", a: "Ja, auf Anfrage – nach Vorarlberg, Deutschland, in die Schweiz und nach Liechtenstein. Vorher prüfen wir Zufahrt und Einbringweg. Zwischen Österreich und Deutschland gibt es keinen Zoll; für die Schweiz kommen Ausfuhr und Verzollung dazu, den Ablauf beschreiben wir auf platzhirsch.studio/de/einkaufen-aus-der-schweiz." },
      { q: "Kann ein Swim Spa das ganze Jahr genutzt werden?", a: "Ob ein Modell für den Betrieb im Winter ausgelegt ist, steht in den Herstellerangaben – wir besprechen das mit Ihnen bei der Modellwahl und planen die Abdeckung von Anfang an mit ein. Für die Outdoor-Möbel rund um das Becken gibt es unseren Winterservice mit Abholung, Pflege und Lager auf platzhirsch.studio/de/outdoor-winterservice." },
      { q: "Wer kümmert sich um Pflege und Wartung?", a: "Wasserpflege und Wartung richten sich nach den Herstellerangaben Ihres Modells; passende Pflegesets und Zubehör stehen im Katalog. Für Polster, Leder und Holz der Möbel rund um das Swim Spa bieten wir einen Pflege-Service an: platzhirsch.studio/de/pflege-service." },
    ],
  },
};

export default async function SwimSpaPage({ params }) {
  const { locale } = await params;
  if (!KERN_LOCALES.includes(locale)) notFound();
  const base = kernContent(PATH, locale, CONTENT);
  // Händlersatz aus dem Claim-Guard in der Seitensprache, als eigener Absatz nach der Einleitung.
  const dealer = dealerStatementList(DEALER_BRANDS, locale);
  const content = dealer ? { ...base, intro: { ...base.intro, paragraphs: [...base.intro.paragraphs, dealer] } } : base;
  return <LandingPage content={content} path={PATH} />;
}
