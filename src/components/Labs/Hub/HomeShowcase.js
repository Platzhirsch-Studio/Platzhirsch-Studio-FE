import { LinkArrow, Section } from "@/components/ui";
import SectionIntro from "@/components/Home/SectionIntro";
import SubIntro, { SUB_BLOCK } from "@/components/Home/SubIntro";
import ScrollRow from "@/components/Home/ScrollRow";
import { ROW_ITEM, ROW_MOBILE, SECTION_Y } from "@/components/Home/row";
import { navFeatures } from "@/components/Navbar/shellNav";
import FeatureCard from "./FeatureCard";
import { hubFeatures } from "@/lib/features";
import { conciergeLive } from "@/lib/concierge/config";
import { sourceCopy } from "@/lib/sofaplaner/copy/source";

// Startseiten-Abschnitt „Planen & Erleben“ (Feature-Abschnitt, Inhaber-
// Entscheidung Nr. 9): die verlinkten Features aus src/lib/features.js
// (Schalter standardmäßig an). Eingebunden über Home/Services.js
// (ToolsShowcase). Ohne verlinktes Feature rendert er nichts.
// Höchstens vier Karten (die Werkzeuge zuerst), der Rest auf /de/leistungen.
//
// Rat 9,5 B11 (T2, neuland Nr. 5): Der Vorsprung ist jetzt auch mobil und auf
// Englisch zu sehen.
// - Mobil (< 640 px) statt der einen Linkzeile eine kompakte Bildreihe: Karte
//   mit Standbild und Titel (FeatureCard mobileCompact, Text erst ab sm),
//   62 vw breit in der Scroll-Reihe – etwa 260 px Höhe statt ~840 px der
//   vollen Karten (Seitenlänge, R3-startseite). Bilder laden lazy (kein
//   Einfluss auf den LCP, der oben auf der Seite liegt).
// - Englisch: nur Werkzeuge mit englischer Seite (features.js `locales`
//   enthält "en": Sofaplaner, Yacht, Ezarri), englische Titel/Texte/Bildtexte
//   unten in EN; der Überblick /leistungen ist deutsch, deshalb verweist der
//   EN-Abschnitt auf /en/arbeitsweise. Einbindung für /en: T4 (Services.js).

const PRIORITY = ["kuechenplaner", "sofaplaner", "arviewer", "ezarri", "stilfinder", "licht", "showroom", "yacht", "concierge", "dreilaender", "upload", "portal", "outdoor", "agent"];
const MAX = 4;

// Text der Scroll-Knöpfe (ScrollRow), wie scrollLabels() in Home/row.js.
const LABELS = { prev: "Zurück blättern", next: "Weiter blättern", position: "{current} von {total}" };
const LABELS_EN = { prev: "Scroll back", next: "Scroll forward", position: "{current} of {total}" };

const COPY = {
  de: {
    eyebrow: "Planen & Erleben",
    title: "Vorab ausprobieren",
    lead: "Küche planen, Sofa zusammenstellen, Möbel in 3D ansehen: online starten – Harald Menghin zeichnet Ihr Konzept anschließend von Hand.",
    overview: (n, more) => (more ? `Alle ${n} Werkzeuge im Überblick` : "Alle Werkzeuge im Überblick"),
    overviewHref: "/leistungen",
  },
  en: {
    eyebrow: "Plan & explore",
    title: "Try it first",
    lead: "Put a sofa together, explore Ezarri glass mosaic, see a yacht interior: start online – Harald Menghin then draws your concept by hand.",
    overview: () => "How we work",
    overviewHref: "/arbeitsweise",
  },
};

// Englische Kartentexte (features.js ist deutsch). Nur Fakten der Zielseiten.
const FEATURES_EN = {
  sofaplaner: () => ({
    title: sourceCopy("en").seoName,
    summary: "Step by step to your own combination: choose a shape, adjust the elements, check the dimensions in the floor plan.",
    alt: "Sofa planner: corner sofa of three elements in the floor plan of a room, with dimensions",
  }),
  yacht: () => ({
    title: "Yacht interiors",
    summary: "Interiors for boats and boathouses on Lake Constance – with concept worlds and the boat in 3D.",
    alt: "Yacht interior: drawn boat on the evening lake",
  }),
  ezarri: () => ({
    title: "Ezarri glass mosaic",
    summary: "Glass mosaic by Ezarri for bathroom, pool and wellness: range, tile overview and configurator.",
    alt: "Pool with Ezarri Celestite, turquoise glass mosaic",
    credit: "Image: Ezarri, ezarri.com",
  }),
};

