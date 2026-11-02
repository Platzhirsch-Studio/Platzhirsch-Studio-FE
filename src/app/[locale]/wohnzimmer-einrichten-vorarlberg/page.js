// /de/wohnzimmer-einrichten-vorarlberg — local landing page (German only;
// other locales 404). Layout: src/components/Landing/landingPage.js.
// Indexable (see landingMetadata); JSON-LD WebPage + FAQPage via LandingPage.
import { notFound } from "next/navigation";
import LandingPage, { landingMetadata } from "@/components/Landing/landingPage";
import RegionLinks from "@/app/[locale]/regionen/RegionLinks";
import { SOURCE_COPY } from "@/lib/sofaplaner/consent";
// landing-kern (01.11.2026): EN/FR/IT aus src/lib/content/landingKern (Deutsch = CONTENT unten, Master).
import { KERN_LOCALES, kernContent, kernMetadata, withKernLanguages } from "@/lib/content/landingKern";

const PATH = "/wohnzimmer-einrichten-vorarlberg";

export async function generateMetadata({ params }) {
  const { locale } = await params;
  if (!KERN_LOCALES.includes(locale)) return {};
  if (locale !== "de") return kernMetadata({ path: PATH, locale });
  return withKernLanguages(landingMetadata({
    path: PATH,
    title: "Wohnzimmer einrichten in Vorarlberg",
    description:
      "Designersofas, Sessel und Wohnkonzepte von Minotti, Poliform und weiteren Marken – persönlich geplant in unserem Showroom in Lochau am Bodensee.",
  }), PATH);
}

