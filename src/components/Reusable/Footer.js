// Site footer of the Neuauftritt (Design-Bibel §4, §8.4, §9, §14).
// Light (stone band) – the page's one dark surface belongs to "Haus & Café",
// never to the footer (Jury §3.3). Order: who and where (address, hours,
// contact), the internal link columns that distribute authority to the
// pages that must rank (categories, brands, house, services, regions), then
// legal, consent settings, language and the "Ruhige Ansicht" switch.
//
// Server Component (rendered by [locale]/layout.js since R4-shell-perf).
// Interactive parts are islands (FooterIslands.js, LanguageList).
//
// Phones (Footer-Ticket r3-R3-startseite §7, ≤ 2 200 px instead of 3 413 px):
// the link groups are <details> accordions below 768 px – every link stays in
// the HTML (crawlers, no SEO loss), only the lists are folded. From 768 px the
// groups are always open: CSS (::details-content, globals.css) shows them even
// without JS, FooterGroupsOpen sets [open] for older engines and keeps the
// state honest for assistive technology. Address, opening hours, phone and
// legal links are never folded.

import { useLocale, useTranslations } from "next-intl";
import { ArrowUpRight, ChevronDown } from "lucide-react";
import { Button, Container, cx } from "@/components/ui";
import { Logo } from "@/components/Brand";
import {
  ADDRESS,
  DIRECTIONS_URL,
  EMAIL,
  EMAIL_HREF,
  OPENING_HOURS,
  PHONE_DISPLAY,
  PHONE_HREF,
  SOCIAL,
  openingDaysLabel,
} from "@/lib/site";
import { LANDING_PAGES, landingPagePath } from "@/lib/content/landingPages";
import { EXTRA_PAGES } from "@/lib/seo/sitemap/extraPages";
import { brandHref, featuredBrands } from "@/lib/content/brands";
import { ROUTES, productsPath } from "@/utils/routing";
import { useShellCopy } from "@/components/Navbar/shellCopy";
import { buildRooms } from "@/components/Navbar/shellNav";
import { shellLabels } from "@/components/Navbar/shellLabels";
import { localizeHref } from "@/components/Navbar/navMatch";
import { esc } from "@/components/Navbar/megaPanelHtml";
import LinkDelegate from "./LinkDelegate";
import MobileCtaBar from "./MobileCtaBar";
import { ownCalendarActive, terminCtaPath } from "@/components/Booking/config";
import { terminLabel } from "@/lib/forms/terminLink";
import { wunschlisteAvailable } from "@/lib/wunschliste/mode";
import { GERAETE_PATH } from "@/lib/kueche/geraete";
import { LanguageList } from "@/components/Navbar/LanguageSwitcher";
import { CalmViewToggle, FooterGroupsOpen, PrivacySettingsButton } from "./FooterIslands";
import { footerLinks } from "@/lib/seo/footerLinks";
import { conciergeIndexable, conciergeLive } from "@/lib/concierge/config";
import { TerminContextAnchor, TerminContextButton } from "@/components/Forms/TerminContextLink";
// WhatsApp-Beratung (Inhaber-Entscheidung Nr. 15): nur mit WHATSAPP_NUMBER.
import WhatsAppEntry from "@/components/WhatsApp/WhatsAppEntry";
import { whatsappProps } from "@/components/WhatsApp";
import fm from "./Footer.module.css";

// Intro line (Runde 3 P5, gesamtwerk P2, Inhaber-Entscheidung Nr. 3): no
// country list that reads like a delivery promise ("für Österreich,
// Deutschland, …"); advice for customers from the four countries, delivery
// and installation on request. Replaces shell `footer.intro` here because the
// message files belong to the i18n package (proposal: same text there).
// QM shell-home r3: the overline right above already says "… · Lochau am
// Bodensee" – the intro no longer repeats the place.
const FOOTER_INTRO = {
  de: "Wohnen, Küche und Outdoor an einem Ort. Wir beraten Kundinnen und Kunden aus Österreich, Deutschland, der Schweiz und Liechtenstein, Lieferung und Montage auf Wunsch.",
  en: "Living, kitchens and outdoor in one place. We advise customers from Austria, Germany, Switzerland and Liechtenstein; delivery and installation on request.",
  fr: "Séjour, cuisine et extérieur en un seul lieu. Nous conseillons des clients d’Autriche, d’Allemagne, de Suisse et du Liechtenstein ; livraison et montage sur demande.",
  it: "Living, cucina e outdoor in un unico luogo. Offriamo consulenza a clienti da Austria, Germania, Svizzera e Liechtenstein; consegna e montaggio su richiesta.",
};

