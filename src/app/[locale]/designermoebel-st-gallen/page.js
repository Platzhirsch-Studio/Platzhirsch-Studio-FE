// /de/designermoebel-st-gallen — local landing page (German only; other
// locales 404). Layout: src/components/Landing/landingPage.js.
// Indexable (see landingMetadata); JSON-LD WebPage + FAQPage via LandingPage.
// Swiss German spelling on purpose: "ss" instead of "ß" (Strasse, gross, Masse).
import { notFound } from "next/navigation";
import LandingPage, { landingMetadata } from "@/components/Landing/landingPage";

const PATH = "/designermoebel-st-gallen";

export async function generateMetadata({ params }) {
  const { locale } = await params;
  if (locale !== "de") return {};
  return landingMetadata({
    path: PATH,
    title: "Designermöbel für St. Gallen",
    description:
      "Designermöbel internationaler Marken für Kundinnen und Kunden aus St. Gallen und der Ostschweiz – im Showroom in Lochau am Bodensee, mit persönlicher Beratung.",
  });
}

// Content is static German (Swiss spelling) copy. Keep it general: delivery,
// customs and invoicing for Switzerland are answered personally, not promised
// here. Only official, generally valid facts about importing into Switzerland.
const CONTENT = {
  inLanguage: "de-CH",
  banner: {
    image: "/Images/UberUns/Rimadesio-Modulor.jpg",
    title: "Designermöbel für St. Gallen",
    alt: "Wohnwand mit Holzpaneelen, Regalböden und Lowboard, davor eine schwarze Lederbank",
    crumb: "Designermöbel St. Gallen",
  },
  intro: {
    eyebrow: "Für St. Gallen und die Ostschweiz",
    heading: "Designermöbel auf der anderen Seite des Bodensees",
    paragraphs: [
      "Von St. Gallen ist Lochau gut erreichbar – über das Rheintal und den österreichischen Teil des Bodenseeufers. In unserem Showroom zeigen wir Möbel, Leuchten und Accessoires internationaler Designmarken: für Wohnzimmer, Essbereich und Schlafzimmer.",
      "Wer Möbel für mehrere Räume oder eine ganze Wohnung sucht, profitiert vom Vergleich vor Ort: Stoffe, Leder, Holz und Metall wirken im Original anders als auf dem Bildschirm. Wir beraten Sie persönlich und nehmen uns Zeit für Ihre Fragen.",
    ],
    benefits: [
      "Showroom in Lochau am Bodensee",
      "Internationale Designmarken an einem Ort",
      "Persönliche Beratung – gerne mit Termin",
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
      { title: "Offizielle Regeln", text: "Massgebend sind die Bestimmungen des Bundesamts für Zoll und Grenzsicherheit (BAZG). Dort finden Sie die aktuellen Freigrenzen und Abgaben." },
      { title: "Vor dem Kauf klären", text: "Wie Lieferung, Rechnung und Zollformalitäten für Ihren Einkauf ablaufen, besprechen wir am besten vor dem Kauf persönlich mit Ihnen." },
      { title: "Masse mitbringen", text: "Ein Grundriss oder die wichtigsten Raummasse – Länge, Breite, Fenster und Türen – machen die Beratung konkret." },
    ],
  },
  gallery: [
    { src: "/Images/Licht/bannerImageLicht2.jpg", alt: "Goldener Kronleuchter mit verzweigten Armen und farbig schimmernden Glaskugeln" },
    { src: "/Images/Accessories/bannerImageAccessories2.jpg", alt: "Schwarze Vase mit getrockneten Zweigen vor einer hellen Wand" },
    { src: "/Images/UberUns/livingroom-view.jpg", alt: "Grosszügiger Wohnraum mit hellen Sofas, Sesseln und Couchtischen vor Vorhängen" },
  ],
  showroom: {
    heading: "Von St. Gallen nach Lochau",
    text: "Unser Showroom liegt in Lochau an der Landstrasse, am österreichischen Ufer des Bodensees, nur wenige Minuten von Bregenz. Kommen Sie vorbei – oder vereinbaren Sie einen Termin, damit wir uns ausreichend Zeit für Sie nehmen können.",
  },
  cta: {
    image: "/Images/Wohnen/bannerImage9.jpg",
    heading: "Besuchen Sie uns am Bodensee",
    text: "Vereinbaren Sie einen unverbindlichen Beratungstermin in unserem Showroom in Lochau.",
  },
  faq: {
    name: "st-gallen-faq",
    heading: "Fragen zu Designermöbeln für St. Gallen",
    items: [
      { q: "Wo liegt Ihr Showroom?", a: "In der Landstrasse 9 in 6911 Lochau, Österreich – am östlichen Ufer des Bodensees, nur wenige Minuten von Bregenz." },
      { q: "Muss ich bei der Einfuhr in die Schweiz Mehrwertsteuer bezahlen?", a: "In der Regel ja: Bei der Einfuhr von Waren in die Schweiz wird die Schweizer Mehrwertsteuer erhoben, derzeit 8,1 Prozent. Die aktuellen Regeln und Freigrenzen veröffentlicht das Bundesamt für Zoll und Grenzsicherheit (BAZG)." },
      { q: "Liefern Sie auch in die Schweiz?", a: "Sprechen Sie uns bitte vor dem Kauf an. Wir klären Lieferung, Montage und die Abwicklung der Einfuhr für Ihre Adresse und Ihr Projekt individuell." },
      { q: "Wann hat der Showroom geöffnet?", a: "Dienstag bis Freitag von 10 bis 18 Uhr und Samstag von 10 bis 14 Uhr. Für eine ausführliche Beratung empfehlen wir einen Termin." },
      { q: "Welche Marken finde ich bei Ihnen?", a: "Unter anderem Minotti, Poliform, Rimadesio, Flos, Paola Lenti und ClassiCon sowie weitere internationale Designmarken für Möbel, Leuchten und Accessoires." },
      { q: "Was sollte ich zur Beratung mitbringen?", a: "Hilfreich sind die Masse Ihrer Räume oder ein Grundriss, Fotos der Räume und – falls vorhanden – Bilder von Einrichtungen, die Ihnen gefallen." },
    ],
  },
};

export default async function DesignermoebelStGallenPage({ params }) {
  const { locale } = await params;
  if (locale !== "de") notFound();
  return <LandingPage content={CONTENT} path={PATH} />;
}
