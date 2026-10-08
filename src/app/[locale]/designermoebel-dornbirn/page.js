// /de/designermoebel-dornbirn — local landing page (German only; other
// locales 404). Layout: src/components/Landing/landingPage.js.
// Indexable (see landingMetadata); JSON-LD WebPage + FAQPage via LandingPage.
import { notFound } from "next/navigation";
import LandingPage, { landingMetadata } from "@/components/Landing/landingPage";

const PATH = "/designermoebel-dornbirn";

export async function generateMetadata({ params }) {
  const { locale } = await params;
  if (locale !== "de") return {};
  return landingMetadata({
    path: PATH,
    title: "Designermöbel für Dornbirn",
    description:
      "Designermöbel, Küchen und Leuchten internationaler Marken für Dornbirn und das Rheintal – im Showroom in Lochau, mit Beratung, Lieferung und Montage.",
  });
}

// Content is static German copy; keep facts (address, hours, brands, delivery
// area) in sync with the footer/CMS and the other landing pages.
const CONTENT = {
  banner: {
    image: "/Images/Home/slider/poliform-kueche-kochinsel.webp",
    title: "Designermöbel für Dornbirn",
    alt: "Poliform Küche mit Kochinsel, Esstisch aus Holz und Wandregal",
    crumb: "Designermöbel Dornbirn",
  },
  intro: {
    eyebrow: "Für Dornbirn und das Rheintal",
    heading: "Einrichten aus einer Hand – von der Küche bis zum Wohnzimmer",
    paragraphs: [
      "Ob Neubau, Umbau oder neue Wohnung in Dornbirn: Wer mehrere Räume gleichzeitig einrichtet, profitiert von einer Planung aus einer Hand. In unserem Showroom in Lochau finden Sie Küchen, Möbel, Leuchten und Accessoires internationaler Designmarken an einem Ort.",
      "Wir besprechen Ihre Pläne, Ihren Stil und Ihren Alltag und stimmen Küche, Wohnbereich und Licht aufeinander ab – damit Materialien, Farben und Proportionen im ganzen Zuhause zusammenpassen.",
    ],
    benefits: [
      "Küche, Wohnen und Licht aus einer Hand",
      "Persönliche Beratung und Planung",
      "Lieferung und Montage in ganz Vorarlberg",
      "Showroom in Lochau bei Bregenz",
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
        text: "Leuchten, Möbel und Accessoires aus London – markante Formen und Materialien wie Messing, Kupfer und Holz.",
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
      { title: "Lieferung & Montage", text: "Wir liefern und montieren bei Ihnen zu Hause, damit alles genau so steht, wie es geplant war." },
    ],
  },
  gallery: [
    { src: "/Images/Kuche/bannerImageKuche2.jpg", alt: "Küche mit grauer Kochinsel, Holzwand und Esstisch unter Oberlichtern" },
    { src: "/Images/Home/slider/classicon-bell-beistelltische.webp", alt: "ClassiCon Bell Beistelltische mit farbigen Glasfüßen" },
    { src: "/Images/Wohnen/bannerImage7.jpg", alt: "Wohnzimmer mit Kamin, Sesseln und rundem Teppich" },
  ],
  showroom: {
    heading: "Von Dornbirn zu uns nach Lochau",
    text: "Unser Showroom liegt in Lochau an der Landstraße, nördlich von Bregenz am Bodensee. Kommen Sie vorbei – oder vereinbaren Sie einen Termin für eine ausführliche Beratung zu Ihrem Projekt.",
  },
  cta: {
    image: "/Images/Wohnen/bannerImage6.jpg",
    heading: "Ihr Projekt in Dornbirn",
    text: "Vereinbaren Sie einen unverbindlichen Beratungstermin – gerne mit Grundriss und ersten Ideen.",
  },
  faq: {
    name: "dornbirn-faq",
    heading: "Fragen zu Designermöbeln für Dornbirn",
    items: [
      { q: "Wo liegt Ihr Showroom?", a: "In der Landstraße 9 in 6911 Lochau – am Bodensee, nur wenige Minuten von Bregenz." },
      { q: "Liefern und montieren Sie in Dornbirn?", a: "Ja. Wir liefern und montieren in Dornbirn, in ganz Vorarlberg und in ganz Österreich." },
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
  return <LandingPage content={CONTENT} path={PATH} />;
}
