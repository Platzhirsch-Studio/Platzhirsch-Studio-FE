// /<locale>/outdoor-kueche – SEO-Landingpage „Outdoor-Küche“ (02.11.2026).
// Layout: src/components/Landing/landingPage.js (wie /kuechen-vorarlberg).
// Deutsch = Master (CONTENT unten), EN/FR/IT über die Gruppe „landing-kern“
// (src/lib/content/landingKern/outdoorKueche.js). Indexierbar, in
// sitemap-static.xml (src/lib/seo/sitemap/extraPages.js).
//
// Suchbegriffe (SISTRIX, Vol. AT/DE/CH): „outdoor küche“ 3.800/20.900/1.450,
// „outdoor küche kaufen“, „outdoorküche planen“, „gartenküche“, „außenküche“,
// regional Vorarlberg/Bodensee/Schweiz. Vorarbeit:
// Marktresearch/digital/features/outdoor-landingpage.md (Punkt 4: bewusst
// kein Hersteller für Outdoor-Küchen) und Marktresearch/02-marktanalyse.md.
//
// Regeln (Claim-Guard src/lib/legal/claims.js, Design-Bibel §14):
// - Der Inhaber hat bestätigt, dass Outdoor-Küchen im Sortiment sind. Im
//   Katalog (src/lib/katalog) gibt es keinen Outdoor-Küchen-Hersteller, darum
//   markenneutral: „Outdoor-Küchen nach Maß, geplant in Lochau“.
// - Geräte: Von den belegten Gerätemarken (VERIFIED_DEALER_BRANDS) hat nur
//   Liebherr ein Outdoor-Gerät im Katalog (Outdoor-Kühlschrank UORpr, Serie
//   Prime, src/lib/katalog/marken/liebherr.js). Nur dieses wird genannt – ohne
//   Händlerwort. Gaggenau, Miele, BORA, Quooker: keine Outdoor-Geräte im
//   Katalog → nicht genannt. Binni-Steinlinie: Frostbeständigkeit nicht
//   geprüft (outdoor-landingpage.md Punkt 4) → nicht genannt.
// - Keine Superlative, Preise, Referenzen, Lieferfristen; Lieferung „auf
//   Wunsch“/„auf Anfrage“; Schweiz: „Ausfuhr und Verzollung kommen dazu“
//   (Wortlaut src/lib/ezarri/copy.js laender).
// - Kein Showroom-Versprechen für Outdoor-Küchen: Vergleich „im Termin anhand
//   von Mustern“ (wie /kuechen-vorarlberg, QM P2-1).
// - Anschlüsse für Wasser, Strom und Gas: befugte Installateure und Elektriker
//   (gleiche Rollenverteilung wie /outdoor-gartenplanung, GewO).
// - Bilder: Hero typografisch (imagery.js released: false, kein eigenes Foto).
//   Intro-Bild = Liebherr-Raumszene „Außenküche auf der Dachterrasse“ aus dem
//   Katalog (Bildfreigabe laut Inhaber, Entscheidung Nr. 24), im eigenen
//   Seitenverhältnis. Keine Galerie (kein weiteres freigegebenes Motiv).
// JSON-LD WebPage + BreadcrumbList + FAQPage via LandingPage.
import { notFound } from "next/navigation";
import LandingPage, { landingMetadata } from "@/components/Landing/landingPage";
import RegionLinks from "@/app/[locale]/regionen/RegionLinks";
import { KERN_LOCALES, kernContent, kernMetadata, withKernLanguages } from "@/lib/content/landingKern";

const PATH = "/outdoor-kueche";

// Katalogseite des einzigen Outdoor-Geräts einer belegten Marke (Liebherr).
const LIEBHERR_OUTDOOR_PATH = "/kuechengeraete/produkte/liebherr-outdoor-kuehlschrank";

export async function generateMetadata({ params }) {
  const { locale } = await params;
  if (!KERN_LOCALES.includes(locale)) return {};
  if (locale !== "de") return kernMetadata({ path: PATH, locale });
  return withKernLanguages(landingMetadata({
    path: PATH,
    // „Outdoor-Küche planen“ vorn (Hauptbegriff + Absicht), Region im Titel.
    // Description ≤ 150 Zeichen (clampDescription schneidet sonst ganze Sätze ab).
    title: "Outdoor-Küche planen in Vorarlberg",
    description:
      "Outdoor-Küchen nach Maß, von Hand geplant in Lochau am Bodensee: Grill, Kochfeld, Spüle und Kühlung für Garten und Terrasse. Lieferung auf Wunsch.",
  }), PATH);
}