// Category links ("Sortiment"), same set as before the relaunch.
const CATEGORY_KEYS = ["sofas-couches", "armchairs-stools", "dining-tables", "beds", "kitchen", "lamps", "lounge-furniture-daybeds", "rugs"];

// QM shell-home r5 (IT laptop: "Consulenza e appuntamento" in two lines sat
// ~9 px higher than the first entries of the neighbour columns): text starts
// at the top with fixed padding instead of being centred in the 44 px row,
// so first lines share one baseline however many lines an entry has.
const listLink =
  "inline-flex min-h-11 items-start py-2.5 text-ui [&>svg]:mt-[0.1875rem] font-normal text-text underline decoration-transparent underline-offset-4 transition-colors duration-(--duration-micro) hover:decoration-current";
const legalLink =
  "inline-flex min-h-11 items-center px-2 text-left text-small text-text-soft underline decoration-transparent underline-offset-4 transition-colors duration-(--duration-micro) hover:text-text hover:decoration-current";
// QM shell-home r3: top aligned with the same padding above and below, so
// one- and two-line entries ("Designermöbel / Friedrichshafen") keep one
// rhythm instead of floating centred in rows of different height.
// hyphens/overflow-wrap: with 200 % text "Designermöbel …" is wider than a
// phone column (fixed 1fr track, so it only breaks where it must; QM shell-home).
const regionLink =
  "inline-flex min-h-11 max-w-full items-start py-2.5 hyphens-auto [overflow-wrap:anywhere] text-small text-text-soft underline decoration-transparent underline-offset-4 transition-colors duration-(--duration-micro) hover:text-text hover:decoration-current";
const headingClass = "text-overline uppercase text-text-soft";
// QM shell-home r3: the column count follows a container query in REM on the
// footer <nav> instead of the viewport. 100 %: 2 columns (phones, iPad hoch),
// 3 from 48rem (iPad quer), the five tracks from 68rem (≥ 1280 px). With 200 %
// text the rem doubles, so a 1440 px screen gets 2 columns instead of
// squeezing "info@platzhirsch.studio" into the next column (WCAG 1.4.4).
// In the 2- and 3-column layouts "Das Haus" spans two columns with its list
// in two columns, so no column stands alone next to an empty slot (iPad hoch
// 2 + 2 + 1, iPad quer 3 + 2 before).
const FOOTER_COLS =
  "grid grid-cols-2 gap-x-grid pt-12 md:gap-y-10 md:pb-12 @min-[48rem]:grid-cols-3 @min-[68rem]:grid-cols-[minmax(0,1.4fr)_repeat(4,minmax(0,1fr))]";
// Regions on the same tracks as the columns above (they used to sit on a
// 4-column grid that matched nothing).
const REGION_COLS =
  "mt-3 grid grid-cols-1 gap-x-grid @min-[18rem]:grid-cols-2 @min-[48rem]:grid-cols-3 @min-[68rem]:grid-cols-[minmax(0,1.4fr)_repeat(4,minmax(0,1fr))]";

// Region pages: the regions package's list plus the audited extra region pages
// (sitemap source), de-duplicated by path. German only. Only pages that pass
// the doorway audit (index,follow) – footerLinks() / passesDoorwayAudit, so
// the footer never links a noindex region page (seo P1-3).
export function regionLinks() {
  const seen = new Set();
  return footerLinks([
    ...LANDING_PAGES.filter((p) => p.slug.startsWith("designermoebel-") || p.slug === "moebel-bodensee").map((p) => ({
      href: landingPagePath(p.slug),
      label: p.label,
    })),
    ...EXTRA_PAGES.filter((p) => p.kind === "region").map((p) => ({ href: p.path, label: p.label })),
  ]).filter((link) => (seen.has(link.href) ? false : seen.add(link.href)));
}

