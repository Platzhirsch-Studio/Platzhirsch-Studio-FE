// /de/interior-design-vorarlberg — local landing page (German only; other
// locales 404). Layout: src/components/Landing/landingPage.js.
// Indexable (see landingMetadata); JSON-LD WebPage + BreadcrumbList + FAQPage via LandingPage.
// Runde 2 (P3): Prozess = USP-Kette (Durchdringungsplan §2 wörtlich: 2.1, 2.2,
// 2.3, 2.5, 2.6), Abschnitt #objekt „Hotel, Gastronomie & Objekt“ (ux P1-2,
// keine Referenzen), Block „Für Architektinnen & Planer“ (ux P1-3), Liefergebiet
// nach Entscheidung Nr. 3 („auf Wunsch“, kein pauschales Länderversprechen), CTA mit ?thema=.
import { notFound } from "next/navigation";
import LandingPage, { landingMetadata } from "@/components/Landing/landingPage";
import RegionLinks from "@/app/[locale]/regionen/RegionLinks";
// landing-kern (01.11.2026): EN/FR/IT aus src/lib/content/landingKern (Deutsch = CONTENT unten, Master).
import { KERN_LOCALES, kernContent, kernMetadata, withKernLanguages } from "@/lib/content/landingKern";

const PATH = "/interior-design-vorarlberg";

export async function generateMetadata({ params }) {
  const { locale } = await params;
  if (!KERN_LOCALES.includes(locale)) return {};
  if (locale !== "de") return kernMetadata({ path: PATH, locale });
  return withKernLanguages(landingMetadata({
    path: PATH,
    // AP-2 (SEO-Team A, 31.10.2026): Kern-USP im Title (02-massnahmen Gruppe 2).
    title: "Interior Design Vorarlberg – von Hand geplant",
    description:
      "Einrichtungsplanung in Vorarlberg: vor Ort aufgenommen, von Hand gezeichnet, in 3D geplant. Möbel, Systeme und Licht internationaler Marken.",
  }), PATH);
}

