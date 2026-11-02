'use client';

import dynamic from 'next/dynamic';
import { CartProvider } from '@/context/CartContext';
import { listenForContactClicks } from '@/lib/analytics';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
// Runde 4 (P2 Sprache, gesamtwerk P1-1): Hinweis „nur auf Deutsch“ in der
// Besuchersprache auf deutschen Seiten mit ?lang=en|fr|it. Statisch (nicht
// next/dynamic): er muss im Server-HTML stehen, sonst gäbe es einen Layout-Sprung.
import GermanOnlyNotice from '@/components/I18n/GermanOnlyNotice';

// Page shell (Design-Bibel §14): exactly one <header>, one <main id="main">
// and one <footer> at the top level, in that order, with the skip link (in
// Navbar) as the first focusable element. The header is sticky and in the
// flow, so pages need no top offset for it. Footer, CTA bar and consent bar
// sit OUTSIDE <main> so <main> holds page content only.
// Browser scroll restoration is left on (a former `scrollRestoration = "manual"`
// + scrollTo(0,0) made Back land at the top of every catalogue page).
// The event popup (Home/vernissagePopup.js) was removed from the shell: its
// last show date (2026-09-04) has passed, so it only cost bundle size — mount
// it again here for the next event.
//
// R4-shell-perf: Navbar and Footer are rendered as Server Components in
// layout.js and arrive here as the `header` / `footer` slots. This file keeps
// only the providers, the route switch for the slim shell, the CTA bar, the
// consent bar and the analytics hook – the header/footer code (link tables,
// copy, site data) no longer ships to the browser. The mobile CTA bar comes
// with the footer slot (Footer.js renders it right after <footer>).
//
// next/dynamic (lazy-loading guide):
// - CookieComponent with ssr:false – it renders nothing on the server anyway
//   (no cookie there), so the HTML is unchanged; its code (banner, dialog,
//   service register, Google tag loader) leaves the hydration path and loads
//   right after it.
// - BareShell only on /<locale>/upload/** – SSR on, so the slim shell is still
//   in the first HTML byte there; every other page skips its chunk.
//   QM R4-shell-perf P2-3: the chunk request starts when this module is
//   evaluated in the browser (before hydration renders), not only when
//   React reaches <CookieComponent/> – download runs in parallel with
//   hydration, so the bar shows right after it instead of one round trip
//   later. Same module for next/dynamic: the bundler loads a chunk once, so
//   the early call only moves the download forward (R5-shell-seo: written as
//   two plain import() calls, the form tests/unit/r4-shell.test.mjs pins).
// Not on the slim upload shell, which never shows the bar.
if (typeof window !== 'undefined' && window.location.pathname.split('/')[2] !== 'upload') {
  import('@/components/Cookies/cookiecomponent').catch(() => {});
}
const CookieComponent = dynamic(() => import('@/components/Cookies/cookiecomponent'), { ssr: false });
const BareShell = dynamic(() => import('@/components/Reusable/BareShell'));
// KI-Concierge seitenweit (Marktresearch/digital/features/concierge-sitewide.md):
// launcher in its own small chunk, mounted after idle like the consent bar. The
// flag is written out INLINE (NEXT_PUBLIC_* is inlined at build time). Default
// ON everywhere (Inhaber-Entscheidung Nr. 9); "0" switches it off, then the
// condition is constant false and the import() is never requested.
// Never on the slim upload shell (that branch returns early below).
const ConciergeLauncher =
  process.env.NEXT_PUBLIC_CONCIERGE_SITEWIDE !== '0'
    ? dynamic(() => import('@/components/Concierge/Launcher'), { ssr: false })
    : null;
// N3 WebMCP (neuland.md §4.6): registers the read-only tools for browser agents
// after idle, only where the browser has the API; renders nothing.
const WebMcpTools = dynamic(() => import('@/components/Agent/WebMcpTools'), { ssr: false });
// Besucher-Einblicke (Marktresearch/digital/features/besucher-einblicke.md):
// Lader in eigenem Mini-Chunk, nach Leerlauf wie die Consent-Leiste. Er lädt
// den Sammler NUR mit Statistik-Einwilligung, ohne DNT/GPC und nicht auf
// Portal/Upload/Zahlung/Vorschau. Schalter NEXT_PUBLIC_EINBLICKE wörtlich
// (beim Build eingesetzt, Regel wie src/lib/einblicke/config.js einblickeOn):
// "1" an, "0" aus, nicht gesetzt = nur im Dev an. Produktion bleibt aus, bis
// die Kanzlei die Kopplung an „Statistik" freigibt.
const EinblickeLoader =
  process.env.NEXT_PUBLIC_EINBLICKE === '1' ||
  (process.env.NEXT_PUBLIC_EINBLICKE !== '0' && process.env.NODE_ENV !== 'production')
    ? dynamic(() => import('@/components/Einblicke/EinblickeLoader'), { ssr: false })
    : null;

