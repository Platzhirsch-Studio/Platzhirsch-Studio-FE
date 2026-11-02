// src/components/Katalog/KatalogListe.js
// Listenseiten des statischen Herstellerkatalogs (Server Component):
//   modus "uebersicht"  /<welt>/produkte – nach Kategorie gruppiert, je Gruppe
//                       höchstens UEBERSICHT_JE_KATEGORIE Kacheln + „Alle … ansehen“
//   modus "kategorie"   /<welt>/kategorie/<kat>[/seite/<n>] – alle Produkte der
//                       Kategorie, SEITE_GROESSE je Seite, Filter nach Marke/Bereich
//   modus "marke"       /<welt>/marke/<marke>[/seite/<n>] – nach Kategorie
//                       gruppiert, SEITE_GROESSE je Seite, Filter nach Kategorie
// Inhaber-Entscheidung Nr. 25: alle Produkte je Marke (auch 100+) – darum
// Gruppierung und Paginierung statt einer langen Liste; die Filter-Insel
// (KatalogFilter, nur DOM, kein Daten-Bundle) erscheint nur auf einseitigen Listen.
// Keine Kaufknöpfe. Händlersatz nur über den Claim-Guard (dealerStatement) und
// nur für Marken mit `dealer: true`.
import { useTranslations } from "next-intl";
import JsonLd from "@/components/Reusable/JsonLd";
import { Link } from "@/i18n/navigation";
import { Breadcrumbs, CTABand, Eyebrow, Heading, Lead, LinkArrow, Section } from "@/components/ui";
import { schreibenHref } from "@/lib/forms/terminLink";
import { dealerStatement } from "@/lib/legal/claims";
import { kategorieKey } from "@/lib/katalog/schema";
import { WELTEN, beratungThema, kategoriePath, markePath, produktePath, seitePath } from "@/lib/katalog/welten";
import {
  KATALOG_MARKEN,
  UEBERSICHT_JE_KATEGORIE,
  markenMitProdukten,
  nachKategorie,
  produkteByKategorie,
  produkteByMarke,
  produkteByWelt,
  looksVon,
  querverweiseVon,
  seiteVon,
  seitenAnzahl,
} from "@/lib/katalog";
import KatalogFilter from "./KatalogFilter";
import LooksBlock from "./LooksBlock";
import ProduktKachel from "./ProduktKachel";
import { produktListeSchema } from "./katalogSchema";
import { uebersichtSichtbar } from "./uebersichtRaster";
import { ARROW_INLINE, splitFirstSentence } from "@/components/Landing/typoLanding";
import { ArrowRight } from "@/components/ui/icons";

// Optik-QA 01.11.2026: am Handy zwei Spalten wie im Shop-Raster – einspaltig wurde die
// Übersicht Bad & Wellness auf dem iPhone rund 80 000 px lang (je Kachel ein Bildschirm).
const GRID = "grid grid-cols-2 gap-x-4 gap-y-8 sm:gap-x-grid lg:grid-cols-3";
const KACHEL_SIZES = "(min-width: 1024px) 30vw, 50vw";


export function Paginierung({ base, seite, seiten, t }) {
  if (seiten < 2) return null;
  return (
    <nav aria-label={t("seiten.label")} className="mt-stack-m border-t border-line pt-4" data-kat-seiten="">
      <ul className="flex flex-wrap items-center gap-2 text-ui">
        {Array.from({ length: seiten }, (_, i) => i + 1).map((n) => (
          <li key={n}>
            {n === seite ? (
              <span aria-current="page" className="inline-flex min-h-11 min-w-11 items-center justify-center border border-ink px-3">
                {n}
              </span>
            ) : (
              // QM R3: schlichte Seitenzahl statt Pfeil-Link („2 → 3 → 4 →“ wirkte unruhig).
              <Link href={seitePath(base, n)} className="inline-flex min-h-11 min-w-11 items-center justify-center border border-line px-3 text-text no-underline hover:border-ink">
                <span className="sr-only">{t("seiten.seite")} </span>
                {n}
              </Link>
            )}
          </li>
        ))}
      </ul>
      <p className="mt-2 text-small text-text-soft">{t("seiten.status", { seite, seiten })}</p>
    </nav>
  );
}

