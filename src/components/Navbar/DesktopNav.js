"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { usePathname } from "@/i18n/navigation";
import cx from "@/components/ui/cx";
import { useDelegatedNavigation } from "@/components/Reusable/LinkDelegate";
import { findActiveRoom } from "./navMatch";
import { megaPanelHtml } from "./megaPanelHtml";
import { useTerminContext } from "./HeaderCta";
import { withContext } from "@/lib/forms/pathContext";
import s from "./Navbar.module.css";

// Desktop main navigation (≥ 1280 px) with "Raum zuerst" mega menus.
// Disclosure pattern (button + aria-expanded/aria-controls, no role="menu"),
// Design-Bibel §9 / W13: opens after 300 ms hover or at once on click, moves
// straight to a neighbour when one is already open, closes 400 ms after the
// pointer leaves, on Esc (focus back to its button), when focus leaves the
// navigation, after a link click and on every route change.
// The panel frames are in the server HTML (hidden); their links follow on open.
// R4-shell-perf: the panel links are plain <a href="/de/…"> with ONE
// delegated client navigation on the <nav> (Reusable/LinkDelegate.js) instead
// of ~70 hydrated <Link> components in panels that are closed at load.
// R6-shell-perf: the panel contents arrive as ready HTML (room.html, built on
// the server by megaPanelHtml.js) – same markup, but React no longer creates,
// ships and hydrates ~270 elements per page that phones never display.
// aria-current is set on the panel links from data-nav-path (below).
// R4 technik P1-2 (RSC payload): the panel HTML is no longer a prop. The
// island gets slim data (labels, hrefs) and builds the SAME markup with
// megaPanelHtml() when a panel opens for the first time (cached per room), so
// the ≈ 77 KB of panel HTML + escaped RSC copy left every page. The links are
// in the footer and the mobile menu as well; crawlers keep them there.
const OPEN_DELAY = 300;
const CLOSE_DELAY = 400;

