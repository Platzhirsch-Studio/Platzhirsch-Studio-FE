// /de/designermoebel-bregenz — local landing page (German only; other
// locales 404). Layout: src/components/Landing/landingPage.js.
// Robots via landingMetadata → regionRobots() (doorway audit, src/lib/seo/
// sitemap/doorwayAudit.js); JSON-LD WebPage + FAQPage via LandingPage.
import { notFound } from "next/navigation";
import LandingPage, { landingMetadata } from "@/components/Landing/landingPage";
import RegionLinks from "@/app/[locale]/regionen/RegionLinks";
import OrtsMarken from "@/components/Landing/OrtsMarken";
import OwnImageJsonLd from "@/components/Reusable/OwnImageJsonLd";
import { imageOverrides } from "@/components/Landing/imagery";

const PATH = "/designermoebel-bregenz";

export async function generateMetadata({ params }) {
  const { locale } = await params;
  if (locale !== "de") return {};
  return landingMetadata({
    path: PATH,
    // Lokal-SEO (31.10.2026): Suchbegriff „Möbel & Einrichtung“; kurz genug für
    // den vollen Suffix (≤ 60, r3-landing), Lochau steht in H1 und Description.
    title: "Möbel & Einrichtung für Bregenz",
    description:
      "Möbel und Designermöbel rund 5 Minuten von Bregenz: Showroom mit Minotti Studio in Lochau. Aufmaß vor Ort, Lieferung und Montage auf Wunsch.",
  });
}

