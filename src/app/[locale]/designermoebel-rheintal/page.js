// /de/designermoebel-rheintal — local landing page for the St. Galler Rheintal
// (Widnau, Heerbrugg, Altstätten, Au, St. Margrethen). German only; other
// locales 404. Layout: src/components/Landing/landingPage.js.
// Robots via landingMetadata → regionRobots() (doorway audit, src/lib/seo/
// sitemap/doorwayAudit.js); JSON-LD WebPage + FAQPage via LandingPage.
// Swiss German spelling on purpose: "ss" instead of "ß" (Strasse, Masse).
//
// Facts and their sources (Marktresearch/):
// - Fahrzeit Rheintal CH ca. 30 Minuten: 02 (Fahrzeiten ab Lochau), 04.
// - Rückerstattung bei Selbstausfuhr (Wohnsitz ausserhalb EU, über 75 €,
//   Ausfuhr binnen 3 Monaten, Nachweis binnen 6 Monaten, nur eigenes Fahrzeug,
//   nicht mit Spediteur): 18, Abschnitt 0 Punkt 8 und Abschnitt 2 (WKO).
// - Zollstellen und Öffnungszeiten (WKO Vorarlberg, Stand 01.07.2025): 18, Abschnitt 2.
// - Einfuhr CH: 8,1 % MWST, Möbel zollfrei seit 2024, Anmeldung bleibt Pflicht,
//   Wertfreigrenze CHF 150 pro Person und Tag, QuickZoll: 18, Abschnitte 1 und 3.
// - Lieferung durch Spediteur: Kunde ist Importeur, zahlt 8,1 % plus
//   Verzollungsgebühr; Rückerstattung plus Lieferung nicht kombinierbar: 18, Abschnitt 3.
// - Montage in der Schweiz: Meldepflicht mit Vorlauf, deshalb nur persönlich: 18, Abschnitt 4.
// Whether Platzhirsch delivers or installs in Switzerland is not promised here.
import { notFound } from "next/navigation";
import LandingPage, { landingMetadata } from "@/components/Landing/landingPage";
import RegionLinks from "@/app/[locale]/regionen/RegionLinks";

const PATH = "/designermoebel-rheintal";

export async function generateMetadata({ params }) {
  const { locale } = await params;
  if (locale !== "de") return {};
  return landingMetadata({
    path: PATH,
    title: "Designermöbel Rheintal – Widnau, Heerbrugg, Altstätten",
    description:
      "Designermöbel für das St. Galler Rheintal: Minotti, Poliform, Rimadesio und Flos in Lochau, rund 30 Minuten von Widnau und Heerbrugg entfernt.",
  });
}

