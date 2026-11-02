"use client";
// Filter der Galerie (Konzept §3.6, QM Runde 2 P2-4): dasselbe Bedienkonzept
// wie /ezarri/mosaike.
//   ab md   eine kompakte Zeile: Einsatz und Wasserfarbe als Chips, der Rest
//           unter „Weitere Filter“
//   unter md Knopf „Filter (n)“ → Bottom-Sheet (FilterSheet, geteilt mit der
//           Mosaik-Übersicht) mit „n Bilder anzeigen“
// Jede Änderung wirkt sofort: optimistischer Zustand (useOptimistic) und
// router.replace auf Seite 1 der gefilterten Galerie (URL-State, teilbar).
// Ohne Javascript: normales GET-Formular, mobil im <details>, mit Knopf
// „Filter anwenden“ (nur dann sichtbar).
import { useId, useOptimistic, useRef, useSyncExternalStore, useTransition } from "react";
import { SlidersHorizontal, X } from "lucide-react";
import { useLocale } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { countActiveFilters, facetsFor, serializeFilters } from "@/lib/ezarri/facets";
import { GALERIE as GALERIE_DE, MOSAIKE as MOSAIKE_DE } from "@/lib/ezarri/copy";
import { GALERIE as GALERIE_EN, MOSAIKE as MOSAIKE_EN } from "@/lib/ezarri/copy.en";
import { GALERIE as GALERIE_FR, MOSAIKE as MOSAIKE_FR } from "@/lib/ezarri/copy.fr";
import { GALERIE as GALERIE_IT, MOSAIKE as MOSAIKE_IT } from "@/lib/ezarri/copy.it";
import { ezT } from "@/lib/ezarri/werte";

const GAL_COPY = { de: [GALERIE_DE, MOSAIKE_DE], en: [GALERIE_EN, MOSAIKE_EN], fr: [GALERIE_FR, MOSAIKE_FR], it: [GALERIE_IT, MOSAIKE_IT] };
import { Chip, ChipGroup, FilterSheet } from "./FilterSheet";

/** Texte und Filterlisten in der Sprache der Seite (Welle 2: de/en). */
function useGalerie() {
  const locale = useLocale();
  const en = locale === "en";
  const [GALERIE, MOSAIKE] = GAL_COPY[locale] ?? GAL_COPY.de;
  // t(de, en, fr, it) wie ezT (werte.js); 01.11.2026: fr/it.
  return { en, t: ezT(locale), GALERIE, MOSAIKE, GAL_EINSATZ: GALERIE.einsatz, ...facetsFor(locale) };
}

const noopSubscribe = () => () => {};
const toggle = (list = [], v) => (list.includes(v) ? list.filter((x) => x !== v) : [...list, v]);
const clean = (f) => Object.fromEntries(Object.entries(f).filter(([, v]) => !(v === undefined || v === false || (Array.isArray(v) && !v.length))));

