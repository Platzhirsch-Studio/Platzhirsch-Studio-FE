// /de/moebel-bodensee — local landing page (German only; other locales 404).
// Layout: src/components/Landing/landingPage.js. Kept noindex until the copy is final.
import { notFound } from "next/navigation";
import LandingPage, { landingMetadata } from "@/components/Landing/landingPage";

const PATH = "/moebel-bodensee";

export async function generateMetadata({ params }) {
  const { locale } = await params;
  if (locale !== "de") return {};
  return landingMetadata({
    path: PATH,
    title: "Designermöbel am Bodensee",
    description:
      "Designermöbel für Ihr Zuhause am Bodensee – drinnen wie draußen. Showroom in Lochau, direkt an der Grenze zu Deutschland, mit persönlicher Beratung.",
  });
}

// Content is static German copy; keep facts (address, hours, brands) in sync with the footer/CMS.
const CONTENT = {
  banner: {
    image: "/Images/Wohnen/bannerImage5.jpg",
    title: "Designermöbel am Bodensee",
    alt: "Essbereich mit Holztisch und Blick in den Garten",
    crumb: "Möbel Bodensee",
  },
  intro: {
    eyebrow: "Für die ganze Bodenseeregion",
    heading: "Designermöbel für Ihr Zuhause am See",
    paragraphs: [
      "Unser Showroom in Lochau liegt am östlichen Ufer des Bodensees, direkt an der Grenze zu Deutschland. Hier zeigen wir Möbel, Leuchten und Accessoires internationaler Designmarken – für Wohnzimmer, Essbereich, Schlafzimmer und Terrasse.",
      "Ob Wohnung mit Seeblick, Haus im Grünen oder Ferienwohnung am Bodensee: Wir beraten Sie persönlich und planen Einrichtungen, die zu Ihrem Zuhause und Ihrem Lebensstil passen.",
    ],
    benefits: [
      "Showroom in Lochau am Bodensee",
      "Einrichtung für drinnen und draußen",
      "Persönliche Beratung und Planung",
      "Lieferung und Montage in ganz Österreich",
    ],
    image: "/Images/Home/helmut.jpg",
    imageAlt: "Sofas und Sessel im Showroom von Platzhirsch Home Living in Lochau",
  },
  brands: {
    eyebrow: "Marken im Showroom",
    heading: "Wohnen am See – mit internationalen Designmarken",
    items: [
      {
        name: "Minotti",
        slug: "minotti",
        image: "/Images/Home/slider/minotti-sofa-wohnzimmer.webp",
        imageAlt: "Minotti Ecksofa in Weiß in einem Wohnzimmer mit dunkler Holzwand",
        text: "Sofas, Sessel und Tische für Wohnräume und Terrassen – mit feinen Materialien und einer ruhigen, eleganten Formensprache.",
      },
      {
        name: "Treca",
        slug: "treca",
        image: "/Images/Home/slider/treca-paris-bett-schlafzimmer.webp",
        imageAlt: "Treca Paris Bett mit gemustertem Kopfteil in einem hellen Schlafzimmer",
        text: "Französische Betten und Matratzen aus Paris – handwerklich gefertigt und mit Kopfteilen, die sich in Stoff und Farbe individuell gestalten lassen.",
      },
    ],
    cta: { href: "/produkte", label: "Alle Produkte ansehen" },
  },
  steps: {
    eyebrow: "So gehen wir vor",
    heading: "Von der Beratung bis zur Montage",
    items: [
      { title: "Beratung in Lochau", text: "Wir besprechen Ihr Zuhause, Ihren Stil und Ihre Wünsche – im Showroom oder anhand von Plänen und Fotos." },
      { title: "Planung", text: "Wir planen Möbel, Materialien und Licht für Ihre Räume – auf Wunsch auch für Terrasse und Garten." },
      { title: "Auswahl im Showroom", text: "Sie erleben Möbel, Stoffe und Oberflächen im Original und treffen Ihre Auswahl in Ruhe." },
      { title: "Lieferung & Montage", text: "Wir koordinieren Lieferung und Montage, damit am Ende alles genau so steht, wie es geplant war." },
    ],
  },
  gallery: [
    { src: "/Images/Home/secondImage.jpg", alt: "Terrasse mit Esstisch, Outdoor-Stühlen und Pool" },
    { src: "/Images/UberUns/white-sofas.jpg", alt: "Outdoor-Lounge mit Sesseln und Beistelltischen im Garten" },
    { src: "/Images/Accessories/bannerImageAccessories3.jpg", alt: "Rattansessel mit Kissen und Wolldecke im Freien" },
  ],
  showroom: {
    heading: "Besuchen Sie uns am Bodensee",
    text: "Unser Showroom in Lochau liegt nur wenige Minuten von Bregenz und direkt an der Grenze zu Deutschland. Kommen Sie vorbei – oder vereinbaren Sie einen Termin für eine ausführliche Beratung.",
  },
  cta: {
    image: "/Images/Wohnen/bannerImage10.jpg",
    heading: "Richten wir Ihr Zuhause am See ein",
    text: "Vereinbaren Sie einen unverbindlichen Beratungstermin in unserem Showroom in Lochau.",
  },
  faq: {
    name: "bodensee-faq",
    heading: "Fragen zu Möbeln am Bodensee",
    items: [
      { q: "Wo liegt Ihr Showroom?", a: "In der Landstraße 9 in 6911 Lochau – am österreichischen Ufer des Bodensees, nur wenige Minuten von Bregenz und direkt an der Grenze zu Deutschland." },
      { q: "Beraten Sie auch Kundinnen und Kunden aus Deutschland und der Schweiz?", a: "Ja, gerne. Für Lieferung und Montage außerhalb Österreichs sprechen Sie uns bitte direkt an, damit wir die Details für Ihr Projekt klären können." },
      { q: "Führen Sie auch Outdoor-Möbel für Terrasse und Garten?", a: "Ja. Neben Möbeln für innen führen wir Outdoor-Möbel und Accessoires für Terrasse, Balkon und Garten." },
      { q: "Wann hat der Showroom geöffnet?", a: "Dienstag bis Freitag von 10 bis 18 Uhr und Samstag von 10 bis 14 Uhr. Für eine ausführliche Beratung empfehlen wir einen Termin." },
      { q: "Richten Sie auch Ferienwohnungen ein?", a: "Ja. Wir planen die Einrichtung einzelner Räume ebenso wie komplette Wohnungen und Häuser – auch Ferienwohnungen." },
      { q: "Was sollte ich zur Beratung mitbringen?", a: "Hilfreich sind die Maße Ihrer Räume oder ein Grundriss, Fotos der Räume und – falls vorhanden – Bilder, die Ihnen gefallen." },
    ],
  },
};

export default async function MoebelBodenseePage({ params }) {
  const { locale } = await params;
  if (locale !== "de") notFound();
  return <LandingPage content={CONTENT} path={PATH} />;
}
