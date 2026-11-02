// /de/3d-ansicht — Labs: 3D- und AR-Viewer für das ganze Sortiment.
// Nur Deutsch, nicht indexiert. Server Component: lädt das Sortiment aus dem
// Backoffice (nur lesen, Data Cache 1 h), filtert serverseitig (Suche, Marke,
// Kategorie, Stufe; 24 pro Seite) und zeigt darunter die Beispielmodelle
// (Stufe 1 in Aktion). 3D lädt immer erst auf Klick.
import { notFound } from "next/navigation";
import HandBridge from "@/components/Reusable/HandBridge";
import Link from "next/link";
import RAUM from "@/lib/arviewer/raumbedarf.json";
import { withContext } from "@/lib/forms/beratungContext";
import { Box, Boxes, ScanLine, Image as ImageIcon } from "lucide-react";
import ArViewerApp from "@/components/Labs/ArViewer/ArViewerApp";
import SortimentFilters from "@/components/Labs/ArViewer/Sortiment/SortimentFilters";
import SortimentGrid from "@/components/Labs/ArViewer/Sortiment/SortimentGrid";
import SortimentShell, { ResultsRegion } from "@/components/Labs/ArViewer/Sortiment/SortimentShell";
import RaumCarousel from "@/components/Labs/ArViewer/Sortiment/RaumCarousel";
import RoomTips from "@/components/Labs/ArViewer/Sortiment/RoomTips";
import { getArModels } from "@/components/Labs/ArViewer/data/source";
import { SAMPLE_NOTICE } from "@/components/Labs/ArViewer/data/catalog";
import { getSortiment } from "@/lib/arviewer/catalog";
import { joinNames } from "@/lib/arviewer/sortiment-load";
import { parseQuery, querySortiment, listHref, suggestQuery } from "@/lib/arviewer/query";
import { STUFEN, hatRaum } from "@/lib/arviewer/stage";
import { WerkzeugJsonLd, werkzeugMetadata } from "@/components/Labs/werkzeugSeo";
import LangNotice from "@/components/Arbeitsweise/LangNotice";
import { noticeLang } from "@/lib/arbeitsweise/langNotice";

export async function generateMetadata({ params }) {
  const { locale } = await params;
  if (locale !== "de") return {};
  // Feste URL seit der Integration (Inhaber-Entscheidung Nr. 9): indexierbar, nur Deutsch.
  // R2 seo P2-3/P2-4: Title ≤ 65, Description ≤ 165, hreflang de + x-default.
  return werkzeugMetadata("3d-ansicht", {
    title: "Raumbedarf in Originalgröße prüfen: 3D & AR | Platzhirsch",
    description: "Passt das Möbel? Platzbedarf in Originalgröße in den eigenen Raum stellen, Beispielmodelle in 3D drehen und das Sortiment mit Maßen vergleichen.",
    ogTitle: "Raumbedarf in Originalgröße prüfen",
  });
}

// Runde 4 (neuland P1-3): im ersten Bildschirm ein sichtbares Beispiel.
// R5 (neuland P1-5, Inhaber C.29 – keine 3D-Modelle der Marken): Einstieg ist
// kein Draht-Quader mehr, sondern ehrlich der Raumbedarf im Grundriss – die
// Grundfläche des ClassiCon Lota Sofa (Herstellermaße, Händler-Marke) mit den
// Abständen, die wir in der Planung einrechnen (Tisch, Laufweg). Eigene
// Zeichnung (public/labs/ar-viewer/raum/lota-raumbedarf-grundriss.svg), keine
// Form des Möbels, kein Herstellerbild, keine Behauptung eines echten 3D-Modells.
// Statisch aus raumbedarf.json, hängt nicht am Backoffice; das SVG ist das LCP-Bild.
const BEISPIEL_ID = "sofas-couches-lota-sofa";
const BEISPIEL = RAUM.produkte[BEISPIEL_ID] ? { id: BEISPIEL_ID, ...RAUM.produkte[BEISPIEL_ID] } : null;
const GRUNDRISS = "/labs/ar-viewer/raum/lota-raumbedarf-grundriss.svg";
const GRUNDRISS_MOBIL = "/labs/ar-viewer/raum/lota-raumbedarf-grundriss-mobil.svg";

