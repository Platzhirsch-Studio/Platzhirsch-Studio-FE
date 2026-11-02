// /de/designermoebel-liechtenstein — local landing page for Vaduz, Schaan and
// the rest of Liechtenstein (German only; other locales 404).
// Layout: src/components/Landing/landingPage.js.
// Robots via landingMetadata → regionRobots() (doorway audit, src/lib/seo/
// sitemap/doorwayAudit.js); JSON-LD WebPage + FAQPage via LandingPage.
// Swiss/Liechtenstein spelling on purpose: "ss" instead of "ß".
//
// Facts and sources (Marktresearch):
// - Liechtenstein belongs to the Swiss customs and VAT area, VAT 8.1 %: 18 (§0 Nr. 7, §1).
// - Swiss industrial tariffs abolished 1.1.2024, furniture duty-free, customs
//   declaration still required: 18 (§1).
// - Tax-free export by the customer (residence outside the EU, invoice > 75 €,
//   export within 3 months, own vehicle, not via forwarder): 18 (§0 Nr. 8, §2).
// - Customs office Tisis/Schaanwald Mo–Fr 7.30–16.30 (WKO, 01.07.2025): 18 (§2).
// - Assembly in FL: EEA notification without the Swiss 8-day waiting period: 18 (§4.2).
// - Driving time Lochau–Liechtenstein approx. 40 min: 02, 07.
// Delivery, assembly, invoicing and currency are NOT promised here — the
// manufacturers' territory rules for FL are still open (18 §7 Nr. 2, 00 Gate 0).
import { notFound } from "next/navigation";
import LandingPage, { landingMetadata } from "@/components/Landing/landingPage";
import RegionLinks from "@/app/[locale]/regionen/RegionLinks";

const PATH = "/designermoebel-liechtenstein";

export async function generateMetadata({ params }) {
  const { locale } = await params;
  if (locale !== "de") return {};
  return landingMetadata({
    path: PATH,
    title: "Möbel & Designermöbel für Liechtenstein",
    description:
      "Designermöbel für Vaduz, Schaan und das Unterland: Showroom in Lochau am Bodensee, rund 40 Minuten entfernt. Mit Infos zu 8,1 % MWST und Zoll.",
  });
}