// Content is static German copy; keep facts (address, hours, brands) in sync with the footer/CMS.
// Own facts (doorway audit, src/lib/seo/sitemap/doorwayAudit.js REGION_FACTS,
// Runde 3 P5, 28.10.2026) and their sources – nothing else is stated:
//   1. Drive time ~5 min, 0–4 km (Marktresearch/02-marktanalyse.md §3,
//      digital/09-local-seo-reputation.md Einzugsgebiet).
//   2. Route: by car towards Lindau, by bike on the Bodensee-Radweg along the
//      shore (Lochau lies on the lakeside route Bregenz–Lindau).
//   3. Delivery and installation "auf Wunsch" (Inhaber-Entscheidung Nr. 3),
//      measuring and the look at the light at your home (Nr. 8: "vor Ort").
//   4. Districts and living situations of Bregenz (Innenstadt, Vorkloster,
//      Rieden, Fluh, Pfänderhang) – geography only, no project, no reference.
// No prices, no references, no projects.
const CONTENT = {
  // Runde 2 (P3): Termin-Knöpfe mit Kontext (ux P1-1) und der Kern-USP als
  // kurzer Abschnitt mit eigenem Satz (gesamtwerk P1-4, Durchdringungsplan §5).
  ort: "bregenz",
  processText:
    "Wir kommen zu Ihnen nach Bregenz, sehen uns Licht und Räume an, und Harald Menghin zeichnet Ihr Konzept von Hand. Mit Blick auf See und Pfänder planen wir das Licht mit. Danach planen wir in 3D, und Sie sehen Ihren Raum fotorealistisch, bevor etwas bestellt wird.",
  // Hero: typographic (imagery.js, released: false) – the former photo is the
  // homepage hero (gesamtwerk P1); no city photo with a documented release.
  banner: {
    image: "/Images/Home/aboutHome.jpg",
    title: "Möbel & Einrichtung für Bregenz – Showroom in Lochau",
    lead: "Unser Showroom liegt in Lochau, rund 5 Minuten vom Bregenzer Zentrum. Für Aufmaß und Licht kommen wir zu Ihnen, Lieferung und Montage gibt es auf Wunsch.",
    alt: "Showroom von Platzhirsch Home Living in Lochau bei Bregenz",
    crumb: "Designermöbel Bregenz",
    trail: [{ label: "Regionen", href: "/regionen" }], // Rat 9,5 B15: Regionen-Hub als Elternseite
  },
  facts: [
    { label: "Fahrzeit ab Bregenz", value: "Rund 5 Minuten mit dem Auto" },
    { label: "Mit dem Rad", value: "Über den Bodensee-Radweg am Ufer entlang" },
    { label: "Lieferung und Montage", value: "Auf Wunsch, Aufmaß bei Ihnen zu Hause" },
  ],
  intro: {
    eyebrow: "Rund 5 Minuten von Bregenz",
    heading: "Ihr Showroom für Designermöbel vor den Toren von Bregenz",
    paragraphs: [
      "Platzhirsch Home Living liegt in Lochau an der Landstraße. Aus dem Bregenzer Zentrum fahren Sie rund 5 Minuten Richtung Lindau, mit dem Rad kommen Sie über den Bodensee-Radweg am Ufer entlang. In unserem Showroom erleben Sie Möbel, Leuchten und Accessoires internationaler Designmarken in echten Wohnsituationen.",
      "Ob Stadtwohnung in der Innenstadt oder in Vorkloster, Haus in Rieden, in Fluh oder am Pfänderhang: Die Räume in Bregenz sind sehr verschieden. Weil der Weg kurz ist, sehen wir uns Ihre Räume, das Licht und den Zugang gern bei Ihnen an, bevor wir planen.",
    ],
    benefits: [
      "Showroom rund 5 Minuten vom Bregenzer Zentrum",
      "Aufmaß und Lichtplanung bei Ihnen zu Hause",
      "Persönliche Einrichtungsberatung",
      "Lieferung und Montage auf Wunsch",
    ],
    image: "/Images/Home/secondAboutHome.jpg",
    imageAlt: "Sofas, Sessel und Couchtische im Showroom in Lochau",
  },
  brands: {
    eyebrow: "Marken im Showroom",
    heading: "Internationale Designmarken, persönlich beraten",
    items: [
      {
        name: "Minotti",
        slug: "minotti",
        image: "/Images/Home/slider/minotti-sofa-wohnzimmer.webp",
        imageAlt: "Minotti Ecksofa in Weiß in einem Wohnzimmer mit dunkler Holzwand",
        text: "Italienische Sofas, Sessel und Tische mit feinen Materialien und großzügigen Proportionen – für Wohnräume mit ruhiger, eleganter Ausstrahlung.",
      },
      {
        name: "Poliform",
        slug: "poliform",
        image: "/Images/Home/slider/poliform-schlafzimmer-bett.webp",
        imageAlt: "Poliform Polsterbett mit hohem Kopfteil in einem Schlafzimmer mit Holzwand",
        text: "Wohnen, Schlafen und Kochen in einer Designsprache – von Betten und Kleiderschränken bis zu Sofas, Wohnwänden und Küchen.",
      },
    ],
    cta: { href: "/produkte", label: "Alle Produkte ansehen" },
  },
  steps: {
    eyebrow: "Kurzer Weg, Planung vor Ort",
    heading: "Vom Showroom in Lochau zu Ihnen nach Bregenz",
    items: [
      { title: "Showroom besuchen", text: "Kommen Sie nach Lochau und erleben Sie Möbel, Stoffe und Oberflächen im Original – am besten mit Termin." },
      { title: "Aufmaß bei Ihnen", text: "Wir sehen uns Ihre Räume in Bregenz an: Maße, Fenster, Licht und den Weg, den die Möbel ins Haus nehmen." },
      { title: "Auswahl & Planung", text: "Sie wählen Modelle, Materialien und Farben – wir planen Maße und Anordnung für Ihren Raum." },
      { title: "Lieferung & Montage", text: "Auf Wunsch liefern und montieren wir bei Ihnen zu Hause, damit alles so steht, wie es geplant war." },
    ],
  },
  gallery: [
    { src: "/Images/Wohnen/bannerImage2.jpg", alt: "Runder Esstisch mit Designerstuhl und Ringleuchte" },
    { src: "/Images/Wohnen/bannerImage3.jpg", alt: "Esszimmer mit Holztisch, Polsterstühlen und Sideboard" },
    { src: "/Images/Licht/bannerImageLicht4.jpg", alt: "Esstisch mit goldenen Pendelleuchten vor einer Holzwand" },
  ],
  showroom: {
    heading: "Von Bregenz in rund 5 Minuten bei uns",
    text: "Unser Showroom liegt in Lochau an der Landstraße 11. Aus Bregenz fahren Sie Richtung Lindau, mit dem Rad nehmen Sie den Bodensee-Radweg am Ufer. Kommen Sie vorbei – oder fragen Sie einen Termin für eine ausführliche Beratung an.",
  },
  cta: {
    image: "/Images/Wohnen/bannerImage5.jpg",
    heading: "Besuchen Sie uns in Lochau",
    text: "Fragen Sie einen unverbindlichen Beratungstermin an – rund 5 Minuten von Bregenz entfernt.",
  },
  faq: {
    name: "bregenz-faq",
    heading: "Fragen zu Designermöbeln in Bregenz",
    items: [
      { q: "Wo genau liegt Ihr Showroom?", a: "In der Landstraße 11 in 6911 Lochau. Aus dem Bregenzer Zentrum sind es rund 5 Minuten mit dem Auto Richtung Lindau." },
      { q: "Kann ich mit dem Rad kommen?", a: "Ja. Lochau liegt am Bodensee-Radweg zwischen Bregenz und Lindau. Der Showroom selbst liegt an der Landstraße 11." },
      { q: "Kommen Sie für die Planung zu mir nach Hause?", a: "Ja. Für Aufmaß, Licht und Zugang sehen wir uns Ihre Räume in Bregenz gern vor Ort an – den Termin stimmen wir mit Ihnen ab." },
      { q: "Liefern und montieren Sie in Bregenz?", a: "Ja. Lieferung und Montage in Bregenz gibt es auf Wunsch, auch außerhalb Vorarlbergs auf Anfrage." },
      { q: "Wann hat der Showroom geöffnet?", a: "Dienstag bis Freitag von 10 bis 18 Uhr und Samstag von 10 bis 14 Uhr. Für eine ausführliche Beratung empfehlen wir einen Termin." },
      { q: "Welche Marken finde ich bei Ihnen?", a: "Unter anderem Minotti, Poliform, Rimadesio, Flos und ClassiCon sowie weitere internationale Designmarken für Möbel, Leuchten und Accessoires." },
      { q: "Was sollte ich zur Beratung mitbringen?", a: "Hilfreich sind die Maße Ihrer Räume oder ein Grundriss, Fotos der aktuellen Einrichtung und – falls vorhanden – Bilder, die Ihnen gefallen." },
    ],
  },
};

export default async function DesignermoebelBregenzPage({ params }) {
  const { locale } = await params;
  if (locale !== "de") notFound();
  return (
    <>
      {/* QM R3: Vertragshändler-Block vor dem Abschluss-CTA statt danach. */}
      <LandingPage content={CONTENT} path={PATH} beforeClosing={<OrtsMarken path={PATH} />} />
      {/* Bilder-SEO: Bildnachweis für das eigene Intro-Foto (src/lib/seo/imageRights.js). */}
      <OwnImageJsonLd images={[imageOverrides(PATH).intro].filter(Boolean)} />
      {/* Rat 9,5 B15: Nachbarorte, Ratgeber, Küche, Hotel & Objekt, Regionen-Hub */}
      <RegionLinks path={PATH} />
    </>
  );
}