function Beispiel({ item }) {
  if (!item) return null;
  const titel = `${item.marke} ${item.name}`;
  const alt = `Grundriss: Raumbedarf des ${titel}, Grundfläche ${item.w} × ${item.d} cm an der Wand, davor 45 cm bis zum Tisch und 90 cm Laufweg – zusammen 3 m ab Wand`;
  return (
    <figure className="mt-5 grid grid-cols-[minmax(0,4fr)_minmax(0,7fr)] items-center gap-x-4 gap-y-3 border border-line bg-surface-raised p-3 sm:grid-cols-[minmax(0,6fr)_minmax(0,5fr)] sm:p-5 md:mt-8 md:gap-8" data-testid="arv-beispiel">
      {/* Mobil eine gröber beschriftete Fassung (lesbar in ~130 px Breite), ab 640 px die Zeichnung mit allen Maßen. */}
      <picture className="relative block aspect-[440/330] w-full sm:order-2 sm:aspect-[500/410]">
        <source media="(min-width: 640px)" srcSet={GRUNDRISS} />
        <img src={GRUNDRISS_MOBIL} alt={alt} width={500} height={410} fetchPriority="high" decoding="async" className="absolute inset-0 size-full object-contain" />
      </picture>
      <figcaption className="min-w-0 sm:order-1">
        <p className="text-overline uppercase text-text-accent">Beispiel · Raumbedarf</p>
        <p className="mt-1 text-ui font-medium text-text">
          <span className="sm:hidden">{titel}</span>
          <span className="hidden sm:inline">Wie viel Platz braucht das {titel}?</span>
        </p>
        <p className="text-small tabular-nums text-text-soft">
          {item.w} × {item.d} × {item.h} cm<span className="hidden sm:inline"> (Herstellermaße)</span>
        </p>
        <p className="mt-1 text-small text-text-soft sm:hidden">Raumbedarf in Originalgröße – mit Tisch und Laufweg rund 3 m ab Wand.</p>
        <p className="mt-2 hidden max-w-[52ch] text-small text-text-soft sm:block">
          Raumbedarf in Originalgröße: Wir rechnen nicht nur das Möbel, sondern auch den Abstand zum Tisch und den Laufweg dazu – hier
          rund 3 m ab der Wand. Auf dem Handy stellen Sie die Grundfläche per AR in Ihren Raum; die Form des Möbels zeigen wir im Showroom.
        </p>
        <div className="mt-3 hidden items-center gap-5 sm:flex">
          <BeispielLinks item={item} titel={titel} />
        </div>
      </figcaption>
      <div className="col-span-2 flex flex-wrap items-center gap-x-4 gap-y-1 sm:hidden">
        <BeispielLinks item={item} titel={titel} />
      </div>
    </figure>
  );
}

function BeispielLinks({ item, titel }) {
  return (
    <>
      <Link
        href={`/de/3d-ansicht/${item.id}`}
        prefetch={false}
        className={`inline-flex min-h-11 items-center bg-action px-4 text-small font-medium text-paper hover:bg-action-hover ${FOCUS}`}
      >
        Grundfläche im Raum ansehen
      </Link>
      <Link
        href={withContext("/de/beratung", { thema: "3d-ansicht", produkt: titel })}
        prefetch={false}
        className={`inline-flex min-h-11 items-center text-small font-medium underline underline-offset-4 hover:text-text-accent ${FOCUS}`}
      >
        Termin anfragen
      </Link>
    </>
  );
}

const FOCUS = "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus";
const STAGE_ICONS = { "3d": Box, "ar-foto": ScanLine, raumbedarf: Boxes, bild: ImageIcon };
const LEGENDE = ["3d", "ar-foto", "raumbedarf", "bild"];
// Fix-Runde 1 (F2): keine Stufen-Nummern („2a“) und keine Freigabe-Interna in Kundentexten.
const LEGENDE_NOTIZ = {
  "3d": () => "Wie das aussieht, zeigen die frei lizenzierten Beispielmodelle weiter unten.",
  "ar-foto": () => "Nur mit Maßen aus dem Datenblatt des Herstellers. Exakt ist die Grundfläche am Boden, das Foto ist eine Annäherung.",
  raumbedarf: () => "Maße aus Herstellerdokumenten mit Quelle – so sehen Sie, ob es passt.",
  bild: () => "Die Fotos des Herstellers, unverändert. Maße und Varianten besprechen wir gern im Showroom.",
};