// Link lists as one HTML string per <ul> (R6-shell-perf, TBT; same pattern
// as the mega-menu panels, Navbar/megaPanelHtml.js). The ~50 column and region
// links (~150 DOM nodes with their text) were React elements in the RSC
// payload and were hydrated on every page; as innerHTML React keeps only the
// <ul>. The markup is the same, the links stay in the server HTML (crawlers,
// no SEO loss) and navigation stays with LinkDelegate (plain <a> before too).
function linkItemsHtml(links, locale, className) {
  return links
    .map((link) => `<li><a href="${esc(localizeHref(link.href, locale))}" class="${className}">${esc(link.label)}</a></li>`)
    .join("");
}

// One column of the footer navigation: a heading plus a list. Columns are
// plain <div>s inside the single footer <nav>, so screen readers get one
// landmark instead of one per column (QA P3-9).
// Below 768 px the column is a disclosure (<summary> = the heading's text);
// from 768 px the <summary> is hidden and the <h2> labels the open list.
// Runde 4 (ux P1, Footer.js:158): `contextHref` names the Beratung link of
// the column; it is rendered as a small island (Forms/TerminContextLink.js)
// that adds the page context (?thema=yacht, ?produkt=…) like the header, and
// is never prefetched. The other links stay one HTML string.
function LinkColumn({ id, title, links, locale, className, listClassName = "grid-cols-1", contextHref = null }) {
  const lead = contextHref ? links.find((l) => l.href === contextHref) : null;
  const rest = lead ? links.filter((l) => l !== lead) : links;
  return (
    <div className={className}>
      <details data-footer-group="" className={cx(fm.group, "group/fg border-t border-line md:border-t-0")}>
        <summary className={cx(headingClass, "flex min-h-14 cursor-pointer list-none items-center justify-between gap-4 md:hidden [&::-webkit-details-marker]:hidden")}>
          {title}
          <ChevronDown aria-hidden="true" className="size-5 shrink-0 text-text transition-transform duration-(--duration-ui) ease-quiet group-open/fg:rotate-180 motion-reduce:transition-none" strokeWidth={1.5} />
        </summary>
        <h2 id={id} className={cx(headingClass, "hidden md:block")}>
          {title}
        </h2>
        {lead && (
          <ul aria-labelledby={id} className={cx("grid gap-x-grid md:mt-3", listClassName)}>
            <li>
              <TerminContextAnchor href={localizeHref(lead.href, locale)} className={listLink}>
                {lead.label}
              </TerminContextAnchor>
            </li>
          </ul>
        )}
        <ul
          aria-labelledby={id}
          className={cx("grid gap-x-grid pb-4 md:pb-0", !lead && "md:mt-3", listClassName)}
          dangerouslySetInnerHTML={{ __html: linkItemsHtml(rest, locale, listLink) }}
        />
      </details>
    </div>
  );
}

