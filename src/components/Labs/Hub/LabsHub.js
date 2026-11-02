import { Button, Eyebrow, Heading, Lead, LinkArrow, Section, kernDisplay } from "@/components/ui";
import { desktopCols, desktopSpan, groupFeatures } from "@/lib/features";
import FeatureCard from "./FeatureCard";
import HubPicture from "./HubPicture";
import { hubImageId } from "./hubImage";
import { HUB } from "@/lib/content/landingKern/leistungen";

// Deutsche Texte des Hubs (Master, src/lib/content/landingKern/leistungen.js HUB.de).
const HUB_DE = HUB.de;

// Übersicht /de/leistungen „Planen & Erleben“ (Hub des Menüpunkts, indexierbar).
// Zuerst Beratung und der Prozess von der Handzeichnung zum Rendering
// (Kern-USP, Inhaber-Entscheidung Nr. 8), dann die verlinkten Features
// (src/lib/features.js), gruppiert nach Online planen · Erleben · Service.
// Server-Komponente ohne Client-JS. Raster höchstens 3 Spalten (Bibel §6),
// mobil eine Spalte. Gruppen mit 4 Karten nehmen auf dem Desktop 2 Spalten,
// damit keine Karte allein in der zweiten Zeile steht (desktopCols). Ein gefüllter Knopf pro Ansicht (Termin am Ende).

/**
 * @param {Array} features  freigeschaltete Features
 * @param {string} terminHref  Beratungsseite (ohne Locale)
 */
const ADVICE = [
  { label: "Beratung & Termin", href: "/beratung", text: "Im Showroom mit Café in Lochau oder bei Ihnen zu Hause." },
  { label: "Unsere Arbeitsweise", href: "/arbeitsweise", text: "Von der Handzeichnung über das Modell zum Rendering." },
  { label: "Interior Design", href: "/interior-design-vorarlberg", text: "Raumkonzepte für Haus, Wohnung und Objekt." },
  { label: "Küchenplanung", href: "/kuechen-vorarlberg", text: "Planung im Studio, mit Aufmaß und Montage auf Wunsch." },
  // Welle 2 (Inhaber 29.10.2026): Geschäftskunden und der freigegebene Ratgeber.
  { label: "Hotel & Objekt", href: "/hotel-objekt", text: "Hotels, Chalets und Gastronomie, mit Montage im Saisonfenster." },
  { label: "Architekten & Bauträger", href: "/architekten", text: "Planungsdaten, Muster und eine Projektanfrage für Ihr Büro." },
  { label: "Ratgeber", href: "/ratgeber", text: "Was kostet ein Minotti-Sofa, was eine Küche, wie kommen Möbel in die Schweiz." },
];
// Runde 5 (ux P1-4): Garten- und Terrassenplanung wie im Menü (shellNav.js,
// „Garten & Terrasse planen“) – als Beratungsleistung hier, nicht als Karte.
const OUTDOOR_ADVICE = { label: "Garten & Terrasse planen", text: "Outdoor-Konzept mit Möbeln, Beschattung und Licht." };
// Eigene Bereiche statt Kartenraster: Outdoor (oben) und „Für Fachleute“ (unten).
const OUTSIDE_GROUPS = new Set(["outdoor"]);

// Fix-Runde 1 (F2): Bildleiste im Kopf – eigene Ansichten aus den Werkzeugen
// (Bildschirmfotos der eigenen Oberflächen bzw. CC0-Beispielmodell, kein Herstellerbild).
const HERO_SHOTS = [
  { src: "/bilder/leistungen/kuechenplaner.webp", alt: "Küchenplaner: L-Küche im Grundriss mit Modulen und Maßen" },
  { src: "/bilder/leistungen/sofaplaner.webp", alt: "Sofaplaner: Ecksofa im Grundriss eines Raums mit Maßen" },
  { src: "/bilder/leistungen/3d-ansicht.webp", alt: "3D-Ansicht: Beispielmodell eines Sessels mit eingeblendeten Maßen" },
];

