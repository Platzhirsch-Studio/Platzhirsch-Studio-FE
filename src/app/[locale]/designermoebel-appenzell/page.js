// /de/designermoebel-appenzell — local landing page for Appenzell Ausserrhoden
// and Innerrhoden. German only; other locales 404.
// Layout: src/components/Landing/landingPage.js.
// Robots via landingMetadata → regionRobots() (doorway audit, src/lib/seo/
// sitemap/doorwayAudit.js); JSON-LD WebPage + FAQPage via LandingPage.
// Swiss German spelling on purpose: "ss" instead of "ß" (Strasse, Masse).
//
// Facts and their sources (Marktresearch/):
// - Fahrzeit St. Gallen/Rheintal/Appenzell ca. 30–40 Minuten, Gebiet innerhalb
//   45 Minuten: 02 (Zielregionen), 17 (Abschnitt Marktgrösse).
// - Rückerstattung bei Selbstausfuhr (Wohnsitz ausserhalb EU, über 75 €,
//   Ausfuhr binnen 3 Monaten, Nachweis binnen 6 Monaten, nur eigenes Fahrzeug,
//   nicht mit Spediteur; eignet sich vor allem für Leuchten, Accessoires,
//   Kleinmöbel): 18, Abschnitt 0 Punkt 8, Abschnitt 2 und Abschnitt 9.
// - Zollstelle Lustenau/Au rund um die Uhr (WKO, Stand 01.07.2025): 18, Abschnitt 2.
// - Einfuhr CH: 8,1 % MWST, Möbel zollfrei seit 2024, Anmeldung bleibt Pflicht: 18, Abschnitt 1.
// - Lieferung durch Spediteur: Kunde ist Importeur, 8,1 % plus Verzollungsgebühr: 18, Abschnitt 3.
// Whether Platzhirsch delivers or installs in Switzerland is not promised here.
import { notFound } from "next/navigation";
import LandingPage, { landingMetadata } from "@/components/Landing/landingPage";
import RegionLinks from "@/app/[locale]/regionen/RegionLinks";

const PATH = "/designermoebel-appenzell";

export async function generateMetadata({ params }) {
  const { locale } = await params;
  if (locale !== "de") return {};
  return landingMetadata({
    path: PATH,
    title: "Designermöbel Appenzell – Showroom am Bodensee",
    description:
      "Designermöbel für das Appenzellerland: Minotti, ClassiCon, Tréca und Rimadesio in der Ausstellung in Lochau, rund 30 bis 45 Minuten entfernt.",
  });
}

