// /<locale>/sauna-kaufen – SEO-Landingpage „Sauna kaufen“ (02.11.2026).
// Suchbegriffe (AT/DE/CH): „sauna kaufen“, „saunabau vorarlberg“, „sauna kaufen
// schweiz“, „sauna vorarlberg“, „sauna kaufen vorarlberg“, „sauna für zuhause“.
// Deutsch ist der Mastertext (CONTENT unten), EN/FR/IT kommen aus
// src/lib/content/landingKern/sauna.js (Gruppe „landing-kern“).
// Layout: src/components/Landing/landingPage.js (wie /kuechen-vorarlberg).
//
// Regeln:
// - Händleraussage NUR über den Claim-Guard (dealerStatementList, src/lib/legal/
//   claims.js), kein Händlerwort im Text selbst.
// - Fakten nur aus dem Herstellerkatalog (src/lib/katalog/marken/starpool.js,
//   soleum.js, fabio-alemanno.js) und src/lib/wellness/marken.js: Starpool =
//   Saunen (Classic, Glamour, Shade, Sport, Soul, Sweet, I.Con, Combi; Soft-
//   Varianten), Außensauna Nature Sauna (personal: Elektro- oder Holzofen mit
//   Kamin; Nature Soft Sauna: drei Größen), Infrarotkabinen, Dampfbäder, Ice Bath;
//   Soleum = Dampfbad ELLIPSE für außen (vier Personen, anschlussfertig mit Glas),
//   beheizte Liegen aus Pregarten; Fabio Alemanno = beheizte Liegen und Hammam.
//   Soleum führt im Katalog KEINE Sauna – wird nur für Dampfbad und Liegen genannt.
//   Keine Preise, keine Lieferzeiten, keine Referenzen, keine Wirkversprechen.
// - „Saunabau“: Platzhirsch plant und koordiniert (Handelsgewerbe); gefertigt wird
//   beim Hersteller, montiert mit den Gewerken – nie als eigene Handwerksleistung.
// - Kein Ausstellungsversprechen („im Termin anhand von Herstellerunterlagen und Mustern“).
// - Strom nur allgemein („im Termin klären“, befugter Elektrofachbetrieb).
// - Lieferung „auf Wunsch/auf Anfrage“ (Entscheidung Nr. 3); Schweiz: Ausfuhr und
//   Verzollung kommen dazu (Wortlaut wie src/lib/ezarri/copy.js `laender`).
// - Bilder: Herstellerbilder aus dem Katalog mit Bildfreigabe laut Inhaber
//   (Nr. 19, docs/bildquellen/QUELLEN.md), unverändert; Alt-Texte aus dem Katalog.
// - Kein Markenblock (BrandGroups verlinkt /ueber-uns/marken/<slug>, das es für die
//   Wellness-Marken nicht gibt) – Markenlinks führen in den Katalog (/bad-wellness/marke/…).
// JSON-LD WebPage + FAQPage via LandingPage.
import { notFound } from "next/navigation";
import LandingPage, { landingMetadata } from "@/components/Landing/landingPage";
import { KERN_LOCALES, kernContent, kernMetadata, withKernLanguages } from "@/lib/content/landingKern";
import { dealerStatementList } from "@/lib/legal/claims";

const PATH = "/sauna-kaufen";
// Marken mit belegtem Händlerstatus auf dieser Seite (CLAIM_REGISTER).
const DEALER_BRANDS = ["starpool", "soleum", "fabio-alemanno"];

export async function generateMetadata({ params }) {
  const { locale } = await params;
  if (!KERN_LOCALES.includes(locale)) return {};
  if (locale !== "de") return kernMetadata({ path: PATH, locale });
  return withKernLanguages(landingMetadata({
    path: PATH,
    title: "Sauna kaufen in Vorarlberg",
    description:
      "Sauna für zuhause, Außensauna oder Infrarotkabine mit Starpool, von Hand und in 3D geplant in Lochau am Bodensee. Lieferung nach AT, DE, CH auf Anfrage.",
  }), PATH);
}

