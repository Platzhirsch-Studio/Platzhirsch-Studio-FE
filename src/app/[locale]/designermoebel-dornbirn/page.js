// /de/designermoebel-dornbirn — local landing page (German only; other
// locales 404). Layout: src/components/Landing/landingPage.js.
// Robots via landingMetadata → regionRobots() (doorway audit, src/lib/seo/
// sitemap/doorwayAudit.js); JSON-LD WebPage + FAQPage via LandingPage.
import { notFound } from "next/navigation";
import LandingPage, { landingMetadata } from "@/components/Landing/landingPage";
import RegionLinks from "@/app/[locale]/regionen/RegionLinks";
import OrtsMarken from "@/components/Landing/OrtsMarken";

const PATH = "/designermoebel-dornbirn";

export async function generateMetadata({ params }) {
  const { locale } = await params;
  if (locale !== "de") return {};
  return landingMetadata({
    path: PATH,
    title: "Möbel & Designermöbel für Dornbirn",
    description:
      "Küche, Wohnen und Licht für Dornbirn: Showroom in Lochau, rund 20 Minuten über die A14. Planung ab dem Rohbau, Lieferung und Montage auf Wunsch.",
  });
}

// Content is static German copy; keep facts (address, hours, brands, delivery
// area) in sync with the footer/CMS and the other landing pages.
// Own facts (doorway audit, src/lib/seo/sitemap/doorwayAudit.js REGION_FACTS,
// Runde 3 P5, 28.10.2026) and their sources – nothing else is stated:
//   1. Drive time ~20 min, ~15 km (Marktresearch/02-marktanalyse.md §3,
//      digital/09-local-seo-reputation.md Einzugsgebiet).
//   2. Route: Rheintalautobahn A14 towards Bregenz, by train via Bregenz
//      (same rail line as Feldkirch, page designermoebel-feldkirch).
//   3. Planning order for new builds (kitchen and fittings in the shell
//      phase, connections and light) – the page's own steps.
//   4. Districts of Dornbirn (Hatlerdorf, Oberdorf, Haselstauden, Rohrbach)
//      – geography only, no project, no reference.
//   Tom Dixon is named only on this page (R1-seo audit).
// Delivery and installation "auf Wunsch" (Inhaber-Entscheidung Nr. 3).
const CONTENT = {
  // Runde 2 (P3): Termin-Knöpfe mit Kontext (ux P1-1) und der Kern-USP als
  // kurzer Abschnitt mit eigenem Satz (gesamtwerk P1-4, Durchdringungsplan §5).
  ort: "dornbirn",
  processText:
    "Wir kommen zu Ihnen nach Dornbirn, sehen uns Licht und Räume an, und Harald Menghin zeichnet Ihr Konzept von Hand. Für Neubauten gern schon zum Rohbau. Danach planen wir in 3D, und Sie sehen Ihren Raum fotorealistisch, bevor etwas bestellt wird.",
  // Hero: typographic (imagery.js, released: false) – the former hero was a
  // manufacturer press photo without a documented release.
  banner: {
    image: "/Images/Home/slider/poliform-kueche-kochinsel.webp",
    title: "Designermöbel und Einrichtung für Dornbirn",
    lead: "Von Dornbirn nach Lochau sind es rund 20 Minuten über die A14. Wir planen Küche, Wohnen und Licht zusammen – bei einem Neubau am besten schon zum Rohbau.",
    alt: "Poliform Küche mit Kochinsel, Esstisch aus Holz und Wandregal",
    crumb: "Designermöbel Dornbirn",
    trail: [{ label: "Regionen", href: "/regionen" }], // Rat 9,5 B15: Regionen-Hub als Elternseite
  },
  facts: [
    { label: "Fahrzeit ab Dornbirn", value: "Rund 20 Minuten über die A14" },
    { label: "Mit dem Zug", value: "Über Bregenz, von dort wenige Minuten" },
    { label: "Lieferung und Montage", value: "Auf Wunsch, auch außerhalb Vorarlbergs auf Anfrage" },
  ],
  intro: {
    eyebrow: "Für Dornbirn und das Rheintal",
    heading: "Einrichten aus einer Hand – von der Küche bis zum Wohnzimmer",
    paragraphs: [
      "Ob Neubau im Hatlerdorf, Umbau in Haselstauden oder neue Wohnung im Oberdorf oder in Rohrbach: Wer mehrere Räume gleichzeitig einrichtet, profitiert von einer Planung aus einer Hand. In unserem Showroom in Lochau finden Sie Küchen, Möbel, Leuchten und Accessoires internationaler Designmarken an einem Ort.",
      "Von Dornbirn fahren Sie rund 20 Minuten über die Rheintalautobahn A14 Richtung Bregenz und weiter nach Lochau. Wir besprechen Ihre Pläne, Ihren Stil und Ihren Alltag und stimmen Küche, Wohnbereich und Licht aufeinander ab – damit Materialien, Farben und Proportionen im ganzen Zuhause zusammenpassen.",
    ],
    benefits: [
      "Küche, Wohnen und Licht aus einer Hand",
      "Planung ab dem Rohbau",
      "Lieferung und Montage auf Wunsch",
      "Rund 20 Minuten von Dornbirn",
    ],
    image: "/Images/UberUns/indoor.jpg",
    imageAlt: "Helle Küche mit Kochinsel aus Holz, schwarzen Pendelleuchten und Barhockern",
  },
  brands: {
    eyebrow: "Marken im Showroom",
    heading: "Küche, Wohnen und Licht",
    items: [
      {
        name: "Poliform",
        slug: "poliform",
        image: "/Images/Home/slider/poliform-schlafzimmer-bett.webp",
        imageAlt: "Poliform Polsterbett mit hohem Kopfteil in einem Schlafzimmer mit Holzwand",
        text: "Küchen, Kleiderschränke, Betten und Sofas aus Italien – für ein Zuhause in einer durchgängigen Designsprache.",
      },
      {
        name: "Tom Dixon",
        slug: "tom-dixon",
        image: "/Images/UberUns/tomdixon.webp",
        imageAlt: "Esstisch aus Holz mit Holzstühlen vor einer großen Fensterfront",
        text: "Leuchten, Möbel und Accessoires aus London – markante Formen und Materialien wie Messing, Kupfer und Holz. Gut für offene Wohnküchen, in denen das Licht über dem Tisch den Raum prägt.",
      },
    ],
    cta: { href: "/produkte", label: "Alle Produkte ansehen" },
  },
  steps: {
    eyebrow: "Neubau oder Umbau",
    heading: "Wann Sie mit der Einrichtung beginnen sollten",
    items: [
      { title: "Früh planen", text: "Küche und Einbauten am besten schon in der Rohbauphase planen – dann passen Anschlüsse, Steckdosen und Licht genau." },
      { title: "Grundriss nutzen", text: "Mit dem Grundriss lassen sich Laufwege, Sitzbereiche und Stellflächen planen, bevor die ersten Möbel bestellt werden." },
      { title: "Lieferzeiten bedenken", text: "Hochwertige Möbel werden häufig auf Bestellung gefertigt. Planen Sie dafür ausreichend Zeit vor dem Einzug ein." },
      { title: "Lieferung & Montage", text: "Auf Wunsch liefern und montieren wir bei Ihnen zu Hause, damit alles so steht, wie es geplant war." },
    ],
  },
  gallery: [
    { src: "/Images/Kuche/bannerImageKuche2.jpg", alt: "Küche mit grauer Kochinsel, Holzwand und Esstisch unter Oberlichtern" },
    { src: "/Images/Home/slider/classicon-bell-beistelltische.webp", alt: "ClassiCon Bell Beistelltische mit farbigen Glasfüßen" },
    { src: "/Images/Wohnen/bannerImage7.jpg", alt: "Wohnzimmer mit Kamin, Sesseln und rundem Teppich" },
  ],
  showroom: {
    heading: "Von Dornbirn zu uns nach Lochau",
    text: "Unser Showroom liegt in Lochau an der Landstraße 11, nördlich von Bregenz am Bodensee. Mit dem Auto fahren Sie rund 20 Minuten über die A14, mit dem Zug über Bregenz. Kommen Sie vorbei – oder fragen Sie einen Termin für eine ausführliche Beratung zu Ihrem Projekt an.",
  },
  cta: {
    image: "/Images/Wohnen/bannerImage6.jpg",
    heading: "Ihr Projekt in Dornbirn",
    text: "Fragen Sie einen unverbindlichen Beratungstermin an – gerne mit Grundriss und ersten Ideen.",
  },
  faq: {
    name: "dornbirn-faq",
    heading: "Fragen zu Designermöbeln für Dornbirn",
    items: [
      { q: "Wie lange fahre ich von Dornbirn nach Lochau?", a: "Rund 20 Minuten über die Rheintalautobahn A14 Richtung Bregenz. Mit dem Zug fahren Sie über Bregenz, von dort sind es nur wenige Minuten. Der Showroom liegt in der Landstraße 11 in 6911 Lochau." },
      { q: "Liefern und montieren Sie in Dornbirn?", a: "Ja. Lieferung und Montage in Dornbirn gibt es auf Wunsch, auch außerhalb Vorarlbergs auf Anfrage." },
      { q: "Planen Sie auch Küchen?", a: "Ja. Wir beraten Sie zu Küchen internationaler Marken und stimmen die Küche auf Wohn- und Essbereich ab." },
      { q: "Wann sollte ich bei einem Neubau mit der Planung beginnen?", a: "Am besten, sobald der Grundriss feststeht. Dann lassen sich Küche, Einbauten, Anschlüsse und Licht rechtzeitig abstimmen." },
      { q: "Wann hat der Showroom geöffnet?", a: "Dienstag bis Freitag von 10 bis 18 Uhr und Samstag von 10 bis 14 Uhr. Für eine ausführliche Beratung empfehlen wir einen Termin." },
      { q: "Was sollte ich zur Beratung mitbringen?", a: "Hilfreich sind ein Grundriss oder die Maße Ihrer Räume, Fotos und – falls vorhanden – Bilder von Einrichtungen, die Ihnen gefallen." },
    ],
  },
};

export default async function DesignermoebelDornbirnPage({ params }) {
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
