// /de/kuechen-vorarlberg — local landing page (German only; other locales 404).
// Layout: src/components/Landing/landingPage.js. Kept noindex until the copy is final.
import { notFound } from "next/navigation";
import LandingPage, { landingMetadata } from "@/components/Landing/landingPage";

const PATH = "/kuechen-vorarlberg";

export async function generateMetadata({ params }) {
  const { locale } = await params;
  if (locale !== "de") return {};
  return landingMetadata({
    path: PATH,
    title: "Exklusive Küchen in Vorarlberg",
    description:
      "Designerküchen von Poliform und next125 – geplant und ausgewählt in unserem Showroom in Lochau am Bodensee. Persönliche Beratung, Planung, Lieferung und Montage.",
  });
}

// Placeholder answers — check them before switching the page to index.
const CONTENT = {
  banner: {
    image: "/Images/Kuche/bannerImageKuche1.jpg",
    title: "Exklusive Küchen in Vorarlberg",
    alt: "Designerküche mit weißer Kochinsel und dunklen Hochschränken",
    crumb: "Küchen Vorarlberg",
  },
  intro: {
    eyebrow: "Küchenstudio am Bodensee",
    heading: "Designerküchen, die zu Ihrem Leben passen",
    paragraphs: [
      "Die Küche ist längst mehr als ein Arbeitsplatz – sie ist der Mittelpunkt des Zuhauses. Bei Platzhirsch Home Living in Lochau planen wir Küchen, die Funktion und Design verbinden: mit Marken wie Poliform und next125, hochwertigen Materialien und einer Planung, die auf Ihren Raum und Ihren Alltag abgestimmt ist.",
      "Ob Neubau in Bregenz, Altbau in Dornbirn oder Wohnung am Bodensee – wir begleiten Sie von der ersten Idee bis zur fertig montierten Küche.",
    ],
    benefits: [
      "Persönliche Beratung durch unser Einrichtungsteam",
      "Premium-Marken wie Poliform und next125 im Showroom erleben",
      "Küche und Wohnbereich aus einer Hand geplant",
      "Lieferung und Montage in ganz Österreich",
    ],
    image: "/Images/Kuche/bannerImageKuche3.jpg",
    imageAlt: "Moderne Designerküche mit Kochinsel und offenem Wohnbereich",
  },
  brands: {
    eyebrow: "Unsere Küchenmarken",
    heading: "Internationale Küchenmarken, persönlich geplant",
    items: [
      {
        name: "Poliform",
        slug: "poliform",
        image: "/Images/Home/Poliform-Kitchen.jpg",
        imageAlt: "Poliform Küche",
        text: "Italienische Küchen mit klarer Architektur, edlen Hölzern und perfekt integrierten Geräten – für offene Wohnküchen, in denen Kochen und Wohnen ineinander übergehen.",
      },
      {
        name: "next125",
        slug: "next125",
        image: "/Images/Kuche/bannerImageKuche2.jpg",
        imageAlt: "next125 Küche",
        text: "Deutsche Präzision mit großer Material- und Farbauswahl – von Beton- und Keramikfronten bis zu warmen Eichenoberflächen, individuell kombinierbar.",
      },
    ],
    cta: { href: "/produkte/kitchen", label: "Alle Küchen ansehen" },
  },
  steps: {
    eyebrow: "So entsteht Ihre Küche",
    heading: "Von der ersten Idee bis zur Montage",
    items: [
      { title: "Beratung im Showroom", text: "Wir lernen Sie, Ihren Raum und Ihre Gewohnheiten kennen – und zeigen Ihnen Fronten, Arbeitsplatten und Geräte im Original." },
      { title: "Individuelle Planung", text: "Auf Basis Ihrer Grundrisse entsteht ein Küchenkonzept, das Stauraum, Wege und Licht auf Ihren Alltag abstimmt." },
      { title: "Materialien & Details", text: "Gemeinsam wählen Sie Oberflächen, Farben und Ausstattung – bis zum letzten Griff und zur Innenbeleuchtung." },
      { title: "Lieferung & Montage", text: "Wir koordinieren Lieferung und Montage, damit Ihre Küche am Ende genau so steht, wie sie geplant war." },
    ],
  },
  gallery: [
    { src: "/Images/Kuche/bannerImageKuche1.jpg", alt: "Küche mit weißer Kochinsel und dunklen Hochschränken" },
    { src: "/Images/Kuche/bannerImageKuche2.jpg", alt: "Küche mit Betonfronten und Eichenwand" },
    { src: "/Images/Home/Poliform-Kitchen.jpg", alt: "Offene Küche mit Nussholz-Kochinsel und Esstisch" },
  ],
  showroom: {
    heading: "Küchen erleben – direkt am Bodensee",
    text: "Nur wenige Minuten von Bregenz entfernt zeigen wir Küchen, Möbel und Leuchten unserer Marken. Kommen Sie vorbei – oder vereinbaren Sie einen Termin, damit wir uns ausreichend Zeit für Ihre Planung nehmen.",
  },
  cta: {
    image: "/Images/Home/Poliform-Kitchen.jpg",
    heading: "Planen wir Ihre neue Küche",
    text: "Vereinbaren Sie einen unverbindlichen Beratungstermin in unserem Showroom in Lochau.",
  },
  faq: {
    name: "kuechen-faq",
    heading: "Fragen zur Küchenplanung",
    items: [
      { q: "Welche Küchenmarken führen Sie?", a: "Im Küchenbereich arbeiten wir mit Poliform und next125 – zwei Marken, die für hochwertige Materialien, durchdachte Details und zeitloses Design stehen. Welche Marke besser zu Ihrem Projekt passt, klären wir gemeinsam in der Beratung." },
      { q: "Wie läuft die Küchenplanung bei Platzhirsch ab?", a: "Nach einem ersten Gespräch im Showroom planen wir Ihre Küche anhand Ihrer Raummaße und Wünsche. Anschließend wählen Sie gemeinsam mit uns Fronten, Arbeitsplatten, Geräte und Details aus. Zum Schluss koordinieren wir Lieferung und Montage." },
      { q: "Brauche ich einen Termin für die Beratung?", a: "Sie sind während unserer Öffnungszeiten (Di–Fr 10–18 Uhr, Sa 10–14 Uhr) jederzeit willkommen. Für eine ausführliche Küchenplanung empfehlen wir einen Termin, damit wir uns ausreichend Zeit für Sie nehmen können." },
      { q: "Wie lange dauert es von der Planung bis zur fertigen Küche?", a: "Das hängt von Marke, Ausführung und Umfang Ihres Projekts ab. Den konkreten Zeitrahmen nennen wir Ihnen verbindlich, sobald die Planung steht." },
      { q: "Planen Sie auch Küchen für Umbauten und Altbauten?", a: "Ja. Ob Neubau, Umbau oder Altbau – wir passen die Planung an die baulichen Gegebenheiten an und berücksichtigen Anschlüsse, Dachschrägen oder besondere Raumformen." },
      { q: "Werden die Elektrogeräte in die Planung einbezogen?", a: "Ja. Backofen, Kochfeld, Dunstabzug, Kühlschrank und Geschirrspüler werden von Anfang an in die Planung integriert, damit Technik und Design perfekt zusammenpassen." },
      { q: "Kann ich die Küchen vor der Planung im Showroom ansehen?", a: "Ja. In unserem Showroom in Lochau können Sie Fronten, Materialien und Ausstattungsdetails direkt vergleichen. Am besten vereinbaren Sie vorab einen Termin, damit wir uns Zeit für Sie nehmen können." },
      { q: "Was sollte ich zum ersten Beratungstermin mitbringen?", a: "Hilfreich sind ein Grundriss oder die Maße Ihres Raumes, Fotos der aktuellen Situation und – falls vorhanden – Ideen oder Bilder, die Ihnen gefallen." },
      { q: "Planen Sie auch den Wohn- und Essbereich rund um die Küche?", a: "Ja. Neben Küchen führen wir Möbel, Leuchten und Accessoires führender Designmarken und können Küche, Essplatz und Wohnbereich als Gesamtkonzept planen." },
      { q: "Liefern und montieren Sie auch außerhalb von Vorarlberg?", a: "Ja, wir liefern und montieren in ganz Österreich. Für Projekte in Deutschland, der Schweiz und Liechtenstein sprechen Sie uns gerne direkt an." },
    ],
  },
};

export default async function KuechenVorarlbergPage({ params }) {
  const { locale } = await params;
  if (locale !== "de") notFound();
  return <LandingPage content={CONTENT} />;
}
