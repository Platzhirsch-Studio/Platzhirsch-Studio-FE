// /de/designermoebel-feldkirch — local landing page for Feldkirch and the
// Vorarlberger Oberland (German only; other locales 404).
// Layout: src/components/Landing/landingPage.js.
// Robots via landingMetadata → regionRobots() (doorway audit, src/lib/seo/
// sitemap/doorwayAudit.js); JSON-LD WebPage + FAQPage via LandingPage.
//
// Facts and sources (Marktresearch):
// - Distance Lochau–Feldkirch approx. 32–35 km: 01, 04, 16.
// - Purchase within Austria: no customs, Austrian VAT 20 % (18 §0 Nr. 4 uses
//   the Austrian gross price with 20 %).
// - Café on site: 00 (Betreiber-GmbH inkl. Café).
// No driving time is given in the reports, so the page names the distance only.
import { notFound } from "next/navigation";
import LandingPage, { landingMetadata } from "@/components/Landing/landingPage";
import RegionLinks from "@/app/[locale]/regionen/RegionLinks";

const PATH = "/designermoebel-feldkirch";

export async function generateMetadata({ params }) {
  const { locale } = await params;
  if (locale !== "de") return {};
  return landingMetadata({
    path: PATH,
    title: "Möbel & Designermöbel Feldkirch & Oberland",
    description:
      "Designermöbel, Leuchten und Klassiker für Feldkirch, Rankweil, Götzis und das Oberland – im Showroom in Lochau, rund 35 km über die A14.",
  });
}

