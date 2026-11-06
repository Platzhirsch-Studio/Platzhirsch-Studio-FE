"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Box, CalendarDays, CreditCard, Droplet, FileText, Hammer, House, Menu, MessageCircle, PencilRuler, Ruler, ShieldCheck, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { tx } from "@/lib/portal/i18n";
import { PORTAL_CTA, PORTAL_NAV, isActive, navLabel } from "./navItems";

const ICONS = { home: House, projects: Ruler, documents: FileText, calendar: CalendarDays, messages: MessageCircle, pass: ShieldCheck, trades: Hammer, plan: PencilRuler, room: Box, care: Droplet, card: CreditCard };
const focus = "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold";

// R6: Is the consent bar open? Cookies/cookiecomponent.js publishes its height
// as --ph-consent-h on <html> while it is shown and removes it afterwards. While
// it is open the mobile tab bar switches to its compact form (44 instead of
// 60 px: smaller icon, same labels, 44 px targets), so both bars together take
// as little of the phone screen as possible. The banner texts stay unchanged.
function subscribeConsentBar(callback) {
  const observer = new MutationObserver(callback);
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ["style"] });
  return () => observer.disconnect();
}
const consentBarOpen = () => Boolean(document.documentElement.style.getPropertyValue("--ph-consent-h"));
const consentBarOnServer = () => false;

function UnreadBadge({ count, className = "" }) {
  if (!count) return null;
  return (
    <span className={`rounded-full bg-ink text-center text-white ${className}`}>
      {count}
      <span className="sr-only"> ungelesen</span>
    </span>
  );
}