// Content is static German copy; keep facts (address, hours, brands) in sync with the footer/CMS.
const CONTENT = {
  // ux P1-1: Termin-Knöpfe öffnen die Beratung mit Kontext. Runde 5 (ux P2-6):
  // "interior" wählt nichts vor – wer renoviert, muss nicht von „Neubau“ umwählen.
  thema: "interior",
  // Die sieben Schritte stehen hier vollständig – kein zusätzlicher USP-Kurzabschnitt.
  process: false,
  banner: {
    image: "/Images/Home/secondAboutHome.jpg",
    title: "Interior Design in Vorarlberg",
    alt: "Showroom von Platzhirsch Home Living in Lochau mit Sofas und Sesseln",
    crumb: "Interior Design Vorarlberg",
  },
  intro: {
    eyebrow: "Einrichtungsberatung & Planung",
    heading: "Räume, die zu Ihnen passen – bis ins Detail",
    paragraphs: [
      "Eine gelungene Einrichtung entsteht, wenn Möbel, Materialien und Licht zusammenspielen. Bei Platzhirsch Home Living in Lochau begleiten wir Sie von der ersten Idee bis zum fertig eingerichteten Raum – für einzelne Räume ebenso wie für die komplette Wohnung oder das ganze Haus.",
      "Wir sehen uns Ihre Räume vor Ort an, Licht, Wege und Gewohnheiten eingeschlossen. Harald Menghin zeichnet daraus ein Einrichtungskonzept von Hand und baut ein Raummodell. Danach planen wir in 3D mit Möbeln, Systemen, Leuchten und Accessoires internationaler Designmarken, und Sie sehen das Ergebnis als Rendering, bevor etwas bestellt wird.",
    ],
    benefits: [
      "Konzept von Hand gezeichnet, dann in 3D geplant",
      "Ein Ansprechpartner für das gesamte Projekt",
      "Möbel, Systeme, Licht und Accessoires aus einer Hand",
      "Lieferung und Montage auf Wunsch",
    ],
    image: "/Images/Wohnen/bannerImage6.jpg",
    imageAlt: "Offener Wohnraum mit Vitrinenschränken, Kochinsel und runder Pendelleuchte",
  },
  brands: {
    eyebrow: "Marken für Ihr Gesamtkonzept",
    heading: "Möbel, Systeme und Licht aus einer Hand",
    items: [
      {
        name: "Rimadesio",
        slug: "rimadesio",
        image: "/Images/Home/slider/rimadesio-wandsystem-wohnraum.webp",
        imageAlt: "Rimadesio Wandsystem mit Holzpaneelen, Regalen und Sideboard im Wohnraum",
        text: "Wandsysteme, Regale, Schiebetüren und Raumteiler aus Glas und Aluminium – für Räume mit klarer Struktur und viel Stauraum, passgenau in die Architektur integriert.",
      },
      {
        name: "Flos",
        slug: "flos",
        image: "/Images/Home/slider/flos-stehleuchte-v3.webp",
        imageAlt: "Flos Stehleuchte mit runder Leuchtscheibe auf verchromtem Dreibein",
        text: "Licht ist Teil jedes Einrichtungskonzepts. Flos steht für ikonische Leuchten, die Räume gliedern, Stimmung schaffen und selbst zum Designobjekt werden.",
      },
    ],
    cta: { href: "/produkte", label: "Alle Produkte ansehen" },
  },
  // Durchdringungsplan 2.3 (wörtlich): die sieben Schritte der Arbeitsweise.
  steps: {
    eyebrow: "Unsere Arbeitsweise",
    heading: "Von der Handzeichnung zum fertigen Raum",
    items: [
      { title: "Kennenlernen", text: "Im Showroom mit Café oder bei Ihnen zu Hause. Sie erzählen, wie Sie wohnen." },
      { title: "Vor Ort", text: "Wir sehen uns Licht, Klima und Wege an. Wenn Ihr Projekt es braucht, auch ein, zwei Tage." },
      { title: "Handzeichnung", text: "Harald Menghin skizziert Grundriss, Perspektiven und Stimmungen von Hand." },
      { title: "Modell", text: "Ein Raummodell im Maßstab, zum Anfassen und gemeinsamen Umstellen." },
      { title: "3D-Planung", text: "Exakte Maße, ausgewählte Produkte und Materialien." },
      { title: "Rendering", text: "Ein fotorealistisches Bild Ihres Raums, bevor etwas bestellt wird." },
      { title: "Umsetzung", text: "Lieferung, Montage auf Wunsch und Begleitung bis zum Einzug." },
    ],
    links: [
      { href: "/arbeitsweise", label: "So arbeiten wir im Detail" },
      { href: "/stil-finder", label: "Ihren Wohnstil finden" },
      { href: "/3d-ansicht", label: "Möbel in 3D & AR ansehen" },
      { href: "/hotel-objekt", label: "Hotel & Objekt einrichten" },
    ],
  },
  // ux P1-2: Hotel, Gastronomie & Objekt – Anker #objekt (Menü „Hotel, Gastronomie & Objekt“).
  // Derselbe Prozess als Qualitätsversprechen, ergänzt um Zimmerserien (Durchdringungsplan §8.1).
  // KEINE Referenzen, keine Projekte, keine Konditionen (auf Anfrage).
  objekt: {
    eyebrow: "Hotel, Gastronomie & Objekt",
    heading: "Gezeichnet für Ihre Gäste.",
    text: "Für Hotelzimmer, Restaurant, Bar, Lobby oder Büro gilt derselbe Ablauf wie für ein Zuhause. Wir verbringen Zeit in Ihrem Haus, bevor wir planen, und denken Zimmerserien von Anfang an mit.",
    steps: [
      { title: "Vor Ort in Ihrem Haus", text: "Wege der Gäste und des Personals, Licht, Lärm und Reinigung. Wenn Ihr Projekt es braucht, bleiben wir auch ein, zwei Tage." },
      { title: "Handzeichnung", text: "Harald Menghin zeichnet Zimmer und öffentliche Bereiche zuerst von Hand." },
      { title: "Modell eines Musterzimmers", text: "Ein Raummodell im Maßstab, an dem Sie Varianten für die Zimmerserie gemeinsam mit uns abwägen." },
      { title: "3D-Planung der Zimmerserien", text: "Exakte Maße, Produkte und Materialien, abgestimmt auf die verschiedenen Zimmergrößen." },
      { title: "Rendering vor der Bestellung", text: "Sie sehen Zimmer und öffentliche Bereiche fotorealistisch, bevor bestellt wird. Ob ein gebautes Musterzimmer sinnvoll ist, besprechen wir mit Ihnen." },
      { title: "Umsetzung", text: "Lieferung und Montage auf Wunsch, abgestimmt auf Ihren Betrieb und die beteiligten Gewerke." },
    ],
    contactLabel: "Direkt ins Studio in Lochau",
    contactNote: "Konditionen für Hotel, Gastronomie und Objekt auf Anfrage.",
    cta: { label: "Objektprojekt anfragen" },
  },
  // ux P1-3: Block „Für Architektinnen & Planer“ (Text in src/components/Landing/copy.js).
  planer: {},
  gallery: [
    { src: "/Images/Wohnen/bannerImage9.jpg", alt: "Raum mit Glasschiebetür, Wandregal und Designerleuchte" },
    { src: "/Images/Licht/bannerImageLicht1.jpg", alt: "Essbereich mit Kronleuchter, Bücherregal und Blick in den Garten" },
    { src: "/Images/Arbeiten/bannerImageArbeiten1.jpg", alt: "Arbeitsplatz mit Schreibtisch und Stehleuchte vor großer Fensterfront" },
  ],
  showroom: {
    heading: "Ideen sammeln – in unserem Showroom",
    text: "In Lochau, nur wenige Minuten von Bregenz entfernt, zeigen wir Möbel, Systeme und Leuchten unserer Marken. Vereinbaren Sie einen Termin, damit wir uns ausreichend Zeit für Ihr Projekt nehmen können.",
  },
  cta: {
    image: "/Images/Home/helmut.jpg",
    heading: "Planen wir Ihr Einrichtungskonzept",
    text: "Vereinbaren Sie einen unverbindlichen Beratungstermin in unserem Showroom in Lochau.",
  },
  faq: {
    name: "interior-faq",
    heading: "Fragen zur Einrichtungsplanung",
    items: [
      { q: "Für welche Projekte bieten Sie Einrichtungsberatung an?", a: "Für einzelne Räume ebenso wie für komplette Wohnungen und Häuser – vom Wohnzimmer über Küche und Essbereich bis zum Schlafzimmer oder Arbeitsplatz." },
      { q: "Wie läuft die Einrichtungsplanung ab?", a: "Nach einem ersten Gespräch sehen wir uns Ihre Räume vor Ort an. Harald Menghin zeichnet das Konzept von Hand und baut bei Bedarf ein Modell. Danach planen wir in 3D, zeigen Ihnen ein Rendering und wählen mit Ihnen im Showroom aus. Lieferung und Montage koordinieren wir." },
      { q: "Brauche ich einen Termin?", a: "Sie sind während unserer Öffnungszeiten (Di–Fr 10–18 Uhr, Sa 10–14 Uhr) jederzeit willkommen. Für eine Einrichtungsplanung empfehlen wir einen Termin, damit wir uns ausreichend Zeit für Sie nehmen können." },
      { q: "Was sollte ich zum ersten Termin mitbringen?", a: "Hilfreich sind Grundrisse oder Raummaße, Fotos der Räume und – falls vorhanden – Bilder oder Ideen, die Ihnen gefallen." },
      { q: "Kann ich vorhandene Möbel in das Konzept einbeziehen?", a: "Ja. Wir berücksichtigen gerne Stücke, die Sie behalten möchten, und planen die neue Einrichtung passend dazu." },
      { q: "Planen Sie auch Beleuchtung und Accessoires?", a: "Ja. Leuchten, Teppiche und Accessoires gehören für uns zu jedem Einrichtungskonzept dazu – sie geben dem Raum Atmosphäre und Charakter." },
      { q: "Planen Sie auch Hotels, Gastronomie und Objekte?", a: "Ja. Der Ablauf ist derselbe wie für ein Zuhause, ergänzt um Musterzimmer und Zimmerserien. Konditionen für Objekte nennen wir auf Anfrage." },
      { q: "Liefern und montieren Sie auch außerhalb von Vorarlberg?", a: "Lieferung und Montage gibt es auf Wunsch, auch außerhalb Vorarlbergs auf Anfrage. Für Projekte in Deutschland, der Schweiz und Liechtenstein sprechen Sie uns gerne direkt an." },
    ],
  },
};

export default async function InteriorDesignVorarlbergPage({ params }) {
  const { locale } = await params;
  if (!KERN_LOCALES.includes(locale)) notFound();
  return (
    <>
      <LandingPage content={kernContent(PATH, locale, CONTENT)} path={PATH} />
      {/* AP-11 (SEO-Team A): Regionen, Minotti Studio, Küche, Bad & Wellness, Arbeitsweise */}
      {/* Regionsseiten gibt es nur auf Deutsch – der Block bleibt deutsch. */}
      {locale === "de" && <RegionLinks path={PATH} />}
    </>
  );
}
