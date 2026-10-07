// /de/designermoebel-bregenz — local landing page (German only; other
// locales 404). Layout: src/components/Landing/landingPage.js.
// Indexable (see landingMetadata); JSON-LD WebPage + FAQPage via LandingPage.
import { notFound } from "next/navigation";
import LandingPage, { landingMetadata } from "@/components/Landing/landingPage";

const PATH = "/designermoebel-bregenz";

export async function generateMetadata({ params }) {
  const { locale } = await params;
  if (locale !== "de") return {};
  return landingMetadata({
    path: PATH,
    title: "Designermöbel für Bregenz",
    description:
      "Designermöbel von Minotti, Poliform und weiteren Premium-Marken – in unserem Showroom in Lochau, nur wenige Minuten von Bregenz. Persönliche Beratung, Lieferung und Montage.",
  });
}

// Content is static German copy; keep facts (address, hours, brands) in sync with the footer/CMS.
const CONTENT = {
  banner: {
    image: "/Images/Home/aboutHome.jpg",
    title: "Designermöbel für Bregenz",
    alt: "Showroom von Platzhirsch Home Living in Lochau bei Bregenz",
    crumb: "Designermöbel Bregenz",
  },
  intro: {
    eyebrow: "Nur wenige Minuten von Bregenz",
    heading: "Ihr Showroom für Designermöbel vor den Toren von Bregenz",
    paragraphs: [
      "Platzhirsch Home Living liegt in Lochau – direkt an der Landstraße und nur wenige Minuten vom Bregenzer Zentrum entfernt. In unserem Showroom erleben Sie Möbel, Leuchten und Accessoires internationaler Designmarken in echten Wohnsituationen.",
      "Ob Sofa für die Stadtwohnung, Esszimmer für das Einfamilienhaus oder die komplette Einrichtung: Wir beraten Sie persönlich und kümmern uns um Lieferung und Montage bei Ihnen zu Hause.",
    ],
    benefits: [
      "Showroom nur wenige Minuten von Bregenz",
      "Internationale Premium-Marken an einem Ort",
      "Persönliche Einrichtungsberatung",
      "Lieferung und Montage bei Ihnen zu Hause",
    ],
    image: "/Images/Home/secondAboutHome.jpg",
    imageAlt: "Sofas, Sessel und Couchtische im Showroom in Lochau",
  },
  brands: {
    eyebrow: "Marken im Showroom",
    heading: "Internationale Designmarken, persönlich beraten",
    items: [
      {
        name: "Minotti",
        slug: "minotti",
        image: "/Images/Home/slider/minotti-sofa-wohnzimmer.webp",
        imageAlt: "Minotti Ecksofa in Weiß in einem Wohnzimmer mit dunkler Holzwand",
        text: "Italienische Sofas, Sessel und Tische mit feinen Materialien und großzügigen Proportionen – für Wohnräume mit ruhiger, eleganter Ausstrahlung.",
      },
      {
        name: "Poliform",
        slug: "poliform",
        image: "/Images/Home/slider/poliform-schlafzimmer-bett.webp",
        imageAlt: "Poliform Polsterbett mit hohem Kopfteil in einem Schlafzimmer mit Holzwand",
        text: "Wohnen, Schlafen und Kochen in einer Designsprache – von Betten und Kleiderschränken bis zu Sofas, Wohnwänden und Küchen.",
      },
    ],
    cta: { href: "/produkte", label: "Alle Produkte ansehen" },
  },
  steps: {
    eyebrow: "So einfach geht's",
    heading: "Vom Showroom-Besuch bis zur Lieferung",
    items: [
      { title: "Showroom besuchen", text: "Kommen Sie nach Lochau und erleben Sie Möbel, Stoffe und Oberflächen im Original – gerne mit Termin." },
      { title: "Persönliche Beratung", text: "Wir besprechen Ihre Räume, Ihren Stil und Ihre Wünsche und schlagen passende Stücke vor." },
      { title: "Auswahl & Planung", text: "Sie wählen Modelle, Materialien und Farben – wir planen Maße und Anordnung für Ihren Raum." },
      { title: "Lieferung & Montage", text: "Wir liefern und montieren bei Ihnen zu Hause, damit alles genau so steht, wie es geplant war." },
    ],
  },
  gallery: [
    { src: "/Images/Wohnen/bannerImage2.jpg", alt: "Runder Esstisch mit Designerstuhl und Ringleuchte" },
    { src: "/Images/Wohnen/bannerImage3.jpg", alt: "Esszimmer mit Holztisch, Polsterstühlen und Sideboard" },
    { src: "/Images/Licht/bannerImageLicht4.jpg", alt: "Esstisch mit goldenen Pendelleuchten vor einer Holzwand" },
  ],
  showroom: {
    heading: "Von Bregenz in wenigen Minuten bei uns",
    text: "Unser Showroom liegt in Lochau an der Landstraße, nur wenige Minuten vom Bregenzer Zentrum entfernt. Kommen Sie vorbei – oder vereinbaren Sie einen Termin für eine ausführliche Beratung.",
  },
  cta: {
    image: "/Images/Wohnen/bannerImage5.jpg",
    heading: "Besuchen Sie uns in Lochau",
    text: "Vereinbaren Sie einen unverbindlichen Beratungstermin – nur wenige Minuten von Bregenz entfernt.",
  },
  faq: {
    name: "bregenz-faq",
    heading: "Fragen zu Designermöbeln in Bregenz",
    items: [
      { q: "Wo genau liegt Ihr Showroom?", a: "Unser Showroom befindet sich in der Landstraße 9 in 6911 Lochau – nur wenige Minuten vom Bregenzer Zentrum entfernt." },
      { q: "Wann hat der Showroom geöffnet?", a: "Dienstag bis Freitag von 10 bis 18 Uhr und Samstag von 10 bis 14 Uhr. Für eine ausführliche Beratung empfehlen wir einen Termin." },
      { q: "Welche Marken finde ich bei Ihnen?", a: "Unter anderem Minotti, Poliform, Rimadesio, Flos und ClassiCon sowie weitere internationale Designmarken für Möbel, Leuchten und Accessoires." },
      { q: "Liefern und montieren Sie in Bregenz?", a: "Ja. Wir liefern und montieren in Bregenz, in ganz Vorarlberg und in ganz Österreich." },
      { q: "Bieten Sie auch eine Einrichtungsberatung an?", a: "Ja. Wir beraten Sie persönlich – für einzelne Möbelstücke ebenso wie für die Einrichtung ganzer Räume oder Wohnungen." },
      { q: "Was sollte ich zur Beratung mitbringen?", a: "Hilfreich sind die Maße Ihrer Räume oder ein Grundriss, Fotos der aktuellen Einrichtung und – falls vorhanden – Bilder, die Ihnen gefallen." },
    ],
  },
};

export default async function DesignermoebelBregenzPage({ params }) {
  const { locale } = await params;
  if (locale !== "de") notFound();
  return <LandingPage content={CONTENT} path={PATH} />;
}
