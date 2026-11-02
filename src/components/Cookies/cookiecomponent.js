"use client";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { setCookie, getCookie, deleteCookie } from "cookies-next";
import { NextIntlClientProvider, useTranslations } from "next-intl";
import dynamic from "next/dynamic";
import { Link } from "@/i18n/navigation";
import { usePathname } from "next/navigation";
import { getLocaleFromPath } from "@/utils/getLocaleFromPath";
// Tempo fix1: shell icon (same markup as lucide-react, ui/icons.js) and cx
// straight from their modules – no lucide runtime and no ui barrel in the
// consent chunk that every page loads.
import { X } from "@/components/ui/icons";
import cx from "@/components/ui/cx";
import { ESSENTIAL_STORAGE, essentialText } from "./essentialStorage";

import {
  ADS_ACTIVE,
  BANNER_SERVICES,
  EINBLICKE_ACTIVE,
  buildCookieServices,
  mapsConsentOverride,
  servicesByCategory,
  visibleConsentServices,
} from "@/lib/legal/services";

// Tempo fix1 (qa-screenshots/tempo/messung1.md §4.1): the service details
// (cookieItem) only render inside an opened "Details" of the settings dialog,
// and the Google tag loader (googleTag) only runs with a saved or a new
// choice. Both are their own chunks now and no longer load with the bar on
// every page. Same component, same calls, same order (load, then remove
// withdrawn cookies).
const CookieDetails = dynamic(() => import("./cookieItem"));
function applyGoogleTag(consent, { removeWithdrawn = false } = {}) {
  return import("./googleTag")
    .then(({ loadGoogleTag, removeWithdrawnCookies }) => {
      loadGoogleTag(consent);
      if (removeWithdrawn) removeWithdrawnCookies(consent);
    })
    .catch(() => {});
}

// Service data comes from the Dienste-Register src/lib/legal/services.js (R4-
// recht-consent): the same entries feed the privacy-policy preview, so banner
// and policy cannot drift apart (unit test: same key set). Only names,
// contacts and codes live there; every visible text (descriptions, purposes,
// cookie types, durations, countries, mechanisms) is translated via the
// "Cookies" namespace in src/messages/*.json, keyed by `id` / `code` / `key`.
// Loading of gtag.js by consent: ./googleTag.js.
export const cookieServices = buildCookieServices();

const DEFAULT_CONSENT = {
  essential: true,
  functional: false,
  statistics: false,
  marketing: false,
  // Individual services (same keys and order as always: cookie format)
  ...Object.fromEntries(BANNER_SERVICES.map((s) => [s.key, false])),
};

// ---------------------------------------------------------------------------
// Consent banner of the Neuauftritt (Design-Bibel §4, §6, §11, §14; R3-shell).
//
// Bar: a calm strip on Paper with one hairline – no radius, no shadow, no
// gold. "Alle akzeptieren" and "Weiter ohne Einwilligung" are the SAME button
// (same frame, size, colour, position weight: no dark pattern, DSA Art. 25),
// "Individuelle Einstellungen" is a text button in the sentence. On phones it
// stays at ≈ 20–22 % of the screen (iPhone 15 Pro: 138 of 659 px), so the
// hero's primary button stays visible above it. Its height is published as
// --ph-consent-h on <html>: globals.css adds it to scroll-padding-bottom and
// to the body's bottom padding, so focus and the last footer row are never
// hidden behind it (WCAG 2.4.11).
// Settings: a native <dialog> opened with showModal() – focus moves in, the
// page behind is inert (focus trap), Esc closes, focus goes back to the
// button that opened it.
//
// Contract with tests and other components (unchanged): accessible names
// from Cookies.* (region "Cookie-Einstellungen", buttons "Alle akzeptieren",
// "Weiter ohne Einwilligung", "Individuelle Einstellungen", "Auswahl
// speichern"), cookie "cookieConsent" with the same JSON keys, and the
// window event "ph-consent-change" (detail = saved consent) for ConsentEmbed.
//
// State: the saved choice is read with useSyncExternalStore (cookie +
// "ph-consent-change"), not with "useEffect → setState" (lint
// react-hooks/set-state-in-effect). Server and hydration render nothing.
// ---------------------------------------------------------------------------

