// /de/designermoebel-lindau — local landing page (German only; other
// locales 404). Layout: src/components/Landing/landingPage.js.
// Robots via landingMetadata → regionRobots() (doorway audit, src/lib/seo/
// sitemap/doorwayAudit.js); JSON-LD WebPage + FAQPage via LandingPage.
import { notFound } from "next/navigation";
import LandingPage, { landingMetadata } from "@/components/Landing/landingPage";
import RegionLinks from "@/app/[locale]/regionen/RegionLinks";
import OrtsMarken from "@/components/Landing/OrtsMarken";

const PATH = "/designermoebel-lindau";

export async function generateMetadata({ params }) {
  const { locale } = await params;
  if (locale !== "de") return {};
  return landingMetadata({
    path: PATH,
    title: "Möbel & Designermöbel für Lindau",
    description:
      "Designermöbel rund 5 Minuten von Lindau, direkt hinter der Grenze in Lochau: Minotti und ClassiCon in der Ausstellung, ohne Zoll, ohne Autobahn.",
  });
}

// Content is static German copy. Delivery, invoicing and tax for customers
// from Germany: only the general rules (same wording as the Konstanz page),
// the rate for a concrete purchase is answered personally.
// Own facts (doorway audit, src/lib/seo/sitemap/doorwayAudit.js REGION_FACTS,
// Runde 3 P5, 28.10.2026) and their sources – nothing else is stated:
//   1. Drive time ~5 min, ~6–8 km (Marktresearch/02-marktanalyse.md §3,
//      digital/09-local-seo-reputation.md Einzugsgebiet).
//   2. Route along the lake without the motorway, so no Austrian vignette
//      (the vignette is only required on Autobahnen and Schnellstraßen).
//   3. Districts of Lindau (Insel, Aeschach, Hoyren, Reutin, Zech, Bad
//      Schachen) and access/delivery to the island – geography only.
//   4. Outdoor furniture by the lake (material, fabrics, space, winter) –
//      the page's own guide, on no other region page.
//   The tax FAQ (pickup = Austrian VAT, delivery = EU distance-selling rules)
//   is shared with Konstanz and does not count.
// No prices, no references, no projects.
const CONTENT = {
  // Runde 2 (P3): Termin-Knöpfe mit Kontext (ux P1-1) und der Kern-USP als
  // kurzer Abschnitt mit eigenem Satz (gesamtwerk P1-4, Durchdringungsplan §5).
  ort: "lindau",
  processText:
    "Wir kommen zu Ihnen nach Lindau, sehen uns Licht und Räume an, und Harald Menghin zeichnet Ihr Konzept von Hand. Für die Insel und die Uferlagen achten wir auf Zugang und Anlieferung. Danach planen wir in 3D, und Sie sehen Ihren Raum fotorealistisch, bevor etwas bestellt wird.",
  inLanguage: "de-DE",
  // Hero: typographic (imagery.js, released: false) – no Lindau photo with a
  // documented release.
  banner: {
    image: "/Images/Wohnen/bannerImage10.jpg",
    title: "Designermöbel und Einrichtung für Lindau",
    lead: "Von Lindau sind es rund 5 Minuten bis zu unserem Showroom in Lochau, direkt hinter der Grenze. Zwischen Deutschland und Österreich fällt kein Zoll an.",
    alt: "Wohnraum mit hellem Ecksofa, rundem Marmortisch und Glasfront zu einem begrünten Innenhof",
    crumb: "Designermöbel Lindau",
    trail: [{ label: "Regionen", href: "/regionen" }], // Rat 9,5 B15: Regionen-Hub als Elternseite
  },
  facts: [
    { label: "Fahrzeit ab Lindau", value: "Rund 5 Minuten, direkt hinter der Grenze" },
    { label: "Anfahrt", value: "Am See entlang, ohne Autobahn und ohne Vignette" },
    { label: "Zoll", value: "Keiner – Österreich und Deutschland liegen im EU-Binnenmarkt" },
  ],
  intro: {
    eyebrow: "Rund 5 Minuten von Lindau",
    heading: "Designermöbel direkt hinter der Grenze",
    paragraphs: [
      "Lindau und Lochau trennen nur wenige Kilometer und eine Landesgrenze, die im Alltag kaum spürbar ist. Aus Zech, Reutin, Aeschach oder von der Insel fahren Sie rund 5 Minuten am See entlang – ohne Autobahn, eine österreichische Vignette brauchen Sie dafür nicht. In unserem Showroom zeigen wir Möbel, Leuchten und Accessoires internationaler Designmarken, vom Sofa für das Wohnzimmer bis zur Lounge für Terrasse und Garten.",
      "Gerade bei hochwertigen Möbeln lohnt sich der Besuch vor Ort: Sitzkomfort, Stoffe, Leder und Oberflächen lassen sich nur im Original wirklich beurteilen. Für Wohnungen auf der Insel und Häuser am Ufer, etwa in Bad Schachen oder Hoyren, klären wir früh, wie die Möbel ins Haus kommen.",
    ],
    benefits: [
      "Showroom in Lochau, direkt an der Grenze zu Bayern",
      "Anfahrt ohne Autobahn und ohne Vignette",
      "Möbel für Wohnräume, Terrasse und Garten",
      "Zugang und Anlieferung klären wir vor dem Kauf",
    ],
    image: "/Images/Outdoor/bannerImage1.jpg",
    imageAlt: "Outdoor-Lounge mit Sofa, Sesseln und Couchtischen aus Holz vor einer weißen Lochwand",
  },
  brands: {
    eyebrow: "Marken im Showroom",
    heading: "Wohnen am See – drinnen wie draußen",
    items: [
      {
        name: "Minotti",
        slug: "minotti",
        image: "/Images/Home/slider/minotti-sofa-wohnzimmer.webp",
        imageAlt: "Minotti Ecksofa in Weiß in einem Wohnzimmer mit dunkler Holzwand",
        text: "Italienische Sofas, Sessel und Tische – für Wohnräume ebenso wie in Outdoor-Kollektionen für Terrasse und Garten.",
      },
      {
        name: "ClassiCon",
        slug: "classicon",
        image: "/Images/Home/slider/classicon-bell-beistelltische.webp",
        imageAlt: "ClassiCon Bell Beistelltische mit farbigen Glasfüßen",
        text: "Möbel und Leuchten aus München – zeitgenössisches Design und Klassiker der Moderne, gefertigt mit viel Sorgfalt im Detail.",
      },
    ],
    cta: { href: "/produkte", label: "Alle Produkte ansehen" },
  },
  steps: {
    eyebrow: "Outdoor-Möbel am See",
    heading: "Worauf es bei Möbeln für Terrasse und Garten ankommt",
    items: [
      { title: "Material wählen", text: "Teak, Aluminium, Edelstahl und wetterfeste Kordel- und Seilgewebe sind für den Außenbereich gemacht – mit unterschiedlicher Optik und Pflege." },
      { title: "Stoffe prüfen", text: "Outdoor-Stoffe sollten UV-beständig und schnell trocknend sein. Abnehmbare Bezüge erleichtern die Reinigung." },
      { title: "Maße planen", text: "Planen Sie genug Platz zum Durchgehen ein – rund um den Esstisch und zwischen Lounge und Brüstung." },
      { title: "An den Winter denken", text: "Schutzhüllen oder ein trockener Lagerplatz verlängern die Lebensdauer von Polstern und Kissen deutlich." },
    ],
  },
  gallery: [
    { src: "/Images/Home/bannerImage.jpg", alt: "Zwei Outdoor-Sessel mit Flechtwerk und Couchtisch vor einer Natursteinwand" },
    { src: "/Images/Wohnen/bannerImage1.jpg", alt: "Beistelltische mit farbigen Glasfüßen und ein Stuhl vor einer Sichtbetonwand" },
  ],
  showroom: {
    heading: "Von Lindau in rund 5 Minuten bei uns",
    text: "Unser Showroom liegt in Lochau an der Landstraße 11, direkt hinter der Grenze. Sie fahren am See entlang ohne Autobahn, Lochau ist auch mit Zug und Bus erreichbar. Kommen Sie vorbei – oder fragen Sie einen Termin für eine ausführliche Beratung an.",
  },
  cta: {
    image: "/Images/Wohnen/bannerImage10.jpg",
    heading: "Besuchen Sie uns in Lochau",
    text: "Fragen Sie einen unverbindlichen Beratungstermin an – direkt hinter der Grenze, rund 5 Minuten von Lindau.",
  },
  faq: {
    name: "lindau-faq",
    heading: "Fragen zu Designermöbeln für Lindau",
    items: [
      { q: "Wie weit ist Ihr Showroom von Lindau entfernt?", a: "Rund 5 Minuten mit dem Auto. Lochau grenzt an Bayern, der Showroom befindet sich in der Landstraße 11 in 6911 Lochau." },
      { q: "Brauche ich für die Anfahrt eine Vignette?", a: "Nein, wenn Sie am See entlang über die Landstraße fahren. Die österreichische Vignette gilt nur für Autobahnen und Schnellstraßen." },
      { q: "Fallen beim Möbelkauf in Österreich Zölle an?", a: "Nein. Österreich und Deutschland gehören beide zum EU-Binnenmarkt, zwischen den beiden Ländern gibt es keine Zölle." },
      { q: "Welche Umsatzsteuer gilt für Kunden aus Lindau?", a: "Holen Sie Ihre Möbel selbst in Lochau ab, gilt die österreichische Umsatzsteuer. Liefern wir nach Deutschland, gelten die EU-Regeln für Fernverkäufe; für Einbauten mit Montage gelten eigene Regeln. Welcher Satz für Ihren Kauf gilt, klären wir persönlich, bevor Sie ein Angebot erhalten." },
      { q: "Liefern Sie auch nach Lindau, auch auf die Insel?", a: "Sprechen Sie uns bitte direkt an. Lieferung und Montage klären wir auf Anfrage für Ihre Adresse – auf der Insel und in Uferlagen gehören Zufahrt und Treppenhaus mit dazu." },
      { q: "Führen Sie auch Outdoor-Möbel?", a: "Ja. Neben Möbeln für Wohnräume finden Sie bei uns Outdoor-Möbel, Sonnenschirme und Accessoires für Terrasse, Balkon und Garten." },
      { q: "Wann hat der Showroom geöffnet?", a: "Dienstag bis Freitag von 10 bis 18 Uhr und Samstag von 10 bis 14 Uhr. Für eine ausführliche Beratung empfehlen wir einen Termin." },
    ],
  },
};

export default async function DesignermoebelLindauPage({ params }) {
  const { locale } = await params;
  if (locale !== "de") notFound();
  return (
    <>
      {/* QM R3: Vertragshändler-Block vor dem Abschluss-CTA statt danach. */}
      <LandingPage content={CONTENT} path={PATH} beforeClosing={<OrtsMarken path={PATH} />} />
      {/* Rat 9,5 B15: Nachbarorte, Ratgeber, Küche, Hotel & Objekt, Regionen-Hub */}
      <RegionLinks path={PATH} />
    </>
  );
}
