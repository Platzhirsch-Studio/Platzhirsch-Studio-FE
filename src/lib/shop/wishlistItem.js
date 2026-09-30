// Merkliste (CartContext) entry for a "Produkte New" shop product
// (buildShopProducts() shape: { id, name, brand, categoryKey, image, url_slug },
// optional `href`). Shared by the product page's "Merken" button and the
// heart on product cards, so saving from either is the same entry.
// `image`/`href` are complete paths (/cmx/…, /produkte/…) — see
// wishlistImageSrc() in CartContext. Plain module (no "use client") so the
// server-rendered product page can call it too.
import { generateSlug } from "@/lib/slugify";

export const toWishlistItem = (p) => ({
  id: p.id,
  name: p.name,
  image: p.image || null,
  category: p.brand,
  kategories: p.categoryKey,
  url_slug: p.url_slug,
  href: p.href || `/produkte/${generateSlug(p.categoryKey)}/${p.url_slug}`,
  produkte_id: p.id,
});