export default async function ArViewerPage({ params, searchParams }) {
  const { locale } = await params;
  if (locale !== "de") notFound();

  const sp = await searchParams;
  const requested = typeof sp?.modell === "string" ? sp.modell : null;
  const [models, sortiment] = await Promise.all([
    getArModels(),
    getSortiment().catch(() => ({ items: [], brands: [], categories: [], error: true, complete: false, failed: [], stale: [] })),
  ]);
  if (!models.length) notFound();

  const filters = parseQuery(sp, sortiment);
  const result = querySortiment(sortiment.items, filters);
  const all = sortiment.items.reduce((acc, i) => ((acc[i.stufe] = (acc[i.stufe] || 0) + 1), acc), {});
  // Ansichten ohne Produkte nicht aufführen (3D bleibt: die Beispielmodelle unten zeigen es)
  const legende = LEGENDE.filter((key) => key === "3d" || (key === "bild" ? (all.bild || 0) : all[key] || 0) > 0);
  const fmt = (n) => Number(n || 0).toLocaleString("de-AT");
  const inRoom = sortiment.items.filter((i) => hatRaum(i.stufe)).length;
  // QA R2 P1-1: Teilkatalog nie als vollständig ausgeben – Zahlen dann mit „mind.“
  const partial = !sortiment.error && (sortiment.failed?.length > 0 || sortiment.complete === false);
  const mind = partial ? "mind. " : "";
  const standText = sortiment.standVon
    ? new Date(sortiment.standVon).toLocaleString("de-AT", { day: "numeric", month: "numeric", hour: "2-digit", minute: "2-digit", timeZone: "Europe/Vienna" })
    : null;
  const suggestion = !result.total && filters.q ? suggestQuery(sortiment.items, filters.q) : null;
  const filtered = Boolean(filters.q || filters.marke || filters.kategorie || filters.stufe || filters.seite > 1);
  // Reihe „Jetzt im Raum ansehen“: AR-Fotos zuerst, dann Raumbedarf mit Bild, Marken gemischt.
  const carousel = (() => {
    // QA R2 P2-3: Raumbedarf-Karten zeigen die eigene Axonometrie (das Produkt allein, mit Maßen),
    // nicht das erste Herstellerbild – das ist oft eine Wohnszene mit mehreren Produkten.
    const pool = sortiment.items
      .map((i) => (i.stufe === "raumbedarf" && i.posterRaum ? { ...i, image: i.posterRaum, imageCutout: true } : i))
      .filter((i) => hatRaum(i.stufe) && i.image);
    const byBrand = new Map();
    for (const i of pool.sort((x, y) => (x.stufe === "ar-foto" ? 0 : 1) - (y.stufe === "ar-foto" ? 0 : 1))) {
      if (!byBrand.has(i.brand)) byBrand.set(i.brand, []);
      byBrand.get(i.brand).push(i);
    }
    const lists = [...byBrand.values()];
    const out = [];
    for (let k = 0; out.length < 18 && lists.some((l) => l[k]); k++) for (const l of lists) if (l[k] && out.length < 18) out.push(l[k]);
    return out.map(({ id, name, brand, stufe, image, imageCutout, masse, posterRaum }) => ({ id, name, brand, stufe, image, imageCutout, masse, posterRaum }));
  })();

  return (
    <div className="bg-surface text-text">
      {/* R8 (neuland P1-6): /en|fr|it/3d-ansicht → 308 → ?lang=…: Hinweis in der Besuchersprache. */}
      <LangNotice page="3d-ansicht" lang={noticeLang(sp?.lang)} />
      <WerkzeugJsonLd id="3d-ansicht" description="Platzbedarf von Möbeln aus dem Sortiment in Originalgröße im eigenen Raum prüfen, Beispielmodelle in 3D drehen und Maße vergleichen." />
      {/* ---------------- Intro + Suche (QA R1 P2-1: Suche und Produkte im ersten Viewport) ---------------- */}
      <section id="sortiment" aria-labelledby="arv-titel" className="scroll-mt-24">
        <div className="mx-auto max-w-[1440px] px-5 pb-12 pt-8 md:px-12 md:pt-14 lg:px-20 lg:pt-16">
          <p className="text-overline uppercase text-text-accent">3D & AR</p>
          <h1 id="arv-titel" className="mt-2 max-w-4xl font-display text-display-m text-balance md:text-display-l">
            Passt es? Raumbedarf in Originalgröße prüfen.
          </h1>
          <Beispiel item={BEISPIEL} />
          {/* Intro-Zahlen immer aus derselben Quelle wie die Liste; ohne Sortiment ausgeblendet (P1-1.4) */}
          {!sortiment.error && (
            <p className="mt-3 max-w-[62ch] text-ui text-text-soft text-pretty" data-testid="arv-intro-zahlen">
              {mind}
              {fmt(sortiment.items.filter((i) => i.stufe !== "ohne-bild").length)} Produkte aus unserem Katalog, {mind}
              {fmt(inRoom)} davon mit Grundfläche und Höhe in Originalgröße für Ihren Raum.
            </p>
          )}

          {partial && (
            <div role="status" data-testid="arv-teilkatalog" className="mt-6 flex flex-wrap items-center gap-x-4 gap-y-2 border border-line-strong border-l-4 border-l-ink bg-surface-raised px-4 py-3 text-ui">
              <p className="min-w-0 flex-1">
                <span className="font-medium">
                  {sortiment.failed?.length ? `${joinNames(sortiment.failed)} ${sortiment.failed.length === 1 ? "wird" : "werden"} gerade nicht geladen` : "Ein Teil des Sortiments lädt gerade nicht"}
                </span>{" "}
                – die Ergebnisse sind unvollständig.
              </p>
              <a href={listHref(filters, { seite: filters.seite }).replace("#sortiment", "")} className={`inline-flex min-h-11 items-center border border-ink px-4 text-small font-medium hover:bg-ink hover:text-paper ${FOCUS}`} data-testid="arv-neu-laden">
                Neu laden
              </a>
            </div>
          )}
          {!partial && sortiment.stale?.length > 0 && (
            <p role="status" data-testid="arv-stand-hinweis" className="mt-4 text-small text-text-soft">
              {joinNames(sortiment.stale)}: Stand {standText ? `vom ${standText} Uhr` : "der letzten vollständigen Abfrage"}, die Live-Abfrage antwortet gerade nicht.
            </p>
          )}

          {sortiment.error ? (
            <p className="mt-6 border border-line bg-surface-raised p-5 text-ui" role="status">
              Das Sortiment ist gerade nicht erreichbar. Die Beispielmodelle unten funktionieren trotzdem.
            </p>
          ) : (
            <SortimentShell>
              <div className="mt-6">
                <SortimentFilters
                  filters={filters}
                  brands={sortiment.brands}
                  categories={sortiment.categories}
                  counts={result.counts}
                  total={result.total}
                  partial={partial}
                />
              </div>

              {!filtered && <RaumCarousel items={carousel} total={inRoom} partial={partial} />}

              {/* Stufen als einzeilige Legende, Erklärung zum Aufklappen */}
              <details className="group mt-8 border-y border-line">
                <summary className={`flex min-h-12 cursor-pointer list-none flex-wrap items-center gap-x-4 gap-y-1 py-2 text-small text-text-soft ${FOCUS}`}>
                  {legende.map((key) => {
                    const Icon = STAGE_ICONS[key];
                    return (
                      <span key={key} className="inline-flex items-center gap-1.5">
                        <Icon aria-hidden="true" className="size-4 text-text" strokeWidth={1.5} />
                        {STUFEN[key].kurz}
                        <span className="tabular-nums">{mind}{fmt(all[key] || 0)}</span>
                      </span>
                    );
                  })}
                  <span className="ml-auto inline-flex items-center gap-1 font-medium text-text underline underline-offset-4">
                    Was bedeuten die Ansichten?
                  </span>
                </summary>
                <ol className={`grid gap-px bg-line pb-px md:grid-cols-2 ${legende.length > 3 ? "lg:grid-cols-4" : "lg:grid-cols-3"}`} aria-label="Die Ansichten">
                  {legende.map((key) => {
                    const st = STUFEN[key];
                    return (
                      <li key={key} className="flex flex-col gap-2 bg-surface p-5">
                        <h2 className="text-title text-text">{st.titel}</h2>
                        <p className="text-small leading-relaxed text-text-soft">{st.text}</p>
                        <p className="mt-auto border-t border-line pt-2 text-small text-text-soft">{LEGENDE_NOTIZ[key]()}</p>
                      </li>
                    );
                  })}
                </ol>
              </details>

              <ResultsRegion className="mt-8">
                <h2 className="sr-only">Ergebnisse</h2>
                <SortimentGrid result={result} filters={filters} suggestion={suggestion} carousel={!result.total ? carousel.slice(0, 6) : null} />
              </ResultsRegion>
            </SortimentShell>
          )}
        </div>
      </section>

      {/* ---------------- Stufe 1 in Aktion (Beispielmodelle) ---------------- */}
      <section aria-labelledby="arv-demo-titel" className="border-t border-line bg-surface-raised">
        <div className="mx-auto max-w-[1440px] px-5 py-12 md:px-12 md:py-16 lg:px-20">
          <p className="text-overline uppercase text-text-accent">Echtes 3D in Aktion</p>
          <h2 id="arv-demo-titel" className="mt-2 max-w-3xl font-display text-display-m text-balance">
            So funktioniert echtes 3D
          </h2>
          <p className="mt-3 max-w-[68ch] text-ui leading-relaxed text-text-soft">
            Gezeigt werden frei lizenzierte Beispielmodelle (CC0), keine Produkte unserer Marken. Drehen, Bezug wechseln, Maße
            einblenden und per AR in Originalgröße in den Raum stellen – so funktioniert die 3D-Ansicht für Herstellermodelle.
          </p>
          <div className="mt-8">
            <ArViewerApp models={models} initialId={requested} sampleNotice={SAMPLE_NOTICE} />
          </div>
        </div>
      </section>

      {/* ---------------- Hinweise ---------------- */}
      <section className="border-t border-line">
        <div className="mx-auto grid max-w-[1440px] gap-10 px-5 py-12 md:grid-cols-3 md:px-12 lg:px-20">
          <div>
            <h2 className="text-title">Passt es wirklich?</h2>
            <p className="mt-2 text-small leading-relaxed text-text-soft">
              In AR lässt sich das Möbel verschieben und drehen, aber nicht verkleinern. So sehen Sie ehrlich, wie viel Platz es braucht.
            </p>
            {/* Runde 4 (CTA-Wörter): einheitlich „Termin anfragen“, mit Kontext. */}
            <Link href="/de/beratung?thema=3d-ansicht" className="mt-2 inline-flex min-h-11 items-center text-small font-medium underline underline-offset-4 hover:text-text-accent">
              Termin anfragen
            </Link>
          </div>
          <RoomTips compact />
          <div>
            <h2 className="text-title">Datenschutz</h2>
            <p className="mt-2 text-small leading-relaxed text-text-soft">
              3D lädt erst nach Ihrem Klick, alle Dateien kommen von unserem Server. Für AR nutzt Ihr Gerät auf Android Google Scene
              Viewer, auf Apple-Geräten AR Quick Look. Details in der{" "}
              <Link href="/de/datenschutz" className="-my-3 inline-block py-3 underline underline-offset-2 hover:text-text-accent">
                Datenschutzerklärung
              </Link>
              .
            </p>
          </div>
        </div>
      </section>

      {/* R2 gesamtwerk P1-4: Kern-USP (Entscheidung Nr. 8) auch in der 3D-Ansicht */}
      <HandBridge className="pb-14" links={[{ href: "/beratung?thema=3d-ansicht", label: "Beratung im Showroom" }]} />
    </div>
  );
}