const CONSENT_COOKIE = "cookieConsent";
const CONSENT_EVENT = "ph-consent-change";

const SERVICES_BY_CATEGORY = servicesByCategory();
// r7-p1 (recht P1-4): the dialog lists only services that actually run.
//   - "Google Tag Manager" is the loader of GA4 and controls nothing on its
//     own (Register C4): no switch of its own, it follows Statistik.
//   - "Marketing" (Google Ads) only while an Ads ID exists; the privacy
//     policy says Google Ads is currently not used.
// The cookie keeps every key (format unchanged, tests/e2e/r4-recht-consent).
// R8 (recht P1-4): the rule lives in the register (visibleConsentServices),
// the public privacy policy builds its consent sections from the same rule.
const VISIBLE_BY_CATEGORY = visibleConsentServices();
// Besucher-Einblicke (own heatmap, QA Recht Einblicke P1-1): its switch and
// texts appear only while the feature runs AND its texts are loaded
// (src/lib/einblicke/consentCopy.js, own chunk); otherwise the dialog is
// exactly the one without the heatmap.
const VISIBLE_WITHOUT_EINBLICKE = visibleConsentServices({ einblickeActive: false });
// Checkbox ids of the former markup (kept for anything that targets them).
const INPUT_ID = {
  functional: "functional-cookies",
  statistics: "statistics-cookies",
  marketing: "marketing-cookies",
  googleMaps: "google-maps",
  googleTagManager: "google-tag-manager",
  googleAnalytics: "google-analytics",
  googleAds: "google-ads",
  einblicke: "besucher-einblicke",
};

function subscribeConsent(callback) {
  window.addEventListener(CONSENT_EVENT, callback);
  return () => window.removeEventListener(CONSENT_EVENT, callback);
}
const readConsentCookie = () => getCookie(CONSENT_COOKIE) ?? "";
const noConsentOnServer = () => null;

/** Saved cookie → consent object, or null for "none / unreadable". */
function parseConsent(raw) {
  if (!raw) return null;
  try {
    const value = JSON.parse(raw);
    if (!value || typeof value !== "object" || Array.isArray(value)) return null;
    return { ...DEFAULT_CONSENT, ...value, essential: true };
  } catch {
    return null;
  }
}

/**
 * Category flags always follow their services. functional = Maps: the
 * "googleTagManager" switch controls nothing (gtag.js loads only with
 * Statistik or Marketing, ./googleTag.js); its key stays in the cookie
 * format until the law firm decides C4.
 */
function withCategories(consent) {
  return {
    ...consent,
    functional: Boolean(consent.googleMaps),
    // Statistik = Google Analytics ODER die eigene Heatmap (eigener Schlüssel
    // "einblicke", getrennt wählbar; QA Recht Einblicke P1-1/P2-4).
    statistics: Boolean(consent.googleAnalytics || consent.einblicke),
    marketing: Boolean(consent.googleAds),
  };
}

/** "Alle akzeptieren": own heatmap only while it is shown (no consent for a service not in use). */
const allGranted = (einblicke) =>
  withCategories({
    ...DEFAULT_CONSENT,
    googleMaps: true,
    googleTagManager: true,
    googleAnalytics: true,
    einblicke: Boolean(einblicke),
    // No consent for a service that is not in use (r7-p1).
    googleAds: ADS_ACTIVE,
  });

