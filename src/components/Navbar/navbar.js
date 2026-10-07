"use client";
import { PHONE_DISPLAY, PHONE_HREF, EMAIL, EMAIL_HREF } from "@/lib/site";
import { LANDING_PAGE_SLUGS } from "@/lib/content/landingPages";
import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { FaFacebookF, FaInstagram, FaLinkedinIn } from "react-icons/fa";
import { useCart } from '@/context/CartContext';
import { useTranslations } from "next-intl";
import { useRouter, usePathname } from 'next/navigation'
import { ROUTES } from "@/utils/routing";
import {
  Menu,
  X,
  ChevronDown,
  ChevronUp,
  ShoppingBag,
  Clock,
  Phone,
  Search,
} from "lucide-react";

const Navbar = ({ activeCategoryKeys = null }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [openDropdown, setOpenDropdown] = useState(null);
  const [openProductGroup, setOpenProductGroup] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState({ brands: [], categories: [], categoryBrands: [], brandCategories: [], products: [] });
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const searchBoxRef = useRef(null);
  const searchAbortRef = useRef(null);
  const languageCloseTimer = useRef(null);
  const t = useTranslations('Navbar');
  const tp = useTranslations('ProductsMenu');
  const router = useRouter();
  const pathname = usePathname();
  const { getTotalItems } = useCart();

  const languages = useMemo(() => [
    { code: "en", name: t('languages.en'), flag: "/Images/Flags/English.png" },
    { code: "de", name: t('languages.de'), flag: "/Images/Flags/Germany.png" },
    { code: "fr", name: t('languages.fr'), flag: "/Images/Flags/France.png" },
    { code: "it", name: t('languages.it'), flag: "/Images/Flags/IT.png" },
  ], [t]);

  const supportedLocales = useMemo(() => languages.map(l => l.code), [languages]);

  // Get current locale from path
  const urlLocale = useMemo(() => {
    const seg = pathname.split('/').filter(Boolean);
    const locale = seg[0]?.toLowerCase();
    return supportedLocales.includes(locale) ? locale : 'de';
  }, [pathname, supportedLocales]);

  const currentLang = useMemo(() =>
    languages.find(l => l.code === urlLocale) || languages[0],
    [urlLocale, languages]
  );

  // Create a map of all route translations for reverse lookup
  const routeTranslationMap = useMemo(() => {
    const map = {};
    Object.entries(ROUTES).forEach(([routeKey, translations]) => {
      Object.entries(translations).forEach(([lang, path]) => {
        const cleanPath = path.startsWith('/') ? path.slice(1) : path;
        map[`${lang}:${cleanPath}`] = routeKey;
      });
    });
    return map;
  }, []);

  // Localize href with proper route translation
  const localizeHref = (href) => {
    if (href === '/') return `/${urlLocale}`;

    // Remove leading slash if present
    const cleanHref = href.startsWith('/') ? href.slice(1) : href;

    // Check if href is already localized
    if (supportedLocales.some(locale => cleanHref.startsWith(`${locale}/`))) {
      return `/${cleanHref}`;
    }

    return `/${urlLocale}/${cleanHref}`;
  };

  // Persist the current locale as a client-side backup. Guarded inside useEffect —
  // a bare localStorage call in render crashed SSR (ReferenceError: localStorage is
  // not defined), which dropped the whole page body out of the server HTML site-wide.
  useEffect(() => {
    localStorage.setItem('preferredLocale', urlLocale);
  }, [urlLocale]);

  // Handle language change with proper route translation.
  // Pages that exist in German only (the local landing pages): switching the
  // language there used to land on a 404 — send those to the other locale's
  // homepage instead. Keep in sync with LANDING_PAGES in Reusable/Footer.js.
  const GERMAN_ONLY_PAGES = LANDING_PAGE_SLUGS;
  // URL of the current page in `newLang` (pure; used for the real <a href>
  // options in the desktop list and by handleLanguageChange).
  const languageHref = (newLang) => {
    const segments = pathname.split('/').filter(Boolean);
    let currentLocale = supportedLocales.includes(segments[0]?.toLowerCase())
      ? segments.shift()
      : urlLocale;
    const currentPath = segments.join('/');

    if (newLang !== 'de' && GERMAN_ONLY_PAGES.includes(currentPath)) return `/${newLang}`;

    // Try to find a matching route in ROUTES
    let newPath = '';
    let found = false;
    Object.entries(ROUTES).forEach(([key, translations]) => {
      if (typeof translations === 'object') {
        Object.entries(translations).forEach(([lang, path]) => {
          // Remove leading slash for comparison
          const cleanPath = path.replace(/^\//, '');
          if (lang === currentLocale && cleanPath === currentPath) {
            // Found a match, use the new language's path
            newPath = translations[newLang];
            found = true;
          }
        });
      }
    });

    // // If not found, try to replace the about root
    // if (!found) {
    //   // Try to replace the about root for subpages
    //   const aboutRoots = Object.values(ROUTES.ueber);
    //   for (const root of aboutRoots) {
    //     if (currentPath.startsWith(root.replace(/^\//, ''))) {
    //       const subPath = currentPath.slice(root.length).replace(/^\//, '');
    //       newPath = `${ROUTES.ueber[newLang]}${subPath ? '/' + subPath : ''}`;
    //       found = true;
    //       break;
    //     }
    //   }
    // }

    // Dynamic pages (/produkte/<kategorie>/<produkt>, /ueber-uns/marken/<marke>,
    // /news/<titel>): translate the longest matching route prefix and keep the
    // rest. Without this the link pointed at e.g. /en/produkte/beds, which only
    // worked through the middleware's redirect to /en/products/beds.
    if (!newPath) {
      let best = null;
      Object.values(ROUTES).forEach((translations) => {
        if (typeof translations !== 'object') return;
        const from = (translations[currentLocale] || '').replace(/^\//, '');
        if (from && (currentPath === from || currentPath.startsWith(from + '/')) && (!best || from.length > best.from.length)) {
          best = { from, to: translations[newLang] };
        }
      });
      if (best && best.to) newPath = `${best.to}${currentPath.slice(best.from.length)}`;
    }

    // Fallback: just switch the locale
    if (!newPath) {
      newPath = currentPath;
    }


    // Keep the query string (?marke=, ?q=) — it used to be dropped on switch.
    const search = typeof window !== 'undefined' ? window.location.search : '';
    return `/${newLang}${newPath.startsWith('/') ? '' : '/'}${newPath}${search}`;
  };

  const handleLanguageChange = (newLang) => {
    localStorage.setItem('preferredLocale', newLang);
    router.push(languageHref(newLang));
  };

  // Navigation items with proper localized paths
  const navItems = useMemo(() => [
    { name: t('home'), href: "/" },
    { name: t('products'), href: ROUTES.produkte[urlLocale] },
    { name: t('consultation'), href: ROUTES.beratung[urlLocale] },
    {
      name: t('about'),
      subItems: [
        { name: t('platzhirsch'), href: ROUTES.platzhirsch[urlLocale] },
        { name: t('brands'), href: ROUTES.marken[urlLocale] },
        { name: t('team'), href: ROUTES.team[urlLocale] },
        { name: t('career'), href: ROUTES.karriere[urlLocale] },
        { name: t('press'), href: ROUTES.presse[urlLocale] },
        { name: t('partners'), href: ROUTES.partner[urlLocale] },
      ],
    },
    { name: t('news'), href: ROUTES.news[urlLocale] },
    { name: t('contact'), href: ROUTES.kontakt[urlLocale] },
  ], [t, urlLocale]);

  const aboutItem = useMemo(() => navItems.find((item) => item.subItems), [navItems]);
  const productsItem = useMemo(
    () => navItems.find((item) => item.href === ROUTES.produkte[urlLocale]),
    [navItems, urlLocale]
  );
  // Menu groups/labels come from messages (ProductsMenu.groups); only
  // categories that currently have products are shown, and a group left
  // with no items is dropped. `activeCategoryKeys` is null when the backend
  // couldn't be reached — then the full menu is shown.
  const productGroups = useMemo(() => {
    const groups = tp.raw('groups') || [];
    if (!activeCategoryKeys) return groups;
    const active = new Set(activeCategoryKeys);
    return groups
      .map((group) => ({ ...group, items: group.items.filter((item) => active.has(item.key)) }))
      .filter((group) => group.items.length > 0);
  }, [tp, activeCategoryKeys]);
  // Real /produkte/[category] base for the mega-menu links below. The whole
  // path is locale-invariant (e.g. /en/produkte/beds): category pages only
  // exist under the German-named `produkte` folder, so the translated
  // ROUTES.produkte segment (/products, /produits, …) would 404.
  // Translated catalogue base (/produkte, /products, /produits, /prodotti).
  const shopPath = ROUTES.produkte[urlLocale] || ROUTES.produkte.de;

  const toggleDropdown = (name) => {
    setOpenDropdown((prev) => (prev === name ? null : name));
    setOpenProductGroup(null);
  };

  const closeSearch = useCallback(() => {
    setSearchOpen(false);
  }, []);

  // Debounced live search against real shop data (categories + products) —
  // see src/app/api/shop-search/route.js. Cancels the previous in-flight
  // request whenever the query changes, so a slow earlier response can't
  // overwrite a newer one's results.
  useEffect(() => {
    const query = searchQuery.trim();
    if (query.length < 2) {
      setSearchResults({ brands: [], categories: [], categoryBrands: [], brandCategories: [], products: [] });
      setSearchLoading(false);
      return;
    }

    setSearchLoading(true);
    const timeout = setTimeout(async () => {
      searchAbortRef.current?.abort();
      const controller = new AbortController();
      searchAbortRef.current = controller;

      try {
        const res = await fetch(
          `/api/shop-search?q=${encodeURIComponent(query)}&locale=${urlLocale}`,
          { signal: controller.signal }
        );
        const data = res.ok ? await res.json() : { brands: [], categories: [], categoryBrands: [], brandCategories: [], products: [] };
        setSearchResults(data);
        setSearchOpen(true);
      } catch (error) {
        if (error.name !== "AbortError") {
          console.error("Shop search failed:", error);
          setSearchResults({ brands: [], categories: [], categoryBrands: [], brandCategories: [], products: [] });
        }
      } finally {
        setSearchLoading(false);
      }
    }, 300);

    return () => clearTimeout(timeout);
  }, [searchQuery, urlLocale]);

  // Close the dropdown on outside click and whenever the route changes.
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (searchBoxRef.current && !searchBoxRef.current.contains(e.target)) closeSearch();
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [closeSearch]);

  useEffect(() => {
    closeSearch();
  }, [pathname, closeSearch]);

  const categoryBrandGroups = searchResults.categoryBrands || [];
  const brandCategoryGroups = searchResults.brandCategories || [];
  const hasSearchResults =
    searchResults.brands.length > 0 ||
    searchResults.categories.length > 0 ||
    categoryBrandGroups.length > 0 ||
    brandCategoryGroups.length > 0 ||
    searchResults.products.length > 0;

  const goToSearchResult = (href) => {
    router.push(localizeHref(href));
    setSearchQuery("");
    setSearchResults({ brands: [], categories: [], categoryBrands: [], brandCategories: [], products: [] });
    closeSearch();
    closeMobileMenu();
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    const query = searchQuery.trim();

    // Enter with results showing jumps straight to the best match — a brand
    // name (e.g. "Minotti") ranks above a product, since it's the more
    // general "did you mean this manufacturer" result; otherwise fall back
    // to the general products listing.
    const topResult = searchResults.brands[0] || searchResults.products[0] || searchResults.categories[0];
    if (query && topResult) {
      goToSearchResult(topResult.href);
      return;
    }

    const produktePath = localizeHref(ROUTES.produkte[urlLocale] || "/produkte");
    router.push(query ? `${produktePath}?q=${encodeURIComponent(query)}` : produktePath);
    setSearchQuery("");
    closeSearch();
    closeMobileMenu();
  };

  const closeMobileMenu = () => {
    setIsOpen(false);
    setOpenDropdown(null);
    setOpenProductGroup(null);
  };

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    handleScroll();
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = isOpen ? "hidden" : "unset";
  }, [isOpen]);

  // Escape closes whatever is open (mobile drawer, mega menus, language list, search).
  useEffect(() => {
    const onKeyDown = (e) => {
      if (e.key !== "Escape") return;
      setOpenDropdown(null);
      setOpenProductGroup(null);
      setIsOpen(false);
      closeSearch();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [closeSearch]);

  // Force-close the mobile drawer when the viewport grows past the mobile
  // breakpoint, so it never stays mounted (and body scroll never stays
  // locked) once the desktop nav takes over.
  useEffect(() => {
    if (!isOpen) return;
    const handleResize = () => {
      if (window.innerWidth >= 1024) closeMobileMenu();
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [isOpen]);


  // Search results list — shared by the desktop dropdown and the mobile menu.
  const renderSearchResults = () =>
      searchLoading ? (
        <p className="px-4 py-4 text-sm text-[#30373e]/75">…</p>
      ) : hasSearchResults ? (
        <>
          {/* "Sofas nach Marke" first: brands with products in a matched
              category → category page with that brand pre-selected. */}
          {categoryBrandGroups.map((group, groupIndex) => (
            <div
              key={group.categoryHref}
              className={`py-2 ${groupIndex > 0 ? "border-t border-gray-100" : ""}`}
            >
              <p className="px-4 pt-1 pb-1 text-[11px] font-semibold uppercase tracking-wide text-[#30373e]/50">
                {t("searchCategoryBrands", { category: group.categoryLabel })}
              </p>
              {group.brands.map((b) => (
                <button
                  key={b.href}
                  type="button"
                  onClick={() => goToSearchResult(b.href)}
                  className="group flex w-full items-center gap-3 text-left px-4 py-2 hover:bg-gray-50 transition"
                >
                  <span className="relative h-8 w-8 shrink-0 overflow-hidden rounded-full bg-gray-100 border border-gray-200">
                    {b.image && (
                      <Image src={b.image} alt="" fill sizes="32px" className="object-cover" />
                    )}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm text-[#30373e] group-hover:text-[#d1b250] transition">
                      {b.name}
                    </span>
                    <span className="block text-xs text-[#30373e]/50">
                      {t("searchProductCount", { count: b.count })}
                    </span>
                  </span>
                </button>
              ))}
            </div>
          ))}

          {searchResults.brands.length > 0 && (
            <div className={`py-2 ${categoryBrandGroups.length > 0 ? "border-t border-gray-100" : ""}`}>
              <p className="px-4 pt-1 pb-1 text-[11px] font-semibold uppercase tracking-wide text-[#30373e]/50">
                {t("searchBrands")}
              </p>
              {searchResults.brands.map((b) => (
                <button
                  key={b.href}
                  type="button"
                  onClick={() => goToSearchResult(b.href)}
                  className="flex w-full items-center gap-3 text-left px-4 py-2.5 hover:bg-gray-50 transition"
                >
                  <span className="relative h-10 w-10 shrink-0 overflow-hidden rounded-full bg-gray-100 border border-gray-200">
                    {b.image && (
                      <Image src={b.image} alt="" fill sizes="40px" className="object-cover" />
                    )}
                  </span>
                  <span className="text-sm font-medium text-[#30373e]">{b.name}</span>
                </button>
              ))}
            </div>
          )}

          {/* "Minotti – Kategorien": categories the matched brand has
              products in → that category with the brand pre-selected. */}
          {brandCategoryGroups.map((group) => (
            <div key={group.brandHref} className="py-2 border-t border-gray-100">
              <p className="px-4 pt-1 pb-1 text-[11px] font-semibold uppercase tracking-wide text-[#30373e]/50">
                {t("searchBrandCategories", { brand: group.brandName })}
              </p>
              {group.categories.map((c) => (
                <button
                  key={c.href}
                  type="button"
                  onClick={() => goToSearchResult(c.href)}
                  className="group flex w-full items-center gap-3 text-left px-4 py-2 hover:bg-gray-50 transition"
                >
                  <span className="relative h-8 w-8 shrink-0 overflow-hidden rounded-md bg-gray-100">
                    {c.image && (
                      <Image src={c.image} alt="" fill sizes="32px" className="object-cover" />
                    )}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm text-[#30373e] group-hover:text-[#d1b250] transition">
                      {c.label}
                    </span>
                    <span className="block text-xs text-[#30373e]/50">
                      {t("searchProductCount", { count: c.count })}
                    </span>
                  </span>
                </button>
              ))}
            </div>
          ))}

          {searchResults.categories.length > 0 && (
            <div className={`py-2 ${searchResults.brands.length > 0 || categoryBrandGroups.length > 0 || brandCategoryGroups.length > 0 ? "border-t border-gray-100" : ""}`}>
              <p className="px-4 pt-1 pb-1 text-[11px] font-semibold uppercase tracking-wide text-[#30373e]/50">
                {t("searchCategories")}
              </p>
              {searchResults.categories.map((c) => (
                <button
                  key={c.href}
                  type="button"
                  onClick={() => goToSearchResult(c.href)}
                  className="block w-full text-left px-4 py-2 text-sm text-[#30373e] hover:bg-gray-50 hover:text-[#d1b250] transition"
                >
                  {c.label}
                </button>
              ))}
            </div>
          )}

          {searchResults.products.length > 0 && (
            <div className={`py-2 ${searchResults.brands.length > 0 || searchResults.categories.length > 0 || categoryBrandGroups.length > 0 ? "border-t border-gray-100" : ""}`}>
              <p className="px-4 pt-1 pb-1 text-[11px] font-semibold uppercase tracking-wide text-[#30373e]/50">
                {t("searchProducts")}
              </p>
              {searchResults.products.map((p) => (
                <button
                  key={p.href}
                  type="button"
                  onClick={() => goToSearchResult(p.href)}
                  className="flex w-full items-center gap-3 text-left px-4 py-2 hover:bg-gray-50 transition"
                >
                  <span className="relative h-10 w-10 shrink-0 overflow-hidden rounded-md bg-gray-100">
                    {p.image && (
                      <Image src={p.image} alt="" fill sizes="40px" className="object-cover" />
                    )}
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate text-sm text-[#30373e]">{p.name}</span>
                    <span className="block truncate text-xs text-[#30373e]/50">
                      {p.brand}{p.categoryLabel ? ` · ${p.categoryLabel}` : ""}
                    </span>
                  </span>
                </button>
              ))}
            </div>
          )}
        </>
      ) : (
        <p className="px-4 py-4 text-sm text-[#30373e]/75">{t("searchNoResults")}</p>
      );

  return (
    <header
      className="fixed w-full z-50 shadow-md"
      // Keyboard: a mega menu opened by focus closes again once focus leaves
      // its trigger AND its panel (both carry data-menu-root). The mobile
      // drawer is exempt: tapping a language option there focuses it, and the
      // close-on-focus unmounted the option before its click could fire.
      onFocusCapture={(e) => {
        if (!e.target.closest("[data-menu-root], #mobile-menu")) setOpenDropdown(null);
      }}
    >
      <style jsx>{`
        @keyframes fadeInSlideDown {
          from { opacity: 0; transform: translateY(-8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeInSlideDown { animation: fadeInSlideDown 0.25s ease-out; }
      `}</style>

      {/* TOP UTILITY BAR */}
      <div
        className={`hidden lg:block bg-night text-white overflow-hidden transition-all duration-300 ${scrolled ? "max-h-0 opacity-0" : "max-h-12 opacity-100"
          }`}
      >
        <div className="max-w-7xl mx-auto px-4 flex justify-between items-center py-2 text-xs">
          <div className="flex items-center gap-5 text-white/80">
            <span className="flex items-center gap-1.5">
              <Clock size={13} />
              {t("hours")}
            </span>
            <span className="flex items-center gap-1.5 hover:text-[#d1b250] transition">
              <Phone size={13} />
              <a href={PHONE_HREF}>{PHONE_DISPLAY}</a>
            </span>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <a
                href="https://www.facebook.com/platzhirsch.studio/"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Facebook"
                className="border border-white/30 w-6 h-6 flex items-center justify-center rounded-full text-white/80 hover:bg-[#d1b250] hover:border-[#d1b250] hover:text-white transition"
              >
                <FaFacebookF size={11} />
              </a>
              <a
                href="https://www.instagram.com/platzhirsch.studio"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Instagram"
                className="border border-white/30 w-6 h-6 flex items-center justify-center rounded-full text-white/80 hover:bg-[#d1b250] hover:border-[#d1b250] hover:text-white transition"
              >
                <FaInstagram size={11} />
              </a>
              <a
                href="https://www.linkedin.com/company/platzhirsch-studio"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="LinkedIn"
                className="border border-white/30 w-6 h-6 flex items-center justify-center rounded-full text-white/80 hover:bg-[#d1b250] hover:border-[#d1b250] hover:text-white transition"
              >
                <FaLinkedinIn size={11} />
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* MAIN BAR: logo, search, wishlist, language */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 flex justify-between items-center py-3">
          <Link
            href={localizeHref("/")}
            className="flex items-center h-14 w-36 relative shrink-0"
          >
            <Image
              src="/Images/Navbar/Logo.png"
              alt={t("logoAlt")}
              fill
              className="object-contain object-left"
              sizes="(max-width: 768px) 130px, 150px"
              priority
            />
          </Link>

          <div className="hidden lg:flex items-center gap-6">
            <div ref={searchBoxRef} className="relative w-56 xl:w-72">
              <form
                onSubmit={handleSearchSubmit}
                role="search"
                className="flex items-center border border-[#30373e]/20 rounded-full overflow-hidden focus-within:ring-1 focus-within:ring-[#d1b250] transition"
              >
                <input
                  type="search"
                  aria-label={t("search")}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onFocus={() => { if (hasSearchResults) setSearchOpen(true); }}
                  placeholder={t("search")}
                  autoComplete="off"
                  className="flex-1 px-4 py-2 text-sm outline-none text-[#30373e] placeholder-[#30373e]/50 bg-white"
                />
                <button
                  type="submit"
                  aria-label={t("search")}
                  className="px-3 text-[#30373e]/70 hover:text-[#d1b250] transition"
                >
                  <Search size={17} />
                </button>
              </form>

              {searchOpen && searchQuery.trim().length >= 2 && (
                <div className="absolute right-0 top-full mt-2 w-80 max-h-96 overflow-y-auto rounded-lg bg-white shadow-2xl border border-gray-100 z-50 animate-fadeInSlideDown">
                  {renderSearchResults()}
                </div>
              )}
            </div>

            <Link
              href={ROUTES.merkliste[urlLocale] ? localizeHref(ROUTES.merkliste[urlLocale]) : localizeHref("/merkliste")}
              aria-label={`${t("wishlist")}${getTotalItems() > 0 ? ` (${getTotalItems()})` : ""}`}
              className="flex items-center text-[#30373e] hover:text-[#d1b250] transition no-underline"
              style={{ textDecoration: 'none' }}
              onClick={closeMobileMenu}
            >
              <div className="flex items-center">
                <ShoppingBag size={22} />
                {getTotalItems() > 0 && (
                  <span className="bg-[#d1b250] text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold -ml-3 -mt-4">
                    {getTotalItems()}
                  </span>
                )}
              </div>
            </Link>

            {/* LANGUAGE DROPDOWN */}
            {/* data-menu-root: the header's onFocusCapture closes every menu when
                focus lands outside a menu root. Without it, the mousedown on a
                language link focused the link, the list unmounted before mouseup,
                and the click (hence the navigation) never happened. */}
            <div
              className="relative"
              data-menu-root=""
              onMouseEnter={() => { clearTimeout(languageCloseTimer.current); setOpenDropdown("language"); }}
              onMouseLeave={() => { languageCloseTimer.current = setTimeout(() => setOpenDropdown((d) => (d === "language" ? null : d)), 250); }}
            >
              {/* A real button: focusable and announced. Click only OPENS — hover
                  already opened it, so a toggling click closed it again on touch
                  tablets (mouseenter + click fire together). Escape closes. */}
              <button
                type="button"
                aria-haspopup="true"
                aria-expanded={openDropdown === "language"}
                onClick={() => setOpenDropdown("language")}
                className="flex items-center text-[#30373e] text-sm cursor-pointer transition"
              >
                <div className="w-6 h-6 mr-2 relative overflow-hidden rounded-sm">
                  <Image src={currentLang.flag} alt="" fill className="object-cover" sizes="32px" />
                </div>
                {currentLang.code.toUpperCase()}
                {/* Full language name for screen readers; the visible label stays "DE". */}
                <span className="sr-only"> – {currentLang.name}</span>
                <ChevronDown className="ml-1 hover:text-[#d1b250]" size={16} aria-hidden="true" />
              </button>
              {openDropdown === "language" && (
                <div className="absolute right-0 top-full w-20 bg-white text-black shadow-2xl z-50 animate-fadeInSlideDown">
                  {languages.map((lang) => (
                    <Link
                      key={lang.code}
                      lang={lang.code}
                      hrefLang={lang.code}
                      href={languageHref(lang.code)}
                      onClick={() => localStorage.setItem('preferredLocale', lang.code)}
                      className={`flex items-center w-full px-3 py-2 text-sm font-medium hover:bg-gray-800 hover:text-[#d1b250] transition cursor-pointer ${currentLang.code === lang.code
                        ? "bg-gray-800 text-white"
                        : "text-black"
                        }`}
                    >
                      <div className="w-6 h-6 mr-2 relative overflow-hidden rounded-sm">
                        <Image
                          src={lang.flag}
                          alt={lang.name}
                          fill
                          className="object-cover"
                          sizes="24px"
                        />
                      </div>
                      <span className="flex-1 text-left">
                        {lang.code.toUpperCase()}
                      </span>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Mobile view - Shopping cart and menu button */}
          <div className="lg:hidden flex items-center">
            {/* Tap-to-call in the mobile header (the phone number is otherwise
                only in the desktop utility bar and the footer). */}
            <a
              href={PHONE_HREF}
              aria-label={t("call")}
              className="flex h-11 w-11 items-center justify-center text-[#30373e] hover:text-[#d1b250]"
            >
              <Phone size={22} aria-hidden="true" />
            </a>
            <Link
              href={ROUTES.merkliste[urlLocale] ? localizeHref(ROUTES.merkliste[urlLocale]) : localizeHref("/merkliste")}
              aria-label={`${t("wishlist")}${getTotalItems() > 0 ? ` (${getTotalItems()})` : ""}`}
              className="flex items-center justify-between py-2 text-[#30373e] hover:text-[#d1b250] uppercase text-sm no-underline mr-1"
              style={{ textDecoration: 'none' }}
              onClick={closeMobileMenu}
            >
              <div className="flex items-center relative">
                <ShoppingBag size={24} />
                {getTotalItems() > 0 && (
                  <span className="bg-[#d1b250] text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold -ml-3 -mt-4">
                    {getTotalItems()}
                  </span>
                )}
              </div>
            </Link>
            <button
              type="button"
              className="flex h-11 w-11 items-center justify-center text-[#30373e]"
              onClick={() => setIsOpen(!isOpen)}
              aria-label={isOpen ? t("closeMenu") : t("openMenu")}
              aria-expanded={isOpen}
              aria-controls="mobile-menu"
            >
              {isOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </div>

      {/* BOTTOM NAV BAR + MEGA MENU */}
      <div
        className="hidden lg:block bg-white relative"
        onMouseLeave={() => setOpenDropdown(null)}
      >
        <nav aria-label={t("mainNavigation")} className="max-w-7xl mx-auto px-4 flex justify-between items-center gap-6 py-3">
          {navItems.map((item) => {
            const isProducts = productsItem && item === productsItem;

            if (item.subItems || isProducts) {
              const key = isProducts ? "products" : item.name;
              return (
                <div key={item.name} data-menu-root="" onMouseEnter={() => setOpenDropdown(key)} onFocus={() => setOpenDropdown(key)}>
                  {isProducts ? (
                    <Link
                      href={localizeHref(item.href)}
                      onClick={() => setOpenDropdown(null)}
                      aria-haspopup="true"
                      aria-expanded={openDropdown === key}
                      className="flex items-center gap-1 uppercase text-xs font-semibold tracking-wider text-[#30373e] hover:text-[#d1b250] transition py-0.5 whitespace-nowrap"
                    >
                      {item.name}
                      <ChevronDown
                        size={16}
                        className={`transition-transform ${openDropdown === key ? "rotate-180" : ""}`}
                      />
                    </Link>
                  ) : (
                    <button
                      type="button"
                      aria-haspopup="true"
                      aria-expanded={openDropdown === key}
                      // Opens on hover; click/Enter also opens (keyboard users),
                      // never closes it — a hover-then-click would otherwise toggle it shut.
                      onClick={() => setOpenDropdown(key)}
                      className="flex items-center gap-1 uppercase text-xs font-semibold tracking-wider text-[#30373e] hover:text-[#d1b250] transition py-0.5 cursor-pointer whitespace-nowrap"
                    >
                      {item.name}
                      <ChevronDown
                        size={16}
                        className={`transition-transform ${openDropdown === key ? "rotate-180" : ""}`}
                      />
                    </button>
                  )}
                </div>
              );
            }

            return (
              <Link
                key={item.name}
                href={localizeHref(item.href)}
                onMouseEnter={() => setOpenDropdown(null)}
                className="uppercase text-xs font-semibold tracking-wider text-[#30373e] hover:text-[#d1b250] transition py-0.5 whitespace-nowrap"
              >
                {item.name}
              </Link>
            );
          })}
        </nav>

        {/* Mega menus are always in the HTML (hidden until hover) so crawlers
            see their category/About links — Googlebot never hovers, so a
            conditionally rendered menu would never exist for it. */}
        {productsItem && (
          <div
            data-menu-root=""
            className={`absolute left-0 top-full w-full bg-white shadow-2xl border-t border-gray-100 animate-fadeInSlideDown ${
              openDropdown === "products" ? "" : "hidden"
            }`}
          >
            <div className="max-w-7xl mx-auto px-6 py-10">
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-8 mb-10">
                {productGroups.map((group) => (
                  <div key={group.title}>
                    <p className="text-sm font-semibold text-[#30373e] mb-3">{group.title}</p>
                    <ul className="space-y-2">
                      {group.items.map((item) => (
                        <li key={item.key}>
                          <Link
                            href={localizeHref(`${shopPath}/${item.key}`)}
                            onClick={() => setOpenDropdown(null)}
                            className="inline-block py-1 text-sm text-[#30373e]/75 hover:text-[#d1b250] transition"
                          >
                            {item.label}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Link
                  href={localizeHref(productsItem.href)}
                  onClick={() => setOpenDropdown(null)}
                  className="relative h-48 group overflow-hidden block"
                >
                  <Image
                    src="/Images/Home/grey-and-brown-combo-style-room.jpg"
                    alt={tp("indoor")}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-500"
                    sizes="(max-width: 1024px) 100vw, 50vw"
                  />
                  <div className="absolute inset-0 bg-black/30 group-hover:bg-black/40 transition" />
                  <span className="absolute bottom-4 left-4 text-white text-sm font-semibold uppercase tracking-wide">
                    {tp("indoor")}
                  </span>
                </Link>

                <Link
                  // Straight to the Outdoor group on the hub (#group-5 =
                  // ProductsMenu.groups[4]); the Indoor card is the hub itself.
                  href={localizeHref(`${shopPath}#group-5`)}
                  onClick={() => setOpenDropdown(null)}
                  className="relative h-48 group overflow-hidden block"
                >
                  <Image
                    src="/Images/Outdoor/bannerImage5.jpg"
                    alt={tp("outdoor")}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-500"
                    sizes="(max-width: 1024px) 100vw, 50vw"
                  />
                  <div className="absolute inset-0 bg-black/30 group-hover:bg-black/40 transition" />
                  <span className="absolute bottom-4 left-4 text-white text-sm font-semibold uppercase tracking-wide">
                    {tp("outdoor")}
                  </span>
                </Link>
              </div>
            </div>
          </div>
        )}

        {aboutItem && (
          <div
            data-menu-root=""
            className={`absolute left-0 top-full w-full bg-white shadow-2xl border-t border-gray-100 animate-fadeInSlideDown ${
              openDropdown === aboutItem.name ? "" : "hidden"
            }`}
          >
            <div className="max-w-7xl mx-auto px-6 py-10 grid grid-cols-1 md:grid-cols-3 gap-10">
              <div>
                <p className="text-[#d1b250] text-xs font-semibold uppercase tracking-widest mb-4">
                  {aboutItem.name}
                </p>
                <ul className="space-y-3">
                  {aboutItem.subItems.map((subItem) => (
                    <li key={subItem.name}>
                      <Link
                        href={localizeHref(subItem.href)}
                        onClick={() => setOpenDropdown(null)}
                        className="text-sm font-medium text-[#30373e] hover:text-[#d1b250] transition"
                      >
                        {subItem.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>

              <Link
                href={localizeHref(ROUTES.platzhirsch[urlLocale])}
                onClick={() => setOpenDropdown(null)}
                className="relative h-56 group overflow-hidden block"
              >
                <Image
                  src="/Images/Home/aboutHome.jpg"
                  alt={t("platzhirsch")}
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-500"
                  sizes="(max-width: 1024px) 100vw, 33vw"
                />
                <div className="absolute inset-0 bg-black/30 group-hover:bg-black/40 transition" />
                <span className="absolute bottom-4 left-4 text-white text-sm font-semibold uppercase tracking-wide">
                  {t("platzhirsch")}
                </span>
              </Link>

              <Link
                href={localizeHref(ROUTES.marken[urlLocale])}
                onClick={() => setOpenDropdown(null)}
                className="relative h-56 group overflow-hidden block"
              >
                <Image
                  src="/Images/Home/slider/minotti-sofa-wohnzimmer.webp"
                  alt={t("brands")}
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-500"
                  sizes="(max-width: 1024px) 100vw, 33vw"
                />
                <div className="absolute inset-0 bg-black/30 group-hover:bg-black/40 transition" />
                <span className="absolute bottom-4 left-4 text-white text-sm font-semibold uppercase tracking-wide">
                  {t("brands")}
                </span>
              </Link>
            </div>
          </div>
        )}
      </div>

      <nav>
        {isOpen && (
          <div
            className="fixed inset-0 z-[999] bg-black/40 lg:hidden"
            onClick={closeMobileMenu}
          >
            <div
              id="mobile-menu"
              role="dialog"
              aria-modal="true"
              aria-label={t("mainNavigation")}
              className="absolute right-0 top-0 h-full w-full sm:w-[350px] bg-white text-[#30373e] shadow-lg transition-transform duration-300 overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex justify-between items-center px-6 py-4 border-b border-gray-200">
                <Link
                  href={localizeHref("/")}
                  onClick={closeMobileMenu}
                  className="w-[140px] relative h-12"
                >
                  <Image
                    src="/Images/Navbar/Logo.png"
                    alt={t("logoAlt")}
                    fill
                    className="object-contain"
                    sizes="140px"
                  />
                </Link>
                <button
                  type="button"
                  onClick={closeMobileMenu}
                  aria-label={t("closeMenu")}
                  className="flex h-11 w-11 items-center justify-center text-[#30373e]"
                >
                  <X aria-hidden="true" />
                </button>
              </div>

              {/* Mobile search — same live results as the desktop dropdown,
                  shown inline under the field. text-base (16px) stops iOS
                  from zooming into the input on focus. */}
              <div className="px-4 pt-4">
                <form
                  onSubmit={handleSearchSubmit}
                  role="search"
                  className="flex items-center border border-[#30373e]/20 rounded-full overflow-hidden focus-within:ring-1 focus-within:ring-[#d1b250] transition"
                >
                  <input
                    type="search"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder={t("search")}
                    aria-label={t("search")}
                    autoComplete="off"
                    enterKeyHint="search"
                    className="flex-1 min-w-0 px-4 py-2.5 text-base outline-none text-[#30373e] placeholder-[#30373e]/50 bg-white [&::-webkit-search-cancel-button]:hidden"
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => setSearchQuery("")}
                      aria-label={t("searchClear")}
                      className="px-2 text-[#30373e]/50 hover:text-[#30373e]"
                    >
                      <X size={16} />
                    </button>
                  )}
                  <button
                    type="submit"
                    aria-label={t("search")}
                    className="px-3 text-[#30373e]/70 hover:text-[#d1b250] transition"
                  >
                    <Search size={18} />
                  </button>
                </form>
                {searchQuery.trim().length >= 2 && (
                  <div className="mt-2 rounded-lg border border-gray-100 bg-white shadow-sm overflow-hidden">
                    {renderSearchResults()}
                  </div>
                )}
              </div>

              <div className="flex flex-col gap-2 px-4 pt-4">
                {navItems.map((item) => {
                  const isProducts = productsItem && item === productsItem;

                  return (
                    <div key={item.name}>
                      {item.subItems ? (
                        <>
                          <button
                            onClick={() => toggleDropdown(item.name)}
                            className="flex justify-between items-center w-full uppercase py-3 border-b border-gray-200 text-[#30373e]"
                          >
                            <span className="text-sm">{item.name}</span>
                            {openDropdown === item.name ? <ChevronUp /> : <ChevronDown />}
                          </button>
                          {openDropdown === item.name && (
                            <ul className="pl-4 pb-2">
                              {item.subItems.map((subItem) => (
                                <li key={subItem.name}>
                                  <Link
                                    href={localizeHref(subItem.href)}
                                    className="block py-2 text-[#30373e]/75 hover:text-[#d1b250] uppercase text-sm"
                                    onClick={closeMobileMenu}
                                  >
                                    {subItem.name}
                                  </Link>
                                </li>
                              ))}
                            </ul>
                          )}
                        </>
                      ) : isProducts ? (
                        <>
                          <button
                            onClick={() => toggleDropdown(item.name)}
                            className="flex justify-between items-center w-full uppercase py-3 border-b border-gray-200 text-[#30373e]"
                          >
                            <span className="text-sm">{item.name}</span>
                            {openDropdown === item.name ? <ChevronUp /> : <ChevronDown />}
                          </button>
                          {openDropdown === item.name && (
                            <div className="pl-4 pb-2">
                              {/* The hub itself — on desktop "Produkte" is a link, on
                                  mobile it was only an accordion toggle. */}
                              <Link
                                href={localizeHref(item.href)}
                                className="block py-2.5 border-b border-gray-100 text-sm font-semibold text-[#7a5f17] hover:text-[#30373e]"
                                onClick={closeMobileMenu}
                              >
                                {t("allProducts")}
                              </Link>
                              {productGroups.map((group) => (
                                <div key={group.title}>
                                  <button
                                    onClick={() =>
                                      setOpenProductGroup((prev) =>
                                        prev === group.title ? null : group.title
                                      )
                                    }
                                    className="flex justify-between items-center w-full py-2.5 border-b border-gray-100 text-[#30373e]"
                                  >
                                    <span className="text-xs font-semibold uppercase tracking-wide">
                                      {group.title}
                                    </span>
                                    {openProductGroup === group.title ? (
                                      <ChevronUp size={16} />
                                    ) : (
                                      <ChevronDown size={16} />
                                    )}
                                  </button>
                                  {openProductGroup === group.title && (
                                    <ul className="pl-3 pb-1">
                                      {group.items.map((catItem) => (
                                        <li key={catItem.key}>
                                          <Link
                                            href={localizeHref(`${shopPath}/${catItem.key}`)}
                                            className="block py-1.5 text-[#30373e]/75 hover:text-[#d1b250] text-sm"
                                            onClick={closeMobileMenu}
                                          >
                                            {catItem.label}
                                          </Link>
                                        </li>
                                      ))}
                                    </ul>
                                  )}
                                </div>
                              ))}
                            </div>
                          )}
                        </>
                      ) : (
                        <Link
                          href={localizeHref(item.href)}
                          className="block py-3 border-b border-gray-200 text-[#30373e] hover:text-[#d1b250] uppercase text-sm"
                          onClick={closeMobileMenu}
                        >
                          {item.name}
                        </Link>
                      )}
                    </div>
                  );
                })}

                {/* Mobile language dropdown */}
                <div>
                  <button
                    onClick={() => toggleDropdown("language")}
                    className="flex justify-between items-center w-full uppercase py-3 border-b border-gray-200 text-[#30373e]"
                  >
                    <div className="flex items-center">
                      <div className="w-6 h-6 mr-2 relative overflow-hidden rounded-sm">
                        <Image
                          src={currentLang.flag}
                          alt={currentLang.name}
                          fill
                          className="object-cover"
                          sizes="24px"
                        />
                      </div>
                      <span className="text-sm">{currentLang.code.toUpperCase()}</span>
                    </div>
                    {openDropdown === "language" ? <ChevronUp /> : <ChevronDown />}
                  </button>
                  {openDropdown === "language" && (
                    <ul className="pl-4 pb-2">
                      {languages.map((lang) => (
                        <li key={lang.code}>
                          <button
                            onClick={() => {
                              handleLanguageChange(lang.code);
                              closeMobileMenu();
                            }}
                            className={`flex items-center py-2 text-left text-sm w-full text-[#30373e] hover:text-[#d1b250] ${currentLang.code === lang.code ? "font-semibold" : ""
                              }`}
                          >
                            <div className="w-6 h-6 mr-2 relative overflow-hidden rounded-sm">
                              <Image
                                src={lang.flag}
                                alt={lang.name}
                                fill
                                className="object-cover"
                                sizes="24px"
                              />
                            </div>
                            {lang.code.toUpperCase()}
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>

              <div className="px-6 mt-6 text-sm text-[#30373e] pb-6 border-t border-gray-200 pt-6">
                <p className="mb-2">Platzhirsch Home Living</p>
                <p className="mb-2">Landstraße 9, 6911 Lochau</p>
                <p className="mb-2">
                  <a
                    href={EMAIL_HREF}
                    className="hover:text-[#d1b250] transition-colors duration-200"
                  >
                    {EMAIL}
                  </a>
                </p>
                <p className="mb-4">
                  <a
                    href={PHONE_HREF}
                    className="hover:text-[#d1b250] transition-colors duration-200"
                  >{PHONE_DISPLAY}</a>
                </p>
                <p className="mb-4 text-[#30373e]/70">{t("hours")}</p>
                <div className="flex gap-3">
                  <a
                    href="https://www.facebook.com/platzhirsch.studio/"
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="Facebook"
                    className="border border-[#d1b250] w-10 h-10 flex items-center justify-center rounded-full text-[#d1b250] hover:bg-[#d1b250] hover:text-white"
                  >
                    <FaFacebookF aria-hidden="true" />
                  </a>
                  <a
                    href="https://www.instagram.com/platzhirsch.studio"
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="Instagram"
                    className="border border-[#d1b250] w-10 h-10 flex items-center justify-center rounded-full text-[#d1b250] hover:bg-[#d1b250] hover:text-white"
                  >
                    <FaInstagram aria-hidden="true" />
                  </a>
                  <a
                    href="https://www.linkedin.com/company/platzhirsch-studio"
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="LinkedIn"
                    className="border border-[#d1b250] w-10 h-10 flex items-center justify-center rounded-full text-[#d1b250] hover:bg-[#d1b250] hover:text-white"
                  >
                    <FaLinkedinIn aria-hidden="true" />
                  </a>
                </div>
              </div>
            </div>
          </div>
        )}
      </nav>
    </header>
  );
};

export default Navbar;