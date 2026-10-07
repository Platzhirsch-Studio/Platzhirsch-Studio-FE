// /de/interior-design-vorarlberg — local landing page (German only; other
// locales 404). Layout: src/components/Landing/landingPage.js.
// Indexable (see landingMetadata); JSON-LD WebPage + FAQPage via LandingPage.
import { notFound } from "next/navigation";
import LandingPage, { landingMetadata } from "@/components/Landing/landingPage";

const PATH = "/interior-design-vorarlberg";

export async function generateMetadata({ params }) {
  const { locale } = await params;
  if (locale !== "de") return {};
  return landingMetadata({
    path: PATH,
    title: "Interior Design in Vorarlberg",
    description:
      "Persönliche Einrichtungsberatung und Planung für Ihr Zuhause – Möbel, Systeme und Licht führender Designmarken aus einer Hand. Showroom in Lochau am Bodensee.",
  });
}

// Content is static German copy; keep facts (address, hours, brands) in sync with the footer/CMS.
const CONTENT = {
  banner: {
    image: "/Images/Home/secondAboutHome.jpg",
    title: "Interior Design in Vorarlberg",
    alt: "Showroom von Platzhirsch Home Living in Lochau mit Sofas und Sesseln",
    crumb: "Interior Design Vorarlberg",
  },
  intro: {
    eyebrow: "Einrichtungsberatung & Planung",
    heading: "Räume, die zu Ihnen passen – bis ins Detail",
    paragraphs: [
      "Eine gelungene Einrichtung entsteht, wenn Möbel, Materialien und Licht zusammenspielen. Bei Platzhirsch Home Living in Lochau begleiten wir Sie von der ersten Idee bis zum fertig eingerichteten Raum – für einzelne Räume ebenso wie für die komplette Wohnung oder das ganze Haus.",
      "Wir hören zu, verstehen Ihren Stil und Ihren Alltag und entwickeln daraus ein Einrichtungskonzept mit Möbeln, Systemen, Leuchten und Accessoires internationaler Designmarken.",
    ],
    benefits: [
      "Persönliche Beratung durch unser Einrichtungsteam",
      "Ein Ansprechpartner für das gesamte Projekt",
      "Möbel, Systeme, Licht und Accessoires aus einer Hand",
      "Lieferung und Montage in ganz Österreich",
    ],
    image: "/Images/Wohnen/bannerImage6.jpg",
    imageAlt: "Offener Wohnraum mit Vitrinenschränken, Kochinsel und runder Pendelleuchte",
  },
  brands: {
    eyebrow: "Marken für Ihr Gesamtkonzept",
    heading: "Möbel, Systeme und Licht aus einer Hand",
    items: [
      {
        name: "Rimadesio",
        slug: "rimadesio",
        image: "/Images/Home/slider/rimadesio-wandsystem-wohnraum.webp",
        imageAlt: "Rimadesio Wandsystem mit Holzpaneelen, Regalen und Sideboard im Wohnraum",
        text: "Wandsysteme, Regale, Schiebetüren und Raumteiler aus Glas und Aluminium – für Räume mit klarer Struktur und viel Stauraum, perfekt in die Architektur integriert.",
      },
      {
        name: "Flos",
        slug: "flos",
        image: "/Images/Home/slider/flos-stehleuchte-v3.webp",
        imageAlt: "Flos Stehleuchte mit runder Leuchtscheibe auf verchromtem Dreibein",
        text: "Licht ist Teil jedes Einrichtungskonzepts. Flos steht für ikonische Leuchten, die Räume gliedern, Stimmung schaffen und selbst zum Designobjekt werden.",
      },
    ],
    cta: { href: "/produkte", label: "Alle Produkte ansehen" },
  },
  steps: {
    eyebrow: "So arbeiten wir",
    heading: "Vom ersten Gespräch bis zum fertigen Raum",
    items: [
      { title: "Kennenlernen", text: "Wir besprechen Ihre Räume, Ihre Wünsche und Ihren Stil – im Showroom oder anhand von Plänen und Fotos." },
      { title: "Einrichtungskonzept", text: "Wir entwickeln ein Konzept für Möbel, Materialien, Farben und Licht, das zu Ihrem Alltag passt." },
      { title: "Auswahl im Showroom", text: "Sie erleben Möbel, Stoffe und Oberflächen im Original und treffen Ihre Auswahl in Ruhe." },
      { title: "Lieferung & Montage", text: "Wir koordinieren Lieferung und Montage, damit am Ende alles genau so steht, wie es geplant war." },
    ],
  },
  gallery: [
    { src: "/Images/Wohnen/bannerImage9.jpg", alt: "Raum mit Glasschiebetür, Wandregal und Designerleuchte" },
    { src: "/Images/Licht/bannerImageLicht1.jpg", alt: "Essbereich mit Kronleuchter, Bücherregal und Blick in den Garten" },
    { src: "/Images/Arbeiten/bannerImageArbeiten1.jpg", alt: "Arbeitsplatz mit Schreibtisch und Stehleuchte vor großer Fensterfront" },
  ],
  showroom: {
    heading: "Ideen sammeln – in unserem Showroom",
    text: "In Lochau, nur wenige Minuten von Bregenz entfernt, zeigen wir Möbel, Systeme und Leuchten unserer Marken. Vereinbaren Sie einen Termin, damit wir uns ausreichend Zeit für Ihr Projekt nehmen können.",
  },
  cta: {
    image: "/Images/Home/helmut.jpg",
    heading: "Planen wir Ihr Einrichtungskonzept",
    text: "Vereinbaren Sie einen unverbindlichen Beratungstermin in unserem Showroom in Lochau.",
  },
  faq: {
    name: "interior-faq",
    heading: "Fragen zur Einrichtungsplanung",
    items: [
      { q: "Für welche Projekte bieten Sie Einrichtungsberatung an?", a: "Für einzelne Räume ebenso wie für komplette Wohnungen und Häuser – vom Wohnzimmer über Küche und Essbereich bis zum Schlafzimmer oder Arbeitsplatz." },
      { q: "Wie läuft die Einrichtungsplanung ab?", a: "Nach einem ersten Gespräch entwickeln wir ein Konzept für Möbel, Materialien und Licht. Anschließend wählen Sie gemeinsam mit uns im Showroom aus, und wir koordinieren Lieferung und Montage." },
      { q: "Brauche ich einen Termin?", a: "Sie sind während unserer Öffnungszeiten (Di–Fr 10–18 Uhr, Sa 10–14 Uhr) jederzeit willkommen. Für eine Einrichtungsplanung empfehlen wir einen Termin, damit wir uns ausreichend Zeit für Sie nehmen können." },
      { q: "Was sollte ich zum ersten Termin mitbringen?", a: "Hilfreich sind Grundrisse oder Raummaße, Fotos der Räume und – falls vorhanden – Bilder oder Ideen, die Ihnen gefallen." },
      { q: "Kann ich vorhandene Möbel in das Konzept einbeziehen?", a: "Ja. Wir berücksichtigen gerne Stücke, die Sie behalten möchten, und planen die neue Einrichtung passend dazu." },
      { q: "Planen Sie auch Beleuchtung und Accessoires?", a: "Ja. Leuchten, Teppiche und Accessoires gehören für uns zu jedem Einrichtungskonzept dazu – sie geben dem Raum Atmosphäre und Charakter." },
      { q: "Liefern und montieren Sie auch außerhalb von Vorarlberg?", a: "Ja, wir liefern und montieren in ganz Österreich. Für Projekte in Deutschland, der Schweiz und Liechtenstein sprechen Sie uns gerne direkt an." },
    ],
  },
};

export default async function InteriorDesignVorarlbergPage({ params }) {
  const { locale } = await params;
  if (locale !== "de") notFound();
  return <LandingPage content={CONTENT} path={PATH} />;
}
