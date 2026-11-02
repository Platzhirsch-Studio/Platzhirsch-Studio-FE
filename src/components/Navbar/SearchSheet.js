"use client";

import { useEffect, useRef, useState } from "react";
import NextLink from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { usePathname } from "@/i18n/navigation";
import { Search, X } from "@/components/ui/icons";
import cx from "@/components/ui/cx";
import { ROUTES } from "@/utils/routing";
import s from "./Navbar.module.css";

// The search sheet itself, loaded on demand by SearchDialog.js (the header
// trigger) – R4-shell-perf: none of this code, next/image or the result
// rendering is part of the first load any more.
// Site search as a top sheet (<dialog> with showModal: focus trap, Esc and
// inert background come from the browser). Live results come from
// /api/shop-search (brands, categories, "category by brand", products).
// Enter jumps to the best match, otherwise to the catalogue with ?q=.
// Brands of the showroom as one-tap searches in the empty sheet (names only,
// the same in every language; QM shell-home r3).
const SUGGEST = ["Minotti", "Poliform", "Rimadesio", "Flos", "Paola Lenti", "ClassiCon"];
const EMPTY = { brands: [], categories: [], categoryBrands: [], brandCategories: [], products: [] };

// Notices for a failed live search, announced by the aria-live region below
// (R5-shell-seo; R4-plattform-ci open point). 429 = the per-IP limit of
// /api/shop-search (AP1.4), anything else = backend/network error. Read from
// Navbar.searchRateLimited / Navbar.searchError once R5-i18n has taken them
// over (Marktresearch/digital/teamleiter/messages-r5-shell.json); until then
// this table (same wording, IT with "tu"). Plain strings, no ICU.
const SEARCH_NOTICE = {
  de: {
    searchRateLimited: "Zu viele Suchanfragen in kurzer Zeit. Bitte versuchen Sie es gleich noch einmal.",
    searchError: "Die Suche ist gerade nicht erreichbar. Bitte versuchen Sie es später noch einmal oder drücken Sie die Eingabetaste, um im Katalog zu suchen.",
  },
  en: {
    searchRateLimited: "Too many searches in a short time. Please try again in a moment.",
    searchError: "Search is not available right now. Please try again later, or press Enter to search the catalogue.",
  },
  fr: {
    searchRateLimited: "Trop de recherches en peu de temps. Veuillez réessayer dans un instant.",
    searchError: "La recherche n’est pas disponible pour le moment. Veuillez réessayer plus tard ou appuyer sur Entrée pour chercher dans le catalogue.",
  },
  it: {
    searchRateLimited: "Troppe ricerche in poco tempo. Riprova tra un attimo.",
    searchError: "La ricerca non è disponibile in questo momento. Riprova più tardi oppure premi Invio per cercare nel catalogo.",
  },
};

