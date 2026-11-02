// /de/designermoebel-kempten — local landing page for Kempten and the Allgäu
// (German only; other locales 404). Layout: src/components/Landing/landingPage.js.
// Robots via landingMetadata → regionRobots() (doorway audit, src/lib/seo/
// sitemap/doorwayAudit.js); JSON-LD WebPage + FAQPage via LandingPage.
import { notFound } from "next/navigation";
import LandingPage, { landingMetadata } from "@/components/Landing/landingPage";
import RegionLinks from "@/app/[locale]/regionen/RegionLinks";

const PATH = "/designermoebel-kempten";

export async function generateMetadata({ params }) {
  const { locale } = await params;
  if (locale !== "de") return {};
  return landingMetadata({
    path: PATH,
    title: "Möbel & Designermöbel für Kempten",
    description:
      "Designermöbel für Kempten und das Allgäu: Minotti, Poliform und Rimadesio in der Ausstellung in Lochau, rund 50 Minuten entfernt.",
  });
}

// Static German copy for visitors from Germany. Facts and their sources:
// - Driving time Kempten–Lochau ~50 min: Marktresearch/02 (Richtwerte).
// - Tax: pick-up in Lochau = Austrian VAT; delivery of loose furniture to DE
//   can be invoiced with German VAT (OSS) — Marktresearch/18, Abschnitt 5.
//   Everything beyond that (delivery, assembly, invoicing) is answered
//   personally, never promised here.
// No dealer-status claims for Minotti/Poliform (Marktresearch/00).
const CONTENT = {
  // Runde 2 (P3): Termin-Knöpfe mit Kontext (ux P1-1) und der Kern-USP als
  // kurzer Abschnitt mit eigenem Satz (gesamtwerk P1-4, Durchdringungsplan §5).
  ort: "kempten",
  processText:
    "Wir kommen zu Ihnen nach Kempten, sehen uns Licht und Räume an, und Harald Menghin zeichnet Ihr Konzept von Hand. Für Häuser im Allgäu beziehen wir Ausblick und Jahreszeiten in die Planung ein. Danach planen wir in 3D, und Sie sehen Ihren Raum fotorealistisch, bevor etwas bestellt wird.",
  inLanguage: "de-DE",
  banner: {
    image: "/Images/Home/slider/rimadesio-wandsystem-wohnraum.webp",
    title: "Designermöbel für Kempten und das Allgäu",
    alt: "Rimadesio Wandsystem mit Holzpaneelen, Regalen und Sideboard im Wohnraum",
    crumb: "Designermöbel Kempten",
    trail: [{ label: "Regionen", href: "/regionen" }], // Rat 9,5 B15: Regionen-Hub als Elternseite
  },
  intro: {
    eyebrow: "Für Kempten und das Allgäu",
    heading: "Vom Allgäu an den Bodensee – für Möbel, die bleiben",
    paragraphs: [
      "Von Kempten fahren Sie rund 50 Minuten über Lindau zu uns nach Lochau, direkt hinter der deutsch-österreichischen Grenze. In der Ausstellung zeigen wir Möbel, Leuchten und Accessoires internationaler Designmarken – darunter Minotti, Poliform und Rimadesio, die Sie bei uns im Original sehen und ausprobieren können.",
      "Wer für einen Neubau, eine Sanierung oder ein ganzes Haus im Allgäu einkauft, plant meist mehrere Räume auf einmal. Dafür lohnt sich ein Besuch mit Termin: Wir nehmen uns Zeit, gehen Grundriss und Materialien mit Ihnen durch und stimmen Wohnzimmer, Essbereich, Schlafzimmer und Küche aufeinander ab. Danach lässt sich der Tag gut mit einem Abstecher an den See verbinden – unser Café ist gleich im Haus.",
    ],
    benefits: [
      "Rund 50 Minuten von Kempten",
      "Minotti, Poliform und Rimadesio in der Ausstellung",
      "Ganze Räume planen statt Einzelstücke suchen",
      "Beratung mit Termin – und ein Café im Haus",
    ],
    image: "/Images/Wohnen/bannerImage6.jpg",
    imageAlt: "Offener Wohnraum mit Vitrinenschränken, Kochinsel und runder Pendelleuchte",
  },
  brands: {
    eyebrow: "In der Ausstellung in Lochau",
    heading: "Italienisches Wohnen für Haus und Neubau",
    items: [
      {
        name: "Minotti",
        slug: "minotti",
        image: "/Images/Home/slider/minotti-sofa-wohnzimmer.webp",
        imageAlt: "Minotti Ecksofa in Weiß in einem Wohnzimmer mit dunkler Holzwand",
        text: "Sofas, Sessel und Tische aus der Lombardei. Großzügige Sitzlandschaften, die sich nur im Probesitzen wirklich beurteilen lassen – deshalb lohnt der Weg aus dem Allgäu in die Ausstellung.",
      },
      {
        name: "Rimadesio",
        slug: "rimadesio",
        image: "/Images/UberUns/Rimadesio-Modulor.jpg",
        imageAlt: "Wohnwand mit Holzpaneelen, Regalböden und Lowboard, davor eine schwarze Lederbank",
        text: "Wandsysteme, Regale, Schiebetüren und Raumteiler aus Glas und Aluminium. Passend für offene Grundrisse im Neubau, in denen Wohnen, Essen und Arbeiten ineinander übergehen.",
      },
    ],
    cta: { href: "/produkte", label: "Alle Produkte ansehen" },
  },
  steps: {
    eyebrow: "Gut zu wissen",
    heading: "Einkaufen in Österreich als Kunde aus Deutschland",
    items: [
      { title: "Kein Zoll", text: "Deutschland und Österreich gehören zum EU-Binnenmarkt. Für Möbel, die Sie bei uns kaufen, fallen keine Zölle an." },
      { title: "Umsatzsteuer", text: "Holen Sie selbst in Lochau ab, gilt die österreichische Umsatzsteuer. Bei einer Lieferung nach Deutschland kann die deutsche Umsatzsteuer gelten. Was auf Ihrer Rechnung steht, klären wir vor dem Kauf." },
      { title: "Lieferung ins Allgäu", text: "Ob Kempten, Oberallgäu oder Westallgäu: Lieferung und Montage an Ihre Adresse besprechen wir persönlich und für Ihr Projekt." },
      { title: "Pläne mitbringen", text: "Ein Grundriss, die Raummaße und Fotos machen die Beratung konkret. Bei Neubauten hilft auch der Plan des Architekten." },
    ],
  },
  gallery: [
    { src: "/Images/Wohnen/bannerImage3.jpg", alt: "Esszimmer mit Holztisch, Polsterstühlen und Sideboard" },
    { src: "/Images/Licht/bannerImageLicht4.jpg", alt: "Esstisch mit goldenen Pendelleuchten vor einer Holzwand" },
    { src: "/Images/Home/Poliform-Kitchen.jpg", alt: "Offene Küche mit Nussholz-Kochinsel und Esstisch" },
  ],
  showroom: {
    heading: "Von Kempten nach Lochau",
    text: "Unsere Ausstellung liegt in Lochau an der Landstraße 11, wenige Minuten hinter Lindau. Von Kempten sind Sie mit dem Auto in rund 50 Minuten bei uns. Vereinbaren Sie am besten einen Termin – dann ist Zeit für Ihre Fragen, und die passenden Stoffe und Muster liegen bereit.",
  },
  cta: {
    image: "/Images/Wohnen/bannerImage10.jpg",
    heading: "Ein Tag am Bodensee – mit Beratung",
    text: "Vereinbaren Sie einen unverbindlichen Termin in unserer Ausstellung in Lochau, rund 50 Minuten von Kempten.",
  },
  faq: {
    name: "kempten-faq",
    heading: "Fragen zu Designermöbeln für Kempten und das Allgäu",
    items: [
      { q: "Wie lange fahre ich von Kempten zu Ihnen?", a: "Mit dem Auto rund 50 Minuten, je nach Verkehr. Lochau liegt direkt hinter der Grenze bei Lindau, unsere Ausstellung befindet sich in der Landstraße 11 in 6911 Lochau." },
      { q: "Fallen beim Möbelkauf in Österreich Zölle an?", a: "Nein. Deutschland und Österreich gehören zum EU-Binnenmarkt, zwischen den beiden Ländern gibt es keine Zölle." },
      { q: "Zahle ich österreichische oder deutsche Umsatzsteuer?", a: "Holen Sie die Möbel selbst in Lochau ab, gilt die österreichische Umsatzsteuer. Liefern wir nach Deutschland, kann die deutsche Umsatzsteuer gelten. Wie das bei Ihrem Einkauf aussieht, klären wir vor dem Kauf mit Ihnen." },
      { q: "Liefern Sie nach Kempten und ins Allgäu?", a: "Sprechen Sie uns bitte vor dem Kauf an. Lieferung und Montage für Ihre Adresse und Ihr Projekt klären wir persönlich." },
      { q: "Kann ich Minotti und Poliform bei Ihnen ansehen?", a: "Ja. Minotti und Poliform führen wir in unserer Ausstellung in Lochau, dazu Rimadesio, ClassiCon, Flos, Treca und weitere internationale Marken für Möbel, Leuchten und Accessoires." },
      { q: "Wann hat die Ausstellung geöffnet?", a: "Dienstag bis Freitag von 10 bis 18 Uhr und Samstag von 10 bis 14 Uhr. Wenn Sie aus dem Allgäu anreisen, empfehlen wir einen Termin, damit wir uns ausreichend Zeit nehmen können." },
      { q: "Was sollte ich zur Beratung mitbringen?", a: "Hilfreich sind ein Grundriss oder die Raummaße mit Fenstern und Türen, Fotos der Räume und – bei einem Neubau – die Pläne Ihres Architekten." },
    ],
  },
};

export default async function DesignermoebelKemptenPage({ params }) {
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