const CONTENT = {
  // Runde 2 (P3): Termin-Knöpfe mit Kontext (ux P1-1) und der Kern-USP als
  // kurzer Abschnitt mit eigenem Satz (gesamtwerk P1-4, Durchdringungsplan §5).
  ort: "rheintal",
  processText:
    "Wir kommen zu Ihnen ins Rheintal, sehen uns Licht und Räume an, und Harald Menghin zeichnet Ihr Konzept von Hand. Für Neubauten planen wir gern schon nach den Bauplänen. Danach planen wir in 3D, und Sie sehen Ihren Raum fotorealistisch, bevor etwas bestellt wird.",
  inLanguage: "de-CH",
  banner: {
    image: "/Images/Kuche/bannerImageKuche3.jpg",
    title: "Designermöbel für das Rheintal",
    alt: "Offene Küche mit grauen Fronten, Kochinsel, beleuchteten Wandregalen und Bücherregal neben einem Sessel",
    crumb: "Designermöbel Rheintal",
    trail: [{ label: "Regionen", href: "/regionen" }], // Rat 9,5 B15: Regionen-Hub als Elternseite
  },
  intro: {
    eyebrow: "Für Widnau, Heerbrugg, Altstätten, Au und St. Margrethen",
    heading: "Vom Rheintal über den Rhein nach Lochau",
    paragraphs: [
      "Aus dem St. Galler Rheintal sind Sie mit dem Auto in rund 30 Minuten bei uns – je nach Ort und Grenzübergang. Über Au und Lustenau oder über St. Margrethen und Höchst erreichen Sie Lochau am österreichischen Ufer des Bodensees, kurz hinter Bregenz.",
      "In der Ausstellung stehen Sofas, Betten, Küchen, Wandsysteme und Leuchten internationaler Designmarken nebeneinander. Wer ein Einfamilienhaus baut, eine Wohnung im Stockwerkeigentum einrichtet oder saniert, kann hier Materialien, Masse und Sitzkomfort direkt vergleichen.",
      "Weil Sie aus der Schweiz kommen, gibt es beim Einkauf in Österreich einiges zu beachten: Rückerstattung der österreichischen Umsatzsteuer, Einfuhr in die Schweiz und Lieferung. Die wichtigsten Regeln haben wir unten zusammengefasst – Ihren konkreten Fall besprechen wir persönlich.",
    ],
    benefits: [
      "Rund 30 Minuten aus dem Rheintal",
      "Küchen, Wohnen, Schlafen und Licht an einem Ort",
      "Persönliche Beratung und Offerte – gerne mit Termin",
      "Rückerstattung und Einfuhr klären wir vor dem Kauf",
    ],
    image: "/Images/Wohnen/bannerImage4.jpg",
    imageAlt: "Wohnraum mit hellem Ecksofa, Couchtisch mit Marmorplatte, zwei dunklen Sesseln und einer Wand aus Holzlamellen",
  },
  brands: {
    eyebrow: "Führen wir in der Ausstellung",
    heading: "Marken für Neubau, Umbau und Stockwerkeigentum",
    items: [
      {
        name: "Poliform",
        slug: "poliform",
        image: "/Images/Home/slider/poliform-kueche-kochinsel.webp",
        imageAlt: "Poliform Küche mit Kochinsel, Esstisch aus Holz und Wandregal",
        text: "Küchen, Kleiderschränke und Wohnsysteme aus einer Hand – sinnvoll, wenn Sie beim Neubau oder Umbau mehrere Räume in einer Linie planen möchten.",
      },
      {
        name: "Rimadesio",
        slug: "rimadesio",
        image: "/Images/Home/slider/rimadesio-wandsystem-wohnraum.webp",
        imageAlt: "Rimadesio Wandsystem mit Holzpaneelen, Regalen und Sideboard im Wohnraum",
        text: "Schiebetüren, Raumteiler und Wandsysteme aus Glas und Aluminium – für offene Grundrisse, in denen Räume flexibel getrennt werden sollen.",
      },
      {
        name: "Minotti",
        slug: "minotti",
        image: "/Images/Home/slider/minotti-sofa-wohnzimmer.webp",
        imageAlt: "Minotti Ecksofa in Weiss in einem Wohnzimmer mit dunkler Holzwand",
        text: "Minotti bei uns erleben: Sofas und Sessel, deren Tiefe, Polsterung und Bezug Sie in Lochau in Ruhe ausprobieren können, bevor Sie sich entscheiden.",
      },
      {
        name: "Flos",
        slug: "flos",
        image: "/Images/Home/slider/flos-stehleuchte-v3.webp",
        imageAlt: "Flos Stehleuchte mit runder Leuchtscheibe auf verchromtem Dreibein",
        text: "Steh-, Pendel- und Tischleuchten. Kleinere Stücke wie Leuchten passen meist ins eigene Auto – das ist der einfachste Fall für die Rückerstattung.",
      },
    ],
    cta: { href: "/produkte", label: "Alle Produkte ansehen" },
  },
  steps: {
    eyebrow: "Einkauf aus der Schweiz",
    heading: "Rückerstattung, Einfuhr und Lieferung",
    items: [
      {
        title: "Selbst abholen: Rückerstattung",
        text: "Führen Sie die Ware im eigenen Auto, Mietbus oder Anhänger aus, kann die österreichische Umsatzsteuer erstattet werden. Voraussetzungen: Wohnsitz ausserhalb der EU, Rechnung über 75 Euro, Ausfuhr innerhalb von 3 Monaten und die Zollbestätigung innerhalb von 6 Monaten zurück bei uns.",
      },
      {
        title: "Einfuhr in die Schweiz",
        text: "An der Schweizer Grenze melden Sie die Ware an, etwa mit der App QuickZoll oder am Schalter, und bezahlen 8,1 Prozent Schweizer MWST. Zoll fällt auf Möbel seit 2024 nicht mehr an. Die Wertfreigrenze von CHF 150 pro Person und Tag ist bei Möbeln meist überschritten.",
      },
      {
        title: "Grosse Möbel: Lieferung",
        text: "Wird ein Sofa oder eine Küche durch einen Spediteur geliefert, entfällt die Rückerstattung: Die Rechnung lautet dann ohne österreichische Umsatzsteuer, Sie sind Importeur und bezahlen 8,1 Prozent MWST plus die Verzollungsgebühr des Spediteurs. Ob und wie wir liefern, klären wir mit Ihnen persönlich.",
      },
      {
        title: "Montage und Einbau",
        text: "Für Montagen in der Schweiz gelten eigene Melde- und Steuerregeln. Ob wir einbauen oder ein Schreiner aus Ihrer Region montiert, besprechen wir vor der Offerte. Bringen Sie dafür Grundriss und Raummasse mit.",
      },
    ],
  },
  gallery: [
    { src: "/Images/Kuche/bannerImageKuche1.jpg", alt: "Küche mit weisser Kochinsel und dunklen Hochschränken" },
    { src: "/Images/Licht/bannerImageLicht4.jpg", alt: "Esstisch mit goldenen Pendelleuchten vor einer Holzwand" },
    { src: "/Images/Wohnen/bannerImage3.jpg", alt: "Esszimmer mit Holztisch, Polsterstühlen und Sideboard" },
  ],
  showroom: {
    heading: "Vom Rheintal nach Lochau",
    text: "Unser Showroom liegt an der Landstraße 11 in Lochau, kurz hinter Bregenz. Aus Au und Widnau fahren Sie über Lustenau, aus St. Margrethen über Höchst. Wenn Sie Ware selbst ausführen und die Rückerstattung nutzen möchten: Die Zollstelle Lustenau/Au bestätigt die Ausfuhr rund um die Uhr, Höchst/St. Margrethen von Montag bis Freitag zwischen 8 und 16 Uhr (Stand Juli 2025, bitte vor der Fahrt prüfen).",
  },
  cta: {
    image: "/Images/Wohnen/bannerImage10.jpg",
    heading: "Besuchen Sie uns in Lochau",
    text: "Vereinbaren Sie einen Beratungstermin – wir planen genug Zeit für Ihre Fragen zu Rückerstattung, Einfuhr und Lieferung ein.",
  },
  faq: {
    name: "rheintal-faq",
    heading: "Fragen aus dem Rheintal",
    items: [
      {
        q: "Wie lange fahre ich aus dem Rheintal nach Lochau?",
        a: "Aus Widnau, Heerbrugg, Au oder St. Margrethen sind es mit dem Auto rund 30 Minuten, je nach Grenzübergang und Verkehr. Der Showroom liegt an der Landstraße 11 in 6911 Lochau, kurz hinter Bregenz.",
      },
      {
        q: "Bekomme ich die österreichische Umsatzsteuer zurück?",
        a: "Ja, wenn Sie die Ware selbst ausführen – im eigenen Auto, Mietbus oder Anhänger – und Ihren Wohnsitz ausserhalb der EU haben. Die Rechnung muss über 75 Euro liegen, die Ausfuhr innerhalb von 3 Monaten erfolgen und die Zollbestätigung innerhalb von 6 Monaten bei uns sein. Bei Lieferung durch einen Spediteur ist dieser Weg nicht möglich.",
      },
      {
        q: "Welche Zollstelle bestätigt mir die Ausfuhr?",
        a: "Laut Wirtschaftskammer Vorarlberg (Stand Juli 2025) bestätigt die Zollstelle Lustenau/Au rund um die Uhr. Höchst/St. Margrethen ist Montag bis Freitag von 8 bis 16 Uhr besetzt, Hohenems/Diepoldsau Montag bis Freitag von 7.30 bis 17 Uhr und Samstag von 10 bis 18 Uhr. Bitte prüfen Sie die Zeiten vor der Fahrt.",
      },
      {
        q: "Was bezahle ich bei der Einfuhr in die Schweiz?",
        a: "In der Regel 8,1 Prozent Schweizer MWST auf den Warenwert. Zoll fällt auf Möbel seit 2024 nicht mehr an, die Anmeldung beim Zoll bleibt aber Pflicht. Massgebend sind die Bestimmungen des Bundesamts für Zoll und Grenzsicherheit (BAZG).",
      },
      {
        q: "Liefern und montieren Sie auch im Rheintal?",
        a: "Das klären wir persönlich und vor der Offerte. Bei einer Lieferung durch einen Spediteur sind Sie Importeur und bezahlen die Schweizer MWST sowie die Verzollungsgebühr. Für Montagen in der Schweiz gelten eigene Melde- und Steuerregeln; alternativ kann ein Schreiner aus Ihrer Region montieren.",
      },
      {
        q: "Wann hat der Showroom geöffnet?",
        a: "Dienstag bis Freitag von 10 bis 18 Uhr und Samstag von 10 bis 14 Uhr. Für eine ausführliche Beratung, etwa zu einer Küche, empfehlen wir einen Termin.",
      },
      {
        q: "Welche Marken kann ich bei Ihnen ansehen?",
        a: "In der Ausstellung führen wir unter anderem Minotti, Poliform, Rimadesio, Flos, ClassiCon, Paola Lenti und Tréca sowie weitere internationale Designmarken für Wohnen, Küche, Schlafen und Licht.",
      },
    ],
  },
};

export default async function DesignermoebelRheintalPage({ params }) {
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