/** Feature → englische Fassung (oder null, wenn es keine englische Seite gibt). */
export function featureEn(f) {
  const en = FEATURES_EN[f.id];
  if (!en || !(f.locales || []).includes("en")) return null;
  const t = en();
  return { ...f, title: t.title, summary: t.summary, note: undefined, image: f.image ? { ...f.image, alt: t.alt, ...(f.image.credit ? { credit: t.credit || f.image.credit } : {}) } : f.image };
}

export function showcaseFeatures(list = navFeatures()) {
  return [...list].sort((a, b) => PRIORITY.indexOf(a.id) - PRIORITY.indexOf(b.id)).slice(0, MAX);
}

// Runde 4 (ux P0-1): dieselbe Auswahl wie /de/leistungen (hubFeatures).
// B12 (Startseite ≤ 9 Kapitel, 31.10.2026, Team T4): `embedded` rendert den
// Abschnitt als Block im Kapitel „Gastgeber“ (WhyChooseUsSectionHome) – H3
// statt eigenem H2-Kapitel, Karten mit H4, kein eigenes Band. Ohne
// `embedded` unverändert (eigener Abschnitt).
export default function HomeShowcase({ locale, features = hubFeatures(navFeatures(), { concierge: conciergeLive() }), labels, embedded = false }) {
  if (locale !== "de" && locale !== "en") return null;
  const en = locale === "en";
  const list = en ? features.map(featureEn).filter(Boolean) : features;
  if (!list.length) return null;
  const c = COPY[locale];
  const shown = showcaseFeatures(list);
  const more = list.length > shown.length;
  // QM shell-home r3: three cards (EN) stood 2 + 1 on tablets with a ~600 px
  // hole – three cards get three columns from 40rem. Four cards: 4 columns
  // from 64rem. Both are container queries in REM on the wrapper (@container),
  // so with 200 % text the row falls back to 2 columns instead of titles
  // running into each other ("KüchenplanerMinotti-").
  const cols = shown.length === 3 ? "sm:grid-cols-2 @min-[40rem]:grid-cols-3" : "sm:grid-cols-2 @min-[64rem]:grid-cols-4";
  const overview = <LinkArrow href={c.overviewHref}>{c.overview(list.length, more)}</LinkArrow>;
  const row = (
    <ScrollRow
      id="home-labs-list"
      label={c.eyebrow}
      labels={labels || (en ? LABELS_EN : LABELS)}
      className={`${ROW_MOBILE} ${cols} sm:gap-x-grid sm:gap-y-12`}
    >
      {shown.map((f) => (
        <li key={f.id} className={`${ROW_ITEM} flex w-[62vw] max-w-64 sm:max-w-none`} data-home-labs-item={f.id}>
          <FeatureCard feature={f} headingLevel={embedded ? 4 : 3} compact mobileCompact sizes="(min-width: 1280px) 22vw, (min-width: 640px) 45vw, 62vw" className="w-full" />
        </li>
      ))}
    </ScrollRow>
  );
  if (embedded) {
    return (
      <div className={SUB_BLOCK} data-home-labs="">
        <SubIntro id="home-labs-title" title={c.title} lead={c.lead} aside={overview} />
        <div className="mt-4 @container sm:mt-8">{row}</div>
      </div>
    );
  }
  return (
    <Section tone="band" labelledBy="home-labs-title" spacing="none" className={SECTION_Y} data-home-labs="">
      <SectionIntro id="home-labs-title" eyebrow={c.eyebrow} title={c.title} lead={c.lead} aside={overview} />
      <div className="mt-6 @container sm:mt-12 lg:mt-16">{row}</div>
    </Section>
  );
}