/**
 * @param {{locale: string, welt: string, modus: "uebersicht"|"kategorie"|"marke", marke?: object|null, kategorie?: string|null, seite?: number}} props
 */
export default function KatalogListe({ locale, welt, modus, marke = null, kategorie = null, seite = 1 }) {
  const t = useTranslations("katalog");
  const w = WELTEN[welt];
  const wk = `welt.${w.key}`;
  const nameOf = (slug) => KATALOG_MARKEN.find((m) => m.slug === slug)?.name || slug;
  const katLabel = (k) => t(`kategorie.${kategorieKey(k)}`);

  const alle = modus === "marke" ? produkteByMarke(marke.slug, welt) : modus === "kategorie" ? produkteByKategorie(welt, kategorie) : produkteByWelt(welt);
  const base = modus === "marke" ? markePath(welt, marke.slug) : modus === "kategorie" ? kategoriePath(welt, kategorie) : produktePath(welt);
  const seiten = modus === "uebersicht" ? 1 : seitenAnzahl(alle);
  const liste = modus === "uebersicht" ? alle : seiteVon(alle, seite);
  const path = seitePath(base, seite);

  const title =
    modus === "marke" ? t("marke.title", { marke: marke.name }) : modus === "kategorie" ? t("kategorieSeite.title", { kategorie: katLabel(kategorie) }) : t(`${wk}.produkteTitle`);
  const lead =
    modus === "marke" ? t("marke.lead", { marke: marke.name }) : modus === "kategorie" ? t("kategorieSeite.lead", { kategorie: katLabel(kategorie) }) : t(`${wk}.produkteLead`);
  const crumbs = [
    { label: "Home", href: "/" },
    // Welt ohne eigene Seite (hub: null, z. B. /accessoires): kein Zwischen-Crumb.
    ...(w.hub ? [{ label: t(`${wk}.crumb`), href: w.hub }] : []),
    ...(modus === "uebersicht" ? [{ label: t(`${wk}.produkteCrumb`) }] : [{ label: t(`${wk}.produkteCrumb`), href: produktePath(welt) }, { label: modus === "marke" ? marke.name : katLabel(kategorie) }]),
  ];
  const dealerLine = marke?.dealer ? dealerStatement(marke.name, locale) : "";
  const thema = modus === "marke" || welt !== "bad-wellness" ? beratungThema(alle[0]?.bereich) : "bad,wellness";
  const beratung = schreibenHref(locale, { context: modus === "marke" ? { thema, produkt: marke.name } : { thema } });

  // Filter nur auf einseitigen Listen (sonst würde er nur die aktuelle Seite filtern).
  const inList = (key, v) => liste.some((p) => p[key] === v);
  const felder =
    modus === "uebersicht" || seiten > 1
      ? []
      : [
          ...(modus === "kategorie"
            ? [
                { name: "marke", label: t("filter.marke"), optionen: markenMitProdukten(welt).filter((m) => inList("marke", m.slug)).map((m) => ({ value: m.slug, label: m.name })) },
                { name: "bereich", label: t("filter.bereich"), optionen: w.bereiche.filter((b) => inList("bereich", b)).map((b) => ({ value: b, label: t(`bereich.${b}`) })) },
              ]
            : [{ name: "kategorie", label: t("filter.kategorie"), optionen: nachKategorie(liste).map((g) => ({ value: g.kategorie, label: katLabel(g.kategorie) })) }]),
        ].filter((f) => f.optionen.length > 1);
  const trefferTexte = felder.length ? Array.from({ length: liste.length + 1 }, (_, n) => t("filter.treffer", { count: n })) : [];
  const zielId = `katalog-${welt}-${modus}${marke ? `-${marke.slug}` : ""}${kategorie ? `-${kategorie}` : ""}`;
  const gruppen = modus === "kategorie" ? null : nachKategorie(liste);
  // Qualität 01.11.2026 (LCP Kategorie-/Listenseiten): die ersten drei Kacheln (erste Reihe) laden eager.
  let kachelNr = 0;
  // Motion 01.11.2026: Index in der Gruppe → Reveal-Versatz je Spalte (3er-Raster).
  const kachel = (p, i, n = null) => (
    <ProduktKachel key={p.slug} p={p} markeName={nameOf(p.marke)} locale={locale} t={t} sizes={KACHEL_SIZES} kompakt eager={kachelNr++ < 3} index={i} className={n == null ? "" : uebersichtSichtbar(i, n)} />
  );

  // QM R4: „Alle N Produkte ansehen: <Kategorie>“ – Kategorie als nicht trennbare Einheit.
  const MARK = "§KAT§";
  const alleText = (k, count) => {
    const [vor, nach = ""] = t("kategorieSeite.alle", { kategorie: MARK, count }).split(MARK);
    return (
      <>
        {vor}
        <span className="whitespace-nowrap">
          {katLabel(k)}
          {nach}
          {/* Pfeil im selben nicht umbrechenden Stück: steht nie allein in einer Zeile. */}
          <ArrowRight aria-hidden="true" className="ph-arrow ml-2 inline-block size-4 align-[-0.15em]" strokeWidth={1.5} />
        </span>
      </>
    );
  };
  // QM R4: Abschluss-CTA wiederholte wörtlich den Intro-Text. Jetzt der Beratungs-Satz des
  // jeweils anderen Lead-Texts (Marke ↔ Übersicht/Kategorie), ohne neue Aussage.
  const ctaText = splitFirstSentence(modus === "marke" ? t("kategorieSeite.lead", { kategorie: "" }) : t("marke.lead", { marke: "" }))[1];

  return (
    <>
      <JsonLd data={produktListeSchema(liste, locale, { name: title, path })} />
      <Section tone="surface" spacing="none" labelledBy="kat-title" className="pt-8 pb-10 md:pt-12 md:pb-12" data-kat-liste={modus}>
        <Breadcrumbs items={crumbs} schema className="[&_a]:min-h-11" />
        <div className="mt-4 max-w-text lg:mt-stack-m">
          <Eyebrow>{modus === "uebersicht" ? t(`${wk}.crumb`) : t(`${wk}.produkteTitle`)}</Eyebrow>
          <Heading id="kat-title" level={1} size="display-l" className="mt-stack-s text-balance">
            {title}
          </Heading>
          <Lead tone="soft" className="mt-stack-m">
            {lead}
          </Lead>
          {dealerLine && (
            <p className="mt-stack-s max-w-measure text-body text-text" data-kat-dealer={marke.slug}>
              {dealerLine}
            </p>
          )}
          {marke && (
            <LinkArrow href={marke.herstellerUrl} target="_blank" className="mt-2" data-kat-hersteller-marke={marke.slug}>
              {t("marke.herstellerSeite")}
              <span className="sr-only"> ({t("produkt.extern", { marke: marke.name })})</span>
            </LinkArrow>
          )}
          {marke?.weitereSeite && (
            <LinkArrow href={marke.weitereSeite.href} className="mt-2" data-kat-weitere-marke={marke.slug}>
              {t(`marke.${marke.weitereSeite.text}`, { marke: marke.name })}
            </LinkArrow>
          )}
        </div>

        {/* Sprungnavigation: Kategorien (Übersicht, Marke) und Marken (Übersicht). */}
        {gruppen && gruppen.length > 1 && (
          <nav aria-label={t("filter.kategorie")} className="mt-stack-m border-t border-line pt-4" data-kat-sprung="">
            <ul className="flex flex-wrap gap-x-6 gap-y-1">
              {gruppen.map((g) => (
                <li key={g.kategorie}>
                  <a href={`#kat-${g.kategorie}`} className="inline-flex min-h-11 items-center text-ui text-text underline decoration-line-strong underline-offset-4 hover:decoration-current">
                    {katLabel(g.kategorie)}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
        )}
        {modus === "uebersicht" && markenMitProdukten(welt).length > 1 && (
          <p className="mt-3 text-small text-text-soft" data-kat-marken="">
            <span>{t("filter.marke")}: </span>
            {markenMitProdukten(welt).map((m, i) => (
              <span key={m.slug}>
                {i > 0 && " · "}
                <Link href={markePath(welt, m.slug)} className="text-text underline decoration-line-strong underline-offset-4 hover:decoration-current">
                  {m.name}
                </Link>
              </span>
            ))}
          </p>
        )}
        {marke && querverweiseVon(marke.slug).filter((q) => q.welt !== welt).length > 0 && (
          <p className="mt-stack-s text-small text-text-soft" data-kat-querverweis={marke.slug}>
            <span>{t("produkt.passend")}: </span>
            {querverweiseVon(marke.slug).filter((q) => q.welt !== welt).map((q, i) => (
              <span key={`${q.welt}-${q.kategorie}`}>
                {i > 0 && " · "}
                <Link href={kategoriePath(q.welt, q.kategorie)} className="text-text underline decoration-line-strong underline-offset-4 hover:decoration-current">
                  {t("produkt.querverweis", { kategorie: katLabel(q.kategorie) })}
                </Link>
              </span>
            ))}
          </p>
        )}
        {felder.length > 0 && (
          <KatalogFilter
            zielId={zielId}
            legend={t("filter.label")}
            alleLabel={t("filter.alle")}
            resetLabel={t("filter.zuruecksetzen")}
            leerText={t("filter.leer")}
            trefferTexte={trefferTexte}
            felder={felder}
          />
        )}
      </Section>

      <Section tone="surface" spacing="compact" className="pt-0 md:pt-0" labelledBy="kat-title">
        <div id={zielId}>
          {gruppen ? (
            gruppen.map((g) => {
              const gesamt = modus === "uebersicht" ? produkteByKategorie(welt, g.kategorie).length : g.produkte.length;
              // QM R1: gleiche Marke + gleicher Name (antoniolupi Flumood Platte/Hängeplatte, identisches Bild)
              // stand in der Übersicht zweimal nebeneinander – dort nur einmal (Kategorieseite zeigt beide).
              const eindeutig = g.produkte.filter((p, i, arr) => arr.findIndex((x) => x.marke === p.marke && x.name === p.name) === i);
              const zeigen = modus === "uebersicht" ? eindeutig.slice(0, UEBERSICHT_JE_KATEGORIE) : g.produkte;
              return (
                <section key={g.kategorie} id={`kat-${g.kategorie}`} aria-labelledby={`kat-h-${g.kategorie}`} className="scroll-mt-24 pb-10" data-kat-gruppe={g.kategorie}>
                  <h2 id={`kat-h-${g.kategorie}`} className="mb-6 border-t border-line pt-6 text-title text-text">
                    {katLabel(g.kategorie)} <span className="text-small text-text-soft tabular">({gesamt})</span>
                  </h2>
                  <ul className={GRID}>{zeigen.map((p, i) => kachel(p, i, modus === "uebersicht" ? zeigen.length : null))}</ul>
                  {modus === "uebersicht" && (
                    // QM R4: Pfeil am Textende (ARROW_INLINE); die Kategorie bleibt beisammen
                    // (kein Umbruch am Bindestrich „Bad-/Accessoire“).
                    <LinkArrow href={kategoriePath(welt, g.kategorie)} className={`mt-4 ${ARROW_INLINE} [&>svg]:hidden!`} data-kat-kategorie-link={g.kategorie}>
                      {alleText(g.kategorie, gesamt)}
                    </LinkArrow>
                  )}
                </section>
              );
            })
          ) : (
            <ul className={GRID}>{liste.map((p, i) => kachel(p, i))}</ul>
          )}
        </div>
        <Paginierung base={base} seite={seite} seiten={seiten} t={t} />
        <div className="mt-stack-m max-w-text">
          <p className="text-small text-text-soft">{t(welt === "kuechengeraete" ? "hinweis.preiseKueche" : welt === "accessoires" ? "hinweis.preiseAccessoires" : "hinweis.preise")}</p>
          {welt === "bad-wellness" && <p className="mt-1 text-small text-text-soft">{t("hinweis.gesundheit")}</p>}
          <p className="mt-1 text-small text-text-soft">{t("hinweis.marken")}</p>
        </div>
      </Section>

      {/* Raumszenen der Marke (MARKE.looks) – nur auf Seite 1 der Markenseite. */}
      {modus === "marke" && seite === 1 && <LooksBlock looks={looksVon(marke.slug, welt)} locale={locale} t={t} markeName={marke.name} />}

      <CTABand id="kat-cta-title" title={t("produkt.beratung")} text={<span className="block pt-2">{ctaText}</span>} primary={{ href: beratung, label: t("produkt.beratung") }} />
    </>
  );
}