// landing-kern (01.11.2026): `copy` = Texte in EN/FR/IT (leistungenCopy() in src/lib/content/landingKern,
// serverseitig); ohne `copy` gelten die deutschen Texte hier (Master).
export default function LabsHub({ features, terminHref, copy = null }) {
  const c = copy || HUB_DE;
  const outdoor = features.find((f) => f.id === "outdoor");
  const adviceList = copy ? copy.advice : ADVICE;
  const advice = outdoor ? [...adviceList, copy ? copy.outdoorLink("/outdoor-gartenplanung") : { ...OUTDOOR_ADVICE, href: outdoor.href }] : adviceList;
  const all = groupFeatures(features.filter((f) => !OUTSIDE_GROUPS.has(f.id))).map((g) => (copy ? copy.group(g) : g));
  const groups = all.filter((g) => g.id !== "fachleute");
  // QM r3: Gedankenstrich nie am Zeilenanfang („– Harald Menghin …“)
  const nbDash = (s) => (typeof s === "string" ? s.replace(/ – /g, "\u00a0– ") : s);
  // QM r5: weiche Trennstelle an der Wortfuge langer Komposita (sonst „fotorea-listisches“)
  const fugen = (s) => (typeof s === "string" ? s.replace(/(^|[^\p{L}])(foto|planungs|einrichtungs)(?=[a-zäöü]{5,})/giu, "$1$2­") : s);
  const experts = all.find((g) => g.id === "fachleute");
  return (
    <>
      <Section spacing="none" className="pt-8 pb-6 sm:pt-14 sm:pb-8 lg:pt-16" data-leistungen-kopf="">
        {/* QM r4: oben bündig – mit items-end stand über „Leistungen“ ≈ 180 px Leere (Lead rechts höher) */}
        <div className="grid grid-cols-1 gap-4 sm:gap-stack-m lg:grid-cols-12 lg:items-start">
          <div className="lg:col-span-7">
            <Eyebrow>{c.eyebrow}</Eyebrow>
            <Heading level={1} className="mt-stack-s">
              {kernDisplay(c.title)}
            </Heading>
          </div>
          <div className="lg:col-span-5 lg:col-start-8">
            <Lead tone="soft">
              {c.lead}
              <span className="hidden sm:inline">{c.leadMore}</span>.
            </Lead>
            {/* Runde 5 (ux P2-10): der Termin-Weg schon im ersten Bildschirm (iPhone). */}
            <p className="mt-3 text-ui text-text sm:mt-4" data-leistungen-termin="">
              <span className="text-text-soft">{c.personal}</span>{" "}
              <LinkArrow href={terminHref}>{c.request}</LinkArrow>
            </p>
          </div>
        </div>
        <ul className="mt-6 grid grid-cols-3 gap-2 sm:mt-10 sm:gap-grid" role="list" data-leistungen-bilder="">
          {HERO_SHOTS.map((b, i) => (
            <li key={b.src}>
              <HubPicture id={hubImageId(b.src)} alt={copy ? copy.heroAlts[i] : b.alt} sizes="(min-width: 1024px) 30vw, 33vw" preload={i === 0} className="border border-line" />
            </li>
          ))}
        </ul>
        {/* Sprungmarken: kurze Wege auf dem Handy, Tastatur-tauglich. */}
        {groups.length > 1 && (
          <nav aria-label={c.areas} className="mt-4 border-t border-line pt-2 sm:mt-8">
            <ul className="flex flex-wrap gap-x-6">
              {groups.map((g) => (
                <li key={g.id}>
                  <a
                    href={`#${g.id}`}
                    className="inline-flex min-h-11 items-center text-ui text-text underline decoration-transparent underline-offset-4 hover:decoration-current"
                  >
                    {g.label} <span className="ml-2 text-small text-text-soft">({g.features.length})</span>
                  </a>
                </li>
              ))}
            </ul>
          </nav>
        )}
      </Section>

      {/* Kern-USP (Inhaber-Entscheidung Nr. 8): der Mensch vor dem Werkzeug. */}
      <Section tone="surface" labelledBy="leistungen-beratung" spacing="none" className="pt-4 pb-10 sm:pt-8 sm:pb-16 lg:pb-20" data-leistungen-usp="">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 lg:items-start">
          <div className="lg:col-span-5">
            <Heading id="leistungen-beratung" level={2}>
              {c.uspTitle}
            </Heading>
            <p className="mt-3 max-w-measure text-body text-text-soft sm:mt-stack-s">
              {/* QM r5: Trennung an der Wortfuge („foto-realistisches“ statt „fotorea-listisches“) */}
              {fugen(c.uspText)}
            </p>
          </div>
          <ul className="reveal-group grid grid-cols-1 gap-x-grid sm:grid-cols-2 lg:col-span-6 lg:col-start-7" role="list">
            {advice.map((a) => (
              <li key={a.href} className="border-t border-line py-3 sm:py-4">
                <LinkArrow href={a.href}>{a.label}</LinkArrow>
                <p className="mt-1 hidden text-small text-text-soft sm:block">{a.text}</p>
              </li>
            ))}
          </ul>
        </div>
      </Section>

      {groups.map((g, i) => (
        <Section
          key={g.id}
          id={g.id}
          tone={i % 2 === 0 ? "band" : "surface"}
          labelledBy={`labs-${g.id}`}
          spacing="none"
          className="scroll-mt-(--header-h) py-10 sm:py-16 lg:py-20"
        >
          <div className="grid grid-cols-1 gap-2 lg:grid-cols-12 lg:items-start">
            <Heading id={`labs-${g.id}`} level={2} className="lg:col-span-5">
              {g.label}
            </Heading>
            <p className="hidden max-w-measure text-body text-text-soft sm:block lg:col-span-6 lg:col-start-7">{fugen(nbDash(g.intro))}</p>
          </div>
          {/* QM r5: Kopf oben bündig wie „Beraten & planen“ (vorher lg:items-end) */}
          {/* mobil zwei Spalten mit kompakten Karten (Titel + Bild), deutlich kürzer */}
          {/* Motion: Karten kommen beim Scrollen nacheinander (.reveal-group, ≤ 4 Stufen, nur transform) */}
          {/* QM r2: ungerade Anzahl – die letzte Karte füllt mobil die Zeile statt allein in der linken Hälfte */}
          {/* QM r4 (iPad hoch): drei Karten ab md in einer Reihe statt 2 + 1 mit riesiger Einzelkarte */}
          <ul className={`reveal-group mt-6 grid grid-cols-2 gap-x-3 gap-y-8 sm:mt-12 sm:gap-x-grid sm:gap-y-12 ${g.features.length === 3 ? "md:grid-cols-3" : ""} ${desktopCols(g.features.length)}`} role="list">
            {g.features.map((f, i) => (
              <li key={f.id} className={`flex ${desktopSpan(g.features.length, i)} ${g.features.length % 2 && i === g.features.length - 1 ? (g.features.length === 3 ? "max-md:col-span-2" : "max-lg:col-span-2") : ""}`}>
                <FeatureCard feature={f} mobileCompact sizes={g.features.length === 3 ? (i === 2 ? "(min-width: 768px) 30vw, 92vw" : "(min-width: 768px) 30vw, 45vw") : g.features.length % 2 && i === g.features.length - 1 ? "(min-width: 1024px) 30vw, 92vw" : "(min-width: 1024px) 30vw, 45vw"} className="w-full" />
              </li>
            ))}
          </ul>
        </Section>
      ))}

      <Section spacing="none" className="py-10 sm:py-16 lg:py-20">
        <div className="max-w-text" data-leistungen-schluss="">
          <Heading level={2} size="display-m">
            {c.personal}
          </Heading>
          <p className="mt-3 max-w-measure text-body text-text-soft sm:mt-stack-s">
            {c.closingText}
          </p>
          <div className="mt-stack-m">
            {/* Runde 5 (ux P2): CTA-Familie „Beratung anfragen“ wie im Kopf. */}
            <Button href={terminHref} arrow>
              {c.request}
            </Button>
          </div>
        </div>
      </Section>

      {/* Runde 5 (ux P1-4): „Für KI-Assistenten (MCP)“ ist kein Kundenservice –
          eigener, ruhiger Bereich ganz unten, als Textlinks ohne Karte. */}
      {experts && (
        <Section tone="band" labelledBy="labs-fachleute" spacing="none" className="py-8 sm:py-10" id="fachleute" data-leistungen-fachleute="">
          <div className="grid grid-cols-1 gap-2 lg:grid-cols-12 lg:items-baseline">
            <h2 id="labs-fachleute" className="text-overline uppercase text-text-soft lg:col-span-3">
              {experts.label}
            </h2>
            <ul className="lg:col-span-9" role="list">
              {experts.features.map((f) => (
                <li key={f.id} className="py-1">
                  <LinkArrow href={f.href}>{f.title}</LinkArrow>
                  <p className="mt-1 max-w-measure text-small text-text-soft">{f.summary}</p>
                </li>
              ))}
            </ul>
          </div>
        </Section>
      )}
    </>
  );
}