// Content is static German copy; keep facts (address, hours, brands) in sync with the footer/CMS.
const CONTENT = {
  // Runde 2 (P3): Termin-Knöpfe mit Kontext (ux P1-1) und der Kern-USP als
  // kurzer Abschnitt mit eigenem Satz (gesamtwerk P1-4, Durchdringungsplan §5).
  processText:
    "Bevor wir ein Sofa vorschlagen, zeichnet Harald Menghin Ihr Wohnzimmer von Hand: Sitzplätze, Blickachsen und Licht. Danach planen wir in 3D und zeigen Ihnen ein Rendering, bevor etwas bestellt wird.",
  banner: {
    image: "/Images/Wohnen/bannerImage4.jpg",
    title: "Wohnzimmer einrichten in Vorarlberg",
    alt: "Wohnzimmer mit hellem Ecksofa, Couchtisch und Sesseln",
    crumb: "Wohnzimmer Vorarlberg",
  },
  intro: {
    eyebrow: "Wohnkonzepte am Bodensee",
    heading: "Ein Wohnzimmer, in dem Sie gerne ankommen",
    paragraphs: [
      "Das Wohnzimmer ist der Raum, in dem Sie entspannen, Gäste empfangen und Zeit mit der Familie verbringen. Bei Platzhirsch Home Living in Lochau planen wir Wohnzimmer, die zu Ihrem Alltag passen – mit Designersofas, Sesseln, Tischen, Leuchten und Teppichen internationaler Marken.",
      "Ob gemütliche Sofalandschaft, offener Wohn- und Essbereich oder ruhige Leseecke: Wir stimmen Möbel, Materialien und Licht aufeinander ab, damit aus einzelnen Stücken ein stimmiges Ganzes wird.",
    ],
    benefits: [
      "Sofas und Sessel im Showroom probesitzen",
      "Stoffe, Leder und Oberflächen im Original vergleichen",
      "Möbel, Leuchten und Teppiche aus einer Hand",
      "Lieferung und Montage auf Wunsch",
    ],
    image: "/Images/Wohnen/bannerImage10.jpg",
    imageAlt: "Großzügiges Wohnzimmer mit grauen Sofas und Blick ins Grüne",
  },
  brands: {
    eyebrow: "Unsere Wohnmarken",
    heading: "Designersofas und Sessel, die bleiben",
    items: [
      {
        name: "Minotti",
        slug: "minotti",
        image: "/Images/Home/slider/minotti-sofa-wohnzimmer.webp",
        imageAlt: "Minotti Ecksofa in Weiß in einem Wohnzimmer mit dunkler Holzwand",
        text: "Italienische Sofas und Sessel mit großzügigen Proportionen, feinen Stoffen und handwerklicher Präzision – modulare Sofalandschaften, die sich Ihrem Raum anpassen.",
      },
      {
        name: "Poliform",
        slug: "poliform",
        image: "/Images/Kontakt/poliform.webp",
        imageAlt: "Poliform Sessel und Couchtische in einem hellen Wohnraum",
        text: "Klare Linien und zeitlose Eleganz – von Sofas und Sesseln bis zu Tischen und Wohnwänden, die sich zu einem ruhigen, harmonischen Gesamtbild verbinden.",
      },
    ],
    cta: { href: "/produkte/sofas-couches", label: "Alle Sofas ansehen" },
  },
  steps: {
    eyebrow: "So entsteht Ihr Wohnzimmer",
    heading: "Von der Idee zum fertigen Raum",
    items: [
      { title: "Beratung im Showroom", text: "Wir sprechen über Ihren Raum, Ihre Gewohnheiten und Ihren Stil – und zeigen Ihnen passende Sofas, Sessel und Tische." },
      { title: "Planung des Raums", text: "Wir planen Anordnung, Größen und Wege, damit das Wohnzimmer offen wirkt und im Alltag gut funktioniert." },
      { title: "Materialien & Details", text: "Sie wählen Stoffe, Leder, Farben und Oberflächen – ergänzt durch Leuchten, Teppiche und Accessoires." },
      { title: "Lieferung & Montage", text: "Wir koordinieren Lieferung und Aufbau, damit Ihr neues Wohnzimmer genau so steht, wie es geplant war." },
    ],
    links: [
      { href: "/arbeitsweise", label: "Unsere Arbeitsweise: von der Handzeichnung zum Rendering" },
      { href: "/sofaplaner", label: SOURCE_COPY.crossLabel },
      { href: "/stil-finder", label: "Ihren Wohnstil finden" },
      { href: "/ratgeber/was-kostet-ein-minotti-sofa", label: "Ratgeber: Was kostet ein Minotti-Sofa?" },
    ],
  },
  gallery: [
    { src: "/Images/Wohnen/bannerImage7.jpg", alt: "Wohnzimmer mit Kamin, Sesseln und rundem Teppich" },
    { src: "/Images/Wohnen/bannerImage8.jpg", alt: "Beleuchtete Glasvitrine mit Dekoration neben einer Stehleuchte" },
    { src: "/Images/Wohnen/bannerImage1.jpg", alt: "Beistelltische aus Glas und Messing vor einer Betonwand" },
  ],
  showroom: {
    heading: "Sofas probesitzen – direkt am Bodensee",
    text: "In unserem Showroom in Lochau, nur wenige Minuten von Bregenz entfernt, können Sie Sofas und Sessel ausprobieren und Materialien vergleichen. Kommen Sie vorbei – oder vereinbaren Sie einen Termin für eine ausführliche Beratung.",
  },
  cta: {
    image: "/Images/UberUns/livingroom-view.jpg",
    heading: "Planen wir Ihr neues Wohnzimmer",
    text: "Vereinbaren Sie einen unverbindlichen Beratungstermin in unserem Showroom in Lochau.",
  },
  faq: {
    name: "wohnzimmer-faq",
    heading: "Fragen zur Wohnzimmer-Einrichtung",
    items: [
      { q: "Kann ich Sofas und Sessel vor dem Kauf ausprobieren?", a: "Ja. In unserem Showroom in Lochau können Sie viele Modelle probesitzen und Stoffe, Leder und Oberflächen direkt vergleichen." },
      { q: "Welche Marken führen Sie für das Wohnzimmer?", a: "Unter anderem Minotti und Poliform sowie weitere internationale Designmarken für Möbel, Leuchten und Accessoires. Welche Kombination zu Ihrem Raum passt, klären wir gemeinsam in der Beratung." },
      { q: "Brauche ich einen Termin für die Beratung?", a: "Sie sind während unserer Öffnungszeiten (Di–Fr 10–18 Uhr, Sa 10–14 Uhr) jederzeit willkommen. Für eine ausführliche Planung empfehlen wir einen Termin, damit wir uns ausreichend Zeit für Sie nehmen können." },
      { q: "Planen Sie auch das komplette Wohnzimmer?", a: "Ja. Wir stimmen Sofas, Sessel, Tische, Leuchten, Teppiche und Accessoires aufeinander ab – auf Wunsch zusammen mit Essbereich und Küche." },
      { q: "Was sollte ich zur Beratung mitbringen?", a: "Hilfreich sind die Maße Ihres Raumes oder ein Grundriss, Fotos der aktuellen Einrichtung und – falls vorhanden – Bilder, die Ihnen gefallen." },
      { q: "Wie lange dauert es bis zur Lieferung?", a: "Das hängt von Marke, Modell und Ausführung ab. Den konkreten Zeitrahmen nennen wir Ihnen, sobald Ihre Auswahl feststeht." },
      { q: "Liefern und montieren Sie auch außerhalb von Vorarlberg?", a: "Lieferung und Montage gibt es auf Wunsch, auch außerhalb Vorarlbergs auf Anfrage. Für Projekte in Deutschland, der Schweiz und Liechtenstein sprechen Sie uns gerne direkt an." },
    ],
  },
};

export default async function WohnzimmerVorarlbergPage({ params }) {
  const { locale } = await params;
  if (!KERN_LOCALES.includes(locale)) notFound();
  return (
    <>
      <LandingPage content={kernContent(PATH, locale, CONTENT)} path={PATH} />
      {/* AP-11 (SEO-Team A): Regionen, Minotti Studio, Küche, Bad & Wellness, Arbeitsweise */}
      {/* Regionsseiten gibt es nur auf Deutsch – der Block bleibt deutsch. */}
      {locale === "de" && <RegionLinks path={PATH} />}
    </>
  );
}
