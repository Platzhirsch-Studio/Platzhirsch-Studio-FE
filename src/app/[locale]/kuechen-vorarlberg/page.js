// /de/kuechen-vorarlberg — local landing page (German only; other locales 404).
// Layout: src/components/Landing/landingPage.js. Indexable (landingMetadata,
// index, follow; in sitemap-static.xml). The old note "kept noindex until the
// copy is final" is void: the copy fix P1-3 (integration, 00-integration.md §5)
// is live and the owner confirmed the texts (inhaber-entscheidungen.md #3),
// see Marktresearch/digital/teamleiter/r3-R3-landing.md. 
// R3-landing fix (QM P2-1): which kitchens are really on show in Lochau is
// still an owner question. Until it is answered the page names Poliform and
// next125 only as brands we PLAN with (both are in the product catalogue) and
// makes no showroom / "im Original" statement; comparing happens "im Termin
// anhand von Mustern". Teaser in landingPages.js aligned (no Schüller).
// Hero photo held back (imagery.js released: false, QM P2-2): manufacturer
// press photo without a documented release.
// JSON-LD WebPage + FAQPage via LandingPage.
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import LandingPage, { landingMetadata } from "@/components/Landing/landingPage";
import RegionLinks from "@/app/[locale]/regionen/RegionLinks";
import { GERAETE_PATH } from "@/lib/kueche/geraete";
// landing-kern (01.11.2026): EN/FR/IT aus src/lib/content/landingKern (Deutsch = CONTENT unten, Master).
import { KERN_LOCALES, kernContent, kernMetadata, withKernLanguages } from "@/lib/content/landingKern";

const PATH = "/kuechen-vorarlberg";

export async function generateMetadata({ params }) {
  const { locale } = await params;
  if (!KERN_LOCALES.includes(locale)) return {};
  if (locale !== "de") return kernMetadata({ path: PATH, locale });
  return withKernLanguages(landingMetadata({
    path: PATH,
    // AP-2 (SEO-Team A, 31.10.2026): „küchenstudio vorarlberg“ vorn; Gerätemarken
    // ohne Händlerwort im Text (der Händlersatz steht nur auf /kuechengeraete).
    title: "Küchenstudio in Vorarlberg",
    description:
      "Designerküchen aus Lochau, von Hand geplant: Poliform, next125 und Geräte von Gaggenau, Miele und BORA. Lieferung und Montage auf Wunsch.",
  }), PATH);
}

