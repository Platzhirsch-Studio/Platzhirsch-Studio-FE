// /de/designermoebel-friedrichshafen — local landing page (German only; other
// locales 404). Layout: src/components/Landing/landingPage.js.
// Robots via landingMetadata → regionRobots() (doorway audit, src/lib/seo/
// sitemap/doorwayAudit.js); JSON-LD WebPage + FAQPage via LandingPage.
import { notFound } from "next/navigation";
import LandingPage, { landingMetadata } from "@/components/Landing/landingPage";
import RegionLinks from "@/app/[locale]/regionen/RegionLinks";
import OrtsMarken from "@/components/Landing/OrtsMarken";

const PATH = "/designermoebel-friedrichshafen";

export async function generateMetadata({ params }) {
  const { locale } = await params;
  if (locale !== "de") return {};
  return landingMetadata({
    path: PATH,
    title: "Möbel & Designermöbel für Friedrichshafen",
    description:
      "Designermöbel für Friedrichshafen: Showroom in Lochau, rund 30 km am Nordufer über Lindau, auch mit der Bahn. Rimadesio und Flos in der Ausstellung.",
  });
}

// Content is static German copy. Delivery, invoicing and tax for customers
// from Germany: only the general rules (same wording as the Konstanz page),
// the rate for a concrete purchase is answered personally.
// Own facts (doorway audit, src/lib/seo/sitemap/doorwayAudit.js REGION_FACTS,
// Runde 3 P5, 28.10.2026) and their sources – nothing else is stated:
//   1. Drive time ~35–45 min, ~30 km (Marktresearch/02-marktanalyse.md §3;
//      digital/09-local-seo-reputation.md: 25–30 km).
//   2. Road: along the northern shore (B31) via Langenargen, Kressbronn and
//      Lindau, no motorway on the German side.
//   3. Train: Bodenseegürtelbahn Friedrichshafen–Lindau, then on towards
//      Bregenz (Lochau lies on that line).
//   4. Places of the catchment (Fischbach, Manzell, Ailingen, Immenstaad,
//      Langenargen, Kressbronn) – geography only, no project, no reference.
//   The tax FAQ is shared with Konstanz/Lindau and does not count.
// No prices, no references, no projects.
const CONTENT = {
  // Runde 2 (P3): Termin-Knöpfe mit Kontext (ux P1-1) und der Kern-USP als
  // kurzer Abschnitt mit eigenem Satz (gesamtwerk P1-4, Durchdringungsplan §5).
  ort: "friedrichshafen",
  processText:
    "Wir kommen zu Ihnen nach Friedrichshafen, sehen uns Licht und Räume an, und Harald Menghin zeichnet Ihr Konzept von Hand. Ein Termin vor Ort lässt sich mit dem Weg über Lindau verbinden. Danach planen wir in 3D, und Sie sehen Ihren Raum fotorealistisch, bevor etwas bestellt wird.",
  inLanguage: "de-DE",
  // Hero: typographic (imagery.js, released: false) – no photo with a
  // documented release.
  banner: {
    image: "/Images/Licht/bannerImageLicht3.jpg",
    title: "Designermöbel und Einrichtung für Friedrichshafen",
    lead: "Von Friedrichshafen sind es rund 30 Kilometer am Nordufer entlang über Lindau nach Lochau. Mit dem Auto rechnen Sie mit 35 bis 45 Minuten.",
    alt: "Schwarzer Esstisch mit schwarzen Stühlen unter kugelförmigen Pendelleuchten",
    crumb: "Designermöbel Friedrichshafen",
    trail: [{ label: "Regionen", href: "/regionen" }], // Rat 9,5 B15: Regionen-Hub als Elternseite
  },
  facts: [
    { label: "Fahrzeit ab Friedrichshafen", value: "35 bis 45 Minuten, rund 30 Kilometer" },
    { label: "Mit dem Auto", value: "Am Nordufer über Kressbronn und Lindau" },
    { label: "Mit dem Zug", value: "Bodenseegürtelbahn bis Lindau, weiter Richtung Bregenz" },
  ],
  intro: {
    eyebrow: "Am Ufer entlang nach Lochau",
    heading: "Ein Showroom für Ihr ganzes Zuhause",
    paragraphs: [
      "Von Friedrichshafen führt der Weg rund 30 Kilometer am Nordufer entlang über Langenargen, Kressbronn und Lindau nach Lochau – ob Sie aus Fischbach, Manzell, Ailingen oder Immenstaad kommen. In unserem Showroom finden Sie Möbel, Leuchten, Wohnsysteme und Accessoires internationaler Designmarken an einem Ort – für Wohnzimmer, Essbereich, Arbeitszimmer und Schlafzimmer.",
      "Ein Besuch lohnt sich besonders, wenn Sie mehrere Räume planen: Sie sehen Materialien und Farben nebeneinander, vergleichen Sitzkomfort und Proportionen und bekommen ein Gefühl dafür, wie Möbel, Licht und Stauraum zusammenwirken.",
    ],
    benefits: [
      "Möbel, Leuchten und Wohnsysteme an einem Ort",
      "Materialien und Oberflächen im Original vergleichen",
      "Mit Auto oder Bodenseegürtelbahn über Lindau",
      "Persönliche Beratung – gerne mit Termin",
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
    text: "Unser Showroom liegt in Lochau an der Landstraße 11, direkt hinter der Grenze bei Lindau. Mit dem Auto fahren Sie am Nordufer entlang, mit dem Zug nehmen Sie die Bodenseegürtelbahn bis Lindau. Kommen Sie vorbei – oder fragen Sie einen Termin an, damit wir uns ausreichend Zeit für Sie nehmen können.",
  },
  cta: {
    image: "/Images/Wohnen/bannerImage8.jpg",
    heading: "Planen Sie Ihren Besuch",
    text: "Fragen Sie einen unverbindlichen Beratungstermin in unserem Showroom in Lochau am Bodensee an.",
  },
  faq: {
    name: "friedrichshafen-faq",
    heading: "Fragen zu Designermöbeln für Friedrichshafen",
    items: [
      { q: "Wie weit ist Ihr Showroom von Friedrichshafen entfernt?", a: "Rund 30 Kilometer am Nordufer entlang über Kressbronn und Lindau, je nach Verkehr 35 bis 45 Minuten. Der Showroom befindet sich in der Landstraße 11 in 6911 Lochau." },
      { q: "Kann ich mit dem Zug kommen?", a: "Ja. Die Bodenseegürtelbahn fährt von Friedrichshafen nach Lindau, von dort geht es weiter Richtung Bregenz. Lochau liegt an dieser Strecke." },
      { q: "Fallen beim Möbelkauf in Österreich Zölle an?", a: "Nein. Österreich und Deutschland gehören beide zum EU-Binnenmarkt, zwischen den beiden Ländern gibt es keine Zölle." },
      { q: "Welche Umsatzsteuer gilt für Kunden aus Friedrichshafen?", a: "Holen Sie Ihre Möbel selbst in Lochau ab, gilt die österreichische Umsatzsteuer. Liefern wir nach Deutschland, gelten die EU-Regeln für Fernverkäufe; für Einbauten mit Montage gelten eigene Regeln. Welcher Satz für Ihren Kauf gilt, klären wir persönlich, bevor Sie ein Angebot erhalten." },
      { q: "Liefern Sie auch nach Friedrichshafen?", a: "Sprechen Sie uns bitte direkt an. Lieferung und Montage klären wir auf Anfrage für Ihre Adresse und Ihr Projekt." },
      { q: "Wann hat der Showroom geöffnet?", a: "Dienstag bis Freitag von 10 bis 18 Uhr und Samstag von 10 bis 14 Uhr. Für eine ausführliche Beratung – etwa für mehrere Räume – empfehlen wir einen Termin." },
      { q: "Beraten Sie auch zur Beleuchtung?", a: "Ja. Leuchten gehören zu unserem Sortiment – wir beraten Sie gerne zum passenden Licht für Wohn-, Ess- und Arbeitsbereich." },
    ],
  },
};

export default async function DesignermoebelFriedrichshafenPage({ params }) {
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