export default function DesktopNav({ rooms, label, locale = "de" }) {
  const pathname = usePathname();
  const nav = useDelegatedNavigation();
  // The open panel belongs to the route it was opened on: a route change
  // closes it without an effect.
  const [state, setState] = useState({ id: null, path: pathname });
  const open = state.path === pathname ? state.id : null;
  const setOpen = useCallback((id) => setState({ id, path: pathname }), [pathname]);
  const navRef = useRef(null);
  const openTimer = useRef(0);
  const closeTimer = useRef(0);
  // Id of the panel the mouse opened by hovering (r3-ux P1-1). The click that
  // usually follows the hover must not close it again: the first mouse click
  // on a hover-opened trigger keeps the panel open, a second one closes it.
  // Keyboard clicks (Enter/Space, event.detail === 0) always toggle.
  const hoverOpened = useRef(null);
  const activeId = findActiveRoom(rooms, pathname);
  // "Beratung & Termin" (data-termin-link) keeps the page context (R5 ux P2).
  const terminCtx = useTerminContext();
  const terminKey = withContext("", terminCtx);
  // Panel HTML, built once per room on its first open.
  const htmlCache = useRef({});
  const panelHtml = (room) => (htmlCache.current[room.id] ??= megaPanelHtml(room, locale));
  // Below 1440 px "Planen & Erleben" shows as "Planen" (room.navShort). Font
  // size and padding follow the measured fit (navFit.js); when even the
  // densest level does not fit (WCAG 1.4.12 text spacing) the header switches
  // to the menu button (tests/e2e/labs-hub.spec.js).

  const clearTimers = () => {
    clearTimeout(openTimer.current);
    clearTimeout(closeTimer.current);
  };
  const openRef = useRef(null);
  useEffect(() => {
    openRef.current = open;
  }, [open]);
  const close = useCallback((focusTrigger) => {
    clearTimers();
    const current = openRef.current;
    hoverOpened.current = null;
    setOpen(null);
    if (focusTrigger && current) document.getElementById(`ph-nav-trigger-${current}`)?.focus();
  }, [setOpen]);

  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => {
      if (e.key === "Escape") close(true);
    };
    const onPointerDown = (e) => {
      if (navRef.current && !navRef.current.contains(e.target)) close(false);
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("pointerdown", onPointerDown);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("pointerdown", onPointerDown);
    };
  }, [open, close]);

  useEffect(() => clearTimers, []);

  // aria-current="page" on the panel link of this route (exact match, like
  // navMatch.isCurrent). The panels are static HTML, so the mark is set here –
  // after hydration and again on every client-side route change.
  useEffect(() => {
    const path = (pathname || "/").replace(/\/+$/, "") || "/";
    navRef.current?.querySelectorAll("a[data-nav-path]").forEach((a) => {
      if (a.dataset.navPath === path) a.setAttribute("aria-current", "page");
      else a.removeAttribute("aria-current");
    });
  }, [pathname, open]);

  useEffect(() => {
    navRef.current?.querySelectorAll("a[data-termin-link]").forEach((a) => {
      a.dataset.terminBase ??= a.getAttribute("href") || "";
      a.setAttribute("href", `${a.dataset.terminBase}${terminKey}`);
    });
  }, [terminKey, open]);

  const hoverOpen = (id, e) => {
    if (e.pointerType !== "mouse") return; // touch/pen: click decides
    clearTimers();
    if (open === id) return;
    const openByHover = () => {
      hoverOpened.current = id;
      setOpen(id);
    };
    if (open) openByHover();
    else openTimer.current = setTimeout(openByHover, OPEN_DELAY);
  };
  const scheduleClose = (e) => {
    if (e.pointerType !== "mouse") return;
    clearTimeout(openTimer.current);
    closeTimer.current = setTimeout(() => setOpen(null), CLOSE_DELAY);
  };
  const keepOpen = (e) => {
    if (e.pointerType === "mouse") clearTimeout(closeTimer.current);
  };

  return (
    <nav
      ref={navRef}
      aria-label={label}
      className="hidden h-full xl:block"
      onPointerLeave={scheduleClose}
      onPointerEnter={keepOpen}
      onClick={nav.onClick}
      onPointerOver={nav.onPointerOver}
      onFocus={nav.onFocus}
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget)) close(false);
      }}
    >
      <ul className="flex h-full items-stretch">
        {rooms.map((room) => {
          const expanded = open === room.id;
          return (
            <li key={room.id} className="flex">
              <button
                type="button"
                id={`ph-nav-trigger-${room.id}`}
                aria-expanded={expanded}
                aria-controls={`ph-nav-panel-${room.id}`}
                data-active={activeId === room.id ? "true" : undefined}
                onPointerEnter={(e) => hoverOpen(room.id, e)}
                onClick={(e) => {
                  clearTimers();
                  const keepHoverOpen = expanded && e.detail !== 0 && hoverOpened.current === room.id;
                  hoverOpened.current = null;
                  if (keepHoverOpen) return;
                  setOpen(expanded ? null : room.id);
                }}
                className={cx(
                  s.trigger,
                  // Font size and padding ≥ 1280 px: measured density
                  // (navFit.js → header data-nav, Navbar.module.css .trigger).
                  "flex h-full items-center text-ui whitespace-nowrap text-text transition-colors duration-(--duration-micro)"
                )}
              >
                {room.navShort && room.label.startsWith(room.navShort) ? (
                  // QA P3-4 (WCAG 1.4.12): below 1440 px only the short form is
                  // visible; the rest stays in the accessible name (2.5.3).
                  <>
                    {room.navShort}
                    {/* The trigger is a flex container, which drops the leading
                        space of this flex item ("Planen& Erleben"): keep it as NBSP. */}
                    <span className="sr-only min-[1440px]:not-sr-only">{room.label.slice(room.navShort.length).replace(/^ /, " ")}</span>
                  </>
                ) : (
                  room.label
                )}
              </button>

              <div
                id={`ph-nav-panel-${room.id}`}
                hidden={!expanded}
                onClick={(e) => {
                  if (e.target.closest("a")) close(false);
                }}
                className={cx(
                  s.panel,
                  "absolute inset-x-0 top-full max-h-[calc(100svh-var(--header-h))] overflow-y-auto border-t border-line bg-surface shadow-overlay"
                )}
              >
                {/* The panel surface is opaque at once; only this inner layer
                    fades and lifts (Navbar.module.css .panelInner). Contents:
                    megaPanelHtml() on open, see above. */}
                {expanded && (
                  <div
                    className={cx(s.panelInner, "mx-auto grid max-w-page grid-cols-12 gap-grid px-gutter pt-12 pb-14")}
                    dangerouslySetInnerHTML={{ __html: panelHtml(room) }}
                  />
                )}
              </div>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
