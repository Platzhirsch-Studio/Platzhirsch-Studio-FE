// Site header of the Neuauftritt (Design-Bibel §6, §9, §10.1, W7, W13, W16).
//
//   PLATZHIRSCH  Wohnen Küche Schlafen Outdoor&Pool Marken Planen&Erleben Das Haus   ⌕  ♡  DE  [ Termin ]
//
// 72 px from 1280 px (sticky, never hides), 56 px below (slides away on
// scroll-down, back on scroll-up). Logo top left, "Termin" top right as the
// only highlighted control – `secondary` (1 px ink frame), so the content CTA
// stays the one filled button per view (P2). Below 1280 px the rooms move into
// a full-screen <dialog>.
//
// Server Component, rendered by [locale]/layout.js (R4-shell-perf). It builds
// the menu data AND every text the islands show (plain strings, see
// shellLabels.js) and hands them to small client islands (HeaderFrame,
// DesktopNav, SearchDialog, SelectionLink, LanguageSwitcher, MobileMenu). The
// islands therefore ship neither the copy tables (shellCopy.js) nor the menu
// builders, and format no ICU message while hydrating.
//
// `activeCategoryKeys` (layout.js → only categories that have products) hides
// empty categories; null = backend unreachable → full menu.

import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Logo, Wordmark } from "@/components/Brand";
import { ROUTES } from "@/utils/routing";
import { useShellCopy } from "./shellCopy";
import { buildRooms } from "./shellNav";
import { shellLabels } from "./shellLabels";
import { desktopRooms } from "./megaPanelHtml";
import HeaderFrame from "./HeaderFrame";
import DesktopNav from "./DesktopNav";
import SearchDialog from "./SearchDialog";
import SelectionLink from "./SelectionLink";
// Ideenboard (Inhaber-Entscheidung Nr. 14): dezent neben „Ihre Auswahl“, ab 640 px
// (die 320-px-Zeile bleibt unverändert; auf dem Telefon steht es im Menü).
import IdeenboardNavLink from "@/components/Pinterest/IdeenboardNavLink";
import LanguageSwitcher from "./LanguageSwitcher";
import MobileMenu from "./MobileMenu";
import HeaderCta from "./HeaderCta";
import cx from "@/components/ui/cx";
import s from "./Navbar.module.css";
// Shop-Feeling (31.10.2026): Warenkorb-Symbol nur bei aktivem Shop (SHOP_MODE
// test/live, Server-Entscheidung; Produktion standardmäßig off). Messung
// 31.10.: Abstand Menü ↔ Symbolgruppe 67 px bei 1280 und 1440 px, das 44-px-
// Symbol (+8 px Abstand) lässt ≈ 41 px – keine Überlappung.
import CartLink from "./CartLink";
import { shopActive } from "@/lib/shop/mode";
import { shopCopy } from "@/lib/shop/copy";
import { getMode, isAvailable } from "@/lib/concierge/config";
import { terminCtaPath } from "@/components/Booking/config";

// KI-Concierge in the menu only when it really answers: ANTHROPIC_API_KEY set
// (mode "live") and no kill switch (R4 technik P2-6, neuland P1-7). Without a
// key the entry led to a contact notice and was prefetched on every page.
const conciergeInMenu = () => getMode() === "live" && isAvailable();

/** Locales with long labels (FR/IT, gemessen 01.11.2026: Liste bei 16 px 629/617 px,
 * DE/EN 596/586 px). Only the server's first guess of the bar density
 * (Navbar.module.css data-nav-start); the header then measures (navFit.js). */
export const LONG_NAV = new Set(["fr", "it"]);
export function navStart(locale) {
  return LONG_NAV.has(locale) ? "long" : "short";
}