// Statischer deutscher Text; Fakten (Adresse, Öffnungszeiten) wie Footer/CMS.
const CONTENT = {
  // Termin-Knöpfe mit Kontext „Küche“ (Terminart Planung, src/lib/booking/types.js).
  thema: "kueche",
  processText:
    "Harald Menghin zeichnet Ihre Outdoor-Küche zuerst von Hand: Lage zum Haus, Wege zur Innenküche, Arbeitsflächen, Sonne und Wind. Danach planen wir sie in 3D mit exakten Maßen und Anschlüssen, und Sie sehen Korpus, Arbeitsplatte und Geräte als Rendering, bevor etwas bestellt wird.",
  banner: {
    image: "/Images/Wellness/produkte/liebherr/liebherr-outdoor-kuehlschrank-2.webp",
    title: "Outdoor-Küche planen: Außenküche nach Maß am Bodensee",
    lead: "Kochen im Garten und auf der Terrasse – geplant in Lochau, abgestimmt auf Ihr Grundstück, Ihre Gäste und das Wetter am See.",
    alt: "Außenküche aus Holz auf einer Dachterrasse mit geöffnetem Outdoor-Kühlschrank",
    crumb: "Outdoor-Küche",
    trail: [{ label: "Outdoor & Pool" }],
  },
  intro: {
    eyebrow: "Outdoor-Küche aus Lochau",
    heading: "Gartenküche, Außenküche, Outdoor-Küche: die Küche unter freiem Himmel",
    paragraphs: [
      "Eine Outdoor-Küche macht die Terrasse zum zweiten Esszimmer: Grill, Kochfeld, Spüle und Kühlung dort, wo Sie im Sommer ohnehin sind. Bei Platzhirsch Home Living in Lochau planen wir Außenküchen nach Maß – mit Materialien, die Regen, Sonne und Frost vertragen, und mit einer Planung, die zu Haus, Garten und Innenküche passt.",
      "Ob Gartenküche in Vorarlberg, Dachterrasse am Bodensee oder Seegrundstück in der Schweiz: Wir begleiten Sie von der ersten Handzeichnung bis zur montierten Küche und stimmen Anschlüsse mit den Fachbetrieben ab, die Sie beauftragen.",
    ],
    benefits: [
      "Outdoor-Küche von Hand gezeichnet, dann in 3D geplant",
      "Materialien und Oberflächen für draußen im Termin anhand von Mustern vergleichen",
      "Grill, Kochfeld, Spüle und Kühlung von Anfang an eingeplant",
      "Lieferung und Montage auf Wunsch, in der Schweiz mit Ausfuhr und Verzollung",
    ],
    image: "/Images/Wellness/produkte/liebherr/liebherr-outdoor-kuehlschrank-2.webp",
    imageAlt: "Außenküche aus Holz auf einer Dachterrasse mit geöffnetem Outdoor-Kühlschrank von Liebherr",
  },
  steps: {
    eyebrow: "So entsteht Ihre Outdoor-Küche",
    heading: "Von der Handzeichnung bis zum ersten Grillabend",
    items: [
      { title: "Beratung in Lochau", text: "Wir lernen Ihr Grundstück und Ihre Gewohnheiten kennen: Wie viele Gäste, wie oft, wo steht die Sonne am Abend? Dazu vergleichen Sie Materialien für draußen anhand von Mustern." },
      { title: "Von Hand gezeichnet", text: "Harald Menghin zeichnet Ihre Außenküche zuerst von Hand: Lage, Arbeitsflächen, Wege zur Innenküche, Sonne und Wind. Danach planen wir sie in 3D mit exakten Maßen und Anschlüssen." },
      { title: "Materialien & Geräte", text: "Gemeinsam wählen Sie Korpus, Arbeitsplatte und Fronten für den Außenbereich sowie Grill, Kochfeld, Spüle und Kühlung – bis zum Stauraum für Geschirr und Gasflasche." },
      { title: "Anschlüsse & Montage", text: "Wasser, Strom und Gas legen befugte Installateure und Elektriker, die Sie beauftragen; wir stimmen die Termine ab und koordinieren Lieferung und Montage der Küche." },
    ],
    links: [
      { href: "/arbeitsweise", label: "So arbeiten wir im Detail" },
      { href: "/kuechenplaner", label: "Küchenplaner: Zeilen und Maße online vorbereiten" },
      { href: "/outdoor-gartenplanung", label: "Outdoor-Planung: Terrasse, Beschattung und Licht" },
      { href: "/outdoor-winterservice", label: "Winterservice für Outdoor-Möbel" },
      { href: "/bodensee-licht", label: "Sonnenstand auf Ihrer Terrasse ansehen" },
      { href: LIEBHERR_OUTDOOR_PATH, label: "Outdoor-Kühlschrank von Liebherr im Katalog" },
    ],
  },
  gallery: [],
  showroom: {
    heading: "Outdoor-Küchen planen am Bodensee",
    text: "Nur wenige Minuten von Bregenz entfernt zeigen wir Möbel und Leuchten internationaler Designmarken. Für Ihre Outdoor-Küche vereinbaren Sie am besten einen Termin – dann nehmen wir uns Zeit und legen Muster für Arbeitsplatten, Fronten und Oberflächen für draußen bereit.",
  },
  cta: {
    image: "/Images/Wellness/produkte/liebherr/liebherr-outdoor-kuehlschrank-2.webp",
    heading: "Planen wir Ihre Outdoor-Küche",
    text: "Vereinbaren Sie einen unverbindlichen Beratungstermin in Lochau – oder bereiten Sie Zeilen und Maße im Küchenplaner vor.",
  },
  faq: {
    name: "outdoor-kueche-faq",
    heading: "Fragen zur Outdoor-Küche",
    items: [
      { q: "Wie läuft die Planung einer Outdoor-Küche bei Platzhirsch ab?", a: "Nach einem ersten Gespräch zeichnet Harald Menghin Ihre Außenküche von Hand: Lage zum Haus, Arbeitsflächen, Wege zur Innenküche, Sonne und Wind. Danach planen wir sie in 3D mit exakten Maßen und Anschlüssen. Anschließend wählen Sie Materialien und Geräte, zum Schluss koordinieren wir Lieferung und Montage." },
      { q: "Welche Materialien eignen sich für eine Außenküche?", a: "Draußen zählen Regen, Sonne, Temperaturwechsel und Frost. Üblich sind Edelstahl, Keramik und Naturstein für Arbeitsplatten sowie pulverbeschichtetes Aluminium, Edelstahl oder Teak für Korpus und Fronten. Welche Kombination zu Ihrem Standort am See, in der Sonne oder im Wind passt, klären wir in der Beratung; wir halten uns an die Angaben der Hersteller zur Eignung im Außenbereich." },
      { q: "Welche Geräte gehören in eine Outdoor-Küche?", a: "Meist ein Grill, dazu je nach Nutzung Kochfeld, Spüle und Kühlung – zum Beispiel ein integrierbarer Outdoor-Kühlschrank von Liebherr. Grill und Geräte planen wir von Anfang an ein, damit Maße, Stauraum und Anschlüsse zusammenpassen. Wasser, Strom und Gas legen befugte Installateure und Elektriker." },
      { q: "Kann ich meine Outdoor-Küche erst online vorplanen?", a: "Ja. Der Küchenplaner auf platzhirsch.studio/de/kuechenplaner ist für Innenküchen gebaut, eignet sich aber, um Länge, Zeilen und Abläufe Ihrer Außenküche vorzubereiten. Wenn Sie danach mit uns planen, zeichnet Harald Menghin die Outdoor-Küche von Hand weiter, und wir prüfen Maße und Anschlüsse vor Ort." },
      { q: "Liefern Sie Outdoor-Küchen auch nach Deutschland und in die Schweiz?", a: "Lieferung und Montage gibt es auf Wunsch: am Bodensee, im Dreiländereck und auf Anfrage darüber hinaus. Für die Schweiz kommen Ausfuhr und Verzollung dazu; den Ablauf klären wir vor dem Kauf mit Ihnen." },
      { q: "Was passiert mit der Outdoor-Küche im Winter?", a: "Eine Außenküche aus witterungsbeständigen Materialien bleibt draußen. Vor dem Frost werden Wasserleitungen entleert, Geräte nach Herstellerangabe vorbereitet und die Küche abgedeckt; die Einzelheiten stehen in Ihrer Planung. Für Outdoor-Möbel, Polster und Schirme bieten wir einen Winterservice mit Abholung, Pflege und Lagerung an." },
    ],
  },
};

export default async function OutdoorKuechePage({ params }) {
  const { locale } = await params;
  if (!KERN_LOCALES.includes(locale)) notFound();
  const content = kernContent(PATH, locale, CONTENT);
  return (
    <>
      <LandingPage content={content} path={PATH} />
      {/* Regionsseiten gibt es nur auf Deutsch – der Block bleibt deutsch (wie /kuechen-vorarlberg). */}
      {locale === "de" && <RegionLinks path={PATH} />}
    </>
  );
}