function Panel({ f, counts, kollektionen, onToggle, onFlag, split = false }) {
  const { GAL_EINSATZ, WASSERWIRKUNG, FARBFAMILIEN, FORMATE, MOSAIKE, t } = useGalerie();
  const c = (key, id) => counts?.[key]?.[id];
  const has = (key, id) => (f[key] || []).includes(id);
  const main = (
    <>
      <ChipGroup legend={t("Einsatz", "Application", "Utilisation", "Impiego")}>
        {GAL_EINSATZ.map((e) => (
          <Chip key={e.id} name="einsatz" value={e.id} checked={has("einsatz", e.id)} onChange={onToggle("einsatz", e.id)} count={c("einsatz", e.id)}>
            {e.label}
          </Chip>
        ))}
      </ChipGroup>
      <ChipGroup legend={t("Wasserfarbe", "Water colour", "Couleur de l’eau", "Colore dell’acqua")}>
        {WASSERWIRKUNG.map((w) => (
          <Chip key={w.id} name="wasser" value={w.id} checked={has("wasser", w.id)} onChange={onToggle("wasser", w.id)} count={c("wasser", w.id)}>
            {w.label}
          </Chip>
        ))}
      </ChipGroup>
    </>
  );
  const more = (
    <>
      <ChipGroup legend={t("Kollektion", "Collection", "Collection", "Collezione")}>
        {kollektionen.map((k) => (
          <Chip key={k.id} name="kollektion" value={k.id} checked={has("kollektion", k.id)} onChange={onToggle("kollektion", k.id)} count={c("kollektion", k.id)}>
            {k.name}
          </Chip>
        ))}
      </ChipGroup>
      <ChipGroup legend={t("Farbe des Mosaiks", "Mosaic colour", "Couleur de la mosaïque", "Colore del mosaico")}>
        {FARBFAMILIEN.map((x) => (
          <Chip key={x.id} name="farbfamilie" value={x.id} swatch={x.swatch} checked={has("farbfamilie", x.id)} onChange={onToggle("farbfamilie", x.id)} count={c("farbfamilie", x.id)}>
            {x.label}
          </Chip>
        ))}
      </ChipGroup>
      <ChipGroup legend="Format">
        {FORMATE.map((x) => (
          <Chip key={x.id} name="format" value={x.id} checked={has("format", x.id)} onChange={onToggle("format", x.id)} count={c("format", x.id)}>
            {x.label}
          </Chip>
        ))}
      </ChipGroup>
      <ChipGroup legend={t("Ausführung", "Version", "Version", "Versione")}>
        <Chip name="safe" value="1" checked={Boolean(f.safe)} onChange={onFlag("safe")} count={counts?.safe}>
          {t("Rutschhemmend (Safe)", "Slip-resistant (Safe)", "Antidérapant (Safe)", "Antiscivolo (Safe)")}
        </Chip>
        <Chip name="spezial" value="1" checked={Boolean(f.spezial)} onChange={onFlag("spezial")} count={counts?.spezial}>
          {t("Mit Corner oder Cove", "With Corner or Cove", "Avec Corner ou Cove", "Con Corner o Cove")}
        </Chip>
      </ChipGroup>
    </>
  );
  if (!split) {
    return (
      <div className="flex flex-col gap-6">
        {main}
        {more}
      </div>
    );
  }
  const open = Boolean(f.kollektion || f.farbfamilie || f.format || f.safe || f.spezial);
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap gap-x-8 gap-y-4">{main}</div>
      <details className="group" open={open || undefined}>
        <summary className="inline-flex min-h-11 cursor-pointer list-none items-center gap-2 text-ui text-text [&::-webkit-details-marker]:hidden">
          <SlidersHorizontal aria-hidden="true" className="size-4" strokeWidth={1.5} />
          {MOSAIKE.mehrFilter}
          <span className="sr-only">{t("(Kollektion, Farbe, Format, Ausführung)", "(collection, colour, format, version)", "(collection, couleur, format, version)", "(collezione, colore, formato, versione)")}</span>
        </summary>
        <div className="mt-3 flex flex-col gap-5">{more}</div>
      </details>
    </div>
  );
}

/**
 * @param {object} filters aktive Filter (facets.parseFilters)
 * @param {{id,name}[]} kollektionen
 * @param {object} counts data.galleryFacetCounts()
 * @param {number} total Treffer (nur Fotos)
 * @param {number} videos Anzahl passender Produktvideos (0 → kein Link)
 * @param {string} action GET-Ziel ohne JS
 */
