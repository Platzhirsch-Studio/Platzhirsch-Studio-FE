"use client";
import React, { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import { Link } from "@/i18n/navigation";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { getLocaleFromPath } from "@/utils/getLocaleFromPath";
import { ChevronDown, X, SlidersHorizontal } from "lucide-react";
import { localizeCategory } from "@/lib/seo/productCategories";
import { generateSlug } from "@/lib/slugify";
import { ROUTES, productsPath } from "@/utils/routing";
import WishlistHeart from "@/components/ShopCatalog/wishlistHeart";

// Filters whose options come straight off the product list itself — brand
// (marken), category (its own kategories Link value), indoor/outdoor, and
// designer (a plain Link field, unlike color/material/subCategory below —
// real bulk data, not gated on a per-product detail fetch).
const FILTER_GROUPS = [
  { key: "brand", field: "brand", labelKey: "brand" },
  { key: "category", field: "categoryKey", labelKey: "category", localize: (k, locale) => localizeCategory(k, locale) },
  { key: "indoorOutdoor", field: "indoorOutdoor", labelKey: "indoorOutdoor" },
  { key: "designer", field: "designer", labelKey: "designer" },
];

// Filters whose option LIST comes from a CMS doctype instead (Sub Kategorie /
// Produkte Farbe / Produkte Material — see the *Options props below), not
// from counting products — otherwise a filter would simply never appear
// until a product happened to already be tagged with that value. Live counts
// are still computed against the current product list once the section
// renders. All three are Table MultiSelect fields on Produkte New (a product
// can have more than one color/material/subcategory), hence the arrays.
const CMS_FILTER_GROUPS = [
  { key: "subCategory", labelKey: "subCategory", getValues: (p) => p.subCategoryKeys || [] },
  { key: "color", labelKey: "color", getValues: (p) => p.colorKeys || [], swatch: true },
  { key: "material", labelKey: "material", getValues: (p) => p.materialKeys || [] },
];

const EMPTY_SELECTION = {
  brand: new Set(), category: new Set(), indoorOutdoor: new Set(), designer: new Set(),
  subCategory: new Set(), color: new Set(), material: new Set(),
};

const CHECKBOX_CLASS =
  "peer h-[18px] w-[18px] shrink-0 cursor-pointer appearance-none rounded-[3px] border border-[#30373e]/35 bg-white " +
  "transition-colors checked:border-[#d1b250] checked:bg-[#d1b250] bg-center bg-no-repeat checked:bg-[length:11px_11px] " +
  "checked:bg-[url('data:image/svg+xml;utf8,%3Csvg%20xmlns%3D%27http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%27%20viewBox%3D%270%200%2016%2016%27%20fill%3D%27none%27%20stroke%3D%27white%27%20stroke-width%3D%272.5%27%20stroke-linecap%3D%27round%27%20stroke-linejoin%3D%27round%27%3E%3Cpath%20d%3D%27M3%208.5l3%203%207-7%27%2F%3E%3C%2Fsvg%3E')] " +
  "focus:outline-none focus-visible:ring-2 focus-visible:ring-[#d1b250]/50";

function buildOptions(products, group, locale) {
  const counts = new Map();
  for (const p of products) {
    const raw = p[group.field];
    if (!raw) continue;
    counts.set(raw, (counts.get(raw) || 0) + 1);
  }
  return [...counts.entries()]
    .map(([value, count]) => ({
      value,
      count,
      label: group.localize ? group.localize(value, locale) : value,
    }))
    .sort((a, b) => a.label.localeCompare(b.label));
}

// Options beyond this count are hidden behind "view more" instead of being cut off
// in a scrollable box — expanding pushes the rest of the page down.
const VISIBLE_OPTION_LIMIT = 3;

// Product cards rendered per "show more" step — the whole category is still
// loaded (filters and their counts need every product), only the grid is
// revealed in batches. 12 fills whole rows at 1, 2 and 3 columns.
const PRODUCTS_PER_PAGE = 24;

const FilterSection = ({ title, options, selected, onToggle, defaultOpen = true, t, swatch = false }) => {
  const [open, setOpen] = useState(defaultOpen);
  const [expanded, setExpanded] = useState(false);

  // Options with no products are noise (and a filter with a single option
  // decides nothing) — hidden unless already selected.
  options = options.filter((o) => o.count > 0 || selected.has(o.value));
  if (options.length < 2 && !selected.size) return null;

  // Collapsed, ticked options come first so a selection is never hidden
  // behind "view more" (e.g. a brand pre-selected via ?marke=).
  const collapsedLimit = Math.max(VISIBLE_OPTION_LIMIT, selected.size);
  const hasMore = options.length > collapsedLimit;
  const visibleOptions = expanded
    ? options
    : [...options.filter((o) => selected.has(o.value)), ...options.filter((o) => !selected.has(o.value))].slice(0, collapsedLimit);
  const hiddenCount = options.length - collapsedLimit;

  return (
    <div className="border-b border-[#30373e]/10 py-5 first:pt-0">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between text-left"
        aria-expanded={open}
      >
        <span className="text-[13px] font-semibold uppercase tracking-[0.08em] text-[#30373e]">{title}</span>
        <ChevronDown
          size={16}
          strokeWidth={2.5}
          className={`text-[#30373e]/50 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open && (
        <>
          <ul className="mt-4 space-y-1">
            {visibleOptions.map((opt) => {
              const checked = selected.has(opt.value);
              return (
                <li key={opt.value}>
                  <label
                    className={`flex cursor-pointer items-center justify-between gap-3 rounded-md px-1.5 py-1.5 text-sm transition-colors hover:bg-[#30373e]/[0.04] ${checked ? "text-[#30373e]" : "text-[#30373e]/75"
                      }`}
                  >
                    <span className="flex items-center gap-2.5">
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => onToggle(opt.value)}
                        className={CHECKBOX_CLASS}
                      />
                      {swatch && (
                        <span
                          className="h-3.5 w-3.5 shrink-0 rounded-full border border-[#30373e]/20"
                          style={{ backgroundColor: opt.hex || "#ccc" }}
                          aria-hidden="true"
                        />
                      )}
                      <span className="capitalize">{opt.label}</span>
                    </span>
                    <span className="text-xs tabular-nums text-[#30373e]/35">{opt.count}</span>
                  </label>
                </li>
              );
            })}
          </ul>

          {hasMore && (
            <button
              type="button"
              onClick={() => setExpanded((v) => !v)}
              className="mt-2 text-xs font-medium uppercase tracking-wide text-gold-text hover:underline"
            >
              {expanded ? t("viewLess") : t("viewMore", { count: hiddenCount })}
            </button>
          )}
        </>
      )}
    </div>
  );
};

const ShopCatalog = ({ products, excludeGroups = [], subCategoryOptions = [], colorOptions = [], materialOptions = [], initialBrands = [] }) => {
  const t = useTranslations("shop");
  const pathname = usePathname();
  const locale = getLocaleFromPath(pathname);
  const filterGroups = useMemo(
    () => FILTER_GROUPS.filter((g) => !excludeGroups.includes(g.key)),
    [excludeGroups]
  );

  const cmsOptionsByKey = { subCategory: subCategoryOptions, color: colorOptions, material: materialOptions };
  const activeCmsGroups = useMemo(
    () => CMS_FILTER_GROUPS.filter((g) => cmsOptionsByKey[g.key].length > 0 && !excludeGroups.includes(g.key)),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [excludeGroups, subCategoryOptions, colorOptions, materialOptions]
  );

  // Live counts against the current product list, but the option LIST itself
  // (which values exist, and their labels) always comes from the CMS props
  // above — otherwise a section would simply never render until a product
  // happened to already be tagged with that value.
  const cmsOptionsWithCounts = useMemo(() => {
    const result = {};
    for (const g of activeCmsGroups) {
      const counts = new Map();
      for (const p of products) {
        for (const value of g.getValues(p)) counts.set(value, (counts.get(value) || 0) + 1);
      }
      result[g.key] = cmsOptionsByKey[g.key].map((opt) => ({ ...opt, count: counts.get(opt.value) || 0 }));
    }
    return result;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [products, activeCmsGroups]);

  // initialBrands: brand filter pre-ticked when arriving from a brand page (?marke=…).
  const [selected, setSelected] = useState(() =>
    initialBrands.length ? { ...EMPTY_SELECTION, brand: new Set(initialBrands) } : EMPTY_SELECTION
  );
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const [visibleCount, setVisibleCount] = useState(PRODUCTS_PER_PAGE);
  const gridRef = useRef(null);
  // Index of the first card a "show more" click revealed, so keyboard/screen
  // reader focus can move onto the new cards instead of staying on the button.
  const focusIndexRef = useRef(null);

  useEffect(() => {
    const index = focusIndexRef.current;
    if (index == null) return;
    focusIndexRef.current = null;
    gridRef.current?.querySelector(`[data-card-index="${index}"]`)?.focus({ preventScroll: true });
  }, [visibleCount]);

  // The mobile filter drawer behaves as a modal: the page behind it doesn't
  // scroll, and Escape closes it.
  useEffect(() => {
    if (!mobileFiltersOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKeyDown = (e) => {
      if (e.key === "Escape") setMobileFiltersOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [mobileFiltersOpen]);

  // Any filter change starts the grid over at the first batch.
  const toggleValue = (groupKey, value) => {
    setSelected((prev) => {
      const next = new Set(prev[groupKey]);
      if (next.has(value)) next.delete(value);
      else next.add(value);
      return { ...prev, [groupKey]: next };
    });
    setVisibleCount(PRODUCTS_PER_PAGE);
  };

  const clearAll = () => {
    setSelected(EMPTY_SELECTION);
    setVisibleCount(PRODUCTS_PER_PAGE);
  };

  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchesGroups = filterGroups.every((g) => {
        const chosen = selected[g.key];
        if (!chosen || chosen.size === 0) return true;
        return chosen.has(p[g.field]);
      });
      if (!matchesGroups) return false;

      return activeCmsGroups.every((g) => {
        const chosen = selected[g.key];
        if (!chosen || chosen.size === 0) return true;
        return g.getValues(p).some((value) => chosen.has(value));
      });
    });
  }, [products, filterGroups, activeCmsGroups, selected]);

  const activeChips = useMemo(() => {
    const chips = [];
    for (const g of filterGroups) {
      for (const value of selected[g.key]) {
        chips.push({ groupKey: g.key, value, label: g.localize ? g.localize(value, locale) : value });
      }
    }
    for (const g of activeCmsGroups) {
      for (const value of selected[g.key]) {
        const opt = cmsOptionsByKey[g.key].find((o) => o.value === value);
        chips.push({ groupKey: g.key, value, label: opt ? opt.label : value });
      }
    }
    return chips;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterGroups, activeCmsGroups, selected, locale]);

  const totalActive = activeChips.length;

  const visibleProducts = filteredProducts.slice(0, visibleCount);
  const remainingCount = filteredProducts.length - visibleProducts.length;
  const showMore = () => {
    focusIndexRef.current = visibleProducts.length;
    setVisibleCount((n) => n + PRODUCTS_PER_PAGE);
  };

  const filterPanel = (
    <>
      <div className="flex items-center justify-between mb-1">
        <h2 className="text-base font-bold uppercase tracking-wide text-[#30373e]">{t("filters")}</h2>
        {totalActive > 0 && (
          <button
            type="button"
            onClick={clearAll}
            className="text-xs font-medium uppercase tracking-wide text-gold-text hover:underline"
          >
            {t("clearAll")}
          </button>
        )}
      </div>

      {filterGroups.map((g) => (
        <FilterSection
          key={g.key}
          title={t(g.labelKey)}
          options={buildOptions(products, g, locale)}
          selected={selected[g.key]}
          onToggle={(value) => toggleValue(g.key, value)}
          t={t}
        />
      ))}

      {activeCmsGroups.map((g) => (
        <FilterSection
          key={g.key}
          title={t(g.labelKey)}
          options={cmsOptionsWithCounts[g.key]}
          selected={selected[g.key]}
          onToggle={(value) => toggleValue(g.key, value)}
          swatch={g.swatch}
          t={t}
        />
      ))}
    </>
  );

  const consultationHref = ROUTES.beratung[locale] || "/beratung";

  // A category with no products yet: a plain message instead of an empty
  // filter panel and a misleading "no products match the selected filters".
  if (products.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-8 pb-20">
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-[#30373e]/20 px-6 py-24 text-center">
          <p className="max-w-md text-[#30373e]/70">{t("emptyCategory")}</p>
          <Link
            href={consultationHref}
            locale={locale}
            className="mt-6 inline-flex items-center gap-2 rounded-[3px] border-2 border-[#d1b250] px-5 py-2.5 text-xs font-medium uppercase tracking-wide text-[#30373e] transition-colors duration-300 hover:bg-[#d1b250]"
          >
            {t("requestConsultation")}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-8 pb-20">
      {/* Mobile filter trigger */}
      <div className="lg:hidden mb-6">
        <button
          type="button"
          onClick={() => setMobileFiltersOpen(true)}
          className="flex w-full items-center justify-center gap-2 rounded-[3px] border-2 border-[#d1b250] px-4 py-3 text-sm font-medium uppercase tracking-wide text-[#30373e] transition-colors hover:bg-[#d1b250]"
        >
          <SlidersHorizontal size={16} />
          {t("filters")}
          {totalActive > 0 && (
            <span className="ml-1 flex h-5 w-5 items-center justify-center rounded-full bg-[#30373e] text-xs text-white">
              {totalActive}
            </span>
          )}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[272px_1fr] gap-10 lg:gap-12 items-start">
        {/* Desktop sidebar — static in the document flow (not fixed/sticky while scrolling) */}
        <aside className="hidden lg:block static rounded-lg border border-[#30373e]/10 bg-white p-6 shadow-[0_1px_3px_rgba(48,55,62,0.06)]">
          {filterPanel}
        </aside>

        {/* Mobile filter drawer */}
        {mobileFiltersOpen && (
          <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true" aria-label={t("filters")}>
            <div
              className="absolute inset-0 bg-black/50"
              onClick={() => setMobileFiltersOpen(false)}
              aria-hidden="true"
            />
            <div className="absolute inset-y-0 left-0 w-[86%] max-w-sm overflow-y-auto bg-white px-6 py-6 shadow-2xl">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-base font-bold uppercase tracking-wide text-[#30373e]">{t("filters")}</h2>
                <button
                  type="button"
                  onClick={() => setMobileFiltersOpen(false)}
                  className="rounded-full p-1.5 text-[#30373e] hover:bg-[#30373e]/5"
                  aria-label={t("close")}
                >
                  <X size={20} />
                </button>
              </div>
              {filterPanel}
              <button
                type="button"
                onClick={() => setMobileFiltersOpen(false)}
                className="mt-6 w-full rounded-[3px] bg-[#30373e] px-4 py-3 text-sm font-medium uppercase tracking-wide text-white"
              >
                {t("resultsCount", { count: filteredProducts.length })}
              </button>
            </div>
          </div>
        )}

        {/* Results */}
        <div>
          <div className="flex flex-wrap items-center justify-between gap-3 mb-5 pb-4 border-b border-[#30373e]/10">
            <p className="text-sm text-[#30373e]/70">{t("resultsCount", { count: filteredProducts.length })}</p>
          </div>

          {activeChips.length > 0 && (
            <div className="flex flex-wrap items-center gap-2 mb-6">
              {activeChips.map((chip) => (
                <button
                  key={`${chip.groupKey}-${chip.value}`}
                  type="button"
                  onClick={() => toggleValue(chip.groupKey, chip.value)}
                  className="flex items-center gap-1.5 rounded-full border border-[#30373e]/25 bg-white px-3 py-1.5 text-xs text-[#30373e] transition-colors hover:border-[#d1b250] hover:text-[#d1b250]"
                >
                  <span className="capitalize">{chip.label}</span>
                  <X size={12} />
                </button>
              ))}
              <button
                type="button"
                onClick={clearAll}
                className="text-xs font-medium uppercase tracking-wide text-[#30373e]/50 hover:text-[#d1b250]"
              >
                {t("clearAll")}
              </button>
            </div>
          )}

          {filteredProducts.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-[#30373e]/20 py-24 text-center">
              <p className="text-[#30373e]/70">{t("noResults")}</p>
              <button
                type="button"
                onClick={clearAll}
                className="mt-4 text-sm font-medium uppercase tracking-wide text-gold-text hover:underline"
              >
                {t("clearAll")}
              </button>
            </div>
          ) : (
            <>
            <div ref={gridRef} className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-x-6 gap-y-12">
              {visibleProducts.map((p, index) => {
                // Same /produkte path in every locale (see the produkte pages).
                const detailHref = productsPath(locale, generateSlug(p.categoryKey), p.url_slug);
                return (
                <div
                  key={p.id}
                  className="group relative overflow-hidden rounded-lg border border-[#30373e]/10 bg-white transition-shadow duration-300 hover:shadow-[0_8px_24px_rgba(48,55,62,0.12)]"
                >
                  <WishlistHeart product={{ ...p, href: productsPath("de", generateSlug(p.categoryKey), p.url_slug) }} />
                  <Link href={detailHref} locale={locale} className="relative block h-[260px] w-full overflow-hidden bg-gray-100">
                    <Image
                      src={p.image || "/Images/fallback-banner.jpg"}
                      alt={`${p.brand} ${p.name}`}
                      fill
                      sizes="(max-width: 768px) 90vw, (max-width: 1280px) 45vw, 350px"
                      className="object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                    {!excludeGroups.includes("category") && (
                      <span className="absolute left-3 top-3 rounded-full bg-white/90 px-3 py-1 text-[11px] font-medium uppercase tracking-wide text-[#30373e]">
                        {localizeCategory(p.categoryKey, locale)}
                      </span>
                    )}
                  </Link>
                  <div className="p-4">
                    <p className="text-xs font-semibold uppercase tracking-wide text-gold-text">{p.brand}</p>
                    <Link
                      href={detailHref}
                      locale={locale}
                      data-card-index={index}
                      className="mt-1 block text-lg text-[#30373e] font-medium hover:text-[#d1b250] transition-colors focus:outline-none focus-visible:underline"
                    >
                      {p.name}
                    </Link>
                    {p.indoorOutdoor && (
                      <p className="mt-1 text-sm text-[#30373e]/70">{p.indoorOutdoor}</p>
                    )}

                    <Link
                      href={detailHref}
                      locale={locale}
                      tabIndex={-1}
                      className="mt-4 inline-flex items-center gap-2 border-2 border-[#d1b250] rounded-[3px] px-4 py-2 text-xs font-medium uppercase tracking-wide text-[#30373e] transition-all duration-300 hover:bg-[#d1b250]"
                    >
                      {t("viewDetails")}
                      <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                      </svg>
                    </Link>
                  </div>
                </div>
                );
              })}
            </div>

            {filteredProducts.length > PRODUCTS_PER_PAGE && (
              <div className="mt-14 flex flex-col items-center gap-4">
                <p className="text-sm text-[#30373e]/75" aria-live="polite">
                  {t("showingCount", { shown: visibleProducts.length, total: filteredProducts.length })}
                </p>
                <div className="h-[3px] w-48 max-w-full overflow-hidden rounded-full bg-[#30373e]/10" aria-hidden="true">
                  <div
                    className="h-full rounded-full bg-[#d1b250] transition-[width] duration-500"
                    style={{ width: `${(visibleProducts.length / filteredProducts.length) * 100}%` }}
                  />
                </div>
                {remainingCount > 0 && (
                  <button
                    type="button"
                    onClick={showMore}
                    className="mt-2 inline-flex w-full items-center justify-center gap-2 rounded-[3px] border-2 border-[#d1b250] px-8 py-3 text-sm font-medium uppercase tracking-wide text-[#30373e] transition-colors duration-300 hover:bg-[#d1b250] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#d1b250]/50 sm:w-auto"
                  >
                    {t("showMoreProducts")}
                    <ChevronDown size={16} strokeWidth={2.5} />
                  </button>
                )}
              </div>
            )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ShopCatalog;
