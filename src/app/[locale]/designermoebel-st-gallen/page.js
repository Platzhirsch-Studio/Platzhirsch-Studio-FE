// /de/designermoebel-st-gallen — local landing page (German only; other
// locales 404). Layout: src/components/Landing/landingPage.js.
// Robots via landingMetadata → regionRobots() (doorway audit, src/lib/seo/
// sitemap/doorwayAudit.js); JSON-LD WebPage + BreadcrumbList + FAQPage via LandingPage.
// Swiss German spelling on purpose: "ss" instead of "ß" (Strasse, gross, Masse).
import { notFound } from "next/navigation";
import LandingPage, { landingMetadata } from "@/components/Landing/landingPage";
import RegionLinks from "@/app/[locale]/regionen/RegionLinks";
import OrtsMarken from "@/components/Landing/OrtsMarken";

const PATH = "/designermoebel-st-gallen";

export async function generateMetadata({ params }) {
  const { locale } = await params;
  if (locale !== "de") return {};
  return landingMetadata({
    path: PATH,
    title: "Möbel & Designermöbel für St. Gallen",
    description:
      "Designermöbel für St. Gallen: Showroom in Lochau, 30 bis 40 Minuten über St. Margrethen. Mit Ablauf von Lieferung, Ausfuhr und 8,1 % MWST.",
  });
}