export default function Footer({ activeCategoryKeys = null }) {
  const locale = useLocale();
  const c = useShellCopy();
  const t = useTranslations("Footer");
  const tMenu = useTranslations("ProductsMenu");
  // QM shell-home r3: the same time format as the house chapter of the
  // homepage ("10–18 Uhr", EN "10:00–18:00", FR "10 h – 18 h").
  const tTimes = useTranslations("HomePage.house.times");
  // QM shell-home r4: the day labels too ("Dienstag bis Freitag", IT "Da
  // martedì a venerdì") – before only the times matched the house chapter.
  const tDays = useTranslations("HomePage.house.days");
  const dayKey = (row) => (row.closed ? (row.days.join() === "0,1" ? "sunMon" : null) : timeKey(row));
  const dayLabel = (row) => (dayKey(row) && tDays.has(dayKey(row)) ? tDays(dayKey(row)) : openingDaysLabel(locale, row));
  const timeKey = (row) => (row.days.length === 2 && row.days[0] === 2 && row.days[1] === 5 ? "tueFri" : row.days.length === 1 && row.days[0] === 6 ? "sat" : null);
  const year = new Date().getFullYear();
  const isDe = locale === "de";

  const groups = tMenu.raw("groups") || [];
  const active = activeCategoryKeys ? new Set(activeCategoryKeys) : null;
  const menuItems = groups.flatMap((g) => g.items || []);
  const categories = CATEGORY_KEYS.filter((key) => !active || active.has(key))
    .map((key) => ({ label: menuItems.find((i) => i.key === key)?.label, href: productsPath(locale, key) }))
    .filter((l) => l.label);

  const rooms = buildRooms({ locale, groups, activeCategoryKeys, c });
  const house = rooms.find((r) => r.id === "house");
  const services = rooms.find((r) => r.id === "services");
  // No noindex page in the footer (seo P1-3): Portal login, Upload, Showroom
  // without recording, Newsletter, Outdoor planning … (src/lib/seo/footerLinks.js).
  // Runde 4 (Concierge-Gating): the concierge only with a real AI key.
  const linkOpts = { conciergeIndexable: conciergeIndexable() && conciergeLive() };
  // Welle 2: shared entries (Hotel & Objekt, primary place "Planen & Erleben")
  // appear once, in the services column.
  const houseLinks = footerLinks(
    house.columns.flatMap((col) => col.links).filter((l) => !l.shared && (!l.external || l.href.includes("platzhirsch.cafe"))),
    linkOpts,
  );
  // Only each link's primary place (planners shared from room panels stay out).
  // Column titles = menu names ("Planen & Erleben", "Das Haus"; r7-p1, ux P2-3).
  const serviceLinks = footerLinks(services.columns.flatMap((col) => col.links).filter((l) => !l.shared), linkOpts);
  // Rat 9,5 (T2 A17, Auftrag an T1): the wish list for a move or a wedding is
  // its own occasion (/wunschliste, indexed, 200 in all four languages).
  // Only while the page is live (wunschlisteAvailable(): storage + privacy section).
  if (wunschlisteAvailable() && !serviceLinks.some((l) => l.href === "/wunschliste")) serviceLinks.push({ label: t("wishlist"), href: "/wunschliste" });
  // Inhaber-Entscheidung Nr. 18: „Geräte, die wir einplanen“ (/kuechengeraete, index,
  // 200 in allen vier Sprachen, gleicher Pfad) – direkt nach dem Küchenplaner, sonst am Ende.
  if (!serviceLinks.some((l) => l.href === GERAETE_PATH)) {
    const at = serviceLinks.findIndex((l) => l.href === "/kuechenplaner");
    serviceLinks.splice(at >= 0 ? at + 1 : serviceLinks.length, 0, { label: t("kitchenAppliances"), href: GERAETE_PATH });
  }
  // Inhaber-Entscheidungen Nr. 19–21: „Bad & Wellness“ (/bad-wellness, index, 200 in
  // allen vier Sprachen, gleicher Pfad) – direkt nach den Küchengeräten. Im Menü steht
  // die Seite unter „Outdoor & Pool“ (Spalte, die der Footer nicht zeigt).
  if (!serviceLinks.some((l) => l.href === "/bad-wellness")) {
    const at = serviceLinks.findIndex((l) => l.href === GERAETE_PATH);
    serviceLinks.splice(at >= 0 ? at + 1 : serviceLinks.length, 0, { label: t("badWellness"), href: "/bad-wellness" });
  }

  const brandBase = ROUTES.marken[locale] || ROUTES.marken.de;
  const brands = [
    ...featuredBrands(locale).slice(0, 10).map((b) => ({ label: b.name, href: brandHref(b, brandBase) })),
    { label: c("footer.allBrands"), href: brandBase },
  ];

  const terminHref = ROUTES.beratung[locale] || ROUTES.beratung.de;
  // Knopf „Termin anfragen“: bei aktivem Online-Kalender /termin (Liste unten behält /beratung).
  const calendar = ownCalendarActive();
  const ctaHref = terminCtaPath(locale, ROUTES.beratung);
  // Rat 9,5 B15 (T6 → T1): the regions hub /regionen leads the region list (DE only).
  const regions = isDe ? [{ label: t("allRegions"), href: "/regionen" }, ...regionLinks().filter((l) => l.href !== "/regionen")] : [];
  const labels = shellLabels(c, locale);
  // null ohne Nummer (Produktions-Build) → kein Eintrag, kein wa.me im HTML.
  const whatsapp = whatsappProps(locale);

  return (
    <>
    <footer id="site-footer" className="border-t border-line bg-surface-band text-text">
      {/* Plain <a> links + one delegated client navigation (LinkDelegate)
          instead of ~60 hydrated <Link> components (R4-shell-perf). */}
      <LinkDelegate>
      <Container className="pt-16 pb-12 md:pt-20 xl:pt-24">
        {/* Who and how to reach us. The logo goes without its tagline here:
            the overline below already says "Lochau am Bodensee" (QA P3-1). */}
        {/* grid-cols-1 (minmax(0,1fr)): the implicit auto track grew with
            200 % text past a 393 px screen (QM shell-home, WCAG 1.4.4). */}
        {/* QM shell-home r3 (iPad hoch): in a 5/12 column "Termin / wählen" and
            "+43 5574 / 46255" wrapped – side by side only from lg; below,
            logo/intro and the actions stack, the labels never wrap. */}
        <div className="grid grid-cols-1 gap-10 border-b border-line pb-12 lg:grid-cols-12 lg:gap-grid">
          <div className="@container lg:col-span-7">
            <Logo variant="horizontal" tagline={false} className="h-8 w-auto max-w-full md:h-10" title="Platzhirsch Home Living" sprite />
            {/* QM shell-home r4: "…CAFÉ · LOCHAU / AM BODENSEE" – the parts stay
                together while the column is ≥ 20rem (in rem: wraps freely with
                enlarged text); a line may end on "·" but never start with it. */}
            <p className="mt-6 text-overline uppercase text-text-accent @max-[20rem]:tracking-[0.04em]">
              {String(c("footer.tagline"))
                .split(" · ")
                .map((part, i, all) => (
                  <span key={i}>
                    {i > 0 ? " " : null}
                    <span className="@min-[20rem]:whitespace-nowrap">
                      {part}
                      {i < all.length - 1 ? "\u00a0·" : null}
                    </span>
                  </span>
                ))}
            </p>
            <p className="mt-stack-s max-w-measure text-body text-text-soft">{FOOTER_INTRO[locale] || FOOTER_INTRO.de}</p>
          </div>
          <div className="flex flex-col items-start gap-3 sm:flex-row sm:flex-wrap sm:items-center lg:col-span-5 lg:justify-end lg:self-start">
            {/* Runde 4 (ux P1): page context like header and closing CTA, no prefetch. */}
            <TerminContextButton href={ctaHref} variant="secondary" arrow>
              {/* Rat 9,5 B1: the calendar word when it leads to /termin (terminLink.js terminLabel). */}
              {calendar ? terminLabel(locale, { calendar }) : c("footer.termin")}
            </TerminContextButton>
            {/* -mr-3 cancels the ghost button's px-3, so the number ends on the
                gutter like everything else on the right edge (Abnahme R2).
                Phones (stacked, QM r2): -ml-3 aligns the number flush left
                under the Termin button. */}
            <Button href={PHONE_HREF} variant="ghost" className="tabular -ml-3 inline-flex min-h-11 items-center whitespace-nowrap sm:ml-0 lg:-mr-3">
              {PHONE_DISPLAY}
            </Button>
          </div>
        </div>

        {/* One navigation landmark for all footer links (columns + regions). */}
        <nav aria-label={c("footer.nav")} className="@container">
          {/* Columns: 2 on phones, 3 from 1024 px, and from 1280 px five `auto`
              tracks – each column gets its max-content width first, so
              "Loungemöbel & Daybeds" and "Dienstag – Freitag" stay on one line
              (12-column spans wrapped them at 1024–1440 px, Abnahme R3).
              Optik shell-home: `auto` tracks stretched and left uneven gaps of
              95–150 px. Abschlussprüfung 01.11.2026: minmax(max-content, …)
              could not shrink and scrolled sideways at 1280 px with WCAG 1.4.12
              text spacing (DE +34 px, FR up to 1366 px). Now auto tracks with
              space-between: max-content while it fits, the rest as equal gaps,
              and wrapping instead of overflow under enlarged spacing.
              QM shell-home 01.11.2026: minmax(0,auto) – with 200 % text
              (Firefox "Nur Text zoomen", WCAG 1.4.4) the auto tracks kept
              their min-content and the page scrolled sideways (1584 px at 1440).
              QM shell-home r2: content-sized tracks left uneven gaps (100–240 px)
              – out of grid. Now fixed fr tracks on the grid gap: the four link
              columns are equal, the first (address + opening hours) 1.4×, so
              column starts step evenly; minmax(0,…) still allows wrapping
              under 200 % text / WCAG 1.4.12 instead of sideways scrolling. */}
          <div className={FOOTER_COLS}>
            <div className="col-span-2 pb-8 sm:col-span-1 md:pb-0">
              <h2 id="ph-footer-visit" className={headingClass}>
                {c("footer.visit")}
              </h2>
              {/* pt: the first line stands level with the first link of the
                  neighbouring lists (their 44 px rows centre the text). */}
              <address className="mt-3 pt-2.5 text-ui font-normal not-italic">
                Platzhirsch Home Living
                <br />
                {ADDRESS.street}
                <br />
                {ADDRESS.postalCode} {ADDRESS.city}, {ADDRESS.region}
                <br />
                {t("address.country")}
              </address>
              <ul aria-labelledby="ph-footer-visit" className="mt-2">
                <li>
                  <a href={DIRECTIONS_URL} target="_blank" rel="noopener noreferrer" className={cx(listLink, "gap-1")}>
                    {c("footer.route")}
                    <ArrowUpRight aria-hidden="true" className="size-4" strokeWidth={1.5} />
                    <span className="sr-only"> {c("footer.opensNewTab")}</span>
                  </a>
                </li>
                <li>
                  <a href={PHONE_HREF} className={cx(listLink, "tabular")}>
                    <span className="sr-only">{c("footer.phone")}: </span>
                    {PHONE_DISPLAY}
                  </a>
                </li>
                <li>
                  {/* QM shell-home r4 (200 % text): the address ran to the screen
                      edge – it may break after the "@" (and anywhere as a last resort). */}
                  <a href={EMAIL_HREF} className={cx(listLink, "max-w-full")}>
                    <span className="sr-only">{c("footer.email")}: </span>
                    <span className="min-w-0 [overflow-wrap:anywhere]">
                      {String(EMAIL).split("@")[0]}@<wbr />
                      {String(EMAIL).split("@").slice(1).join("@")}
                    </span>
                  </a>
                </li>
                {whatsapp && (
                  <li>
                    <WhatsAppEntry {...whatsapp} variant="link" />
                  </li>
                )}
              </ul>

              {/* Opening hours right below the address (Abschluss 31.10.2026):
                  they stood above "Planen & Erleben", which with Küchengeräte
                  and Bad & Wellness became the longest list and set the footer
                  height (1 841 px at 1440 px). Phones keep order and gaps
                  (mt-10 = former pb-10 of this column, its pb-8 = former mt-8). */}
              <div className="mt-10">
                <h2 id="ph-footer-hours" className={headingClass}>
                  {c("footer.hours")}
                </h2>
                {/* QM shell-home r4 (200 % text): auto tracks ran "geschlossen" to the
                    screen edge and wrapped "Dienstag / – Freitag". Now one row per
                    entry like the house chapter: day and time side by side while
                    the list is ≥ 14rem wide (in rem), the day wraps in its own
                    track and the time stays right on the first line; narrower
                    (enlarged text) day and time stack. */}
                <dl className="@container mt-3 max-w-[24rem] text-ui font-normal">
                  {OPENING_HOURS.map((row) => (
                    <div key={row.days.join("-")} className="grid grid-cols-1 items-baseline gap-x-4 py-0.5 @min-[14rem]:grid-cols-[minmax(0,1fr)_auto]">
                      <dt>{dayLabel(row)}</dt>
                      <dd className={cx("tabular @min-[14rem]:text-right", row.closed && "text-text-soft")}>{row.closed ? (
                          c("footer.closed")
                        ) : (
                          timeKey(row) && tTimes.has(timeKey(row)) ? (
                            tTimes(timeKey(row))
                          ) : (
                            <>
                              {row.from}–<wbr />
                              {row.to}
                            </>
                          )
                        )}
                      </dd>
                    </div>
                  ))}
                </dl>
                <p className="mt-3 max-w-[32ch] text-small text-text-soft">{c("footer.byAppointment")}</p>
              </div>
            </div>

            {/* "Planen & Erleben" as its own column (the longest list). */}
            <LinkColumn locale={locale} id="ph-footer-services" title={services.label} links={serviceLinks} contextHref={terminHref} className="col-span-2 sm:col-span-1" />

            <LinkColumn
              locale={locale}
              id="ph-footer-collection"
              title={c("footer.collection")}
              links={[...categories, { label: c("footer.allProducts"), href: productsPath(locale) }]}
              className="col-span-2 md:col-span-1"
              listClassName="grid-cols-2 md:grid-cols-1"
            />
            <LinkColumn
              locale={locale}
              id="ph-footer-brands"
              title={c("footer.brands")}
              links={brands}
              className="col-span-2 md:col-span-1"
              listClassName="grid-cols-2 md:grid-cols-1"
            />
            <LinkColumn
              locale={locale}
              id="ph-footer-house"
              title={c("footer.house")}
              links={houseLinks}
              className="col-span-2 @min-[68rem]:col-span-1"
              listClassName="grid-cols-2 @min-[68rem]:grid-cols-1"
            />
          </div>

          {/* Regions (DE only, keeps the former link set): small type in four
              columns, so it never outweighs the main columns (QA P3-11). */}
          {regions.length > 0 && (
            <div className="border-t border-line py-10">
              <h2 id="ph-footer-regions" className={headingClass}>
                {c("footer.regions")}
              </h2>
              <ul
                aria-labelledby="ph-footer-regions"
                className={REGION_COLS}
                dangerouslySetInnerHTML={{ __html: linkItemsHtml(regions, locale, regionLink) }}
              />
            </div>
          )}
        </nav>

        <FooterGroupsOpen />

        {/* Legal, consent, language, calm view. */}
        <div className="grid gap-8 border-t border-line pt-8 lg:grid-cols-12 lg:items-start lg:gap-grid">
          <div className="lg:col-span-5">
            <CalmViewToggle label={c("footer.calm")} hint={c("footer.calmHint")} />
          </div>
          <div className="flex flex-col gap-4 lg:col-span-7 lg:items-end">
            {/* Plain lists, no extra landmarks: the header already carries the
                language navigation (QA P3-9). */}
            <LanguageList landmark={false} labels={labels.language} germanOnly={labels.germanOnly} className="-ml-2 lg:-mr-2 lg:ml-0" />
            <ul aria-label={c("footer.social")} className="-ml-2 flex flex-wrap lg:-mr-2 lg:ml-0">
              {SOCIAL.map(({ name, href }) => (
                <li key={name}>
                  <a href={href} target="_blank" rel="noopener noreferrer" className={cx(listLink, "px-2")}>
                    {name}
                    <span className="sr-only"> {c("footer.opensNewTab")}</span>
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-6 flex flex-col gap-2 text-small text-text-soft md:flex-row md:items-center md:justify-between">
          <p>{c("footer.copyright", { year })}</p>
          <nav aria-label={c("footer.legal")}>
            <ul className="-ml-2 flex flex-wrap md:-mr-2 md:ml-0">
              <li>
                <a href={localizeHref("/impressum", locale)} className={legalLink}>
                  {t("imprint")}
                </a>
              </li>
              <li>
                <a href={localizeHref("/datenschutz", locale)} className={legalLink}>
                  {t("privacy")}
                </a>
              </li>
              {/* AGB (Inhaber 02.11.2026): Rechtslink, nicht durch footerLinks gefiltert (noindex wie Impressum). */}
              <li>
                <a href={localizeHref("/agb", locale)} className={legalLink}>
                  {t("terms")}
                </a>
              </li>
              {/* Widerrufsbelehrung außerhalb des Onlineshops (Inhaber 03.11.2026): Rechtslink wie AGB, noindex. */}
              <li>
                <a href={localizeHref("/widerruf", locale)} className={legalLink}>
                  {t("withdrawal")}
                </a>
              </li>
              <li>
                <PrivacySettingsButton label={t("privacySettings")} className={legalLink} />
              </li>
              {/* Rat 9,5 B13 (T5 page, Auftrag an T1): accessibility statement next to the legal links. */}
              <li>
                <a href={localizeHref("/barrierefreiheit", locale)} className={legalLink}>
                  {t("accessibility")}
                </a>
              </li>
            </ul>
          </nav>
        </div>
        {/* Runde 5 (gesamtwerk P2): room for the concierge launcher at the very
            end of the page, so it never covers "Privatsphäre-Einstellungen".
            The launcher publishes --ph-concierge-h (64 px) only while it is
            mounted; without it this spacer is 0 px. QM r2: from 768 px the
            launcher is a 40 px tab inside the page gutter and covers nothing –
            the spacer only left ~120 px of empty band under the copyright. */}
        <div aria-hidden="true" data-concierge-gap="" className="h-[var(--ph-concierge-h,0px)] md:hidden" />
      </Container>
      </LinkDelegate>
    </footer>
    {/* Mobile CTA bar: right after the footer, outside <main> (§14). */}
    {/* KI entry only with a real AI key (Runde 5, ux P1-2). */}
    <MobileCtaBar labels={labels.ctaBar} ai={conciergeLive()} whatsapp={whatsapp} calendar={calendar} />
    </>
  );
}