// Content is static German copy; keep facts (address, hours, brands) in sync with the footer/CMS.
const CONTENT = {
  // Runde 2 (P3): Termin-Knöpfe mit Kontext (ux P1-1) und der Kern-USP als
  // kurzer Abschnitt mit eigenem Satz (gesamtwerk P1-4, Durchdringungsplan §4/§5).
  thema: "kueche",
  processText:
    "Harald Menghin zeichnet Ihre Küche zuerst von Hand: Wege, Arbeitsdreieck, Stauraum und Licht. Danach planen wir sie in 3D mit exakten Maßen und Anschlüssen, und Sie sehen Fronten, Arbeitsplatte und Licht als Rendering, bevor etwas bestellt wird.",
  banner: {
    image: "/Images/Kuche/bannerImageKuche1.jpg",
    title: "Küchenstudio in Vorarlberg: Designerküchen aus Lochau",
    // R6 fix (QM P3-2): one-line hero lead without a brand claim.
    lead: "Persönlich geplant in Lochau am Bodensee – abgestimmt auf Ihren Raum, Ihren Alltag und den Wohnbereich daneben.",
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
      "Küchenplanung von Hand gezeichnet, dann in 3D",
      "Fronten, Arbeitsplatten und Materialien von Marken wie Poliform und next125 im Termin vergleichen",
      "Küche und Wohnbereich aus einer Hand geplant",
      "Lieferung und Montage auf Wunsch",
    ],
    image: "/Images/Kuche/bannerImageKuche3.jpg",
    imageAlt: "Moderne Designerküche mit Kochinsel und offenem Wohnbereich",
  },
  brands: {
    eyebrow: "Küchenmarken in der Planung",
    heading: "Internationale Küchenmarken, persönlich geplant",
    items: [
      {
        name: "Poliform",
        slug: "poliform",
        image: "/Images/Home/Poliform-Kitchen.jpg",
        imageAlt: "Poliform Küche",
        text: "Italienische Küchen mit klarer Architektur, Holzoberflächen und integrierten Geräten – für offene Wohnküchen, in denen Kochen und Wohnen ineinander übergehen.",
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
      { title: "Beratung in Lochau", text: "Wir lernen Sie, Ihren Raum und Ihre Gewohnheiten kennen – und vergleichen mit Ihnen Fronten, Arbeitsplatten und Oberflächen anhand von Mustern." },
      { title: "Von Hand gezeichnet", text: "Harald Menghin zeichnet Ihre Küche zuerst von Hand: Wege, Arbeitsdreieck, Stauraum und Licht. Danach planen wir sie in 3D mit exakten Maßen und Anschlüssen." },
      { title: "Materialien & Details", text: "Gemeinsam wählen Sie Oberflächen, Farben und Ausstattung – bis zum letzten Griff und zur Innenbeleuchtung." },
      { title: "Lieferung & Montage", text: "Wir koordinieren Lieferung und Montage, damit Ihre Küche am Ende genau so steht, wie sie geplant war." },
    ],
    links: [
      { href: "/arbeitsweise", label: "So arbeiten wir im Detail" },
      { href: "/kuechenplaner", label: "Küchenplaner: Küche online vorplanen" },
      { href: "/bodensee-licht", label: "Licht in Ihrer Küche ansehen" },
      { href: "/ratgeber/was-kostet-eine-designerkueche", label: "Ratgeber: Was kostet eine Designerküche?" },
      // Bad & Wellness (Inhaber-Entscheidungen Nr. 20/21): Dornbracht auch für die Küche.
      { href: "/bad-wellness#marke-dornbracht", label: "Armaturen von Dornbracht" },
      // Outdoor-Küche (02.11.2026): eigene Landingpage /outdoor-kueche.
      { href: "/outdoor-kueche", label: "Outdoor-Küche für Garten und Terrasse planen" },
    ],
  },
  gallery: [
    { src: "/Images/Kuche/bannerImageKuche1.jpg", alt: "Küche mit weißer Kochinsel und dunklen Hochschränken" },
    { src: "/Images/Kuche/bannerImageKuche2.jpg", alt: "Küche mit Betonfronten und Eichenwand" },
    { src: "/Images/Home/Poliform-Kitchen.jpg", alt: "Offene Küche mit Nussholz-Kochinsel und Esstisch" },
  ],
  showroom: {
    heading: "Küchenplanung direkt am Bodensee",
    text: "Nur wenige Minuten von Bregenz entfernt zeigen wir Möbel und Leuchten internationaler Designmarken. Für Ihre Küchenplanung vereinbaren Sie am besten einen Termin – dann nehmen wir uns ausreichend Zeit und legen die passenden Muster bereit.",
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
      { q: "Mit welchen Küchenmarken planen Sie?", a: "Im Küchenbereich planen wir unter anderem mit Poliform und next125. Welche Marke besser zu Ihrem Projekt passt, klären wir gemeinsam in der Beratung." },
      { q: "Wie läuft die Küchenplanung bei Platzhirsch ab?", a: "Nach einem ersten Gespräch im Showroom planen wir Ihre Küche anhand Ihrer Raummaße und Wünsche. Anschließend wählen Sie gemeinsam mit uns Fronten, Arbeitsplatten, Geräte und Details aus. Zum Schluss koordinieren wir Lieferung und Montage." },
      { q: "Kann ich meine Küche erst online planen?", a: "Ja. Mit dem Küchenplaner auf platzhirsch.studio/de/kuechenplaner legen Sie Grundriss und Zeilen selbst an, in 2D und 3D. Wenn Sie danach mit uns planen, zeichnet Harald Menghin Ihre Küche von Hand weiter, und wir prüfen Maße und Anschlüsse vor Ort." },
      { q: "Brauche ich einen Termin für die Beratung?", a: "Sie sind während unserer Öffnungszeiten (Di–Fr 10–18 Uhr, Sa 10–14 Uhr) jederzeit willkommen. Für eine ausführliche Küchenplanung empfehlen wir einen Termin, damit wir uns ausreichend Zeit für Sie nehmen können." },
      { q: "Wie lange dauert es von der Planung bis zur fertigen Küche?", a: "Das hängt von Marke, Ausführung und Umfang Ihres Projekts ab. Den konkreten Zeitrahmen nennen wir Ihnen verbindlich, sobald die Planung steht." },
      { q: "Planen Sie auch Küchen für Umbauten und Altbauten?", a: "Ja. Ob Neubau, Umbau oder Altbau – wir passen die Planung an die baulichen Gegebenheiten an und berücksichtigen Anschlüsse, Dachschrägen oder besondere Raumformen." },
      { q: "Werden die Elektrogeräte in die Planung einbezogen?", a: "Ja. Backofen, Kochfeld, Dunstabzug, Kühlschrank und Geschirrspüler werden von Anfang an in die Planung integriert, damit Technik und Gestaltung zusammenpassen. Wir planen Geräte von Gaggenau, Miele, V-ZUG, BORA, Liebherr und Quooker ein – Lieferung und Montage über uns." },
      { q: "Kann ich Fronten und Materialien vor der Planung vergleichen?", a: "Ja. Im Beratungstermin in Lochau vergleichen Sie Fronten, Arbeitsplatten und Oberflächen anhand von Mustern. Ob und welche Küchen gerade in der Ausstellung stehen, sagen wir Ihnen gern bei der Terminvereinbarung." },
      { q: "Was sollte ich zum ersten Beratungstermin mitbringen?", a: "Hilfreich sind ein Grundriss oder die Maße Ihres Raumes, Fotos der aktuellen Situation und – falls vorhanden – Ideen oder Bilder, die Ihnen gefallen." },
      { q: "Planen Sie auch den Wohn- und Essbereich rund um die Küche?", a: "Ja. Neben Küchen planen wir mit Möbeln, Leuchten und Accessoires internationaler Designmarken und können Küche, Essplatz und Wohnbereich als Gesamtkonzept planen." },
      { q: "Liefern und montieren Sie auch außerhalb von Vorarlberg?", a: "Lieferung und Montage gibt es auf Wunsch, auch außerhalb Vorarlbergs auf Anfrage. Für Projekte in Deutschland, der Schweiz und Liechtenstein sprechen Sie uns gerne direkt an." },
    ],
  },
};

export default async function KuechenVorarlbergPage({ params }) {
  const { locale } = await params;
  if (!KERN_LOCALES.includes(locale)) notFound();
  // Inhaber-Entscheidung Nr. 18: Link auf /kuechengeraete, Linktext aus den Messages
  // (kuechengeraete.title = H1 der Geräteseite, „Geräte, die wir einplanen“).
  const t = await getTranslations({ locale });
  const geraeteLink = { href: GERAETE_PATH, label: t("kuechengeraete.title") };
  const base = kernContent(PATH, locale, CONTENT);
  const links = [...base.steps.links];
  links.splice(2, 0, geraeteLink);
  const content = { ...base, steps: { ...base.steps, links } };
  return (
    <>
      <LandingPage content={content} path={PATH} />
      {/* AP-11 (SEO-Team A): Regionen, Minotti Studio, Küche, Bad & Wellness, Arbeitsweise */}
      {/* Regionsseiten gibt es nur auf Deutsch – der Block bleibt deutsch. */}
      {locale === "de" && <RegionLinks path={PATH} />}
    </>
  );
}