const CONTENT = {
  // Runde 2 (P3): Termin-Knöpfe mit Kontext (ux P1-1) und der Kern-USP als
  // kurzer Abschnitt mit eigenem Satz (gesamtwerk P1-4, Durchdringungsplan §5).
  ort: "liechtenstein",
  processText:
    "Wir kommen zu Ihnen nach Liechtenstein, sehen uns Licht und Räume an, und Harald Menghin zeichnet Ihr Konzept von Hand. Lieferung und Montage klären wir persönlich vor dem Kauf. Danach planen wir in 3D, und Sie sehen Ihren Raum fotorealistisch, bevor etwas bestellt wird.",
  inLanguage: "de-CH",
  banner: {
    image: "/Images/Wohnen/bannerImage6.jpg",
    title: "Designermöbel und Einrichtung für Liechtenstein",
    alt: "Begehbarer Ankleideraum mit beleuchteten Glasschränken, Kommode in der Mitte, zwei blauen Samtsesseln und ringförmiger Pendelleuchte",
    crumb: "Designermöbel Liechtenstein",
    trail: [{ label: "Regionen", href: "/regionen" }], // Rat 9,5 B15: Regionen-Hub als Elternseite
  },
  intro: {
    eyebrow: "Für Vaduz, Schaan und das ganze Land",
    heading: "Von Liechtenstein an den Bodensee",
    paragraphs: [
      "Aus Vaduz oder Schaan sind Sie in rund 40 Minuten bei uns in Lochau – durch das Rheintal bis an das österreichische Ufer des Bodensees. In der Ausstellung finden Sie Möbel, Leuchten und Accessoires internationaler Designmarken, vom Wandsystem bis zum Bett.",
      "Für Kundinnen und Kunden aus Liechtenstein gelten beim Einkauf in Österreich eigene Regeln: Liechtenstein gehört zum Schweizer Zoll- und Mehrwertsteuergebiet. Was das für Ihren Einkauf bedeutet, erklären wir unten – und den konkreten Ablauf besprechen wir vor dem Kauf persönlich mit Ihnen.",
    ],
    benefits: [
      "Rund 40 Minuten von Vaduz und Schaan",
      "Wohnsysteme, Schiebetüren, Betten und Sofas im Original",
      "Persönliche Beratung – gerne mit Termin",
      "Fragen zu MWST und Ausfuhr klären wir vor dem Kauf",
    ],
    image: "/Images/UberUns/livingroom-view.jpg",
    imageAlt: "Grosszügiger Wohnraum mit hellen Sofas, Sesseln und Couchtischen vor Vorhängen",
  },
  brands: {
    eyebrow: "In der Ausstellung",
    heading: "Architektur für den Innenraum",
    items: [
      {
        name: "Poliform",
        slug: "poliform",
        image: "/Images/Home/slider/poliform-schlafzimmer-bett.webp",
        imageAlt: "Poliform Polsterbett mit hohem Kopfteil in einem Schlafzimmer mit Holzwand",
        text: "Kleiderschränke, Betten, Wohnsysteme und Sofas aus einer Hand – passend, wenn Sie mehrere Räume eines Hauses oder einer Wohnung in einer ruhigen, einheitlichen Linie einrichten möchten.",
      },
      {
        name: "Rimadesio",
        slug: "rimadesio",
        image: "/Images/Home/slider/rimadesio-wandsystem-wohnraum.webp",
        imageAlt: "Rimadesio Wandsystem mit Holzpaneelen, Regalen und Sideboard im Wohnraum",
        text: "Schiebetüren, Raumteiler und Wandsysteme aus Glas, Aluminium und Holz. Weil sie auf Mass für Ihren Raum geplant werden, lohnt es sich, Oberflächen und Profile vorher in der Ausstellung anzusehen.",
      },
    ],
    cta: { href: "/produkte", label: "Alle Produkte ansehen" },
  },
  steps: {
    eyebrow: "Gut zu wissen",
    heading: "Einkaufen in Österreich mit Wohnsitz in Liechtenstein",
    items: [
      {
        title: "Schweizer Zollgebiet",
        text: "Liechtenstein gehört zum Schweizer Zoll- und Mehrwertsteuergebiet. Bei der Einfuhr von Möbeln fällt daher die Mehrwertsteuer von 8,1 Prozent an. Industriezölle auf Möbel gibt es seit 2024 nicht mehr, die Ware ist aber trotzdem beim Zoll anzumelden.",
      },
      {
        title: "Selbst abholen",
        text: "Bringen Sie die Ware selbst im eigenen Fahrzeug über die Grenze, kann die österreichische Umsatzsteuer erstattet werden – unter Bedingungen, etwa Wohnsitz ausserhalb der EU und Ausfuhr innerhalb von drei Monaten. Mit einer Spedition ist das nicht möglich.",
      },
      {
        title: "Zoll in Schaanwald",
        text: "Die Ausfuhrbestätigung erhalten Sie an einer besetzten Zollstelle. Tisis/Schaanwald ist laut Wirtschaftskammer Vorarlberg Montag bis Freitag von 7.30 bis 16.30 Uhr geöffnet. Bitte prüfen Sie die aktuellen Zeiten vor der Fahrt.",
      },
      {
        title: "Lieferung und Montage",
        text: "Für Montagen in Liechtenstein gilt ein eigenes Meldeverfahren für Betriebe aus dem EWR – ohne die achttägige Wartefrist, die in der Schweiz üblich ist. Ob und wie wir für Ihr Projekt liefern und montieren, klären wir persönlich.",
      },
    ],
  },
  gallery: [
    { src: "/Images/UberUns/Rimadesio-Modulor.jpg", alt: "Wohnwand mit Holzpaneelen, Regalböden und Lowboard, davor eine schwarze Lederbank" },
    { src: "/Images/Wohnen/bannerImage3.jpg", alt: "Esszimmer mit Holztisch, Polsterstühlen und Sideboard" },
    { src: "/Images/Licht/bannerImageLicht4.jpg", alt: "Esstisch mit goldenen Pendelleuchten vor einer Holzwand" },
  ],
  showroom: {
    heading: "Von Vaduz nach Lochau",
    text: "Der Weg führt durch das Rheintal – über Feldkirch und die Rheintalautobahn A14 oder auf Schweizer Seite über die A13 – bis nach Lochau an der Landstraße, wenige Minuten hinter Bregenz. Wenn Sie mit einem Termin kommen, nehmen wir uns ausreichend Zeit und können Muster und Stoffe für Sie vorbereiten.",
  },
  cta: {
    image: "/Images/Wohnen/bannerImage10.jpg",
    heading: "Ihr Projekt in Liechtenstein",
    text: "Vereinbaren Sie einen unverbindlichen Beratungstermin. Bringen Sie Grundriss und Fragen zu Zoll und Lieferung gleich mit – wir besprechen alles in einem Termin.",
  },
  faq: {
    name: "liechtenstein-faq",
    heading: "Fragen zu Designermöbeln für Liechtenstein",
    items: [
      {
        q: "Wie lange fahre ich von Vaduz zu Ihrem Showroom?",
        a: "Rund 40 Minuten, je nach Verkehr. Unser Showroom liegt in der Landstraße 11 in 6911 Lochau, Österreich – am Bodensee, wenige Minuten hinter Bregenz.",
      },
      {
        q: "Welche Mehrwertsteuer zahle ich als Kunde aus Liechtenstein?",
        a: "Liechtenstein gehört zum Schweizer Zoll- und Mehrwertsteuergebiet. Bei der Einfuhr fällt die Mehrwertsteuer von 8,1 Prozent an. Wie Rechnung und Einfuhr für Ihren Einkauf ablaufen, besprechen wir vor dem Kauf mit Ihnen.",
      },
      {
        q: "Zahle ich die Mehrwertsteuer doppelt – in Österreich und in Liechtenstein?",
        a: "Bei einer Ausfuhr nach Liechtenstein muss das nicht sein: Die österreichische Umsatzsteuer kann bei der Ausfuhr entfallen oder erstattet werden, in Liechtenstein fallen dann 8,1 Prozent an. Welche Bedingungen dafür gelten, hängt davon ab, ob Sie selbst abholen oder liefern lassen – das klären wir persönlich.",
      },
      {
        q: "Fällt auf Möbel Zoll an?",
        a: "Industriezölle, zu denen auch Möbel gehören, hat die Schweiz zum 1. Januar 2024 abgeschafft; das gilt im gemeinsamen Zollgebiet auch für Liechtenstein. Eine Zollanmeldung ist trotzdem nötig, und die Mehrwertsteuer wird erhoben.",
      },
      {
        q: "Kann ich die Möbel selbst abholen und die österreichische Umsatzsteuer zurückbekommen?",
        a: "Das ist möglich, wenn Sie die Ware selbst ausführen, zum Beispiel im eigenen Auto, mit Mietbus oder Anhänger. Voraussetzungen sind unter anderem ein Wohnsitz ausserhalb der EU, eine Rechnung über 75 Euro und die Ausfuhr innerhalb von drei Monaten mit Bestätigung des Zolls. Liefert eine Spedition, gilt diese Regel nicht.",
      },
      {
        q: "Liefern und montieren Sie in Liechtenstein?",
        a: "Bitte sprechen Sie uns vor dem Kauf an. Für Montagen in Liechtenstein gilt für Betriebe aus dem EWR ein eigenes Meldeverfahren, und die Einfuhr läuft über das Schweizer Zollgebiet. Ob und wie wir an Ihre Adresse in Vaduz, Schaan oder im Unterland liefern und montieren, klären wir für Ihr Projekt persönlich.",
      },
      {
        q: "Wann hat der Showroom geöffnet?",
        a: "Dienstag bis Freitag von 10 bis 18 Uhr und Samstag von 10 bis 14 Uhr. Für die längere Anfahrt aus Liechtenstein empfehlen wir einen Termin.",
      },
    ],
  },
};

export default async function DesignermoebelLiechtensteinPage({ params }) {
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
