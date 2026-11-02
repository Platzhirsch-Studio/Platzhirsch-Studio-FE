// /de/outdoor-gartenplanung — Outdoor-Konzept, Terrasse und Garten mit
// Koordination der Gewerke (German only; other locales 404).
// Layout: src/components/Landing/Outdoor/OutdoorLanding.js.
// noindex until legal review (see generateMetadata); JSON-LD WebPage + Service + FAQPage.
// Background, legal limits and open points:
// Marktresearch/30-geschaeftsfeld-outdoor-gartenplanung.md (Abschnitt 3 + 8) and
// Marktresearch/digital/features/outdoor-landingpage.md.
// Wording rules: Platzhirsch has (as of 10/2026) only the trade licence. So NO
// "Bauleitung"/"Bauaufsicht"/"Generalunternehmer"/"Gartenplaner" as our own
// service (§ 94 Z 24, § 99 Abs 1 GewO). Garden plan, construction and site
// management come from licensed firms with their own contract with the
// customer; we design the furniture/shade/light concept and coordinate dates.
import { notFound } from "next/navigation";
import { ClipboardList, Flame, HardHat, Lamp, Layers, Sofa, Sprout, Trees, Umbrella, Warehouse } from "lucide-react";
import { landingMetadata } from "@/components/Landing/landingPage";
import OutdoorLanding from "@/components/Landing/Outdoor/OutdoorLanding";
// landing-kern (01.11.2026): EN/FR/IT aus src/lib/content/landingKern/outdoor.js – dieselbe
// rechtliche Bedeutung (GewO, siehe oben) in jeder Sprache; noindex auch dort.
import { KERN_LOCALES, kernContent, kernMetadata, withKernLanguages } from "@/lib/content/landingKern";

const PATH = "/outdoor-gartenplanung";

export async function generateMetadata({ params }) {
  const { locale } = await params;
  if (!KERN_LOCALES.includes(locale)) return {};
  if (locale !== "de") return kernMetadata({ path: PATH, locale, index: false });
  return withKernLanguages(landingMetadata({
    path: PATH,
    // AP-2 (SEO-Team A, 31.10.2026): „gartenmöbel“ vorn (02-massnahmen Gruppe 7).
    title: "Gartenmöbel & Outdoor am Bodensee",
    description:
      "Outdoor-Konzept mit Möbeln, Schirmen und Licht aus Lochau. Gartenplanung und Ausführung durch befugte Fachbetriebe – wir koordinieren die Termine.",
    // QA 26.10.2026: noindex until the legal review (Marktresearch/30, Abschnitt 8)
    // and the first partner agreements are done. Then remove this line and add
    // the page to landingPages.js (sitemap, footer).
    index: false,
  }), PATH);
}

