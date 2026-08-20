"use client";
import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import { FaFacebookF, FaInstagram, FaLinkedinIn, FaPinterest } from "react-icons/fa";
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
} from "lucide-react";

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [openDropdown, setOpenDropdown] = useState(null);
  const t = useTranslations('Navbar');
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

  // Handle language change with proper route translation
  const handleLanguageChange = (newLang) => {
    const segments = pathname.split('/').filter(Boolean);
    let currentLocale = supportedLocales.includes(segments[0]?.toLowerCase())
      ? segments.shift()
      : urlLocale;
    const currentPath = segments.join('/');

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

    // Fallback: just switch the locale
    if (!newPath) {
      newPath = currentPath;
    }

    document.cookie = `NEXT_LOCALE=${newLang}; path=/; max-age=${60 * 60 * 24 * 365}`;

    // ✅ Save to localStorage as backup
    localStorage.setItem('preferredLocale', newLang);

    router.push(`/${newLang}${newPath.startsWith('/') ? '' : '/'}${newPath}`);
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

  const toggleDropdown = (name) => {
    setOpenDropdown((prev) => (prev === name ? null : name));
  };

  const closeMobileMenu = () => {
    setIsOpen(false);
    setOpenDropdown(null);
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


  return (
    <header className="fixed w-full z-50 bg-gray-800 text-white shadow-md">
      <nav className="w-full max-w-7xl mx-auto py-4">
        <div className="px-4 flex justify-between items-center">
          <Link
            href={localizeHref("/")}
            prefetch={true}
            className="flex items-center h-16 w-40 relative"
          >
            <Image
              src="/Images/Navbar/Logo.png"
              alt="Logo"
              fill
              className="object-contain object-left"
              sizes="(max-width: 768px) 140px, 160px"
              priority
            />
          </Link>

          <div className="hidden lg:flex items-center space-x-8 relative">
            {navItems.map((item) => (
              <div
                key={item.name}
                className="relative"
                onMouseEnter={() => item.subItems && setOpenDropdown(item.name)}
                onMouseLeave={() => setOpenDropdown(null)}
                onClick={() => item.subItems && toggleDropdown(item.name)}
              >
                {item.subItems ? (
                  <>
                    <div className="flex items-center text-white hover:text-[#d1b250] uppercase text-sm cursor-pointer transition">
                      {item.name}
                      <ChevronDown className="ml-1" />
                    </div>
                    {openDropdown === item.name && (
                      <div className="absolute left-0 w-40  bg-white text-black shadow-2xl py-0 z-50 animate-fadeInSlideDown border border-gray-200">
                        {item.subItems.map((subItem) => (
                          <Link
                            key={subItem.name}
                            href={localizeHref(subItem.href)}
                            prefetch={true}
                            className="block px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-800/93 hover:text-[#d1b250] transition"
                          >
                            {subItem.name}
                          </Link>
                        ))}
                      </div>
                    )}
                  </>
                ) : (
                  <Link
                    href={localizeHref(item.href)}
                    prefetch={true}
                    className="text-white hover:text-[#d1b250] transition uppercase text-sm"
                  >
                    {item.name}
                  </Link>
                )}
              </div>
            ))}
            <style jsx> {`
            @keyframes fadeInSlideDown {
  from {
    opacity: 0;
    transform: translateY(-8px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.animate-fadeInSlideDown {
  animation: fadeInSlideDown 0.25s ease-out;
}`} </style>

            <Link
              href={ROUTES.merkliste[urlLocale] ? localizeHref(ROUTES.merkliste[urlLocale]) : localizeHref("/merkliste")}
              prefetch={true}
              aria-label="Merkliste"
              className="flex items-center justify-between py-2 border-b border-white/10 text-white hover:text-[#d1b250] uppercase text-sm no-underline"
              style={{ textDecoration: 'none' }}
              onClick={closeMobileMenu}
            >
              <div className="flex items-center">
                <ShoppingBag size={24} />
                {getTotalItems() > 0 && (
                  <span className="bg-[#d1b250] text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold -ml-3 -mt-4">
                    {getTotalItems()}
                  </span>
                )}
              </div>
            </Link>

            {/* LANGUAGE DROPDOWN */}
            <div
              className="relative"
              onMouseEnter={() => setOpenDropdown("language")}
              onMouseLeave={() => setOpenDropdown(null)}
              onClick={() => toggleDropdown("language")}
            >
              <div className="flex items-center text-white text-sm cursor-pointer transition">
                <div className="w-6 h-6 mr-2 relative overflow-hidden rounded-sm">
                  <Image
                    src={currentLang.flag}
                    alt={currentLang.name}
                    fill
                    className="object-cover"
                    sizes="24px"
                  />
                </div>
                {currentLang.code.toUpperCase()}
                <ChevronDown className="ml-1 hover:text-[#d1b250]" />
              </div>
              {openDropdown === "language" && (
                <div className="absolute right-0 top-full w-20 bg-white text-black shadow-2xl z-50">
                  {languages.map((lang) => (
                    <button
                      key={lang.code}
                      onClick={() => handleLanguageChange(lang.code)}
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
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Mobile view - Shopping cart and menu button */}
          <div className="lg:hidden flex items-center">
            <Link
              href={ROUTES.merkliste[urlLocale] ? localizeHref(ROUTES.merkliste[urlLocale]) : localizeHref("/merkliste")}
              prefetch={true}
              aria-label="Merkliste"
              className="flex items-center justify-between py-2 text-white hover:text-[#d1b250] uppercase text-sm no-underline mr-1"
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
              className="text-white p-2 focus:outline-none"
              onClick={() => setIsOpen(!isOpen)}
              aria-label="Toggle menu"
            >
              {isOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
        {isOpen && (
          <div
            className="fixed inset-0 z-[999] bg-black/40"
            onClick={closeMobileMenu}
          >
            <div
              className="absolute right-0 top-0 h-full w-full sm:w-[350px] bg-[#0f1624] text-white shadow-lg transition-transform duration-300 overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex justify-between items-center px-6 py-4 border-b border-white/10">
                <Link
                  href={localizeHref("/")}
                  prefetch={true}
                  onClick={closeMobileMenu}
                  className="w-[140px] relative h-12"
                >
                  <Image
                    src="/Images/Navbar/Logo.png"
                    alt="Logo"
                    fill
                    className="object-contain"
                    sizes="140px"
                  />
                </Link>
                <button onClick={closeMobileMenu} className="text-white text-xl">
                  <X />
                </button>
              </div>

              <div className="flex flex-col gap-2 px-4 pt-4">
                {navItems.map((item) => (
                  <div key={item.name}>
                    {item.subItems ? (
                      <>
                        <button
                          onClick={() => toggleDropdown(item.name)}
                          className="flex justify-between items-center w-full uppercase py-3 border-b border-white/10"
                        >
                          <span className="text-sm">{item.name}</span>
                          {openDropdown === item.name ? <ChevronUp /> : <ChevronDown />}
                        </button>
                        {openDropdown === item.name && (
                          <ul className="pl-4 pb-2">
                            {item.subItems.map((subItem) => (
                              <li key={subItem.name}>
                                <Link
                                  prefetch={true}
                                  href={localizeHref(subItem.href)}
                                  className="block py-2 text-white/80 hover:text-[#d1b250] uppercase text-sm"
                                  onClick={closeMobileMenu}
                                >
                                  {subItem.name}
                                </Link>
                              </li>
                            ))}
                          </ul>
                        )}
                      </>
                    ) : (
                      <Link
                        href={localizeHref(item.href)}
                        prefetch={true}
                        className="block py-3 border-b border-white/10 text-white hover:text-[#d1b250] uppercase text-sm"
                        onClick={closeMobileMenu}
                      >
                        {item.name}
                      </Link>
                    )}
                  </div>
                ))}

                {/* Mobile language dropdown */}
                <div>
                  <button
                    onClick={() => toggleDropdown("language")}
                    className="flex justify-between items-center w-full uppercase py-3 border-b border-white/10"
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
                            className={`flex items-center py-2 text-left text-sm w-full ${currentLang.code === lang.code
                              ? "text-[#d1b250]"
                              : "text-white/80 hover:text-[#d1b250]"
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

              <div className="px-6 mt-6 text-sm text-white pb-6">
                <p className="mb-2">Platzhirsch Studio</p>
                <p className="mb-2">Landstraße 11, 6911 Lochau</p>
                <p className="mb-2">
                  <a
                    href="mailto:info@platzhirsch.studio"
                    className="hover:text-[#d1b250] transition-colors duration-200"
                  >
                    info@platzhirsch.studio
                  </a>
                </p>
                <p className="mb-4">
                  <a
                    href="tel:+43557446255"
                    className="hover:text-[#d1b250] transition-colors duration-200"
                  >
                    +43 5574 46255
                  </a>
                </p>
                <div className="flex gap-3">
                  <a
                    href="https://www.facebook.com/platzhirsch.studio/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="border border-[#d1b250] w-8 h-8 flex items-center justify-center rounded-full text-[#d1b250] hover:bg-[#d1b250] hover:text-white"
                  >
                    <FaFacebookF />
                  </a>
                  <a
                    href="https://www.instagram.com/platzhirsch.studio/?hl=en"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="border border-[#d1b250] w-8 h-8 flex items-center justify-center rounded-full text-[#d1b250] hover:bg-[#d1b250] hover:text-white"
                  >
                    <FaInstagram />
                  </a>
                  <a
                    href="https://www.linkedin.com/company/platzhirsch-studio"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="border border-[#d1b250] w-8 h-8 flex items-center justify-center rounded-full text-[#d1b250] hover:bg-[#d1b250] hover:text-white"
                  >
                    <FaLinkedinIn />
                  </a>
                  <a
                    href="#"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="border border-[#d1b250] w-8 h-8 flex items-center justify-center rounded-full text-[#d1b250] hover:bg-[#d1b250] hover:text-white"
                  >
                    <FaPinterest />
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