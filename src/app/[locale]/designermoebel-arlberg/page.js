// /de/designermoebel-arlberg — local landing page for Lech, Zürs, Warth and
// St. Anton: chalets, holiday homes and hotels (German only; other locales
// 404). Layout: src/components/Landing/landingPage.js.
// Robots via landingMetadata → regionRobots() (doorway audit, src/lib/seo/
// sitemap/doorwayAudit.js); JSON-LD WebPage + FAQPage via LandingPage.
import { notFound } from "next/navigation";
import LandingPage, { landingMetadata } from "@/components/Landing/landingPage";
import RegionLinks from "@/app/[locale]/regionen/RegionLinks";

const PATH = "/designermoebel-arlberg";

export async function generateMetadata({ params }) {
  const { locale } = await params;
  if (locale !== "de") return {};
  return landingMetadata({
    path: PATH,
    title: "Designermöbel für Chalets am Arlberg",
    description:
      "Designermöbel für Chalet, Ferienwohnung und Hotel in Lech, Zürs und St. Anton: Minotti, Treca und Outdoor-Marken in der Ausstellung in Lochau.",
  });
}

// Static German copy. Lech, Zürs, Warth and St. Anton are in Austria, so the
// page stays de-AT. Facts and their sources:
// - Driving time Lochau–Lech ~75 min (Marktresearch/02), "rund 1,5 Stunden
//   am Arlberg" (Marktresearch/13) -> phrased as a range.
// - Many holiday-home owners live in CH or DE (Marktresearch/13, Idee 24).
// The second-home service, turnkey packages and winter storage from
// Marktresearch/13 and 23 are plans, not offers: nothing here promises them.
// Delivery, assembly and invoicing are answered personally.
// No dealer-status claims for Minotti/Poliform (Marktresearch/00).
const CONTENT = {
  // Runde 2 (P3): Termin-Knöpfe mit Kontext (ux P1-1) und der Kern-USP als
  // kurzer Abschnitt mit eigenem Satz (gesamtwerk P1-4, Durchdringungsplan §5).
  ort: "arlberg",
  processText:
    "Wir kommen zu Ihnen an den Arlberg, sehen uns Licht und Räume an, und Harald Menghin zeichnet Ihr Konzept von Hand. Für Chalets und Ferienwohnungen planen wir mit den Gewerken vor Ort. Danach planen wir in 3D, und Sie sehen Ihren Raum fotorealistisch, bevor etwas bestellt wird.",
  inLanguage: "de-AT",
  banner: {
    image: "/Images/Wohnen/bannerImage7.jpg",
    title: "Designermöbel für Chalets am Arlberg",
    alt: "Wohnzimmer mit Kamin, Sesseln und rundem Teppich",
    crumb: "Designermöbel Arlberg",
    trail: [{ label: "Regionen", href: "/regionen" }], // Rat 9,5 B15: Regionen-Hub als Elternseite
  },
  intro: {
    eyebrow: "Für Lech, Zürs, Warth und St. Anton",
    heading: "Ein Chalet einrichten – von der Kaminlounge bis zur Sonnenterrasse",
    paragraphs: [
      "Wer ein Chalet, eine Ferienwohnung oder ein Haus am Arlberg einrichtet, plant selten nur ein Sofa. Meist geht es um das ganze Objekt: Wohnraum mit Kamin, Essplatz für Gäste, mehrere Schlafzimmer und eine Terrasse für den Sommer. In unserer Ausstellung in Lochau am Bodensee sehen Sie Möbel, Leuchten und Outdoor-Kollektionen internationaler Marken an einem Ort – darunter Minotti, Poliform, Treca und Paola Lenti.",
      "Viele Eigentümer am Arlberg wohnen in Deutschland, der Schweiz oder anderswo und sind nur einen Teil des Jahres vor Ort. Deshalb lohnt sich ein gut vorbereiteter Termin: Wir gehen Grundrisse, Fotos und Ihre Nutzung – selbst bewohnt oder vermietet – gemeinsam durch und stimmen alle Räume aufeinander ab.",
    ],
    benefits: [
      "Ganze Objekte planen statt Einzelstücke kaufen",
      "Wohnen, Schlafen und Terrasse aus einer Ausstellung",
      "Beratung mit Termin – passend zu Ihrem Aufenthalt",
      "Auch für Hotels und Gastgeber am Arlberg",
    ],
    image: "/Images/Wohnen/bannerImage10.jpg",
    imageAlt: "Großzügiges Wohnzimmer mit grauen Sofas und Blick ins Grüne",
  },
  brands: {
    eyebrow: "In der Ausstellung in Lochau",
    heading: "Gemütlich im Winter, offen im Sommer",
    items: [
      {
        name: "Minotti",
        slug: "minotti",
        image: "/Images/Home/slider/minotti-sofa-wohnzimmer.webp",
        imageAlt: "Minotti Ecksofa in Weiß in einem Wohnzimmer mit dunkler Holzwand",
        text: "Tiefe Sofas und Sessel für die Lounge am Kamin – und Outdoor-Kollektionen in derselben Designsprache für Balkon und Terrasse. So wirkt ein Chalet drinnen wie draußen aus einem Guss.",
      },
      {
        name: "Treca",
        slug: "treca",
        image: "/Images/Home/slider/treca-paris-bett-schlafzimmer.webp",
        imageAlt: "Treca Paris Bett mit gemustertem Kopfteil in einem hellen Schlafzimmer",
        text: "Betten und Matratzen aus Paris mit individuell bezogenen Kopfteilen. Für Chalets mit mehreren Gästezimmern ebenso wie für Suiten im Hotel, in denen der Schlafkomfort zählt.",
      },
    ],
    cta: { href: "/produkte", label: "Alle Produkte ansehen" },
  },
  steps: {
    eyebrow: "Gut zu wissen",
    heading: "So planen wir Ihre Einrichtung am Arlberg",
    items: [
      { title: "Früh planen", text: "Möbel internationaler Hersteller haben Lieferzeiten. Wer zur Wintersaison einziehen oder vermieten möchte, beginnt mit der Planung am besten im Frühjahr oder Sommer davor." },
      { title: "Nutzung klären", text: "Selbst bewohnt oder vermietet? Davon hängen Stoffe, Pflege und Robustheit ab – etwa abnehmbare Bezüge in Gästezimmern oder strapazierfähige Leder in der Lounge." },
      { title: "Terrasse mitdenken", text: "Für den Sommer am Berg führen wir Outdoor-Möbel und Sonnenschirme, etwa von Paola Lenti, Tuuci und Umbrosa. Wie Sie sie am besten über den Winter schützen, besprechen wir gleich mit." },
      { title: "Lieferung abstimmen", text: "Zufahrt, Liefertermin und Montage hängen von Ort und Jahreszeit ab. Wie wir das für Ihr Objekt am besten lösen – auch wenn Sie nicht vor Ort sind –, klären wir persönlich." },
    ],
    // Welle 2: Chalets, Ferienwohnungen und Hotels auf der Seite Hotel & Objekt.
    links: [{ href: "/hotel-objekt#chalets", label: "Chalets, Ferienwohnungen und Hotels einrichten" }],
  },
  gallery: [
    { src: "/Images/Licht/bannerImageLicht1.jpg", alt: "Essbereich mit Kronleuchter, Bücherregal und Blick in den Garten" },
    { src: "/Images/Accessories/bannerImageAccessories3.jpg", alt: "Rattansessel mit Kissen und Wolldecke im Freien" },
    { src: "/Images/Outdoor/bannerImage3.jpg", alt: "Outdoor-Sessel und Sofa mit hellen Kissen auf einer Kiesterrasse mit Weitblick" },
  ],
  showroom: {
    heading: "Vom Arlberg an den Bodensee",
    text: "Unsere Ausstellung liegt in Lochau an der Landstraße 11, am österreichischen Ufer des Bodensees. Von Lech sind Sie je nach Strecke und Wetter in rund 75 Minuten bis eineinhalb Stunden bei uns. Vereinbaren Sie einen Termin, damit wir Ihr Objekt in Ruhe besprechen können – gerne auch für mehrere Räume an einem Tag.",
  },
  cta: {
    image: "/Images/Wohnen/bannerImage9.jpg",
    heading: "Ihr Chalet, gemeinsam geplant",
    text: "Vereinbaren Sie einen unverbindlichen Beratungstermin in unserer Ausstellung in Lochau – mit Grundriss, Fotos und Ihren Ideen.",
  },
  faq: {
    name: "arlberg-faq",
    heading: "Fragen zu Designermöbeln für den Arlberg",
    items: [
      { q: "Wie weit ist Ihre Ausstellung vom Arlberg entfernt?", a: "Von Lech fahren Sie je nach Strecke und Wetter rund 75 Minuten bis eineinhalb Stunden. Unsere Ausstellung befindet sich in der Landstraße 11 in 6911 Lochau am Bodensee." },
      { q: "Richten Sie auch ganze Chalets oder Ferienwohnungen ein?", a: "Ja, wir planen gerne mehrere Räume oder ein ganzes Objekt – Wohnen, Essen, Schlafen und Terrasse. Bringen Sie dazu Grundrisse und Fotos mit, dann können wir konkret beraten." },
      { q: "Ich wohne nicht am Arlberg. Wie läuft die Lieferung ab?", a: "Sprechen Sie uns bitte vor dem Kauf an. Lieferung, Montage und Übergabe stimmen wir für Ihr Objekt und Ihre Termine persönlich ab." },
      { q: "Beraten Sie auch Hotels und Gastgeber?", a: "Ja. Für Lobby, Lounge, Suiten oder Terrasse beraten wir gerne auch Hotels und Vermieter am Arlberg. Den Umfang besprechen wir persönlich." },
      { q: "Welche Marken passen zu einem Chalet?", a: "Für die Lounge am Kamin etwa Minotti oder Poliform, für Schlafzimmer Treca, für Licht Flos und für die Terrasse Paola Lenti, Tuuci und Umbrosa. Alle führen wir in unserer Ausstellung in Lochau." },
      { q: "Wann hat die Ausstellung geöffnet?", a: "Dienstag bis Freitag von 10 bis 18 Uhr und Samstag von 10 bis 14 Uhr. Für die Planung eines ganzen Objekts empfehlen wir einen Termin." },
      { q: "Wann sollte ich mit der Planung beginnen?", a: "Möbel internationaler Hersteller haben Lieferzeiten. Soll Ihr Chalet zur Wintersaison fertig sein, beginnen Sie am besten im Frühjahr oder Sommer davor. Die genauen Lieferzeiten nennen wir Ihnen bei der Beratung." },
    ],
  },
};

export default async function DesignermoebelArlbergPage({ params }) {
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