const CONTENT = {
  // Runde 2 (P3): Termin-Knöpfe mit Kontext (ux P1-1) und der Kern-USP als
  // kurzer Abschnitt mit eigenem Satz (gesamtwerk P1-4, Durchdringungsplan §5).
  ort: "appenzell",
  processText:
    "Wir kommen zu Ihnen ins Appenzellerland, sehen uns Licht und Räume an, und Harald Menghin zeichnet Ihr Konzept von Hand. Für Häuser mit Geschichte nehmen wir den Bestand genau auf. Danach planen wir in 3D, und Sie sehen Ihren Raum fotorealistisch, bevor etwas bestellt wird.",
  inLanguage: "de-CH",
  banner: {
    image: "/Images/UberUns/white-sofas.jpg",
    title: "Designermöbel für das Appenzellerland",
    alt: "Zwei helle Liegesofas mit Couchtisch und Tischleuchte auf einem runden Teppich unter Bäumen",
    crumb: "Designermöbel Appenzell",
    trail: [{ label: "Regionen", href: "/regionen" }], // Rat 9,5 B15: Regionen-Hub als Elternseite
  },
  intro: {
    eyebrow: "Für Appenzell Ausserrhoden und Innerrhoden",
    heading: "Vom Appenzellerland an den Bodensee",
    paragraphs: [
      "Aus dem Appenzellerland fahren Sie je nach Ort rund 30 bis 45 Minuten nach Lochau – über das Rheintal und einen der Grenzübergänge bei Au oder St. Margrethen. Unser Showroom liegt am österreichischen Ufer des Bodensees, kurz hinter Bregenz.",
      "Ob ein älteres Haus mit Holz und niedrigen Räumen oder ein Neubau mit grossen Glasflächen: Gerade dann lohnt es sich, Möbel im Original zu sehen. Proportionen, Stoffe und Holzoberflächen lassen sich vor Ort besser beurteilen als auf dem Bildschirm.",
      "Bringen Sie Fotos und Masse Ihrer Räume mit. Wir zeigen Ihnen, was zu Ihrem Haus passt, erstellen eine Offerte und besprechen, wie die Ware zu Ihnen kommt.",
    ],
    benefits: [
      "Rund 30 bis 45 Minuten aus dem Appenzellerland",
      "Ausstellung mit internationalen Designmarken",
      "Beratung mit Fotos und Massangaben Ihrer Räume",
      "Offerte und Ablauf der Einfuhr vor dem Kauf geklärt",
    ],
    image: "/Images/Wohnen/bannerImage7.jpg",
    imageAlt: "Wohnzimmer mit Kamin, Sesseln und rundem Teppich",
  },
  brands: {
    eyebrow: "Führen wir in der Ausstellung",
    heading: "Marken für Häuser mit Charakter",
    items: [
      {
        name: "Minotti",
        slug: "minotti",
        image: "/Images/Home/slider/minotti-sofa-wohnzimmer.webp",
        imageAlt: "Minotti Ecksofa in Weiss in einem Wohnzimmer mit dunkler Holzwand",
        text: "Minotti-Ausstellung in Lochau: Sofas und Sessel, deren Proportionen und Bezüge Sie vor Ort vergleichen können – wichtig, wenn ein Raum niedrig ist oder viel Holz hat.",
      },
      {
        name: "ClassiCon",
        slug: "classicon",
        image: "/Images/Home/slider/classicon-bell-beistelltische.webp",
        imageAlt: "ClassiCon Bell Beistelltische mit farbigen Glasfüssen",
        text: "Beistelltische, Leuchten und Klassiker in überschaubarer Grösse – Stücke, die auch in kleinere Räume passen und sich oft im eigenen Auto mitnehmen lassen.",
      },
      {
        name: "Tréca",
        slug: "treca",
        image: "/Images/Home/slider/treca-paris-bett-schlafzimmer.webp",
        imageAlt: "Treca Paris Bett mit gemustertem Kopfteil in einem hellen Schlafzimmer",
        text: "Betten und Matratzen aus Paris. Kopfteile in Stoff und Farbe nach Wunsch – passend zu einem Schlafzimmer mit Holz ebenso wie zu einem modernen.",
      },
      {
        name: "Rimadesio",
        slug: "rimadesio",
        image: "/Images/Home/slider/rimadesio-wandsystem-wohnraum.webp",
        imageAlt: "Rimadesio Wandsystem mit Holzpaneelen, Regalen und Sideboard im Wohnraum",
        text: "Regale, Wandsysteme und Schiebetüren nach Mass – sinnvoll, wenn Nischen, Dachschrägen oder ungewöhnliche Wandmasse genutzt werden sollen.",
      },
    ],
    cta: { href: "/produkte", label: "Alle Produkte ansehen" },
  },
  steps: {
    eyebrow: "So läuft es ab",
    heading: "Vom Besuch bis zu Ihnen nach Hause",
    items: [
      {
        title: "Vorbereiten",
        text: "Notieren Sie Raummasse, Fensterhöhen und Türbreiten. Wohnen Sie im Stockwerkeigentum, helfen auch die Masse von Lift und Treppenhaus – damit grosse Möbel später sicher hineinpassen.",
      },
      {
        title: "Beraten und Offerte",
        text: "Im Showroom vergleichen wir Stoffe, Leder und Holz und stellen Ihnen eine Offerte zusammen. Ob Sie selbst abholen oder liefern lassen, entscheiden wir gemeinsam.",
      },
      {
        title: "Kleines selbst mitnehmen",
        text: "Führen Sie Leuchten, Accessoires oder Kleinmöbel im eigenen Auto aus, kann die österreichische Umsatzsteuer erstattet werden – bei Wohnsitz ausserhalb der EU, einer Rechnung über 75 Euro, Ausfuhr innerhalb von 3 Monaten und Zollbestätigung innerhalb von 6 Monaten. An der Schweizer Grenze bezahlen Sie 8,1 Prozent MWST.",
      },
      {
        title: "Grosses liefern lassen",
        text: "Sofas, Betten und Schränke kommen meist per Spediteur. Dann sind Sie Importeur und bezahlen die Schweizer MWST sowie die Verzollungsgebühr; eine Rückerstattung gibt es in diesem Fall nicht. Den genauen Ablauf klären wir persönlich.",
      },
    ],
  },
  gallery: [
    { src: "/Images/Outdoor/bannerImage3.jpg", alt: "Outdoor-Sessel und Sofa mit hellen Kissen auf einer Kiesterrasse mit Weitblick" },
    { src: "/Images/Accessories/bannerImageAccessories1.jpg", alt: "Bauchige Keramikvase mit dunkelroten Zweigen neben kleinen Beistelltischen" },
    { src: "/Images/Wohnen/bannerImage2.jpg", alt: "Runder Esstisch mit Designerstuhl und Ringleuchte" },
  ],
  showroom: {
    heading: "Vom Appenzellerland nach Lochau",
    text: "Unser Showroom liegt an der Landstraße 11 in Lochau, kurz hinter Bregenz. Aus dem Appenzellerland fahren Sie über das Rheintal zur Grenze. Möchten Sie Ware selbst ausführen: Die Zollstelle Lustenau/Au bestätigt die Ausfuhr rund um die Uhr (Stand Juli 2025). Vereinbaren Sie am besten einen Termin, damit wir genug Zeit für Sie haben.",
  },
  cta: {
    image: "/Images/Wohnen/bannerImage8.jpg",
    heading: "Ein Ausflug an den Bodensee",
    text: "Vereinbaren Sie einen unverbindlichen Beratungstermin in Lochau – mit Fotos und Massangaben Ihrer Räume im Gepäck.",
  },
  faq: {
    name: "appenzell-faq",
    heading: "Fragen aus dem Appenzellerland",
    items: [
      {
        q: "Wie weit ist Lochau vom Appenzellerland entfernt?",
        a: "Je nach Ort fahren Sie mit dem Auto rund 30 bis 45 Minuten, meist über das Rheintal und die Grenze bei Au oder St. Margrethen. Der Showroom liegt an der Landstraße 11 in 6911 Lochau.",
      },
      {
        q: "Kann ich kleinere Stücke gleich mitnehmen?",
        a: "Ob ein Stück zum Mitnehmen bereitsteht, klären wir gerne vorab. Führen Sie die Ware im eigenen Auto aus und wohnen ausserhalb der EU, kann die österreichische Umsatzsteuer erstattet werden: Die Rechnung muss über 75 Euro liegen, die Ausfuhr innerhalb von 3 Monaten erfolgen und die Zollbestätigung innerhalb von 6 Monaten bei uns sein.",
      },
      {
        q: "Was muss ich an der Schweizer Grenze bezahlen?",
        a: "In der Regel 8,1 Prozent Schweizer MWST. Zoll fällt auf Möbel seit 2024 nicht mehr an, die Anmeldung, etwa mit der App QuickZoll, bleibt aber Pflicht. Massgebend sind die Regeln des Bundesamts für Zoll und Grenzsicherheit (BAZG).",
      },
      {
        q: "Wie kommt ein grosses Sofa zu mir nach Hause?",
        a: "Grosse Möbel passen selten ins Auto. Bei einer Lieferung durch einen Spediteur sind Sie Importeur und bezahlen die Schweizer MWST und die Verzollungsgebühr; eine Rückerstattung der österreichischen Umsatzsteuer entfällt dann. Ob und wie wir liefern, klären wir persönlich vor der Offerte.",
      },
      {
        q: "Was sollte ich zur Beratung mitbringen?",
        a: "Raummasse oder einen Grundriss, Fotos der Räume und, bei einer Wohnung im Stockwerkeigentum, die Masse von Lift und Treppenhaus. Bilder von Einrichtungen, die Ihnen gefallen, helfen ebenfalls.",
      },
      {
        q: "Wann hat der Showroom geöffnet?",
        a: "Dienstag bis Freitag von 10 bis 18 Uhr und Samstag von 10 bis 14 Uhr. Für eine ausführliche Beratung empfehlen wir einen Termin.",
      },
    ],
  },
};

export default async function DesignermoebelAppenzellPage({ params }) {
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
