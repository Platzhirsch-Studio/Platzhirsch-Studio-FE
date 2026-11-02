// Runs ONE confirmed proposal (the visitor clicked "Ausführen"). Checks it
// again with the same whitelist as the server (lib/concierge/actionKinds.js),
// builds paths only through buildHref(), stays on this origin. Never submits
// a form, never assigns model text to location, no innerHTML, no eval.
import { checkAction } from "@/lib/concierge/actionKinds";
import { toWishlistItem } from "@/lib/shop/wishlistItem";

const reduced = () =>
  window.matchMedia("(prefers-reduced-motion: reduce)").matches || document.documentElement.dataset.motion === "reduced";

export const wishlistItemsOf = (items) =>
  items.map((it) =>
    toWishlistItem({
      id: it.id,
      name: it.name,
      brand: it.brand,
      categoryKey: it.categoryKey || it.categorySlug,
      url_slug: it.urlSlug,
      image: it.image,
      href: `/produkte/${it.categorySlug}/${it.urlSlug}`,
    })
  );

function scrollToSection(id) {
  const esc = window.CSS?.escape ? CSS.escape(id) : id;
  const el = document.querySelector(`main [data-concierge-section="${esc}"]`) || document.getElementById(id);
  if (!el || !document.querySelector("main")?.contains(el)) return false;
  el.scrollIntoView({ block: "start", behavior: reduced() ? "auto" : "smooth" });
  const heading = /^H[1-6]$/.test(el.tagName) ? el : el.querySelector("h2,h3") || el;
  if (!heading.hasAttribute("tabindex")) heading.setAttribute("tabindex", "-1");
  heading.focus({ preventScroll: true });
  return true;
}

/**
 * @returns {{ ok: boolean, navigated?: boolean, reload?: boolean, error?: string }}
 * deps: { locale, router, cart: { addManyToCart }, beforeNavigate(), beforeScroll() }
 */
export async function executeAction(action, deps) {
  const check = checkAction(action, { locale: deps.locale, origin: location.origin });
  if (!check.ok) return { ok: false, error: check.error };

  switch (action.kind) {
    case "save_to_selection":
      deps.cart.addManyToCart(wishlistItemsOf(action.params.items));
      return { ok: true };
    case "scroll_to_section": {
      await deps.beforeScroll?.();
      return scrollToSection(action.params.sectionId) ? { ok: true } : { ok: false, error: "section" };
    }
    default: {
      const url = new URL(check.href, location.origin);
      const href = url.pathname + url.search + url.hash;
      if (url.pathname === location.pathname && url.search === location.search) {
        // Already there (only the anchor differs): jump to it, no page load.
        if (url.hash) {
          const el = document.getElementById(decodeURIComponent(url.hash.slice(1)));
          el?.scrollIntoView({ block: "start", behavior: reduced() ? "auto" : "smooth" });
        }
        return { ok: true };
      }
      if (url.pathname === location.pathname) {
        // Same page, other query (e.g. a new catalogue filter): ShopCatalog
        // reads the query on load, so a real page load applies it reliably.
        deps.beforeReload?.(href);
        location.assign(href);
        return { ok: true, reload: true };
      }
      deps.beforeNavigate?.(href);
      deps.router.push(href);
      return { ok: true, navigated: true };
    }
  }
}
