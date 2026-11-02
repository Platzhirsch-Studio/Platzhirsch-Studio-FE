"use client";
import React, { Fragment, useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import dynamic from "next/dynamic";
import { useLocale, useTranslations } from "next-intl";
import { ArrowRight, ChevronDown, SlidersHorizontal, X } from "lucide-react";
import { localizeCategory } from "@/lib/seo/productCategories";
import { generateSlug } from "@/lib/slugify";
import {
  PAGE_PARAM,
  PRODUCTS_PER_PAGE,
  buildQuery as buildQueryOf,
  emptySelection as emptySelectionOf,
  pageFromQuery,
  queryObject,
  selectionFromQuery as selectionFromQueryOf,
} from "@/lib/shop/catalogQuery";
import { ROUTES, productsPath } from "@/utils/routing";
import Button from "@/components/ui/Button";
import Container from "@/components/ui/Container";
import Eyebrow from "@/components/ui/Eyebrow";
import Heading from "@/components/ui/Heading";
import CatalogTile from "@/components/ShopCatalog/catalogTile";
import { staggerStyle } from "@/components/ShopCatalog/motion";
import TileImage from "@/components/ShopCatalog/tileImage";
import { withFallback } from "@/components/ShopCatalog/copy";
import { noPhotoLabel } from "@/lib/shop/noPhoto";
import { useDelegatedNavigation } from "@/components/Reusable/LinkDelegate";

// Catalogue of one category (Neuauftritt "ruhige Galerie", Bibel §6/§10):
// max. 3 columns of uncropped 3:2 tiles, a full-width room picture after
// every 6 tiles (2-column phones) or 9 tiles (3-column desktop), a quiet
// filter bar on top and every filter in one <dialog> sheet (./filterSheet.js).
// The whole category is loaded (filters and counts need every product); the
// grid reveals it in batches of 24. Server-rendered on first paint, so the
// first batch is in the HTML for crawlers; the page's JSON-LD lists the rest.

// QA Runde 1 (P1-1): filter state and the "show more" step live in the URL
// (?marke=minotti&typ=modulsofa&seite=2, values are slugs, several values
// comma-separated). Written with history.replaceState (no refetch, no
// scroll) – so "filter → product → back" returns to the same tiles and the
// browser's scroll restoration lands on the same tile. "Mehr Produkte
// anzeigen" is a real ?seite=n+1 link. Canonical stays the plain category
// (generateMetadata never includes the query).
//
// R6-produkt-perf (TBT /de/produkte/lamps 460 ms mobile):
// - The query is read with useSyncExternalStore (server snapshot ""), no
//   longer through useSearchParams inside <Suspense>. useSearchParams made the
//   prerendered page bail out to client rendering: the server HTML of the
//   catalogue was thrown away and all tiles were created again in the
//   browser during load. Now the server HTML is hydrated as it is; a query
//   (?marke=… from a brand page) is applied in the render right after
//   hydration, and on a client-side navigation already in the first render.
// - The filter sheet is its own chunk (next/dynamic), mounted on the first
//   click; hover/focus on a filter button fetches it ahead.
// - Tiles are plain <a>/<img> (catalogTile.js); one delegated listener on the
//   grid keeps client navigation and hover/focus prefetch.

// Filters whose options come straight off the product list itself.
// `param` = query parameter name (German, like the paths).
const FILTER_GROUPS = [
  { key: "brand", param: "marke", field: "brand", labelKey: "brand" },
  { key: "category", param: "kategorie", field: "categoryKey", labelKey: "category", localize: (k, locale) => localizeCategory(k, locale) },
  { key: "subCategory", param: "typ", cms: true, labelKey: "subCategory", getValues: (p) => p.subCategoryKeys || [] },
  { key: "material", param: "material", cms: true, labelKey: "material", getValues: (p) => p.materialKeys || [] },
  { key: "color", param: "farbe", cms: true, labelKey: "color", getValues: (p) => p.colorKeys || [], swatch: true },
  { key: "designer", param: "designer", field: "designer", labelKey: "designer" },
  { key: "indoorOutdoor", param: "bereich", field: "indoorOutdoor", labelKey: "indoorOutdoor" },
];
const OWN_PARAMS = [...FILTER_GROUPS.map((g) => g.param), PAGE_PARAM];
// Option LISTS of the cms groups come from CMS doctypes (Sub Kategorie /
// Produkte Farbe / Produkte Material, see the *Options props), counts are
// computed live against the products.

// Shown directly in the bar on desktop; the rest sits behind "Alle Filter".
const BAR_GROUPS = 4;
const INTERLUDE_MOBILE = 6;
const INTERLUDE_DESKTOP = 9;

const emptySelection = () => emptySelectionOf(FILTER_GROUPS);
// URL → selection for the groups that have options (src/lib/shop/catalogQuery.js).
const selectionFromQuery = (query, groups) => selectionFromQueryOf(query, groups, FILTER_GROUPS);
const buildQuery = (baseSearch, groups, selected, page) => buildQueryOf(baseSearch, groups, selected, page, OWN_PARAMS);

function buildFieldOptions(products, group, locale, labels = null) {
  const counts = new Map();
  for (const p of products) {
    const raw = p[group.field];
    if (!raw) continue;
    counts.set(raw, (counts.get(raw) || 0) + 1);
  }
  return [...counts.entries()]
    .map(([value, count]) => ({ value, count, label: labels?.[value] || (group.localize ? group.localize(value, locale) : value) }))
    .sort((a, b) => a.label.localeCompare(b.label));
}

// The page's query string without subscribing to Next's router: "" on the
// server and while hydrating (= the prerendered HTML), the real one after.
// The catalogue writes its own state with replaceState and never needs to
// re-read it, so there is nothing to subscribe to.
const noSubscribe = () => () => {};
const readSearch = () => window.location.search;
const serverSearch = () => "";
function useLocationSearch() {
  return useSyncExternalStore(noSubscribe, readSearch, serverSearch);
}

const loadFilterSheet = () => import("@/components/ShopCatalog/filterSheet");
const FilterSheet = dynamic(loadFilterSheet, { ssr: false });

// LinkArrow look as a plain <a> (the grid delegates the navigation).
function ArrowLink({ href, children, className = "" }) {
  return (
    <a
      href={href}
      className={`group inline-flex min-h-11 items-center gap-2 text-ui text-text underline decoration-transparent underline-offset-4 transition-colors duration-(--duration-micro) hover:decoration-current ${className}`}
    >
      <span>{children}</span>
      <ArrowRight aria-hidden="true" className="ph-arrow size-4 shrink-0" strokeWidth={1.5} />
    </a>
  );
}

// Room picture between the tiles. Only a picture of the category itself
// (QA P2-7: never a room from another category); without one the pause is a
// quiet text band.
function Interlude({ image, eyebrow, text, linkLabel, linkHref, className = "" }) {
  if (!image) {
    return (
      <li className={`col-span-full border-y border-line py-10 lg:py-14 ${className}`}>
        <div className="max-w-text">
          <Eyebrow className="mb-stack-s">{eyebrow}</Eyebrow>
          <p className="max-w-measure text-title text-text">{text}</p>
          <ArrowLink href={linkHref} className="mt-4">
            {linkLabel}
          </ArrowLink>
        </div>
      </li>
    );
  }
  return (
    <li className={`col-span-full py-8 lg:py-12 ${className}`}>
      <figure className="grid items-end gap-6 lg:grid-cols-12 lg:gap-grid">
        <div className="relative aspect-[3/2] overflow-hidden bg-linen lg:col-span-8 lg:aspect-[21/9]">
          <TileImage src={image} alt="" sizes="(min-width: 1024px) 66vw, 100vw" className="object-cover" />
        </div>
        <figcaption className="lg:col-span-4 lg:pb-2">
          <Eyebrow className="mb-stack-s">{eyebrow}</Eyebrow>
          <p className="max-w-measure text-title text-text">{text}</p>
          <ArrowLink href={linkHref} className="mt-4">
            {linkLabel}
          </ArrowLink>
        </figcaption>
      </figure>
    </li>
  );
}

const ShopCatalog = ({
  products,
  excludeGroups = [],
  subCategoryOptions = [],
  colorOptions = [],
  materialOptions = [],
  basePath = null,
  interludeImages = [],
  // Herstellerkatalog (Inhaber 31.10.2026: /kuechengeraete/produkte in der
  // Ansicht der Küchen-Kategorie). Alles optional, ohne Angabe unverändert:
  // categoryLabels {key: Label} statt localizeCategory(), tileFit "contain"
  // (Herstellerbild unverändert), wishlist=false (Katalog hat eigenes Merken),
  // interlude {eyebrow, texts[], link, href} statt der Sofa-Texte.
  // Produkte dürfen href (ohne Locale), meta und price fertig mitbringen.
  categoryLabels = null,
  tileFit = "cover",
  wishlist = true,
  interlude = null,
}) => {
  const t = useTranslations("shop");
  const locale = useLocale();
  const tc = withFallback(t, locale, "shop");
  // R5-produkt: hint on tiles without a photo (messages first, module fallback).
  const noPhotoText = noPhotoLabel(locale, t);
  const delegate = useDelegatedNavigation();

  const cmsOptionsByKey = { subCategory: subCategoryOptions, color: colorOptions, material: materialOptions };

  // Every filter group that actually decides something (≥ 2 options with
  // products), with live counts.
  const groups = useMemo(() => {
    return FILTER_GROUPS.filter((g) => !excludeGroups.includes(g.key))
      .map((g) => {
        let options;
        if (g.cms) {
          const counts = new Map();
          for (const p of products) for (const v of g.getValues(p)) counts.set(v, (counts.get(v) || 0) + 1);
          options = (cmsOptionsByKey[g.key] || []).map((o) => ({ ...o, count: counts.get(o.value) || 0 }));
        } else {
          options = buildFieldOptions(products, g, locale, g.key === "category" ? categoryLabels : null);
        }
        return { ...g, title: t(g.labelKey), options: options.filter((o) => o.count > 0) };
      })
      .filter((g) => g.options.length >= 2);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [products, excludeGroups, subCategoryOptions, colorOptions, materialOptions, locale, categoryLabels]);

  // Until the visitor filters or pages, the state IS the URL (empty while
  // hydrating, so the server HTML matches); afterwards it is local state that
  // is written back to the URL.
  const search = useLocationSearch();
  const fromUrl = useMemo(() => {
    const query = queryObject(search);
    return { selected: selectionFromQuery(query, groups), visibleCount: PRODUCTS_PER_PAGE * pageFromQuery(query) };
  }, [search, groups]);
  const [own, setOwn] = useState(null);
  const selected = own ? own.selected : fromUrl.selected;
  const visibleCount = own ? own.visibleCount : fromUrl.visibleCount;
  const setSelected = (update) =>
    setOwn((prev) => {
      const base = prev || fromUrl;
      return { selected: update(base.selected), visibleCount: PRODUCTS_PER_PAGE };
    });
  const setVisibleCount = (update) =>
    setOwn((prev) => {
      const base = prev || fromUrl;
      return { ...base, visibleCount: update(base.visibleCount) };
    });

  // Filter sheet: null until the first open, then { groupKey, n }.
  const [sheetRequest, setSheetRequest] = useState(null);
  const gridRef = useRef(null);
  const focusIndexRef = useRef(null);
  const triggerRef = useRef(null);
  const page = Math.max(1, Math.ceil(visibleCount / PRODUCTS_PER_PAGE));

  // Own state → URL (replace, not push: filtering is no new history entry).
  useEffect(() => {
    if (!own) return;
    const next = buildQuery(window.location.search, groups, own.selected, Math.max(1, Math.ceil(own.visibleCount / PRODUCTS_PER_PAGE)));
    if (next === window.location.search) return;
    window.history.replaceState(window.history.state, "", `${window.location.pathname}${next}${window.location.hash}`);
  }, [own, groups]);

  // "Show more": move focus onto the first newly revealed tile.
  useEffect(() => {
    const index = focusIndexRef.current;
    if (index == null) return;
    focusIndexRef.current = null;
    gridRef.current?.querySelector(`[data-card-index="${index}"]`)?.focus({ preventScroll: true });
  }, [visibleCount]);

  const toggleValue = (groupKey, value) => {
    setSelected((prev) => {
      const next = new Set(prev[groupKey]);
      if (next.has(value)) next.delete(value);
      else next.add(value);
      return { ...prev, [groupKey]: next };
    });
  };

  const clearAll = () => setSelected(() => emptySelection());

  const filteredProducts = useMemo(() => {
    return products.filter((p) =>
      groups.every((g) => {
        const chosen = selected[g.key];
        if (!chosen || chosen.size === 0) return true;
        return g.cms ? g.getValues(p).some((v) => chosen.has(v)) : chosen.has(p[g.field]);
      })
    );
  }, [products, groups, selected]);

  const activeChips = useMemo(() => {
    const chips = [];
    for (const g of groups) {
      for (const value of selected[g.key]) {
        const opt = g.options.find((o) => o.value === value);
        chips.push({ groupKey: g.key, value, label: opt ? opt.label : value });
      }
    }
    return chips;
  }, [groups, selected]);

  // Remember the opener: WebKit doesn't focus tapped buttons, so the native
  // focus return of <dialog> would land on <main> (QA P2-8).
  const openFilters = (groupKey, trigger) => {
    triggerRef.current = trigger || null;
    setSheetRequest((prev) => ({ groupKey, n: (prev?.n || 0) + 1 }));
  };
  const onFiltersClosed = () => {
    const trigger = triggerRef.current;
    if (trigger && trigger.isConnected) window.setTimeout(() => trigger.focus({ preventScroll: true }), 0);
  };
  const warmFilters = () => {
    loadFilterSheet();
  };

  const consultationHref = ROUTES.beratung[locale] || "/beratung";
  const showCategory = !excludeGroups.includes("category");
  const categoryLabel = (key) => categoryLabels?.[key] || localizeCategory(key, locale);

  if (products.length === 0) {
    return (
      <Container className="pb-section">
        <div className="border-t border-line pt-16">
          <Heading level={2} size="display-m">
            {tc("catalog.emptyTitle")}
          </Heading>
          <p className="mt-stack-m max-w-measure text-body text-text-soft">{t("emptyCategory")}</p>
          <Button href={consultationHref} arrow className="mt-stack-m">
            {t("requestConsultation")}
          </Button>
        </div>
      </Container>
    );
  }

  const visibleProducts = filteredProducts.slice(0, visibleCount);
  const remainingCount = filteredProducts.length - visibleProducts.length;
  const showMore = (e) => {
    // A real link (?seite=n+1) for crawlers, no-JS and "open in new tab";
    // a plain click reveals the next batch in place.
    if (e && (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button === 1)) return;
    e?.preventDefault();
    focusIndexRef.current = visibleProducts.length;
    setVisibleCount((n) => n + PRODUCTS_PER_PAGE);
  };
  const nextPageHref = basePath ? `${basePath}${buildQuery("", groups, selected, page + 1)}` : null;

  const interludeTexts = interlude?.texts?.length ? interlude.texts : [tc("catalog.interlude1"), tc("catalog.interlude2"), tc("catalog.interlude3")];
  const interludeEyebrow = interlude?.eyebrow || tc("catalog.interludeEyebrow");
  const interludeLink = interlude?.link || tc("catalog.interludeLink");
  // Each room picture once per viewport (Abnahme R3: both pauses showed the
  // same photo); every later pause is a text band.
  const interludeAt = (ordinal) => ({
    image: interludeImages[ordinal] || null,
    eyebrow: interludeEyebrow,
    text: interludeTexts[ordinal % interludeTexts.length],
    linkLabel: interludeLink,
    linkHref: interlude?.href || `/${locale}${consultationHref}`,
  });

  return (
    <Container className="pb-section">
      {/* Filter bar */}
      <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-3 border-y border-line py-3">
        <div className="flex flex-wrap items-center gap-x-1 gap-y-1" onPointerOver={warmFilters} onFocus={warmFilters}>
          {groups.slice(0, BAR_GROUPS).map((g) => (
            <button
              key={g.key}
              type="button"
              onClick={(e) => openFilters(g.key, e.currentTarget)}
              aria-haspopup="dialog"
              aria-label={tc("catalog.filterGroup", { group: g.title })}
              className="ph-press hidden min-h-11 items-center gap-2 px-3 text-ui text-text transition-colors duration-(--duration-micro) hover:bg-ink/5 lg:inline-flex"
            >
              {g.title}
              {selected[g.key].size > 0 && <span className="tabular text-small text-text-soft">({selected[g.key].size})</span>}
              <ChevronDown aria-hidden="true" className="size-4" strokeWidth={1.5} />
            </button>
          ))}
          {groups.length > 0 && (
            <button
              type="button"
              onClick={(e) => openFilters(null, e.currentTarget)}
              aria-haspopup="dialog"
              className="ph-press inline-flex min-h-11 items-center gap-2 border border-ink px-4 text-ui text-text transition-colors duration-(--duration-micro) hover:bg-action hover:text-paper lg:ml-2"
            >
              <SlidersHorizontal aria-hidden="true" className="size-4" strokeWidth={1.5} />
              {tc("catalog.allFilters")}
              {activeChips.length > 0 && <span className="tabular">({activeChips.length})</span>}
            </button>
          )}
        </div>
        {/* Motion-Runde: a changed count re-mounts its span, which arrives
            0.6 → 1 opacity in --duration-ui (.ph-arrive, @starting-style; still
            under reduced motion). The live region itself stays mounted. */}
        <p className="tabular text-small text-text-soft" aria-live="polite">
          <span key={filteredProducts.length} className="ph-arrive">
            {t("resultsCount", { count: filteredProducts.length })}
          </span>
        </p>
      </div>

      {activeChips.length > 0 && (
        <div className="mt-4 flex flex-wrap items-center gap-2" role="group" aria-label={tc("catalog.activeFilters")}>
          {activeChips.map((chip) => (
            <button
              key={`${chip.groupKey}-${chip.value}`}
              type="button"
              onClick={() => toggleValue(chip.groupKey, chip.value)}
              aria-label={tc("catalog.removeFilter", { label: chip.label })}
              className="ph-press inline-flex min-h-11 items-center gap-2 bg-surface-band px-3 text-small text-text transition-colors duration-(--duration-micro) hover:bg-stone-deep"
            >
              <span className="first-letter:uppercase">{chip.label}</span>
              <X aria-hidden="true" className="size-3.5" strokeWidth={1.5} />
            </button>
          ))}
          <button
            type="button"
            onClick={clearAll}
            className="inline-flex min-h-11 items-center px-2 text-small text-text underline decoration-line-strong underline-offset-4 hover:decoration-current"
          >
            {t("clearAll")}
          </button>
        </div>
      )}

      {filteredProducts.length === 0 ? (
        <div className="py-24">
          <p className="text-title text-text">{tc("catalog.noResultsTitle")}</p>
          <Button variant="secondary" onClick={clearAll} className="mt-stack-m">
            {t("clearAll")}
          </Button>
        </div>
      ) : (
        <>
          <ul
            ref={gridRef}
            {...delegate}
            className="reveal-group mt-6 grid grid-cols-1 gap-x-grid gap-y-12 sm:mt-10 sm:grid-cols-2 lg:mt-14 lg:grid-cols-3 lg:gap-y-16"
          >
            {visibleProducts.map((p, index) => {
              const n = index + 1;
              const isLast = n === visibleProducts.length;
              const mobileBreak = n % INTERLUDE_MOBILE === 0 && !isLast;
              const desktopBreak = n % INTERLUDE_DESKTOP === 0 && !isLast;
              return (
                <Fragment key={p.id}>
                  <li style={staggerStyle(index)}>
                    <CatalogTile
                      href={p.href || productsPath(locale, generateSlug(p.categoryKey), p.url_slug)}
                      locale={locale}
                      image={p.image}
                      alt={`${p.brand} ${p.name}`}
                      brand={p.brand}
                      name={p.name}
                      meta={p.designer ? tc("catalog.designBy", { designer: p.designer }) : showCategory ? categoryLabel(p.categoryKey) : null}
                      price={p.price || null}
                      fit={tileFit}
                      wishlistProduct={wishlist ? { ...p, href: productsPath("de", generateSlug(p.categoryKey), p.url_slug) } : null}
                      cardIndex={index}
                      eager={index < 3}
                      noPhotoText={noPhotoText}
                      sizes="(min-width: 1440px) 420px, (min-width: 1024px) 30vw, (min-width: 640px) 46vw, 92vw"
                    />
                  </li>
                  {mobileBreak && desktopBreak ? (
                    <Interlude {...interludeAt(n / INTERLUDE_MOBILE - 1)} />
                  ) : (
                    <>
                      {mobileBreak && <Interlude {...interludeAt(n / INTERLUDE_MOBILE - 1)} className="lg:hidden" />}
                      {desktopBreak && <Interlude {...interludeAt(n / INTERLUDE_DESKTOP - 1)} className="hidden lg:block" />}
                    </>
                  )}
                </Fragment>
              );
            })}
          </ul>

          {filteredProducts.length > PRODUCTS_PER_PAGE && (
            <div className="mt-20 flex flex-col items-center gap-4">
              <p className="tabular text-small text-text-soft" aria-live="polite">
                {t("showingCount", { shown: visibleProducts.length, total: filteredProducts.length })}
              </p>
              {/* Progress as scaleX (transform only, no layout); grows in
                  --duration-ui after "show more", instant under reduced motion. */}
              <div className="h-px w-48 max-w-full overflow-hidden bg-line" aria-hidden="true">
                <div
                  className="h-px w-full origin-left bg-ink motion-safe:transition-transform motion-safe:duration-(--duration-ui) motion-safe:ease-quiet"
                  style={{ transform: `scaleX(${Math.min(1, visibleProducts.length / filteredProducts.length)})` }}
                />
              </div>
              {remainingCount > 0 &&
                (nextPageHref ? (
                  <a
                    href={nextPageHref}
                    onClick={showMore}
                    className="ph-press mt-2 inline-flex min-h-12 w-full items-center justify-center border border-ink px-6 text-ui text-text transition-colors duration-(--duration-micro) ease-quiet hover:bg-action hover:text-paper focus-visible:bg-action focus-visible:text-paper sm:w-auto lg:min-h-13 lg:px-7"
                  >
                    {t("showMoreProducts")}
                  </a>
                ) : (
                  <Button variant="secondary" onClick={showMore} className="mt-2 w-full sm:w-auto">
                    {t("showMoreProducts")}
                  </Button>
                ))}
            </div>
          )}
        </>
      )}

      {/* Filter sheet: right-hand sheet on desktop, full screen on phones;
          mounted on the first click only (own chunk). */}
      {groups.length > 0 && sheetRequest && (
        <FilterSheet
          request={sheetRequest}
          groups={groups}
          selected={selected}
          onToggle={toggleValue}
          onClearAll={clearAll}
          onClosed={onFiltersClosed}
          resultCount={filteredProducts.length}
          activeCount={activeChips.length}
          t={t}
          tc={tc}
        />
      )}
    </Container>
  );
};

export default ShopCatalog;