export default function Navbar({ activeCategoryKeys = null }) {
  const locale = useLocale();
  const c = useShellCopy();
  const tMenu = useTranslations("ProductsMenu");
  // Seven items; "Planen & Erleben" links the features of src/lib/features.js
  // (switches default ON, Inhaber-Entscheidung Nr. 9).
  const rooms = buildRooms({ locale, groups: tMenu.raw("groups") || [], activeCategoryKeys, c, concierge: conciergeInMenu() });
  // Online-Kalender aktiv (terminMode frappe/mock) → /termin, sonst die Beratungsseite.
  const terminHref = terminCtaPath(locale, ROUTES.beratung);
  const selectionHref = ROUTES.merkliste[locale] || ROUTES.merkliste.de;
  const labels = shellLabels(c, locale);
  // ONE slim copy of the menu for both islands (R4 technik P1-2): React
  // serialises a shared object once in the RSC payload.
  const navRooms = desktopRooms(rooms);
  const shop = shopActive();
  const shopText = shop ? shopCopy(locale) : null;

  return (
    <>
      {/* First focusable element of every page (§14). */}
      <a
        href="#main"
        className="sr-only z-(--z-overlay) bg-action px-4 py-3 text-ui text-paper focus:not-sr-only focus:fixed focus:top-2 focus:left-2"
      >
        {c("header.skip")}
      </a>

      <HeaderFrame navStart={navStart(locale)} className="sticky top-0 z-(--z-header) border-b border-line bg-surface">
        {/* One gutter on every width (§6: 20/48/80 px), so the logo sits on the
            same left edge as breadcrumb, H1 and footer. Below 640 px the gaps
            shrink and the wordmark may scale down (max. 213 px = 20 px high),
            so the row fits 320 px without pushing the menu button off-screen. */}
        {/* xl:gap-2 (QM r2): 16 px more for the one-line bar, so FR/IT at 1280 px
            keep 12 px between the words (navFit level 3 instead of 4). */}
        {/* QM shell-home r5 (iPad hoch, 200 % text): the tools row ran to
            1 053 px on an 834 px screen ("Termin" cut, menu button off-screen).
            The tablet parts (lockup, Ideenboard, "Termin", "Menü" label) now
            follow container queries in REM on this row (42rem lockup, 36rem Ideenboard/label, 30rem "Termin" – of the content box): at
            100 % they appear at the same widths as md / sm, with enlarged
            text the row falls back to the phone header that fits. */}
        <div className="@container mx-auto flex h-header max-w-page items-center gap-2 px-gutter sm:gap-4 xl:gap-2">
          <Link
            href="/"
            aria-label={c("header.home")}
            data-header-logo=""
            className="flex min-h-11 min-w-0 flex-1 items-center pr-2 sm:pr-0 @min-[42rem]:flex-none @min-[42rem]:shrink-0"
          >
            {/* ≤ 20 px wordmark on phones, 28 px lockup from 768 px (§3). */}
            <Wordmark className="block h-auto w-full max-w-[213px] @min-[42rem]:hidden" decorative sprite />
            <Logo variant="horizontal" tagline={false} className="hidden h-7 w-auto @min-[42rem]:block" decorative sprite />
          </Link>

          {/* Inhaber 01.11.2026: from 1280 px the full bar in ONE line in all
              four languages. The header measures the list against this slot
              (navFit.js, data-nav) and tightens font size/padding; only if even
              the densest level does not fit (WCAG 1.4.12 text spacing, large
              text) the bar is hidden here and the menu button takes over – the
              list can never run over logo or search. */}
          <div data-nav-slot="" className={cx(s.navSlot, "hidden h-full min-w-0 flex-1 justify-center xl:ml-2 xl:flex")}>
            <DesktopNav rooms={navRooms} locale={locale} label={c("header.mainNav")} />
          </div>

          {/* Nav-Fix 30.10.: Die Seite ist max. 1440 px breit (max-w-page). Ab 1536 px
              blieben keine Textlabels für Auswahl/Ideenboard und kein breiteres
              Menü-Padding übrig – Logo, Menü und Suche überlappten. Daher ab
              1440 px überall dieselbe Kopfzeile, Symbole mit aria-label. */}
          {/* xl:gap-0: the 44 px icon boxes keep 20 px between the glyphs; the
              8 px gaps went to the menu bar (one line at 1280 px). */}
          <div className={cx(s.tools, "ml-auto flex shrink-0 items-center @min-[42rem]:gap-2 xl:ml-0 xl:gap-0")}>
            <SearchDialog labels={labels.search} />
            <SelectionLink href={selectionHref} labels={labels.selection} />
            {shop && <CartLink labels={{ label: shopText.cartLink, count: shopText.cartLinkCount }} />}
            <div className="hidden @min-[36rem]:block">
              <IdeenboardNavLink />
            </div>
            <div className="hidden xl:block">
              <LanguageSwitcher labels={labels.language} germanOnly={labels.germanOnly} />
            </div>
            {/* Wrapper: Button's own inline-flex would override `hidden`. */}
            <div data-header-cta="" className="ml-2 hidden @min-[30rem]:block xl:max-[1440px]:in-data-[nav-start=long]:ml-1">
              {/* Keeps the page context (?thema=, ?ort=), r7-p1 ux P1-1. */}
              <HeaderCta href={terminHref} label={c("header.termin")} />
            </div>
            {/* Tempo-Runde Shell: the menu's wordmark as a server slot (sprite
                <use>), so brandPaths.js stays out of the client bundle. */}
            <MobileMenu rooms={navRooms} terminHref={terminHref} selectionHref={selectionHref} labels={labels} burgerClassName={s.burger} dialogClassName={s.menuDialog} wordmark={<Wordmark className="block h-auto w-full max-w-[213px]" decorative sprite />} />
          </div>
        </div>
      </HeaderFrame>
    </>
  );
}
