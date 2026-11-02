"use client";

import { useEffect, useId, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { CalendarDays, MessageCircle, Phone } from "@/components/ui/icons";
import { useLocale } from "next-intl";
import { Link, usePathname } from "@/i18n/navigation";
import { PHONE_HREF } from "@/lib/site";
import { ROUTES } from "@/utils/routing";
import cx from "@/components/ui/cx";
import { contextForPath, withContext } from "@/lib/forms/pathContext";
import { TERMIN_PATH } from "@/lib/forms/terminLink";
import { useWhatsAppDigits } from "@/components/WhatsApp/useWhatsAppDigits";

// Tempo-Runde Shell (qa-screenshots/tempo/shell.md): this bar is on EVERY
// page. The WhatsApp notice (four-language texts, wa.me builder) loads only
// when it is opened – requested as soon as the WhatsApp button is pointed at,
// touched or focused – and the button texts come from the server
// (whatsapp.labels, WhatsApp/index.js whatsappLabels). The page context of
// the Termin link comes from the small lib/forms/pathContext.js, the icons
// from ui/icons.js (no lucide-react runtime in the shell).
const loadHint = () => import("@/components/WhatsApp/WhatsAppHint");
const WhatsAppHint = dynamic(loadHint, { ssr: false });
const preloadHint = () => {
  loadHint().catch(() => {});
};

// Mobile CTA bar (< 768 px, 64 px + safe area; Design-Bibel P2, W7, Jury P0.5).
// It only appears once the page's own primary CTA has left the viewport, so a
// view never shows two filled buttons; pages without a marked CTA get it after
// the first screen. It steps aside while the footer is visible (the footer has
// its own contact row) and on routes with their own bottom bars or forms.
//
// F5 (Runde 1, Auftrag 6): while the consent bar is open (it publishes its
// height as --ph-consent-h on <html>, Cookies/cookiecomponent.js) the bar
// stays down and inert: before, it sat fully hidden BEHIND the consent bar but
// stayed in the tab order. The KI button already hides while the consent bar
// shows (Concierge/Launcher.js) and stands 12 px above this bar afterwards, so
// at the bottom edge there is always exactly one layer: consent bar, or CTA
// bar with the KI button above it.
//
// r7-p1: "Termin anfragen" keeps the page context (/yacht-interior →
// /beratung?thema=yacht, city pages → ?ort=…, ux P1-1). On German pages a
// third, narrow entry "KI" opens the KI-Concierge (phones have no floating
// launcher any more, ux P1-4): window.phConcierge when the launcher island
// is mounted, else the page /concierge. Not on /kontakt (request page).
// Runde 5 (ux P1-2, technik P1-6): only with a usable AI (conciergeLive():
// ANTHROPIC_API_KEY set, no mock, no kill switch), passed by Footer.js as
// `ai`. Without it there is no button, no <Link> and so no prefetch of
// /concierge (that page is then noindex and linked from nowhere).
//
// Content CTAs it watches: `[data-cta="primary"]` (opt-in for any page) and
// the primary Button of components/ui (`.bg-action` inside <main>).
//
// WhatsApp (Inhaber-Entscheidung Nr. 15): a third entry only when Footer.js
// passes `whatsapp` (WHATSAPP_NUMBER set; in dev the test number with
// ?whatsapp=test). It never links to wa.me directly: it opens the notice
// (WhatsAppHint) above the bar, and the notice holds the wa.me link. While
// the notice is open the bar stays up.
const CTA_SELECTOR = 'main [data-cta="primary"], main a.bg-action, main button.bg-action';
// Planner pages bring their own bottom bars (former /labs, Inhaber-Entscheidung Nr. 9).
// shop: Warenkorb/Kasse/Bestätigung – keine „Termin“-Leiste über der Kasse (eigene Summenleiste).
// One bar entry: 64 px high at normal text size; with enlarged text the label
// wraps (centred, never cut) and the icon moves above it – the bar grows
// instead of running past the screen edge (WCAG 1.4.4/1.4.10).
// QM shell-home r4 (200 % text, IT): overflow-wrap:anywhere broke
// "Chiamatec|i" and "appuntam|ento", and the bar took 28 % of the screen. The
// label size is capped at 6.5 vw (25 px on a 393 px phone – it still grows
// from 16 px, never past what a half-width column can hold for one word), so
// labels wrap between words only; break-word stays as the last resort.
const ENTRY =
  "flex min-h-16 min-w-0 flex-wrap content-center items-center justify-center gap-x-2 gap-y-0.5 px-2 py-2 text-center text-[length:min(var(--text-ui),6.5vw)] font-medium tracking-[0.005em] leading-tight [overflow-wrap:break-word]";
const HIDDEN_ON = ["portal", "upload", "preview", "kuechenplaner", "sofaplaner", "stil-finder", "3d-ansicht", "dreilaender-rechner", "concierge", "shop"];

// labels: shellLabels().ctaBar, resolved on the server; the bar is rendered
// by Footer.js (Server Component) right after the <footer> (R4-shell-perf).
// calendar (Footer.js, ownCalendarActive): "Termin anfragen" leads to the
// online calendar /termin instead of /beratung; the bar then stays off all
// /termin/** pages (no second CTA in the middle of a booking).
export default function MobileCtaBar({ labels = {}, ai = false, whatsapp = null, calendar = false }) {
  const locale = useLocale();
  const pathname = usePathname();
  // Rat 9,5 B1: target as in src/lib/forms/terminLink.js terminHref(); the label
  // (labels.termin) names the calendar when it leads there (shellLabels).
  const baseHref = calendar ? TERMIN_PATH : ROUTES.beratung[locale] || ROUTES.beratung.de;
  const terminHref = withContext(baseHref, contextForPath(pathname));
  const first = pathname.split("/")[1] || "";
  const excluded = HIDDEN_ON.includes(first) || `/${first}` === baseHref;
  const kontaktHref = ROUTES.kontakt[locale] || ROUTES.kontakt.de;
  const showAi = ai === true && locale === "de" && Boolean(labels.ai) && `/${first}` !== kontaktHref;
  const [visible, setVisible] = useState(false);
  const { digits: waDigits, preview: waPreview } = useWhatsAppDigits(whatsapp?.digits || null, Boolean(whatsapp?.devPreview));
  const showWa = Boolean(waDigits);
  const wa = whatsapp?.labels || {};
  // Open for one path only: a new page closes the notice (its text names the page).
  const [waOpenPath, setWaOpenPath] = useState(null);
  const waOpen = waOpenPath === pathname;
  const waButton = useRef(null);
  const waPanelId = `wa-bar-${useId().replace(/[^a-zA-Z0-9_-]/g, "")}`;
  const closeWa = () => {
    setWaOpenPath(null);
    requestAnimationFrame(() => waButton.current?.focus());
  };

  useEffect(() => {
    if (excluded) return undefined;
    const visibleCtas = new Set();
    let footerVisible = false;
    let ctaCount = 0;
    const root = document.documentElement;
    const consentOpen = () => root.style.getPropertyValue("--ph-consent-h") !== "";

    const update = () => {
      const pastFirstScreen = window.scrollY > window.innerHeight * (ctaCount ? 0.5 : 0.9);
      setVisible(pastFirstScreen && visibleCtas.size === 0 && !footerVisible && !consentOpen());
    };
    // The consent bar sets/removes --ph-consent-h on <html> (style attribute).
    const consentWatch = new MutationObserver(update);
    consentWatch.observe(root, { attributes: true, attributeFilter: ["style"] });

    const io = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        if (entry.target.id === "site-footer") footerVisible = entry.isIntersecting;
        else if (entry.isIntersecting) visibleCtas.add(entry.target);
        else visibleCtas.delete(entry.target);
      }
      update();
    });

    // Content renders after this effect on client navigations: collect once
    // now and once after the next frame.
    const observe = () => {
      const ctas = document.querySelectorAll(CTA_SELECTOR);
      ctaCount = ctas.length;
      ctas.forEach((el) => io.observe(el));
      const footer = document.getElementById("site-footer");
      if (footer) io.observe(footer);
    };
    observe();
    const frame = requestAnimationFrame(observe);

    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update, { passive: true });
    update();
    return () => {
      cancelAnimationFrame(frame);
      io.disconnect();
      consentWatch.disconnect();
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, [pathname, excluded]);

  if (excluded) return null;
  const shown = visible || waOpen;
  // QM shell-home r3 (200 % text, IT): `1fr` = minmax(auto, 1fr) grew with the
  // label's min-content ("appuntamento") and the bar ran 410 px wide on a
  // 393 px screen. minmax(0, …) tracks keep it inside the viewport; labels wrap
  // and the icon moves above the label instead of off-screen (ENTRY).
  const cols = showAi
    ? showWa
      ? "grid-cols-[3.5rem_minmax(0,1fr)_4.75rem_3.5rem]"
      : "grid-cols-[minmax(0,1fr)_minmax(0,1.35fr)_3.5rem]"
    : showWa
      ? "grid-cols-[minmax(0,1fr)_minmax(0,1.35fr)_4.75rem]"
      : "grid-cols-[minmax(0,1fr)_minmax(0,1fr)]";

  return (
    <nav
      aria-label={labels.label}
      inert={!shown}
      className={cx(
        "fixed inset-x-0 bottom-0 z-(--z-cta-bar) grid border-t border-line bg-surface pb-[env(safe-area-inset-bottom)] shadow-overlay md:hidden",
        "transition-transform duration-(--duration-ui) ease-quiet motion-reduce:transition-none",
        cols,
        shown ? "translate-y-0" : "translate-y-full"
      )}
    >
      {/* Four entries (WhatsApp + KI) at 360 px: "Anrufen" as icon with its
          name for assistive tech, so "Termin anfragen" keeps one line. */}
      <a href={PHONE_HREF} aria-label={showWa && showAi ? labels.call : undefined} className={cx(ENTRY, "text-text")}>
        <Phone aria-hidden="true" className="size-5 shrink-0" strokeWidth={1.5} />
        {showWa && showAi ? null : labels.call}
      </a>
      <Link href={terminHref} className={cx(ENTRY, "bg-action text-paper transition-colors duration-(--duration-micro) hover:bg-action-hover")}>
        <CalendarDays aria-hidden="true" className="size-5 shrink-0" strokeWidth={1.5} />
        {labels.termin}
      </Link>
      {waOpen && showWa && (
        <div className="ph-arrive absolute inset-x-0 bottom-full max-h-[calc(100svh-8rem)] overflow-y-auto border-t border-line bg-surface shadow-overlay">
          <WhatsAppHint
            id={waPanelId}
            digits={waDigits}
            locale={locale}
            replyNote={whatsapp?.replyNote || null}
            devPreview={waPreview}
            qr={false}
            onClose={closeWa}
            className="border-0"
          />
        </div>
      )}
      {showWa && (
        <button
          ref={waButton}
          type="button"
          aria-expanded={waOpen}
          aria-controls={waPanelId}
          aria-label={wa.barLabel}
          data-whatsapp-open=""
          onClick={() => setWaOpenPath(waOpen ? null : pathname)}
          onPointerEnter={preloadHint}
          onTouchStart={preloadHint}
          onFocus={preloadHint}
          className={cx(
            "flex min-h-16 flex-col items-center justify-center gap-0.5 border-l border-line text-small text-text",
            waOpen && "bg-surface-raised"
          )}
        >
          <MessageCircle aria-hidden="true" className="size-5" strokeWidth={1.5} />
          <span>{wa.bar}</span>
        </button>
      )}
      {showAi && (
        <Link
          href="/concierge"
          aria-label={labels.aiLabel}
          data-cta-ai=""
          onClick={(e) => {
            if (typeof window.phConcierge !== "function" || e.metaKey || e.ctrlKey || e.shiftKey) return;
            e.preventDefault();
            window.phConcierge();
          }}
          className="flex min-h-16 items-center justify-center border-l border-line text-small font-medium tracking-[0.14em] text-text-accent"
        >
          {labels.ai}
        </Link>
      )}
    </nav>
  );
}
