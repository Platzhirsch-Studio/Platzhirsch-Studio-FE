// /de/designermoebel-lindau — local landing page (German only; other
// locales 404). Layout: src/components/Landing/landingPage.js.
// Indexable (see landingMetadata); JSON-LD WebPage + FAQPage via LandingPage.
import { notFound } from "next/navigation";
import LandingPage, { landingMetadata } from "@/components/Landing/landingPage";

const PATH = "/designermoebel-lindau";

export async function generateMetadata({ params }) {
  const { locale } = await params;
  if (locale !== "de") return {};
  return landingMetadata({
    path: PATH,
    title: "Designermöbel für Lindau",
    description:
      "Designermöbel und Outdoor-Möbel internationaler Marken – im Showroom in Lochau, wenige Kilometer von Lindau, direkt hinter der Grenze. Persönliche Beratung.",
  });
}

// Content is static German copy. Keep it general: delivery, invoicing and tax
// questions for customers from Germany are answered personally, not promised here.
const CONTENT = {
  inLanguage: "de-DE",
  banner: {
    image: "/Images/Outdoor/bannerImage5.jpg",
    title: "Designermöbel für Lindau",
    alt: "Outdoor-Lounge mit Sofa, gelben Kissen und Couchtisch auf einer Terrasse mit Meerblick",
    crumb: "Designermöbel Lindau",
  },
  intro: {
    eyebrow: "Wenige Kilometer von Lindau",
    heading: "Designermöbel direkt hinter der Grenze",
    paragraphs: [
      "Lindau und Lochau trennen nur wenige Kilometer und eine Landesgrenze, die im Alltag kaum spürbar ist. In unserem Showroom in Lochau zeigen wir Möbel, Leuchten und Accessoires internationaler Designmarken – vom Sofa für das Wohnzimmer bis zur Lounge für Terrasse und Garten.",
      "Gerade bei hochwertigen Möbeln lohnt sich der Besuch vor Ort: Sitzkomfort, Stoffe, Leder und Oberflächen lassen sich nur im Original wirklich beurteilen. Wir nehmen uns Zeit, besprechen Ihre Räume und zeigen Ihnen Möglichkeiten, die zu Ihrem Zuhause passen.",
    ],
    benefits: [
      "Showroom in Lochau, direkt an der Grenze zu Bayern",
      "Möbel für Wohnräume, Terrasse und Garten",
      "Persönliche Beratung – gerne mit Termin",
      "Internationale Designmarken an einem Ort",
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
    { src: "/Images/Outdoor/bannerImage2.jpg", alt: "Outdoor-Esstisch aus Holz mit geflochtenen Stühlen auf einer Terrasse mit Pflanzen" },
    { src: "/Images/Outdoor/bannerImage4.jpg", alt: "Weißer Esstisch mit Regiestühlen auf einer Terrasse unter Pinien mit Blick aufs Meer" },
    { src: "/Images/Outdoor/bannerImage3.jpg", alt: "Outdoor-Sessel und Sofa mit hellen Kissen auf einer Kiesterrasse mit Weitblick" },
  ],
  showroom: {
    heading: "Von Lindau schnell bei uns",
    text: "Unser Showroom liegt in Lochau an der Landstraße, nur wenige Autominuten von Lindau. Lochau ist auch mit Zug und Bus erreichbar. Kommen Sie vorbei – oder vereinbaren Sie einen Termin für eine ausführliche Beratung.",
  },
  cta: {
    image: "/Images/Wohnen/bannerImage10.jpg",
    heading: "Besuchen Sie uns in Lochau",
    text: "Vereinbaren Sie einen unverbindlichen Beratungstermin – direkt hinter der Grenze, wenige Kilometer von Lindau.",
  },
  faq: {
    name: "lindau-faq",
    heading: "Fragen zu Designermöbeln für Lindau",
    items: [
      { q: "Wie weit ist Ihr Showroom von Lindau entfernt?", a: "Lochau grenzt an Bayern – von Lindau sind es nur wenige Kilometer. Unser Showroom befindet sich in der Landstraße 9 in 6911 Lochau." },
      { q: "Fallen beim Möbelkauf in Österreich Zölle an?", a: "Nein. Österreich und Deutschland gehören beide zum EU-Binnenmarkt, zwischen den beiden Ländern gibt es keine Zölle. Fragen zu Rechnung, Lieferung und Montage in Deutschland klären wir gerne persönlich mit Ihnen." },
      { q: "Liefern Sie auch nach Lindau?", a: "Sprechen Sie uns bitte direkt an. Wir klären Lieferung und Montage für Ihre Adresse und Ihr Projekt individuell." },
      { q: "Führen Sie auch Outdoor-Möbel?", a: "Ja. Neben Möbeln für Wohnräume finden Sie bei uns Outdoor-Möbel, Sonnenschirme und Accessoires für Terrasse, Balkon und Garten." },
      { q: "Wann hat der Showroom geöffnet?", a: "Dienstag bis Freitag von 10 bis 18 Uhr und Samstag von 10 bis 14 Uhr. Für eine ausführliche Beratung empfehlen wir einen Termin." },
      { q: "Was sollte ich zur Beratung mitbringen?", a: "Hilfreich sind die Maße Ihrer Räume oder Ihrer Terrasse, ein Grundriss und Fotos – so können wir Sie gezielt beraten." },
    ],
  },
};

export default async function DesignermoebelLindauPage({ params }) {
  const { locale } = await params;
  if (locale !== "de") notFound();
  return <LandingPage content={CONTENT} path={PATH} />;
}