// Equal weight for every decision button (no nudge): 1 px ink frame on
// paper, fills on hover/focus, 44 px target (§6, §11). R5-shell-seo: py-1.5
// (a two-line label on phones is 47 instead of 53 px; the target stays 44 px).
const choiceButton =
  "inline-flex min-h-11 items-center justify-center border border-ink px-3 py-1.5 text-center text-small font-medium leading-tight text-text " +
  "transition-colors duration-(--duration-micro) ease-quiet hover:bg-action hover:text-paper focus-visible:bg-action focus-visible:text-paper md:px-5 md:text-ui ph-press";
// R8 (ux R3 P1-5): in the bar on phones both buttons get the same narrower
// padding and 13 px type, so "Weiter ohne Einwilligung" fits on one line from 375 px and
// the button row stays at the 44 px target. Both buttons always get the same
// classes (equal weight); the settings dialog keeps choiceButton.
// QM shell-home r3 (200 % text): px-1.5 let "Einwilligung" touch the frame –
// 8 px padding and hyphenation (the bar carries lang) instead.
const barPhone = "max-md:px-2 max-md:text-[0.8125rem] hyphens-auto";
const textButton =
  "inline-flex min-h-6 items-center text-left font-medium text-text underline decoration-line-strong underline-offset-4 transition-colors duration-(--duration-micro) hover:decoration-current";
// T8 (Design-Studio): "Individuelle Einstellungen" inside the bar sentence is
// inline, so its line keeps the same leading as the others (inline-flex +
// min-h-6 opened a gap above the last line). Negative margin + padding keep
// the 24 px target (WCAG 2.5.8) without touching the line box.
const textButtonInline =
  "inline-block -my-[7px] py-[7px] text-left font-medium text-text underline decoration-line-strong underline-offset-4 transition-colors duration-(--duration-micro) hover:decoration-current";
// Motion shell-home (01.11.2026): bar, dialog and opened service details
// arrive (@starting-style, no JS): opacity + 8 / 4 px, UI class 280 ms. The
// bar starts at opacity 0.6 (never 0 – it is painted in the first frame, so
// it cannot delay LCP) and only translates (fixed: no layout shift). Under
// reduced motion and the "Ruhige Ansicht" (motion-reduce: follows both) it
// stands at once.
const arriveBar =
  "transition-[opacity,translate] duration-(--duration-ui) ease-quiet starting:opacity-60 starting:translate-y-2 motion-reduce:transition-none";
const arriveDialog =
  "transition-[opacity,translate] duration-(--duration-ui) ease-quiet starting:open:opacity-0 starting:open:translate-y-2 motion-reduce:transition-none";
const arriveDetails =
  "transition-[opacity,translate] duration-(--duration-ui) ease-quiet starting:opacity-0 starting:-translate-y-1 motion-reduce:transition-none";
const checkbox = "mt-0.5 size-5 shrink-0 accent-ink disabled:opacity-60";

// ---------------------------------------------------------------------------
// Runde 4 (P2 Sprache, recht P1-5 / ux P1-4b): the bar follows ?lang. A visitor
// from /en/sofaplaner lands on /de/sofaplaner?lang=en (308, deOnlyRedirects.cjs)
// and gets the consent bar and dialog in English (FR/IT likewise) – the page
// around it stays German. The language is read once when the bar mounts and
// kept for its lifetime (it survives navigation like the bar itself). Only the
// "Cookies" namespace of that language is passed on; the file loads only for
// these visitors (own chunk), everybody else keeps the page's messages.
// Same keys, button names per language, cookie and event as before.
const FOREIGN_MESSAGES = {
  en: () => import("@/messages/en.json"),
  fr: () => import("@/messages/fr.json"),
  it: () => import("@/messages/it.json"),
};

/** ?lang=en|fr|it on a German page → that language, else null. */
export function consentLang(pathname, search) {
  if (getLocaleFromPath(pathname) !== "de") return null;
  let value = null;
  try {
    value = new URLSearchParams(search || "").get("lang");
  } catch {
    value = null;
  }
  if (Object.hasOwn(FOREIGN_MESSAGES, value)) return value;
  // The page may have rewritten its address before the bar mounts (Bodensee-
  // Licht: replaceState with the light state). The inline script of
  // I18n/GermanOnlyNotice.js noted ?lang while the HTML was parsed.
  const noted = typeof window === "undefined" ? null : window.__phLang;
  return noted && noted.p === pathname && Object.hasOwn(FOREIGN_MESSAGES, noted.l) ? noted.l : null;
}

