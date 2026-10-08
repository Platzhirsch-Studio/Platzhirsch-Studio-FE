// /de/designermoebel-friedrichshafen — local landing page (German only; other
// locales 404). Layout: src/components/Landing/landingPage.js.
// Indexable (see landingMetadata); JSON-LD WebPage + FAQPage via LandingPage.
import { notFound } from "next/navigation";
import LandingPage, { landingMetadata } from "@/components/Landing/landingPage";

const PATH = "/designermoebel-friedrichshafen";

export async function generateMetadata({ params }) {
  const { locale } = await params;
  if (locale !== "de") return {};
  return landingMetadata({
    path: PATH,
    title: "Designermöbel für Friedrichshafen",
    description:
      "Designermöbel, Leuchten und Wohnsysteme internationaler Marken – im Showroom in Lochau am Bodensee, rund 30 Kilometer von Friedrichshafen. Mit Beratung.",
  });
}

// Content is static German copy. Keep it general: delivery, invoicing and tax
// questions for customers from Germany are answered personally, not promised here.
const CONTENT = {
  inLanguage: "de-DE",
  banner: {
    image: "/Images/Licht/bannerImageLicht3.jpg",
    title: "Designermöbel für Friedrichshafen",
    alt: "Schwarzer Esstisch mit schwarzen Stühlen unter kugelförmigen Pendelleuchten",
    crumb: "Designermöbel Friedrichshafen",
  },
  intro: {
    eyebrow: "Am Ufer entlang nach Lochau",
    heading: "Ein Showroom für Ihr ganzes Zuhause",
    paragraphs: [
      "Von Friedrichshafen führt der Weg rund 30 Kilometer am Bodenseeufer entlang nach Lochau. In unserem Showroom finden Sie Möbel, Leuchten, Wohnsysteme und Accessoires internationaler Designmarken an einem Ort – für Wohnzimmer, Essbereich, Arbeitszimmer und Schlafzimmer.",
      "Ein Besuch lohnt sich besonders, wenn Sie mehrere Räume planen: Sie sehen Materialien und Farben nebeneinander, vergleichen Sitzkomfort und Proportionen und bekommen ein Gefühl dafür, wie Möbel, Licht und Stauraum zusammenwirken.",
    ],
    benefits: [
      "Möbel, Leuchten und Wohnsysteme an einem Ort",
      "Materialien und Oberflächen im Original vergleichen",
      "Persönliche Beratung – gerne mit Termin",
      "Showroom in Lochau am Bodensee",
    ],
    image: "/Images/Arbeiten/bannerImageArbeiten3.jpg",
    imageAlt: "Offenes Regal mit Büchern und Dekoration vor einer grauen Wand, davor eine schwarze Polsterbank",
  },
  brands: {
    eyebrow: "Marken im Showroom",
    heading: "Licht und Stauraum mit System",
    items: [
      {
        name: "Rimadesio",
        slug: "rimadesio",
        image: "/Images/Home/slider/rimadesio-wandsystem-wohnraum.webp",
        imageAlt: "Rimadesio Wandsystem mit Holzpaneelen, Regalen und Sideboard im Wohnraum",
        text: "Wandsysteme, Regale, Türen und Schränke aus Italien – mit Glas und Aluminium, präzise geplant für Ihre Raummaße.",
      },
      {
        name: "Flos",
        slug: "flos",
        image: "/Images/Home/slider/flos-stehleuchte-v3.webp",
        imageAlt: "Flos Stehleuchte mit runder Leuchtscheibe auf verchromtem Dreibein",
        text: "Italienische Leuchten – von Designklassikern bis zu zeitgenössischen Entwürfen für Wohn- und Essbereich.",
      },
    ],
    cta: { href: "/produkte", label: "Alle Produkte ansehen" },
  },
  steps: {
    eyebrow: "Ihr Besuch im Showroom",
    heading: "So holen Sie das Meiste aus Ihrem Termin",
    items: [
      { title: "Maße mitbringen", text: "Ein Grundriss oder die wichtigsten Raummaße – Länge, Breite, Fenster, Türen und Heizkörper – machen die Beratung konkret." },
      { title: "Fotos zeigen", text: "Fotos Ihrer Räume und der vorhandenen Einrichtung helfen, Farben, Materialien und Stil passend zu wählen." },
      { title: "Probesitzen", text: "Nehmen Sie sich Zeit für Sofas und Stühle: Sitzhöhe, Sitztiefe und Polsterung entscheiden über den Komfort im Alltag." },
      { title: "Licht mitdenken", text: "Planen Sie Leuchten früh mit ein – über dem Esstisch, neben dem Sofa und als Grundlicht für den Raum." },
    ],
  },
  gallery: [
    { src: "/Images/Licht/bannerImageLicht5.jpg", alt: "Kupferfarbene Pendelleuchten über einem Holztisch in einem Raum mit Schachbrettboden" },
    { src: "/Images/Arbeiten/bannerImageArbeiten2.jpg", alt: "Schreibtisch mit grünem Lederstuhl, Pendelleuchte und Garderobenständer" },
    { src: "/Images/Accessories/bannerImageAccessories1.jpg", alt: "Bauchige Keramikvase mit dunkelroten Zweigen neben kleinen Beistelltischen" },
  ],
  showroom: {
    heading: "Von Friedrichshafen nach Lochau",
    text: "Unser Showroom liegt in Lochau an der Landstraße, am östlichen Ufer des Bodensees und direkt an der Grenze zu Bayern. Kommen Sie vorbei – oder vereinbaren Sie einen Termin, damit wir uns ausreichend Zeit für Sie nehmen können.",
  },
  cta: {
    image: "/Images/Wohnen/bannerImage8.jpg",
    heading: "Planen Sie Ihren Besuch",
    text: "Vereinbaren Sie einen unverbindlichen Beratungstermin in unserem Showroom in Lochau am Bodensee.",
  },
  faq: {
    name: "friedrichshafen-faq",
    heading: "Fragen zu Designermöbeln für Friedrichshafen",
    items: [
      { q: "Wie weit ist Ihr Showroom von Friedrichshafen entfernt?", a: "Lochau liegt rund 30 Kilometer von Friedrichshafen entfernt, am östlichen Ufer des Bodensees. Der Showroom befindet sich in der Landstraße 9 in 6911 Lochau." },
      { q: "Fallen beim Möbelkauf in Österreich Zölle an?", a: "Nein. Österreich und Deutschland gehören beide zum EU-Binnenmarkt, zwischen den beiden Ländern gibt es keine Zölle. Fragen zu Rechnung, Lieferung und Montage in Deutschland klären wir gerne persönlich mit Ihnen." },
      { q: "Liefern Sie auch nach Friedrichshafen?", a: "Sprechen Sie uns bitte direkt an. Wir klären Lieferung und Montage für Ihre Adresse und Ihr Projekt individuell." },
      { q: "Brauche ich einen Termin?", a: "Sie können während der Öffnungszeiten jederzeit vorbeikommen. Für eine ausführliche Beratung – etwa für mehrere Räume – empfehlen wir einen Termin." },
      { q: "Wann hat der Showroom geöffnet?", a: "Dienstag bis Freitag von 10 bis 18 Uhr und Samstag von 10 bis 14 Uhr." },
      { q: "Beraten Sie auch zur Beleuchtung?", a: "Ja. Leuchten gehören zu unserem Sortiment – wir beraten Sie gerne zum passenden Licht für Wohn-, Ess- und Arbeitsbereich." },
    ],
  },
};

export default async function DesignermoebelFriedrichshafenPage({ params }) {
  const { locale } = await params;
  if (locale !== "de") notFound();
  return <LandingPage content={CONTENT} path={PATH} />;
}
