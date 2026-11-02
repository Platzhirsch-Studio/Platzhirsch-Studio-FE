"use client";

import { useCallback, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

// Client-side navigation for MANY plain links with ONE listener (R4-shell-perf).
// The footer (61 links in DE) and the hidden desktop mega panels rendered one
// next-intl <Link> client component per link – each hydrated with its own
// hooks and prefetch observer, on every page, for links nobody sees at load.
// They are now plain <a href="/de/…"> (crawlable, work without JS); this
// delegate turns a normal left click on an internal, same-locale link into a
// router.push() and prefetches on hover/focus, so navigation stays as fast as
// with <Link>. Modifier clicks, new tabs, downloads, other origins, language
// switches (hreflang) and pure #hash links keep the browser default.
const LOCALE_PATH = /^\/(de|en|fr|it)(\/|$)/;

function internalUrl(anchor) {
  if (!anchor || anchor.hasAttribute("download") || anchor.hasAttribute("hreflang")) return null;
  if (anchor.target && anchor.target !== "_self") return null;
  let url;
  try {
    url = new URL(anchor.href, window.location.href);
  } catch {
    return null;
  }
  if (url.origin !== window.location.origin || !LOCALE_PATH.test(url.pathname)) return null;
  // Same page, only a hash: let the browser scroll.
  if (url.pathname === window.location.pathname && url.search === window.location.search && url.hash) return null;
  return url;
}

/** onClick / onPointerOver / onFocus handlers for a container of plain links. */
export function useDelegatedNavigation() {
  const router = useRouter();
  // QM wm-fix4 (React "state update on a component that hasn't mounted yet",
  // with "Router action dispatched before initialization"): React replays
  // pointerover/focus during hydration, so a resting mouse pointer or a
  // restored focus reached router.prefetch() before the App Router had
  // committed – the try/catch below hid the throw, not React's warning.
  // The delegate now acts only once the whole tree has committed (a task
  // after the effects); until then links behave as plain links.
  const ready = useRef(false);
  useEffect(() => {
    const id = setTimeout(() => {
      ready.current = true;
    }, 0);
    return () => clearTimeout(id);
  }, []);
  const onClick = useCallback(
    (e) => {
      if (!ready.current) return;
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const anchor = e.target instanceof Element ? e.target.closest("a[href]") : null;
      if (!anchor || !e.currentTarget.contains(anchor)) return;
      const url = internalUrl(anchor);
      if (!url) return;
      // QM r2 (WebKit, /fr): a tap during hydration reached the router before
      // it was initialised ("Router action dispatched before initialization").
      // Then the browser simply follows the link (no preventDefault).
      try {
        router.push(`${url.pathname}${url.search}${url.hash}`);
      } catch {
        return;
      }
      e.preventDefault();
    },
    [router]
  );
  const prefetch = useCallback(
    (e) => {
      if (!ready.current) return;
      const anchor = e.target instanceof Element ? e.target.closest("a[href]") : null;
      if (!anchor || anchor.dataset.prefetched) return;
      const url = internalUrl(anchor);
      if (!url) return;
      // Hover/focus before the router is initialised (early touch, replayed
      // focus during hydration): skip silently, the next hover retries.
      try {
        router.prefetch(`${url.pathname}${url.search}`);
        anchor.dataset.prefetched = "1";
      } catch {
        /* router not ready yet */
      }
    },
    [router]
  );
  return { onClick, onPointerOver: prefetch, onFocus: prefetch };
}

/** Wrapper element (default <div>) that delegates navigation for its links. */
export default function LinkDelegate({ as: Tag = "div", children, ...rest }) {
  const handlers = useDelegatedNavigation();
  return (
    <Tag {...rest} {...handlers}>
      {children}
    </Tag>
  );
}