// Routes that get the slim shell (logo + "Zurück", no menu, footer, CTA bar
// or consent bar): the upload page behind the QR code is one task on a phone
// (handy-upload.md, R3-shell). /<locale>/upload and everything below it.
const BARE_ROUTES = ['upload'];

// R6-shell-perf (TBT): the consent bar mounts in its own task once the main
// thread is idle after hydration (requestIdleCallback, at the latest after
// 1.5 s; setTimeout where rIC is missing, e.g. Safari < 18). Before, its
// render, the layout of the bar and the full style recalculation caused by
// --ph-consent-h on <html> could run straight on from the hydration work and
// lengthen that long task. The chunk download still starts early (above), so
// the bar shows as soon as the page has settled. Same component, texts,
// button names, cookie name and format.
// Wow restpunkt 3 (qa-screenshots/wow/abnahme.md): on a page with the Wow
// stage, the consent bar (and the other idle islands) wait until the stage is
// at rest ("ph:wow-done", window.phWowDone – WowControls.js), at the latest
// WOW_WAIT_MS. Same behaviour on every device; without a stage nothing changes.
// F5 (Runde 1, Auftrag 4): 9 000 → 300 ms after mount (prod /de: 1 000 ms → bar 1 464–1 513 ms after load, 600 ms → 1 448–1 466 ms; the consent chunk itself arrives ≈ 950 ms after navigation). The Wow sequence takes about
// 2.5 s plus the invite, so on /de the consent bar came 4.0 s after load
// (prod-timing.json, 28.10.2026) – the release gate is ≤ 1.5 s
// (tests/e2e/r4-shell-prod.spec.js). The bar is the consent decision and must
// not wait for a show; when the stage comes to rest earlier (reduced motion,
// seen in this session, skip) the bar still comes at once. Conflict with Wow
// Restpunkt 3 (qa-screenshots/wow/abnahme.md) documented in release-check.md F5.
const WOW_WAIT_MS = 300;
function useAfterIdle(timeout = 1500) {
  const [ready, setReadyState] = useState(false);
  useEffect(() => {
    let cancelled = false;
    let wowTimer = 0;
    const done = () => {
      if (!cancelled) setReadyState(true);
    };
    const onWowDone = () => {
      window.clearTimeout(wowTimer);
      done();
    };
    // After idle: ready at once, or – with a Wow stage still playing – on
    // "ph:wow-done" (at the latest WOW_WAIT_MS).
    const setReady = () => {
      if (document.querySelector('[data-wow-stage]') && !window.phWowDone) {
        window.addEventListener('ph:wow-done', onWowDone, { once: true });
        return;
      }
      done();
    };
    // F5: on a Wow page the bar comes at the latest WOW_WAIT_MS after mount
    // (hydration), not after idle + wait – idle itself can take up to
    // `timeout` while the stage animates (measured 1 952 ms after load).
    if (document.querySelector('[data-wow-stage]') && !window.phWowDone) {
      wowTimer = window.setTimeout(onWowDone, WOW_WAIT_MS);
    }
    let cleanupIdle;
    if (typeof window.requestIdleCallback === 'function') {
      const id = window.requestIdleCallback(() => setReady(true), { timeout });
      cleanupIdle = () => window.cancelIdleCallback(id);
    } else {
      const id = window.setTimeout(() => setReady(true), 200);
      cleanupIdle = () => window.clearTimeout(id);
    }
    return () => {
      cancelled = true;
      cleanupIdle();
      window.clearTimeout(wowTimer);
      window.removeEventListener('ph:wow-done', onWowDone);
    };
  }, [timeout]);
  return ready;
}

export default function ClientLayout({ children, header = null, footer = null }) {
  // Phone / e-mail / WhatsApp clicks count as contact conversions (lib/analytics).
  useEffect(() => listenForContactClicks(), []);
  const consentReady = useAfterIdle();
  // usePathname works in the server render of this client component too, so
  // the slim shell is in the HTML from the first byte (no flash of the menu).
  const pathname = usePathname() || '';
  // Only the page behind the QR code (/<locale>/upload/<token>); the service
  // page /<locale>/upload itself (former /labs/upload-demo) keeps the full shell.
  const segments = pathname.split('/');
  const bare = BARE_ROUTES.includes(segments[2]) && Boolean(segments[3]);

  if (bare) {
    return (
      <CartProvider>
        <BareShell>{children}</BareShell>
      </CartProvider>
    );
  }

  return (
    <CartProvider>
      {header}
      {/* overflow-x-clip: entrance transforms (.reveal) must never widen the
          mobile layout viewport; clip (not hidden) keeps sticky/anchor behaviour. */}
      <main id="main" tabIndex={-1} className="overflow-x-clip focus:shadow-none focus:outline-none">
        <GermanOnlyNotice />
        {children}
      </main>
      {footer}
      {consentReady && <CookieComponent />}
      {consentReady && ConciergeLauncher && <ConciergeLauncher locale={pathname.split('/')[1] || 'de'} />}
      {consentReady && <WebMcpTools />}
      {consentReady && EinblickeLoader && <EinblickeLoader />}
    </CartProvider>
  );
}