const CONTENT = {
  hero: {
    image: "/Images/Outdoor/bannerImage3.jpg",
    alt: "Outdoor-Sessel und Sofa mit hellen Kissen auf einer Kiesterrasse mit Weitblick",
    // gesamtwerk P2 (Runde 2): Brotkrumen wie das Menü – Outdoor & Pool › Outdoor-Planung.
    crumb: "Outdoor-Planung",
    trail: [{ label: "Outdoor & Pool" }],
    eyebrow: "Möbel · Beschattung · Licht · Garten",
    title: "Outdoor-Planung & Gartenprojekte am Bodensee",
    lead: "Ihr Garten als Wohnraum unter freiem Himmel. Wir entwerfen das Outdoor-Konzept mit Möbeln, Beschattung und Licht und stimmen es mit befugten Fachbetrieben für Gartenbau, Pool und Technik ab – mit einem Ansprechpartner für Ihr ganzes Projekt.",
  },
  intro: {
    eyebrow: "Outdoor-Konzept aus einer Hand",
    heading: "Ihr Außenbereich wie aus einem Guss",
    paragraphs: [
      "Ein schöner Außenbereich entsteht aus vielen Gewerken: Erdbau, Mauern und Beläge, Bepflanzung, Wasser, Elektrik, Beschattung – und am Ende die Möbel, die alles zum Wohnraum machen. Damit das wie aus einem Guss wirkt, beginnen wir beim Bild, das Sie am Ende sehen möchten: der Abend auf der Terrasse, der Blick zum See, der Platz für Familie und Gäste.",
      "Daraus entwickeln wir Ihr Outdoor-Konzept mit Möbeln, Beschattung und Licht. Gartenplanung und Ausführung übernehmen befugte Fachbetriebe für Garten- und Landschaftsbau, die Bauleitung, wo nötig, ein befugter Baumeister. Sie beauftragen jeden Fachbetrieb direkt – wir koordinieren die Termine und Lieferungen und behalten das Gesamtbild im Blick.",
    ],
    points: [
      "Outdoor-Konzept mit Möbeln, Beschattung und Licht",
      "Ein Ansprechpartner – wir koordinieren Termine mit den von Ihnen beauftragten Fachbetrieben",
      "Gartenplanung und Ausführung durch befugte Fachbetriebe, Bauleitung durch einen befugten Baumeister",
      "3D-Visualisierung Ihrer Terrasse mit Möbeln, Schirmen und Licht",
      "Für Gärten, Terrassen, Dachterrassen und Seegrundstücke – privat wie für Hotel und Gastronomie",
    ],
  },
  services: {
    eyebrow: "Leistungen",
    heading: "Vom ersten Entwurf bis zum Sommerabend",
    text: "Sieben Bausteine, ein Konzept. Bei jedem Baustein steht dabei, wer ihn ausführt – damit von Anfang an klar ist, wer wofür verantwortlich ist.",
    closingEyebrow: "Ihr Projekt",
    closingText: "Welche Bausteine Ihr Garten braucht, klären wir im ersten Gespräch – im Showroom-Café in Lochau oder bei Ihnen vor Ort.",
    items: [
      {
        icon: Trees,
        title: "Gartenplanung",
        text: "Bepflanzung, Wege, Mauern, Wasser und Bewässerung. Den Gartenplan erstellt ein befugter Fachbetrieb für Garten- und Landschaftsbau; wir bringen das Gestaltungskonzept und die Möbelplanung ein und präsentieren alles gemeinsam.",
        by: "Gartenplan & Ausführung: Fachbetrieb Garten- und Landschaftsbau",
      },
      {
        icon: Layers,
        title: "Terrassengestaltung",
        text: "Wie groß muss die Terrasse sein, damit Esstisch und Lounge Platz haben? Wir planen Zonen, Wege und Möbel und stimmen Belag und Material mit dem Fachbetrieb ab – Naturstein, Holz oder Keramik.",
        by: "Möbelplanung: Platzhirsch · Belag & Unterbau: Fachbetrieb",
      },
      {
        icon: Flame,
        title: "Outdoor-Küche",
        text: "Kochen und Grillen unter freiem Himmel: Wir planen Lage, Arbeitsflächen und Abläufe zusammen mit Ihnen. Anschlüsse für Wasser, Strom und Gas legen befugte Installateure und Elektriker.",
        by: "Konzept: Platzhirsch · Anschlüsse: befugte Installateure & Elektriker",
      },
      {
        icon: Umbrella,
        title: "Beschattung",
        text: "Sonnenschirme und Sonnensegel für Terrasse, Pool und Garten – passend zu Sonnenstand und Wind. Fundamente und Bodenanker für große Schirme sowie Pergolen und Lamellendächer übernehmen befugte Fachbetriebe, bei Bedarf mit Statik vom Baumeister.",
        by: "Schirme & Montage: Platzhirsch · Fundamente: Fachbetrieb bzw. Baumeister",
      },
      {
        icon: Lamp,
        title: "Licht",
        text: "Licht macht den Garten am Abend erst zum Wohnraum: Leuchten für Tisch, Wege und Pflanzen, dazu Wärme für kühle Abende. Fest verdrahtete Leitungen verlegt ein Elektriker.",
        by: "Lichtkonzept & Leuchten: Platzhirsch · Elektrik: Elektriker",
      },
      {
        icon: Sofa,
        title: "Outdoor-Möbel",
        text: "Lounge, Esstisch, Liegen und Accessoires internationaler Designmarken. Stoffe und Materialien sehen Sie im Showroom im Original – Lieferung und Montage übernehmen wir.",
        by: "Auswahl, Lieferung & Montage: Platzhirsch",
      },
      {
        icon: Warehouse,
        title: "Pflege & Einlagerung",
        text: "Damit Polster, Schirme und Möbel viele Jahre schön bleiben: Pflege und Einlagerung für Outdoor-Möbel und Sonnenschirme auf Anfrage. Den Umfang stimmen wir mit Ihnen ab.",
        by: "Möbel & Schirme: Platzhirsch · Gartenpflege: Fachbetrieb",
      },
    ],
  },
  roles: {
    eyebrow: "Alles aus einer Hand",
    heading: "Ein Ansprechpartner für alle Gewerke",
    text: "Ein Garten- oder Terrassenprojekt braucht mehrere Fachbetriebe. Sie haben trotzdem einen Ansprechpartner: Wir stimmen Termine und Lieferungen ab, führen einen gemeinsamen Zeitplan und sorgen dafür, dass die Möbel pünktlich zum Saisonstart stehen.",
    columns: [
      {
        icon: ClipboardList,
        title: "Platzhirsch",
        subtitle: "Ihr Ansprechpartner",
        items: [
          "Outdoor-Konzept mit Möbeln, Beschattung und Licht",
          "3D-Visualisierung und Bemusterung im Showroom",
          "Abstimmung der Termine und Lieferungen mit den Fachbetrieben",
          "Lieferung und Montage von Möbeln, Schirmen und Leuchten",
          "Pflege und Einlagerung auf Anfrage",
        ],
      },
      {
        icon: Sprout,
        title: "Befugte Fachbetriebe",
        subtitle: "Garten- und Landschaftsbau, Elektro, Installation",
        items: [
          "Gartenplan und Bepflanzung",
          "Wege, Mauern, Terrassenbeläge",
          "Teiche, Schwimmteiche, Bewässerung",
          "Elektro-, Wasser- und Gasanschlüsse",
          "Gartenpflege",
        ],
      },
      {
        icon: HardHat,
        title: "Befugter Baumeister",
        subtitle: "Wo bauliche Teile dazukommen",
        items: [
          "Bauleitung und Bauaufsicht",
          "Statik, z. B. für Stützmauern, Pools und Fundamente",
          "Bauanzeige bzw. Bauantrag",
          "Baustellenkoordination nach BauKG (oder externer Koordinator)",
        ],
      },
    ],
    note: "Sie beauftragen jeden Fachbetrieb direkt und erhalten von jedem ein eigenes Angebot. Was wir liefern und welche Leistungen andere Betriebe übernehmen, halten wir im Angebot schriftlich fest.",
  },
  season: {
    eyebrow: "Ablauf & Saison",
    heading: "Planen im Winter, genießen im Sommer",
    text: "Gartenbau beginnt, sobald der Boden frostfrei ist. Designmöbel haben oft mehrere Wochen Lieferzeit. Darum lohnt es sich, im Herbst und Winter zu planen – dann ist im Frühjahr alles bereit.",
    items: [
      {
        when: "November – Dezember", // QM R1: Oktober steht schon bei 05 (September – Oktober)
        title: "Erstgespräch & Aufnahme",
        text: "Wir lernen Ihr Grundstück kennen: Wünsche, Nutzung, Sonnenstand, Blick, Budgetrahmen. Gerne im Showroom-Café in Lochau oder bei Ihnen vor Ort.",
        color: "#e0a65e",
      },
      {
        when: "Januar – Februar",
        title: "Konzept & Bemusterung",
        text: "Outdoor-Konzept und 3D-Visualisierung, Stoffe und Materialien im Showroom. Der Gartenplan entsteht beim Fachbetrieb, die Angebote kommen von jedem Betrieb einzeln.",
        color: "#6f8f93",
      },
      {
        when: "März – Mai",
        title: "Umsetzung",
        text: "Die Fachbetriebe bauen in der richtigen Reihenfolge – Erdbau, Leitungen, Mauern und Beläge, Bepflanzung, Licht. Die Möbel kommen zuletzt, meist im April oder Mai.",
        color: "#5d7a52",
      },
      {
        when: "Juni – August",
        title: "Genießen",
        text: "Ihr Garten ist bereit für lange Abende. Wir bleiben Ihr Ansprechpartner für Nachkäufe, Pflege und Fragen zu Möbeln und Schirmen.",
        color: "#d1b250",
      },
      {
        when: "September – Oktober",
        title: "Herbst & Einlagerung",
        text: "Pflanzzeit für den Garten und zweites Bauzeitfenster. Pflege und Einlagerung von Polstern, Schirmen und Möbeln über den Winter auf Anfrage.",
        color: "#8a5a35",
      },
    ],
    highlight: "Faustregel: Was zum Saisonstart im Frühjahr fertig sein soll, sollte bis Ende Januar entschieden sein.",
  },
  gallery: [
    { src: "/Images/Outdoor/bannerImage5.jpg", alt: "Outdoor-Lounge mit Sofa, gelben Kissen und Couchtisch auf einer Terrasse mit Blick aufs Meer" },
    { src: "/Images/Outdoor/bannerImage2.jpg", alt: "Outdoor-Esstisch aus Holz mit geflochtenen Stühlen auf einer Terrasse mit Pflanzen" },
    { src: "/Images/Outdoor/bannerImage1.jpg", alt: "Outdoor-Lounge mit Sofa, Sesseln und Couchtischen aus Holz vor einer weißen Lochwand" },
  ],
  brands: {
    eyebrow: "Marken aus unserem Sortiment",
    heading: "Für draußen gemacht",
    text: "Wir empfehlen nur Kollektionen, die der Hersteller für den Außenbereich vorsieht. Welche Modelle für Ihren Standort am See, in der Sonne oder im Wind passen, besprechen wir im Showroom.",
    groups: [
      {
        title: "Möbel",
        items: [
          { name: "Minotti", slug: "minotti", text: "Outdoor-Kollektion mit Sofas, Sesseln und Tischen für Terrasse und Lounge." },
          { name: "Paola Lenti", slug: "paola-lenti", text: "Outdoor-Möbel und eigene Outdoor-Stoffe in vielen Farben." },
          { name: "Gloster", slug: "gloster", text: "Outdoor-Möbel mit Teak als zentralem Material – für Esstisch, Lounge und Liegen." },
          { name: "Solpuri", slug: "solpuri", text: "Langlebige Outdoor-Möbel: Tische, Stühle, Lounge und Liegen." },
        ],
      },
      {
        title: "Schatten, Wärme & Licht",
        items: [
          { name: "Tuuci", slug: "tuuci", text: "Sonnenschirme für Terrasse, Pool und Garten – auch in großen Formaten." },
          { name: "Umbrosa", slug: "umbrosa", text: "Sonnenschirme und Sonnensegel aus Belgien für Terrasse und Garten." },
          { name: "Heatsail", slug: "heatsail", text: "Wärme für den Abend auf der Terrasse – damit die Saison länger dauert." },
          { name: "Flos", slug: "flos", text: "Leuchten aus Italien, darunter Modelle für den Außenbereich." },
        ],
      },
    ],
  },
  care: {
    eyebrow: "Pflege & Einlagerung",
    heading: "Damit es viele Sommer hält",
    text: "Outdoor-Möbel sind für Wetter gemacht – mit etwas Pflege bleiben sie über viele Jahre schön. Diesen Service bieten wir auf Anfrage an; Umfang, Termine und Kosten stimmen wir individuell mit Ihnen ab.",
    items: [
      { name: "Frühjahrs-Aufbau", text: "Wir stellen Möbel, Polster und Schirme zum Saisonstart wieder auf." },
      { name: "Herbst-Abbau", text: "Abbau und Abholung im Oktober, bevor Frost und Nässe kommen." },
      { name: "Reinigung & Kontrolle", text: "Reinigung von Polstern und Schirmtüchern, Kontrolle von Schirmmechanik und Heizstrahlern." },
      { name: "Einlagerung", text: "Trockene, belüftete Lagerung über den Winter und Rücklieferung im Frühjahr." },
    ],
  },
  cta: {
    image: "/Images/Outdoor/bannerImage4.jpg",
    heading: "Gartenprojekt besprechen",
    text: "Erzählen Sie uns von Ihrem Garten, Ihrer Terrasse oder Ihrem Seegrundstück. Fotos, Pläne und Maße helfen uns bei der Vorbereitung – das erste Gespräch ist unverbindlich.",
    primaryLabel: "Gartenprojekt besprechen",
    mailSubject: "Gartenprojekt besprechen",
    showroom: "Showroom & Café: Landstraße 11, 6911 Lochau · Di–Fr 10–18 Uhr, Sa 10–14 Uhr",
  },
  schema: {
    serviceName: "Outdoor-Konzept und Koordination der Gewerke",
    serviceType: "Gestaltung von Terrasse und Garten mit Outdoor-Möbeln, Beschattung und Licht",
    description:
      "Outdoor-Konzept mit Möbeln, Beschattung und Licht, 3D-Visualisierung und Koordination der Termine mit den vom Kunden beauftragten Fachbetrieben. Gartenplanung und Ausführung durch befugte Fachbetriebe, Bauleitung durch einen befugten Baumeister.",
    areaServed: ["Vorarlberg", "Bodensee", "Bayern", "Baden-Württemberg", "Ostschweiz", "Liechtenstein"],
  },
  faq: {
    name: "outdoor-faq",
    heading: "Häufige Fragen zu Garten und Terrasse",
    items: [
      {
        q: "Übernehmen Sie auch die Bauleitung?",
        a: "Nicht selbst. Bauleitung und Bauaufsicht übernimmt, wo nötig, ein befugter Baumeister, die Arbeiten im Garten ein befugter Fachbetrieb für Garten- und Landschaftsbau. Wir sind Ihr Ansprechpartner: Wir entwerfen das Outdoor-Konzept und koordinieren die Termine mit den Fachbetrieben, die Sie beauftragen.",
      },
      {
        q: "Mit wem schließe ich die Verträge?",
        a: "Mit jedem Fachbetrieb direkt. Sie erhalten getrennte Angebote – von uns für Konzept, Möbel, Schirme, Leuchten und Montage, von den Fachbetrieben für Garten, Bau und Technik. So wissen Sie genau, wer welche Leistung erbringt und dafür einsteht.",
      },
      {
        q: "Wann sollte ich mit der Planung beginnen?",
        a: "Am besten im Herbst oder Winter. Gartenbau beginnt meist im März, wenn der Boden frostfrei ist, und Designmöbel haben oft mehrere Wochen Lieferzeit. Was zum Saisonstart fertig sein soll, sollte deshalb bis Ende Januar entschieden sein.",
      },
      {
        q: "Brauche ich für Pool, Pergola oder Mauer eine Bewilligung?",
        a: "Häufig ja. In Vorarlberg sind zum Beispiel Schwimmbecken, Stützmauern und offene Pergolen in der Regel anzeigepflichtig (§ 19 Vorarlberger Baugesetz), am Bodensee kann im 500-m-Uferstreifen eine naturschutzrechtliche Bewilligung dazukommen (§ 24 GNL). Das klärt im Einzelfall der Fachbetrieb bzw. Baumeister mit Gemeinde und Behörde – Behördenwege übernehmen wir nicht.",
      },
      {
        q: "Was kostet ein Outdoor-Projekt?",
        a: "Das hängt stark von Größe und Umfang ab – von der neuen Terrasse mit Möbeln bis zum ganzen Garten. Im Erstgespräch legen wir einen Budgetrahmen fest; danach erhalten Sie von uns und von jedem Fachbetrieb ein eigenes Angebot.",
      },
      {
        q: "Arbeiten Sie auch in Deutschland, der Schweiz und Liechtenstein?",
        a: "Möbel, Schirme und Konzept: gerne, sprechen Sie uns an. Für Garten- und Bauarbeiten empfehlen sich Fachbetriebe vor Ort, weil in jedem Land eigene Bau- und Gewerberegeln gelten. Wie wir Ihr Projekt am besten organisieren, klären wir individuell.",
      },
      {
        q: "Lagern Sie Outdoor-Möbel über den Winter ein?",
        a: "Auf Anfrage: Für Outdoor-Möbel und Sonnenschirme bieten wir Pflege und Einlagerung an – vom Abbau im Herbst bis zum Aufbau im Frühjahr. Umfang, Termine und Kosten stimmen wir individuell mit Ihnen ab.",
      },
    ],
  },
};

export default async function OutdoorGartenplanungPage({ params }) {
  const { locale } = await params;
  if (!KERN_LOCALES.includes(locale)) notFound();
  return <OutdoorLanding content={kernContent(PATH, locale, CONTENT)} path={PATH} />;
}