// Content is static German (Swiss spelling) copy. Delivery to Switzerland "auf
// Anfrage" (Inhaber-Entscheidung Nr. 3); only official, generally valid facts
// about importing into Switzerland, no rate for a concrete purchase.
// Own facts (doorway audit, src/lib/seo/sitemap/doorwayAudit.js REGION_FACTS,
// Runde 3 P5, 28.10.2026) and their sources – nothing else is stated:
//   1. Drive time ~30–40 min, ~40–45 km (Marktresearch/02-marktanalyse.md
//      §3, digital/09-local-seo-reputation.md Einzugsgebiet).
//   2. Route via St. Margrethen and the border to Höchst, then Bregenz –
//      Lochau (crossing as on designermoebel-rheintal, no opening hours here).
//   3. Delivery by a forwarder: the forwarder declares export and import, the
//      customer pays 8,1 % MWST and the clearance fee on receipt (src/lib/ch/
//      content.js WEGE "Weg B", source IHK; the 8,1 % / BAZG block itself is
//      shared with the other CH pages and does not count).
//   4. Living situations of the city (Stockwerkeigentum, quarters Rosenberg,
//      Rotmonten, St. Georgen) and Lift-/Treppenhausmasse – geography and
//      planning only, no project, no reference.
//   The block for architects ("planer") is on this page and on Interior only.
// No prices, no references, no projects.
const CONTENT = {
  // Runde 2 (P3): Termin-Knöpfe mit Kontext (ux P1-1) und der Kern-USP als
  // kurzer Abschnitt mit eigenem Satz (gesamtwerk P1-4, Durchdringungsplan §5).
  ort: "st-gallen",
  processText:
    "Wir kommen zu Ihnen nach St. Gallen, sehen uns Licht und Räume an, und Harald Menghin zeichnet Ihr Konzept von Hand. Einfuhr und Mehrwertsteuer besprechen wir vor dem Kauf mit Ihnen. Danach planen wir in 3D, und Sie sehen Ihren Raum fotorealistisch, bevor etwas bestellt wird.",
  inLanguage: "de-CH",
  // ux P1-3: Block „Für Architektinnen & Planer“ (Persona Architektin St. Gallen).
  planer: {
    text: "Sie planen in St. Gallen oder der Ostschweiz ein Haus, eine Wohnung oder ein Objekt für Ihre Bauherrschaft? Wir ergänzen Ihre Planung um Möbel, Systeme und Licht und stimmen uns mit Ihnen ab.",
  },
  // Hero: typographic (imagery.js, released: false) – the former hero was a
  // manufacturer photo (Rimadesio) without a documented release.
  banner: {
    image: "/Images/UberUns/Rimadesio-Modulor.jpg",
    title: "Designermöbel und Einrichtung für St. Gallen",
    lead: "Von St. Gallen sind es 30 bis 40 Minuten über St. Margrethen nach Lochau. Wie Ihre Möbel über die Grenze kommen, besprechen wir vor dem Kauf mit Ihnen.",
    alt: "Wohnwand mit Holzpaneelen, Regalböden und Lowboard, davor eine schwarze Lederbank",
    crumb: "Designermöbel St. Gallen",
    trail: [{ label: "Regionen", href: "/regionen" }], // Rat 9,5 B15: Regionen-Hub als Elternseite
  },
  facts: [
    { label: "Fahrzeit ab St. Gallen", value: "30 bis 40 Minuten über St. Margrethen" },
    { label: "Lieferung per Spedition", value: "Auf Anfrage – die Spedition meldet Ausfuhr und Einfuhr an" },
    { label: "Bei der Einfuhr", value: "8,1 % Schweizer MWST, Regeln des BAZG" },
  ],
  intro: {
    eyebrow: "Für St. Gallen und die Ostschweiz",
    heading: "Designermöbel auf der anderen Seite des Bodensees",
    paragraphs: [
      "Von St. Gallen fahren Sie 30 bis 40 Minuten nach Lochau: über St. Margrethen und die Grenze bei Höchst, dann an Bregenz vorbei an den österreichischen Teil des Bodenseeufers. In unserem Showroom zeigen wir Möbel, Leuchten und Accessoires internationaler Designmarken: für Wohnzimmer, Essbereich und Schlafzimmer.",
      "Ob Stockwerkeigentum in der Stadt oder Haus am Rosenberg, in Rotmonten oder St. Georgen: Wer Möbel für mehrere Räume sucht, profitiert vom Vergleich vor Ort. Stoffe, Leder, Holz und Metall wirken im Original anders als auf dem Bildschirm. Bei Wohnungen klären wir früh die Masse von Lift und Treppenhaus.",
    ],
    benefits: [
      "30 bis 40 Minuten von St. Gallen",
      "Internationale Designmarken an einem Ort",
      "Lift- und Treppenhausmasse prüfen wir vor der Bestellung",
      "Fragen zur Einfuhr klären wir vor dem Kauf",
    ],
    image: "/Images/UberUns/living.jpg",
    imageAlt: "Wohnbereich mit dunklen Sofas, Sesseln, Regal und Treppe vor einer schwarzen Wand",
  },
  brands: {
    eyebrow: "Marken im Showroom",
    heading: "Schlafen und Wohnen mit Charakter",
    items: [
      {
        name: "Poliform",
        slug: "poliform",
        image: "/Images/Home/slider/poliform-schlafzimmer-bett.webp",
        imageAlt: "Poliform Polsterbett mit hohem Kopfteil in einem Schlafzimmer mit Holzwand",
        text: "Betten, Kleiderschränke, Sofas und Wohnsysteme aus Italien – in einer gemeinsamen, ruhigen Designsprache.",
      },
      {
        name: "Tréca",
        slug: "treca",
        image: "/Images/Home/slider/treca-paris-bett-schlafzimmer.webp",
        imageAlt: "Treca Paris Bett mit gemustertem Kopfteil in einem hellen Schlafzimmer",
        text: "Betten und Matratzen aus Paris – mit Kopfteilen, die sich in Stoff und Farbe individuell gestalten lassen.",
      },
    ],
    cta: { href: "/produkte", label: "Alle Produkte ansehen" },
  },
  steps: {
    eyebrow: "Gut zu wissen",
    heading: "Möbel aus Österreich in die Schweiz",
    items: [
      { title: "Einfuhr in die Schweiz", text: "Die Schweiz gehört nicht zur EU. Bei der Einfuhr von Möbeln fällt in der Regel die Schweizer Mehrwertsteuer an, derzeit 8,1 Prozent." },
      { title: "Lieferung per Spedition", text: "Liefern wir auf Anfrage in die Schweiz, meldet die Spedition die Ausfuhr in Österreich und die Einfuhr in der Schweiz an. Die MWST und die Verzollungsgebühr der Spedition bezahlen Sie beim Empfang." },
      { title: "Offizielle Regeln", text: "Massgebend sind die Bestimmungen des Bundesamts für Zoll und Grenzsicherheit (BAZG). Dort finden Sie die aktuellen Freigrenzen und Abgaben." },
      { title: "Masse mitbringen", text: "Ein Grundriss oder die wichtigsten Raummasse – Länge, Breite, Fenster und Türen, bei Wohnungen auch Lift und Treppenhaus – machen die Beratung konkret." },
    ],
  },
  gallery: [
    { src: "/Images/Licht/bannerImageLicht2.jpg", alt: "Goldener Kronleuchter mit verzweigten Armen und farbig schimmernden Glaskugeln" },
    { src: "/Images/Accessories/bannerImageAccessories2.jpg", alt: "Schwarze Vase mit getrockneten Zweigen vor einer hellen Wand" },
    { src: "/Images/UberUns/livingroom-view.jpg", alt: "Grosszügiger Wohnraum mit hellen Sofas, Sesseln und Couchtischen vor Vorhängen" },
  ],
  showroom: {
    heading: "Von St. Gallen nach Lochau",
    text: "Unser Showroom liegt in Lochau an der Landstraße 11, am österreichischen Ufer des Bodensees, nur wenige Minuten von Bregenz. Aus St. Gallen fahren Sie über St. Margrethen und Höchst. Kommen Sie vorbei – oder fragen Sie einen Termin an, damit wir uns ausreichend Zeit für Sie nehmen können.",
  },
  cta: {
    image: "/Images/Wohnen/bannerImage9.jpg",
    heading: "Besuchen Sie uns am Bodensee",
    text: "Fragen Sie einen unverbindlichen Beratungstermin in unserem Showroom in Lochau an.",
  },
  faq: {
    name: "st-gallen-faq",
    heading: "Fragen zu Designermöbeln für St. Gallen",
    items: [
      { q: "Wie lange fahre ich von St. Gallen nach Lochau?", a: "30 bis 40 Minuten, je nach Verkehr: über St. Margrethen und die Grenze bei Höchst, dann an Bregenz vorbei nach Lochau. Der Showroom liegt in der Landstraße 11 in 6911 Lochau, Österreich." },
      { q: "Muss ich bei der Einfuhr in die Schweiz Mehrwertsteuer bezahlen?", a: "In der Regel ja: Bei der Einfuhr von Waren in die Schweiz wird die Schweizer Mehrwertsteuer erhoben, derzeit 8,1 Prozent. Die aktuellen Regeln und Freigrenzen veröffentlicht das Bundesamt für Zoll und Grenzsicherheit (BAZG)." },
      { q: "Wie läuft eine Lieferung in die Schweiz ab?", a: "Auf Anfrage liefern wir mit einer Spedition. Sie meldet die Ausfuhr in Österreich und die Einfuhr in der Schweiz an; die MWST und ihre Verzollungsgebühr bezahlen Sie beim Empfang. Lassen Sie sich die Gebühr vorab nennen – wir klären den Ablauf vor dem Kauf mit Ihnen." },
      { q: "Prüfen Sie, ob die Möbel in meine Wohnung passen?", a: "Ja. Bringen Sie die Masse von Lift, Treppenhaus und Türen mit. Gerade bei Sofas und Schränken klären wir das vor der Bestellung." },
      { q: "Wann hat der Showroom geöffnet?", a: "Dienstag bis Freitag von 10 bis 18 Uhr und Samstag von 10 bis 14 Uhr. Für eine ausführliche Beratung empfehlen wir einen Termin." },
      { q: "Welche Marken finde ich bei Ihnen?", a: "Unter anderem Minotti, Poliform, Rimadesio, Flos, Paola Lenti und ClassiCon sowie weitere internationale Designmarken für Möbel, Leuchten und Accessoires." },
    ],
  },
};

export default async function DesignermoebelStGallenPage({ params }) {
  const { locale } = await params;
  if (locale !== "de") notFound();
  return (
    <>
      {/* QM R3: Vertragshändler-Block vor dem Abschluss-CTA statt danach. */}
      <LandingPage content={CONTENT} path={PATH} beforeClosing={<OrtsMarken path={PATH} />} />
      {/* Rat 9,5 B15: Nachbarorte, Ratgeber, Küche, Hotel & Objekt, Regionen-Hub */}
      <RegionLinks path={PATH} />
    </>
  );
}
