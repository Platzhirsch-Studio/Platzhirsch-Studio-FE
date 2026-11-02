// /de/designermoebel-konstanz — local landing page (German only; other
// locales 404). Layout: src/components/Landing/landingPage.js.
// Robots via landingMetadata → regionRobots() (doorway audit, src/lib/seo/
// sitemap/doorwayAudit.js); JSON-LD WebPage + FAQPage via LandingPage.
import { notFound } from "next/navigation";
import LandingPage, { landingMetadata } from "@/components/Landing/landingPage";
import RegionLinks from "@/app/[locale]/regionen/RegionLinks";

const PATH = "/designermoebel-konstanz";

export async function generateMetadata({ params }) {
  const { locale } = await params;
  if (locale !== "de") return {};
  return landingMetadata({
    path: PATH,
    title: "Möbel & Designermöbel für Konstanz",
    description:
      "Designermöbel aus Italien für Konstanz und den westlichen Bodensee – Minotti und Rimadesio in der Ausstellung in Lochau, rund eine Stunde entfernt.",
  });
}

// Content is static German copy. Facts and sources (Marktresearch):
// drive time ~60 min (02, section 3); no bridge across the lake, so around the
// lake or by ferry (04); pickup in Lochau = Austrian VAT, delivery to Germany
// follows the EU distance-selling rules, kitchens with installation differ
// (18, section 5) — the page names the rules, never a rate for a concrete
// purchase; that is answered personally. Café Lounge next to the showroom (01).
const CONTENT = {
  // Runde 2 (P3): Termin-Knöpfe mit Kontext (ux P1-1) und der Kern-USP als
  // kurzer Abschnitt mit eigenem Satz (gesamtwerk P1-4, Durchdringungsplan §5).
  ort: "konstanz",
  processText:
    "Wir kommen zu Ihnen nach Konstanz, sehen uns Licht und Räume an, und Harald Menghin zeichnet Ihr Konzept von Hand. Für Wohnungen in der Altstadt achten wir früh auf Treppenhaus und Zugang. Danach planen wir in 3D, und Sie sehen Ihren Raum fotorealistisch, bevor etwas bestellt wird.",
  inLanguage: "de-DE",
  banner: {
    image: "/Images/UberUns/livingroom-view.jpg",
    title: "Designermöbel und Einrichtung für Konstanz",
    alt: "Großzügiger Wohnraum mit hellen Sofas, Sesseln und Couchtischen vor Vorhängen",
    crumb: "Designermöbel Konstanz",
    trail: [{ label: "Regionen", href: "/regionen" }], // Rat 9,5 B15: Regionen-Hub als Elternseite
  },
  intro: {
    eyebrow: "Für Konstanz und den westlichen Bodensee",
    heading: "Ein Einrichtungstag am anderen Ende des Sees",
    paragraphs: [
      "Von Konstanz nach Lochau ist es rund eine Stunde – entlang des deutschen Nordufers oder mit der Autofähre über Meersburg. Die Strecke lohnt sich vor allem dann, wenn Sie nicht ein einzelnes Möbelstück suchen, sondern ein Haus, eine Wohnung oder einen ganzen Wohnbereich planen.",
      "In unserer Ausstellung in Lochau zeigen wir italienische Polstermöbel, Wohnsysteme, Leuchten und Outdoor-Möbel nebeneinander. So sehen Sie an einem Tag, wie Sofa, Regalwand, Licht und Terrasse zusammenpassen. Direkt an den Showroom grenzt unsere Café Lounge – für eine Pause zwischen Beratung und Rückfahrt.",
    ],
    benefits: [
      "Minotti und Rimadesio in der Ausstellung erleben",
      "Wohnräume, Licht und Terrasse an einem Ort planen",
      "Café Lounge direkt am Showroom",
      "Beratungstermin vorab – damit sich die Fahrt lohnt",
    ],
    image: "/Images/UberUns/white-sofas.jpg",
    imageAlt: "Outdoor-Lounge mit Sesseln und Beistelltischen im Garten",
  },
  brands: {
    eyebrow: "Marken in der Ausstellung",
    heading: "Für Häuser am Wasser – drinnen wie draußen",
    items: [
      {
        name: "Minotti",
        slug: "minotti",
        image: "/Images/Home/slider/minotti-sofa-wohnzimmer.webp",
        imageAlt: "Minotti Ecksofa in Weiß in einem Wohnzimmer mit dunkler Holzwand",
        text: "Sofas, Sessel und Tische aus Italien – mit Indoor- und Outdoor-Kollektionen in einer gemeinsamen Designsprache. Passend für Häuser, in denen Wohnzimmer und Terrasse ineinander übergehen.",
      },
      {
        name: "Rimadesio",
        slug: "rimadesio",
        image: "/Images/Home/slider/rimadesio-wandsystem-wohnraum.webp",
        imageAlt: "Rimadesio Wandsystem mit Holzpaneelen, Regalen und Sideboard im Wohnraum",
        text: "Schiebetüren, Regal- und Wandsysteme sowie begehbare Kleiderschränke aus Glas und Aluminium – nach Maß geplant. Gut für Altbau- und Neubauwohnungen, in denen jeder Zentimeter zählt.",
      },
    ],
    cta: { href: "/produkte", label: "Alle Produkte ansehen" },
  },
  steps: {
    eyebrow: "Ihr Besuch aus Konstanz",
    heading: "So wird aus der Fahrt ein guter Beratungstag",
    items: [
      { title: "Termin anfragen", text: "Bei einer Stunde Anfahrt lohnt sich ein fester Termin. Dann haben wir Zeit für Sie und können passende Stücke vorab zusammenstellen." },
      { title: "Pläne mitbringen", text: "Grundriss, Raummaße und Fotos – oder die Pläne Ihres Architekten. Bei Schiebetüren und Wandsystemen sind genaue Maße besonders wichtig." },
      { title: "Route wählen", text: "Mit Möbeln im Kofferraum ist die Strecke über das deutsche Nordufer die einfachere: Sie bleibt innerhalb der EU und kreuzt keine Zollgrenze." },
      { title: "Pause einplanen", text: "Probesitzen braucht Zeit. Eine Pause in der Café Lounge direkt am Showroom hilft, Eindrücke zu sortieren, bevor Sie sich entscheiden." },
    ],
  },
  gallery: [
    { src: "/Images/Wohnen/bannerImage9.jpg", alt: "Raum mit Glasschiebetür, Wandregal und Designerleuchte" },
    { src: "/Images/Outdoor/bannerImage4.jpg", alt: "Weißer Esstisch mit Regiestühlen auf einer Terrasse unter Pinien mit Blick aufs Meer" },
    { src: "/Images/Wohnen/bannerImage1.jpg", alt: "Beistelltische aus Glas und Messing vor einer Betonwand" },
  ],
  showroom: {
    heading: "Von Konstanz nach Lochau",
    text: "Unser Showroom liegt in Lochau an der Landstraße, am östlichen Ufer des Bodensees und direkt hinter der Grenze bei Lindau. Von Konstanz fahren Sie rund eine Stunde – um den See oder mit der Fähre Konstanz–Meersburg. Vereinbaren Sie am besten einen Termin, damit wir uns ausreichend Zeit für Sie nehmen können.",
  },
  cta: {
    image: "/Images/Wohnen/bannerImage4.jpg",
    heading: "Ihr Beratungstermin in Lochau",
    text: "Vereinbaren Sie einen unverbindlichen Termin – wir bereiten Ihren Besuch vor, damit sich die Fahrt vom westlichen Bodensee lohnt.",
  },
  faq: {
    name: "konstanz-faq",
    heading: "Fragen zu Designermöbeln für Konstanz",
    items: [
      { q: "Wie lange fahre ich von Konstanz nach Lochau?", a: "Rund eine Stunde. Eine Brücke über den See gibt es nicht: Sie fahren entweder am deutschen Nordufer entlang über Friedrichshafen und Lindau oder nehmen die Autofähre von Konstanz nach Meersburg. Der Showroom befindet sich in der Landstraße 11 in 6911 Lochau." },
      { q: "Kann ich auch über die Schweiz fahren?", a: "Für die Anreise ja. Wenn Sie gekaufte Möbel selbst mitnehmen, empfehlen wir aber die Strecke über das deutsche Ufer: Sie bleibt innerhalb der EU, während die Route durch die Schweiz zweimal eine Zollgrenze kreuzt. Fragen dazu besprechen wir gerne vorab." },
      { q: "Fallen beim Möbelkauf in Österreich Zölle an?", a: "Nein. Österreich und Deutschland gehören beide zum EU-Binnenmarkt, zwischen den beiden Ländern gibt es keine Zölle." },
      { q: "Welche Umsatzsteuer gilt für Kunden aus Deutschland?", a: "Holen Sie Ihre Möbel selbst in Lochau ab, gilt die österreichische Umsatzsteuer. Liefern wir nach Deutschland, gelten die EU-Regeln für Fernverkäufe; für Einbauten mit Montage gelten eigene Regeln. Welcher Satz für Ihren Kauf gilt, klären wir persönlich, bevor Sie ein Angebot erhalten." },
      { q: "Liefern und montieren Sie auch in Konstanz?", a: "Sprechen Sie uns bitte direkt an. Lieferung und Montage am westlichen Bodensee klären wir individuell für Ihre Adresse und Ihr Projekt." },
      { q: "Wann hat der Showroom geöffnet?", a: "Dienstag bis Freitag von 10 bis 18 Uhr und Samstag von 10 bis 14 Uhr. Bei einer längeren Anfahrt empfehlen wir einen Termin." },
      { q: "Was sollte ich zur Beratung mitbringen?", a: "Grundriss, Raummaße und Fotos Ihrer Räume – gerne auch die Pläne Ihres Architekten. Für Schiebetüren, Wandsysteme und Kleiderschränke nach Maß brauchen wir möglichst genaue Maße." },
    ],
  },
};

export default async function DesignermoebelKonstanzPage({ params }) {
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