const CONTENT = {
  // Runde 2 (P3): Termin-Knöpfe mit Kontext (ux P1-1) und der Kern-USP als
  // kurzer Abschnitt mit eigenem Satz (gesamtwerk P1-4, Durchdringungsplan §5).
  ort: "feldkirch",
  processText:
    "Wir kommen zu Ihnen nach Feldkirch, sehen uns Licht und Räume an, und Harald Menghin zeichnet Ihr Konzept von Hand. Für Altbauten nehmen wir uns die Zeit, den Bestand genau aufzunehmen. Danach planen wir in 3D, und Sie sehen Ihren Raum fotorealistisch, bevor etwas bestellt wird.",
  inLanguage: "de-AT",
  banner: {
    image: "/Images/Licht/bannerImageLicht1.jpg",
    title: "Designermöbel und Einrichtung für Feldkirch",
    alt: "Esstisch mit hellgrauen Polsterstühlen unter einem kupferfarbenen Kronleuchter, daneben ein Bücherregal und eine Fensterfront zum Garten",
    crumb: "Designermöbel Feldkirch",
    trail: [{ label: "Regionen", href: "/regionen" }], // Rat 9,5 B15: Regionen-Hub als Elternseite
  },
  intro: {
    eyebrow: "Für Feldkirch und das Oberland",
    heading: "Einmal durchs Land – und alles an einem Ort sehen",
    paragraphs: [
      "Von Feldkirch nach Lochau sind es rund 35 Kilometer, fast die ganze Strecke auf der Rheintalautobahn A14. Damit sich der Weg aus dem Oberland lohnt, zeigen wir in unserer Ausstellung Möbel, Leuchten und Accessoires internationaler Designmarken für Wohnzimmer, Essbereich, Schlafzimmer und Terrasse – auf einer Fläche und in einem Termin.",
      "Ob Feldkirch, Rankweil, Götzis, Frastanz oder der Walgau: Sie kaufen innerhalb Österreichs, ohne Zoll und ohne Einfuhrformalitäten. Lieferung und Montage bei Ihnen zu Hause stimmen wir direkt mit Ihnen ab.",
    ],
    benefits: [
      "Rund 35 km von Feldkirch über die A14",
      "Möbel, Leuchten und Accessoires in einem Termin",
      "Einkauf innerhalb Österreichs – ohne Zoll",
      "Café im Haus für eine Pause während der Beratung",
    ],
    image: "/Images/Home/secondAboutHome.jpg",
    imageAlt: "Showroom von Platzhirsch Home Living in Lochau mit Sofas und Sesseln",
  },
  brands: {
    eyebrow: "In der Ausstellung",
    heading: "Klassiker und Licht, die bleiben",
    items: [
      {
        name: "ClassiCon",
        slug: "classicon",
        image: "/Images/Home/slider/classicon-bell-beistelltische.webp",
        imageAlt: "ClassiCon Bell Beistelltische mit farbigen Glasfüßen",
        text: "Möbel und Leuchten aus München – Klassiker der Moderne neben zeitgenössischem Design. Einzelstücke wie ein Beistelltisch oder ein Sessel passen in ein Altstadthaus ebenso wie in einen Neubau.",
      },
      {
        name: "Flos",
        slug: "flos",
        image: "/Images/Home/slider/flos-stehleuchte-v3.webp",
        imageAlt: "Flos Stehleuchte mit runder Leuchtscheibe auf verchromtem Dreibein",
        text: "Italienische Leuchten für Esstisch, Sofa und Raum. Wie hell, warm oder blendfrei eine Leuchte wirkt, lässt sich im Original deutlich besser beurteilen als im Katalog.",
      },
    ],
    cta: { href: "/produkte", label: "Alle Produkte ansehen" },
  },
  steps: {
    eyebrow: "Ihr Besuch aus dem Oberland",
    heading: "So wird die Fahrt nach Lochau zum Gewinn",
    items: [
      { title: "Termin anfragen", text: "Mit einem Termin wissen wir vorab, was Sie suchen, und können passende Stücke, Stoffe und Oberflächen für Sie bereitlegen." },
      { title: "Unterlagen mitbringen", text: "Grundriss, Raummaße und Fotos Ihrer Räume machen aus einem Rundgang eine konkrete Planung – Sie müssen für Rückfragen nicht noch einmal fahren." },
      { title: "Alles auf einmal prüfen", text: "Sofa, Esstisch, Leuchten und Accessoires lassen sich bei uns nebeneinander vergleichen. So sehen Sie, ob Farben und Materialien zusammenpassen." },
      { title: "Lieferung ins Oberland", text: "Nach der Bestellung stimmen wir Liefertermin und Montage bei Ihnen zu Hause mit Ihnen ab – in Feldkirch ebenso wie in den Gemeinden rundum." },
    ],
  },
  gallery: [
    { src: "/Images/Wohnen/bannerImage2.jpg", alt: "Runder Esstisch mit Designerstuhl und Ringleuchte" },
    { src: "/Images/Licht/bannerImageLicht5.jpg", alt: "Kupferfarbene Pendelleuchten über einem Holztisch in einem Raum mit Schachbrettboden" },
    { src: "/Images/Wohnen/bannerImage1.jpg", alt: "Beistelltische aus Glas und Messing vor einer Betonwand" },
  ],
  showroom: {
    heading: "Von Feldkirch nach Lochau",
    text: "Über die Rheintalautobahn A14 Richtung Bregenz und weiter nach Lochau an der Landstraße, kurz vor der Grenze zu Bayern. Mit dem Zug fahren Sie über Bregenz, von dort sind es nur wenige Minuten bis zu uns. Kommen Sie vorbei – oder vereinbaren Sie einen Termin für eine ausführliche Beratung.",
  },
  cta: {
    image: "/Images/Wohnen/bannerImage9.jpg",
    heading: "Planen Sie Ihren Besuch aus dem Oberland",
    text: "Vereinbaren Sie einen unverbindlichen Beratungstermin – dann nehmen wir uns Zeit für Ihr ganzes Projekt.",
  },
  faq: {
    name: "feldkirch-faq",
    heading: "Fragen zu Designermöbeln für Feldkirch",
    items: [
      { q: "Wie weit ist Ihr Showroom von Feldkirch entfernt?", a: "Rund 35 Kilometer, fast durchgehend über die Rheintalautobahn A14. Unser Showroom liegt in der Landstraße 11 in 6911 Lochau, wenige Minuten hinter Bregenz." },
      { q: "Liefern und montieren Sie auch in Feldkirch und im Oberland?", a: "Ja, sprechen Sie uns an. Liefertermin und Montage stimmen wir für Ihre Adresse – ob in Feldkirch, Rankweil, Götzis oder im Walgau – direkt mit Ihnen ab." },
      { q: "Fallen beim Kauf Zoll oder ausländische Steuern an?", a: "Nein. Lochau und Feldkirch liegen beide in Vorarlberg – Sie kaufen innerhalb Österreichs mit einer normalen österreichischen Rechnung." },
      { q: "Lohnt sich die Fahrt für ein einzelnes Möbelstück?", a: "Gerade bei Sofas, Sesseln und Leuchten lohnt sich der Vergleich im Original: Sitzkomfort, Stoffe und Lichtwirkung sieht man auf dem Bildschirm kaum. Mit einem Termin bereiten wir passende Stücke für Sie vor." },
      { q: "Wann hat der Showroom geöffnet?", a: "Dienstag bis Freitag von 10 bis 18 Uhr und Samstag von 10 bis 14 Uhr. Für eine ausführliche Beratung empfehlen wir einen Termin." },
      { q: "Was sollte ich zur Beratung mitbringen?", a: "Hilfreich sind ein Grundriss oder die wichtigsten Raummaße, Fotos Ihrer Räume und – falls vorhanden – Bilder von Einrichtungen, die Ihnen gefallen." },
    ],
  },
};

export default async function DesignermoebelFeldkirchPage({ params }) {
  const { locale } = await params;
  if (locale !== "de") notFound();
  return (
    <>
      <LandingPage content={CONTENT} path={PATH} />
      {/* Rat 9,5 B15: Nachbarorte, Ratgeber, Küche, Hotel & Objekt, Regionen-Hub */}
      <RegionLinks path={PATH} />
    </>
  );
}