/** Bottom sheet with the secondary areas (mobile only). Native <dialog>: focus trap + Esc. */
function MoreSheet({ open, onClose, pathname, unread }) {
  const ref = useRef(null);
  const t = useTranslations();

  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (open && !d.open) d.showModal();
    if (!open && d.open) d.close();
  }, [open]);

  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    const handle = () => onClose();
    d.addEventListener("close", handle);
    return () => d.removeEventListener("close", handle);
  }, [onClose]);

  const items = [...PORTAL_NAV.filter((i) => !i.primary), PORTAL_CTA];

  return (
    <dialog
      ref={ref}
      aria-labelledby="portal-more-title"
      onClick={(e) => e.target === ref.current && onClose()}
      // Motion: the sheet rises from the bottom edge when it opens (transform only, 280 ms; instant when calm).
      className="fixed inset-x-0 top-auto bottom-0 m-0 max-h-[85dvh] w-full max-w-none translate-y-0 bg-white p-0 text-ink shadow-2xl transition-transform duration-(--duration-ui) ease-quiet backdrop:bg-ink-deep/50 motion-reduce:transition-none starting:open:translate-y-full md:hidden"
    >
      <div className="px-4 pt-3 pb-[calc(1rem+env(safe-area-inset-bottom))]">
        <div className="mx-auto mb-2 h-1 w-10 bg-ink/15" aria-hidden="true" />
        <div className="flex items-center justify-between">
          <h2 id="portal-more-title" className="font-display text-xl">
            {tx(t, "Portal.nav.moreTitle", "Mehr im Kundenportal")}
          </h2>
          <button type="button" onClick={onClose} className={`flex size-11 items-center justify-center hover:bg-ink/5 ${focus}`} aria-label={tx(t, "Portal.nav.closeMenu", "Menü schließen")}>
            <X size={20} aria-hidden="true" />
          </button>
        </div>
        <ul className="mt-2 divide-y divide-ink/10">
          {items.map((item) => {
            const Icon = ICONS[item.icon];
            const active = isActive(pathname, item);
            const cta = item === PORTAL_CTA;
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  onClick={onClose}
                  aria-current={active ? "page" : undefined}
                  className={`flex min-h-14 items-center gap-3 px-2 text-base ${focus} ${active ? "font-semibold" : ""} ${cta ? "text-ink" : ""}`}
                >
                  <span className={`flex size-10 shrink-0 items-center justify-center ${cta ? "bg-ink text-white" : active ? "bg-gold/20 text-ink" : "bg-bone text-ink"}`}>
                    <Icon size={19} aria-hidden="true" />
                  </span>
                  <span className="flex-1">{navLabel(t, item)}</span>
                  {item.icon === "messages" && <UnreadBadge count={unread} className="min-w-6 px-1.5 text-xs leading-6" />}
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
    </dialog>
  );
}

/**
 * Desktop (md+): one tab row with every area + "Neue Planung" button.
 * Mobile: fixed bottom bar (4 main areas + "Mehr" sheet), thumb reach,
 * safe-area aware. It sits above the site's MobileCtaBar (z-40).
 */
export default function PortalNav({ unread = 0 }) {
  const pathname = usePathname() || "";
  const t = useTranslations();
  const [moreOpen, setMoreOpen] = useState(false);
  const [lastPath, setLastPath] = useState(pathname);
  const compact = useSyncExternalStore(subscribeConsentBar, consentBarOpen, consentBarOnServer);
  if (pathname !== lastPath) {
    // Close the sheet after navigation (state adjusted during render, no effect).
    setLastPath(pathname);
    if (moreOpen) setMoreOpen(false);
  }

  if (pathname.startsWith("/de/portal/login")) return null;

  const primary = PORTAL_NAV.filter((i) => i.primary);
  const moreActive = [...PORTAL_NAV.filter((i) => !i.primary), PORTAL_CTA].some((i) => isActive(pathname, i));
  const ctaActive = isActive(pathname, PORTAL_CTA);

  return (
    <>
      <nav aria-label={tx(t, "Portal.nav.label", "Kundenportal")} className="hidden items-end justify-between gap-3 border-b border-ink/10 md:flex lg:gap-6">
        {/* Optik QA: soft right edge shows that the tabs scroll on (768–1024 px);
            pr-8 keeps the last tab clear of the fade when everything fits. */}
        <ul className="-mb-px flex min-w-0 gap-4 overflow-x-auto pr-8 [mask-image:linear-gradient(to_right,#000_calc(100%-2rem),transparent)] [scrollbar-width:none] lg:gap-8">
          {PORTAL_NAV.map((item) => {
            const active = isActive(pathname, item);
            return (
              <li key={item.href} className="shrink-0">
                <Link
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  className={`relative inline-flex min-h-11 items-center gap-2 border-b-2 py-3 text-sm tracking-wide whitespace-nowrap transition-colors duration-(--duration-micro) ease-quiet ${focus} focus-visible:-outline-offset-2 ${
                    active ? "border-gold font-semibold text-ink" : "border-transparent text-ink/75 hover:text-ink"
                  }`}
                >
                  {navLabel(t, item)}
                  {item.icon === "messages" && <UnreadBadge count={unread} className="px-1.5 text-[11px] leading-5" />}
                </Link>
              </li>
            );
          })}
        </ul>
        <Link
          href={PORTAL_CTA.href}
          aria-current={ctaActive ? "page" : undefined}
          aria-label={navLabel(t, PORTAL_CTA)}
          title={navLabel(t, PORTAL_CTA)}
          className={`mb-2 inline-flex min-h-11 min-w-11 shrink-0 items-center justify-center gap-2 px-3 text-sm font-semibold whitespace-nowrap transition-colors duration-(--duration-micro) ease-quiet ph-press lg:px-4 ${focus} ${
            ctaActive ? "bg-gold/20 text-ink ring-1 ring-gold" : "bg-ink text-white hover:bg-ink-deep"
          }`}
        >
          <PencilRuler size={16} aria-hidden="true" />
          <span className="hidden lg:inline">{navLabel(t, PORTAL_CTA)}</span>
        </Link>
      </nav>

      <nav
        aria-label={tx(t, "Portal.nav.label", "Kundenportal")}
        // A5 (R4): sits on top of the consent bar while it is open (its height comes
        // from Cookies as --ph-consent-h), so the portal bar is never covered.
        data-compact={compact ? "" : undefined}
        className="fixed inset-x-0 bottom-[var(--ph-consent-h,0px)] z-[45] border-t border-ink/10 bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden"
      >
        <ul className="grid grid-cols-5">
          {primary.map((item) => {
            const Icon = ICONS[item.icon];
            const active = isActive(pathname, item);
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  className={`relative flex ${compact ? "min-h-11 gap-0.5" : "min-h-[60px] gap-1"} flex-col items-center justify-center px-1 text-[11px] leading-tight ${focus} focus-visible:-outline-offset-2 ${
                    active ? "font-semibold text-ink" : "text-ink/75"
                  }`}
                >
                  {active && <span aria-hidden="true" className="absolute inset-x-5 top-0 h-0.5 bg-gold" />}
                  <Icon size={compact ? 18 : 22} strokeWidth={active ? 2 : 1.6} aria-hidden="true" />
                  <span className="max-w-full truncate">{navLabel(t, item)}</span>
                </Link>
              </li>
            );
          })}
          <li>
            <button
              type="button"
              onClick={() => setMoreOpen(true)}
              aria-haspopup="dialog"
              aria-expanded={moreOpen}
              className={`relative flex ${compact ? "min-h-11 gap-0.5" : "min-h-[60px] gap-1"} w-full flex-col items-center justify-center px-1 text-[11px] leading-tight ${focus} focus-visible:-outline-offset-2 ${
                moreActive ? "font-semibold text-ink" : "text-ink/75"
              }`}
            >
              {moreActive && <span aria-hidden="true" className="absolute inset-x-5 top-0 h-0.5 bg-gold" />}
              <span className="relative">
                <Menu size={compact ? 18 : 22} strokeWidth={moreActive ? 2 : 1.6} aria-hidden="true" />
                <UnreadBadge count={unread} className="absolute -top-1 -right-2 min-w-4 px-1 text-[10px] leading-4" />
              </span>
              <span>{tx(t, "Portal.nav.more", "Mehr")}</span>
            </button>
          </li>
        </ul>
      </nav>
      <MoreSheet open={moreOpen} onClose={() => setMoreOpen(false)} pathname={pathname} unread={unread} />
    </>
  );
}