export default function CookieBanner(props) {
  const pathname = usePathname();
  // ssr:false everywhere it is mounted; the guard keeps a server render safe.
  const [lang] = useState(() => (typeof window === "undefined" ? null : consentLang(pathname, window.location.search)));
  const [loaded, setLoaded] = useState(null); // { lang, messages } | { lang, failed: true }
  useEffect(() => {
    if (!lang) return undefined;
    let live = true;
    FOREIGN_MESSAGES[lang]()
      .then((mod) => live && setLoaded({ lang, messages: { Cookies: (mod.default || mod).Cookies } }))
      .catch(() => live && setLoaded({ lang, failed: true }));
    return () => {
      live = false;
    };
  }, [lang]);

  // Besucher-Einblicke: texts from their own chunk, only while the feature
  // runs. The bar waits for them, so nobody can accept the heatmap before it
  // is named (undefined = loading, null = off or failed → no heatmap switch).
  const [ebCopy, setEbCopy] = useState(EINBLICKE_ACTIVE ? undefined : null);
  useEffect(() => {
    if (!EINBLICKE_ACTIVE) return undefined;
    let live = true;
    import("@/lib/einblicke/consentCopy")
      .then((mod) => live && setEbCopy(mod.EINBLICKE_CONSENT_COPY))
      .catch(() => live && setEbCopy(null));
    return () => {
      live = false;
    };
  }, []);

  if (ebCopy === undefined) return null;
  if (!lang) return <ConsentUi {...props} ebCopy={ebCopy} />;
  // Wait for the visitor's language (a few hundred ms after idle) instead of
  // flashing the German bar first; on a failed load the German bar shows.
  if (!loaded) return null;
  if (loaded.failed) return <ConsentUi {...props} ebCopy={ebCopy} />;
  return (
    <NextIntlClientProvider locale={lang} messages={loaded.messages} timeZone="Europe/Vienna">
      <ConsentUi {...props} lang={lang} ebCopy={ebCopy} />
    </NextIntlClientProvider>
  );
}

