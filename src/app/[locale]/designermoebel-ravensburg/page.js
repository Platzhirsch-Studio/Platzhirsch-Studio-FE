// /de/designermoebel-ravensburg — local landing page (German only; other
// locales 404). Layout: src/components/Landing/landingPage.js.
// Robots via landingMetadata → regionRobots() (doorway audit, src/lib/seo/
// sitemap/doorwayAudit.js); JSON-LD WebPage + FAQPage via LandingPage.
import { notFound } from "next/navigation";
import LandingPage, { landingMetadata } from "@/components/Landing/landingPage";
import RegionLinks from "@/app/[locale]/regionen/RegionLinks";

const PATH = "/designermoebel-ravensburg";

export async function generateMetadata({ params }) {
  const { locale } = await params;
  if (locale !== "de") return {};
  return landingMetadata({
    path: PATH,
    title: "Möbel & Designermöbel für Ravensburg",
    description:
      "Designermöbel für Ravensburg und Oberschwaben – Poliform und ClassiCon in der Ausstellung in Lochau am Bodensee, rund 35 bis 45 Minuten entfernt.",
  });
}

// Content is static German copy. Facts and sources (Marktresearch):
// drive time ~35–45 min (02, section 3); pickup in Lochau = Austrian VAT,
// delivery to Germany follows the EU distance-selling rules, kitchens with
// installation in Germany are a separate case (18, section 5) — the page
// names the rules, never a rate for a concrete purchase; that is answered
// personally. Café Lounge next to the showroom (01).
const CONTENT = {
  // Runde 2 (P3): Termin-Knöpfe mit Kontext (ux P1-1) und der Kern-USP als
  // kurzer Abschnitt mit eigenem Satz (gesamtwerk P1-4, Durchdringungsplan §5).
  ort: "ravensburg",
  processText:
    "Wir kommen zu Ihnen nach Ravensburg, sehen uns Licht und Räume an, und Harald Menghin zeichnet Ihr Konzept von Hand. Für Häuser im Umland nehmen wir Grundriss und Tageslicht genau auf. Danach planen wir in 3D, und Sie sehen Ihren Raum fotorealistisch, bevor etwas bestellt wird.",
  inLanguage: "de-DE",
  banner: {
    image: "/Images/Licht/bannerImageLicht1.jpg",
    title: "Designermöbel für Ravensburg",
    alt: "Essbereich mit Kronleuchter, Bücherregal und Blick in den Garten",
    crumb: "Designermöbel Ravensburg",
    trail: [{ label: "Regionen", href: "/regionen" }], // Rat 9,5 B15: Regionen-Hub als Elternseite
  },
  intro: {
    eyebrow: "Für Ravensburg und Oberschwaben",
    heading: "Vom Schussental an den Bodensee",
    paragraphs: [
      "Von Ravensburg sind Sie in rund 35 bis 45 Minuten bei uns in Lochau – direkt hinter der Grenze bei Lindau. In unserer Ausstellung finden Sie Möbel, Küchen, Leuchten und Accessoires internationaler Designmarken für das ganze Haus.",
      "Wer in Oberschwaben baut, umbaut oder ein Haus neu einrichtet, plant meist mehrere Räume auf einmal: Küche und Essbereich, Wohnzimmer, Schlafzimmer und Ankleide. Bei uns sehen Sie diese Bereiche im Zusammenhang und besprechen mit uns, wie Materialien, Stauraum und Licht von Raum zu Raum zusammenpassen.",
    ],
    benefits: [
      "Poliform und ClassiCon in der Ausstellung erleben",
      "Küche, Wohnen und Schlafen aus einer Hand planen",
      "Rund 35 bis 45 Minuten von Ravensburg",
      "Persönliche Beratung – gerne mit Termin",
    ],
    image: "/Images/Home/Poliform-Kitchen.jpg",
    imageAlt: "Offene Küche mit Nussholz-Kochinsel und Esstisch",
  },
  brands: {
    eyebrow: "Marken in der Ausstellung",
    heading: "Für das ganze Haus geplant",
    items: [
      {
        name: "Poliform",
        slug: "poliform",
        image: "/Images/Home/slider/poliform-kueche-kochinsel.webp",
        imageAlt: "Poliform Küche mit Kochinsel, Esstisch aus Holz und Wandregal",
        text: "Küchen, Kleiderschränke, Betten und Wohnsysteme aus Italien – in einer gemeinsamen, ruhigen Designsprache. Ideal, wenn Sie beim Neubau oder Umbau mehrere Räume aufeinander abstimmen möchten.",
      },
      {
        name: "ClassiCon",
        slug: "classicon",
        image: "/Images/Home/slider/classicon-bell-beistelltische.webp",
        imageAlt: "ClassiCon Bell Beistelltische mit farbigen Glasfüßen",
        text: "Möbel und Leuchten aus München – Klassiker der Moderne und zeitgenössische Entwürfe. Einzelstücke, die einem Raum Charakter geben, ob im Wohnzimmer, im Essbereich oder im Flur.",
      },
    ],
    cta: { href: "/produkte", label: "Alle Produkte ansehen" },
  },
  steps: {
    eyebrow: "Bauen und Einrichten",
    heading: "So planen Sie Ihr Haus mit uns",
    items: [
      { title: "Früh anfangen", text: "Kommen Sie am besten schon mit den Bauplänen. Küche, Einbauschränke und Ankleide lassen sich dann auf Wände, Fenster und Anschlüsse abstimmen." },
      { title: "Räume zusammendenken", text: "Wenn Küche, Essbereich und Wohnzimmer offen ineinander übergehen, sollten Fronten, Holztöne und Stoffe zueinander passen." },
      { title: "Licht mitplanen", text: "Pendelleuchten über Kochinsel und Esstisch brauchen Anschlüsse an der richtigen Stelle – das gehört in die Planung, bevor die Decke geschlossen wird." },
      { title: "Lieferung früh klären", text: "Für Lieferung und Montage in Deutschland, vor allem bei Küchen und Einbauten, sprechen wir Ablauf und Rechnung gleich zu Beginn mit Ihnen ab." },
    ],
  },
  gallery: [
    { src: "/Images/Kuche/bannerImageKuche1.jpg", alt: "Küche mit weißer Kochinsel und dunklen Hochschränken" },
    { src: "/Images/Wohnen/bannerImage3.jpg", alt: "Esszimmer mit Holztisch, Polsterstühlen und Sideboard" },
    { src: "/Images/Licht/bannerImageLicht4.jpg", alt: "Esstisch mit goldenen Pendelleuchten vor einer Holzwand" },
  ],
  showroom: {
    heading: "Von Ravensburg nach Lochau",
    text: "Unser Showroom liegt in Lochau an der Landstraße, direkt hinter der Grenze bei Lindau. Mit dem Auto sind Sie von Ravensburg in rund 35 bis 45 Minuten bei uns. Mit der Bahn geht es über Friedrichshafen und Lindau nach Lochau. Vereinbaren Sie gerne einen Termin für eine ausführliche Beratung.",
  },
  cta: {
    image: "/Images/Wohnen/bannerImage7.jpg",
    heading: "Planen Sie Ihr Zuhause mit uns",
    text: "Vereinbaren Sie einen unverbindlichen Beratungstermin in Lochau – mit Ihren Plänen, Maßen und Ideen aus Ravensburg und Oberschwaben.",
  },
  faq: {
    name: "ravensburg-faq",
    heading: "Fragen zu Designermöbeln für Ravensburg",
    items: [
      { q: "Wie weit ist Ihr Showroom von Ravensburg entfernt?", a: "Mit dem Auto sind es rund 35 bis 45 Minuten. Lochau liegt direkt hinter der Grenze bei Lindau, der Showroom befindet sich in der Landstraße 11 in 6911 Lochau." },
      { q: "Fallen beim Möbelkauf in Österreich Zölle an?", a: "Nein. Österreich und Deutschland gehören beide zum EU-Binnenmarkt, zwischen den beiden Ländern gibt es keine Zölle." },
      { q: "Welche Umsatzsteuer gilt für Kunden aus Deutschland?", a: "Holen Sie Ihre Möbel selbst in Lochau ab, gilt die österreichische Umsatzsteuer. Liefern wir nach Deutschland, gelten die EU-Regeln für Fernverkäufe. Welcher Satz für Ihren Kauf gilt, klären wir persönlich, bevor Sie ein Angebot erhalten." },
      { q: "Planen Sie auch Küchen für Häuser in Oberschwaben?", a: "Wir beraten Sie gerne zu Küchen und zeigen Ihnen in der Ausstellung Möglichkeiten für Ihr Projekt. Für eine Küche mit Montage in Deutschland gelten andere steuerliche Regeln als für lose Möbel – Lieferung, Montage und Rechnung klären wir deshalb persönlich und vor dem Angebot." },
      { q: "Liefern Sie auch nach Ravensburg?", a: "Sprechen Sie uns bitte direkt an. Wir klären Lieferung und Montage für Ihre Adresse und Ihr Projekt individuell." },
      { q: "Wann hat der Showroom geöffnet?", a: "Dienstag bis Freitag von 10 bis 18 Uhr und Samstag von 10 bis 14 Uhr. Für eine ausführliche Beratung – etwa für ein ganzes Haus – empfehlen wir einen Termin." },
      { q: "Kann ich mit den Plänen meines Architekten kommen?", a: "Ja, gerne. Baupläne, Grundrisse und Ansichten helfen uns, Küche, Einbauschränke und Möbel auf Ihre Räume abzustimmen. Fotos und Maße reichen für ein erstes Gespräch aber auch." },
    ],
  },
};

export default async function DesignermoebelRavensburgPage({ params }) {
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