export default function GalleryFilters({ filters = {}, kollektionen = [], counts, total = 0, videos = 0, action }) {
  const { GALERIE, MOSAIKE, GAL_EINSATZ, WASSERWIRKUNG, FARBFAMILIEN, FORMATE, t } = useGalerie();
  const router = useRouter();
  const [pending, start] = useTransition();
  const [f, setOptimistic] = useOptimistic(filters);
  const mounted = useSyncExternalStore(noopSubscribe, () => true, () => false);
  const sheetRef = useRef(null);
  const triggerRef = useRef(null);
  const uid = useId().replace(/[^a-z0-9]/gi, "");
  const active = countActiveFilters(f);

  const go = (next) => {
    const n = clean(next);
    const qs = serializeFilters(n).replace(/%2C/g, ",");
    start(() => {
      setOptimistic(n);
      router.replace(`/ezarri/galerie${qs ? `?${qs}` : ""}`, { scroll: false });
    });
  };
  const onToggle = (key, id) => () => go({ ...f, [key]: toggle(f[key], id) });
  const onFlag = (key) => (e) => go({ ...f, [key]: e.target.checked || undefined });
  const reset = () => go({});

  const panel = { f, counts, kollektionen, onToggle, onFlag };
  const chips = [];
  const label = (key, id) =>
    key === "einsatz"
      ? GAL_EINSATZ.find((e) => e.id === id)?.label
      : key === "wasser"
        ? WASSERWIRKUNG.find((w) => w.id === id)?.label
        : key === "kollektion"
          ? kollektionen.find((k) => k.id === id)?.name
          : key === "farbfamilie"
            ? FARBFAMILIEN.find((x) => x.id === id)?.label
            : FORMATE.find((x) => x.id === id)?.label;
  for (const key of ["einsatz", "wasser", "kollektion", "farbfamilie", "format"]) {
    for (const id of f[key] || []) chips.push({ k: `${key}-${id}`, label: label(key, id) ?? id, remove: () => go({ ...f, [key]: f[key].filter((x) => x !== id) }) });
  }
  if (f.safe) chips.push({ k: "safe", label: t("Rutschhemmend", "Slip-resistant", "Antidérapant", "Antiscivolo"), remove: () => go({ ...f, safe: undefined }) });
  if (f.spezial) chips.push({ k: "spezial", label: t("Mit Corner oder Cove", "With Corner or Cove", "Avec Corner ou Cove", "Con Corner o Cove"), remove: () => go({ ...f, spezial: undefined }) });

  const count = (
    <p aria-live="polite" aria-atomic="true" className="text-ui text-text">
      {pending ? GALERIE.laedt : GALERIE.treffer(total)}
    </p>
  );
  const videoLink =
    videos > 0 ? (
      <a href="#ez-videos" className="inline-flex min-h-11 items-center text-small text-text underline underline-offset-4">
        {GALERIE.videos.link(videos)}
      </a>
    ) : null;

  return (
    <div aria-busy={pending || undefined}>
      {/* Desktop/Tablet: kompakte Zeile */}
      <form action={action} method="get" aria-label={GALERIE.filterTitel} onSubmit={(e) => mounted && e.preventDefault()} className="hidden border-y border-line py-5 md:block">
        <Panel {...panel} split />
        {!mounted && (
          <button type="submit" className="mt-4 inline-flex min-h-12 items-center border border-ink px-6 text-ui text-text">
            {MOSAIKE.anwenden}
          </button>
        )}
      </form>

      {/* Mobil: Knopf + Bottom-Sheet; ohne JS ein <details> mit GET-Formular */}
      <form action={action} method="get" aria-label={`${GALERIE.filterTitel} (${t("mobil", "mobile", "mobile", "mobile")})`} onSubmit={(e) => mounted && e.preventDefault()} className="md:hidden">
        <div className="flex items-center justify-between gap-3">
          {mounted ? (
            <button
              ref={triggerRef}
              type="button"
              onClick={() => sheetRef.current?.showModal()}
              aria-haspopup="dialog"
              className="inline-flex min-h-12 shrink-0 items-center gap-2 border border-ink px-4 text-ui text-text hover:bg-action hover:text-paper"
            >
              <SlidersHorizontal aria-hidden="true" className="size-4" strokeWidth={1.5} />
              {MOSAIKE.filterKnopf(active)}
            </button>
          ) : (
            <details className="w-full">
              <summary className="inline-flex min-h-12 cursor-pointer list-none items-center gap-2 border border-ink px-4 text-ui text-text [&::-webkit-details-marker]:hidden">
                <SlidersHorizontal aria-hidden="true" className="size-4" strokeWidth={1.5} />
                {MOSAIKE.filterKnopf(active)}
              </summary>
              <div className="mt-3 border border-line bg-surface p-4">
                <Panel {...panel} />
                <button type="submit" className="mt-6 inline-flex min-h-12 w-full items-center justify-center bg-action px-6 text-ui text-paper">
                  {MOSAIKE.anwenden}
                </button>
              </div>
            </details>
          )}
          {mounted && (
            <div className="flex flex-col items-end text-right">
              {count}
              {videoLink && <div className="-mt-2">{videoLink}</div>}
            </div>
          )}
        </div>
        {mounted && (
          <FilterSheet
            sheetRef={sheetRef}
            titleId={`ez-gsheet-${uid}`}
            title={GALERIE.filterTitel}
            closeLabel={MOSAIKE.schliessen}
            onClose={() => triggerRef.current?.focus({ preventScroll: true })}
            footer={
              <>
                {active > 0 && (
                  <button type="button" onClick={reset} className="min-h-12 px-2 text-small text-text underline underline-offset-4">
                    {MOSAIKE.zuruecksetzen}
                  </button>
                )}
                <button type="button" onClick={() => sheetRef.current?.close()} className="inline-flex min-h-12 flex-1 items-center justify-center bg-action px-4 text-ui text-paper hover:bg-action-hover">
                  {pending ? GALERIE.laedt : GALERIE.anzeigen(total)}
                </button>
              </>
            }
          >
            <Panel {...panel} />
          </FilterSheet>
        )}
      </form>

      <div className={`mt-4 flex flex-wrap items-center justify-between gap-x-4 gap-y-2 ${mounted ? "max-md:hidden" : ""}`}>
        {count}
        {videoLink}
      </div>
      {chips.length > 0 && (
        <ul className="mt-3 flex flex-wrap gap-2" aria-label={t("Aktive Filter", "Active filters", "Filtres actifs", "Filtri attivi")}>
          {chips.map((c) => (
            <li key={c.k}>
              <button type="button" onClick={c.remove} className="inline-flex min-h-11 items-center gap-2 bg-surface-band px-3 text-small text-text hover:bg-stone-deep">
                {c.label}
                <X aria-hidden="true" className="size-3.5" strokeWidth={1.5} />
                <span className="sr-only">{t("Filter entfernen", "Remove filter", "Retirer le filtre", "Rimuovere il filtro")}</span>
              </button>
            </li>
          ))}
          <li>
            <button type="button" onClick={reset} className="min-h-11 px-2 text-small text-text underline underline-offset-4">
              {MOSAIKE.zuruecksetzen}
            </button>
          </li>
        </ul>
      )}
    </div>
  );
}