const CONTENT = {
  thema: "wellness",
  processText:
    "Harald Menghin zeichnet Ihren Saunaraum zuerst von Hand: Kabine, Ruhebereich, Dusche, Wege und Licht. Danach planen wir in 3D mit exakten Maßen und Anschlüssen, und Sie sehen Holz, Glas und Licht als Rendering, bevor etwas bestellt wird.",
  banner: {
    image: "/Images/Wellness/produkte/starpool/starpool-classic-sauna-1.webp",
    title: "Sauna kaufen in Vorarlberg: Sauna für zuhause, geplant am Bodensee",
    lead: "Saunabau für Haus und Garten – von Hand gezeichnet in Lochau, für Vorarlberg, den deutschen Bodensee und die Schweiz.",
    alt: "Starpool Classic Sauna: Kabine aus hellem Holz mit Panoramafenster und rundem Saunaofen",
    crumb: "Sauna kaufen",
  },
  facts: [
    { label: "Österreich", value: "Lieferung und Montage auf Wunsch, abgestimmt mit Elektriker und Installateur" },
    { label: "Deutschland", value: "Kein Zoll – Österreich und Deutschland liegen im EU-Binnenmarkt; Lieferung auf Anfrage" },
    { label: "Schweiz", value: "Lieferung auf Anfrage; Ausfuhr und Verzollung kommen dazu – den Ablauf erklären wir Ihnen" },
  ],
  intro: {
    eyebrow: "Sauna · Vorarlberg · Bodensee",
    heading: "Eine Sauna, die zu Haus und Garten passt",
    paragraphs: [
      "Eine Sauna für zuhause ist ein eigener Raum: Kabine, Ruhebereich, Dusche und Licht müssen zusammenpassen, dazu Lüftung und Strom. Bei Platzhirsch Home Living in Lochau planen wir die Sauna deshalb wie jeden anderen Raum – zuerst von Hand, dann in 3D – und stimmen Lieferung und Montage mit Elektriker und Installateur ab. Gefertigt wird die Kabine beim Hersteller.",
      "Wir planen mit Saunen von Starpool aus Ziano di Fiemme im Trentino: finnische Saunen in mehreren Kollektionen für den Innenraum, die Nature Sauna für Garten und Terrasse – wahlweise mit Elektroofen oder mit Holzofen samt Kamin –, dazu Infrarotkabinen, Dampfbäder und Ice Bath. Für den Ruhebereich kommen beheizte Liegen von Soleum aus Pregarten in Oberösterreich und von Fabio Alemanno dazu; Soleum fertigt mit ELLIPSE außerdem ein Dampfbad für den Außenbereich.",
    ],
    benefits: [
      "Saunaraum von Hand gezeichnet, dann in 3D geplant",
      "Starpool: finnische Saunen, Außensauna Nature Sauna, Infrarotkabinen und Dampfbäder",
      "Sauna, Ruhebereich und Wohnbereich aus einer Hand geplant",
      "Lieferung und Montage auf Wunsch, mit Elektriker und Installateur abgestimmt",
    ],
    image: "/Images/Wellness/produkte/starpool/starpool-nature-sauna-personal-1.webp",
    imageAlt: "Starpool Nature Sauna personal: dunkle Außensauna auf einer Terrasse",
  },
  steps: {
    eyebrow: "So entsteht Ihre Sauna",
    heading: "Von der ersten Idee bis zur Montage",
    items: [
      { title: "Beratung in Lochau", text: "Wir sprechen über Nutzung, Platz und Aufstellung – im Haus oder im Garten – und vergleichen Sauna, Infrarotkabine und Dampfbad sowie Hölzer und Glas anhand von Herstellerunterlagen und Mustern." },
      { title: "Von Hand gezeichnet", text: "Harald Menghin zeichnet Ihren Saunaraum zuerst von Hand: Kabine, Ruhebereich, Dusche, Wege und Licht. Danach planen wir in 3D mit exakten Maßen." },
      { title: "Technik & Gewerke", text: "Stromanschluss, Lüftung, Wasser für die Dusche und bei Außensaunen Fundament und Kamin zeichnen wir in den Plan ein und stimmen sie mit Elektriker, Installateur und Hersteller ab. Was Ihr Raum braucht, klären wir im Termin." },
      { title: "Lieferung & Montage", text: "Die Kabine kommt vom Hersteller; Lieferung und Montage koordinieren wir auf Wunsch – in Deutschland und der Schweiz auf Anfrage. Für die Schweiz kommen Ausfuhr und Verzollung dazu." },
    ],
    links: [
      { href: "/arbeitsweise", label: "So arbeiten wir im Detail" },
      { href: "/bad-wellness/kategorie/sauna", label: "Alle Saunen im Katalog" },
      { href: "/bad-wellness/marke/starpool", label: "Starpool: Saunen, Dampfbäder und Infrarot" },
      { href: "/bad-wellness/marke/soleum", label: "Soleum: Dampfbad und beheizte Liegen" },
      { href: "/bad-wellness", label: "Bad & Wellness: alle Marken" },
      { href: "/ezarri/wellness", label: "Ezarri-Glasmosaik für den Wellnessbereich" },
      { href: "/einkaufen-aus-der-schweiz", label: "Einkaufen aus der Schweiz: Ausfuhr und Verzollung" },
      { href: "/pflege-service", label: "Pflege-Service für Möbel und Polster" },
    ],
  },
  gallery: [
    { src: "/Images/Wellness/produkte/starpool/starpool-glamour-sauna-1.webp", alt: "Starpool Glamour Sauna: Kabine in schwarz gewachster Tanne mit Bank und Ofen" },
    { src: "/Images/Wellness/produkte/starpool/starpool-shade-sauna-1.webp", alt: "Starpool Shade Sauna: Sauna mit Holzlamellen-Blenden in einem Wohnraum" },
    { src: "/Images/Wellness/produkte/starpool/starpool-nature-soft-sauna-1.webp", alt: "Starpool Nature Soft Sauna: dunkle Außenkabine mit Glasfront im Garten" },
  ],
  showroom: {
    heading: "Sauna-Beratung am Bodensee",
    text: "Nur wenige Minuten von Bregenz entfernt zeigen wir Möbel und Leuchten internationaler Designmarken. Saunen besprechen wir im Termin anhand von Herstellerunterlagen, Holz- und Glasmustern und Plänen und zeigen Ihnen Ihren Raum in 3D. Ob und welche Kabinen gerade zu sehen sind, sagen wir Ihnen bei der Terminvereinbarung.",
  },
  cta: {
    heading: "Planen wir Ihre Sauna",
    text: "Vereinbaren Sie einen unverbindlichen Beratungstermin in Lochau – oder schreiben Sie uns, wo die Sauna stehen soll.",
  },
  faq: {
    name: "sauna-faq",
    heading: "Fragen zum Sauna-Kauf",
    items: [
      { q: "Wie läuft die Saunaplanung bei Platzhirsch ab?", a: "Im ersten Gespräch klären wir Nutzung, Platz und Aufstellung. Harald Menghin zeichnet Ihren Saunaraum von Hand, danach planen wir in 3D mit Maßen, Lüftung und Anschlüssen. Kabine, Hölzer, Glas und Ofen wählen Sie anhand von Herstellerunterlagen und Mustern. Gefertigt wird beim Hersteller; Lieferung und Montage koordinieren wir mit den Gewerken." },
      { q: "Sauna im Haus: Was muss der Raum können?", a: "Die Kabine braucht einen ebenen Boden, Platz zum Öffnen der Tür und für den Ofen, eine Lüftung und einen Stromanschluss; ein Ruhebereich und eine Dusche in der Nähe machen den Raum rund. Keller, Bad oder Dachgeschoss haben jeweils eigene Anforderungen an Raumhöhe und Feuchteschutz – was Ihr Raum braucht, klären wir im Termin und mit dem Hersteller." },
      { q: "Außensauna im Garten: Was ist zu beachten?", a: "Ein ebenes, tragfähiges Fundament, ein Stromanschluss und bei Holzofen ein Kamin. Die Starpool Nature Sauna personal gibt es wahlweise mit Elektroofen oder mit Holzofen samt Kamin; für den Elektroofen nennt der Hersteller 400 V. Ob eine Bauanzeige oder Bewilligung nötig ist, klärt Ihre Gemeinde." },
      { q: "Wer übernimmt den Stromanschluss?", a: "Den Anschluss stellt ein befugter Elektrofachbetrieb her. Welche Spannung und Absicherung ein Ofen braucht, steht in den Herstellerangaben des Modells. Leitungsweg und Anschlusspunkt zeichnen wir in die Planung ein – die Details klären wir im Termin mit dem Elektriker." },
      { q: "Liefern Sie Saunen auch nach Deutschland und in die Schweiz?", a: "Ja, auf Anfrage – nach Vorarlberg, Deutschland, in die Schweiz und nach Liechtenstein. Zwischen Österreich und Deutschland gibt es keinen Zoll. Für die Schweiz kommen Ausfuhr und Verzollung dazu; den Ablauf beschreiben wir auf platzhirsch.studio/de/einkaufen-aus-der-schweiz und besprechen ihn gern mit Ihnen." },
      { q: "Sauna, Infrarotkabine oder Dampfbad?", a: "Eine finnische Sauna arbeitet mit trockener Hitze vom Ofen, eine Soft Sauna laut Hersteller mit milderer Wärme, eine Infrarotkabine wärmt über Strahler, ein Dampfbad über feuchte Wärme. Starpool führt alle drei Kabinenarten, Soleum mit ELLIPSE ein Dampfbad für den Außenbereich. Was zu Ihrem Raum und Ihrer Nutzung passt, besprechen wir im Termin – gesundheitliche Wirkungen beschreiben wir nicht, dazu machen die Hersteller Angaben." },
    ],
  },
};

export default async function SaunaKaufenPage({ params }) {
  const { locale } = await params;
  if (!KERN_LOCALES.includes(locale)) notFound();
  const base = kernContent(PATH, locale, CONTENT);
  // Händlersatz aus dem Claim-Guard in der Seitensprache, als eigener Absatz nach der Einleitung.
  const dealer = dealerStatementList(DEALER_BRANDS, locale);
  const content = dealer ? { ...base, intro: { ...base.intro, paragraphs: [...base.intro.paragraphs, dealer] } } : base;
  return <LandingPage content={content} path={PATH} />;
}