export default function SearchSheet({ labels = {}, openSignal = 0 }) {
  const t = useTranslations("Navbar");
  const locale = useLocale();
  const pathname = usePathname();
  const router = useRouter();
  const dialogRef = useRef(null);
  const inputRef = useRef(null);
  const abortRef = useRef(null);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState(EMPTY);
  const [loading, setLoading] = useState(false);
  // "ok" | "rateLimited" (HTTP 429) | "error" (other failure) of the last search.
  const [status, setStatus] = useState("ok");
  const notice = (key) => (t.has(key) ? t(key) : (SEARCH_NOTICE[locale] || SEARCH_NOTICE.de)[key]);

  const localize = (href) => (new RegExp(`^/${locale}(/|$)`).test(href) ? href : `/${locale}${href.startsWith("/") ? "" : "/"}${href}`);

  const open = () => {
    const dialog = dialogRef.current;
    if (!dialog || dialog.open) return;
    dialog.showModal();
    document.documentElement.style.overflow = "hidden";
    inputRef.current?.focus();
  };
  const close = () => dialogRef.current?.open && dialogRef.current.close();

  // Route change (result picked, back button): never leave the sheet open.
  useEffect(() => {
    close();
  }, [pathname]);

  // Opened by the header trigger: every click bumps openSignal. Declared after
  // the route-change effect, so the first mount opens instead of closing.
  useEffect(() => {
    if (openSignal > 0) open();
  }, [openSignal]);

  // Debounced live search; a newer query cancels the request in flight.
  useEffect(() => {
    const q = query.trim();
    if (q.length < 2) return undefined;
    const timeout = setTimeout(async () => {
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;
      setLoading(true);
      try {
        const res = await fetch(`/api/shop-search?q=${encodeURIComponent(q)}&locale=${locale}`, { signal: controller.signal });
        setResults(res.ok ? { ...EMPTY, ...(await res.json()) } : EMPTY);
        setStatus(res.ok ? "ok" : res.status === 429 ? "rateLimited" : "error");
      } catch (error) {
        if (error.name !== "AbortError") {
          setResults(EMPTY);
          setStatus("error");
        }
      } finally {
        if (abortRef.current === controller) setLoading(false);
      }
    }, 300);
    return () => clearTimeout(timeout);
  }, [query, locale]);

  const showResults = query.trim().length >= 2;
  const hasResults =
    results.brands.length + results.categories.length + results.categoryBrands.length + results.brandCategories.length + results.products.length > 0;

  const onSubmit = (e) => {
    e.preventDefault();
    const q = query.trim();
    const top = showResults ? results.brands[0] || results.products[0] || results.categories[0] : null;
    const catalogue = `/${locale}${ROUTES.produkte[locale] || ROUTES.produkte.de}`;
    router.push(top ? localize(top.href) : q ? `${catalogue}?q=${encodeURIComponent(q)}` : catalogue);
    close();
  };

  const groups = [
    ...results.categoryBrands.map((g) => ({
      key: `cb-${g.categoryHref}`,
      title: t("searchCategoryBrands", { category: g.categoryLabel }),
      items: g.brands.map((b) => ({ href: b.href, image: b.image, title: b.name, meta: t("searchProductCount", { count: b.count }) })),
    })),
    results.brands.length && {
      key: "brands",
      title: t("searchBrands"),
      items: results.brands.map((b) => ({ href: b.href, image: b.image, title: b.name })),
    },
    ...results.brandCategories.map((g) => ({
      key: `bc-${g.brandHref}`,
      title: t("searchBrandCategories", { brand: g.brandName }),
      items: g.categories.map((cat) => ({ href: cat.href, image: cat.image, title: cat.label, meta: t("searchProductCount", { count: cat.count }) })),
    })),
    results.categories.length && {
      key: "categories",
      title: t("searchCategories"),
      items: results.categories.map((cat) => ({ href: cat.href, title: cat.label })),
    },
    results.products.length && {
      key: "products",
      title: t("searchProducts"),
      items: results.products.map((p) => ({
        href: p.href,
        image: p.image,
        title: p.name,
        meta: [p.brand, p.categoryLabel].filter(Boolean).join(" · "),
      })),
    },
  ].filter(Boolean);

  return (
    <>
      <dialog
        ref={dialogRef}
        aria-labelledby="ph-search-label"
        onClose={() => {
          document.documentElement.style.overflow = "";
        }}
        onClick={(e) => {
          if (e.target === e.currentTarget) close(); // backdrop
          else if (e.target.closest("a")) close();
        }}
        className={cx(
          s.dialog,
          s.sheet,
          "fixed inset-x-0 top-0 m-0 h-auto max-h-svh w-full max-w-none overflow-y-auto bg-surface p-0 text-text shadow-overlay"
        )}
      >
        <div className="mx-auto max-w-page px-gutter pb-10">
          {/* QM shell-home r3: label, field and "×" stay at the top while the
              results scroll (they used to scroll out of view on phones). */}
          <div className="sticky top-0 z-10 -mx-gutter bg-surface px-gutter pt-6 pb-1 md:pt-10">
          <div className="flex items-start justify-between gap-4">
            <label id="ph-search-label" htmlFor="ph-search-input" className="text-overline uppercase text-text-accent">
              {labels.label}
            </label>
            <button
              type="button"
              onClick={close}
              aria-label={labels.close}
              className="-mt-3 -mr-3 inline-flex min-h-11 min-w-11 items-center justify-center text-text transition-colors duration-(--duration-micro) hover:text-text-soft"
            >
              <X aria-hidden="true" className="size-5" strokeWidth={1.5} />
            </button>
          </div>
          <form role="search" onSubmit={onSubmit} className={cx(s.searchField, "mt-2 flex items-center gap-3")}>
            <input
              ref={inputRef}
              id="ph-search-input"
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => {
                // type="search" would spend the first Esc on clearing the text
                // (Chromium). Esc closes the sheet at once; "×" clears.
                if (e.key === "Escape") {
                  e.preventDefault();
                  close();
                }
              }}
              placeholder={labels.placeholder}
              autoComplete="off"
              enterKeyHint="search"
              // Playwright's WebKit screenshots write style="caret-color:
              // transparent" onto every text input – before hydration when the
              // dev server is slow, so React logged a mismatch for this field on
              // every page (Labs reports, R3-shell, reproduced with
              // qa-screenshots/teamleiter/r3-shell/caret.mjs). Caret-hiding tools
              // and extensions do the same. One level only; no other effect.
              suppressHydrationWarning
              className={cx(
                s.searchInput,
                "min-h-14 w-full min-w-0 bg-transparent text-lead text-text outline-none placeholder:text-text-soft [&::-webkit-search-cancel-button]:hidden"
              )}
            />
            {query && (
              <button
                type="button"
                onClick={() => {
                  setQuery("");
                  setResults(EMPTY);
                  setStatus("ok");
                  inputRef.current?.focus();
                }}
                aria-label={t("searchClear")}
                className="inline-flex min-h-11 min-w-11 items-center justify-center text-text-soft transition-colors duration-(--duration-micro) hover:text-text"
              >
                <X aria-hidden="true" className="size-4" strokeWidth={1.5} />
              </button>
            )}
            <button
              type="submit"
              className="inline-flex min-h-11 shrink-0 items-center gap-2 px-2 text-ui text-text underline decoration-transparent underline-offset-4 transition-colors duration-(--duration-micro) hover:decoration-current"
            >
              <Search aria-hidden="true" className="size-4" strokeWidth={1.5} />
              <span className="sr-only sm:not-sr-only">{labels.submit}</span>
            </button>
          </form>
          </div>

          {/* QM shell-home r3 (iPad quer): the empty sheet was a bare overlay –
              before typing, a few brands of the showroom as one-tap searches. */}
          {!showResults && (
            <div className="mt-6" data-search-suggest="">
              <p className="text-small text-text-soft">{t("searchBrands")}</p>
              <ul className="mt-2 flex flex-wrap gap-2">
                {SUGGEST.map((name) => (
                  <li key={name}>
                    <button
                      type="button"
                      onClick={() => {
                        setQuery(name);
                        inputRef.current?.focus();
                      }}
                      className="inline-flex min-h-11 items-center border border-line-strong px-4 text-ui text-text transition-colors duration-(--duration-micro) hover:border-ink"
                    >
                      {name}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div aria-live="polite" className="mt-6">
            {showResults &&
              (status !== "ok" && !loading ? (
                <p className="text-body text-text-soft" data-search-notice={status}>
                  {notice(status === "rateLimited" ? "searchRateLimited" : "searchError")}
                </p>
              ) : loading && !hasResults ? (
                // Motion shell-home: loading = three quiet skeleton rows in the
                // size of a result (40 px thumb + line), the "…" stays as
                // the text for the live region. Static under reduced motion.
                <div data-search-loading="">
                  <p className="sr-only">…</p>
                  <ul aria-hidden="true" className="grid max-w-96 gap-2 pt-1">
                    {[0, 1, 2].map((i) => (
                      <li key={i} className="flex min-h-12 items-center gap-3 py-1">
                        <span className="ph-skeleton size-10 shrink-0" />
                        <span className="ph-skeleton h-3 w-full" style={{ maxWidth: `${14 - i * 3}rem` }} />
                      </li>
                    ))}
                  </ul>
                </div>
              ) : hasResults ? (
                <div className="grid gap-x-grid gap-y-8 md:grid-cols-2 xl:grid-cols-3">
                  {groups.map((group) => (
                    <section key={group.key} aria-label={group.title} className="ph-arrive">
                      <p className="text-small text-text-soft">{group.title}</p>
                      <ul className="mt-2">
                        {group.items.map((item) => (
                          <li key={item.href}>
                            <NextLink
                              href={localize(item.href)}
                              className="group flex min-h-12 items-center gap-3 py-1 text-text"
                            >
                              {item.image !== undefined && (
                                // QM shell-home r5: contained wide, square and tall shots side by
                                // side looked restless (flat strips next to a portrait). Every
                                // thumbnail now fills the same 40 px square (object-cover, display
                                // crop only – the files themselves are untouched).
                                <span className="relative size-10 shrink-0 overflow-hidden bg-linen">
                                  {item.image && <Image src={item.image} alt="" fill sizes="40px" className="object-cover" />}
                                </span>
                              )}
                              <span className="min-w-0">
                                <span className="block truncate text-ui font-normal underline decoration-transparent underline-offset-4 transition-colors duration-(--duration-micro) group-hover:decoration-current">
                                  {item.title}
                                </span>
                                {item.meta && <span className="block truncate text-small text-text-soft">{item.meta}</span>}
                              </span>
                            </NextLink>
                          </li>
                        ))}
                      </ul>
                    </section>
                  ))}
                </div>
              ) : (
                <p className="text-body text-text-soft">{t("searchNoResults")}</p>
              ))}
          </div>
        </div>
      </dialog>
    </>
  );
}