function ConsentUi({ forceShow = false, onClose, lang = null, ebCopy = null }) {
  const t = useTranslations("Cookies");
  const pathname = usePathname();
  // Texts, the neutral Maps wording and the policy links follow ?lang.
  const locale = lang || getLocaleFromPath(pathname);
  // Besucher-Einblicke texts of this language (null: no heatmap switch).
  const eb = ebCopy ? ebCopy[locale] || ebCopy.de : null;
  const visible = eb ? VISIBLE_BY_CATEGORY : VISIBLE_WITHOUT_EINBLICKE;
  // "Rundgang" only while the showroom tour is live (services.js
  // mapsConsentOverride); otherwise the neutral Street-View wording.
  const tc = (key) => mapsConsentOverride(key, locale) ?? t(key);

  // null = server / hydration pass, "" = no cookie, else the raw cookie.
  const raw = useSyncExternalStore(subscribeConsent, readConsentCookie, noConsentOnServer);
  const saved = raw ? parseConsent(raw) : null;

  // Footer "Privatsphäre-Einstellungen" (forceShow) opens the dialog directly.
  const [dialogOpen, setDialogOpen] = useState(forceShow);
  // Service choices made in the dialog but not saved yet; everything not
  // touched follows the saved consent (also when ConsentEmbed changes it).
  const [overrides, setOverrides] = useState({});
  const [expanded, setExpanded] = useState({});
  const consent = withCategories({ ...(saved || DEFAULT_CONSENT), ...overrides });

  const showBar = !forceShow && raw !== null && !saved;
  const showDialog = raw !== null && dialogOpen;

  // A broken cookie (old format, extension, truncated) is dropped; the bar
  // asks again (it shows because `saved` is null).
  useEffect(() => {
    if (raw && !saved) deleteCookie(CONSENT_COOKIE);
  }, [raw, saved]);

  // Apply a choice saved on an earlier visit once per page load: Consent Mode
  // update, gtag.js only with Statistik or Marketing. The footer instance (forceShow) skips it.
  const restoredRef = useRef(false);
  useEffect(() => {
    if (forceShow || restoredRef.current || raw === null) return;
    restoredRef.current = true;
    if (!saved) return;
    applyGoogleTag(saved);
  }, [forceShow, raw, saved]);

  // Bar height → --ph-consent-h (scroll padding + body padding, globals.css).
  const barRef = useRef(null);
  useEffect(() => {
    const bar = barRef.current;
    if (!showBar || !bar) return undefined;
    const root = document.documentElement;
    const publish = () => root.style.setProperty("--ph-consent-h", `${Math.ceil(bar.getBoundingClientRect().height)}px`);
    publish();
    const observer = new ResizeObserver(publish);
    observer.observe(bar);
    return () => {
      observer.disconnect();
      root.style.removeProperty("--ph-consent-h");
    };
  }, [showBar]);

  // Settings dialog: showModal() (focus trap, inert page, Esc), page scroll
  // locked while open, focus back to the opener afterwards.
  const dialogRef = useRef(null);
  const openerRef = useRef(null);
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!showDialog || !dialog || dialog.open) return undefined;
    openerRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    dialog.showModal();
    const root = document.documentElement;
    const previousOverflow = root.style.overflow;
    root.style.overflow = "hidden";
    return () => {
      root.style.overflow = previousOverflow;
    };
  }, [showDialog]);

  // Every way out (Esc, ×, backdrop, a decision) ends here via the native
  // "close" event, so React state and the browser never disagree.
  const onDialogClosed = () => {
    const opener = openerRef.current;
    openerRef.current = null;
    setDialogOpen(false);
    setOverrides({});
    if (opener && opener.isConnected) opener.focus({ preventScroll: true });
    if (onClose) onClose(); // footer: unmount this instance
  };
  const closeDialog = () => {
    if (dialogRef.current?.open) dialogRef.current.close();
    else onDialogClosed();
  };

  // Persist + apply the choice in place (no reload): cookie, Consent Mode
  // update, gtag.js with Statistik or Marketing, notify consent-gated embeds, close.
  const saveConsent = (consentState) => {
    const value = withCategories({ ...DEFAULT_CONSENT, ...consentState, essential: true });
    setCookie(CONSENT_COOKIE, JSON.stringify(value), {
      maxAge: 60 * 60 * 24 * 365,
      sameSite: "lax",
      secure: window.location.protocol === "https:",
    });
    applyGoogleTag(value, { removeWithdrawn: true });
    window.dispatchEvent(new CustomEvent(CONSENT_EVENT, { detail: value }));
    if (dialogOpen) closeDialog();
  };

  const handleAcceptAll = () => saveConsent(allGranted(eb));
  const handleRejectAll = () => saveConsent(DEFAULT_CONSENT);
  const handleAcceptSelected = () => saveConsent(consent);

  const toggleConsent = (key) => {
    // Statistik also switches its loader key (googleTagManager), r7-p1.
    // Only visible services: no consent for the heatmap while it is switched off.
    const services = key === "statistics" ? [...visible.statistics, "googleTagManager"] : visible[key] || [key];
    const next = !consent[key];
    setOverrides((prev) => ({ ...prev, ...Object.fromEntries(services.map((service) => [service, next])) }));
  };
  const toggleDetails = (key) => setExpanded((prev) => ({ ...prev, [key]: !prev[key] }));

  // "Funktional (2)" etc. — the count is the number of services in the category.
  const categoryLabel = (category) => `${t(`categories.${category}.name`)} (${visible[category].length})`;
  const detailsLabel = (open) => (open ? t("hideDetails") : t("showDetails"));

  const detailsButton = (key) => (
    <button
      type="button"
      onClick={() => toggleDetails(key)}
      aria-expanded={Boolean(expanded[key])}
      aria-controls={`ph-consent-details-${key}`}
      className={cx(textButton, "min-h-11 text-small")}
    >
      {detailsLabel(expanded[key])}
    </button>
  );

  const serviceOf = (category, id) => cookieServices[category][id];

  return (
    <>
      {showBar && (
        <section
          ref={barRef}
          role="region"
          aria-label={t("bannerTitle")}
          lang={lang || undefined}
          data-consent-bar=""
          className={cx("fixed inset-x-0 bottom-0 z-(--z-overlay) max-h-[50svh] overflow-y-auto overscroll-contain border-t border-line-strong bg-surface pb-[env(safe-area-inset-bottom)] text-text @container", arriveBar)}
        >
          {/* R5-shell-seo: tighter on phones (padding, gap), so this bar plus
              the portal tab bar (Portal/Core/PortalNav.js stands on top of it
              via --ph-consent-h) take less of the iPhone screen. Layout only:
              texts, names and buttons are unchanged.
              R8 (ux R3 P1-5): phones 13 px type, 8 px padding, one button
              row: iPhone 15 Pro 145 → 127 px (DE), 111 px (EN). Both
              decisions keep the same frame, size and weight. */}
          {/* Optik shell-home: text and buttons side by side only from lg –
              at 768 px the two buttons squeezed the text into a 300 px column
              (13 lines, a third of the tablet screen); stacked it is 4 lines. */}
          {/* QM shell-home r5 (iPad quer, 200 % text): with lg:flex-row the text
              stood in a 149 px column next to the buttons and the buttons lay
              outside the screen. Side by side, the long text and the run-in
              title now follow container queries in REM on the bar (64rem /
              48rem): with enlarged text the bar stacks and shows the short
              sentence, so both buttons stay in view. */}
          <div className="mx-auto flex max-w-page flex-col gap-1.5 px-gutter pt-2 pb-2 md:gap-4 md:py-4 @min-[64rem]:flex-row @min-[64rem]:items-center @min-[64rem]:gap-grid">
            <div className="min-w-0 @min-[64rem]:flex-1">
              {/* Not a heading: the bar is on every page and must not join the
                  outline. The region carries the same name ("Cookie-
                  Einstellungen", aria-label) on every device; on phones the
                  visible title gives way to the sentence: as a lead-in it
                  pushed the bar to 27 % of 320 × 640 (limit 25 %, QA R3-shell
                  P3-4, measured 26.10.2026). */}
              {/* QM shell-home r3: the title is a run-in of the sentence (wide screens
                  only) instead of its own line, and the long text appears
                  only on screens that are wide AND at least 560 px high –
                  landscape phones (844 × 390) get the short sentence too,
                  instead of five lines over 230 of 390 px. */}
              {/* QM shell-home r5 (laptop 1280 × 800): the long text made the bar
                  138 px high and it covered half of the hero button "Termin
                  wählen". The long text now needs a bar ≥ 64rem wide (the
                  side-by-side layout) and ≥ 54rem (864 px) of screen height; laptops,
                  iPads (hoch: "Termin wählen" touched the bar) and phones get the short sentence, which
                  names the transfer to Google/USA as well (Runde 4). */}
              {/* r7-p1 (gesamtwerk P1-7, recht P1-4): purposes and services in
                  the house's tone; phones get the short sentence so the bar
                  stays compact (≤ 30 % of the screen) above the hero CTA. */}
              <p className="max-w-measure text-[0.8125rem] leading-snug text-text-soft md:text-small md:leading-normal @min-[64rem]:max-w-none">
                <span className="hidden font-medium text-text @min-[64rem]:[@media(min-height:54rem)]:inline">{t("bannerTitle")}{locale === "fr" ? "\u202f: " : ": "}</span>
                {/* Runde 4 (recht P1-5): the first layer names the transfer
                    to Google, in part to the USA – inside the short phone
                    sentence, as its own sentence (bannerUsa) on larger screens. */}
                {eb ? <span className="@min-[64rem]:[@media(min-height:54rem)]:hidden">{eb.bannerTextShort}</span> : <span className="@min-[64rem]:[@media(min-height:54rem)]:hidden">{t("bannerTextShort")}</span>}
                <span className="hidden @min-[64rem]:[@media(min-height:54rem)]:inline">
                  {mapsConsentOverride("bannerText", locale) ?? t("bannerText")} {eb && `${eb.banner} `}{t("bannerUsa")}
                </span>{" "}
                <button type="button" onClick={() => setDialogOpen(true)} aria-haspopup="dialog" className={textButtonInline}>
                  {t("customize")}
                </button>
              </p>
            </div>
            {/* QM shell-home r3 (200 % text): side by side only while the bar is
                ≥ 20rem wide in rem – enlarged text stacks the two (equal) buttons
                instead of pressing "Einwilligung" against the frame; the bar
                never takes more than half the screen (it scrolls inside). */}
            <div className="grid grid-cols-1 gap-2 @min-[20rem]:grid-cols-2 md:flex md:shrink-0 md:gap-3">
              <button type="button" onClick={handleAcceptAll} className={cx(choiceButton, barPhone)}>
                {t("acceptAll")}
              </button>
              <button type="button" onClick={handleRejectAll} className={cx(choiceButton, barPhone)}>
                {t("rejectAll")}
              </button>
            </div>
          </div>
        </section>
      )}

      {showDialog && (
        <dialog
          ref={dialogRef}
          aria-labelledby="cookie-settings-title"
          lang={lang || undefined}
          onClose={onDialogClosed}
          onClick={(event) => {
            if (event.target === event.currentTarget) closeDialog(); // backdrop
          }}
          className={cx(
            "fixed inset-0 m-0 h-dvh max-h-none w-full max-w-none overflow-y-auto overscroll-contain bg-surface p-0 text-text",
            "md:m-auto md:h-auto md:max-h-[90dvh] md:max-w-[50rem] md:border md:border-line-strong",
            "backdrop:bg-ink-deep/40",
            arriveDialog
          )}
        >
          <div className="sticky top-0 z-10 flex items-start justify-between gap-4 border-b border-line bg-surface px-gutter pt-5 pb-4 md:px-10 md:pt-8">
            <h2 id="cookie-settings-title" className="text-title text-text">
              {t("modalTitle")}
            </h2>
            <button
              type="button"
              onClick={closeDialog}
              aria-label={t("close")}
              className="-mt-1 -mr-2.5 inline-flex min-h-11 min-w-11 shrink-0 items-center justify-center text-text transition-colors duration-(--duration-micro) hover:text-text-soft"
            >
              <X aria-hidden="true" className="size-6" strokeWidth={1.5} />
            </button>
          </div>

          <div className="px-gutter pt-5 pb-8 md:px-10">
            <p className="max-w-measure text-small text-text-soft">{t("intro")}</p>

            {/* The three decisions, side by side and identical (no nudge). */}
            <div className="mt-6 grid gap-2 sm:grid-cols-3 sm:gap-3">
              <button type="button" onClick={handleAcceptAll} className={choiceButton}>
                {t("acceptAll")}
              </button>
              <button type="button" onClick={handleRejectAll} className={choiceButton}>
                {t("rejectAll")}
              </button>
              <button type="button" onClick={handleAcceptSelected} className={choiceButton}>
                {t("savePreferences")}
              </button>
            </div>

            <p className="mt-6 max-w-measure text-small text-text-soft">{t("thirdCountryNotice")}</p>
            <p className="mt-3 max-w-measure text-small text-text-soft">{t("consentModeNotice")}</p>

            <ul className="mt-8 border-t border-line">
              {/* Essential: always on. */}
              <li className="border-b border-line py-5">
                <label htmlFor="essential-cookies" className="flex items-start gap-3">
                  <input type="checkbox" id="essential-cookies" checked={consent.essential} disabled className={checkbox} />
                  <span className="text-ui font-medium">{t("categories.essential.name")}</span>
                </label>
                <p className="mt-1 ml-8 max-w-measure text-small text-text-soft">{t("categories.essential.description")}</p>
                {/* Rat 9,5 A13: die Speicher einzeln, wie in der Datenschutzerklärung (#cookies). */}
                <div className="mt-2 ml-8 max-w-measure text-small text-text-soft" data-essential-storage="">
                  <p>{essentialText(t, "title")}</p>
                  <ul className="mt-1 space-y-1">
                    {ESSENTIAL_STORAGE.map((entry) => (
                      <li key={entry.key}>
                        {entry.names.map((name, i) => (
                          <span key={name}>
                            {i > 0 && ", "}
                            <code className="text-text">{name}</code>
                          </span>
                        ))}
                        : {essentialText(t, entry.key)}
                      </li>
                    ))}
                  </ul>
                </div>
              </li>

              {Object.entries(visible).map(([category, services]) => (
                <li key={category} className="border-b border-line py-5">
                  <label htmlFor={INPUT_ID[category]} className="flex items-start gap-3">
                    <input
                      type="checkbox"
                      id={INPUT_ID[category]}
                      checked={consent[category]}
                      onChange={() => toggleConsent(category)}
                      className={checkbox}
                    />
                    <span className="text-ui font-medium">{categoryLabel(category)}</span>
                  </label>
                  {/* Statistik nennt beide Dienste, solange die eigene Heatmap läuft (QA Recht Einblicke P1-1). */}
                  <p className="mt-1 ml-8 max-w-measure text-small text-text-soft">
                    {category === "statistics" && eb ? eb.statistics : tc(`categories.${category}.description`)}
                  </p>
                  <div className="ml-8">{detailsButton(category)}</div>

                  {expanded[category] && (
                    <ul id={`ph-consent-details-${category}`} className={cx("mt-2 ml-8 space-y-5 border-l border-line pl-4", arriveDetails)}>
                      {services.map((id) => (
                        <li key={id}>
                          <label htmlFor={INPUT_ID[id]} className="flex items-start gap-3">
                            <input
                              type="checkbox"
                              id={INPUT_ID[id]}
                              checked={consent[id]}
                              onChange={() => toggleConsent(id)}
                              className={checkbox}
                            />
                            <span className="text-ui font-medium">{serviceOf(category, id).title}</span>
                          </label>
                          <p className="mt-1 ml-8 max-w-measure text-small text-text-soft">
                            {id === "einblicke" ? eb.description : tc(`services.${id}.description`)}
                          </p>
                          <div className="ml-8">{detailsButton(id)}</div>
                          {expanded[id] && (
                            <div id={`ph-consent-details-${id}`} className={cx("ml-8", arriveDetails)}>
                              <CookieDetails service={serviceOf(category, id)} texts={id === "einblicke" ? eb : null} />
                            </div>
                          )}
                        </li>
                      ))}
                    </ul>
                  )}
                </li>
              ))}
            </ul>

            <p className="mt-6 flex flex-wrap items-center gap-x-4 text-small">
              <Link href="/datenschutz" locale={locale} className={cx(textButton, "min-h-11")}>
                {t("privacyPolicy")}
              </Link>
              <Link href="/impressum" locale={locale} className={cx(textButton, "min-h-11")}>
                {t("imprint")}
              </Link>
            </p>
          </div>
        </dialog>
      )}
    </>
  );
}
