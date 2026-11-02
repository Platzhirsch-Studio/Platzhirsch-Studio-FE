"use client";
// Mosaik-Übersicht mit Filtern (Konzept §3.4, QM Runde 1). Bekommt den schlanken
// Index aller 402 Referenzen (getReferenceIndex) und filtert im Browser sofort;
// der Zustand steht per history.replaceState in der URL (facets.serializeFilters
// + katalogState.extraEntries für ?bild= und ?sort=), damit jede Ansicht als
// Link teilbar ist.
//
// Aufbau (QM P2-1: erste Kartenreihe im ersten Bildschirm):
//   ab md   linke Spalte mit Suche und allen Filtern, rechts Trefferzeile + Raster
//   unter md Suche + Knopf „Filter (n)“ → Bottom-Sheet (<dialog>, showModal) mit
//            allen Gruppen und „n Mosaike anzeigen“
// Ohne Javascript: zwei normale GET-Formulare (Desktop/Mobil, je nur eines
// sichtbar); mobil liegt das Filter-Panel in einem <details>. Die Server-Seite
// rendert das Ergebnis aus searchParams, „Weitere 24 laden“ ist ein echter Link.
//
// Eignung vs. Projektbild (QM P1-3): Die Einsatz-Eignung laut Datenblatt trifft
// fast alle Mosaike und ist deshalb kein Chip, sondern ein Hinweis. Gefiltert
// wird nach „Projektbild aus …“ (?bild=). ?einsatz= aus Links der Welten wirkt
// weiter und erscheint als aktiver Filter.
import { useId, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { useLocale } from "next-intl";
import { Search, SlidersHorizontal, X } from "lucide-react";
import {
  COLOR_MATCH_MAX_DE,
  colorDistance,
  countActiveFilters,
  facetLabel,
  facetsFor,
  matchesReference,
  serializeFilters,
} from "@/lib/ezarri/facets";
import { LINKS as LINKS_DE, MOSAIKE as MOSAIKE_DE } from "@/lib/ezarri/copy";
import { LINKS as LINKS_EN, MOSAIKE as MOSAIKE_EN } from "@/lib/ezarri/copy.en";
import { LINKS as LINKS_FR, MOSAIKE as MOSAIKE_FR } from "@/lib/ezarri/copy.fr";
import { LINKS as LINKS_IT, MOSAIKE as MOSAIKE_IT } from "@/lib/ezarri/copy.it";
import { ezT } from "@/lib/ezarri/werte";

const KATALOG_COPY = { de: [MOSAIKE_DE, LINKS_DE], en: [MOSAIKE_EN, LINKS_EN], fr: [MOSAIKE_FR, LINKS_FR], it: [MOSAIKE_IT, LINKS_IT] };
import { ezarriCredit } from "@/lib/ezarri/config";
import { Link } from "@/i18n/navigation";
import MosaicCard from "./MosaicCard";
import { Chip, ChipGroup, FilterSheet } from "./FilterSheet";
import CompareBar from "./CompareBar";
import { PER_STEP } from "./constants";
import { DEFAULT_SORT, countExtras, defaultTypActive, extraEntries, matchesExtras, projektArtenFor, sortCards } from "./katalogState";
import { staggerStyle } from "@/lib/ezarri/motion";

/** Texte und Filterlisten in der Sprache der Seite (Welle 2: de/en; 01.11.2026: fr/it). */
function useKatalog() {
  const locale = useLocale();
  const en = locale === "en";
  const [MOSAIKE, LINKS] = KATALOG_COPY[locale] ?? KATALOG_COPY.de;
  return {
    locale,
    en,
    // t(de, en, fr, it) wie ezT (werte.js)
    t: ezT(locale),
    MOSAIKE,
    LINKS,
    PROJEKT_ARTEN: projektArtenFor(locale),
    ...facetsFor(locale),
  };
}

const LOOSE_DE = 40;
const noopSubscribe = () => () => {};

const matchesAll = (c, f, x) => matchesReference(c, f) && matchesExtras(c, x, f);

/** Gefilterte und sortierte Karten (Farbe → nach Nähe). Rein, auch für die Server-Seite. */
export function filterCards(index, f, { looseColor = false, extras = {} } = {}) {
  if (!f.farbe) return sortCards(index.filter((c) => matchesAll(c, f, extras)), extras.sort);
  const { farbe, ...rest } = f;
  const max = looseColor ? LOOSE_DE : COLOR_MATCH_MAX_DE;
  const near = index
    .filter((c) => matchesAll(c, rest, extras))
    .map((c) => ({ c, d: colorDistance(c.hex, farbe) }))
    .filter((x) => x.d <= max)
    .sort((a, b) => a.d - b.d)
    .map((x) => x.c);
  return extras.sort && extras.sort !== DEFAULT_SORT ? sortCards(near, extras.sort) : near;
}

function toggleValue(list = [], value) {
  return list.includes(value) ? list.filter((v) => v !== value) : [...list, value];
}

/** Alle Filtergruppen (Sidebar, Bottom-Sheet und No-JS-Details teilen sich diese Liste). */
function FilterPanel({ f, x, kollektionen, countFor, countBild, onToggle, onBild, onFlag, onColor, idPrefix }) {
  const { MOSAIKE, PROJEKT_ARTEN, WASSERWIRKUNG, FARBFAMILIEN, FORMATE, TYPEN, LINIEN, OBERFLAECHEN, t } = useKatalog();
  const more = Boolean(f.kollektion || f.linie || f.typ || f.oberflaeche || f.farbe || f.safe || f.spezial);
  return (
    <div className="flex flex-col gap-6">
      <ChipGroup legend={MOSAIKE.projektbild.legend} hint={MOSAIKE.projektbild.hinweis}>
        {PROJEKT_ARTEN.map((p) => (
          <Chip key={p.id} name="bild" value={p.id} checked={x.bild.includes(p.id)} onChange={onBild(p.id)} count={countBild(p.id)}>
            {p.label}
          </Chip>
        ))}
      </ChipGroup>
      <ChipGroup legend={t("Wasserwirkung", "Water effect", "Effet d’eau", "Effetto dell’acqua")}>
        {WASSERWIRKUNG.map((w) => (
          <Chip key={w.id} name="wasser" value={w.id} checked={(f.wasser || []).includes(w.id)} onChange={onToggle("wasser", w.id)} count={countFor("wasser", w.id)}>
            {w.label}
          </Chip>
        ))}
      </ChipGroup>
      <ChipGroup legend={t("Farbfamilie", "Colour family", "Famille de couleurs", "Famiglia di colori")}>
        {FARBFAMILIEN.map((c) => (
          <Chip key={c.id} name="farbfamilie" value={c.id} swatch={c.swatch} checked={(f.farbfamilie || []).includes(c.id)} onChange={onToggle("farbfamilie", c.id)} count={countFor("farbfamilie", c.id)}>
            {c.label}
          </Chip>
        ))}
      </ChipGroup>
      <ChipGroup legend="Format">
        {FORMATE.map((fm) => (
          <Chip key={fm.id} name="format" value={fm.id} checked={(f.format || []).includes(fm.id)} onChange={onToggle("format", fm.id)} count={countFor("format", fm.id)}>
            {fm.label}
          </Chip>
        ))}
      </ChipGroup>
      <fieldset className="min-w-0">
        <legend className="mb-2 text-overline uppercase text-text-soft">{t("Rutschhemmung", "Slip resistance", "Résistance au glissement", "Resistenza allo scivolamento")}</legend>
        <label className="inline-flex min-h-11 cursor-pointer items-center gap-3 text-small text-text">
          <input type="checkbox" name="safe" value="1" checked={Boolean(f.safe)} onChange={onFlag("safe")} className="size-5 accent-ink" />
          {MOSAIKE.safe}
        </label>
      </fieldset>
      <p className="border-l-2 border-see pl-3 text-small text-text-soft">{MOSAIKE.eignung}</p>

      <details className="group border-y border-line" open={more || undefined}>
        <summary className="flex min-h-12 cursor-pointer list-none items-center gap-2 text-ui text-text [&::-webkit-details-marker]:hidden">
          <SlidersHorizontal aria-hidden="true" className="size-4" strokeWidth={1.5} />
          {MOSAIKE.mehrFilter}
          <span className="sr-only">{t("(Kollektion, Linie, Art, Oberfläche, Farbe, Formstücke)", "(collection, line, type, surface, colour, special pieces)", "(collection, ligne, type, surface, couleur, pièces spéciales)", "(collezione, linea, tipo, superficie, colore, pezzi speciali)")}</span>
        </summary>
        <div className="flex flex-col gap-6 pb-6 pt-2">
          <ChipGroup legend={t("Kollektion", "Collection", "Collection", "Collezione")}>
            {kollektionen.map((k) => (
              <Chip key={k.id} name="kollektion" value={k.id} checked={(f.kollektion || []).includes(k.id)} onChange={onToggle("kollektion", k.id)} count={countFor("kollektion", k.id)}>
                {k.name}
              </Chip>
            ))}
          </ChipGroup>
          <ChipGroup legend={t("Art", "Type", "Type", "Tipo")}>
            {TYPEN.map((t) => (
              <Chip key={t.id} name="typ" value={t.id} checked={(f.typ || []).includes(t.id)} onChange={onToggle("typ", t.id)} count={countFor("typ", t.id)}>
                {t.label}
              </Chip>
            ))}
          </ChipGroup>
          <ChipGroup legend={t("Linie", "Line", "Ligne", "Linea")}>
            {LINIEN.map((l) => (
              <Chip key={l.id} name="linie" value={l.id} checked={(f.linie || []).includes(l.id)} onChange={onToggle("linie", l.id)} count={countFor("linie", l.id)}>
                {l.label}
              </Chip>
            ))}
          </ChipGroup>
          <ChipGroup legend={t("Oberfläche", "Surface", "Surface", "Superficie")}>
            {OBERFLAECHEN.map((o) => (
              <Chip key={o.id} name="oberflaeche" value={o.id} checked={(f.oberflaeche || []).includes(o.id)} onChange={onToggle("oberflaeche", o.id)} count={countFor("oberflaeche", o.id)}>
                {o.label}
              </Chip>
            ))}
          </ChipGroup>
          <fieldset className="min-w-0">
            <legend className="mb-2 text-overline uppercase text-text-soft">{t("Farbe", "Colour", "Couleur", "Colore")}</legend>
            <div className="flex flex-wrap items-center gap-3">
              <label className="inline-flex min-h-11 items-center gap-3 text-small text-text">
                <input
                  type="color"
                  value={f.farbe || "#4f8fa8"}
                  onChange={(e) => onColor(e.target.value.toLowerCase())}
                  className="h-11 w-14 cursor-pointer border border-line-control bg-paper p-1"
                />
                {MOSAIKE.farbe.label}
              </label>
              {f.farbe && <input type="hidden" name="farbe" value={f.farbe.replace(/^#/, "")} />}
              {f.farbe && (
                <button type="button" onClick={() => onColor(undefined)} className="min-h-11 px-2 text-small text-text underline underline-offset-4">
                  {MOSAIKE.farbe.entfernen}
                </button>
              )}
            </div>
            {f.farbe && <p className="mt-2 text-small text-text-soft">{MOSAIKE.farbe.hinweis}</p>}
          </fieldset>
          <fieldset className="min-w-0">
            <legend className="mb-2 text-overline uppercase text-text-soft">{t("Formstücke", "Special pieces", "Pièces spéciales", "Pezzi speciali")}</legend>
            <label className="inline-flex min-h-11 cursor-pointer items-center gap-3 text-small text-text">
              <input type="checkbox" name="spezial" value="1" checked={Boolean(f.spezial)} onChange={onFlag("spezial")} className="size-5 accent-ink" />
              {MOSAIKE.spezial}
            </label>
          </fieldset>
        </div>
      </details>
      {/* Hidden carriers for state that has no input in this panel (no-JS submit keeps it). */}
      {(f.einsatz || []).map((e) => (
        <input key={`${idPrefix}-e-${e}`} type="hidden" name="einsatz" value={e} />
      ))}
    </div>
  );
}

function SearchField({ id, q, labelVisible = true, className = "" }) {
  const { MOSAIKE, t } = useKatalog();
  return (
    <div className={`flex min-w-0 flex-col gap-2 ${className}`}>
      <label htmlFor={id} className={labelVisible ? "text-overline uppercase text-text-soft" : "sr-only"}>
        {MOSAIKE.sucheLabel}
      </label>
      <div className="flex min-w-0">
        <input
          key={q || ""}
          id={id}
          name="q"
          type="search"
          defaultValue={q || ""}
          placeholder={MOSAIKE.suche}
          autoComplete="off"
          enterKeyHint="search"
          className="min-h-12 min-w-0 flex-1 border border-line-control bg-paper px-3 text-ui text-text placeholder:text-text-soft"
        />
        <button type="submit" className="inline-flex min-h-12 min-w-12 items-center justify-center gap-2 border border-l-0 border-ink px-3 text-ui text-text hover:bg-action hover:text-paper">
          <Search aria-hidden="true" className="size-4" strokeWidth={1.5} />
          <span className="sr-only">{t("Suchen", "Search", "Rechercher", "Cerca")}</span>
        </button>
      </div>
    </div>
  );
}

function SortSelect({ id, value, onChange, form }) {
  const { MOSAIKE } = useKatalog();
  return (
    <div className="flex items-center gap-2">
      <label htmlFor={id} className="text-small text-text-soft">
        {MOSAIKE.sortLabel}
      </label>
      <select
        id={id}
        name="sort"
        form={form}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="min-h-11 max-w-[11rem] border border-line-control bg-paper px-2 text-small text-text"
      >
        {MOSAIKE.sortierung.map((s) => (
          <option key={s.id} value={s.id}>
            {s.label}
          </option>
        ))}
      </select>
    </div>
  );
}

export default function FilterIsland({ index, initialFilters = {}, initialExtras = {}, initialShown = PER_STEP, kollektionen = [], action }) {
  const { MOSAIKE, LINKS, PROJEKT_ARTEN, TYPEN, locale, t } = useKatalog();
  const [f, setF] = useState(initialFilters);
  const [x, setX] = useState({ bild: initialExtras.bild || [], sort: initialExtras.sort || DEFAULT_SORT });
  const [shown, setShown] = useState(initialShown);
  const [looseColor, setLooseColor] = useState(false);
  const sheetRef = useRef(null);
  const triggerRef = useRef(null);
  const resultsRef = useRef(null);
  const uid = useId();
  const formD = `ez-filter-d${uid.replace(/[^a-z0-9]/gi, "")}`;

  // Erst nach der Hydration wird mobil aus dem <details> ein Knopf mit Bottom-Sheet
  // (Server-Snapshot false, Client true; ohne setState im Effekt).
  const mounted = useSyncExternalStore(noopSubscribe, () => true, () => false);

  const results = useMemo(() => filterCards(index, f, { looseColor, extras: x }), [index, f, looseColor, x]);
  const visible = results.slice(0, shown);
  const active = countActiveFilters(f) + countExtras(x);
  const hiddenTypes = defaultTypActive(f) ? index.filter((c) => c.typ !== "mosaik" && matchesReference(c, { ...f, typ: undefined }) && matchesExtras({ ...c, typ: "mosaik" }, x, f)).length : 0;

  // Trefferzahl je Option: alle anderen Filter bleiben, dieser Schlüssel nur mit dem Wert.
  const countFor = (key, value) => {
    const probe = { ...f, [key]: [value] };
    return index.reduce((n, c) => n + (matchesAll(c, probe, x) ? 1 : 0), 0);
  };
  const countBild = (value) => {
    const probe = { ...x, bild: [value] };
    return index.reduce((n, c) => n + (matchesAll(c, f, probe) ? 1 : 0), 0);
  };

  const query = (nf, nx, seite) => {
    const p = new URLSearchParams(serializeFilters(nf));
    for (const [k, v] of extraEntries(nx)) p.set(k, v);
    if (seite > 1) p.set("seite", String(seite));
    return p.toString().replace(/%2C/g, ",");
  };

  const writeUrl = (nf, nx, seite) => {
    try {
      const s = query(nf, nx, seite);
      window.history.replaceState(window.history.state, "", `${window.location.pathname}${s ? `?${s}` : ""}`);
    } catch {
      /* URL-Update ist Komfort */
    }
  };

  const apply = (next, nextX = x) => {
    const clean = Object.fromEntries(Object.entries(next).filter(([, v]) => !(v === undefined || v === "" || v === false || (Array.isArray(v) && !v.length))));
    setF(clean);
    setX(nextX);
    setShown(PER_STEP);
    setLooseColor(false);
    writeUrl(clean, nextX, 1);
  };

  const onToggle = (key, value) => () => apply({ ...f, [key]: toggleValue(f[key], value) });
  const onBild = (value) => () => apply(f, { ...x, bild: toggleValue(x.bild, value) });
  const onFlag = (key) => (e) => apply({ ...f, [key]: e.target.checked || undefined });
  const onColor = (hex) => apply({ ...f, farbe: hex });
  const onSort = (sort) => apply(f, { ...x, sort });
  const resetAll = () => apply({}, { bild: [], sort: x.sort });

  const onSubmit = (e) => {
    e.preventDefault();
    const q = new FormData(e.currentTarget).get("q");
    apply({ ...f, q: String(q || "").trim().slice(0, 60) || undefined });
  };

  const loadMore = (e) => {
    e.preventDefault();
    const next = shown + PER_STEP;
    setShown(next);
    writeUrl(f, x, Math.ceil(next / PER_STEP));
  };

  const openSheet = () => {
    const d = sheetRef.current;
    if (d && !d.open) d.showModal();
  };
  const closeSheet = (scroll) => {
    sheetRef.current?.close();
    if (scroll) resultsRef.current?.scrollIntoView({ block: "start" });
  };

  const chips = [];
  for (const key of ["einsatz", "wasser", "farbfamilie", "format", "kollektion", "linie", "typ", "oberflaeche"]) {
    for (const v of f[key] || []) {
      const label = key === "kollektion" ? kollektionen.find((k) => k.id === v)?.name ?? v : key === "einsatz" ? `${t("Geeignet", "Suitable", "Adapté ", "Adatto")}: ${facetLabel(key, v, locale)}` : facetLabel(key, v, locale);
      chips.push({ key, v, label, remove: () => apply({ ...f, [key]: f[key].filter((y) => y !== v) }) });
    }
  }
  for (const v of x.bild) {
    const label = `${t("Projektbild", "Project photo", "Photo de projet ", "Foto di progetto")}: ${PROJEKT_ARTEN.find((p) => p.id === v)?.label ?? v}`;
    chips.push({ key: "bild", v, label, remove: () => apply(f, { ...x, bild: x.bild.filter((y) => y !== v) }) });
  }
  if (f.farbe) chips.push({ key: "farbe", v: f.farbe, label: `${t("Farbe", "Colour", "Couleur", "Colore")} ${f.farbe}`, swatch: f.farbe, remove: () => apply({ ...f, farbe: undefined }) });
  if (f.safe) chips.push({ key: "safe", v: "1", label: MOSAIKE.safe, remove: () => apply({ ...f, safe: undefined }) });
  if (f.spezial) chips.push({ key: "spezial", v: "1", label: MOSAIKE.spezial, remove: () => apply({ ...f, spezial: undefined }) });
  if (f.q) chips.push({ key: "q", v: f.q, label: t(`„${f.q}“`, `“${f.q}”`, `« ${f.q} »`, `«${f.q}»`), remove: () => apply({ ...f, q: undefined }) });

  const nextHref = `?${query(f, x, Math.ceil(shown / PER_STEP) + 1)}`;
  const panelProps = { f, x, kollektionen, countFor, countBild, onToggle, onBild, onFlag, onColor };

  return (
    <div className="md:grid md:grid-cols-[15rem_minmax(0,1fr)] md:gap-x-grid lg:grid-cols-[17rem_minmax(0,1fr)]">
      {/* Desktop/Tablet: Spalte links */}
      <form id={formD} action={action} method="get" role="search" aria-label={MOSAIKE.filter} onSubmit={onSubmit} className="hidden self-start md:flex md:flex-col md:gap-6">
        <SearchField id="ez-q" q={f.q} />
        <FilterPanel {...panelProps} idPrefix="d" />
        <div>
          <button type="submit" className="inline-flex min-h-12 items-center border border-ink px-6 text-ui text-text hover:bg-action hover:text-paper">
            {MOSAIKE.anwenden}
          </button>
        </div>
      </form>

      <div className="min-w-0">
        {/* Mobil: Suche + Filter-Knopf (Bottom-Sheet); ohne JS ein <details> */}
        <form action={action} method="get" role="search" aria-label={`${MOSAIKE.filter} (${t("mobil", "mobile", "mobile", "mobile")})`} onSubmit={onSubmit} className="relative md:hidden">
          <div className="flex items-end gap-2">
            <SearchField id="ez-q-m" q={f.q} labelVisible={false} className="flex-1" />
            {mounted ? (
              <button
                ref={triggerRef}
                type="button"
                onClick={openSheet}
                aria-haspopup="dialog"
                className="inline-flex min-h-12 shrink-0 items-center gap-2 border border-ink px-4 text-ui text-text hover:bg-action hover:text-paper"
              >
                <SlidersHorizontal aria-hidden="true" className="size-4" strokeWidth={1.5} />
                {MOSAIKE.filterKnopf(active)}
              </button>
            ) : (
              <details className="shrink-0">
                <summary className="inline-flex min-h-12 cursor-pointer list-none items-center gap-2 border border-ink px-4 text-ui text-text [&::-webkit-details-marker]:hidden">
                  <SlidersHorizontal aria-hidden="true" className="size-4" strokeWidth={1.5} />
                  {MOSAIKE.filterKnopf(active)}
                </summary>
                <div className="absolute inset-x-0 top-full z-(--z-sticky) mt-2 border border-line bg-surface p-4 shadow-overlay">
                  <FilterPanel {...panelProps} idPrefix="n" />
                  <input type="hidden" name="sort" value={x.sort} />
                  <button type="submit" className="mt-6 inline-flex min-h-12 w-full items-center justify-center bg-action px-6 text-ui text-paper">
                    {MOSAIKE.anwenden}
                  </button>
                </div>
              </details>
            )}
          </div>
          {mounted && (
            <FilterSheet
              sheetRef={sheetRef}
              titleId="ez-sheet-title"
              title={MOSAIKE.filterTitel}
              closeLabel={MOSAIKE.schliessen}
              onClose={() => triggerRef.current?.focus({ preventScroll: true })}
              footer={
                <>
                  {active > 0 && (
                    <button type="button" onClick={resetAll} className="min-h-12 px-2 text-small text-text underline underline-offset-4">
                      {MOSAIKE.zuruecksetzen}
                    </button>
                  )}
                  <button type="button" onClick={() => closeSheet(true)} className="inline-flex min-h-12 flex-1 items-center justify-center bg-action px-4 text-ui text-paper hover:bg-action-hover">
                    {MOSAIKE.anzeigen(results.length)}
                  </button>
                </>
              }
            >
              <FilterPanel {...panelProps} idPrefix="m" />
            </FilterSheet>
          )}
        </form>

        <div ref={resultsRef} className="mt-4 flex scroll-mt-[calc(var(--header-h)+3.5rem)] flex-wrap items-center justify-between gap-x-4 gap-y-2 md:mt-0">
          <p aria-live="polite" aria-atomic="true" className="text-ui text-text">
            {MOSAIKE.treffer(results.length)}
            {f.farbe && <span className="text-text-soft"> · {MOSAIKE.sortNaehe}</span>}
            {hiddenTypes > 0 && <span className="text-small text-text-soft"> · {MOSAIKE.weitereArten(hiddenTypes)}</span>}
          </p>
          <SortSelect id="ez-sort" value={x.sort} onChange={onSort} form={formD} />
        </div>
        {active > 0 && (
          <ul className="mt-3 flex flex-wrap gap-2" aria-label={t("Aktive Filter", "Active filters", "Filtres actifs", "Filtri attivi")}>
            {chips.map((c) => (
              <li key={`${c.key}-${c.v}`}>
                <button type="button" onClick={c.remove} className="inline-flex min-h-11 items-center gap-2 bg-surface-band px-3 text-small text-text hover:bg-stone-deep">
                  {c.swatch && <span aria-hidden="true" className="size-3 border border-line-strong bg-(--swatch)" style={{ "--swatch": c.swatch }} />}
                  {c.label}
                  <X aria-hidden="true" className="size-3.5" strokeWidth={1.5} />
                  <span className="sr-only">{t("Filter entfernen", "Remove filter", "Retirer le filtre", "Rimuovere il filtro")}</span>
                </button>
              </li>
            ))}
            <li>
              <button type="button" onClick={resetAll} className="min-h-11 px-2 text-small text-text underline underline-offset-4">
                {MOSAIKE.zuruecksetzen}
              </button>
            </li>
          </ul>
        )}

        {results.length === 0 ? (
          <div className="mt-10 max-w-measure border-t border-line pt-10">
            <h2 className="text-title text-text">{MOSAIKE.leer.title}</h2>
            <p className="mt-stack-s text-body text-text-soft">{MOSAIKE.leer.text}</p>
            <div className="mt-stack-m flex flex-col gap-3 sm:flex-row">
              {f.farbe && !looseColor && (
                <button type="button" onClick={() => setLooseColor(true)} className="inline-flex min-h-12 items-center justify-center border border-ink px-6 text-ui text-text hover:bg-action hover:text-paper">
                  {MOSAIKE.leer.aehnlich}
                </button>
              )}
              <Link href={LINKS.beratung} className="inline-flex min-h-12 items-center justify-center bg-action px-6 text-ui text-paper hover:bg-action-hover">
                {MOSAIKE.leer.anfrage}
              </Link>
            </div>
          </div>
        ) : (
          <>
            <ul className="mt-5 grid grid-cols-2 gap-x-grid gap-y-10 sm:grid-cols-3 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {visible.map((card, i) => (
                <li key={card.id} className="reveal" style={staggerStyle(i, 4)}>
                  <MosaicCard card={card} eager={i < 2} sizes="(min-width: 1280px) 18vw, (min-width: 1024px) 24vw, (min-width: 768px) 30vw, (min-width: 640px) 30vw, 46vw" />
                </li>
              ))}
            </ul>
            <p className="mt-6 text-small text-text-soft">
              {ezarriCredit("bild", locale)} · {ezarriCredit("daten", locale)}
            </p>
            {results.length > shown && (
              <div className="mt-10 flex flex-col items-center gap-2">
                <a href={nextHref} onClick={loadMore} className="inline-flex min-h-12 items-center border border-ink px-6 text-ui text-text hover:bg-action hover:text-paper">
                  {MOSAIKE.weitere(Math.min(PER_STEP, results.length - shown))}
                </a>
                <p className="text-small text-text-soft">
                  {visible.length} {t("von", "of", "sur", "di")} {results.length}
                </p>
              </div>
            )}
            {hiddenTypes > 0 && (
              <button type="button" onClick={() => apply({ ...f, typ: TYPEN.map((t) => t.id) })} className="mt-6 inline-flex min-h-11 items-center text-small text-text underline underline-offset-4">
                {MOSAIKE.alleArten}
              </button>
            )}
          </>
        )}
      </div>
      <CompareBar />
    </div>
  );
}
